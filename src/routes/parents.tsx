import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchMatches, tierBadgeClass, type Match } from "@/lib/matches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/parents")({
  head: () => ({ meta: [{ title: "Parents — Kiddobee Admin" }] }),
  component: ParentsPage,
});

function ParentsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });

  const parents = useMemo(() => {
    const map = new Map<string, { parent_name: string; matches: Match[] }>();
    (data ?? []).forEach((m) => {
      if (!map.has(m.parent_id)) map.set(m.parent_id, { parent_name: m.parent_name, matches: [] });
      map.get(m.parent_id)!.matches.push(m);
    });
    map.forEach((g) => g.matches.sort((a, b) => b.final_score - a.final_score));
    return Array.from(map.entries());
  }, [data]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">Failed to load parents</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Parents</h1>
        <p className="text-sm text-muted-foreground">{parents.length} parents · top 3 sitter matches</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {parents.map(([parentId, { parent_name, matches }]) => (
          <Card key={parentId}>
            <CardHeader>
              <CardTitle className="text-base">{parent_name}</CardTitle>
              <p className="text-xs text-muted-foreground">{parentId}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {matches.slice(0, 3).map((m, i) => (
                <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">#{i + 1}</span>
                    <span className="text-sm font-medium truncate">{m.sitter_name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={tierBadgeClass(m.tier)}>{m.tier}</Badge>
                    <span className="text-sm font-bold tabular-nums">{m.final_score}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
