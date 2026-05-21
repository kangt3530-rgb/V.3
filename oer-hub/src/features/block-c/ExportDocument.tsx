import type {
  IAggregatedCriterionFeedback,
  ICriterionResponse,
  IPerRubricReport,
} from "../../api/types";
import { RatingPill } from "./RatingPill";

export interface ExportConfig {
  criteria: IAggregatedCriterionFeedback[];
  responses: ICriterionResponse[];
  includeComments: boolean;
  includeAnnotations: boolean;
  includeLogs: boolean;
  includeCoordinatorQ: boolean;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  resolved: "✓ Resolved",
  unresolved: "☐ Unresolved",
  awaiting_clarification: "❓ Awaiting clarification",
};

const POLARITY_ICON: Record<string, string> = {
  positive: "⭐",
  negative: "⚠",
};

// ── Markdown generator ───────────────────────────────────────────────────────

export function generateMarkdown(
  report: IPerRubricReport,
  config: ExportConfig
): string {
  const today = new Date().toISOString().slice(0, 10);
  const { criteria, responses } = config;

  const niTotal = report.criteria.filter(c => c.ratingSummary === "needs_improvement").length;
  const resolvedCount = responses.filter(
    r => r.status === "resolved" &&
      report.criteria.find(c => c.criterionId === r.criterionId)?.ratingSummary === "needs_improvement"
  ).length;
  const proficientCount = report.criteria.filter(c => c.ratingSummary === "proficient").length;

  const lines: string[] = [
    `# Revision Report: ${report.oer.title}`,
    `## ${report.rubricName} Review`,
    "",
    `- Review completed: ${fmtDate(report.reviewCompletedAt)}`,
    `- Report generated: ${today}`,
    `- Author: ${report.oer.author}`,
    `- ${proficientCount} of ${report.criteria.length} criteria proficient`,
    `- ${resolvedCount} of ${niTotal} needs-improvement items resolved`,
    "",
    "---",
    "",
    "## Contents",
    "",
    ...criteria.map(
      (c, i) =>
        `${i + 1}. ${c.criterionId} · ${c.criterionTitle} — ${c.ratingSummary.replace(/_/g, " ")}`
    ),
    "",
    "---",
    "",
  ];

  for (const c of criteria) {
    const resp = responses.find(r => r.criterionId === c.criterionId);
    lines.push(`## ${c.criterionId} · ${c.criterionTitle}`);
    lines.push(`**Rating:** ${c.ratingSummary.replace(/_/g, " ")}`);
    lines.push("");
    lines.push(`### About this criterion`);
    lines.push(c.criterionStandard);
    lines.push("");

    if (config.includeComments && c.overallComment) {
      lines.push("### Reviewer's Overall Comment");
      lines.push(`> ${c.overallComment}`);
      lines.push("");
    }

    if (config.includeAnnotations && c.annotations.length > 0) {
      lines.push(`### Annotations (${c.annotations.length})`);
      for (const ann of c.annotations) {
        const icon = POLARITY_ICON[ann.polarity ?? ""] ?? "📍";
        const loc =
          ann.anchor.selectedText.length > 60
            ? ann.anchor.selectedText.slice(0, 60) + "…"
            : ann.anchor.selectedText;
        lines.push(`- ${icon} *${loc}*`);
        lines.push(`  > ${ann.comment}`);
      }
      lines.push("");
    }

    if (config.includeLogs) {
      lines.push("### Revision Log");
      lines.push(resp?.revisionLog?.trim() || "*(No notes recorded)*");
      lines.push("");
    }

    if (config.includeCoordinatorQ && resp?.coordinatorQuestion) {
      const q = resp.coordinatorQuestion;
      lines.push("### Question to Coordinator");
      lines.push(`**Q:** ${q.questionText}`);
      if (q.reply) lines.push(`**Reply:** ${q.reply}`);
      lines.push("");
    }

    lines.push(`**Status:** ${STATUS_LABEL[resp?.status ?? "unresolved"]}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const niCount = report.criteria.filter(c => c.ratingSummary === "needs_improvement").length;
  const exceedsCount = report.criteria.filter(c => c.ratingSummary === "exceeds").length;
  lines.push("## Summary");
  lines.push(`- Total criteria evaluated: ${report.criteria.length}`);
  lines.push(`- Proficient: ${proficientCount}`);
  lines.push(`- Needs improvement: ${niCount} (${resolvedCount} resolved)`);
  lines.push(`- Exceeds standard: ${exceedsCount}`);
  lines.push("");
  lines.push(
    `*Report generated ${today}. The author may continue to make revisions after this report was generated.*`
  );

  return lines.join("\n");
}

// ── React component ──────────────────────────────────────────────────────────

interface ExportDocumentProps {
  report: IPerRubricReport;
  config: ExportConfig;
  onClose?: () => void;
}

export function ExportDocument({ report, config, onClose }: ExportDocumentProps) {
  const today = new Date().toISOString().slice(0, 10);
  const { criteria, responses } = config;

  const allCrit = report.criteria;
  const proficientCount = allCrit.filter(c => c.ratingSummary === "proficient").length;
  const niCount = allCrit.filter(c => c.ratingSummary === "needs_improvement").length;
  const exceedsCount = allCrit.filter(c => c.ratingSummary === "exceeds").length;
  const resolvedCount = responses.filter(
    r =>
      r.status === "resolved" &&
      allCrit.find(c => c.criterionId === r.criterionId)?.ratingSummary === "needs_improvement"
  ).length;

  const sheet = (
    <article className="report-print-sheet bg-white max-w-[7.5in] mx-auto px-[0.6in] py-[0.55in] text-[#1c1c18]">

      {/* Cover page */}
      <section className="text-center pb-10 border-b border-gray-200 mb-10">
        <p className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-10">Revision Report</p>
        <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-2 leading-snug">
          {report.oer.title}
        </h1>
        <p className="text-base text-gray-500">{report.rubricName} Review</p>

        <div className="mt-10 text-sm text-gray-500 space-y-1">
          <p>Review completed: {fmtDate(report.reviewCompletedAt)}</p>
          <p>Report generated: {today}</p>
          <p>Submitted by: {report.oer.author}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 max-w-xs mx-auto text-left">
          <div>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Overall Outcome</p>
            <p className="text-sm text-gray-700">{proficientCount}/{allCrit.length} proficient</p>
            {niCount > 0 && <p className="text-sm text-gray-700">{niCount} need improvement</p>}
            {exceedsCount > 0 && <p className="text-sm text-gray-700">{exceedsCount} exceed standard</p>}
          </div>
          <div>
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Revision Status</p>
            <p className="text-sm text-gray-700">{resolvedCount} of {niCount} NI resolved</p>
          </div>
        </div>
      </section>

      {/* Table of contents */}
      <section className="mb-10">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Contents</p>
        <div className="space-y-1">
          {criteria.map((c, i) => (
            <div key={c.criterionId} className="flex items-baseline gap-2 text-sm">
              <span className="font-mono text-gray-400 w-6 shrink-0">{c.criterionId}</span>
              <span className="text-gray-700 flex-1 truncate">{c.criterionTitle}</span>
              <RatingPill summary={c.ratingSummary} />
              <span className="text-gray-400 text-xs w-8 text-right">p.{i + 3}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Per-criterion sections */}
      {criteria.map(c => {
        const resp = responses.find(r => r.criterionId === c.criterionId);
        const status = resp?.status ?? "unresolved";
        return (
          <section
            key={c.criterionId}
            className="mt-10 pt-8 border-t-2 border-gray-200 break-before-page"
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">
                  {c.criterionId} · {report.rubricName}
                </p>
                <h2 className="text-lg font-semibold text-gray-900 mt-0.5">{c.criterionTitle}</h2>
              </div>
              <RatingPill summary={c.ratingSummary} />
            </div>

            <div className="mt-4 mb-4">
              <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">About</p>
              <p className="text-sm text-gray-700 leading-relaxed">{c.criterionStandard}</p>
            </div>

            {config.includeComments && c.overallComment && (
              <div className="report-print-callout my-4">
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-widest mb-1">
                  Reviewer's Overall Comment
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  "{c.overallComment}"
                </p>
              </div>
            )}

            {config.includeAnnotations && c.annotations.length > 0 && (
              <div className="my-4">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">
                  Annotations ({c.annotations.length})
                </p>
                <div className="space-y-3">
                  {c.annotations.map(ann => {
                    const icon = POLARITY_ICON[ann.polarity ?? ""] ?? "📍";
                    const loc =
                      ann.anchor.selectedText.length > 70
                        ? ann.anchor.selectedText.slice(0, 70) + "…"
                        : ann.anchor.selectedText;
                    return (
                      <div key={ann.id} className="pl-3 border-l-2 border-gray-200">
                        <p className="text-xs text-gray-500 mb-0.5">
                          {icon} <em>{loc}</em>
                          {ann.anchor.page ? ` — p.${ann.anchor.page}` : ""}
                        </p>
                        <p className="text-sm text-gray-700">"{ann.comment}"</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {config.includeLogs && (
              <div className="my-4">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Revision Log</p>
                {resp?.revisionLog?.trim() ? (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {resp.revisionLog}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No notes recorded</p>
                )}
              </div>
            )}

            {config.includeCoordinatorQ && resp?.coordinatorQuestion && (
              <div className="my-4">
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">
                  Question to Coordinator
                </p>
                <div className="bg-surface-container-low rounded p-3 text-sm space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Q:</span> {resp.coordinatorQuestion.questionText}
                  </p>
                  {resp.coordinatorQuestion.reply && (
                    <p className="text-gray-700">
                      <span className="font-medium">Reply:</span> {resp.coordinatorQuestion.reply}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Status: <span className="font-medium">{STATUS_LABEL[status]}</span>
              </p>
            </div>
          </section>
        );
      })}

      {/* Summary page */}
      <section className="mt-12 pt-8 border-t-2 border-gray-200 break-before-page">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">Summary</p>
        <div className="space-y-1 text-sm text-gray-700 mb-6">
          <p>Total criteria evaluated: {allCrit.length}</p>
          <p>Proficient: {proficientCount}</p>
          <p>Needs improvement: {niCount} ({resolvedCount} resolved)</p>
          <p>Exceeds standard: {exceedsCount}</p>
        </div>
        <p className="text-xs text-gray-400 italic leading-relaxed">
          This report represents the state of revision as of {today}. The author may continue
          to make revisions after this report was generated.
        </p>
        <p className="text-xs text-gray-300 mt-4 report-print-footer">
          Report ID: {report.oer.id}-{report.rubricTemplateId}-{Date.now()}
        </p>
      </section>

    </article>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#f4f1ea] overflow-y-auto">
        {/* Preview toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm print-hidden">
          <p className="text-sm font-semibold text-gray-700">
            Preview — {report.rubricName} Review
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="text-xs text-primary hover:underline"
            >
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
        <div className="py-8">{sheet}</div>
      </div>
    );
  }

  return sheet;
}
