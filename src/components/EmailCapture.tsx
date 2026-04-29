import { useState } from "react";
import { z } from "zod";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { tap } from "@/lib/haptics";

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Please enter a valid email" })
  .max(255, { message: "Email is too long" });

interface EmailCaptureProps {
  variant?: "mobile" | "desktop";
}

export const EmailCapture = ({ variant = "desktop" }: EmailCaptureProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    tap();

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("email_subscribers")
      .insert({ email: parsed.data, source: "landing" });
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        // unique violation — treat as success so we don't reveal subscriber list
        setSuccess(true);
        toast.success("You're already on the list!");
        return;
      }
      toast.error("Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
    setEmail("");
    toast.success("Thanks! We'll be in touch.");
  };

  if (success) {
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-soft ${
          variant === "desktop" ? "mx-auto max-w-xl" : ""
        }`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <p className="text-sm font-medium">You're on the list — thanks for joining!</p>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="email-mobile" className="block text-xs font-semibold text-muted-foreground">
          Get product updates
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-soft focus-within:ring-2 focus-within:ring-primary/40">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input
            id="email-mobile"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            maxLength={255}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-soft active:scale-95 transition-smooth disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Notify me"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-3 shadow-soft focus-within:ring-2 focus-within:ring-primary/40">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input
            id="email-desktop"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            maxLength={255}
            aria-label="Email address"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant hover:opacity-95 transition-smooth disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Notify me"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Join the list for product updates. No spam, ever.
      </p>
    </form>
  );
};
