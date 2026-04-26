import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const REASONS = [
  { value: "hacker", label: "Hacker / Cheater" },
  { value: "fake", label: "Fake Account" },
  { value: "wrong_uid", label: "Wrong UID" },
  { value: "misconduct", label: "Misconduct" },
] as const;

export const ReportDialog = ({
  open,
  onOpenChange,
  reportedUserId,
  reportedName,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  reportedUserId?: string;
  reportedName?: string;
}) => {
  const { user } = useAuth();
  const [playerName, setPlayerName] = useState(reportedName ?? "");
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!reason) { toast.error("Select a reason"); return; }
    if (!playerName.trim() && !reportedUserId) { toast.error("Enter player name"); return; }

    setBusy(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId ?? user.id,
      reason: reason as any,
      description: `Player: ${playerName.trim()}\n${description.trim()}`.slice(0, 1000),
    });
    setBusy(false);

    if (error) {
      if (error.message.includes("duplicate")) toast.error("Already reported this player");
      else toast.error(error.message);
      return;
    }
    toast.success("Report submitted. Admin will review.");
    setPlayerName(""); setReason(""); setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-primary/40 bg-background max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg uppercase tracking-widest text-destructive">Report Player</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!reportedUserId && (
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Player Name / UID</Label>
              <Input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter player name or UID" className="border-primary/30 bg-card" />
            </div>
          )}
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="border-primary/30 bg-card"><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Description (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} placeholder="Describe the issue..." className="border-primary/30 bg-card" rows={3} />
          </div>
          <Button onClick={submit} disabled={busy} className="w-full bg-destructive font-display text-xs uppercase tracking-widest text-destructive-foreground hover:bg-destructive/90">
            {busy ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
