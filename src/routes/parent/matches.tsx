import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, fmtDate } from "@/lib/supabase";
import { useAuth, signOut } from "@/lib/auth";
import { fetchMatchesForParent, tierBadgeClass, type Match } from "@/lib/api";
import { LanguageToggle } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LogOut, LayoutGrid, User, ChevronDown, ChevronUp, Video } from "lucide-react";

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

function tierEmoji(tier: string): string {
  if (tier.includes("Hot")) return "🔥";
  if (tier.includes("Good")) return "✅";
  if (tier.includes("Partial")) return "⚠️";
  return "";
}

function isProfileComplete(parent: any): boolean {
  const status = String(parent?.["Profile Status"] ?? "").toLowerCase();
  return status === "active" || status === "verified";
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("active") || s.includes("signed") || s.includes("complete")) return "bg-green-100 text-green-700 border-green-200";
  if (s.includes("requested") || s.includes("pending") || s.includes("scheduled")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (s.includes("cancel") || s.includes("reject")) return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function MatchCard({ match, parentId, rank }: { match: Match; parentId: string; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [requested, setRequested] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const top3 = [...SCORE_DIMS]
    .sort((a, b) => (match[b.key] as number) - (match[a.key] as number))
    .slice(0, 3);

  const { data: sitter } = useQuery({
    queryKey: ["sitter-detail", match.sitter_id],
    queryFn: async () => {
      const { data } = await supabase.from("Babysitter").select("*").eq("Sitter ID", match.sitter_id).single();
      return data;
    },
    enabled: expanded,
  });

  async function scheduleInterview() {
    setScheduling(true);
    try {
      const { error } = await supabase.from("Interview").insert({
        parent_id: parentId,
        babysitter_id: match.sitter_id,
        babysitter_name: match.sitter_name,
        status: "requested",
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      setRequested(true);
      toast.success("Interview requested! Our team will be in touch.");
    } catch (err: any) {
      toast.error("Failed to request interview: " + err.message);
    } finally {
      setScheduling(false);
    }
  }

  const langs = sitter ? [1, 2, 3, 4, 5].map((n) => sitter[`Language ${n}`]).filter(Boolean) : [];
  const ageRanges = sitter?.["Comfortable Age Ranges"]?.split(", ").filter(Boolean) ?? [];
  const missions = sitter?.["Proposed Missions"]?.split(", ").filter(Boolean) ?? [];
  const experience = sitter?.["Years of Experience"];
  const availability = sitter?.["Availability Start Date"];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0 mt-1">
          {rank}
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0096B4] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {match.sitter_name?.charAt(0) ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-gray-900 truncate">{match.sitter_name}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={`text-xs ${tierBadgeClass(match.tier)}`}>
                {tierEmoji(match.tier)} {match.tier}
              </Badge>
              {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-[#00B4D8]">{match.final_score}</span>
            <span className="text-sm text-gray-400">/100</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {top3.map((dim) => (
              <div key={dim.key} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 shrink-0">{dim.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00B4D8] rounded-full"
                    style={{ width: `${Math.min(100, ((match[dim.key] as number) / dim.max) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 w-10 text-right">
                  {match[dim.key]}/{dim.max}
                </span>
              </div>
            ))}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {!sitter ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {langs.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Languages</p>
                    <div className="flex flex-wrap gap-1">
                      {langs.map((l: string) => (
                        <span key={l} className="bg-[#00B4D8]/10 text-[#00B4D8] px-2 py-0.5 rounded-full text-xs font-medium">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
                {experience !== undefined && experience !== null && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Experience</p>
                    <p className="font-medium text-gray-900">{experience} year{experience !== 1 ? "s" : ""}</p>
                  </div>
                )}
                {ageRanges.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Age Ranges</p>
                    <div className="flex flex-wrap gap-1">
                      {ageRanges.map((a: string) => (
                        <span key={a} className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-xs">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {availability && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Available from</p>
                    <p className="font-medium text-gray-900">{fmtDate(availability, "en-GB")}</p>
                  </div>
                )}
              </div>
              {missions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Missions</p>
                  <div className="flex flex-wrap gap-1">
                    {missions.map((m: string) => (
                      <span key={m} className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full text-xs">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              <Button
                onClick={scheduleInterview}
                disabled={requested || scheduling}
                className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white"
              >
                {requested ? "Interview requested ✓" : scheduling ? "Sending request…" : "Schedule interview"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({ contract }: { contract: any }) {
  const [expanded, setExpanded] = useState(false);
  const name = contract.babysitterName ?? contract.babysitter ?? contract.sitterName ?? "—";
  const status = String(contract.status ?? "—");
  const startDate = contract.startDate ?? contract.start_date ?? contract.start;
  const endDate = contract.endDate ?? contract.end_date ?? contract.end;
  const rate = contract.rate ?? contract.hourlyRate ?? contract.hourly_rate;
  const schedule = contract.schedule ?? contract.scheduleType ?? contract.schedule_type;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#00B4D8]/10 flex items-center justify-center text-[#00B4D8] font-bold text-sm flex-shrink-0">
            {name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{name}</p>
            {startDate && <p className="text-xs text-gray-400">{fmtDate(startDate, "en-GB")}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className={`text-xs ${statusColor(status)}`}>{status}</Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100 pt-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-gray-400 mb-0.5">Babysitter</p><p className="font-medium">{name}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Status</p><p className="font-medium">{status}</p></div>
            {startDate && <div><p className="text-xs text-gray-400 mb-0.5">Start Date</p><p className="font-medium">{fmtDate(startDate, "en-GB")}</p></div>}
            {endDate && <div><p className="text-xs text-gray-400 mb-0.5">End Date</p><p className="font-medium">{fmtDate(endDate, "en-GB")}</p></div>}
            {rate && <div><p className="text-xs text-gray-400 mb-0.5">Rate</p><p className="font-medium">{rate}€/h</p></div>}
            {schedule && <div><p className="text-xs text-gray-400 mb-0.5">Schedule</p><p className="font-medium">{schedule}</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewCard({ interview }: { interview: any }) {
  const [expanded, setExpanded] = useState(false);
  const name = interview.babysitter_name ?? interview.babysitterName ?? interview.candidateName ?? interview.candidate ?? "—";
  const status = String(interview.status ?? "—");
  const date = interview.scheduledAt ?? interview.scheduled_at ?? interview.scheduled ?? interview.created_at;
  const meetLink = interview.meet_link ?? interview.meetLink ?? null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
            {name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{name}</p>
            {date && <p className="text-xs text-gray-400">{fmtDate(date, "en-GB")}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className={`text-xs ${statusColor(status)}`}>{status}</Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100 pt-4 text-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-gray-400 mb-0.5">Babysitter</p><p className="font-medium">{name}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Status</p><p className="font-medium">{status}</p></div>
            {date && <div className="col-span-2"><p className="text-xs text-gray-400 mb-0.5">Requested on</p><p className="font-medium">{fmtDate(date, "en-GB")}</p></div>}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Google Meet</p>
            {meetLink ? (
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#00B4D8] font-medium hover:underline"
              >
                <Video className="h-4 w-4" />
                Join meeting
              </a>
            ) : (
              <p className="text-gray-500 italic">Link will be sent by our team</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ParentMatchesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading]);

  const parentId = user?.user_metadata?.profileId as string | undefined;

  const { data: parent, isLoading: parentLoading } = useQuery({
    queryKey: ["parent-profile", parentId],
    queryFn: async () => {
      if (!parentId) return null;
      const { data } = await supabase.from("Parent").select("*").eq("Parent ID", parentId).single();
      return data;
    },
    enabled: Boolean(parentId),
  });

  const profileComplete = parent ? isProfileComplete(parent) : false;

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["parent-matches", parentId],
    queryFn: () => fetchMatchesForParent(parentId!),
    enabled: Boolean(parentId) && profileComplete,
  });

  const top5 = [...(matches ?? [])].sort((a, b) => b.final_score - a.final_score).slice(0, 5);

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["parent-contracts", parentId],
    queryFn: async () => {
      const { data } = await supabase.from("Contract").select("*").eq("parent_id", parentId!).order("createdAt", { ascending: false });
      return data ?? [];
    },
    enabled: Boolean(parentId),
  });

  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ["parent-interviews", parentId],
    queryFn: async () => {
      const { data } = await supabase.from("Interview").select("*").eq("parent_id", parentId!).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: Boolean(parentId),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00B4D8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Navbar */}
      <header className="bg-white border-b w-full sticky top-0 z-10">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo.avif" alt="Kiddobee" className="h-8 w-auto object-contain" />
            <span className="bg-[#00B4D8] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Parent</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/parent/matches">
              {({ isActive }) => (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-[#00B4D8] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  <LayoutGrid className="h-4 w-4" />
                  Dashboard
                </span>
              )}
            </Link>
            <Link to="/parent/profile-setup">
              {({ isActive }) => (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-[#00B4D8] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  <User className="h-4 w-4" />
                  Profile
                </span>
              )}
            </Link>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle />
            <button
              onClick={() => signOut().then(() => navigate({ to: "/login" }))}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* SECTION 1: Matches */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Matches</h2>
          {parentLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : !profileComplete ? (
            <div className="bg-white rounded-2xl border border-[#00B4D8]/20 p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#00B4D8]/10 flex items-center justify-center mx-auto mb-4">
                <User className="h-7 w-7 text-[#00B4D8]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete your profile first</h3>
              <p className="text-gray-500 mb-6">
                Complete your profile first and we will send you recommended babysitters.
              </p>
              <Button asChild className="bg-[#00B4D8] hover:bg-[#0096B4] text-white">
                <Link to="/parent/profile-setup">Complete your profile</Link>
              </Button>
            </div>
          ) : matchesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : top5.length === 0 ? (
            <div className="bg-white rounded-2xl border p-8 text-center text-gray-400 shadow-sm">
              No matches yet. Our team will run the matching algorithm shortly.
            </div>
          ) : (
            <div className="space-y-3">
              {top5.map((m, i) => (
                <MatchCard key={m.id} match={m} parentId={parentId!} rank={i + 1} />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: My Bookings */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">My Bookings</h2>
          {contractsLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : !contracts || contracts.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-400 shadow-sm">
              No bookings yet.
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((c: any) => <BookingCard key={c.id} contract={c} />)}
            </div>
          )}
        </section>

        {/* SECTION 3: My Interviews */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">My Interviews</h2>
          {interviewsLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
          ) : !interviews || interviews.length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-400 shadow-sm">
              No interviews scheduled yet.
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((iv: any) => <InterviewCard key={iv.id} interview={iv} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
