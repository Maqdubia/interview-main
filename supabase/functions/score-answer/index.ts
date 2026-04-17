const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { question, transcript, role, audioMetrics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 2) {
      return new Response(JSON.stringify({
        content_score: 0, clarity_score: 0, confidence_score: 0,
        feedback: "No spoken answer detected. Try recording again and speak clearly.",
        strengths: [], improvements: ["Provide a complete spoken answer."],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are an expert interview coach. Evaluate candidate answers fairly on content relevance, communication clarity, and confidence. Use the audio metrics as a hint for confidence." },
        { role: "user", content: `Role: ${role || "Software Engineer"}\nQuestion: ${question}\nCandidate transcript: """${(transcript||"").slice(0,4000)}"""\nAudio metrics: ${JSON.stringify(audioMetrics || {})}\n\nScore each 0-100. Be critical but constructive.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "score_answer",
          description: "Score the answer",
          parameters: {
            type: "object",
            properties: {
              content_score: { type: "number" },
              clarity_score: { type: "number" },
              confidence_score: { type: "number" },
              feedback: { type: "string", description: "2-3 sentences of specific feedback" },
              strengths: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" } },
            },
            required: ["content_score", "clarity_score", "confidence_score", "feedback", "strengths", "improvements"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "score_answer" } },
    };

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("score error", r.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const args = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
