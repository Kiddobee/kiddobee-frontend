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

function capStatus(s: string): string {
  if (!s || s === "—") return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("scheduled")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (s.includes("cancel")) return "bg-red-100 text-red-700 border-red-200";
  if (s.includes("complete")) return "bg-green-100 text-green-700 border-green-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
}

function InterviewRow({ interview }: { interview: any }) {
  const qc = useQueryClient();
  const [editingLink, setEditingLink] = useState(false);
  const [link, setLink] = useState(interview.meet_link ?? "");
  const [editingDate, setEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(
    interview.scheduledAt ? new Date(interview.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [savingLink, setSavingLink] = useState(false);
  const [savingDate, setSavingDate] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isCancelled = interview.status?.toLowerCase() === "cancelled";

  function refresh() {
    qc.invalidateQueries({ queryKey: ["interviews"] });
  }

  async function saveLink() {
    setSavingLink(true);
    const { error } = await supabase.from("Interview").update({ meet_link: link || null }).eq("id", interview.id);
    setSavingLink(false);
    if (error) { toast.error("Failed to save: " + error.message); return; }
    toast.success("Meet link saved");
    setEditingLink(false);
    refresh();
  }

  async function saveDate() {
    if (!newDate) return;
    setSavingDate(true);
    const { error } = await supabase
      .from("Interview")
      .update({ scheduledAt: new Date(newDate).toISOString(), status: "Scheduled" })
      .eq("id", interview.id);
    setSavingDate(false);
    if (error) { toast.error("Failed to update: " + error.message); return; }
    toast.success("Interview updated");
    setEditingDate(false);
    refresh();
  }

  async function cancelInterview() {
    setCancelling(true);
    const { error } = await supabase.from("Interview").update({ status: "Cancelled" }).eq("id", interview.id);
    setCancelling(false);
    if (error) { toast.error("Failed to cancel: " + error.message); return; }
    toast.success("Interview cancelled");
    refresh();
  }

  return (
    <TableRow className={isCancelled ? "opacity-50" : ""}>
      <TableCell className="font-medium">{interview.babysitter_name ?? "—"}</TableCell>
      <TableCell>{interview.parent_id ?? "—"}</TableCell>

      {/* Scheduled date — click to edit */}
      <TableCell>
        {editingDate ? (
          <div className="flex gap-1.5 items-center">
            <Input
              type="datetime-local"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="h-7 text-xs w-44"
              autoFocus
            />
            <Button size="sm" disabled={savingDate} onClick={saveDate} className="h-7 px-2 text-xs bg-[#00B4D8] hover:bg-[#0096B4] text-white shrink-0">
              {savingDate ? "…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingDate(false)} className="h-7 px-2 text-xs shrink-0">
              ✕
            </Button>
          </div>
        ) : (
          <button onClick={() => !isCancelled && setEditingDate(true)} className={`text-xs text-left ${!isCancelled ? "hover:underline" : ""}`}>
            {interview.scheduledAt ? fmtDateTime(interview.scheduledAt) : <span className="text-gray-400 italic">Set date…</span>}
          </button>
        )}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant="outline" className={`text-xs ${statusColor(interview.status ?? "")}`}>
          {capStatus(interview.status ?? "—")}
        </Badge>
      </TableCell>

      {/* Meet link — click to edit */}
      <TableCell>
        {editingLink ? (
          <div className="flex gap-1.5 items-center min-w-[220px]">
            <Input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="h-7 text-xs"
              autoFocus
            />
            <Button size="sm" disabled={savingLink} onClick={saveLink} className="h-7 px-2 text-xs bg-[#00B4D8] hover:bg-[#0096B4] text-white shrink-0">
              {savingLink ? "…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditingLink(false); setLink(interview.meet_link ?? ""); }} className="h-7 px-2 text-xs shrink-0">
              ✕
            </Button>
          </div>
        ) : (
          <button onClick={() => !isCancelled && setEditingLink(true)} className={`text-xs text-left ${!isCancelled ? "hover:underline" : ""}`}>
            {interview.meet_link
              ? <span className="text-[#00B4D8] font-medium">{interview.meet_link}</span>
              : <span className="text-gray-400 italic">{isCancelled ? "—" : "Add link…"}</span>
            }
          </button>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell>
        {!isCancelled && (
          <Button
            size="sm"
            variant="outline"
            disabled={cancelling}
            onClick={cancelInterview}
            className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
          >
            {cancelling ? "…" : "Cancel"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function InterviewsPage() {
  const { t } = useI18n();
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
                <TableHead>Babysitter</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Meet link</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((i: any) => <InterviewRow key={i.id} interview={i} />)}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
