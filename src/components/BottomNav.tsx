import { NavLink, useLocation } from "react-router-dom";
import { Home, Swords, Trophy, Wallet, User } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/tournaments", label: "Tournaments", icon: Swords },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/20 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2 py-1.5">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to === "/wallet" && location.pathname.startsWith("/wallet"));
          const accent = "#a855f7";
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => playSound("tick")}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 rounded px-2 py-2 transition-all duration-200",
                active ? "" : "text-muted-foreground hover:text-foreground"
              )}
              style={active ? { color: accent } : undefined}
            >
              {active && (
                <span className="absolute inset-x-3 -top-px h-px" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
              )}
              <Icon
                className={cn("h-5 w-5 transition-transform", active && "scale-110")}
                style={active ? { filter: `drop-shadow(0 0 6px ${accent})` } : undefined}
              />
              <span className="font-display text-[9px] font-bold uppercase tracking-widest">{label}</span>
            </NavLink>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
