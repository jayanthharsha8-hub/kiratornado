import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, PlayCircle, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Particles } from "@/components/Particles";
import { BottomNav } from "@/components/BottomNav";
import { TransactionList, type WalletTransaction } from "@/components/TransactionList";
import { playSound } from "@/hooks/useSound";
import { toast } from "sonner";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
    (supabase.from("transactions" as any) as any)
      .select("id,type,amount,message,status,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }: { data: WalletTransaction[] | null }) => setTransactions(data ?? []));
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

        <section className="grid grid-cols-2 gap-3">
          <button onClick={() => addCoins(30)} className="flex h-14 items-center justify-center gap-2 border border-primary/70 bg-transparent font-display text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/5 active:scale-[0.97] active:glow-soft">
            <Plus className="h-4 w-4" /> Add Coins
          </button>
          <button onClick={() => go("/wallet/withdraw")} className="flex h-14 items-center justify-center gap-2 border border-primary/70 bg-transparent font-display text-xs font-bold uppercase tracking-widest text-primary transition hover:bg-primary/5 active:scale-[0.97] active:glow-soft">
            <PlayCircle className="h-4 w-4" /> Withdraw
          </button>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">HISTORY HERE</h2>
            <button onClick={() => go("/wallet/history")} className="flex items-center gap-1 text-xs text-primary">View All <ChevronRight className="h-3 w-3" /></button>
          </div>
          <TransactionList items={transactions} />
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
