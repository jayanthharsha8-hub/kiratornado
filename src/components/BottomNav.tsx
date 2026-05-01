import { NavLink, useLocation } from "react-router-dom";
import { Home, Swords, BarChart3, Wallet, User } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/tournaments", label: "Tournaments", icon: Swords },
  { to: "/leaderboard", label: "Leaderboard", icon: BarChart3, premium: true },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/40 bg-background/95 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
      <div className="mx-auto grid max-w-md grid-cols-5 items-stretch px-2 py-1.5">
        {TABS.map(({ to, label, icon: Icon, premium }) => {
          const active = location.pathname === to || (to === "/wallet" && location.pathname.startsWith("/wallet"));
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => playSound("tick")}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 transition-all duration-300 active:scale-[0.95]",
                active ? "text-primary" : "text-foreground/55 hover:text-foreground/80"
              )}
            >
              {premium && (
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-1 h-9 w-9 -translate-x-1/2 rounded-full blur-md transition-opacity duration-300",
                    active ? "opacity-90" : "opacity-40"
                  )}
                  style={{ background: "hsl(var(--primary) / 0.45)" }}
                />
              )}
              <Icon
                strokeWidth={1.6}
                className={cn(
                  "relative h-[22px] w-[22px] transition-all duration-300",
                  active && "scale-110 drop-shadow-[0_0_10px_hsl(var(--primary))]",
                  premium && !active && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.55)]"
                )}
              />
              <span
                className={cn(
                  "relative font-sans text-[9px] font-light uppercase tracking-[0.18em] transition-all",
                  active && "font-medium tracking-[0.22em] drop-shadow-[0_0_6px_hsl(var(--primary))]"
                )}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
