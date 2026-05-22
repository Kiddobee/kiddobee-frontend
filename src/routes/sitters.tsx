import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchMatches } from "@/lib/matches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/sitters")({
  head: () => ({ meta: [{ title: "Sitters — Kiddobee Admin" }] }),
  component: SittersPage,
});

function SittersPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["matches"], queryFn: fetchMatches });

  const sitters = useMemo(() => {
    const map = new Map<string, { sitter_name: string; scores: number[] }>();
    (data ?? []).forEach((m) => {
      if (!map.has(m.sitter_id)) map.set(m.sitter_id, { sitter_name: m.sitter_name, scores: [] });
      map.get(m.sitter_id)!.scores.push(m.final_score);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({
        id,
        name: v.sitter_name,
        matches: v.scores.length,
        avg: Math.round(v.scores.reduce((s, x) => s + x, 0) / v.scores.length),
        best: Math.max(...v.scores),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [data]);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">Failed to load sitters</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sitters</h1>
        <p className="text-sm text-muted-foreground">{sitters.length} sitters</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Sitters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Matches</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">Best Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sitters.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground text-xs">{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.matches}</TableCell>
                  <TableCell className="text-right tabular-nums font-bold">{s.avg}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.best}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
