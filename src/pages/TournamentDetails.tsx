import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, CalendarDays, Clock3, Coins, LockKeyhole, Trophy, Users } from "lucide-react";
import { CATEGORY_META, Category } from "@/lib/tournaments";
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
  const isFull = count >= t.total_slots;

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--royale-panel-soft)),hsl(var(--background))_62%)] pb-6 text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-3 py-3">
        <button
          onClick={() => { playSound("tick"); navigate(-1); }}
          aria-label="Back"
          className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-royale-muted bg-royale-panel/90 text-foreground/90 transition active:scale-[0.97]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <section className="overflow-hidden rounded-xl border border-royale-red-line bg-royale-panel shadow-[0_0_14px_hsl(var(--royale-red)_/_0.16)]">
          <div className="relative h-[200px]">
            <img src={meta.image} alt={meta.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/30 to-background/92" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-center">
              <h1 className="font-display text-[28px] font-black uppercase leading-none text-royale-red">
                Battle Royale
              </h1>
              <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-foreground/78">
                Solo - 50 Players
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-royale-muted bg-royale-panel/95 p-4">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-foreground/55">Tournament</p>
            <h2 className="mt-1 font-display text-lg font-black uppercase leading-tight text-foreground">{t.title}</h2>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <DetailBox icon={<Users />} label="Slots" value={`${count}/${t.total_slots}`} />
            <DetailBox icon={<Coins />} label="Entry" value={entryStr} highlight />
            <DetailBox icon={<Trophy />} label="Prize" value={`${t.prize_pool}`} highlight />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <InfoRow icon={<CalendarDays />} label="Date" value={dateStr} />
            <InfoRow icon={<Clock3 />} label="Time" value={timeStr} />
          </div>
        </section>

        {joined && (
          <section className="mt-4 rounded-xl border border-royale-red-line bg-royale-panel/95 p-4">
            <div className="mb-3 flex items-center gap-2 text-royale-red">
              <LockKeyhole className="h-4 w-4" />
              <h3 className="font-display text-xs font-black uppercase tracking-[0.2em]">Room Details</h3>
            </div>
            <RoomLine label="Room ID" value={t.room_id} />
            <RoomLine label="Password" value={t.room_password} />
          </section>
        )}

        <div className="mt-auto pt-4">
          {joined ? (
            <div className="flex h-13 min-h-[52px] w-full items-center justify-center rounded-lg border border-royale-red-line bg-royale-red-soft font-display text-sm font-black uppercase tracking-[0.24em] text-royale-red">
              Joined
            </div>
          ) : (
            <button
              onClick={handleJoinClick}
              disabled={isFull || joining}
              className="h-13 min-h-[52px] w-full rounded-lg bg-royale-red font-display text-sm font-black uppercase tracking-[0.24em] text-foreground shadow-[0_8px_18px_hsl(var(--royale-red)_/_0.28)] transition active:scale-[0.97] disabled:opacity-50"
            >
              {joining ? "Joining..." : isFull ? "Match Full" : "Join Now"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

const DetailBox = ({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) => (
  <div className="rounded-lg border border-royale-muted bg-background/45 px-2 py-3 text-center">
    <div className={highlight ? "mx-auto mb-1.5 flex justify-center text-royale-red" : "mx-auto mb-1.5 flex justify-center text-foreground/65"}>
      <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
    </div>
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/45">{label}</p>
    <p className={highlight ? "mt-1 font-display text-sm font-black uppercase text-royale-red" : "mt-1 font-display text-sm font-black uppercase text-foreground"}>{value}</p>
  </div>
);

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2 rounded-lg border border-royale-muted bg-background/35 px-3 py-2.5">
    <span className="text-foreground/55 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/42">{label}</p>
      <p className="truncate font-display text-xs font-bold uppercase text-foreground/90">{value}</p>
    </div>
  </div>
);

const RoomLine = ({ label, value }: { label: string; value: string | null }) => (
  <div className="flex items-center justify-between border-t border-royale-muted/70 py-2 text-[13px]">
    <span className="text-foreground/65">{label}</span>
    {value ? (
      <span className="font-display font-bold tracking-wider text-royale-red">
        {value}
      </span>
    ) : (
      <span className="text-foreground/45 italic">Waiting for Admin</span>
    )}
  </div>
);

export default TournamentDetails;
