import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MobileHeader } from "./MobileHeader";
import { MobileTabBar } from "./MobileTabBar";

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const hideMobileChrome = ["/", "/auth"].includes(pathname);

  return (
    <div className="min-h-dvh flex flex-col">
      <MobileHeader />
      <main
        className="flex-1"
        style={{
          paddingBottom: hideMobileChrome ? undefined : "calc(64px + env(safe-area-inset-bottom))",
        }}
      >
        <div key={pathname} className="md:contents animate-page-in">
          {children}
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
};
