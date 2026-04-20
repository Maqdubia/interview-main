import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from "recharts";

type Interview = { id: string; role: string; difficulty: string; experience_level: string | null; overall_score: number | null; content_score: number | null; clarity_score: number | null; confidence_score: number | null; created_at: string };
type Answer = { id: string; question: string; question_index: number; transcript: string | null; content_score: number; clarity_score: number; confidence_score: number; feedback: string };

const Results = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const [iv, ans] = await Promise.all([
        db.from("interviews").select("*").eq("id", id).single(),
        db.from("answers").select("*").eq("interview_id", id).order("question_index", { ascending: true }),
      ]);
      setInterview(iv.data as any);
      setAnswers((ans.data as any) || []);
      setBusy(false);
    })();
  }, [user, id]);

  if (loading || busy) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!interview) return <Navigate to="/dashboard" replace />;

  const radarData = [
    { metric: "Content", value: interview.content_score || 0 },
    { metric: "Clarity", value: interview.clarity_score || 0 },
    { metric: "Confidence", value: interview.confidence_score || 0 },
  ];

  const scoreColor = (s: number) => s >= 75 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-5xl py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-4 w-4" /> Back to dashboard</Button>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">{interview.role}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {interview.experience_level && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">{interview.experience_level}</span>
              )}
              <p className="text-sm text-muted-foreground capitalize">{interview.difficulty} · {new Date(interview.created_at).toLocaleString()}</p>
            </div>
          </div>
          <Button variant="hero" onClick={() => navigate("/interview")}><RotateCcw className="h-4 w-4" /> Practice again</Button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft text-center">
            <p className="text-sm text-muted-foreground">Overall score</p>
            <p className={`mt-1 font-display text-6xl font-extrabold ${scoreColor(interview.overall_score || 0)}`}>{interview.overall_score ?? 0}<span className="text-2xl text-muted-foreground">/100</span></p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
            <h3 className="mb-2 font-display text-base font-semibold">Skill breakdown</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--foreground))", fontSize: 13 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="font-display text-xl font-bold">Per-question feedback</h2>
          {answers.map((a, i) => (
            <div key={a.id} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft animate-fade-in">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Question {i + 1}</div>
              <h3 className="font-display text-lg font-semibold">{a.question}</h3>
              {a.transcript && (
                <div className="mt-3 rounded-lg bg-gradient-soft p-3 text-sm italic text-muted-foreground">"{a.transcript}"</div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Metric label="Content" value={a.content_score} />
                <Metric label="Clarity" value={a.clarity_score} />
                <Metric label="Confidence" value={a.confidence_score} />
              </div>
              <p className="mt-4 text-sm text-foreground">{a.feedback}</p>
            </div>
          ))}
          {answers.length === 0 && (
            <p className="text-sm text-muted-foreground">No answers recorded.</p>
          )}
        </div>
      </main>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: number }) => {
  const tone = value >= 75 ? "bg-success/10 text-success" : value >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
  return (
    <div className={`rounded-xl px-3 py-3 text-center ${tone}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="font-display text-xl font-bold">{value}</p>
    </div>
  );
};

export default Results;
