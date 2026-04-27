import { NavLink, useLocation } from "react-router-dom";
import { Home, Swords, Wallet, User } from "lucide-react";
import { playSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/tournaments", label: "Tournaments", icon: Swords },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/40 bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 items-stretch px-1 py-1">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to === "/wallet" && location.pathname.startsWith("/wallet"));
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => playSound("tick")}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1.5 transition-all duration-200 active:scale-[0.97]",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute inset-x-2 -top-px h-px bg-primary glow-soft" />
              )}
              <Icon
                className={cn("h-4 w-4 transition-transform", active && "scale-105 text-glow-soft drop-shadow-[0_0_8px_hsl(var(--primary))]")}
              />
              <span className="font-display text-[8px] font-bold uppercase tracking-wider">{label}</span>
            </NavLink>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
