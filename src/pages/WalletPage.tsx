import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, PlayCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";

const ADD_AMOUNTS = [30, 50, 100];

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
    const channel = supabase
      .channel(`wallet-balance-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, (payload) => {
        setCoins((payload.new as { coins: number }).coins);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const go = (path: string) => { playSound("tick"); navigate(path); };

  const addCoins = async (amount: number) => {
    if (!user) return;
    playSound("tick");
    const { error } = await supabase.from("wallet_requests").insert({ user_id: user.id, type: "add", amount });
    if (error) { toast.error(error.message); return; }
    toast.success("Coin request sent to admin");
  };

  return (
    <div className="relative min-h-screen pb-20 scanline">
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-3 py-2">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">Wallet</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-3 pt-4">
        {/* Balance */}
        <section className="text-center animate-float-up">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Total Coins</p>
          <p
            className="mt-1 font-display text-5xl font-black text-primary"
            style={{ textShadow: "0 0 18px hsl(var(--primary) / 0.55), 0 0 36px hsl(var(--primary) / 0.25)" }}
          >
            {coins}
          </p>
        </section>

        {/* Two action cards */}
        <section className="space-y-3">
          <div className="rounded-sm border border-primary/40 bg-card/60 p-3 glow-soft">
            <div className="flex items-center gap-3 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-primary/40 bg-primary/10 text-primary">
              <Plus className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-foreground">Add Coins</p>
              <p className="text-[11px] text-muted-foreground">Top up your wallet instantly</p>
            </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {ADD_AMOUNTS.map((amount) => (
                <button key={amount} onClick={() => addCoins(amount)} className="rounded-sm border border-primary/50 bg-primary/10 py-2 font-display text-xs font-bold text-primary transition hover:bg-primary/20 active:glow-soft">
                  +{amount}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => go("/wallet/withdraw")}
            className="flex w-full items-center gap-3 rounded-sm border border-primary/40 bg-card/60 p-3 text-left transition hover:border-primary hover:glow-soft active:scale-[0.99]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-primary/40 bg-primary/10 text-primary">
              <PlayCircle className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-foreground">Withdraw</p>
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
