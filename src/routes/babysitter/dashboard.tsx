import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth, signOut } from "@/lib/auth";
import { LanguageToggle } from "@/lib/i18n";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Clock, LayoutGrid, User, Video } from "lucide-react";

export const Route = createFileRoute("/babysitter/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kiddobee" }] }),
  component: BabysitterDashboard,
});

function profileCompletion(sitter: any): number {
  const checks = [
    !!(sitter?.["First Name"] && sitter?.["Location"]),
    !!(sitter?.["Years of Experience"] !== null && sitter?.["Years of Experience"] !== undefined && sitter?.["Comfortable Age Ranges"]),
    !!sitter?.["Language 1"],
    !!sitter?.["Availability Start Date"],
    !!sitter?.["references_data"],
    !!sitter?.["documents_data"],
    sitter?.["Profile Status"] === "Submitted" || sitter?.["Profile Status"] === "Verified",
  ];
  return Math.round((checks.filter(Boolean).length / 7) * 100);
}

function BabysitterDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading]);

  const sitterId = user?.user_metadata?.profileId as string | undefined;
  const firstName = user?.user_metadata?.firstName ?? "there";

  const { data: sitter, isLoading } = useQuery({
    queryKey: ["sitter-profile", sitterId],
    queryFn: async () => {
      if (!sitterId) return null;
      const { data } = await supabase.from("Babysitter").select("*").eq("Sitter ID", sitterId).single();
      return data;
    },
    enabled: Boolean(sitterId),
  });

  const { data: interviews } = useQuery({
    queryKey: ["sitter-interviews", sitterId],
    queryFn: async () => {
      const { data } = await supabase
        .from("Interview")
        .select("*")
        .eq("babysitter_id", sitterId!)
        .neq("status", "Cancelled")
        .order("scheduledAt", { ascending: true });
      return data ?? [];
    },
    enabled: Boolean(sitterId),
  });

  const upcomingInterview = interviews?.[0] ?? null;

  const completion = sitter ? profileCompletion(sitter) : 0;
  const status = sitter?.["Profile Status"] ?? "Pending";
  const displayFirstName = sitter?.["First Name"] ?? firstName;

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <div className="bg-black h-14" />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-5 w-40" />
          <div className="space-y-4 mt-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
          </div>
        </div>
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
            <span className="bg-[#00B4D8] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">Babysitter</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/babysitter/dashboard">
              {({ isActive }) => (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive ? "bg-[#00B4D8] text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                  <LayoutGrid className="h-4 w-4" />
                  Dashboard
                </span>
              )}
            </Link>
            <Link to="/babysitter/profile-setup">
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {displayFirstName}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Status:{" "}
            <span className={
              status === "Verified" ? "text-green-600 font-medium" :
              status === "Submitted" ? "text-blue-600 font-medium" :
              "text-yellow-600 font-medium"
            }>
              {status}
            </span>
          </p>
        </div>

        {/* 4 cards — single column */}
        <div className="flex flex-col gap-4">
          {/* Card 1: Profile completion */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900">Profile completion</h3>
            <Progress value={completion} className="h-2 [&>[role=progressbar]]:bg-[#00B4D8]" />
            <p className="text-sm text-[#00B4D8] font-medium">{completion}% complete</p>
            <Button
              size="sm"
              onClick={() => navigate({ to: "/babysitter/profile-setup" })}
              className="w-full bg-[#00B4D8] hover:bg-[#0096B4] text-white text-sm"
            >
              Continue your profile
            </Button>
          </div>

          {/* Card 2: Interviews */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900">Interviews</h3>
            {!upcomingInterview ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-600">Status: <span className="font-medium text-gray-800">Not scheduled</span></span>
                </div>
                <p className="text-xs text-gray-400">You'll be notified once a family schedules an interview with you.</p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">With family</span>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                    {upcomingInterview.status}
                  </Badge>
                </div>
                {upcomingInterview.scheduledAt && (
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(upcomingInterview.scheduledAt).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}
                  </p>
                )}
                {upcomingInterview.meet_link ? (
                  <a
                    href={upcomingInterview.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#00B4D8] font-medium hover:underline"
                  >
                    <Video className="h-4 w-4" /> Join meeting
                  </a>
                ) : (
                  <p className="text-xs text-gray-400 italic">Meet link will be added by the team</p>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Notifications */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-400">No notifications yet.</p>
          </div>

          {/* Card 4: Match & Schedule */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900">Match &amp; schedule</h3>
            <p className="text-sm text-gray-400">Once you're matched with a family, their details and schedule will appear here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
