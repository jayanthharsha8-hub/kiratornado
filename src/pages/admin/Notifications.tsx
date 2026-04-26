import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, Send } from "lucide-react";

interface Notif { id: string; title: string; message: string; created_at: string; }

export default function AdminNotifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    setNotifs((data as Notif[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!title.trim() || !message.trim()) { toast.error("Title and message required"); return; }
    setSending(true);
    await supabase.from("notifications").insert({ title: title.trim(), message: message.trim() });
    toast.success("Notification sent to all users");
    setTitle(""); setMessage(""); setSending(false); load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Notifications</h1>
        <p className="text-xs text-muted-foreground">Send push-style notifications to all players</p>
      </div>

      <SystemPanel title="Send Notification">
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Match starting soon…" className="border-primary/30 bg-card" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Room details are now available for Battle Royale #12" className="border-primary/30 bg-card" rows={3} />
          </div>
          <Button onClick={send} disabled={sending} className="gap-2 bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
            <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send to All"}
          </Button>
        </div>
      </SystemPanel>

      <SystemPanel title="Sent Notifications">
        {notifs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications sent yet</p>
        ) : (
          <div className="space-y-3">
            {notifs.map(n => (
              <div key={n.id} className="rounded border border-primary/20 bg-card/50 p-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="font-display text-sm font-bold text-foreground">{n.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-foreground/80">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </SystemPanel>
    </div>
  );
}
