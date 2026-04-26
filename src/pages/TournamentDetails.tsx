import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, Clock, Coins, Users, Shield, Sparkles } from "lucide-react";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";

interface Tournament {
  id: string; title: string; category: Category; entry_fee: number; total_slots: number;
  prize_pool: number; scheduled_at: string; room_id: string | null; room_password: string | null;
  status: string; notes: string | null; level_requirement: number;
}

const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [t, setT] = useState<Tournament | null>(null);
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(0);
  const [joining, setJoining] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: tour } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
    if (tour) setT(tour as Tournament);
    if (user) {
      const { data: reg } = await supabase
        .from("registrations").select("id")
        .eq("tournament_id", id).eq("user_id", user.id).maybeSingle();
      setJoined(!!reg);
    }
    const { count: c } = await supabase
      .from("registrations").select("id", { count: "exact", head: true })
      .eq("tournament_id", id);
    setCount(c ?? 0);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, user]);

  if (!t) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#05070d" }}>
        <div className="text-xs uppercase tracking-[0.4em] text-primary animate-pulse">Loading…</div>
      </div>
    );
  }

  const meta = CATEGORY_META[t.category];
  const date = new Date(t.scheduled_at);
  const accent = meta.color;

  const dateStr = date.toLocaleDateString([], { day: "2-digit", month: "short" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const entryStr = t.entry_fee === 0 ? "FREE" : `${t.entry_fee} coins`;

  const handleJoinClick = async () => {
    if (!t || joined || joining) return;
    playSound("pulse");
    if (count >= t.total_slots) { toast.error("MATCH FULL"); return; }
    setJoining(true);
    const { error } = await (supabase.rpc as any)("join_tournament", { _tournament_id: t.id });
    setJoining(false);
    if (error) { toast.error(error.message || "Unable to join match"); return; }
    toast.success("JOINED");
    setJoined(true);
    setCount((value) => value + 1);
  };

  return (
    <div className="relative min-h-screen pb-12 animate-fade-in" style={{ background: "#05070d" }}>
      <Particles />

      {/* Top bar — minimal */}
      <header className="sticky top-0 z-30 bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button
            onClick={() => { playSound("tick"); navigate(-1); }}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/90 transition active:scale-95 hover:border-primary/50 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border"
            style={{
              borderColor: `${accent}66`,
              background: "rgba(255,255,255,0.03)",
              boxShadow: `0 0 8px ${accent}33`,
              color: accent,
            }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 pt-2">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-xl">
          <div className="relative h-44 w-full">
            <img
              src={meta.image}
              alt={meta.title}
              width={1024}
              height={512}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,7,13,0.55) 0%, rgba(5,7,13,0.85) 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h1
                className="font-display text-2xl font-black uppercase tracking-wider"
                style={{ color: accent, textShadow: `0 0 10px ${accent}88` }}
              >
                {meta.title}
              </h1>
              <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-foreground/80">{t.title}</p>
              <p className="mt-1 text-xs text-foreground/60">{meta.subtitle}</p>
            </div>
          </div>
        </section>

        {/* MATCH INFO — single airy block */}
        <section className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3.5">
          <div className="flex items-center justify-between text-[13px] text-foreground/90">
            <Cell icon={<Calendar className="h-3.5 w-3.5" />} value={dateStr} />
            <Dot />
            <Cell icon={<Clock className="h-3.5 w-3.5" />} value={timeStr} />
            <Dot />
            <Cell icon={<Coins className="h-3.5 w-3.5" />} value={entryStr} accent={accent} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] text-foreground/75">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 opacity-70" />
              <span>Slots: <span className="text-foreground">{count}/{t.total_slots}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 opacity-70" />
              <span>Level: <span className="text-foreground">{t.level_requirement}+</span></span>
            </div>
          </div>
        </section>

        {/* JOIN / JOINED */}
        {joined ? (
          <div className="space-y-1.5 text-center">
            <div
              className="mx-auto flex h-14 w-full items-center justify-center rounded-lg border font-display text-sm font-bold uppercase tracking-[0.3em] animate-pulse-glow"
              style={{
                borderColor: accent,
                color: accent,
                background: `${accent}14`,
                boxShadow: `0 0 18px ${accent}55, inset 0 0 12px ${accent}22`,
              }}
            >
              ✓ Joined
            </div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-foreground/60">Match starts soon</p>
          </div>
        ) : (
          <button
            onClick={handleJoinClick}
            disabled={count >= t.total_slots}
            className="h-14 w-full rounded-lg font-display text-sm font-bold uppercase tracking-[0.3em] text-background transition active:scale-[0.98] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
              boxShadow: `0 6px 20px ${accent}55`,
            }}
          >
            {joining ? "Joining..." : count >= t.total_slots ? "MATCH FULL" : "JOIN MATCH"}
          </button>
        )}

        {/* ROOM DETAILS — only after join */}
        {joined && (
          <section className="space-y-2.5 px-1">
            <h3 className="font-display text-[11px] uppercase tracking-[0.3em] text-foreground/70">Room Details</h3>
            <RoomLine label="Room ID" value={t.room_id} accent={accent} />
            <RoomLine label="Password" value={t.room_password} accent={accent} />
          </section>
        )}

        {/* INSTRUCTIONS */}
        <section className="space-y-2 px-1">
          <h3
            className="font-display text-[11px] uppercase tracking-[0.3em]"
            style={{ color: accent, textShadow: `0 0 8px ${accent}55` }}
          >
            Instructions
          </h3>
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-foreground/80">
            <li>• Enter the room 5 minutes before match time.</li>
            <li>• Use your registered in-game name only.</li>
            <li>• Room ID unlocks 10 minutes before match.</li>
            <li>• Match starts on time — be ready.</li>
          </ul>
        </section>

        {/* WARNING — thin border only */}
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-[12px] text-destructive/90">
          ⚠ Do not share room ID and password.
        </div>
      </main>
    </div>
  );
};

const Cell = ({ icon, value, accent }: { icon: React.ReactNode; value: string; accent?: string }) => (
  <div className="flex items-center gap-1.5" style={accent ? { color: accent } : undefined}>
    <span className="opacity-70">{icon}</span>
    <span className="font-display text-[12.5px] font-semibold tracking-wide">{value}</span>
  </div>
);

const Dot = () => <span className="h-1 w-1 rounded-full bg-foreground/25" />;

const RoomLine = ({ label, value, accent }: { label: string; value: string | null; accent: string }) => (
  <div className="flex items-center justify-between text-[13px]">
    <span className="text-foreground/65">{label}</span>
    {value ? (
      <span className="font-display tracking-wider" style={{ color: accent, textShadow: `0 0 6px ${accent}66` }}>
        {value}
      </span>
    ) : (
      <span className="flex items-center gap-1 text-foreground/55 italic">
        Waiting for Admin
        <span className="inline-flex">
          <span className="animate-pulse" style={{ animationDelay: "0ms" }}>.</span>
          <span className="animate-pulse" style={{ animationDelay: "200ms" }}>.</span>
          <span className="animate-pulse" style={{ animationDelay: "400ms" }}>.</span>
        </span>
      </span>
    )}
  </div>
);

export default TournamentDetails;
