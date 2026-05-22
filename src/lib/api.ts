export const API_BASE = "https://kiddobee-backend-production.up.railway.app";

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
  parent_name?: string;
  sitter_name: string;
}

export async function fetchAllMatches(): Promise<Match[]> {
  const res = await fetch(`${API_BASE}/matches`);
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

export async function fetchMatchesForParent(parentId: string): Promise<Match[]> {
  const res = await fetch(`${API_BASE}/matches/${encodeURIComponent(parentId)}`);
  if (!res.ok) throw new Error("Failed to fetch matches for parent");
  return res.json();
}

export async function recalculateMatches(): Promise<unknown> {
  const res = await fetch(`${API_BASE}/match`, { method: "POST" });
  if (!res.ok) throw new Error("Recalculation failed");
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export function tierBadgeClass(tier: string): string {
  if (tier.includes("Hot")) return "bg-red-100 text-red-700 border-red-200";
  if (tier.includes("Good")) return "bg-green-100 text-green-700 border-green-200";
  if (tier.includes("Partial")) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}
