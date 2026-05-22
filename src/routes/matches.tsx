import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchMatches, tierBadgeClass, type Match } from "@/lib/matches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/matches")({
  head: () => ({ meta: [{ title: "Matches — Kiddobee Admin" }] }),
  component: MatchesPage,
});

function MatchesPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });

  const grouped = useMemo(() => {
    const map = new Map<string, { parent_name: string; matches: Match[] }>();
    (data ?? []).forEach((m) => {
      if (!map.has(m.parent_id)) map.set(m.parent_id, { parent_name: m.parent_name, matches: [] });
      map.get(m.parent_id)!.matches.push(m);
    });
    map.forEach((g) => g.matches.sort((a, b) => b.final_score - a.final_score));
    return Array.from(map.entries());
  }, [data]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">Failed to load matches</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Matches</h1>
        <p className="text-sm text-muted-foreground">Ranked matches grouped by parent</p>
      </div>

      {grouped.map(([parentId, { parent_name, matches }]) => (
        <Card key={parentId}>
          <CardHeader>
            <CardTitle className="text-lg">
              {parent_name} <span className="text-muted-foreground text-sm font-normal">· {parentId}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sitter Name</TableHead>
                  <TableHead>Score /100</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Lang/30</TableHead>
                  <TableHead>Exp/25</TableHead>
                  <TableHead>Rat/30</TableHead>
                  <TableHead>Miss/25</TableHead>
                  <TableHead>Pers/30</TableHead>
                  <TableHead>Age/30</TableHead>
                  <TableHead>Prox/20</TableHead>
                  <TableHead>Misc/20</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.sitter_name}</TableCell>
                    <TableCell className="font-bold">{m.final_score}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tierBadgeClass(m.tier)}>{m.tier}</Badge>
                    </TableCell>
                    <TableCell>{m.lang_score}</TableCell>
                    <TableCell>{m.experience_score}</TableCell>
                    <TableCell>{m.ratings_score}</TableCell>
                    <TableCell>{m.missions_score}</TableCell>
                    <TableCell>{m.personality_score}</TableCell>
                    <TableCell>{m.age_score}</TableCell>
                    <TableCell>{m.proximity_score}</TableCell>
                    <TableCell>{m.misc_score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
