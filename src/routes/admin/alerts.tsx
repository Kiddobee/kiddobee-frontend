import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, fmtDateTime } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/admin/alerts")({
  head: () => ({ meta: [{ title: "Alerts — Kiddobee Admin" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { t, lang } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => { const { data } = await supabase.from("Alert").select("*").order("createdAt", { ascending: false }); return data ?? []; },
  });
  return (
    <div>
      <PageHeader title={t("alerts")} />
      {isLoading ? <LoadingState /> : !data || data.length === 0 ? <EmptyState /> : (
        <Card><CardContent className="p-0 divide-y">
          {data.map((a: any) => (
            <div key={a.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.title ?? a.message ?? "Alert"}</p>
                {a.message && a.title && <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {fmtDateTime(a.createdAt ?? a.created_at, lang === "fr" ? "fr-FR" : "en-US")}
              </span>
            </div>
          ))}
        </CardContent></Card>
      )}
    </div>
  );
}
