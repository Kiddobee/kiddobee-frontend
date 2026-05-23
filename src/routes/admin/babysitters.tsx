import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, pick, fullName, fmtDate } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/babysitters")({
  head: () => ({ meta: [{ title: "Babysitters — Kiddobee Admin" }] }),
  component: BabysittersPage,
});

function BabysittersPage() {
  const { t, lang } = useI18n();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const { data, isLoading } = useQuery({
    queryKey: ["babysitters", "table"],
    queryFn: async () => {
      const { data } = await supabase.from("Babysitter").select("*").order("Date Joined", { ascending: false, nullsFirst: false });
      return data ?? [];
    },
  });
  return (
    <div>
      <PageHeader title={t("babysitters")} />
      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>Profile Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>{t("joined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((b: any, i: number) => (
                <TableRow key={b["Sitter ID"] ?? i}>
                  <TableCell className="font-medium">{fullName(b)}</TableCell>
                  <TableCell><Badge variant="secondary">{pick<string>(b, "Profile Status") ?? "—"}</Badge></TableCell>
                  <TableCell>{pick<string>(b, "Location") ?? "—"}</TableCell>
                  <TableCell>{fmtDate(pick(b, "Date Joined"), locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
