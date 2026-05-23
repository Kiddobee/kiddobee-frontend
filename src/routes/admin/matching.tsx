import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchAllMatches, fetchMatchesForParent, recalculateMatches, tierBadgeClass } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/matching")({
  head: () => ({ meta: [{ title: "Matching — Kiddobee Admin" }] }),
  component: MatchingPage,
});

function MatchingPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [parentId, setParentId] = useState<string>("");
  const allMatches = useQuery({ queryKey: ["matches", "all"], queryFn: fetchAllMatches });
  const parents = useMemo(() => {
    const map = new Map<string, string>();
    (allMatches.data ?? []).forEach((m) => { if (!map.has(m.parent_id)) map.set(m.parent_id, m.parent_name ?? m.parent_id); });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [allMatches.data]);
  const matches = useQuery({ queryKey: ["matches", "parent", parentId], queryFn: () => fetchMatchesForParent(parentId), enabled: Boolean(parentId) });
  const recalc = useMutation({
    mutationFn: recalculateMatches,
    onSuccess: () => { toast.success("Scores recalculated"); qc.invalidateQueries({ queryKey: ["matches"] }); },
    onError: () => toast.error("Recalculation failed"),
  });
  const ranked = useMemo(() => [...(matches.data ?? [])].sort((a, b) => b.final_score - a.final_score), [matches.data]);
  return (
    <div>
      <PageHeader title={t("matchingWorkbench")} subtitle={t("matchingSubtitle")} actions={
        <Button onClick={() => recalc.mutate()} disabled={recalc.isPending}>
          {recalc.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {recalc.isPending ? t("recalculating") : t("recalculate")}
        </Button>
      } />
      <Card className="p-4 mb-6">
        <div className="max-w-sm">
          <Select value={parentId} onValueChange={setParentId}>
            <SelectTrigger><SelectValue placeholder={t("selectParent")} /></SelectTrigger>
            <SelectContent>
              {parents.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name} <span className="text-muted-foreground">· {id}</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
      {!parentId ? <EmptyState message={t("noParentSelected")} /> : matches.isLoading ? <LoadingState /> : ranked.length === 0 ? <EmptyState /> : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("babysitter")}</TableHead>
                <TableHead>{t("score")} /100</TableHead>
                <TableHead>{t("tier")}</TableHead>
                <TableHead>Lang/30</TableHead><TableHead>Exp/25</TableHead><TableHead>Rat/30</TableHead>
                <TableHead>Miss/25</TableHead><TableHead>Pers/30</TableHead><TableHead>Age/30</TableHead>
                <TableHead>Prox/20</TableHead><TableHead>Misc/20</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((m, i) => (
                <TableRow key={m.id}>
                  <TableCell className="font-bold text-muted-foreground tabular-nums">{i + 1}</TableCell>
                  <TableCell className="font-medium">{m.sitter_name}</TableCell>
                  <TableCell className="text-xl font-bold tabular-nums">{m.final_score}</TableCell>
                  <TableCell><Badge variant="outline" className={tierBadgeClass(m.tier)}>{m.tier}</Badge></TableCell>
                  <TableCell className="tabular-nums">{m.lang_score}</TableCell>
                  <TableCell className="tabular-nums">{m.experience_score}</TableCell>
                  <TableCell className="tabular-nums">{m.ratings_score}</TableCell>
                  <TableCell className="tabular-nums">{m.missions_score}</TableCell>
                  <TableCell className="tabular-nums">{m.personality_score}</TableCell>
                  <TableCell className="tabular-nums">{m.age_score}</TableCell>
                  <TableCell className="tabular-nums">{m.proximity_score}</TableCell>
                  <TableCell className="tabular-nums">{m.misc_score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
