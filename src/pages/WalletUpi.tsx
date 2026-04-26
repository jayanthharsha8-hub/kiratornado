import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Particles } from "@/components/Particles";
import { playSound } from "@/hooks/useSound";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AMOUNTS = [30, 50, 100];

const WalletUpi = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coins, setCoins] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [upi, setUpi] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("coins").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCoins(data.coins); });
  }, [user]);

  const submit = async () => {
    if (!user) return;
    if (selected == null) { toast.error("Select an amount"); return; }
    if (!upi.trim()) { toast.error("Enter UPI ID"); return; }
    if (coins < selected) { toast.error("Not enough coins. Earn more to withdraw."); return; }
    setBusy(true);

    const { error } = await (supabase.rpc as any)("request_withdrawal", {
      _amount: selected,
      _withdraw_type: "upi",
      _upi_id: upi.trim(),
      _upi_ref: null,
    });
    setBusy(false);
    if (error) {
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
          <h1 className="mx-auto font-display text-sm font-bold uppercase tracking-[0.35em] text-primary text-glow-soft">UPI Withdraw</h1>
          <span className="w-5" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 pt-8">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Available</p>
          <p className="font-display text-3xl font-black text-primary text-glow-soft">{coins} <span className="text-sm tracking-widest">COINS</span></p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">UPI ID</label>
          <input
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            placeholder="yourname@upi"
            className="w-full rounded-md border border-primary/40 bg-card/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />
        </div>

        <section>
          <h2 className="mb-3 text-center font-display text-xs font-bold uppercase tracking-[0.35em] text-foreground/80">Select Amount</h2>
          <div className="grid grid-cols-3 gap-3">
            {AMOUNTS.map(a => {
              const locked = coins < a;
              const active = selected === a;
              return (
                <button
                  key={a}
                  disabled={locked}
                  onClick={() => { playSound("tick"); setSelected(a); }}
                  className={`aspect-square rounded-md border font-display text-2xl font-black uppercase transition ${
                    locked
                      ? "border-muted/30 bg-card/30 text-muted-foreground/40"
                      : active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-primary/40 bg-card/60 text-foreground hover:border-primary"
                  }`}
                  style={active ? { boxShadow: "0 0 18px hsl(var(--primary) / 0.5)" } : undefined}
                >
                  {a}
                </button>
              );
            })}
          </div>
          {coins < 30 && (
            <p className="mt-4 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
              Not enough coins. Earn more to withdraw.
            </p>
          )}
        </section>

        <button
          onClick={submit}
          disabled={busy || selected == null}
          className="w-full rounded-md border border-primary/60 bg-primary/15 p-4 font-display text-sm font-bold uppercase tracking-[0.3em] text-primary transition hover:bg-primary/25 disabled:opacity-40"
          style={selected != null ? { boxShadow: "0 0 22px hsl(var(--primary) / 0.45)" } : undefined}
        >
          {busy ? "Sending..." : "Request Withdraw"}
        </button>
      </main>

      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-sm animate-float-up">
          <div className="mx-6 max-w-sm rounded-lg border border-primary/60 bg-card/90 p-6 text-center" style={{ boxShadow: "0 0 36px hsl(var(--primary) / 0.45)" }}>
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" style={{ filter: "drop-shadow(0 0 12px hsl(var(--primary) / 0.6))" }} />
            <h2 className="mt-4 font-display text-lg font-bold uppercase tracking-widest text-primary text-glow-soft">Request Submitted</h2>
            <p className="mt-2 text-sm text-muted-foreground">Withdrawal request submitted successfully.</p>
            <p className="mt-1 text-xs text-muted-foreground">Admin will verify and process within 3 hours.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletUpi;
