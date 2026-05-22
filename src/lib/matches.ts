export interface Match {
  id: string;
  sitter_id: string;
  parent_id: string;
  lang_score: number;
  personality_score: number;
  ratings_score: number;
  age_score: number;
  missions_score: number;
  experience_score: number;
  proximity_score: number;
  misc_score: number;
  raw_score: number;
  final_score: number;
  tier: string;
  calculated_at: string;
  parent_name: string;
  sitter_name: string;
}

const API = "https://kiddobee-backend-production.up.railway.app";

export async function fetchMatches(): Promise<Match[]> {
  const res = await fetch(`${API}/matches`);
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

export function tierBadgeClass(tier: string): string {
  if (tier.includes("Hot")) return "bg-red-500/15 text-red-600 border-red-500/30";
  if (tier.includes("Good")) return "bg-green-500/15 text-green-600 border-green-500/30";
  if (tier.includes("Partial")) return "bg-orange-500/15 text-orange-600 border-orange-500/30";
  return "bg-gray-500/15 text-gray-600 border-gray-500/30";
}
