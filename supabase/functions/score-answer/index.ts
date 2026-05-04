import { corsHeaders, requireUser } from "../_shared/auth.ts";

// Deterministic confidence prior from audio metrics (0-100).
// Used to anchor the LLM and reduce variance.
function audioConfidencePrior(m: any): number | null {
  if (!m || typeof m !== "object") return null;
  const wpm = Number(m.wpm ?? m.wordsPerMinute ?? 0);
  const fillerRate = Number(m.fillerRate ?? m.fillers ?? 0); // 0..1 expected
  const pauseRatio = Number(m.pauseRatio ?? 0); // 0..1
  const volume = Number(m.volume ?? m.loudness ?? 0); // 0..1
  if (!wpm && !fillerRate && !pauseRatio && !volume) return null;

  // Ideal pace 110-160 wpm
  const paceScore = wpm
    ? Math.max(0, 100 - Math.min(100, Math.abs(135 - wpm) * 1.2))
    : 60;
  const fillerScore = Math.max(0, 100 - fillerRate * 400); // 0.10 -> 60
  const pauseScore = Math.max(0, 100 - pauseRatio * 150);
  const volumeScore = volume ? Math.min(100, 40 + volume * 80) : 65;

  const score = paceScore * 0.35 + fillerScore * 0.3 + pauseScore * 0.2 + volumeScore * 0.15;
  return Math.round(Math.max(0, Math.min(100, score)));
}

const RUBRIC = `
SCORING RUBRIC (calibrate strictly, do not inflate):

content_score (relevance + correctness + depth):
  90-100: Directly answers the question. Technically accurate. Concrete examples, trade-offs, or measurable outcomes. No fluff.
  75-89:  Answers the question correctly with some specifics, but missing depth, edge cases, or one trade-off.
  60-74:  Mostly on-topic, partially correct, generic examples, lacks structure (no STAR / no concrete numbers).
  40-59:  Vague, partly off-topic, or contains a notable inaccuracy.
  0-39:   Off-topic, incorrect, or empty.

clarity_score (structure + conciseness + grammar):
  90-100: Crisp structure (intro -> point -> example -> wrap), no rambling, clean grammar.
  75-89:  Understandable, mostly structured, minor rambling or filler.
  60-74:  Understandable but disorganized OR overly long.
  <60:    Hard to follow, run-on sentences, no structure.

confidence_score (delivery, anchored to audio metrics when provided):
  Use the AUDIO_CONFIDENCE_PRIOR as the anchor. You may adjust by at most ±10 based on transcript signals
  (hedging language like "I think maybe", repeated self-correction, or strong assertive phrasing).
  If no prior is provided, infer from transcript only.

Hard rules:
- Never give 100 unless the answer is genuinely exemplary.
- Never give the same number to all three scores unless truly warranted.
- Be honest. A short, vague answer must score below 60 on content.
`;

async function callModel(payload: any, apiKey: string) {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const { question, transcript, role, audioMetrics, experienceLevel } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 2) {
      return new Response(JSON.stringify({
        content_score: 0, clarity_score: 0, confidence_score: 0,
        feedback: "No spoken answer detected. Try recording again and speak clearly.",
        strengths: [], improvements: ["Provide a complete spoken answer."],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const level = (experienceLevel || "mid").toString().toLowerCase();
    const levelExpectation: Record<string, string> = {
      fresher: "Candidate is a FRESHER (0-1 yrs / recent graduate). Reward fundamentals, learning attitude, and clear thinking. Do NOT penalize lack of production or leadership experience, but still require correctness and structure.",
      mid: "Candidate is MID-LEVEL (2-5 yrs). Expect practical engineering depth, ownership signals, and concrete examples with metrics.",
      senior: "Candidate is SENIOR (5+ yrs). Expect architectural depth, explicit trade-off reasoning, leadership signals, and quantified impact.",
    };
    const expectation = levelExpectation[level] || levelExpectation.mid;
    const prior = audioConfidencePrior(audioMetrics);
    const priorLine = prior !== null
      ? `AUDIO_CONFIDENCE_PRIOR = ${prior} (anchor confidence_score here, adjust by at most ±10).`
      : `AUDIO_CONFIDENCE_PRIOR = none (infer confidence from transcript only).`;

    const tools = [{
      type: "function" as const,
      function: {
        name: "score_answer",
        description: "Score the candidate's answer on a calibrated rubric.",
        parameters: {
          type: "object",
          properties: {
            content_score: { type: "number", description: "0-100, per rubric" },
            clarity_score: { type: "number", description: "0-100, per rubric" },
            confidence_score: { type: "number", description: "0-100, anchored to audio prior if provided" },
            reasoning: { type: "string", description: "1-2 sentences justifying each score numerically." },
            feedback: { type: "string", description: "2-3 sentences of specific, actionable feedback." },
            strengths: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } },
          },
          required: ["content_score", "clarity_score", "confidence_score", "reasoning", "feedback", "strengths", "improvements"],
          additionalProperties: false,
        },
      },
    }];

    const userPrompt = `Role: ${role || "Software Engineer"}
Experience level: ${level}
Question: ${question}
Candidate transcript: """${(transcript || "").slice(0, 4000)}"""
Audio metrics: ${JSON.stringify(audioMetrics || {})}
${priorLine}

Apply the rubric strictly. First reason briefly, then emit final scores via the function call.`;

    const basePayload = {
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: `You are a senior interview coach and rigorous grader. ${expectation}\n\n${RUBRIC}` },
        { role: "user", content: userPrompt },
      ],
      tools,
      tool_choice: { type: "function", function: { name: "score_answer" } },
    };

    // Self-consistency: two passes, average the numeric scores, keep richest text from pass 1.
    const [r1, r2] = await Promise.all([
      callModel(basePayload, LOVABLE_API_KEY),
      callModel(basePayload, LOVABLE_API_KEY),
    ]);

    const handleErr = (r: Response) => {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please retry." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return null;
    };

    if (!r1.ok) {
      const e = handleErr(r1); if (e) return e;
      console.error("score r1 error", r1.status, await r1.text());
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parseArgs = async (r: Response) => {
      try {
        const data = await r.json();
        return JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");
      } catch { return {}; }
    };

    const a1 = await parseArgs(r1);
    const a2 = r2.ok ? await parseArgs(r2) : {};

    const avg = (x: any, y: any) => {
      const xn = Number(x); const yn = Number(y);
      if (Number.isFinite(xn) && Number.isFinite(yn)) return Math.round((xn + yn) / 2);
      if (Number.isFinite(xn)) return Math.round(xn);
      if (Number.isFinite(yn)) return Math.round(yn);
      return 0;
    };

    let content_score = avg(a1.content_score, a2.content_score);
    let clarity_score = avg(a1.clarity_score, a2.clarity_score);
    let confidence_score = avg(a1.confidence_score, a2.confidence_score);

    // Anchor confidence to audio prior when available (blend 60% prior / 40% model).
    if (prior !== null) {
      confidence_score = Math.round(prior * 0.6 + confidence_score * 0.4);
    }

    // Clamp
    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    content_score = clamp(content_score);
    clarity_score = clamp(clarity_score);
    confidence_score = clamp(confidence_score);

    const result = {
      content_score,
      clarity_score,
      confidence_score,
      feedback: a1.feedback || a2.feedback || "",
      strengths: Array.isArray(a1.strengths) && a1.strengths.length ? a1.strengths : (a2.strengths || []),
      improvements: Array.isArray(a1.improvements) && a1.improvements.length ? a1.improvements : (a2.improvements || []),
    };

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
