import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Key } from "lucide-react";
import { CATEGORY_META, Category } from "@/lib/tournaments";
import type { Tables } from "@/integrations/supabase/types";

type Tournament = Tables<"tournaments">;

const CATEGORIES: Category[] = ["free_match", "battle_royale", "classic_squad", "lone_wolf"];
const STATUSES = ["upcoming", "live", "completed", "cancelled"] as const;

const empty = {
  title: "", category: "free_match" as Category, entry_fee: 0, total_slots: 50,
  prize_pool: 0, scheduled_at: "", level_requirement: 1, published: false, status: "upcoming" as const,
};

export default function AdminTournaments() {
  const [list, setList] = useState<Tournament[]>([]);
  const [open, setOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [roomForm, setRoomForm] = useState({ id: "", room_id: "", room_password: "" });
  const [slotsTournament, setSlotsTournament] = useState<Tournament | null>(null);
  const [regs, setRegs] = useState<{ id: string; user_id: string; username: string }[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = async () => {
    let q = supabase.from("tournaments").select("*").order("scheduled_at", { ascending: false });
    if (filterStatus !== "all") q = q.eq("status", filterStatus as "upcoming" | "live" | "completed" | "cancelled");
    const { data } = await q;
    setList((data as Tournament[]) ?? []);
  };

  useEffect(() => { load(); }, [filterStatus]);

  const save = async () => {
    if (!form.title || !form.scheduled_at) { toast.error("Title and date are required"); return; }
    const payload = {
      title: form.title, category: form.category, entry_fee: form.entry_fee,
      total_slots: form.total_slots, prize_pool: form.prize_pool, scheduled_at: form.scheduled_at,
      level_requirement: form.level_requirement, published: form.published, status: form.status,
    };
    if (editing) {
      await supabase.from("tournaments").update(payload).eq("id", editing);
      toast.success("Tournament updated");
    } else {
      await supabase.from("tournaments").insert(payload);
      toast.success("Tournament created");
    }
    setOpen(false); setEditing(null); setForm(empty); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this tournament?")) return;
    await supabase.from("registrations").delete().eq("tournament_id", id);
    await supabase.from("tournaments").delete().eq("id", id);
    toast.success("Deleted"); load();
  };

  const edit = (t: Tournament) => {
    setEditing(t.id);
    setForm({
      title: t.title, category: t.category as Category, entry_fee: t.entry_fee,
      total_slots: t.total_slots, prize_pool: t.prize_pool,
      scheduled_at: t.scheduled_at.slice(0, 16),
      level_requirement: (t as any).level_requirement ?? 1,
      published: (t as any).published ?? false, status: t.status as any,
    });
    setOpen(true);
  };

  const openRoom = (t: Tournament) => {
    setRoomForm({ id: t.id, room_id: t.room_id ?? "", room_password: t.room_password ?? "" });
    setRoomOpen(true);
  };

  const saveRoom = async () => {
    await supabase.from("tournaments").update({ room_id: roomForm.room_id, room_password: roomForm.room_password }).eq("id", roomForm.id);
    toast.success("Room details saved"); setRoomOpen(false); load();
  };

  const openSlots = async (t: Tournament) => {
    setSlotsTournament(t);
    const { data: regData } = await supabase.from("registrations").select("id, user_id").eq("tournament_id", t.id);
    if (regData && regData.length > 0) {
      const userIds = regData.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", userIds);
      const profileMap = new Map((profiles ?? []).map(p => [p.id, p.username]));
      setRegs(regData.map(r => ({ id: r.id, user_id: r.user_id, username: profileMap.get(r.user_id) ?? "Unknown" })));
    } else {
      setRegs([]);
    }
    setSlotsOpen(true);
  };

  const removePlayer = async (regId: string) => {
    if (!confirm("Remove this player?")) return;
    await supabase.from("registrations").delete().eq("id", regId);
    toast.success("Player removed");
    if (slotsTournament) openSlots(slotsTournament);
  };

  const statusColor = (s: string) => {
    if (s === "live") return "bg-green-500/20 text-green-400 border-green-500/50";
    if (s === "completed") return "bg-muted text-muted-foreground";
    if (s === "cancelled") return "bg-destructive/20 text-destructive";
    return "bg-primary/20 text-primary border-primary/50";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Tournaments</h1>
          <p className="text-xs text-muted-foreground">Create and manage all tournaments</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }} className="gap-2 bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {/* FILTER */}
      <div className="flex gap-2">
        <button onClick={() => setFilterStatus("all")} className={`rounded border px-3 py-1 text-xs font-display uppercase tracking-widest ${filterStatus === "all" ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground"}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`rounded border px-3 py-1 text-xs font-display uppercase tracking-widest ${filterStatus === s ? "border-primary bg-primary/20 text-primary" : "border-muted text-muted-foreground"}`}>{s}</button>
        ))}
      </div>

      {/* LIST */}
      <SystemPanel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Slots</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="text-xs">{CATEGORY_META[t.category as Category]?.title}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor(t.status)}>{t.status}</Badge></TableCell>
                  <TableCell>{t.total_slots}</TableCell>
                  <TableCell>{t.entry_fee === 0 ? "Free" : `${t.entry_fee} ⟁`}</TableCell>
                  <TableCell className="text-xs">{new Date(t.scheduled_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openSlots(t)} className="rounded p-1.5 text-primary hover:bg-primary/10" title="View Slots"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openRoom(t)} className="rounded p-1.5 text-primary hover:bg-primary/10" title="Room Details"><Key className="h-4 w-4" /></button>
                      <button onClick={() => edit(t)} className="rounded p-1.5 text-primary hover:bg-primary/10" title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => del(t.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No tournaments found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SystemPanel>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-primary/40 bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-widest text-primary text-glow-soft">
              {editing ? "Edit Tournament" : "Create Tournament"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Title</Label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm(p => ({ ...p, category: v as Category }))}>
                  <SelectTrigger className="border-primary/30 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{CATEGORY_META[c].title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger className="border-primary/30 bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Date & Time</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Entry Fee</Label>
                <Input type="number" min={0} value={form.entry_fee} onChange={(e) => setForm(p => ({ ...p, entry_fee: +e.target.value }))} className="border-primary/30 bg-card" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Total Slots</Label>
                <Input type="number" min={1} value={form.total_slots} onChange={(e) => setForm(p => ({ ...p, total_slots: +e.target.value }))} className="border-primary/30 bg-card" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Prize Pool</Label>
                <Input type="number" min={0} value={form.prize_pool} onChange={(e) => setForm(p => ({ ...p, prize_pool: +e.target.value }))} className="border-primary/30 bg-card" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Level Requirement</Label>
              <Input type="number" min={1} value={form.level_requirement} onChange={(e) => setForm(p => ({ ...p, level_requirement: +e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.published} onCheckedChange={(v) => setForm(p => ({ ...p, published: v }))} />
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Published (visible to players)</Label>
            </div>
            <Button onClick={save} className="w-full bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">
              {editing ? "Update Tournament" : "Create Tournament"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ROOM DETAILS DIALOG */}
      <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
        <DialogContent className="border-primary/40 bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-widest text-primary text-glow-soft">Room Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Room ID</Label>
              <Input value={roomForm.room_id} onChange={(e) => setRoomForm(p => ({ ...p, room_id: e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Room Password</Label>
              <Input value={roomForm.room_password} onChange={(e) => setRoomForm(p => ({ ...p, room_password: e.target.value }))} className="border-primary/30 bg-card" />
            </div>
            <p className="text-[10px] text-muted-foreground">Only joined users will see this after you save.</p>
            <Button onClick={saveRoom} className="w-full bg-primary font-display text-xs uppercase tracking-widest text-primary-foreground hover:bg-primary-glow">Save Room Details</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SLOTS DIALOG */}
      <Dialog open={slotsOpen} onOpenChange={setSlotsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-primary/40 bg-background">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-widest text-primary text-glow-soft">
              Slot Management — {slotsTournament?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">{regs.length} / {slotsTournament?.total_slots} slots filled</p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {Array.from({ length: slotsTournament?.total_slots ?? 0 }, (_, i) => {
              const reg = regs[i];
              return (
                <div key={i} className={`flex aspect-square items-center justify-center rounded border text-[10px] font-bold ${reg ? "border-primary bg-primary/20 text-primary" : "border-muted bg-card text-muted-foreground"}`} title={reg?.username}>
                  {reg ? i + 1 : i + 1}
                </div>
              );
            })}
          </div>
          {regs.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regs.map((r, i) => (
                  <TableRow key={r.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{r.username}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => removePlayer(r.id)} className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
