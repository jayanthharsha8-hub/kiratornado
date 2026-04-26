import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SystemPanel } from "@/components/SystemPanel";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function AdminPlayers() {
  const [players, setPlayers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      let q = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
      if (search.trim()) q = q.ilike("username", `%${search.trim()}%`);
      const { data } = await q;
      setPlayers((data as Profile[]) ?? []);
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-primary text-glow">Players</h1>
        <p className="text-xs text-muted-foreground">View and search all registered players</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-primary/30 bg-card pl-10"
        />
      </div>

      <SystemPanel>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Player Name</TableHead>
                <TableHead>FF UID</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Coins</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-primary">{p.username}</TableCell>
                  <TableCell>{p.player_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.ff_uid}</TableCell>
                  <TableCell>{p.player_level}</TableCell>
                  <TableCell>{p.coins} ⟁</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {players.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No players found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </SystemPanel>
    </div>
  );
}
