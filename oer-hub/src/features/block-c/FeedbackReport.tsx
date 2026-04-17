import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  IAggregatedCriterionFeedback,
  IAggregatedReport,
  IAnnotation,
  IRubricTemplate,
  RubricTemplateId,
  CriterionRatingSummary,
} from "../../api/types";
import {
  getAggregatedReport,
  getRubricTemplate,
  ensureRevisionCardsInitialized,
  getRevisionCycleState,
  setRevisionCardProgress,
  submitAuthorRevisionPackage,
  getStampForOer,
  upsertRevisionCycleState,
} from "../../api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ReportEvidenceDrawer } from "./ReportEvidenceDrawer";
import { ReportPrintDocument } from "./ReportPrintDocument";
import { RUBRIC_LABELS } from "./rubricLabels";

export function FeedbackReport() {
  const { oerId = "" } = useParams();
  const [report, setReport] = useState<IAggregatedReport | null>(null);
  const [rubricMap, setRubricMap] = useState<Partial<Record<RubricTemplateId, IRubricTemplate>>>({});
  const [showOnlyNI, setShowOnlyNI] = useState(false);
  const [rubricFilter, setRubricFilter] = useState<RubricTemplateId | "all">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSessionKey, setDrawerSessionKey] = useState(0);
  const [drawerAnnotations, setDrawerAnnotations] = useState<IAnnotation[]>([]);
  const [drawerRubricId, setDrawerRubricId] = useState<RubricTemplateId | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refreshLocal = useCallback(() => setReloadKey((x) => x + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getAggregatedReport(oerId);
      if (cancelled || !r) {
        if (!cancelled) setReport(null);
        return;
      }
      setReport(r);
      if (r.releasedToAuthor && r.revisionCards.length) {
        ensureRevisionCardsInitialized(oerId, r.revisionCards);
      }
      const ids = new Set(r.criteria.map((c) => c.rubricTemplateId));
      const entries = await Promise.all(
        [...ids].map(async (id) => [id, await getRubricTemplate(id)] as const)
      );
      if (!cancelled) {
        setRubricMap(Object.fromEntries(entries) as Partial<Record<RubricTemplateId, IRubricTemplate>>);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [oerId, reloadKey]);

  const cycle = getRevisionCycleState(oerId);

  const filteredCriteria = useMemo(() => {
    if (!report?.criteria) return [];
    return report.criteria.filter((row) => {
      if (rubricFilter !== "all" && row.rubricTemplateId !== rubricFilter) return false;
      if (showOnlyNI && row.ratingSummary !== "needs_improvement" && row.ratingSummary !== "mixed")
        return false;
      return true;
    });
  }, [report, rubricFilter, showOnlyNI]);

  const rubricIdsInReport = useMemo(() => {
    if (!report?.criteria.length) return [];
    return [...new Set(report.criteria.map((c) => c.rubricTemplateId))];
  }, [report]);

  const allResolved =
    report &&
    report.revisionCards.length > 0 &&
    report.revisionCards.every((c) => {
      const p = cycle?.cards.find((x) => x.cardId === c.id);
      return p?.resolved;
    });

  const submitted = cycle?.submittedForVerification;

  if (!report) {
    return (
      <div className="h-full overflow-y-auto bg-surface pt-16 px-8 py-12 text-on-surface-variant">
        Resource not found.
        <div className="mt-4">
          <Link to="/author" className="text-secondary font-semibold underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const anchorsMayDrift =
    report.releasedToAuthor && report.anchorVersion.label !== report.currentVersion.label;

  const stamp = report.oer.status === "certified" ? getStampForOer(oerId) : null;

  function openDrawer(annotations: IAnnotation[], rubricId: RubricTemplateId) {
    setDrawerAnnotations(annotations);
    setDrawerRubricId(rubricId);
    setDrawerSessionKey((k) => k + 1);
    setDrawerOpen(true);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="h-full overflow-y-auto bg-surface pt-16 print:pt-4 print:bg-[#f4f1ea]">
      <div
        id="block-c-print-root"
        className="report-print-root max-w-4xl mx-auto px-8 py-12"
      >
        <div className="print:hidden">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-2">
              Block C — Feedback &amp; revision
            </p>
            <h1 className="font-headline text-headline-md text-primary leading-tight">Aggregated feedback report</h1>
            <p className="mt-2 text-body-md text-on-surface-variant">{report.oer.title}</p>
          </div>
          <div className="flex flex-wrap gap-2 print-hidden">
            <Badge status={report.oer.status} />
            {report.releasedToAuthor && (
              <Button variant="secondary" size="sm" icon="print" onClick={handlePrint}>
                Print / Save PDF
              </Button>
            )}
          </div>
        </header>

        {!report.releasedToAuthor && (
          <Card surface="lowest" className="p-8 mb-8">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-secondary">hourglass_top</span>
              <div>
                <p className="text-body-md font-semibold text-on-surface">Feedback not released yet</p>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  Your coordinator is still mediating reviewer notes. You will receive the structured report here
                  once the queue is released (C.1).
                </p>
              </div>
            </div>
          </Card>
        )}

        {report.releasedToAuthor && report.oer.status === "certified" && stamp && (
          <Card surface="lowest" className="p-6 mb-8 border border-[#1a5c1a]/20 bg-[#f4faf4]">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#1a5c1a] text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <div>
                  <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-[#1a5c1a]">
                    Certified
                  </p>
                  <p className="text-body-sm text-on-surface-variant">Digital stamp issued {new Date(stamp.issuedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2 print-hidden">
                <Link to={`/verify/${stamp.id}`} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" icon="open_in_new">
                    Public validation page
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {report.releasedToAuthor && (
          <>
            <div className="flex flex-wrap gap-4 mb-6 print-hidden">
              <label className="flex items-center gap-2 text-body-sm text-on-surface cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyNI}
                  onChange={(e) => setShowOnlyNI(e.target.checked)}
                  className="accent-secondary"
                />
                Show only Needs Improvement / Mixed
              </label>
              <div className="flex items-center gap-2">
                <span className="text-label-sm font-label uppercase tracking-widest text-on-surface-variant">Rubric</span>
                <select
                  className="rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-body-sm"
                  value={rubricFilter}
                  onChange={(e) => setRubricFilter(e.target.value as RubricTemplateId | "all")}
                >
                  <option value="all">All rubrics</option>
                  {rubricIdsInReport.map((id) => (
                    <option key={id} value={id}>
                      {RUBRIC_LABELS[id]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <section className="space-y-4 mb-12">
              <h2 className="font-headline text-title-lg text-primary">By rubric &amp; criterion</h2>
              {filteredCriteria.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">No rows match the current filters.</p>
              ) : (
                filteredCriteria.map((row) => (
                  <CriterionBlock
                    key={`${row.taskId}-${row.criterionId}`}
                    row={row}
                    onOpenEvidence={() => openDrawer(row.annotations, row.rubricTemplateId)}
                  />
                ))
              )}
            </section>

            {report.revisionCards.length > 0 && report.oer.status === "in_revision" && (
              <section className="mb-12">
                <h2 className="font-headline text-title-lg text-primary mb-4">Revision cards</h2>
                <div className="space-y-4">
                  {report.revisionCards.map((card) => {
                    const prog = cycle?.cards.find((c) => c.cardId === card.id);
                    return (
                      <Card key={card.id} surface="lowest" className="p-6 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span
                              className={`text-label-sm font-label font-semibold uppercase tracking-widest ${
                                card.kind === "local" ? "text-secondary" : "text-on-surface-variant"
                              }`}
                            >
                              {card.kind === "local" ? "Local fix" : "Global revision"}
                            </span>
                            <h3 className="font-headline text-title-md text-primary mt-1">{card.title}</h3>
                            <p className="text-body-sm text-on-surface-variant mt-1">
                              {RUBRIC_LABELS[card.rubricTemplateId]} · {card.criterionId}
                            </p>
                          </div>
                          <label className="flex items-center gap-2 text-body-sm print-hidden">
                            <input
                              type="checkbox"
                              checked={Boolean(prog?.resolved)}
                              onChange={(e) => {
                                setRevisionCardProgress(oerId, card.id, { resolved: e.target.checked });
                                refreshLocal();
                              }}
                              className="accent-secondary"
                            />
                            Mark resolved
                          </label>
                        </div>
                        <div className="bg-surface-container-low rounded-sm p-4 border border-outline-variant/10">
                          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                            Synthesized feedback (read-only)
                          </p>
                          <p className="text-body-md text-on-surface whitespace-pre-wrap">{card.synthesizedFeedback}</p>
                        </div>
                        <div className="print-hidden space-y-3">
                          <div>
                            <label className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant block mb-1">
                              Fix log (author)
                            </label>
                            <textarea
                              className="w-full min-h-[72px] rounded-sm border border-outline-variant/30 bg-surface px-3 py-2 text-body-sm"
                              placeholder="Document what you changed (e.g., updated heading hierarchy in Ch.1)…"
                              value={prog?.fixLog ?? ""}
                              onChange={(e) => {
                                setRevisionCardProgress(oerId, card.id, { fixLog: e.target.value });
                                refreshLocal();
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant block mb-1">
                              Ask coordinator
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              <input
                                className="flex-1 min-w-[200px] rounded-sm border border-outline-variant/30 bg-surface px-3 py-2 text-body-sm"
                                placeholder="Optional question routed to your lead (mock)…"
                                value={prog?.coordinatorQuestion ?? ""}
                                onChange={(e) => {
                                  setRevisionCardProgress(oerId, card.id, {
                                    coordinatorQuestion: e.target.value,
                                  });
                                  refreshLocal();
                                }}
                              />
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  alert("Question routed to coordinator (mock). SLA tracking would go here.");
                                }}
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                          {card.annotationIds.length > 0 && (
                            <Button variant="ghost" size="sm" icon="open_in_full" onClick={() => openDrawer(
                              report.criteria
                                .flatMap((c) => c.annotations)
                                .filter((a) => card.annotationIds.includes(a.id)),
                              card.rubricTemplateId
                            )}>
                              Open evidence viewer
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {report.oer.status === "in_revision" && !submitted && (
              <RevisionSummarySection
                key={oerId}
                oerId={oerId}
                allResolved={Boolean(allResolved)}
                onSubmitted={() => setReloadKey((k) => k + 1)}
              />
            )}

            {submitted && report.oer.status === "pending_verification" && (
              <Card surface="low" className="p-6 mb-8">
                <p className="text-body-md font-semibold text-on-surface">Submitted for coordinator verification</p>
                <p className="text-body-sm text-on-surface-variant mt-2">
                  Your summary of revisions is on file. You will be notified when certification completes.
                </p>
              </Card>
            )}
          </>
        )}
        </div>

        <ReportPrintDocument report={report} />
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-12 print-hidden">
        <Link to="/author">
          <Button variant="ghost" icon="arrow_back">
            Back to dashboard
          </Button>
        </Link>
      </div>

      <ReportEvidenceDrawer
        key={drawerSessionKey}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        oerType={report.oer.oerType}
        oerSource={report.oer.oerSource}
        annotations={drawerAnnotations}
        rubricTemplate={drawerRubricId ? rubricMap[drawerRubricId] ?? null : null}
        anchorVersionLabel={report.anchorVersion.label}
        currentVersionLabel={report.currentVersion.label}
        versionMismatch={anchorsMayDrift}
      />
    </div>
  );
}

function RevisionSummarySection({
  oerId,
  allResolved,
  onSubmitted,
}: {
  oerId: string;
  allResolved: boolean;
  onSubmitted: () => void;
}) {
  const initial = getRevisionCycleState(oerId)?.summaryOfRevisions ?? "";
  const [summaryText, setSummaryText] = useState(initial);

  return (
    <section className="mb-12">
      <h2 className="font-headline text-title-lg text-primary mb-2">Summary of revisions</h2>
      <p className="text-body-sm text-on-surface-variant mb-4">
        When every revision card is resolved, submit a short rebuttal-style summary for your coordinator (C.9).
      </p>
      <textarea
        className="w-full min-h-[120px] rounded-sm border border-outline-variant/30 bg-surface px-3 py-2 text-body-md mb-3 print-hidden"
        disabled={!allResolved}
        placeholder={
          allResolved
            ? "Summarize major changes, or explain feedback you chose not to implement…"
            : "Resolve all revision cards to enable this field."
        }
        value={summaryText}
        onChange={(e) => {
          const v = e.target.value;
          setSummaryText(v);
          upsertRevisionCycleState(oerId, { summaryOfRevisions: v });
        }}
      />
      <div className="print-hidden">
        <Button
          icon="send"
          disabled={!allResolved || summaryText.trim().length < 8}
          onClick={() => {
            submitAuthorRevisionPackage(oerId, summaryText.trim());
            onSubmitted();
          }}
        >
          Submit for verification
        </Button>
      </div>
    </section>
  );
}

function CriterionBlock({
  row,
  onOpenEvidence,
}: {
  row: IAggregatedCriterionFeedback;
  onOpenEvidence: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Card surface="lowest" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 hover:bg-surface-container-low/50 transition-colors"
      >
        <div>
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
            {RUBRIC_LABELS[row.rubricTemplateId]}
          </p>
          <p className="font-headline text-title-md text-primary mt-1">{row.criterionTitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <RatingPill summary={row.ratingSummary} />
          <span className="material-symbols-outlined text-on-surface-variant">{open ? "expand_less" : "expand_more"}</span>
        </div>
      </button>
      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-outline-variant/10 pt-4">
          <div>
            <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
              Synthesized comment
            </p>
            <p className="text-body-md text-on-surface whitespace-pre-wrap">{row.synthesizedComment}</p>
          </div>
          {row.annotations.length > 0 && (
            <div>
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Evidence ({row.annotations.length})
              </p>
              <Button variant="secondary" size="sm" icon="splitscreen" onClick={onOpenEvidence}>
                Open in bi-directional viewer
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function RatingPill({ summary }: { summary: CriterionRatingSummary }) {
  const map: Record<CriterionRatingSummary, { label: string; cls: string }> = {
    needs_improvement: { label: "Needs improvement", cls: "bg-error/15 text-error" },
    proficient: { label: "Proficient", cls: "bg-surface-container text-on-surface-variant" },
    exceeds: { label: "Exceeds", cls: "bg-secondary-container/50 text-secondary" },
    mixed: { label: "Mixed", cls: "bg-primary-fixed/20 text-primary" },
  };
  const { label, cls } = map[summary];
  return (
    <span className={`text-label-sm font-label font-semibold uppercase tracking-widest px-2 py-1 rounded-sm ${cls}`}>
      {label}
    </span>
  );
}
