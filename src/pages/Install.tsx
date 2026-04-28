import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Apple, Smartphone, Share2, Plus, Download, CheckCircle2 } from "lucide-react";
import appLogo from "@/assets/app-logo.jpeg";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectPlatform(): "ios" | "android" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

const Install = () => {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(isStandalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-12">
        <header className="mb-8 text-center">
          <img src={appLogo} alt="InterviewIQ" className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-soft object-cover" />
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Install InterviewIQ
          </h1>
          <p className="mt-2 text-muted-foreground">
            Add InterviewIQ to your home screen for a full-screen, app-like experience.
          </p>
        </header>

        {installed ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h2 className="font-display text-xl font-semibold">You're all set!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              InterviewIQ is installed on this device.
            </p>
            <Button className="mt-6" onClick={() => navigate("/dashboard")}>
              Open dashboard
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {platform === "android" && (
              <Card className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h2 className="font-display font-semibold">Install on Android</h2>
                </div>
                {deferred ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Tap below to add InterviewIQ to your home screen.
                    </p>
                    <Button className="mt-4 w-full" variant="hero" onClick={triggerInstall}>
                      <Download className="mr-2 h-4 w-4" />
                      Install app
                    </Button>
                  </>
                ) : (
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                    <li>Open the browser menu (⋮ in Chrome).</li>
                    <li>
                      Tap <strong className="text-foreground">Install app</strong> or{" "}
                      <strong className="text-foreground">Add to Home screen</strong>.
                    </li>
                    <li>Confirm and launch from your home screen.</li>
                  </ol>
                )}
              </Card>
            )}

            {platform === "ios" && (
              <Card className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Apple className="h-5 w-5 text-primary" />
                  <h2 className="font-display font-semibold">Install on iPhone / iPad</h2>
                </div>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>
                    Open this page in <strong className="text-foreground">Safari</strong>.
                  </li>
                  <li>
                    Tap the <Share2 className="inline h-4 w-4 align-text-bottom" />{" "}
                    <strong className="text-foreground">Share</strong> button.
                  </li>
                  <li>
                    Choose <Plus className="inline h-4 w-4 align-text-bottom" />{" "}
                    <strong className="text-foreground">Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong className="text-foreground">Add</strong> in the top-right corner.
                  </li>
                </ol>
              </Card>
            )}

            {platform === "desktop" && (
              <Card className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <h2 className="font-display font-semibold">Install on Desktop</h2>
                </div>
                {deferred ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Install InterviewIQ as a standalone desktop app.
                    </p>
                    <Button className="mt-4 w-full" variant="hero" onClick={triggerInstall}>
                      <Download className="mr-2 h-4 w-4" />
                      Install app
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    In Chrome or Edge, look for the install icon in the address bar, or open the
                    browser menu and choose <strong className="text-foreground">Install InterviewIQ</strong>.
                    On mobile, open this page on your phone.
                  </p>
                )}
              </Card>
            )}

            <Card className="bg-muted/30 p-5">
              <h3 className="font-display text-sm font-semibold">Why install?</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Launch from your home screen with one tap</li>
                <li>• Full-screen experience, no browser bars</li>
                <li>• Faster load times after first visit</li>
              </ul>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Install;
