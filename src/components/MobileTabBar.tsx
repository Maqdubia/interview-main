import { NavLink, useLocation } from "react-router-dom";
import { Home, FileText, Mic, BarChart3, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { tap } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/interview", label: "Practice", icon: Mic, primary: true },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/install", label: "Profile", icon: User },
];

export const MobileTabBar = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;
  // Hide on landing & auth
  if (["/", "/auth"].includes(location.pathname)) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ to, label, icon: Icon, primary }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={() => tap()}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-smooth active:scale-95",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-2xl transition-smooth",
                      primary && "bg-gradient-primary text-primary-foreground shadow-soft -mt-4 h-12 w-12",
                      !primary && isActive && "bg-accent"
                    )}
                  >
                    <Icon className={cn(primary ? "h-5 w-5" : "h-[18px] w-[18px]")} />
                  </span>
                  <span className={cn(primary && "mt-0.5")}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
