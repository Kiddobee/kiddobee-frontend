import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, fmtDateTime } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/interviews")({
  head: () => ({ meta: [{ title: "Interviews — Kiddobee Admin" }] }),
  component: InterviewsPage,
});

function MeetLinkCell({ interview }: { interview: any }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState(interview.meet_link ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("Interview").update({ meet_link: link || null }).eq("id", interview.id);
    setSaving(false);
    if (error) { toast.error("Failed to save: " + error.message); return; }
    toast.success("Meet link saved");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["interviews"] });
  }

  if (editing) {
    return (
      <div className="flex gap-1.5 items-center min-w-[220px]">
        <Input
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://meet.google.com/..."
          className="h-7 text-xs"
          autoFocus
        />
        <Button size="sm" disabled={saving} onClick={save} className="h-7 px-2 text-xs bg-[#00B4D8] hover:bg-[#0096B4] text-white shrink-0">
          {saving ? "…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setLink(interview.meet_link ?? ""); }} className="h-7 px-2 text-xs shrink-0">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs text-left hover:underline"
    >
      {interview.meet_link ? (
        <span className="text-[#00B4D8] font-medium">{interview.meet_link}</span>
      ) : (
        <span className="text-gray-400 italic">Add link…</span>
      )}
    </button>
  );
}

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
                <TableHead>{t("candidate")}</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>{t("scheduled")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>Meet link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((i: any) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.babysitter_name ?? "—"}</TableCell>
                  <TableCell>{i.parent_id ?? "—"}</TableCell>
                  <TableCell>{i.scheduledAt ? fmtDateTime(i.scheduledAt, locale) : "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{i.status ?? "—"}</Badge></TableCell>
                  <TableCell><MeetLinkCell interview={i} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
