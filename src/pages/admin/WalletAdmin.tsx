import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Plus, Minus, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type WalletReq = Tables<"wallet_requests">;
type Profile = Tables<"profiles">;

export default function AdminWallet() {
  const [requests, setRequests] = useState<(WalletReq & { username?: string })[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [players, setPlayers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    let q = supabase.from("wallet_requests").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as "pending" | "approved" | "rejected");
    const { data } = await q;
    const reqs = (data ?? []) as WalletReq[];
    if (reqs.length > 0) {
      const userIds = [...new Set(reqs.map(r => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
      const map = new Map((profiles ?? []).map(p => [p.id, p.username]));
      setRequests(reqs.map(r => ({ ...r, username: map.get(r.user_id) })));
    } else {
      setRequests([]);
    }
  };

  const loadPlayers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setPlayers((data ?? []) as Profile[]);
  };

  useEffect(() => { load(); }, [filter]);
  useEffect(() => { loadPlayers(); }, []);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p =>
      p.username?.toLowerCase().includes(q) ||
      p.player_name?.toLowerCase().includes(q) ||
      p.ff_uid?.toLowerCase().includes(q)
    );
  }, [players, search]);

  const adjustCoins = async (p: Profile, delta: number) => {
    const raw = amounts[p.id];
    const amt = Number(raw);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setBusyId(p.id);
    const { error } = await (supabase.rpc as any)("admin_adjust_coins", { _user_id: p.id, _amount: amt, _direction: delta });
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${delta > 0 ? "Added" : "Removed"} ${amt} coins — ${p.username}`);
    setAmounts(a => ({ ...a, [p.id]: "" }));
    loadPlayers();
  };
  const handle = async (req: WalletReq, action: "approved" | "rejected") => {
    const { error } = await (supabase.rpc as any)("admin_handle_wallet_request", { _request_id: req.id, _status: action });
    if (error) { toast.error(error.message); return; }
    toast.success(`Request ${action}`);
    load();
  };

  const statusColor = (s: string) => {
    if (s === "approved") return "bg-green-500/20 text-green-400 border-green-500/50";
    if (s === "rejected") return "bg-destructive/20 text-destructive";
    return "bg-primary/20 text-primary border-primary/50";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Wallet Requests</h1>
        <p className="text-xs text-muted-foreground">Approve or reject coin add/withdraw requests</p>
      </div>

      <div className="flex gap-2">
        {["pending", "approved", "rejected", "all"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded border px-3 py-1 text-xs font-display uppercase tracking-widest ${filter === s ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground"}`}>{s}</button>
        ))}
      </div>

      <SystemPanel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>UPI ID</TableHead>
                <TableHead>UPI Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.username ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={r.type === "add" ? "text-green-400" : "text-orange-400"}>{r.type}</Badge></TableCell>
                  <TableCell>{r.amount} ⟁</TableCell>
                  <TableCell className="text-xs">{r.upi_id ?? "—"}</TableCell>
                  <TableCell className="text-xs">{r.upi_ref ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handle(r, "approved")} className="h-8 w-8 text-green-400 hover:bg-green-500/10"><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handle(r, "rejected")} className="h-8 w-8 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No requests found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SystemPanel>

      {/* Direct Coin Control */}
      <div>
        <h2 className="font-display text-xl font-bold uppercase tracking-widest text-primary text-glow">Player Coin Control</h2>
        <p className="text-xs text-muted-foreground">Add or remove coins instantly from any player wallet</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username, name or UID"
          className="border-primary/40 bg-input/60 pl-9"
        />
      </div>

      <SystemPanel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>UID</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Coins</TableHead>
                <TableHead className="w-[280px] text-right">Adjust</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.player_name}</div>
                    <div className="text-[10px] text-muted-foreground">@{p.username}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.ff_uid || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="border-primary/40 text-primary">Lv {p.player_level}</Badge></TableCell>
                  <TableCell className="font-display text-primary text-glow">{p.coins} ⟁</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Input
                        type="number"
                        min={1}
                        value={amounts[p.id] ?? ""}
                        onChange={(e) => setAmounts(a => ({ ...a, [p.id]: e.target.value }))}
                        placeholder="0"
                        className="h-8 w-20 border-primary/40 bg-input/60 text-right"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={busyId === p.id}
                        onClick={() => adjustCoins(p, +1)}
                        className="h-8 w-8 text-green-400 hover:bg-green-500/10"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={busyId === p.id}
                        onClick={() => adjustCoins(p, -1)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPlayers.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No players found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SystemPanel>
    </div>
  );
}
