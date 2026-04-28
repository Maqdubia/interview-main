import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Mic, FileText, BarChart3, Sparkles, ShieldCheck, Brain, ArrowRight, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import appLogo from "@/assets/app-logo.jpeg";
import { tap } from "@/lib/haptics";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const go = () => {
    tap();
    navigate(user ? "/dashboard" : "/auth");
  };
  const goResume = () => {
    tap();
    navigate(user ? "/resume" : "/auth");
  };

  const features = [
    { icon: Mic, title: "Voice interviews", desc: "Speak your answers. We transcribe, score relevance, clarity, and confidence." },
    { icon: FileText, title: "Resume ATS scoring", desc: "Upload your resume PDF and get an instant ATS score with missing keywords." },
    { icon: BarChart3, title: "Performance dashboard", desc: "Track every attempt with charts and personalized improvement tips." },
    { icon: Sparkles, title: "AI-generated questions", desc: "Role-specific behavioral and technical questions tailored to difficulty." },
    { icon: ShieldCheck, title: "Private & secure", desc: "Your data is yours. Stored securely with row-level access controls." },
    { icon: Brain, title: "Multi-modal analysis", desc: "Combines NLP, semantic similarity, and audio features for fair scoring." },
  ];

  const mobileQuick = [
    { icon: Mic, title: "Practice", desc: "Voice interview", action: go, accent: "bg-gradient-primary text-primary-foreground" },
    { icon: FileText, title: "Resume", desc: "ATS score", action: goResume, accent: "bg-accent text-accent-foreground" },
    { icon: BarChart3, title: "Insights", desc: "Track progress", action: go, accent: "bg-accent text-accent-foreground" },
    { icon: Sparkles, title: "AI tips", desc: "Personalized", action: go, accent: "bg-accent text-accent-foreground" },
  ];

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop / tablet navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* ===================== MOBILE APP-NATIVE LANDING ===================== */}
      <div className="md:hidden relative overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-primary-glow/25 blur-3xl" aria-hidden />

        {/* App-style top bar */}
        <header className="relative z-10 flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-2.5">
            <img src={appLogo} alt="InterviewIQ" className="h-9 w-9 rounded-xl shadow-soft" />
            <div className="leading-tight">
              <p className="font-display text-base font-bold">InterviewIQ</p>
              <p className="text-[10px] text-muted-foreground -mt-0.5">AI Interview Coach</p>
            </div>
          </div>
          <button
            onClick={go}
            className="rounded-full bg-foreground/90 px-4 py-1.5 text-xs font-semibold text-background active:scale-95 transition-smooth"
          >
            {user ? "Open" : "Sign in"}
          </button>
        </header>

        {/* Hero */}
        <section className="relative z-10 px-5 pt-8 pb-6 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            Powered by AI
          </div>
          <h1 className="mt-4 font-display text-[2.1rem] leading-[1.1] font-extrabold tracking-tight">
            Ace your next <br />
            interview with <span className="text-gradient">InterviewIQ</span>
          </h1>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            Practice with AI. Get instant feedback on content, clarity & confidence.
          </p>

          {/* Primary CTA — large, app-style */}
          <button
            onClick={go}
            className="mt-6 flex w-full items-center justify-between rounded-2xl bg-gradient-primary px-5 py-4 text-primary-foreground shadow-elegant active:scale-[0.98] transition-smooth"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Mic className="h-5 w-5" />
              </span>
              <span className="text-left">
                <span className="block text-base font-semibold">Start practicing</span>
                <span className="block text-[11px] opacity-80">Free • No credit card</span>
              </span>
            </span>
            <ArrowRight className="h-5 w-5" />
          </button>

          <button
            onClick={goResume}
            className="mt-3 flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card px-5 py-3.5 active:scale-[0.98] transition-smooth"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <FileText className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-semibold">Analyze my resume</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </section>

        {/* Quick actions grid (app-tiles) */}
        <section className="relative z-10 px-5 pt-2 pb-4">
          <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Quick start
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {mobileQuick.map((q) => (
              <button
                key={q.title}
                onClick={q.action}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft active:scale-[0.97] transition-smooth"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${q.accent}`}>
                  <q.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{q.title}</span>
                  <span className="block text-xs text-muted-foreground">{q.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Why InterviewIQ — horizontal scroll cards */}
        <section className="relative z-10 pt-4 pb-6">
          <h2 className="mb-3 px-5 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Why InterviewIQ
          </h2>
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory scrollbar-none">
            {features.map((f) => (
              <div
                key={f.title}
                className="snap-start shrink-0 w-[78%] rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works — vertical steps */}
        <section className="relative z-10 px-5 pt-4 pb-8">
          <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            How it works
          </h2>
          <ol className="space-y-3">
            {[
              { n: "1", t: "Upload your resume", d: "Real ATS scoring against your role." },
              { n: "2", t: "Practice with voice", d: "AI questions, transcribed & scored." },
              { n: "3", t: "Get feedback", d: "Strengths, fixes & a tracked dashboard." },
            ].map((s) => (
              <li key={s.n} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground font-display font-bold">
                  {s.n}
                </span>
                <span>
                  <span className="block font-display text-sm font-semibold">{s.t}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{s.d}</span>
                </span>
              </li>
            ))}
          </ol>

          <button
            onClick={go}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-4 text-background font-semibold active:scale-[0.98] transition-smooth shadow-elegant"
          >
            Get started — it's free
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} InterviewIQ
          </p>
        </section>
      </div>

      {/* ===================== DESKTOP LANDING (unchanged) ===================== */}
      <div className="hidden md:block">
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
                <Button variant="outline" size="xl" onClick={goResume}>Analyze my resume</Button>
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
    </div>
  );
};

export default Landing;
