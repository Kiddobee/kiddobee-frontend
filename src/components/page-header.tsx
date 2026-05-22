import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground">
        {message ?? t("empty")}
      </CardContent>
    </Card>
  );
}

export function LoadingState() {
  const { t } = useI18n();
  return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
}
