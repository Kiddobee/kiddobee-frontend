import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth, signOut } from "@/lib/auth";
import { fetchMatchesForParent, tierBadgeClass, type Match } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import { LogOut, Star } from "lucide-react";

export const Route = createFileRoute("/parent/matches")({
  head: () => ({ meta: [{ title: "My Matches — Kiddobee" }] }),
  component: ParentMatchesPage,
});

const SCORE_DIMS: { key: keyof Match; label: string; max: number }[] = [
  { key: "lang_score", label: "Language", max: 30 },
  { key: "experience_score", label: "Experience", max: 25 },
  { key: "ratings_score", label: "Ratings", max: 30 },
  { key: "personality_score", label: "Personality", max: 30 },
  { key: "age_score", label: "Age match", max: 30 },
  { key: "proximity_score", label: "Proximity", max: 20 },
];

function SitterCard({ match }: { match: Match }) {
  const top3 = [...SCORE_DIMS].sort((a, b) => (match[b.key] as number) - (match[a.key] as number)).slice(0, 3);
  return (
    <Link to="/parent/babysitter/$id" params={{ id: match.sitter_id }}
      className="block bg-white rounded-2xl border p-5 hover:shadow-md hover:border-[#00B4D8]/40 transition-all group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0096B4] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {match.sitter_name?.charAt(0) ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-[#00B4D8] transition-colors">{match.sitter_name}</h3>
            <Badge variant="outline" className={`${tierBadgeClass(match.tier)} flex-shrink-0 text-xs`}>{match.tier}</Badge>
          </div>
          {/* Score */}
          <div className="flex items-center gap-2 mt-1">
            <div className="text-2xl font-bold text-[#00B4D8]">{match.final_score}</div>
            <div className="text-sm text-gray-400">/100</div>
            <div className="flex ml-1">
              {[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= Math.round(match.final_score / 20) ? "text-[#FFD700] fill-[#FFD700]" : "text-gray-200"}`} />)}
            </div>
          </div>
          {/* Top 3 dims */}
          <div className="mt-3 space-y-1.5">
            {top3.map(dim => (
              <div key={dim.key} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 shrink-0">{dim.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00B4D8] rounded-full" style={{ width: `${((match[dim.key] as number) / dim.max) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-600 w-10 text-right">{match[dim.key]}/{dim.max}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ParentMatchesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (user) setParentId(user.user_metadata?.profileId ?? null);
  }, [user, loading]);

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["parent-matches", parentId],
    queryFn: () => fetchMatchesForParent(parentId!),
    enabled: Boolean(parentId),
  });

  const ranked = [...(matches ?? [])].sort((a, b) => b.final_score - a.final_score);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00B4D8] flex items-center justify-center text-white font-bold text-sm">K</div>
            <span className="font-semibold text-gray-900">Kiddobee</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate({ to: "/login" }))}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Babysitter Matches</h1>
          <p className="text-gray-500 mt-1">Ranked by compatibility score</p>
        </div>

        {!parentId ? (
          <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">
            <p>Profile ID not found. Please contact support.</p>
          </div>
        ) : matchesLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
          </div>
        ) : ranked.length === 0 ? (
          <div className="bg-white rounded-2xl border p-8 text-center">
            <p className="text-gray-500">No matches yet. Our team will run the matching algorithm shortly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ranked.map((m, i) => (
              <div key={m.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-4">{i + 1}</div>
                <div className="flex-1"><SitterCard match={m} /></div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
