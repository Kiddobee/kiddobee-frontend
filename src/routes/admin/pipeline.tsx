import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { supabase, pick, fullName, fmtDate } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { PageHeader, LoadingState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pipeline")({
  head: () => ({ meta: [{ title: "Pipeline — Kiddobee Admin" }] }),
  component: PipelinePage,
});

const STAGES = [
  { id: "new", key: "st_new", match: ["new", "nouveau"] },
  { id: "profile_review", key: "st_profile", match: ["profile review", "profile", "profil"] },
  { id: "documents_pending", key: "st_docs", match: ["documents pending", "documents", "document"] },
  { id: "hr_interview_scheduled", key: "st_hr", match: ["hr interview", "hr", "rh"] },
] as const;

function stageIdOf(raw: unknown): string {
  const s = String(raw ?? "").toLowerCase();
  for (const st of STAGES) if (st.match.some((m) => s.includes(m))) return st.id;
  return "new";
}

function DraggableCard({ id, sitter, locale }: { id: string; sitter: any; locale: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`rounded-md border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing select-none ${isDragging ? "opacity-50" : ""}`}>
      <p className="text-sm font-medium truncate">{fullName(sitter)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground truncate">
        {pick<string>(sitter, "Location") ?? "—"} · {fmtDate(pick(sitter, "Date Joined"), locale)}
      </p>
    </div>
  );
}

function DroppableColumn({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex flex-col rounded-lg border bg-muted/30 ${isOver ? "ring-2 ring-primary" : ""}`}>
      <div className="px-3 py-2 border-b bg-card/50 rounded-t-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">{children}</div>
    </div>
  );
}

function PipelinePage() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const { data, isLoading } = useQuery({
    queryKey: ["babysitters"],
    queryFn: async () => { const { data } = await supabase.from("Babysitter").select("*"); return data ?? []; },
  });
  const [optimistic, setOptimistic] = useState<Record<string, string>>({});
  const mut = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await supabase.from("Babysitter").update({ "Profile Status": stage }).eq("Sitter ID", id);
      if (error) throw error;
    },
    onError: (_e, vars) => { setOptimistic((m) => { const n = { ...m }; delete n[vars.id]; return n; }); toast.error("Could not update stage"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["babysitters"] }),
  });
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    STAGES.forEach((s) => (map[s.id] = []));
    (data ?? []).forEach((row: any) => {
      const sid = optimistic[row["Sitter ID"]] ?? stageIdOf(row["Profile Status"]);
      (map[sid] ?? map.new).push(row);
    });
    return map;
  }, [data, optimistic]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  function onDragEnd(e: DragEndEvent) {
    const sitterId = String(e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!target) return;
    setOptimistic((m) => ({ ...m, [sitterId]: target }));
    mut.mutate({ id: sitterId, stage: target });
  }
  return (
    <div>
      <PageHeader title={t("pipeline")} />
      {isLoading ? <LoadingState /> : (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STAGES.map((st) => (
              <DroppableColumn key={st.id} id={st.id} title={t(st.key)}>
                {grouped[st.id].length === 0 ? <p className="text-xs text-muted-foreground px-1 py-2">—</p> :
                  grouped[st.id].map((s: any) => <DraggableCard key={s["Sitter ID"]} id={s["Sitter ID"]} sitter={s} locale={locale} />)}
              </DroppableColumn>
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}
