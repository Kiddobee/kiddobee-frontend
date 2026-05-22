import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, pick, fmtDateTime } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Requests — Kiddobee Admin" }] }),
  component: RequestsPage,
});

function RequestsPage() {
  const { t, lang } = useI18n();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const { data, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: async () => {
      const { data } = await supabase.from("Request").select("*").order("createdAt", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title={t("requests")} />
      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("parent")}</TableHead>
                <TableHead>{t("start")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{pick<string>(r, "parentName", "parent") ?? "—"}</TableCell>
                  <TableCell>{fmtDateTime(pick(r, "startDate", "start_date", "start"), locale)}</TableCell>
                  <TableCell><Badge variant="secondary">{pick<string>(r, "status") ?? "—"}</Badge></TableCell>
                  <TableCell>{fmtDateTime(pick(r, "createdAt", "created_at"), locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
