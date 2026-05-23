import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fetchMatchesForParent, tierBadgeClass } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowLeft, Calendar, MapPin, Globe, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/parent/babysitter/$id")({
  head: () => ({ meta: [{ title: "Babysitter Profile — Kiddobee" }] }),
  component: BabysitterProfilePage,
});

const SCORE_DIMS = [
  { key: "lang_score",        label: "Language",    max: 30 },
  { key: "experience_score",  label: "Experience",  max: 25 },
  { key: "ratings_score",     label: "Ratings",     max: 30 },
  { key: "missions_score",    label: "Missions",    max: 25 },
  { key: "personality_score", label: "Personality", max: 30 },
  { key: "age_score",         label: "Age Range",   max: 30 },
  { key: "proximity_score",   label: "Proximity",   max: 20 },
  { key: "misc_score",        label: "Misc",        max: 20 },
] as const;

const PERSONALITY_KEYS = [
  { sitter: "↳ Energy (1-5)",       label: "Energy" },
  { sitter: "↳ Structure (1-5)",     label: "Structure" },
  { sitter: "↳ Warmth (1-5)",        label: "Warmth" },
  { sitter: "↳ Creativity (1-5)",    label: "Creativity" },
  { sitter: "↳ Discipline (1-5)",    label: "Discipline" },
  { sitter: "↳ Outdoor Focus (1-5)", label: "Outdoor" },
];

function BabysitterProfilePage() {
  const { id: sitterId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading]);

  const parentId = user?.user_metadata?.profileId as string | undefined;

  const { data: sitter, isLoading: sitterLoading } = useQuery({
    queryKey: ["sitter", sitterId],
    queryFn: async () => {
      const { data } = await supabase.from("Babysitter").select("*").eq("Sitter ID", sitterId).single();
      return data;
    },
    enabled: Boolean(sitterId),
  });

  const { data: matches } = useQuery({
    queryKey: ["parent-matches", parentId],
    queryFn: () => fetchMatchesForParent(parentId!),
    enabled: Boolean(parentId),
  });

  const match = matches?.find(m => m.sitter_id === sitterId);

  const radarData = PERSONALITY_KEYS.map(k => ({
    trait: k.label,
    value: sitter?.[k.sitter] ?? 0,
    fullMark: 5,
  }));

  const langs = [1,2,3,4,5].map(n => sitter?.[`Language ${n}`]).filter(Boolean);
  const ageRanges = sitter?.["Comfortable Age Ranges"]?.split(", ").filter(Boolean) ?? [];
  const missions = sitter?.["Proposed Missions"]?.split(", ").filter(Boolean) ?? [];

  if (sitterLoading || loading) return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/parent/matches" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#00B4D8]">
            <ArrowLeft className="h-4 w-4" /> Back to matches
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00B4D8] to-[#0096B4] flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {sitter?.["First Name"]?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{sitter?.["First Name"]} {sitter?.["Last Name"]}</h1>
                  <p className="text-gray-500 text-sm mt-0.5">{sitter?.["Profile Status"] ?? "Babysitter"}</p>
                </div>
                {match && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#00B4D8]">{match.final_score}<span className="text-base text-gray-400 font-normal">/100</span></div>
                    <Badge variant="outline" className={`${tierBadgeClass(match.tier)} text-xs mt-1`}>{match.tier}</Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                {sitter?.["Location"] && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{sitter["Location"]}</span>}
                {sitter?.["Years of Experience"] && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{sitter["Years of Experience"]} yrs experience</span>}
                {langs.length > 0 && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{langs.join(", ")}</span>}
              </div>

              {ageRanges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {ageRanges.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        {match && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Match Score Breakdown</h2>
            <div className="space-y-3">
              {SCORE_DIMS.map(dim => {
                const val = (match as any)[dim.key] as number;
                const pct = Math.round((val / dim.max) * 100);
                return (
                  <div key={dim.key} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-24 shrink-0">{dim.label}</span>
                    <div className="flex-1">
                      <Progress value={pct} className="h-2 [&>[role=progressbar]]:bg-[#00B4D8]" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">{val}/{dim.max}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Personality Radar */}
        {radarData.some(d => d.value > 0) && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Personality Profile</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" tick={{ fontSize: 12 }} />
                  <Radar name="Sitter" dataKey="value" stroke="#00B4D8" fill="#00B4D8" fillOpacity={0.25} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Missions */}
        {missions.length > 0 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Proposed Missions</h2>
            <div className="flex flex-wrap gap-2">
              {missions.map(m => <Badge key={m} variant="outline" className="border-[#00B4D8]/30 text-[#00B4D8]">{m}</Badge>)}
            </div>
          </div>
        )}

        {/* Notes */}
        {sitter?.["Notes"] && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{sitter["Notes"]}</p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl border p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Interested in {sitter?.["First Name"]}?</h3>
            <p className="text-sm text-gray-500 mt-0.5">Request an interview to meet this babysitter</p>
          </div>
          <Button onClick={() => toast.success("Interview request sent! We'll be in touch shortly.")} className="bg-[#00B4D8] hover:bg-[#0096B4] text-white">
            <Calendar className="h-4 w-4 mr-2" /> Book interview
          </Button>
        </div>
      </main>
    </div>
  );
}
