import { useState } from "react";
import Avatar from "../Avatar";
import { formatMoney, formatRelative } from "./shared";
import { PIPELINE_COLUMNS, fullName, type Contact, type Stage } from "../../lib/leadsData";

export default function PipelineBoard({
  contacts,
  onOpenContact,
  onMoveStage,
}: {
  contacts: Contact[];
  onOpenContact: (id: string) => void;
  onMoveStage: (id: string, stage: Stage) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  const byStage = (stage: Stage) => contacts.filter((c) => c.stage === stage);

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
      {PIPELINE_COLUMNS.map((stage) => {
        const items = byStage(stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId) onMoveStage(dragId, stage);
              setDragId(null);
              setDragOverStage(null);
            }}
            className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-paper/40 p-2.5 transition-colors ${
              dragOverStage === stage ? "border-brand bg-brand/5" : "border-line"
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1.5">
              <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">{stage}</span>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">{items.length}</span>
            </div>
            <div className="flex-1 space-y-2">
              {items.length === 0 && <p className="px-2 py-6 text-center text-xs text-ink-soft">No contacts</p>}
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => onOpenContact(c.id)}
                  className={`cursor-pointer rounded-xl border border-line bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.05)] transition-opacity hover:border-brand/40 ${
                    dragId === c.id ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={fullName(c)} size={26} />
                    <span className="truncate text-sm font-medium text-ink">{fullName(c)}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-soft">{c.intent} · {c.preferredLocations[0] ?? (c.location || "—")}</p>
                  <p className="text-xs font-medium text-ink">{formatMoney(c.budgetMax ?? c.budgetMin, c.currency)}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-ink-soft">{formatRelative(c.lastActivityAt)}</span>
                    <div className="flex items-center gap-1.5">
                      {c.nextFollowUp && <span className="h-1.5 w-1.5 rounded-full bg-brand" title="Follow-up due" />}
                      <span className="rounded-full bg-paper px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">{c.assignedAgent}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
