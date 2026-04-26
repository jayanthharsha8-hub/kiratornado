import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SystemPanel } from "@/components/SystemPanel";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const TournamentSlots = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<any>(null);
  const [filledSlots, setFilledSlots] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [profile, setProfile] = useState<{ coins: number; player_level: number } | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    loadData();
  }, [id, user]);

  const loadData = async () => {
    if (!id || !user) return;
    const { data: t } = await supabase.from("tournaments").select("*").eq("id", id).maybeSingle();
    if (!t) { navigate("/home"); return; }
    setTournament(t);

    const { count } = await supabase.from("registrations").select("id", { count: "exact", head: true }).eq("tournament_id", id);
    setFilledSlots(count ?? 0);

    const { data: reg } = await supabase.from("registrations").select("id").eq("tournament_id", id).eq("user_id", user.id).maybeSingle();
    if (reg) { setJoined(true); }

    const { data: prof } = await supabase.from("profiles").select("coins,player_level").eq("id", user.id).maybeSingle();
    if (prof) setProfile(prof);
  };

  const joinSlot = async () => {
    if (!user || !tournament || !selectedSlot || joined) return;
    if (profile && profile.player_level < tournament.level_requirement) {
      toast.error(`Level ${tournament.level_requirement}+ required to join.`);
      return;
    }
    setJoining(true);

    const { error } = await (supabase.rpc as any)("join_tournament", { _tournament_id: tournament.id });
    setJoining(false);
    if (error) {
      toast.error(error.message || "Unable to join tournament.");
      return;
    }
    toast.success("Slot secured. Good luck, Hunter.", {
      style: { background: "hsl(var(--card))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary))", boxShadow: "0 0 18px hsl(var(--primary) / 0.55)" },
    });
    setJoined(true);
    setTimeout(() => navigate(-1), 900);
  };

  if (!tournament) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xs uppercase tracking-[0.4em] text-primary text-glow animate-flicker">Loading...</div>
      </div>
    );
  }

  const totalSlots = tournament.total_slots;
  const filledArr = Array.from({ length: filledSlots }, (_, i) => i + 1);

  return (
    <div className="relative min-h-screen scanline pb-10">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: 'var(--gradient-glow)' }} />

      <header className="sticky top-0 z-30 border-b border-primary/30 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary hover:text-glow-soft">
            <ArrowLeft className="h-4 w-4" /><span className="text-xs uppercase tracking-widest">Back</span>
          </button>
          <Logo size={28} />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-5 px-4 pt-5">
        <div className="animate-float-up text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-primary/80">[ Select Slot ]</p>
          <h1 className="font-display text-xl font-black uppercase tracking-[0.2em] text-primary text-glow">{tournament.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{filledSlots} / {totalSlots} slots filled</p>
        </div>

        {joined ? (
          <SystemPanel title="Status">
            <div className="rounded border border-primary/40 bg-primary/10 px-4 py-3 text-center">
              <p className="font-display text-sm uppercase tracking-[0.2em] text-primary text-glow">
                Joined -- Upcoming
              </p>
            </div>
          </SystemPanel>
        ) : (
          <>
            <SystemPanel title="Available Slots">
              <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                {Array.from({ length: totalSlots }, (_, i) => i + 1).map((slot) => {
                  const filled = filledArr.includes(slot);
                  const selected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      disabled={filled}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded border py-3 text-xs font-display uppercase tracking-widest transition-all ${
                        filled
                          ? "border-destructive/30 bg-destructive/10 text-destructive/50 cursor-not-allowed"
                          : selected
                          ? "border-primary bg-primary/30 text-primary text-glow glow-soft"
                          : "border-primary/30 bg-card/40 text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {filled ? `Slot ${slot} [Filled]` : `Slot ${slot}`}
                    </button>
                  );
                })}
              </div>
            </SystemPanel>

            {selectedSlot && (
              <div className="animate-float-up space-y-3">
                <SystemPanel title="Confirm Join">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-primary/20 pb-1">
                      <span className="text-muted-foreground">Selected Slot</span>
                      <span className="text-primary text-glow-soft">Slot {selectedSlot}</span>
                    </div>
                    {tournament.entry_fee > 0 && (
                      <div className="flex justify-between border-b border-primary/20 pb-1">
                        <span className="text-muted-foreground">Entry Fee</span>
                        <span className="text-primary text-glow-soft">{tournament.entry_fee} coins</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Balance</span>
                      <span className="text-primary text-glow-soft">{profile?.coins ?? 0} coins</span>
                    </div>
                  </div>
                </SystemPanel>

                <Button
                  onClick={joinSlot}
                  disabled={joining}
                  className="h-14 w-full bg-primary font-display text-sm font-bold uppercase tracking-[0.3em] text-primary-foreground hover:bg-primary-glow animate-pulse-glow"
                >
                  {joining ? "Joining..." : `[ Confirm Slot ${selectedSlot} ]`}
                </Button>

                <button
                  onClick={() => setSelectedSlot(null)}
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}

        {/* Warnings */}
        <SystemPanel title="Instructions">
          <p className="text-xs text-foreground/85 leading-relaxed">
            After registering, wait for match time. We will send a notification before the match starts.
            If notifications are OFF, open the app and check manually.
          </p>
        </SystemPanel>

        <SystemPanel title="Security Notice">
          <div className="space-y-2 text-xs text-foreground/85">
            <p>Do not share Room ID and Password with anyone.</p>
            <p>If player name is incorrect, you will be removed from the room and no coins will be refunded.</p>
            <p className="text-primary/90 font-display uppercase tracking-wider">Hackers and cheaters will be permanently banned.</p>
          </div>
        </SystemPanel>
      </main>
    </div>
  );
};

export default TournamentSlots;
