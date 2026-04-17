import type {
  IAggregatedReport,
  IAggregatedCriterionFeedback,
  IAnnotation,
  IRevisionCard,
  CriterionRatingSummary,
} from "../../api/types";
import { RUBRIC_LABELS } from "./rubricLabels";

function statusHeadline(status: string): string {
  switch (status) {
    case "in_revision":
      return "Status: Revision required";
    case "pending_verification":
      return "Status: Pending coordinator verification";
    case "certified":
      return "Status: Certified";
    case "under_review":
      return "Status: Under review";
    default:
      return "Status: Submitted";
  }
}

function performanceLabel(summary: CriterionRatingSummary): { label: string; detail: string } {
  switch (summary) {
    case "needs_improvement":
      return { label: "Needs revision", detail: "Action required before certification." };
    case "mixed":
      return { label: "Mixed", detail: "Strengths and gaps both noted — see synthesis." };
    case "exceeds":
      return { label: "Pass", detail: "Exemplary relative to standard." };
    case "proficient":
    default:
      return { label: "Pass", detail: "Meets the criterion standard." };
  }
}

const COORDINATOR_SUMMARY =
  "The editorial synthesis below consolidates reviewer evidence into a single author-facing narrative. " +
  "Where reviewers disagreed, the coordinator has prioritized actionable clarity and removed duplicate or contradictory phrasing. " +
  "Please treat each revision card as a contract item: either implement the change, document an intentional exception in your rebuttal, or route clarification through your lead.";

const COORDINATOR_SIGNATURE = "Mark R. — Lead certification coordinator (demo)";

interface ReportPrintDocumentProps {
  report: IAggregatedReport;
}

export function ReportPrintDocument({ report }: ReportPrintDocumentProps) {
  if (!report.releasedToAuthor) {
    return (
      <div className="report-print-sheet hidden print:block font-body text-on-surface">
        <p className="font-headline text-title-lg text-primary">Feedback not yet released</p>
        <p className="text-body-sm text-on-surface-variant mt-2">
          This document will be available after coordinator mediation (C.1).
        </p>
      </div>
    );
  }

  const { oer, criteria, revisionCards, anchorVersion, currentVersion } = report;
  const docDate = new Date(oer.updatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const allAnnotations: IAnnotation[] = criteria.flatMap((c) => c.annotations);

  return (
    <article className="report-print-sheet hidden print:block font-body text-on-surface text-[11pt] leading-relaxed">
      <header className="text-center border-b border-outline-variant/30 pb-6 mb-8">
        <p className="text-[9pt] font-label uppercase tracking-[0.2em] text-on-surface-variant mb-3">
          {statusHeadline(oer.status)}
        </p>
        <h1 className="font-headline text-[22pt] font-semibold text-primary leading-tight">
          Final aggregated feedback report
        </h1>
        <p className="font-headline text-[13pt] text-primary/90 mt-3">{oer.title}</p>
        <p className="text-[10pt] text-on-surface-variant mt-2">
          OER Certification Hub · Peer review synthesis · {docDate}
        </p>
        <p className="text-[9pt] text-on-surface-variant mt-1">Document ID: {oer.id}</p>
      </header>

      <section className="report-print-callout mb-8 break-inside-avoid">
        <p className="text-[9pt] font-label font-semibold uppercase tracking-[0.18em] text-on-surface-variant mb-2">
          {"Coordinator's summary"}
        </p>
        <p className="font-headline text-[11pt] italic text-primary/95 leading-relaxed">{COORDINATOR_SUMMARY}</p>
        <p className="text-[8pt] font-label uppercase tracking-[0.2em] text-on-surface-variant mt-4">
          {COORDINATOR_SIGNATURE}
        </p>
      </section>

      <section className="mb-8 break-inside-avoid">
        <h2 className="text-[9pt] font-label font-semibold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
          Certification rubric performance
        </h2>
        <div className="report-print-grid">
          {criteria.map((row) => {
            const { label, detail } = performanceLabel(row.ratingSummary);
            const needs = row.ratingSummary === "needs_improvement" || row.ratingSummary === "mixed";
            return (
              <div
                key={`${row.taskId}-${row.criterionId}`}
                className={`report-print-rubric-cell ${needs ? "report-print-rubric-cell--focus" : ""}`}
              >
                <p className="text-[8pt] font-label uppercase tracking-[0.15em] text-on-surface-variant">
                  {RUBRIC_LABELS[row.rubricTemplateId]} · {row.criterionId}
                </p>
                <p className="font-headline text-[10pt] font-semibold text-primary mt-1 line-clamp-2">
                  {row.criterionTitle}
                </p>
                <p className={`text-[9pt] font-semibold mt-2 ${needs ? "text-error" : "text-primary"}`}>{label}</p>
                <p className="text-[8pt] text-on-surface-variant mt-1 leading-snug">{detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-headline text-[14pt] text-primary mb-1">Synthesized feedback</h2>
        <p className="text-[9pt] text-on-surface-variant mb-4">
          Anchors reference version {anchorVersion.label}; current manuscript label: {currentVersion.label}.
        </p>
        <div className="space-y-5">
          {criteria.map((row) => (
            <PrintCriterionBlock key={`${row.taskId}-${row.criterionId}`} row={row} />
          ))}
        </div>
      </section>

      {allAnnotations.length > 0 && (
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-[9pt] font-label font-semibold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
            Evidence fragments
          </h2>
          <ol className="list-decimal pl-5 space-y-3">
            {allAnnotations.map((ann, i) => (
              <li key={ann.id} className="pl-1">
                <p className="text-[8pt] font-label uppercase tracking-widest text-on-surface-variant">
                  Fragment {i + 1} · {ann.criterionId}
                </p>
                <p className="font-headline text-[10pt] text-primary mt-1">
                  <span className="text-on-surface-variant not-italic">&ldquo;</span>
                  {ann.anchor.selectedText}
                  <span className="text-on-surface-variant not-italic">&rdquo;</span>
                </p>
                <p className="text-[10pt] mt-1.5">{ann.comment}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {revisionCards.length > 0 && (
        <section className="mb-10 break-inside-avoid">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <h2 className="text-[9pt] font-label font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              Revision roadmap
            </h2>
            <p className="text-[9pt] text-on-surface-variant">
              {revisionCards.length} task{revisionCards.length === 1 ? "" : "s"} outstanding
            </p>
          </div>
          <ul className="space-y-3">
            {revisionCards.map((card) => (
              <PrintRevisionRow key={card.id} card={card} />
            ))}
          </ul>
        </section>
      )}

      <footer className="report-print-footer border-t border-outline-variant/30 pt-4 mt-8 text-[8pt] text-on-surface-variant flex flex-wrap justify-between gap-2">
        <span>OER Certification Hub</span>
        <span className="font-mono">DOC-{oer.id}</span>
        <span>Full rubric text omitted for brevity · CC BY-ND reviewer notes</span>
      </footer>
    </article>
  );
}

function PrintCriterionBlock({ row }: { row: IAggregatedCriterionFeedback }) {
  return (
    <div className="break-inside-avoid border border-outline-variant/25 rounded-sm p-4 bg-surface-container-low/40">
      <p className="text-[8pt] font-label uppercase tracking-[0.15em] text-on-surface-variant">
        {RUBRIC_LABELS[row.rubricTemplateId]} · {row.criterionId}
      </p>
      <p className="font-headline text-[12pt] text-primary mt-1">{row.criterionTitle}</p>
      <p className="text-[10pt] mt-3 whitespace-pre-wrap">{row.synthesizedComment}</p>
    </div>
  );
}

function PrintRevisionRow({ card }: { card: IRevisionCard }) {
  return (
    <li className="flex gap-3 border border-outline-variant/20 rounded-sm p-3 bg-white">
      <span className="text-[9pt] text-on-surface-variant shrink-0 pt-0.5">□</span>
      <div className="min-w-0">
        <p className="text-[8pt] font-label font-semibold uppercase tracking-[0.15em] text-secondary">
          {card.kind === "local" ? "Local fix" : "Global revision"}
        </p>
        <p className="font-headline text-[11pt] text-primary mt-0.5">{card.title}</p>
        <p className="text-[8pt] text-on-surface-variant mt-1">
          {RUBRIC_LABELS[card.rubricTemplateId]} · {card.criterionId}
        </p>
        <p className="text-[10pt] mt-2 whitespace-pre-wrap">{card.synthesizedFeedback}</p>
      </div>
    </li>
  );
}
