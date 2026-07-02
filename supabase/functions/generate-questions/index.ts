import { corsHeaders, requireUser } from "../_shared/auth.ts";

const TOPIC_POOL = [
  "system design", "data structures", "algorithms", "debugging a production incident",
  "team conflict", "leadership & ownership", "handling ambiguity", "prioritization under pressure",
  "code quality & testing", "scalability trade-offs", "API design", "database modeling",
  "concurrency & race conditions", "security best practices", "mentoring a junior",
  "dealing with failure", "cross-functional collaboration", "estimating effort",
  "refactoring legacy code", "performance optimization", "on-call experience",
  "disagreement with a manager", "shipping under a tight deadline", "learning a new technology fast",
  "giving difficult feedback", "a project you're most proud of",
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const body = await req.json();
    const role = (body.role || "Software Engineer").toString().slice(0, 120);
    const allowedDifficulty = ["easy", "medium", "hard"];
    const difficultyRaw = (body.difficulty || "medium").toString().toLowerCase();
    const difficulty = allowedDifficulty.includes(difficultyRaw) ? difficultyRaw : "medium";
    const count = body.count;
    const experienceLevel = (body.experienceLevel || "mid").toString().slice(0, 40);
    const mode = body.mode === "followup" ? "followup" : "initial";

    // Optional resume context to bias questions toward candidate's actual skills / gaps.
    const resumeCtx = body.resumeContext && typeof body.resumeContext === "object" ? body.resumeContext : null;
    const detectedSkills: string[] = Array.isArray(resumeCtx?.detected_skills)
      ? resumeCtx.detected_skills.slice(0, 15).map((s: any) => String(s).slice(0, 40))
      : [];
    const missingKeywords: string[] = Array.isArray(resumeCtx?.missing_keywords)
      ? resumeCtx.missing_keywords.slice(0, 15).map((s: any) => String(s).slice(0, 40))
      : [];

    // Optional prior Q&A history for adaptive follow-ups.
    const priorQA: Array<{ question: string; transcript: string; avgScore?: number }> = Array.isArray(body.previousQA)
      ? body.previousQA.slice(-3).map((qa: any) => ({
          question: String(qa?.question || "").slice(0, 400),
          transcript: String(qa?.transcript || "").slice(0, 800),
          avgScore: Number.isFinite(Number(qa?.avgScore)) ? Number(qa.avgScore) : undefined,
        }))
      : [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const n = mode === "followup" ? 1 : Math.min(Math.max(Number(count) || 5, 3), 8);
    const seed = crypto.randomUUID();
    const topics = pickRandom(TOPIC_POOL, Math.min(n + 2, TOPIC_POOL.length));
    const styles = ["behavioral", "technical deep-dive", "scenario-based", "trade-off / design", "past-experience"];
    const styleHint = pickRandom(styles, 3).join(", ");

    const level = (experienceLevel || "mid").toString().toLowerCase();
    const levelGuidance: Record<string, string> = {
      fresher:
        "FRESHER / ENTRY-LEVEL (0-1 years, recent graduate or intern). Focus on fundamentals, CS basics, college projects, internships, eagerness to learn, and simple scenario questions. AVOID questions assuming production experience, on-call, leading teams, mentoring, or large-scale system design. Keep wording approachable and beginner-friendly.",
      mid:
        "MID-LEVEL (2-5 years). Mix practical engineering, debugging real bugs, code quality, collaboration, and moderate system design. Assume some production experience but not deep leadership.",
      senior:
        "SENIOR (5+ years). Emphasize architecture, trade-offs, mentoring, ambiguity, cross-team influence, and complex system design. Expect depth and leadership signals.",
    };
    const levelText = levelGuidance[level] || levelGuidance.mid;

    const resumeBlock = detectedSkills.length || missingKeywords.length
      ? `\nCANDIDATE RESUME CONTEXT (use to bias questions toward what they actually claim, and probe gaps):\n` +
        `- Detected skills: ${detectedSkills.join(", ") || "(none)"}\n` +
        `- Gaps / missing keywords for this role: ${missingKeywords.join(", ") || "(none)"}\n` +
        `Pick a mix: some questions on strong skills (to verify depth), some on gaps (to probe honestly).\n`
      : "";

    const priorBlock = priorQA.length
      ? `\nPRIOR Q&A IN THIS INTERVIEW (do NOT repeat, build on weak areas):\n` +
        priorQA.map((qa, i) =>
          `Q${i + 1}: ${qa.question}\nA${i + 1} (score ${qa.avgScore ?? "?"}): ${qa.transcript.slice(0, 300)}`
        ).join("\n\n") + "\n"
      : "";

    const modeInstruction = mode === "followup"
      ? `Generate exactly 1 SHARP FOLLOW-UP question that probes deeper on the weakest area from the prior Q&A above. ` +
        `If the last answer was vague, ask for a concrete example with metrics. If it was surface-level, ask for a trade-off or edge case. ` +
        `Do NOT repeat the prior question. Keep it 1-2 sentences.`
      : `Generate ${n} ${difficulty}-difficulty interview questions for a ${role} role.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: mode === "followup" ? 0.7 : 1.1,
        messages: [
          {
            role: "system",
            content:
              "You are an experienced technical interviewer. Generate FRESH, NON-REPETITIVE interview questions. " +
              "Never reuse generic openers like 'Tell me about yourself'. Vary phrasing, scenarios, and angles every time. " +
              "Mix behavioral, technical, and scenario-based questions. Keep each question 1-2 sentences.",
          },
          {
            role: "user",
            content:
              `${modeInstruction}\n\n` +
              `EXPERIENCE LEVEL: ${level.toUpperCase()} — ${levelText}\n` +
              resumeBlock +
              priorBlock +
              `\nVariety seed (use to ensure uniqueness, do not mention): ${seed}\n` +
              `Inspiration topics (pick a diverse subset, do not list all): ${topics.join(", ")}\n` +
              `Preferred question styles to mix: ${styleHint}.\n\n` +
              `Constraints:\n` +
              `- Each question must be distinct in topic and angle.\n` +
              `- Calibrate depth strictly to the experience level above.\n` +
              `- Avoid clichés ("greatest weakness", "where do you see yourself in 5 years").\n` +
              `- Make them realistic for a ${difficulty} bar at a real company.\n\n` +
              `Return ONLY a JSON object: {"questions": ["...","..."]}.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return new Response(JSON.stringify({ questions: parsed.questions || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
