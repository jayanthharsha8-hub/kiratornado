import freeMatchImg from "@/assets/card-free-match.jpg";
import battleRoyaleImg from "@/assets/card-battle-royale.jpg";
import classicSquadImg from "@/assets/card-classic-squad.jpg";
import loneWolfImg from "@/assets/card-lone-wolf.jpg";

export type Category = "free_match" | "battle_royale" | "classic_squad" | "lone_wolf";

export type CategoryTheme = {
  title: string;
  subtitle: string;
  rules: string[];
  image: string;
  /** Tailwind-friendly hex for inline styles only (glow shadows, badge bg). UI text uses semantic tokens. */
  color: string;
  colorSoft: string;
};

export const CATEGORY_META: Record<Category, CategoryTheme> = {
  free_match: {
    title: "Free Matches",
    subtitle: "Daily -- No entry fee",
    image: freeMatchImg,
    color: "#00cfff",
    colorSoft: "#00cfff33",
    rules: ["Entry: Free", "Slots: 50 players", "Daily 5 matches"],
  },
  battle_royale: {
    title: "Battle Royale",
    subtitle: "Solo -- 50 players",
    image: battleRoyaleImg,
    color: "#ff3b3b",
    colorSoft: "#ff3b3b33",
    rules: ["Entry Fee: 5 coins", "Slots: 50 players", "Solo players only"],
  },
  classic_squad: {
    title: "Classic Squad",
    subtitle: "4 vs 4 -- 8 squads",
    image: classicSquadImg,
    color: "#a855f7",
    colorSoft: "#a855f733",
    rules: ["Entry Fee: 10 coins", "Slots: 8 teams (4 vs 4)"],
  },
  lone_wolf: {
    title: "Lone Wolf",
    subtitle: "2 vs 2 -- Extreme Duel",
    image: loneWolfImg,
    color: "#22c55e",
    colorSoft: "#22c55e33",
    rules: ["Entry Fee: 10 coins", "Slots: 2 vs 2 (4 players total)"],
  },
};
