import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gift, Send, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";

const WalletWithdraw = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
  }, [user]);

  const go = (path: string) => { playSound("tick"); navigate(path); };

  return (
    <div className="relative min-h-screen pb-24" style={{ background: "#05070d" }}>
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">Withdraw</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-4 pt-8">
        <section className="text-center animate-float-up">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Available</p>
          <p
            className="mt-2 font-display text-5xl font-black text-primary"
            style={{ textShadow: "0 0 16px hsl(var(--primary) / 0.5)" }}
          >
            {coins}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">coins</p>
        </section>

        <section className="space-y-3">
          <button
            onClick={() => go("/wallet/redeem")}
            className="flex w-full items-center gap-4 rounded-md border border-primary/40 bg-card/60 p-4 text-left transition hover:border-primary hover:glow-soft active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
              <Gift className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Redeem Code</p>
              <p className="text-[11px] text-muted-foreground">Generate a redeem code</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary/70" />
          </button>

          <button
            onClick={() => go("/wallet/upi")}
            className="flex w-full items-center gap-4 rounded-md border border-primary/40 bg-card/60 p-4 text-left transition hover:border-primary hover:glow-soft active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
              <Send className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-foreground">UPI Withdraw</p>
              <p className="text-[11px] text-muted-foreground">Send to your UPI ID</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary/70" />
          </button>
        </section>
      </main>
    </div>
  );
};

export default WalletWithdraw;
