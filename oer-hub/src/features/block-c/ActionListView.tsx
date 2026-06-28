import { useRef, useState } from "react";
import type { IAuthorItemResponse, IPerRubricReport } from "../../api/types";
import { TAG_CONFIG } from "../block-b/annotationTagConfig";
import { StatusPillGroup } from "./StatusPillGroup";

type ActionFilter = "all" | "action_item" | "quick_fix";

type ActionItem = {
  annotationId: string;
  criterionId: string;
  criterionTitle: string;
  tag: "action_item" | "quick_fix";
  comment: string;
  oerId: string;
  rubricTemplateId: IPerRubricReport["rubricTemplateId"];
};

function ActionCard({
  item,
  itemResponses,
  onItemResponseSaved,
  onOpenInReport,
}: {
  item: ActionItem;
  itemResponses: IAuthorItemResponse[];
  onItemResponseSaved: (r: IAuthorItemResponse) => void;
  onOpenInReport: (criterionId: string, annotationId: string) => void;
}) {
  const cfg = TAG_CONFIG[item.tag];
  const existingResponse = itemResponses.find((r) => r.annotationId === item.annotationId);
  const itemStatus = existingResponse?.itemStatus ?? null;
  const savedNote = existingResponse?.revisionNote ?? "";
  const [expandedRevNote, setExpandedRevNote] = useState(savedNote.length > 0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleRevNoteChange(value: string) {
    const base: IAuthorItemResponse = existingResponse ?? {
      annotationId: item.annotationId,
      oerId: item.oerId,
      rubricTemplateId: item.rubricTemplateId,
      itemStatus: null,
    };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onItemResponseSaved({ ...base, revisionNote: value });
    }, 800);
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-4 py-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Criterion badge + tag pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-semibold text-on-surface-variant/60 bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/20">
              {item.criterionId}
            </span>
            <span className="text-[11px] text-on-surface-variant/50 truncate">{item.criterionTitle}</span>
            <span className={`flex items-center gap-1 text-[11px] font-semibold ${cfg.cls}`}>
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {cfg.icon}
              </span>
              {cfg.label}
            </span>
          </div>
          {/* Comment */}
          <p className="text-sm text-on-surface leading-relaxed">{item.comment}</p>
        </div>
        <div className="flex-shrink-0">
          <StatusPillGroup
            itemId={item.annotationId}
            status={itemStatus}
            onChange={(status) =>
              onItemResponseSaved({
                annotationId: item.annotationId,
                oerId: item.oerId,
                rubricTemplateId: item.rubricTemplateId,
                itemStatus: status,
              })
            }
          />
        </div>
      </div>
      {/* Revision log */}
      <div className="border-t border-outline-variant/20 pt-2">
        {expandedRevNote ? (
          <textarea
            rows={2}
            placeholder="How you addressed this…"
            defaultValue={savedNote}
            onChange={(e) => handleRevNoteChange(e.target.value)}
            onBlur={(e) => {
              if (!e.target.value.trim()) setExpandedRevNote(false);
            }}
            autoFocus={!savedNote}
            className="w-full rounded border border-outline-variant/40 bg-white px-2 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none resize-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setExpandedRevNote(true)}
            className="text-xs text-on-surface-variant/40 hover:text-secondary transition-colors"
          >
            + Revision log
          </button>
        )}
      </div>
      {/* Open in report */}
      <button
        type="button"
        onClick={() => onOpenInReport(item.criterionId, item.annotationId)}
        className="text-xs text-secondary hover:underline transition-colors"
      >
        ↗ Open in report
      </button>
    </div>
  );
}

interface ActionListViewProps {
  report: IPerRubricReport;
  itemResponses: IAuthorItemResponse[];
  onItemResponseSaved: (r: IAuthorItemResponse) => void;
  onOpenInReport: (criterionId: string, annotationId: string) => void;
}

export function ActionListView({
  report,
  itemResponses,
  onItemResponseSaved,
  onOpenInReport,
}: ActionListViewProps) {
  const [filter, setFilter] = useState<ActionFilter>("all");

  const allActionItems: ActionItem[] = report.criteria.flatMap((c) =>
    c.annotations
      .filter((a) => a.tag === "action_item" || a.tag === "quick_fix")
      .map((a) => ({
        annotationId: a.id,
        criterionId: c.criterionId,
        criterionTitle: c.criterionTitle,
        tag: a.tag as "action_item" | "quick_fix",
        comment: a.comment,
        oerId: report.oer.id,
        rubricTemplateId: report.rubricTemplateId,
      }))
  );

  const filtered = filter === "all" ? allActionItems : allActionItems.filter((a) => a.tag === filter);
  const handledCount = allActionItems.filter((a) => {
    return itemResponses.find((r) => r.annotationId === a.annotationId)?.itemStatus != null;
  }).length;

  if (allActionItems.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="max-w-3xl mx-auto py-16 text-center">
          <p className="text-on-surface-variant/60 text-sm">
            No action items or quick fixes — use the Report view to review feedback.
          </p>
        </div>
      </div>
    );
  }

  const filterTabs: { key: ActionFilter; label: string; count: number }[] = [
    { key: "all",         label: "All",          count: allActionItems.length },
    { key: "action_item", label: "Action items",  count: allActionItems.filter((a) => a.tag === "action_item").length },
    { key: "quick_fix",   label: "Quick fixes",   count: allActionItems.filter((a) => a.tag === "quick_fix").length },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {filterTabs.map(({ key, label, count }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={[
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
                    active
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-outline-variant/30 text-on-surface-variant/50 hover:border-outline-variant hover:text-on-surface-variant",
                  ].join(" ")}
                >
                  {label}
                  <span className={`rounded-full px-1 text-[10px] font-bold ${active ? "bg-primary/15" : "bg-outline-variant/20"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <span className={[
            "text-[11px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0",
            handledCount >= allActionItems.length
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "bg-surface-container border-outline-variant/30 text-on-surface-variant/60",
          ].join(" ")}>
            {handledCount}/{allActionItems.length} handled
          </span>
        </div>

        {/* Cards */}
        {filtered.map((item) => (
          <ActionCard
            key={item.annotationId}
            item={item}
            itemResponses={itemResponses}
            onItemResponseSaved={onItemResponseSaved}
            onOpenInReport={onOpenInReport}
          />
        ))}

        {filtered.length === 0 && (
          <p className="text-xs text-on-surface-variant/50 text-center py-4">
            No {filter === "action_item" ? "action items" : "quick fixes"} in this review.
          </p>
        )}
      </div>
    </div>
  );
}
