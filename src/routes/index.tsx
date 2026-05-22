import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Baby, Users, Inbox, CalendarClock, CalendarCheck, ShieldCheck } from "lucide-react";
import { supabase, fmtDateTime } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Kiddobee Admin" }] }),
  component: Dashboard,
});

async function fetchDashboard() {
  const [babysitters, parents, requests, reservations, interviews, alerts] = await Promise.all([
    supabase.from("Babysitter").select("id,stage", { count: "exact" }),
    supabase.from("Parent").select("id", { count: "exact", head: true }),
    supabase.from("Request").select("id,status", { count: "exact" }),
    supabase.from("Reservation").select("id,startDate,start", { count: "exact" }),
    supabase.from("Interview").select("id,status", { count: "exact" }),
    supabase.from("Alert").select("*").order("createdAt", { ascending: false }).limit(5),
  ]);
  const bs = babysitters.data ?? [];
  const approved = bs.filter((b: any) => {
    const s = String(b.stage ?? "").toLowerCase();
    return s.includes("approved") || s.includes("approuv");
  }).length;
  const reqs = requests.data ?? [];
  const openReqs = reqs.filter((r: any) => {
    const s = String(r.status ?? "").toLowerCase();
    return s.includes("open") || s.includes("ouvert") || s.includes("pending");
  }).length;
  const now = Date.now();
  const upcoming = (reservations.data ?? []).filter((r: any) => {
    const d = new Date(r.startDate ?? r.start ?? 0).getTime();
    return d >= now;
  }).length;
  const pending = (interviews.data ?? []).filter((i: any) => {
    const s = String(i.status ?? "").toLowerCase();
    return s.includes("pending") || s.includes("scheduled") || s.includes("planif");
  }).length;
  return {
    babysitters: babysitters.count ?? bs.length,
    approved,
    parents: parents.count ?? 0,
    openRequests: openReqs,
    upcoming,
    pending,
    alerts: alerts.data ?? [],
  };
}

function StatCard({ label, value, Icon }: { label: string; value: number | string; Icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });
  const d = data ?? { babysitters: 0, approved: 0, parents: 0, openRequests: 0, upcoming: 0, pending: 0, alerts: [] };

  return (
    <div>
      <PageHeader title={t("dashboard")} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("babysitters")} value={isLoading ? "—" : d.babysitters} Icon={Baby} />
        <StatCard label={t("approvedBabysitters")} value={isLoading ? "—" : d.approved} Icon={ShieldCheck} />
        <StatCard label={t("parents")} value={isLoading ? "—" : d.parents} Icon={Users} />
        <StatCard label={t("openRequests")} value={isLoading ? "—" : d.openRequests} Icon={Inbox} />
        <StatCard label={t("upcomingReservations")} value={isLoading ? "—" : d.upcoming} Icon={CalendarClock} />
        <StatCard label={t("pendingInterviews")} value={isLoading ? "—" : d.pending} Icon={CalendarCheck} />
      </div>

      <h2 className="mt-8 mb-3 text-base font-semibold">{t("recentAlerts")}</h2>
      <Card>
        <CardContent className="p-0 divide-y">
          {d.alerts.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">{t("empty")}</div>
          ) : (
            d.alerts.map((a: any) => (
              <div key={a.id} className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.title ?? a.message ?? "Alert"}</p>
                  {a.message && a.title && <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {fmtDateTime(a.createdAt ?? a.created_at, lang === "fr" ? "fr-FR" : "en-US")}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
