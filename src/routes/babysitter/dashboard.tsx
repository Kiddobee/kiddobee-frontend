import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth, signOut } from "@/lib/auth";
import { LanguageToggle } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { LogOut, CheckCircle, Clock, Eye, Star } from "lucide-react";

export const Route = createFileRoute("/babysitter/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kiddobee" }] }),
  component: BabysitterDashboard,
});

function statusColor(s: string) {
  if (s === "Verified") return "bg-green-100 text-green-700 border-green-200";
  if (s === "Submitted") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function profileCompletionPct(sitter: any): number {
  const fields = [
    sitter?.["Location"],
    sitter?.["Language 1"],
    sitter?.["Years of Experience"],
    sitter?.["Comfortable Age Ranges"],
    sitter?.["Proposed Missions"],
    sitter?.["↳ Energy (1-5)"],
    sitter?.["Notes"],
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function BabysitterDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (!loading && !user) navigate({ to: "/login" }); }, [user, loading]);

  const sitterId = user?.user_metadata?.profileId as string | undefined;

  const { data: sitter, isLoading } = useQuery({
    queryKey: ["sitter-profile", sitterId],
    queryFn: async () => {
      const { data } = await supabase.from("Babysitter").select("*").eq("Sitter ID", sitterId).single();
      return data;
    },
    enabled: Boolean(sitterId),
  });

  const completionPct = sitter ? profileCompletionPct(sitter) : 0;
  const status = sitter?.["Profile Status"] ?? "Submitted";
  const firstName = user?.user_metadata?.firstName ?? sitter?.["First Name"] ?? "there";

  if (loading || isLoading) return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-4 mt-8">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName} 👋</h1>
          <p className="text-gray-500 mt-1">Here's your babysitter profile overview</p>
        </div>

        {/* Status */}
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status === "Verified" ? <CheckCircle className="h-6 w-6 text-green-500" /> : <Clock className="h-6 w-6 text-yellow-500" />}
              <div>
                <p className="font-medium text-gray-900">Profile status</p>
                <p className="text-sm text-gray-500">{status === "Verified" ? "You're verified and visible to parents" : "Your profile is under review"}</p>
              </div>
            </div>
            <Badge variant="outline" className={statusColor(status)}>{status}</Badge>
          </CardContent>
        </Card>

        {/* Profile completion */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Profile completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Complete your profile to get matched</span>
              <span className="font-semibold text-[#00B4D8]">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-2.5 [&>[role=progressbar]]:bg-[#00B4D8]" />
            {completionPct < 100 && (
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/babysitter/profile-setup" })} className="border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/5">
                Continue profile setup
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <Eye className="h-6 w-6 text-[#00B4D8] mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{sitter?.["Total Times Presented"] ?? 0}</div>
              <p className="text-xs text-gray-500 mt-1">Profile views</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <Star className="h-6 w-6 text-[#FFD700] mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{sitter?.["Ratings Score /30"] ?? "—"}</div>
              <p className="text-xs text-gray-500 mt-1">Rating /30</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile summary */}
        {sitter && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Your profile</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {sitter["Location"] && <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium">{sitter["Location"]}</span></div>}
              {sitter["Years of Experience"] && <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="font-medium">{sitter["Years of Experience"]} years</span></div>}
              {sitter["Language 1"] && <div className="flex justify-between"><span className="text-gray-500">Languages</span><span className="font-medium">{[1,2,3,4,5].map(n => sitter[`Language ${n}`]).filter(Boolean).join(", ")}</span></div>}
              {sitter["Comfortable Age Ranges"] && <div className="flex justify-between"><span className="text-gray-500">Age ranges</span><span className="font-medium text-right">{sitter["Comfortable Age Ranges"]}</span></div>}
              {sitter["Availability End Date"] && <div className="flex justify-between"><span className="text-gray-500">Available until</span><span className="font-medium">{sitter["Availability End Date"]}</span></div>}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
