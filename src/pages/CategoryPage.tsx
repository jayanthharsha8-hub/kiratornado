import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Coins, Users, Shield, Copy, Lock, CheckCircle, Trophy, X, Swords } from "lucide-react";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { toast } from "sonner";
import battleRoyaleReference from "@/assets/battle-royale-reference.png";

interface Tournament {
  id: string; title: string; category: Category; entry_fee: number; total_slots: number;
  prize_pool: number; scheduled_at: string; room_id: string | null; room_password: string | null;
  status: string; notes: string | null; level_requirement: number; banner_url: string | null;
}

type Tab = "upcoming" | "live" | "completed";

const isBattleRoyale = (category: Category) => category === "battle_royale";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const cat = category as Category;
  const meta = CATEGORY_META[cat];

  useEffect(() => {
    if (!cat || !meta) return;
    setLoading(true);
    supabase
      .from("tournaments")
      .select("*")
      .eq("category", cat)
      .eq("status", tab as "upcoming" | "live" | "completed")
      .eq("published", true)
      .order("scheduled_at", { ascending: tab !== "completed" })
      .then(({ data }) => {
        setTournaments((data ?? []) as Tournament[]);
        setLoading(false);
      });
  }, [cat, tab]);

  if (!meta) return <div className="flex min-h-screen items-center justify-center text-xs uppercase tracking-[0.4em] text-primary text-glow">Invalid category</div>;

  if (isBattleRoyale(cat)) {
    return <BattleRoyalePage tab={tab} setTab={setTab} tournaments={tournaments} loading={loading} userId={user?.id} />;
  }

  return (
    <div className="relative min-h-screen scanline pb-10">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />

      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/home")} className="flex items-center gap-1 text-primary hover:text-glow-soft">
            <ArrowLeft className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">Back</span>
          </button>
          <span className="font-display text-[10px] uppercase tracking-[0.3em] text-primary/80">Arena</span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        <div className="animate-float-up text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-primary/80">[ Tournament Mode ]</p>
          <h1 className="font-display text-2xl font-black uppercase tracking-[0.2em] text-primary text-glow">{meta.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{meta.subtitle}</p>
        </div>

        <div className="flex gap-2 animate-float-up" style={{ animationDelay: "0.1s" }}>
          {(["upcoming", "live", "completed"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded border py-2.5 text-xs font-display uppercase tracking-[0.2em] transition-all ${
                tab === t
                  ? "border-primary bg-primary/20 text-primary text-glow glow-soft"
                  : "border-primary/30 bg-card/40 text-muted-foreground hover:border-primary/60 hover:text-primary"
              }`}
            >
              {t === "live" ? "Ongoing" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-xs uppercase tracking-[0.4em] text-primary text-glow animate-flicker">Loading...</div>
          </div>
        ) : tournaments.length === 0 ? (
          <SystemPanel title="No Tournaments">
            <p className="text-sm text-muted-foreground text-center py-4">
              No {tab} tournaments available. Check back soon, Hunter.
            </p>
          </SystemPanel>
        ) : (
          <div className="space-y-4">
            {tournaments.map((t, i) => (
              <TournamentCard key={t.id} tournament={t} index={i} userId={user?.id} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const BattleRoyalePage = ({ tab, setTab, tournaments, loading, userId }: { tab: Tab; setTab: (tab: Tab) => void; tournaments: Tournament[]; loading: boolean; userId?: string }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-3 py-3">
      <main className="mx-auto max-w-md">
        <section className="relative h-[200px] overflow-hidden rounded-2xl border border-royale-red-line shadow-[0_0_10px_hsl(var(--royale-red)/0.28)]">
          <img src={battleRoyaleReference} alt="Battle Royale" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-background/40" />
          <button
            onClick={() => navigate("/home")}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-foreground/65 bg-background/15 text-foreground shadow-[0_0_7px_hsl(var(--royale-red)/0.25)] transition active:scale-[0.97]"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute left-4 top-9 max-w-[58%]">
            <h1 className="font-display text-3xl font-black uppercase leading-[0.9] tracking-wide text-foreground drop-shadow-[0_0_8px_hsl(var(--royale-red)/0.45)]">
              Battle <span className="block text-royale-red">Royale</span>
            </h1>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.35em] text-foreground/80">Solo - 50 Players</p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-royale-red-line bg-background/45 px-3 py-2 shadow-[0_0_8px_hsl(var(--royale-red)/0.18)]">
              <Trophy className="h-5 w-5 text-royale-red" />
              <div className="leading-none">
                <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/75">Total Prize Pool</p>
                <p className="font-display text-base font-black text-royale-red">₹50,000</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {(["upcoming", "live", "completed"] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`h-12 rounded-lg border font-display text-[10px] font-black uppercase tracking-wider transition active:scale-[0.97] ${
                tab === item
                  ? "border-royale-red-line bg-royale-red-soft text-foreground shadow-[0_0_9px_hsl(var(--royale-red)/0.24)]"
                  : "border-royale-muted bg-transparent text-muted-foreground"
              }`}
            >
              {item === "live" ? "Ongoing" : item}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-xs uppercase tracking-[0.35em] text-royale-red">Loading...</div>
          ) : tournaments.length === 0 ? (
            <div className="rounded-xl border border-royale-muted bg-royale-panel p-5 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">No tournaments</div>
          ) : (
            tournaments.map((t) => <BattleRoyaleCard key={t.id} tournament={t} userId={userId} />)
          )}
        </div>
      </main>
    </div>
  );
};

const BattleRoyaleCard = ({ tournament: t, userId }: { tournament: Tournament; userId?: string }) => {
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(0);
  const date = new Date(t.scheduled_at);

  useEffect(() => {
    const loadData = async () => {
      const { count: c } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("tournament_id", t.id);
      setCount(c ?? 0);
      if (!userId) return;
      const { data: reg } = await supabase.from("registrations").select("id").eq("tournament_id", t.id).eq("user_id", userId).maybeSingle();
      setJoined(!!reg);
    };
    loadData();
  }, [t.id, userId]);

  const dateStr = date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <article className="min-h-[104px] rounded-xl border border-royale-red-line bg-royale-panel-soft p-3 shadow-[0_0_10px_hsl(var(--royale-red)/0.22)]">
      <div className="flex h-full items-center gap-3">
        <div className="flex h-16 w-12 shrink-0 items-center justify-center text-royale-red drop-shadow-[0_0_7px_hsl(var(--royale-red)/0.38)]">
          <Swords className="h-9 w-9" strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-black uppercase tracking-wide text-foreground">Battle Royale</h2>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-royale-red">Solo - 50 Players</p>
          <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" />
            <span className="truncate">{dateStr}</span>
            <span>•</span>
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{timeStr}</span>
          </div>
        </div>

        <div className="flex w-[92px] shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1 text-sm font-bold text-foreground">
            <Users className="h-4 w-4" />
            {count}/{t.total_slots}
          </div>
          <div className="grid w-full grid-cols-2 gap-1 text-right">
            <div>
              <p className="text-[8px] uppercase text-muted-foreground">Entry</p>
              <p className="text-[11px] font-bold text-foreground"><Coins className="mr-0.5 inline h-3 w-3 text-royale-red" />₹{t.entry_fee}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase text-muted-foreground">Prize</p>
              <p className="text-[11px] font-bold text-royale-red"><Trophy className="mr-0.5 inline h-3 w-3" />₹{t.prize_pool}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(joined ? `/tournament/${t.id}` : `/tournament-slots/${t.id}`)}
            disabled={!joined && (t.status !== "upcoming" || count >= t.total_slots)}
            className="h-8 rounded-lg bg-royale-red px-3 font-display text-[10px] font-black uppercase tracking-wide text-foreground shadow-[0_0_9px_hsl(var(--royale-red)/0.35)] transition active:scale-[0.97] disabled:opacity-55"
          >
            {joined ? "Joined" : "Join Now"}
          </button>
        </div>
      </div>
    </article>
  );
};

const TournamentCard = ({ tournament: t, index, userId }: { tournament: Tournament; index: number; userId?: string }) => {
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [count, setCount] = useState(0);

  const date = new Date(t.scheduled_at);

  useEffect(() => {
    loadData();
  }, [t.id, userId]);

  const loadData = async () => {
    const { count: c } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("tournament_id", t.id);
    setCount(c ?? 0);
    if (!userId) return;
    const { data: reg } = await supabase.from("registrations").select("id").eq("tournament_id", t.id).eq("user_id", userId).maybeSingle();
    setJoined(!!reg);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const formatTime12 = (d: Date) => {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  return (
    <div className="animate-float-up rounded border border-primary/50 bg-card/60 overflow-hidden glow-soft" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="relative h-40 overflow-hidden">
        <img src={t.banner_url || CATEGORY_META[t.category]?.image} alt={t.title} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary/80">[ {CATEGORY_META[t.category]?.title} ]</div>
          <h2 className="font-display text-lg font-black uppercase tracking-wider text-foreground text-glow">{t.title}</h2>
        </div>
        {joined && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded border border-primary/60 bg-primary/20 px-2 py-1 text-[10px] uppercase tracking-widest text-primary text-glow backdrop-blur">
            <CheckCircle className="h-3 w-3" /> Joined
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <InfoCell icon={<Calendar className="h-3.5 w-3.5" />} label="Date" value={date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })} />
          <InfoCell icon={<Clock className="h-3.5 w-3.5" />} label="Time" value={formatTime12(date)} />
          <InfoCell icon={<Coins className="h-3.5 w-3.5" />} label="Entry" value={t.entry_fee === 0 ? "FREE" : `${t.entry_fee} coins`} />
          <InfoCell icon={<Users className="h-3.5 w-3.5" />} label="Slots" value={`${count} / ${t.total_slots}`} />
        </div>

        <div className="flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">Level Requirement:</span>
          <span className="font-display text-primary text-glow-soft">{t.level_requirement}+</span>
        </div>

        <SystemPanel title="Instructions">
          <p className="text-xs text-foreground/85 leading-relaxed">
            After registering, wait for match time. We will send a notification before the match starts.
            If notifications are OFF, open the app and check manually.
          </p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            If player name is incorrect, you will be removed from the room and no coins will be refunded.
          </p>
        </SystemPanel>

        <div className="flex items-start gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-2.5">
          <Shield className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-primary/90 font-display uppercase tracking-wider">
              Do not share Room ID and Password with anyone!
            </p>
            <p className="text-xs text-muted-foreground">
              Hackers and cheaters will be permanently banned.
            </p>
          </div>
        </div>

        {/* Room Details (only for joined users) */}
        {joined && (
          <SystemPanel title="Room Details">
            <div className="space-y-2">
              <RoomRow label="Room ID" value={t.room_id} onCopy={copyToClipboard} />
              <RoomRow label="Password" value={t.room_password} onCopy={copyToClipboard} />
            </div>
          </SystemPanel>
        )}

        {!joined && t.status === "upcoming" && (
          <SystemPanel title="Room Details">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Join the match to unlock room details.
            </div>
          </SystemPanel>
        )}

        {joined && t.status === "upcoming" && (
          <div className="rounded border border-primary/40 bg-primary/10 px-4 py-3 text-center">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
              Joined -- Upcoming
            </p>
          </div>
        )}

        {/* Join button redirects to slots page */}
        {!joined && t.status === "upcoming" && count < t.total_slots && (
          <Button
            onClick={() => navigate(`/tournament-slots/${t.id}`)}
            className="h-14 w-full bg-primary font-display text-sm font-bold uppercase tracking-[0.3em] text-primary-foreground hover:bg-primary-glow animate-pulse-glow"
          >
            [ Join Now ]
          </Button>
        )}

        {!joined && count >= t.total_slots && t.status === "upcoming" && (
          <div className="rounded border border-destructive/40 bg-destructive/10 px-4 py-3 text-center">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-destructive">[ Slots Full ]</p>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoCell = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded border border-primary/30 bg-card/50 p-2.5">
    <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary/80">{icon}{label}</div>
    <div className="mt-1 text-sm text-foreground">{value}</div>
  </div>
);

const RoomRow = ({ label, value, onCopy }: { label: string; value: string | null; onCopy: (v: string, l: string) => void }) => (
  <div className="flex items-center justify-between rounded border border-primary/20 bg-background/40 px-3 py-2">
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-sm text-primary text-glow-soft mt-0.5">
        {value ? value : "Waiting for Admin..."}
      </div>
    </div>
    {value && (
      <button onClick={() => onCopy(value, label)} className="rounded border border-primary/30 bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition">
        <Copy className="h-3.5 w-3.5" />
      </button>
    )}
  </div>
);

export default CategoryPage;
