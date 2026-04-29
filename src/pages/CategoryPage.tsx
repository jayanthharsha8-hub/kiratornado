import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Calendar, Clock, Coins, Users, Shield, Copy, Lock, CheckCircle, Trophy, Swords } from "lucide-react";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { toast } from "sonner";

interface Tournament {
  id: string; title: string; category: Category; entry_fee: number; total_slots: number;
  prize_pool: number; scheduled_at: string; room_id: string | null; room_password: string | null;
  status: string; notes: string | null; level_requirement: number; banner_url: string | null;
}

type Tab = "upcoming" | "live" | "completed";

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageBannerUrl, setPageBannerUrl] = useState<string | null>(null);

  const cat = category as Category;
  const meta = CATEGORY_META[cat];

  useEffect(() => {
    if (!cat || !meta) return;
    (async () => {
      setLoading(true);
      const [{ data }, { data: pageBanner }] = await Promise.all([
        supabase
          .from("tournaments")
          .select("*")
          .eq("category", cat)
          .eq("status", tab as "upcoming" | "live" | "completed")
          .eq("published", true)
          .order("scheduled_at", { ascending: tab !== "completed" }),
        (supabase as any).from("tournament_page_banners").select("banner_image_url").eq("category", cat).maybeSingle(),
      ]);
      setPageBannerUrl(pageBanner?.banner_image_url ?? null);
        setTournaments((data ?? []) as Tournament[]);
        setLoading(false);
    })();
  }, [cat, tab]);

  if (!meta) return <div className="flex min-h-screen items-center justify-center text-xs uppercase tracking-[0.4em] text-primary text-glow">Invalid category</div>;

  return (
    <div className="relative min-h-screen scanline pb-10">
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
        <section className="animate-float-up overflow-hidden rounded-sm border bg-card/50" style={{ borderColor: meta.color, boxShadow: `0 0 14px ${meta.colorSoft}` }}>
          <div className="relative aspect-[16/6] w-full">
            {pageBannerUrl ? (
              <img src={pageBannerUrl} alt={`${meta.title} banner`} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-card text-xs uppercase tracking-[0.3em] text-muted-foreground">No Banner</div>
            )}
          </div>
        </section>

        <div className="animate-float-up text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-primary/80">[ Tournament Mode ]</p>
          <h1 className="font-display text-2xl font-black uppercase tracking-[0.2em]" style={{ color: meta.color, textShadow: `0 0 10px ${meta.colorSoft}` }}>{meta.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{meta.subtitle}</p>
        </div>

        <div className="flex gap-2 animate-float-up" style={{ animationDelay: "0.1s" }}>
          {(["upcoming", "live", "completed"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded border py-2.5 text-xs font-display uppercase tracking-[0.2em] transition-all ${
                tab === t
                  ? "text-glow glow-soft"
                  : "bg-card/40 text-muted-foreground"
              }`}
              style={{ borderColor: tab === t ? meta.color : `${meta.color}55`, backgroundColor: tab === t ? meta.colorSoft : undefined, color: tab === t ? meta.color : undefined }}
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
        <img src={t.banner_url || banner} alt={t.title} className="h-full w-full object-cover" loading="lazy" />
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
