import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { SystemPanel } from "@/components/SystemPanel";
import { SideMenu } from "@/components/SideMenu";

import { BottomNav } from "@/components/BottomNav";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Swords, Crosshair, Users, Skull, Menu, Crown, ChevronRight, UserRound } from "lucide-react";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import bannerShadowArmy from "@/assets/banner-shadow-army.jpg";
import bannerHunter from "@/assets/banner-hunter.jpg";
import bannerMonarch from "@/assets/banner-monarch.jpg";
import bannerArena from "@/assets/banner-arena.jpg";
import bannerFF from "@/assets/banner-ff.jpg";

const ICONS: Record<Category, JSX.Element> = {
  free_match: <Crosshair className="h-7 w-7" strokeWidth={2} />,
  battle_royale: <Swords className="h-7 w-7" strokeWidth={2} />,
  classic_squad: <Users className="h-7 w-7" strokeWidth={2} />,
  lone_wolf: <Skull className="h-7 w-7" strokeWidth={2} />,
};

const LIVE_COUNTS: Record<Category, number> = {
  free_match: 124,
  battle_royale: 36,
  classic_squad: 28,
  lone_wolf: 16,
};

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  
  const [playerName, setPlayerName] = useState("Hunter");
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins,player_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) { setCoins(data.coins); setPlayerName(data.player_name); } });
  }, [user]);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
    const t = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(t);
  }, [api]);

  const banners = [bannerShadowArmy, bannerHunter, bannerMonarch, bannerArena, bannerFF];

  return (
    <div className="relative min-h-screen pb-24" style={{ background: "#05070d" }}>
      <Particles />

      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <SideMenu>
            <button aria-label="Open menu" className="flex items-center gap-2" onClick={() => playSound("tick")}>
              <Logo size={32} withText />
              <Menu className="h-4 w-4 text-primary" />
            </button>
          </SideMenu>
          <button
            onClick={() => { playSound("tick"); navigate("/wallet"); }}
            className="flex items-center gap-2 rounded border border-primary/50 bg-card/60 px-3 py-1.5 text-primary transition hover:border-primary hover:glow-soft"
          >
            <Wallet className="h-4 w-4" />
            <span className="font-display text-sm font-bold text-glow-soft">{coins}</span>
            <span className="text-xs">coins</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        {/* Banner Carousel */}
        <section className="animate-float-up">
          <div
            className="relative overflow-hidden rounded-md border border-primary/60"
            style={{ boxShadow: "0 0 24px hsl(var(--primary) / 0.45)" }}
          >
            <Carousel setApi={setApi} opts={{ loop: true }}>
              <CarouselContent>
                {banners.map((src, i) => (
                  <CarouselItem key={i}>
                    <div className="relative h-44 w-full">
                      <img src={src} alt="Hunter banner" width={1280} height={640} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                      <div className="absolute inset-y-0 left-0 flex w-3/5 flex-col justify-center p-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-primary/90">[ System Welcome ]</p>
                        <h2 className="font-display text-xl font-black uppercase tracking-wider text-foreground text-glow">
                          WELCOME <span className="text-primary">HUNTER</span>
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Hunter <span className="text-primary">{playerName}</span> -- choose your arena.
                        </p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
          {/* Slider dots */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                onClick={() => { playSound("tick"); api?.scrollTo(i); }}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: current === i ? 22 : 8,
                  background: current === i ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.3)",
                  boxShadow: current === i ? "0 0 8px hsl(var(--primary))" : "none",
                }}
              />
            ))}
          </div>
        </section>

        {/* Tournament image cards */}
        <SystemPanel title="Tournaments">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(CATEGORY_META) as Category[]).map((c, idx) => {
              const meta = CATEGORY_META[c];
              const live = LIVE_COUNTS[c];
              return (
                <button
                  key={c}
                  onClick={() => { playSound("pulse"); navigate(`/category/${c}`); }}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-card text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] animate-float-up"
                  style={{
                    borderColor: meta.color,
                    boxShadow: `0 0 8px ${meta.colorSoft}, inset 0 0 14px ${meta.colorSoft}`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  {/* Top image area (~50%) */}
                  <div className="relative h-1/2 w-full overflow-hidden">
                    <img
                      src={meta.image}
                      alt={meta.title}
                      loading="lazy"
                      width={512}
                      height={256}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(180deg, ${meta.colorSoft} 0%, rgba(5,7,13,0.55) 60%, #05070d 100%)` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          color: meta.color,
                          background: `radial-gradient(circle, ${meta.colorSoft} 0%, transparent 70%)`,
                          filter: `drop-shadow(0 0 6px ${meta.color})`,
                        }}
                      >
                        {ICONS[c]}
                      </div>
                    </div>
                  </div>

                  {/* Bottom text area */}
                  <div className="flex h-1/2 flex-col items-center justify-center gap-1.5 px-2 pb-2 text-center">
                    <div
                      className="font-display text-[13px] font-black uppercase leading-tight tracking-wider text-foreground"
                      style={{ textShadow: `0 0 8px ${meta.color}` }}
                    >
                      {meta.title}
                    </div>
                    <div className="text-[10px] text-foreground/65">
                      {meta.subtitle}
                    </div>
                    <span
                      className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                      style={{
                        borderColor: meta.color,
                        color: meta.color,
                        backgroundColor: "rgba(5,7,13,0.55)",
                        boxShadow: `0 0 6px ${meta.colorSoft}`,
                      }}
                    >
                      <UserRound className="h-3 w-3" strokeWidth={2.2} />
                      Live: {live}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </SystemPanel>

        {/* Weekly Leaderboard CTA */}
        <button
          onClick={() => { playSound("pulse"); navigate("/leaderboard"); }}
          className="flex w-full items-center gap-3 rounded-lg border bg-card/50 p-4 text-left transition hover:scale-[1.01] active:scale-[0.99]"
          style={{
            borderColor: "#a855f7",
            boxShadow: "0 0 14px rgba(168,85,247,0.25)",
          }}
        >
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border"
            style={{
              borderColor: "#a855f7",
              color: "#a855f7",
              backgroundColor: "rgba(168,85,247,0.12)",
              boxShadow: "0 0 12px rgba(168,85,247,0.5)",
            }}
          >
            <Crown className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-display text-sm font-black uppercase tracking-widest text-foreground" style={{ textShadow: "0 0 8px rgba(168,85,247,0.6)" }}>
              Weekly Leaderboard
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Top 10 Hunters -- Rankings
            </div>
          </div>
          <ChevronRight className="h-5 w-5" style={{ color: "#a855f7" }} />
        </button>
      </main>

      
      <BottomNav />
    </div>
  );
};

export default Home;
