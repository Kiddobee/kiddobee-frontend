import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, pick, fullName, fmtDate } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/parents")({
  head: () => ({ meta: [{ title: "Parents — Kiddobee Admin" }] }),
  component: ParentsPage,
});

function ParentsPage() {
  const { t, lang } = useI18n();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const { data, isLoading } = useQuery({
    queryKey: ["parents"],
    queryFn: async () => {
      const { data } = await supabase.from("Parent").select("*").order("Date Joined", { ascending: false, nullsFirst: false });
      return data ?? [];
    },
  });
  return (
    <div>
      <PageHeader title={t("parents")} />
      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("email")}</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>{t("joined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p: any, i: number) => (
                <TableRow key={p["Parent ID"] ?? i}>
                  <TableCell className="font-medium">{fullName(p)}</TableCell>
                  <TableCell>{pick<string>(p, "Email", "email") ?? "—"}</TableCell>
                  <TableCell>{pick<string>(p, "Location (Arrondissement / City)") ?? "—"}</TableCell>
                  <TableCell>{fmtDate(pick(p, "Date Joined"), locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
