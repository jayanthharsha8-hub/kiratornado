import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Trophy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

interface LeaderboardEntry {
  id: string;
  player_name: string;
  kills: number;
  rank_label: string;
  rank_position: number;
  week_start: string;
}

const RANK_COLORS: Record<string, string> = {
  S: "text-yellow-400 border-yellow-400/60 bg-yellow-400/10",
  A: "text-purple-400 border-purple-400/60 bg-purple-400/10",
  B: "text-blue-400 border-blue-400/60 bg-blue-400/10",
  C: "text-green-400 border-green-400/60 bg-green-400/10",
  D: "text-orange-400 border-orange-400/60 bg-orange-400/10",
  E: "text-muted-foreground border-muted bg-muted/20",
};

const Leaderboard = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("leaderboard_entries")
      .select("*")
      .order("rank_position", { ascending: true })
      .limit(10)
      .then(({ data }) => {
        setEntries((data as LeaderboardEntry[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="relative min-h-screen scanline pb-24">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />

      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/home")} className="flex items-center gap-1 text-primary hover:text-glow-soft">
            <ArrowLeft className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">Back</span>
          </button>
          <Logo size={28} />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        <div className="animate-float-up text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-primary/80">[ Hunter Rankings ]</p>
          <h1 className="font-display text-2xl font-black uppercase tracking-[0.2em] text-primary text-glow">Weekly Leaderboard</h1>
        </div>

        {/* Rewards Banner */}
        <div className="animate-float-up rounded border border-primary/50 bg-card/60 p-4 glow-soft" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Weekly Leaderboard Rewards</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-yellow-400/40 bg-yellow-400/5 p-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-yellow-400">Rank 1</div>
              <div className="font-display text-lg font-bold text-yellow-400">100 coins</div>
            </div>
            <div className="rounded border border-purple-400/40 bg-purple-400/5 p-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-purple-400">Rank 2</div>
              <div className="font-display text-lg font-bold text-purple-400">30 coins</div>
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-xs uppercase tracking-[0.4em] text-primary text-glow animate-flicker">Loading...</div>
          </div>
        ) : entries.length === 0 ? (
          <SystemPanel title="No Rankings">
            <p className="text-sm text-muted-foreground text-center py-4">No leaderboard data this week. Check back soon, Hunter.</p>
          </SystemPanel>
        ) : (
          <div className="space-y-2 animate-float-up" style={{ animationDelay: "0.2s" }}>
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded border p-3 transition-all ${
                  i === 0 ? "border-yellow-400/60 bg-yellow-400/5 glow-soft" :
                  i === 1 ? "border-purple-400/40 bg-purple-400/5" :
                  i === 2 ? "border-blue-400/40 bg-blue-400/5" :
                  "border-primary/20 bg-card/40"
                }`}
              >
                {/* Rank Badge */}
                <div className={`flex h-10 w-10 items-center justify-center rounded border font-display text-sm font-bold ${RANK_COLORS[entry.rank_label] || RANK_COLORS.E}`}>
                  {entry.rank_label}
                </div>

                {/* Position */}
                <div className="flex h-8 w-8 items-center justify-center font-display text-lg font-bold text-foreground">
                  #{entry.rank_position}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-sm font-bold text-foreground truncate">{entry.player_name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{entry.rank_label} Rank</div>
                </div>

                {/* Kills */}
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-primary text-glow-soft">{entry.kills}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Kills</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Leaderboard;
