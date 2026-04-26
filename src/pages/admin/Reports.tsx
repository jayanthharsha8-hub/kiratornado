import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Ban } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Report {
  id: string; reporter_id: string; reported_user_id: string;
  reason: string; description: string | null; status: string; created_at: string;
  reporter_name?: string; reported_name?: string;
}

export default function AdminReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("pending");

  const load = async () => {
    let q = supabase.from("reports").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    const reps = (data ?? []) as Report[];
    if (reps.length > 0) {
      const ids = [...new Set([...reps.map(r => r.reporter_id), ...reps.map(r => r.reported_user_id)])];
      const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", ids);
      const map = new Map((profiles ?? []).map(p => [p.id, p.username]));
      setReports(reps.map(r => ({ ...r, reporter_name: map.get(r.reporter_id), reported_name: map.get(r.reported_user_id) })));
    } else {
      setReports([]);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("reports").update({ status } as any).eq("id", id);
    toast.success(`Report ${status}`);
    load();
  };

  const banUser = async (userId: string) => {
    if (!user || !confirm("Ban this user? They will be blocked from login and tournaments.")) return;
    await supabase.from("bans").insert({ user_id: userId, reason: "Reported and banned by admin", banned_by: user.id });
    await supabase.from("profiles").update({ is_banned: true } as any).eq("id", userId);
    toast.success("User banned");
    load();
  };

  const statusColor = (s: string) => {
    if (s === "actioned") return "bg-green-500/20 text-green-400 border-green-500/50";
    if (s === "ignored") return "bg-muted text-muted-foreground";
    if (s === "reviewed") return "bg-blue-500/20 text-blue-400";
    return "bg-primary/20 text-primary border-primary/50";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Reports</h1>
        <p className="text-xs text-muted-foreground">Review and manage player reports</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["pending", "reviewed", "actioned", "ignored", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded border px-3 py-1 text-xs font-display uppercase tracking-widest ${filter === s ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground"}`}>{s}</button>
        ))}
      </div>

      <SystemPanel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporter</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.reporter_name ?? "Unknown"}</TableCell>
                  <TableCell className="text-xs font-medium text-primary">{r.reported_name ?? "Unknown"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{r.reason}</Badge></TableCell>
                  <TableCell><Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(r.id, "actioned")} className="h-8 w-8 text-green-400 hover:bg-green-500/10" title="Action taken"><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(r.id, "ignored")} className="h-8 w-8 text-muted-foreground hover:bg-muted" title="Ignore"><X className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => banUser(r.reported_user_id)} className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Ban user"><Ban className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No reports found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SystemPanel>
    </div>
  );
}
