import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { extractPdfText } from "@/lib/pdf";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle2, AlertCircle, Lightbulb } from "lucide-react";

type Report = {
  ats_score: number;
  summary: string;
  matched_keywords: string[];
  missing_keywords: string[];
  suggestions: string[];
  detected_skills: string[];
};

const Resume = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("Software Engineer");
  const [working, setWorking] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Loading…</p></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const onAnalyze = async () => {
    if (!file) { toast.error("Choose a PDF first"); return; }
    if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error("Please upload a PDF file"); return; }
    setWorking(true);
    setReport(null);
    try {
      toast.info("Extracting text from PDF…");
      const text = await extractPdfText(file);
      if (!text || text.length < 50) throw new Error("Could not read enough text from this PDF");

      toast.info("Analyzing with AI…");
      const { data, error } = await supabase.functions.invoke("analyze-resume", {
        body: { resumeText: text, targetRole: role },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const r = data as Report;
      setReport(r);

      const { error: saveError } = await db.from("resumes").insert({
        user_id: user.id,
        file_name: file.name,
        raw_text: text.slice(0, 50000),
        ats_score: r.ats_score,
        matched_keywords: r.matched_keywords,
        missing_keywords: r.missing_keywords,
        detected_skills: r.detected_skills,
        suggestions: r.suggestions.join("\n"),
      });

      if (saveError) throw saveError;

      toast.success("Resume analyzed!");
    } catch (e: any) {
      toast.error(e.message || "Failed to analyze resume");
    } finally {
      setWorking(false);
    }
  };

  const scoreColor = (s: number) => s >= 75 ? "text-success" : s >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-5xl py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Resume ATS Analysis</h1>
          <p className="mt-1 text-muted-foreground">Upload your resume PDF and get an instant ATS score for your target role.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft lg:col-span-1">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Target role</Label>
                <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Frontend Engineer" />
              </div>
              <div className="space-y-2">
                <Label>Resume PDF</Label>
                <label htmlFor="file" className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-gradient-soft p-6 text-center transition-smooth hover:border-primary/60">
                  <Upload className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{file ? file.name : "Click to upload"}</span>
                  <span className="text-xs text-muted-foreground">PDF up to 10MB</span>
                  <input id="file" type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <Button variant="hero" size="lg" className="w-full" onClick={onAnalyze} disabled={working || !file}>
                {working ? "Analyzing…" : "Analyze resume"}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {!report && !working && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-gradient-soft p-10 text-center">
                <FileText className="mb-3 h-10 w-10 text-primary" />
                <h3 className="font-display text-lg font-semibold">Your report will appear here</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Upload a PDF and pick a target role. We'll do an AI-powered ATS analysis with matched & missing keywords.</p>
              </div>
            )}
            {working && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-10 text-center">
                <div className="h-10 w-10 animate-pulse-soft rounded-full bg-gradient-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Reading PDF and running ATS analysis…</p>
              </div>
            )}
            {report && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-soft sm:flex-row">
                  <div>
                    <p className="text-sm text-muted-foreground">ATS Score</p>
                    <p className={`font-display text-5xl font-extrabold ${scoreColor(report.ats_score)}`}>{report.ats_score}<span className="text-2xl text-muted-foreground">/100</span></p>
                  </div>
                  <p className="max-w-md text-sm text-muted-foreground sm:text-right">{report.summary}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <KeywordCard title="Matched keywords" items={report.matched_keywords} icon={CheckCircle2} tone="success" />
                  <KeywordCard title="Missing keywords" items={report.missing_keywords} icon={AlertCircle} tone="warning" />
                </div>

                <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
                  <div className="mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-lg font-semibold">Improvement suggestions</h3>
                  </div>
                  <ul className="space-y-2">
                    {report.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button variant="hero" onClick={() => navigate("/interview")}>Practice an interview →</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const KeywordCard = ({ title, items, icon: Icon, tone }: { title: string; items: string[]; icon: any; tone: "success" | "warning" }) => (
  <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
    <div className="mb-3 flex items-center gap-2">
      <Icon className={`h-4 w-4 ${tone === "success" ? "text-success" : "text-warning"}`} />
      <h3 className="font-display text-base font-semibold">{title}</h3>
    </div>
    {items.length === 0 ? (
      <p className="text-sm text-muted-foreground">None</p>
    ) : (
      <div className="flex flex-wrap gap-1.5">
        {items.map((k) => (
          <span key={k} className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone === "success" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{k}</span>
        ))}
      </div>
    )}
  </div>
);

export default Resume;
