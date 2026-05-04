// Transcribe base64 audio using Lovable AI Gemini multimodal
import { corsHeaders, requireUser } from "../_shared/auth.ts";

const MAX_BASE64_CHARS = 7_000_000; // ~5 MB audio

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;

    const { audioBase64, mimeType } = await req.json();
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return new Response(JSON.stringify({ error: "audioBase64 required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (audioBase64.length > MAX_BASE64_CHARS) {
      return new Response(JSON.stringify({ error: "Audio too large. Please record a shorter clip." }), { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const mt = typeof mimeType === "string" ? mimeType : "audio/webm";
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "Transcribe this audio verbatim. Return ONLY the spoken text, no prefixes, no quotes, no commentary. Preserve filler words like 'um', 'uh', 'like'." },
            { type: "input_audio", input_audio: { data: audioBase64, format: mt.includes("webm") ? "webm" : mt.includes("wav") ? "wav" : mt.includes("mp3") ? "mp3" : "webm" } },
          ],
        }],
      }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      console.error("transcribe error", r.status, t);
      return new Response(JSON.stringify({ error: "AI transcription error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await r.json();
    const text = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ transcript: text.trim() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "err" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
