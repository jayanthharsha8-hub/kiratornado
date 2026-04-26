import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, PlayCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
  }, [user]);

  const go = (path: string) => { playSound("tick"); navigate(path); };

  const addCoins = () => {
    playSound("tick");
    toast.info("Payment system coming soon", { description: "Add Coins via Razorpay will be available shortly." });
  };

  return (
    <div className="relative min-h-screen pb-24" style={{ background: "#05070d" }}>
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">Wallet</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-8 px-4 pt-8">
        {/* Balance */}
        <section className="text-center animate-float-up">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Total Coins</p>
          <p
            className="mt-2 font-display text-6xl font-black text-primary"
            style={{ textShadow: "0 0 18px hsl(var(--primary) / 0.55), 0 0 36px hsl(var(--primary) / 0.25)" }}
          >
            {coins}
          </p>
        </section>

        {/* Two action cards */}
        <section className="space-y-3">
          <button
            onClick={addCoins}
            className="flex w-full items-center gap-4 rounded-md border border-primary/40 bg-card/60 p-4 text-left transition hover:border-primary hover:glow-soft active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
              <Plus className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Add Coins</p>
              <p className="text-[11px] text-muted-foreground">Top up your wallet instantly</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary/70" />
          </button>

          <button
            onClick={() => go("/wallet/withdraw")}
            className="flex w-full items-center gap-4 rounded-md border border-primary/40 bg-card/60 p-4 text-left transition hover:border-primary hover:glow-soft active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded border border-primary/40 bg-primary/10 text-primary">
              <PlayCircle className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-widest text-foreground">Withdraw</p>
              <p className="text-[11px] text-muted-foreground">Redeem or UPI withdrawal</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary/70" />
          </button>
        </section>

        <p className="pt-2 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          All withdrawals reviewed by Admin
        </p>
      </main>

      <BottomNav />
    </div>
  );
};

export default WalletPage;
