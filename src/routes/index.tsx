import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchMatches } from "@/lib/matches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Baby, ListChecks, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Kiddobee Admin" }] }),
  component: Dashboard,
});

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">Failed to load data</p>;
  const matches = data ?? [];

  const parents = new Set(matches.map((m) => m.parent_id));
  const sitters = new Set(matches.map((m) => m.sitter_id));
  const avg = matches.length
    ? Math.round(matches.reduce((s, m) => s + m.final_score, 0) / matches.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of matching activity</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Parents" value={parents.size} icon={Users} />
        <StatCard label="Total Sitters" value={sitters.size} icon={Baby} />
        <StatCard label="Total Matches" value={matches.length} icon={ListChecks} />
        <StatCard label="Average Score" value={`${avg}/100`} icon={TrendingUp} />
      </div>
    </div>
  );
}
