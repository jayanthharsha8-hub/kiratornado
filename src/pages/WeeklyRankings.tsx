import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Particles } from "@/components/Particles";
import { SystemPanel } from "@/components/SystemPanel";
import { playSound } from "@/hooks/useSound";

const ACCENT = "hsl(28 100% 55%)";

const WeeklyRankings = () => {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen pb-20 scanline">
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-2">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="rounded-sm border border-primary/40 p-1.5 text-primary hover:border-primary">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="font-display text-sm font-bold uppercase tracking-[0.22em]" style={{ color: ACCENT, textShadow: `0 0 10px ${ACCENT}` }}>
            [ Weekly Rankings ]
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-md space-y-3 px-3 pt-3">
        <SystemPanel title="Weekly Rankings">
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <Trophy className="h-12 w-12" style={{ color: ACCENT, filter: `drop-shadow(0 0 8px ${ACCENT})` }} />
            <p className="font-display text-lg font-black uppercase tracking-wider" style={{ color: ACCENT }}>
              Weekly Rewards
            </p>
            <p className="max-w-[18rem] text-xs text-muted-foreground">
              Compete each week to climb the rankings and earn exclusive coin rewards. Standings reset every Monday.
            </p>
            <span className="mt-2 rounded-sm border px-3 py-1 text-[10px] uppercase tracking-[0.24em]" style={{ borderColor: ACCENT, color: ACCENT }}>
              Coming Soon
            </span>
          </div>
        </SystemPanel>
      </main>
      <BottomNav />
    </div>
  );
};

export default WeeklyRankings;