import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, pick, fmtDateTime } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/contracts")({
  head: () => ({ meta: [{ title: "Contracts — Kiddobee Admin" }] }),
  component: ContractsPage,
});

function ContractsPage() {
  const { t, lang } = useI18n();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const { data, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => { const { data } = await supabase.from("Contract").select("*").order("createdAt", { ascending: false }); return data ?? []; },
  });
  return (
    <div>
      <PageHeader title={t("contracts")} />
      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("parent")}</TableHead>
                <TableHead>{t("babysitter")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{pick<string>(c, "parentName", "parent") ?? "—"}</TableCell>
                  <TableCell>{pick<string>(c, "babysitterName", "babysitter", "sitterName") ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{pick<string>(c, "status") ?? "—"}</Badge></TableCell>
                  <TableCell>{fmtDateTime(pick(c, "createdAt", "created_at"), locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
