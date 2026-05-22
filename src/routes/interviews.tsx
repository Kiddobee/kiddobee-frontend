import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, pick, fmtDateTime } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/interviews")({
  head: () => ({ meta: [{ title: "Interviews — Kiddobee Admin" }] }),
  component: InterviewsPage,
});

function InterviewsPage() {
  const { t, lang } = useI18n();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const { data, isLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data } = await supabase.from("Interview").select("*").order("scheduledAt", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title={t("interviews")} />
      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("candidate")}</TableHead>
                <TableHead>{t("scheduled")}</TableHead>
                <TableHead>{t("status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((i: any) => {
                const type = String(pick(i, "type") ?? "").toLowerCase();
                const isHR = type.includes("hr") || type.includes("rh");
                return (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Badge className={isHR ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"} variant="outline">
                        {isHR ? t("hrInterview") : t("interview")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{pick<string>(i, "candidateName", "candidate", "name") ?? "—"}</TableCell>
                    <TableCell>{fmtDateTime(pick(i, "scheduledAt", "scheduled_at", "scheduled"), locale)}</TableCell>
                    <TableCell><Badge variant="secondary">{pick<string>(i, "status") ?? "—"}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
