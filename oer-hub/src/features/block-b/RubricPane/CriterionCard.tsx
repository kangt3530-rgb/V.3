import { useState } from "react";
import type { IRubricCriterion, IAnnotation } from "../../../api/types";
import { useReviewStore } from "../../../store/reviewStore";
import { getProficientRubricMarkdownText } from "../../../data/rubricProficientLookup";
import { EvidenceBank } from "./EvidenceBank";
import { CriterionDetailOverlay } from "./CriterionDetailOverlay";

interface CriterionCardProps {
  criterion:          IRubricCriterion;
  annotations:        IAnnotation[];
  activeAnnotationId: string | null | undefined;
  onEvidenceClick:    (annotation: IAnnotation) => void;
  onFocus:            () => void;
}

const BTN: {
  key: "ni" | "proficient" | "exceeds";
  label: string;
  cls: string;
  activeCls: string;
}[] = [
  {
    key: "ni",
    label: "Needs Improvement",
    cls: "border-error/30 text-error hover:bg-error-container/30",
    activeCls: "bg-error-container border-error text-error",
  },
  {
    key: "proficient",
    label: "Proficient",
    cls: "border-outline-variant text-on-surface-variant hover:bg-surface-container",
    activeCls: "bg-primary text-on-primary border-primary",
  },
  {
    key: "exceeds",
    label: "Exceeds",
    cls: "border-secondary/40 text-secondary hover:bg-secondary-container/30",
    activeCls: "bg-secondary-container border-secondary text-secondary",
  },
];

export function CriterionCard({
  criterion,
  annotations,
  activeAnnotationId,
  onEvidenceClick,
  onFocus,
}: CriterionCardProps) {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const rubricTemplateId = useReviewStore((s) => s.rubricTemplateId);
  const toggleNeedsImprovementActive = useReviewStore((s) => s.toggleNeedsImprovementActive);
  const toggleExceedsActive = useReviewStore((s) => s.toggleExceedsActive);
  const toggleProficientConfirmed = useReviewStore((s) => s.toggleProficientConfirmed);
  const setNeedsImprovementText = useReviewStore((s) => s.setNeedsImprovementText);
  const setExceedsText = useReviewStore((s) => s.setExceedsText);
  const getCriterionRating = useReviewStore((s) => s.getCriterionRating);
  const isCriterionAddressed = useReviewStore((s) => s.isCriterionAddressed);

  const ratingData = getCriterionRating(criterion.id);
  const evidenceCount = annotations.length;
  const done = isCriterionAddressed(criterion.id);

  const fullProficientBody =
    getProficientRubricMarkdownText(rubricTemplateId, criterion.id) ?? criterion.standard;

  function handleBottomButton(key: "ni" | "proficient" | "exceeds") {
    if (key === "ni") toggleNeedsImprovementActive(criterion.id);
    else if (key === "exceeds") toggleExceedsActive(criterion.id);
    else toggleProficientConfirmed(criterion.id);
    if (!open) {
      setOpen(true);
      onFocus();
    }
  }

  return (
    <div
      className={[
        "rounded-sm overflow-hidden transition-all",
        done ? "bg-surface-container-lowest shadow-card" : "bg-surface-container-low",
      ].join(" ")}
    >
      <div className="px-5 py-4">
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            if (!open) onFocus();
          }}
          className="flex w-full min-w-0 items-center gap-3 text-left hover:bg-surface-container/50 transition-colors rounded-sm -ml-1 pl-1 pr-2 py-1"
        >
          <div
            className={[
              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors",
              done
                ? "bg-secondary border-secondary"
                : "border-outline-variant bg-transparent",
            ].join(" ")}
          >
            {done && (
              <span className="material-symbols-outlined text-on-secondary text-[12px]">check</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
              {criterion.id}
            </p>
            <p className="font-headline text-body-md font-semibold text-on-surface leading-snug truncate">
              {criterion.title}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {evidenceCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary-container/60 text-secondary rounded-full text-label-sm font-label font-semibold">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                {evidenceCount}
              </span>
            )}
            <ActiveRatingSummary r={ratingData} />
            <span
              className="material-symbols-outlined text-on-surface-variant text-[20px] transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              expand_more
            </span>
          </div>
        </button>
      </div>

      {open && (
        <div className="px-5 pb-5 space-y-5">
          <div className="grid grid-cols-3 gap-px bg-outline-variant/10 rounded-sm overflow-hidden min-h-[220px] items-stretch">
            {/* Side lanes: headers stay top-aligned; only bottom bar toggles comment */}
            <div className="bg-surface-container p-4 flex flex-col min-h-0">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-error flex-shrink-0">
                Needs Improvement
              </p>
              <div className="mt-3 flex-1 flex flex-col min-h-[7rem]">
                {ratingData.needsImprovementActive ? (
                  <textarea
                    value={ratingData.needsImprovementText}
                    onChange={(e) => setNeedsImprovementText(criterion.id, e.target.value)}
                    placeholder="Your feedback…"
                    rows={4}
                    className="w-full flex-1 min-h-[7rem] text-body-sm text-on-surface bg-transparent border-0 border-b border-outline-variant focus:border-secondary outline-none resize-y placeholder:text-on-surface-variant/50 transition-colors font-headline"
                  />
                ) : (
                  <div
                    className="flex-1 min-h-[7rem] border-b border-outline-variant/20"
                    aria-hidden
                  />
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDetailOpen(true);
                onFocus();
              }}
              className="bg-surface-container-low p-4 text-left hover:bg-surface-container transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 flex flex-col min-h-0"
            >
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant flex-shrink-0">
                Proficient Standard
              </p>
              <p className="font-headline text-body-sm text-on-surface leading-relaxed line-clamp-6 mt-3 flex-1 text-left">
                {criterion.standard}
              </p>
            </button>

            <div className="bg-surface-container p-4 flex flex-col min-h-0">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary flex-shrink-0">
                Exceeds
              </p>
              <div className="mt-3 flex-1 flex flex-col min-h-[7rem]">
                {ratingData.exceedsActive ? (
                  <textarea
                    value={ratingData.exceedsText}
                    onChange={(e) => setExceedsText(criterion.id, e.target.value)}
                    placeholder="Your feedback…"
                    rows={4}
                    className="w-full flex-1 min-h-[7rem] text-body-sm text-on-surface bg-transparent border-0 border-b border-secondary/40 focus:border-secondary outline-none resize-y placeholder:text-on-surface-variant/50 transition-colors font-headline"
                  />
                ) : (
                  <div
                    className="flex-1 min-h-[7rem] border-b border-secondary/20"
                    aria-hidden
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {BTN.map(({ key, label, cls, activeCls }) => {
              const active =
                key === "ni"
                  ? ratingData.needsImprovementActive
                  : key === "exceeds"
                    ? ratingData.exceedsActive
                    : ratingData.proficientConfirmed;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleBottomButton(key)}
                  className={[
                    "flex-1 py-2.5 border-2 rounded-sm text-label-md font-label font-semibold uppercase tracking-widest transition-all",
                    active ? activeCls : cls,
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div>
            <EvidenceBank
              annotations={annotations}
              activeAnnotationId={activeAnnotationId}
              onEvidenceClick={onEvidenceClick}
            />
          </div>
        </div>
      )}

      <CriterionDetailOverlay
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        criterionCode={criterion.id}
        title={criterion.title}
        bodyText={fullProficientBody}
      />
    </div>
  );
}

function ActiveRatingSummary({
  r,
}: {
  r: {
    needsImprovementActive: boolean;
    exceedsActive: boolean;
    proficientConfirmed: boolean;
  };
}) {
  const pills: { label: string; cls: string }[] = [];
  if (r.needsImprovementActive) {
    pills.push({ label: "NI", cls: "bg-error-container text-error" });
  }
  if (r.proficientConfirmed) {
    pills.push({ label: "Proficient", cls: "bg-primary text-on-primary" });
  }
  if (r.exceedsActive) {
    pills.push({ label: "Exceeds", cls: "bg-secondary-container text-secondary" });
  }
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
      {pills.map((p) => (
        <span
          key={p.label}
          className={`px-2 py-0.5 text-label-sm font-label font-semibold uppercase tracking-widest rounded-full ${p.cls}`}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}
