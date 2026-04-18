import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import { ArrowRight, FileText, Mic, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

type Interview = { id: string; role: string; overall_score: number | null; created_at: string };
type Resume = { id: string; file_name: string | null; ats_score: number | null; created_at: string };

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [iv, rs] = await Promise.all([
        db.from("interviews").select("id, role, overall_score, created_at").order("created_at", { ascending: false }).limit(20),
        db.from("resumes").select("id, file_name, ats_score, created_at").order("created_at", { ascending: false }).limit(10),
      ]);
      setInterviews((iv.data as any) || []);
      setResumes((rs.data as any) || []);
    })();
  }, [user]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const chartData = [...interviews].reverse().map((i, idx) => ({
    name: `#${idx + 1}`,
    score: i.overall_score ?? 0,
    role: i.role,
  }));

  const avgScore = interviews.length
    ? Math.round(interviews.reduce((a, b) => a + (b.overall_score || 0), 0) / interviews.length)
    : 0;

  const latestAts = resumes[0]?.ats_score ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold md:text-4xl">Your dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track progress and pick up where you left off.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => navigate("/resume")}><FileText className="h-4 w-4" /> Analyze resume</Button>
            <Button variant="hero" size="lg" onClick={() => navigate("/interview")}><Mic className="h-4 w-4" /> New interview</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Interviews completed" value={interviews.length.toString()} />
          <StatCard label="Average score" value={`${avgScore}/100`} />
          <StatCard label="Latest ATS score" value={latestAts != null ? `${latestAts}/100` : "—"} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">Score trend</h2>
            </div>
            {chartData.length === 0 ? (
              <EmptyChart onStart={() => navigate("/interview")} />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
            <h2 className="mb-4 font-display text-lg font-semibold">Recent resumes</h2>
            {resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resumes yet. Upload your first PDF to get an ATS score.</p>
            ) : (
              <ul className="space-y-2">
                {resumes.slice(0, 5).map((r) => (
                  <li key={r.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.filename}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.target_role || "No target role"}</p>
                    </div>
                    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{r.ats_score ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <h2 className="mb-4 font-display text-lg font-semibold">Recent interviews</h2>
          {interviews.length === 0 ? (
            <div className="rounded-xl bg-gradient-soft p-8 text-center">
              <p className="mb-4 text-muted-foreground">You haven't completed any interviews yet.</p>
              <Button variant="hero" onClick={() => navigate("/interview")}>Start your first interview <ArrowRight className="h-4 w-4" /></Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {interviews.slice(0, 8).map((i) => (
                <li key={i.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{i.role}</p>
                    <p className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">{i.overall_score ?? "—"}/100</span>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/results/${i.id}`)}>View <ArrowRight className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-3xl font-bold text-gradient">{value}</p>
  </div>
);

const EmptyChart = ({ onStart }: { onStart: () => void }) => (
  <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl bg-gradient-soft text-center">
    <p className="text-sm text-muted-foreground">No data yet — your scores will appear here.</p>
    <Button variant="hero" size="sm" onClick={onStart}>Start an interview</Button>
  </div>
);

export default Dashboard;
