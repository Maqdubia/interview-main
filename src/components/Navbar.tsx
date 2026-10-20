import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Smartphone } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import appLogo from "@/assets/app-logo.jpeg";

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header className="hidden md:block sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={appLogo}
            alt="InterviewIQ logo"
            className="h-9 w-9 rounded-xl shadow-soft object-cover"
          />
          <span className="font-display text-lg font-bold">InterviewIQ</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/shop")}>Shop</Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/resume")}>Resume</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/interview")}>Interview</Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/install")} aria-label="Install app">
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {isLanding && <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign in</Button>}
              <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>Get started</Button>
            </>
          )}
          <CartDrawer />
        </nav>
      </div>
    </header>
  );
};
