// Resume ATS analysis via Lovable AI (structured tool call)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { resumeText, targetRole, experienceLevel } = await req.json();
    if (!resumeText || typeof resumeText !== "string") {
      return new Response(JSON.stringify({ error: "resumeText required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const trimmed = resumeText.slice(0, 12000);
    const role = (targetRole || "Software Engineer").toString().slice(0, 120);
    const level = (experienceLevel || "mid").toString().toLowerCase();
    const levelGuidance: Record<string, string> = {
      fresher:
        "FRESHER / ENTRY-LEVEL (0-1 years, recent graduate or intern). Score this resume against fresher expectations: weight academic projects, internships, coursework, hackathons, certifications, and foundational skills. Do NOT penalize for missing years of industry experience, leadership, or production system ownership. Missing keywords should focus on entry-level fundamentals (data structures, basic frameworks, version control, internships, projects), NOT senior concepts (architecture, mentoring, scaling). Suggestions should be encouraging and beginner-appropriate.",
      mid:
        "MID-LEVEL (2-5 years). Expect production experience, ownership of features, and solid technical depth. Score against mid-level bar.",
      senior:
        "SENIOR (5+ years). Expect leadership, architecture, mentoring, cross-functional impact, and depth. Score against senior bar; flag missing seniority signals.",
    };
    const levelText = levelGuidance[level] || levelGuidance.mid;

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `You are an expert ATS (Applicant Tracking System) and technical recruiter. Analyze resumes for the given target role and experience level. Be honest, specific, and concise. ${levelText}` },
        { role: "user", content: `Target role: ${role}\nExperience level: ${level}\n\nResume text:\n"""${trimmed}"""\n\nAnalyze how well this resume matches the role AT THE ${level.toUpperCase()} LEVEL. Score it like a real ATS calibrated for this seniority, list keywords found vs missing (calibrated to the level), and give 4-6 short improvement suggestions appropriate for a ${level} candidate.` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "ats_report",
          description: "Return ATS analysis report",
          parameters: {
            type: "object",
            properties: {
              ats_score: { type: "number", description: "0-100 ATS compatibility score" },
              summary: { type: "string", description: "1-2 sentence overall assessment" },
              matched_keywords: { type: "array", items: { type: "string" } },
              missing_keywords: { type: "array", items: { type: "string" } },
              suggestions: { type: "array", items: { type: "string" } },
              detected_skills: { type: "array", items: { type: "string" } },
            },
            required: ["ats_score", "summary", "matched_keywords", "missing_keywords", "suggestions", "detected_skills"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "ats_report" } },
    };

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("AI error", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : null;
    if (!args) throw new Error("No structured response");
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-resume error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
