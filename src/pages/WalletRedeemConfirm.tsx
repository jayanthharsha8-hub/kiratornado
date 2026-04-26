import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const genCode = () => {
  const seg = (n: number) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };
  return `${seg(5)}-${seg(5)}`;
};

const WalletRedeemConfirm = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const amount = Number(params.get("amount") || 0);
  const [coins, setCoins] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
  }, [user]);

  const confirm = async () => {
    if (!user || !amount) return;
    if (coins < amount) { toast.error("Not enough coins. Earn more to withdraw."); return; }
    setBusy(true);
    const code = genCode();

    // Deduct coins immediately
    const newCoins = coins - amount;
    const { error: upErr } = await supabase.from("profiles").update({ coins: newCoins }).eq("id", user.id);
    if (upErr) { setBusy(false); toast.error(upErr.message); return; }

    // Save withdrawal request
    const { error } = await supabase.from("wallet_requests").insert({
      user_id: user.id, type: "withdraw", amount, withdraw_type: "redeem", upi_ref: code,
    });

    setBusy(false);
    if (error) {
      // refund on insert failure
      await supabase.from("profiles").update({ coins }).eq("id", user.id);
      toast.error(error.message);
      return;
    }
    playSound("pulse");
    setSuccess(true);
    setTimeout(() => navigate("/wallet"), 2600);
  };

  return (
    <div className="relative min-h-screen pb-24" style={{ background: "#05070d" }}>
      <Particles />
      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <button onClick={() => { playSound("tick"); navigate(-1); }} className="text-primary"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">Confirm</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 pt-10">
        <div className="rounded-md border border-primary/40 bg-card/50 p-5 text-center space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Coins Selected</p>
            <p className="font-display text-3xl font-black text-foreground">{amount}</p>
          </div>
          <div className="h-px bg-primary/20" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Converted Value</p>
            <p className="font-display text-3xl font-black text-primary text-glow-soft">₹{amount}</p>
          </div>
        </div>

        <button
          onClick={confirm}
          disabled={busy}
          className="w-full rounded-md border border-primary/60 bg-primary/15 p-4 font-display text-sm font-bold uppercase tracking-[0.3em] text-primary transition hover:bg-primary/25 disabled:opacity-50"
          style={{ boxShadow: "0 0 22px hsl(var(--primary) / 0.4)" }}
        >
          {busy ? "Processing..." : "Confirm Withdrawal"}
        </button>

        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          Coins will be deducted instantly. Admin verifies within 3 hours.
        </p>
      </main>

      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm animate-float-up">
          <div className="mx-6 max-w-sm rounded-lg border border-primary/60 bg-card/90 p-6 text-center" style={{ boxShadow: "0 0 36px hsl(var(--primary) / 0.45)" }}>
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.6))" }} />
            <h2 className="mt-4 font-display text-lg font-bold uppercase tracking-widest text-primary text-glow-soft">Request Submitted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Withdrawal request submitted successfully.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Admin will verify and process within 3 hours.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletRedeemConfirm;
