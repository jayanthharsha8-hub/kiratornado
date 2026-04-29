import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, Coins, Trophy, UsersRound, X, Sword } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_META } from "@/lib/tournaments";
import { Button } from "@/components/ui/button";

type Tab = "upcoming" | "live" | "completed";

interface Tournament {
  id: string;
  title: string;
  entry_fee: number;
  prize_pool: number;
  scheduled_at: string;
  total_slots: number;
  status: string;
}

const red = "hsl(0 100% 56%)";
const redSoft = "hsl(0 100% 56% / 0.18)";

const BattleRoyalePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("tournaments")
      .select("id,title,entry_fee,prize_pool,scheduled_at,total_slots,status")
      .eq("category", "battle_royale")
      .eq("status", tab)
      .eq("published", true)
      .order("scheduled_at", { ascending: tab !== "completed" })
      .then(async ({ data }) => {
        const rows = (data ?? []) as Tournament[];
        setTournaments(rows);

        const nextCounts: Record<string, number> = {};

        await Promise.all(
          rows.map(async (t) => {
            const { count } = await supabase
              .from("registrations")
              .select("id", { count: "exact", head: true })
              .eq("tournament_id", t.id);

            nextCounts[t.id] = count ?? 0;
          })
        );

        setCounts(nextCounts);
        setLoading(false);
      });
  }, [tab]);

  return (
    <div className="min-h-screen bg-background px-3 pb-8 pt-4 text-foreground">
      <main className="w-full px-3">

        <section
          className="relative h-[220px] w-full overflow-hidden"
          style={{ border: `2px solid ${red}`, boxShadow: `0 0 14px ${redSoft}` }}
        >
          <img
            src={CATEGORY_META.battle_royale.image}
            alt="Battle Royale"
            className="absolute inset-0 h-full w-full object-cover brightness-75"
          />

          <button
            onClick={() => navigate(-1)}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border"
            style={{ borderColor: red, boxShadow: `0 0 12px ${redSoft}` }}
          >
            <X className="h-6 w-6" />
          </button>

          <div className="absolute left-4 top-8">
            <h1 className="text-3xl font-bold">
              BATTLE <span style={{ color: red }}>ROYALE</span>
            </h1>
          </div>
        </section>

        <section className="grid grid-cols-3 mt-4 border">
          {(["upcoming", "live", "completed"] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className="p-3 border"
              style={{
                background: tab === item ? redSoft : undefined,
                color: tab === item ? "white" : undefined
              }}
            >
              {item}
            </button>
          ))}
        </section>

        <section className="mt-4 space-y-3">
          {loading ? (
            <p>Loading...</p>
          ) : tournaments.length === 0 ? (
            <p>No Matches</p>
          ) : (
            tournaments.map((t) => (
              <BattleRoyaleCard key={t.id} tournament={t} count={counts[t.id] ?? 0} />
            ))
          )}
        </section>

      </main>
    </div>
  );
};

const BattleRoyaleCard = ({ tournament, count }: { tournament: Tournament; count: number }) => {
  const navigate = useNavigate();

  return (
    <div className="border p-3 flex justify-between" style={{ borderColor: red }}>
      <div>
        <h2>BATTLE ROYALE</h2>
        <p>{count}/{tournament.total_slots}</p>
        <p>₹{tournament.entry_fee}</p>
        <p>₹{tournament.prize_pool}</p>
      </div>

      <Button onClick={() => navigate(`/tournament-slots/${tournament.id}`)}>
        Join
      </Button>
    </div>
  );
};

export default BattleRoyalePage;
