import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Mic, FileText, BarChart3, Sparkles, ShieldCheck, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const go = () => navigate(user ? "/dashboard" : "/auth");

  const features = [
    { icon: Mic, title: "Voice interviews", desc: "Speak your answers. We transcribe, score relevance, clarity, and confidence." },
    { icon: FileText, title: "Resume ATS scoring", desc: "Upload your resume PDF and get an instant ATS score with missing keywords." },
    { icon: BarChart3, title: "Performance dashboard", desc: "Track every attempt with charts and personalized improvement tips." },
    { icon: Sparkles, title: "AI-generated questions", desc: "Role-specific behavioral and technical questions tailored to difficulty." },
    { icon: ShieldCheck, title: "Private & secure", desc: "Your data is yours. Stored securely with row-level access controls." },
    { icon: Brain, title: "Multi-modal analysis", desc: "Combines NLP, semantic similarity, and audio features for fair scoring." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" aria-hidden />

        <div className="container relative py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered interview preparation
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Ace your next interview with <span className="text-gradient">InterviewIQ</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Practice with AI, get instant feedback on content, clarity, and confidence — and analyze your resume with a real ATS score.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="hero" size="xl" onClick={go}>Start practicing free</Button>
              <Button variant="outline" size="xl" onClick={() => navigate(user ? "/resume" : "/auth")}>Analyze my resume</Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card. Built on Lovable Cloud.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Everything you need to interview better</h2>
          <p className="mt-3 text-muted-foreground">Multi-modal AI scoring across speech, content, and resume.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border/60 bg-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-smooth group-hover:bg-gradient-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gradient-soft py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">How it works</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { n: "01", t: "Upload your resume", d: "We extract text and score it against your target role like a real ATS." },
              { n: "02", t: "Practice with voice", d: "Answer AI-generated questions. We transcribe and analyze speech metrics." },
              { n: "03", t: "Get actionable feedback", d: "Per-question scores, strengths, improvements, and a tracked dashboard." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
                <div className="font-display text-3xl font-extrabold text-gradient">{s.n}</div>
                <h3 className="mt-3 font-display text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="hero" size="lg" onClick={go}>Try it now</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} InterviewIQ — AI-powered interview preparation.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
