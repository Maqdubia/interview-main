import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { computeAudioMetrics, blobToBase64 } from "@/lib/audio";
import { toast } from "sonner";
import { Mic, Square, Loader2, ChevronRight, Pencil } from "lucide-react";

type Stage = "setup" | "running" | "scoring" | "done";

const Interview = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("setup");
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("medium");
  const [experienceLevel, setExperienceLevel] = useState<"fresher" | "mid" | "senior">("fresher");
  const [questions, setQuestions] = useState<string[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [scoring, setScoring] = useState(false);

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Resume linkage — bias questions to the candidate's actual resume when available.
  const [resumeCtx, setResumeCtx] = useState<any | null>(null);
  const [useResume, setUseResume] = useState(true);

  // Track prior Q&A for adaptive follow-ups.
  const priorQARef = useRef<Array<{ question: string; transcript: string; avgScore: number }>>([]);
  const followUpInsertedRef = useRef<Set<number>>(new Set());

  useEffect(() => () => { mediaRef.current?.stream?.getTracks().forEach((t) => t.stop()); }, []);

  // Load most recent resume for this user, prefill role + skills for adaptive questioning.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await db.from("resumes")
        .select("file_name, experience_level, detected_skills, missing_keywords, ats_score, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setResumeCtx(data);
        if (data.experience_level) setExperienceLevel(data.experience_level as any);
      }
    })();
  }, [user]);


  const startInterview = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: { role, difficulty, count: 5, experienceLevel },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const qs: string[] = (data as any).questions || [];
      if (qs.length === 0) throw new Error("No questions generated");
      const ins = await db.from("interviews").insert({ user_id: user.id, role, difficulty, experience_level: experienceLevel }).select("id").single();
      if (ins.error) throw ins.error;
      setInterviewId(ins.data.id);
      setQuestions(qs);
      setQIndex(0);
      setStage("running");
    } catch (e: any) {
      toast.error(e.message || "Failed to start interview");
    } finally {
      setGenerating(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      toast.error("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const transcribeAndScore = async () => {
    setScoring(true);
    try {
      let finalTranscript = transcript;
      let audioMetrics: any = { mode: "text" };

      if (mode === "voice") {
        if (!recordedBlob) throw new Error("Record an answer first");
        toast.info("Transcribing audio…");
        const base64 = await blobToBase64(recordedBlob);
        const { data: tr, error: te } = await supabase.functions.invoke("transcribe-audio", {
          body: { audioBase64: base64, mimeType: "audio/webm" },
        });
        if (te) throw te;
        if ((tr as any)?.error) throw new Error((tr as any).error);
        finalTranscript = (tr as any).transcript || "";
        audioMetrics = await computeAudioMetrics(recordedBlob, finalTranscript);
      }

      if (!finalTranscript || finalTranscript.trim().length < 2) {
        throw new Error("Empty answer — please try again");
      }

      toast.info("Scoring your answer…");
      const { data: sc, error: se } = await supabase.functions.invoke("score-answer", {
        body: { question: questions[qIndex], transcript: finalTranscript, role, audioMetrics, experienceLevel },
      });
      if (se) throw se;
      if ((sc as any)?.error) throw new Error((sc as any).error);

      await db.from("answers").insert({
        interview_id: interviewId,
        user_id: user.id,
        question: questions[qIndex],
        question_index: qIndex,
        transcript: finalTranscript,
        content_score: (sc as any).content_score,
        clarity_score: (sc as any).clarity_score,
        confidence_score: (sc as any).confidence_score,
        feedback: (sc as any).feedback,
      });

      // Advance
      if (qIndex + 1 >= questions.length) {
        await finalizeInterview();
      } else {
        setQIndex(qIndex + 1);
        resetForNextQuestion();
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to score answer");
    } finally {
      setScoring(false);
    }
  };

  const resetForNextQuestion = () => {
    setRecordedBlob(null);
    setTranscript("");
    setEditingTranscript(false);
  };

  const finalizeInterview = async () => {
    const { data: rows } = await db.from("answers").select("content_score, clarity_score, confidence_score").eq("interview_id", interviewId);
    const list = (rows as any[]) || [];
    const avg = (k: string) => list.length ? Math.round(list.reduce((a, b) => a + (b[k] || 0), 0) / list.length) : 0;
    const content = avg("content_score");
    const clarity = avg("clarity_score");
    const confidence = avg("confidence_score");
    const overall = Math.round((content + clarity + confidence) / 3);
    await db.from("interviews").update({
      content_score: content,
      clarity_score: clarity,
      confidence_score: confidence,
      overall_score: overall,
      summary: `Completed ${questions.length} questions for ${role}.`,
    }).eq("id", interviewId);
    setStage("done");
    toast.success("Interview complete!");
    navigate(`/results/${interviewId}`);
  };

  if (stage === "setup") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl py-10">
          <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft animate-fade-in">
            <h1 className="font-display text-3xl font-bold">Start a mock interview</h1>
            <p className="mt-1 text-muted-foreground">5 AI-generated questions tailored to your role.</p>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Target role</Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Experience level</Label>
                <div className="flex gap-2">
                  {[
                    { k: "fresher", l: "Fresher", sub: "0-1 yrs" },
                    { k: "mid", l: "Mid", sub: "2-5 yrs" },
                    { k: "senior", l: "Senior", sub: "5+ yrs" },
                  ].map((lv) => (
                    <button key={lv.k} type="button" onClick={() => setExperienceLevel(lv.k as any)}
                      className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-smooth ${experienceLevel === lv.k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}>
                      <div>{lv.l}</div>
                      <div className={`text-[11px] font-normal ${experienceLevel === lv.k ? "opacity-80" : "text-muted-foreground"}`}>{lv.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <div className="flex gap-2">
                  {["easy", "medium", "hard"].map((d) => (
                    <button key={d} type="button" onClick={() => setDifficulty(d)}
                      className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition-smooth ${difficulty === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Answer mode</Label>
                <div className="flex gap-2">
                  {[{ k: "voice", l: "🎙 Voice" }, { k: "text", l: "⌨ Text" }].map((m) => (
                    <button key={m.k} type="button" onClick={() => setMode(m.k as any)}
                      className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-smooth ${mode === m.k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"}`}>
                      {m.l}
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="hero" size="lg" className="w-full" disabled={generating} onClick={startInterview}>
                {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating questions…</> : <>Begin interview <ChevronRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl py-10">
        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Question {qIndex + 1} of {questions.length}</span>
          <span className="capitalize">{role} · {difficulty}</span>
        </div>
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-gradient-primary transition-smooth" style={{ width: `${((qIndex) / questions.length) * 100}%` }} />
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Question</p>
          <h2 className="mt-2 font-display text-2xl font-bold leading-snug">{questions[qIndex]}</h2>

          <div className="mt-8">
            {mode === "voice" ? (
              <div className="flex flex-col items-center gap-4 rounded-xl bg-gradient-soft p-8">
                {!recordedBlob ? (
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`flex h-24 w-24 items-center justify-center rounded-full text-primary-foreground shadow-elegant transition-smooth ${recording ? "bg-destructive animate-pulse-soft" : "bg-gradient-primary hover:shadow-glow"}`}
                    aria-label={recording ? "Stop recording" : "Start recording"}
                  >
                    {recording ? <Square className="h-8 w-8" /> : <Mic className="h-9 w-9" />}
                  </button>
                ) : (
                  <div className="w-full space-y-3">
                    <audio src={URL.createObjectURL(recordedBlob)} controls className="w-full" />
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" onClick={() => { setRecordedBlob(null); setTranscript(""); }}>Re-record</Button>
                      {!editingTranscript && (
                        <Button variant="ghost" onClick={() => setEditingTranscript(true)}><Pencil className="h-4 w-4" /> Edit transcript</Button>
                      )}
                    </div>
                    {editingTranscript && (
                      <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Transcript will be filled by AI; you can edit it before scoring." rows={4} />
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{recording ? "Listening… click to stop." : recordedBlob ? "Looks good? Submit when ready." : "Click the mic to record your answer."}</p>
              </div>
            ) : (
              <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Type your answer here…" rows={8} />
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { resetForNextQuestion(); if (qIndex + 1 < questions.length) setQIndex(qIndex + 1); else finalizeInterview(); }}>
              Skip
            </Button>
            <Button variant="hero" size="lg" disabled={scoring || (mode === "voice" ? !recordedBlob : transcript.trim().length < 2)} onClick={transcribeAndScore}>
              {scoring ? <><Loader2 className="h-4 w-4 animate-spin" /> Scoring…</> : qIndex + 1 >= questions.length ? "Submit & finish" : "Submit & next"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Interview;
