import { useEffect, useMemo, useState } from "react";
import type { IAggregatedCriterionFeedback, ICriterionResponse, IPerRubricReport } from "../../api/types";
import { Button } from "../../components/ui/Button";
import { ExportDocument, generateMarkdown } from "./ExportDocument";
import type { ExportConfig } from "./ExportDocument";

type Scope = "all" | "selected";
type Format = "pdf" | "markdown";

const SECTION_LABEL = "text-xs font-semibold tracking-widest uppercase text-gray-400";
const FIELD_INPUT =
  "w-full rounded-md border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none transition-colors";

function buildDefaultFilename(report: IPerRubricReport, fmt: Format): string {
  const title = report.oer.title.replace(/\s+/g, "_").slice(0, 40);
  const rubric = report.rubricName.replace(/\s+/g, "_");
  const date = new Date().toISOString().slice(0, 10);
  return `${title}_${rubric}_Review_${date}.${fmt === "pdf" ? "pdf" : "md"}`;
}

interface ExportPanelProps {
  report: IPerRubricReport;
  responses: ICriterionResponse[];
  onClose: () => void;
}

export function ExportPanel({ report, responses, onClose }: ExportPanelProps) {
  const [scope, setScope] = useState<Scope>("all");
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>(
    () => report.criteria.map(c => c.criterionId)
  );
  const [includeComments, setIncludeComments] = useState(true);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includeCoordinatorQ, setIncludeCoordinatorQ] = useState(false);
  const [filterNI, setFilterNI] = useState(false);
  const [filterUnresolved, setFilterUnresolved] = useState(false);
  const [format, setFormat] = useState<Format>("pdf");
  const [filename, setFilename] = useState(() => buildDefaultFilename(report, "pdf"));
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setFilename(f => f.replace(/\.(pdf|md)$/, format === "pdf" ? ".pdf" : ".md"));
  }, [format]);

  const exportConfig: ExportConfig = useMemo(() => {
    let crit: IAggregatedCriterionFeedback[] = report.criteria;
    if (scope === "selected")
      crit = crit.filter(c => selectedCriteria.includes(c.criterionId));
    if (filterNI)
      crit = crit.filter(c => c.ratingSummary === "needs_improvement");
    if (filterUnresolved)
      crit = crit.filter(c => {
        const r = responses.find(r => r.criterionId === c.criterionId);
        return !r || r.status === "unresolved";
      });
    return { criteria: crit, responses, includeComments, includeAnnotations, includeLogs, includeCoordinatorQ };
  }, [
    scope, selectedCriteria, filterNI, filterUnresolved, report,
    responses, includeComments, includeAnnotations, includeLogs, includeCoordinatorQ,
  ]);

  const pageEstimate = 3 + exportConfig.criteria.length;

  function toggleCriterion(id: string) {
    setSelectedCriteria(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function handlePreview() {
    setPreviewOpen(true);
  }

  function handleDownload() {
    if (format === "markdown") {
      const md = generateMarkdown(report, exportConfig);
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    // PDF: open preview then trigger print
    setGenerating(true);
    setPreviewOpen(true);
    setTimeout(() => {
      window.print();
      setGenerating(false);
    }, 200);
  }

  return (
    <>
      {/* Slide-in drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-96 bg-white shadow-2xl border-l border-outline-variant/20 flex flex-col print-hidden">

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">Export Feedback Report</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Scope */}
          <div className="space-y-2">
            <p className={SECTION_LABEL}>Scope</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === "all"}
                onChange={() => setScope("all")}
                className="accent-primary"
              />
              This rubric review ({report.rubricName})
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === "selected"}
                onChange={() => setScope("selected")}
                className="accent-primary"
              />
              Specific criteria…
            </label>
            {scope === "selected" && (
              <div className="ml-5 space-y-1 pt-1 border-l-2 border-outline-variant/20 pl-3">
                {report.criteria.map(c => (
                  <label key={c.criterionId} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCriteria.includes(c.criterionId)}
                      onChange={() => toggleCriterion(c.criterionId)}
                      className="accent-primary w-3 h-3"
                    />
                    <span className="font-mono text-gray-500 w-5">{c.criterionId}</span>
                    <span className="text-gray-700 truncate">{c.criterionTitle}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <p className={SECTION_LABEL}>Content</p>
            {(
              [
                ["Reviewer's comments", includeComments, setIncludeComments],
                ["Annotations", includeAnnotations, setIncludeAnnotations],
                ["My revision logs", includeLogs, setIncludeLogs],
                ["Questions to coordinator", includeCoordinatorQ, setIncludeCoordinatorQ],
              ] as [string, boolean, (v: boolean) => void][]
            ).map(([label, val, setter]) => (
              <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={val}
                  onChange={e => setter(e.target.checked)}
                  className="accent-primary w-3.5 h-3.5 rounded"
                />
                {label}
              </label>
            ))}
          </div>

          {/* Filter */}
          <div className="space-y-2">
            <p className={SECTION_LABEL}>Filter (optional)</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filterNI}
                onChange={e => setFilterNI(e.target.checked)}
                className="accent-primary w-3.5 h-3.5 rounded"
              />
              Only needs improvement
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filterUnresolved}
                onChange={e => setFilterUnresolved(e.target.checked)}
                className="accent-primary w-3.5 h-3.5 rounded"
              />
              Only unresolved
            </label>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <p className={SECTION_LABEL}>Format</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={format === "pdf"}
                onChange={() => setFormat("pdf")}
                className="accent-primary"
              />
              PDF
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="format"
                checked={format === "markdown"}
                onChange={() => setFormat("markdown")}
                className="accent-primary"
              />
              Markdown
            </label>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <p className={SECTION_LABEL}>Filename</p>
            <input
              type="text"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              className={FIELD_INPUT}
            />
          </div>

          {/* Preview line */}
          <p className="text-xs text-gray-400">
            Preview: {exportConfig.criteria.length} criteria · ~{pageEstimate} pages
          </p>
        </div>

        {/* Footer buttons */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3">
          <Button size="sm" variant="secondary" onClick={handlePreview}>
            Preview
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleDownload}
            disabled={generating}
            icon={generating ? undefined : "download"}
          >
            {generating ? "Generating…" : "Download"}
          </Button>
        </div>
      </div>

      {/* Preview overlay (also used as PDF print target) */}
      {previewOpen && (
        <ExportDocument
          report={report}
          config={exportConfig}
          onClose={() => { setPreviewOpen(false); setGenerating(false); }}
        />
      )}
    </>
  );
}
