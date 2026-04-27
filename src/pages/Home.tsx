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
  free_match: <Crosshair className="h-5 w-5" strokeWidth={2} />,
  battle_royale: <Swords className="h-5 w-5" strokeWidth={2} />,
  classic_squad: <Users className="h-5 w-5" strokeWidth={2} />,
  lone_wolf: <Skull className="h-5 w-5" strokeWidth={2} />,
};

const randomLiveCounts = () => ({
  free_match: Math.floor(Math.random() * 151) + 50,
  battle_royale: Math.floor(Math.random() * 151) + 50,
  classic_squad: Math.floor(Math.random() * 151) + 50,
  lone_wolf: Math.floor(Math.random() * 151) + 50,
}) as Record<Category, number>;

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coins, setCoins] = useState(0);
  
  const [playerName, setPlayerName] = useState("Hunter");
  const [liveCounts, setLiveCounts] = useState<Record<Category, number>>(randomLiveCounts);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins,player_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) { setCoins(data.coins); setPlayerName(data.player_name); } });
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setLiveCounts(randomLiveCounts()), 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
    const t = setInterval(() => api.scrollNext(), 5000);
    return () => clearInterval(t);
  }, [api]);

  const banners = [bannerShadowArmy, bannerHunter, bannerMonarch, bannerArena, bannerFF];

  return (
    <div className="relative min-h-screen pb-20 scanline">
      <Particles />

      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-3 py-2">
          <SideMenu>
            <button aria-label="Open menu" className="flex items-center gap-2" onClick={() => playSound("tick")}>
              <Logo size={32} withText />
              <Menu className="h-4 w-4 text-primary" />
            </button>
          </SideMenu>
          <button
            onClick={() => { playSound("tick"); navigate("/wallet"); }}
            className="flex items-center gap-1.5 rounded-sm border border-primary/50 bg-card/60 px-2 py-1 text-primary transition hover:border-primary hover:glow-soft"
          >
            <Wallet className="h-4 w-4" />
            <span className="font-display text-xs font-bold text-glow-soft">{coins}</span>
            <span className="text-[10px]">coins</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-3 px-3 pt-3">
        {/* Banner Carousel */}
         <section className="animate-float-up">
          <div
             className="relative overflow-hidden rounded-sm border border-primary/60 glow-soft"
          >
            <Carousel setApi={setApi} opts={{ loop: true }}>
              <CarouselContent>
                {banners.map((src, i) => (
                  <CarouselItem key={i}>
                     <div className="relative h-28 w-full sm:h-32">
                       <img src={src} alt="Hunter banner" width={1280} height={640} className="h-full w-full object-cover contrast-125 brightness-110" />
                      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                       <div className="absolute inset-y-0 left-0 flex w-2/3 flex-col justify-center p-3">
                         <p className="text-[9px] uppercase tracking-[0.24em] text-primary/90">[ System Welcome ]</p>
                         <h2 className="font-display text-base font-black uppercase tracking-wider text-foreground text-glow">
                          WELCOME <span className="text-primary">HUNTER</span>
                        </h2>
                         <p className="mt-1 text-[11px] text-muted-foreground">
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
          <div className="mt-2 flex items-center justify-center gap-1.5">
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
           <div className="grid grid-cols-2 gap-2">
            {(Object.keys(CATEGORY_META) as Category[]).map((c, idx) => {
              const meta = CATEGORY_META[c];
              const live = liveCounts[c];
              return (
                <button
                  key={c}
                  onClick={() => { playSound("pulse"); navigate(`/category/${c}`); }}
                  className="group relative aspect-square overflow-hidden rounded-sm border bg-card text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.97] animate-float-up"
                  style={{
                     borderColor: "hsl(var(--primary) / 0.7)",
                     boxShadow: "0 0 8px hsl(var(--primary) / 0.22), inset 0 0 14px hsl(var(--primary) / 0.06)",
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  {/* Top image area (~50%) */}
                  <div className="relative h-[44%] w-full overflow-hidden">
                    <img
                      src={meta.image}
                      alt={meta.title}
                      loading="lazy"
                      width={512}
                      height={256}
                      className="absolute inset-0 h-full w-full object-cover brightness-110 contrast-125 saturate-125 transition duration-500 group-hover:scale-110"
                    />
                    <div
                      className="absolute inset-0"
                       style={{ background: "linear-gradient(180deg, hsl(var(--primary) / 0.26) 0%, hsl(var(--background) / 0.62) 60%, hsl(var(--background)) 100%)" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <div className="flex h-9 w-9 items-center justify-center text-primary" style={{ filter: "brightness(1.15) drop-shadow(0 0 7px hsl(var(--primary) / 0.75))" }}>
                        {ICONS[c]}
                      </div>
                    </div>
                  </div>

                  {/* Bottom text area */}
                   <div className="flex h-[56%] flex-col items-center justify-center gap-1 px-2 pb-2 text-center">
                    <div
                       className="font-display text-[11px] font-black uppercase leading-tight tracking-wider text-foreground"
                      style={{ textShadow: "0 0 8px hsl(var(--primary) / 0.72)" }}
                    >
                      {meta.title}
                    </div>
                    <span
                       key={live}
                        className="mt-1 inline-flex items-center gap-1 rounded-sm border border-primary/70 bg-background/60 px-1.5 py-0.5 text-[9px] font-semibold text-primary transition animate-float-up"
                      style={{
                        boxShadow: "0 0 6px hsl(var(--primary) / 0.24)",
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
          className="flex w-full items-center gap-2 rounded-sm border border-primary/40 bg-card/50 p-3 text-left transition hover:scale-[1.005] active:scale-[0.99] glow-soft"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-primary/50 bg-primary/10 text-primary glow-soft"
          >
            <Crown className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-display text-xs font-black uppercase tracking-widest text-foreground text-glow-soft">
              Weekly Leaderboard
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Top 10 Hunters -- Rankings
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-primary" />
        </button>
      </main>

      
      <BottomNav />
    </div>
  );
};

export default Home;
