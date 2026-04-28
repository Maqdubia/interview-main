import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { tap } from "@/lib/haptics";

const titleFor = (path: string): string => {
  if (path.startsWith("/dashboard")) return "Home";
  if (path.startsWith("/resume")) return "Resume";
  if (path.startsWith("/interview")) return "Interview";
  if (path.startsWith("/results")) return "Results";
  if (path.startsWith("/install")) return "Profile";
  return "InterviewIQ";
};

const ROOT_ROUTES = new Set(["/dashboard", "/resume", "/interview", "/results", "/install"]);

export const MobileHeader = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!user) return null;
  if (["/", "/auth"].includes(pathname)) return null;

  const isRoot = ROOT_ROUTES.has(pathname);
  const title = titleFor(pathname);

  return (
    <header
      className="md:hidden sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl select-none"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-12 items-center justify-between px-3">
        <div className="flex items-center gap-2 min-w-0">
          {!isRoot ? (
            <button
              onClick={() => {
                tap();
                navigate(-1);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent active:scale-95 transition-smooth"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <h1 className="font-display text-base font-semibold truncate">{title}</h1>
        </div>
      </div>
    </header>
  );
};
