import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ICriterionResponse, IRevisionSubmission, RubricTemplateId } from "../../api/types";
import { getCriterionResponses, getPerRubricReport, submitRevisionPackage } from "../../api";
import { Button } from "../../components/ui/Button";
import { RatingPill } from "./RatingPill";

const SECTION_LABEL = "text-xs font-semibold tracking-widest uppercase text-gray-400";
const FIELD_INPUT =
  "w-full rounded-md border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none transition-colors";


const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  resolved:               { label: "✓ Resolved",               cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  awaiting_clarification: { label: "❓ Awaiting clarification", cls: "bg-sky-50 text-sky-700 border border-sky-200" },
  unresolved:             { label: "☐ Unresolved",             cls: "bg-amber-50 text-amber-700 border border-amber-200" },
};

export default function FinalSubmission() {
  const { oerId, rubricId } = useParams<{ oerId: string; rubricId: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<Awaited<ReturnType<typeof getPerRubricReport>>>(null);
  const [responses, setResponses] = useState<ICriterionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [revisedOerUrl, setRevisedOerUrl] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [aiDraftApplied, setAiDraftApplied] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!oerId || !rubricId) return;
    Promise.all([
      getPerRubricReport(oerId, rubricId as RubricTemplateId),
      getCriterionResponses(oerId, rubricId as RubricTemplateId),
    ]).then(([r, rsp]) => {
      setReport(r);
      setResponses(rsp);
      setLoading(false);
    });
  }, [oerId, rubricId]);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFilename(file.name);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setUploadedFilename(file.name);
  }

  async function handleDraftWithAI() {
    if (!report) return;
    setAiDraftLoading(true);

    const niCriteria = report.criteria.filter((c) => c.ratingSummary === "needs_improvement");
    const exceedsCriteria = report.criteria.filter((c) => c.ratingSummary === "exceeds");

    const niSummary = niCriteria
      .map((c) => {
        const resp = responses.find((r) => r.criterionId === c.criterionId);
        return `- ${c.criterionId} (${c.criterionTitle}): ${resp?.status ?? "unresolved"} — Log: "${resp?.revisionLog?.trim() || "No notes recorded"}"`;
      })
      .join("\n");

    const exceedsSummary = exceedsCriteria
      .map((c) => `- ${c.criterionId} (${c.criterionTitle}): Exceeds Standard`)
      .join("\n");

    const systemPrompt = `You are helping an OER author write a brief cover note for their revision submission. Write in first person, professionally, 2–3 paragraphs. Do not invent changes not mentioned in the logs.`;

    const userMessage = `Please draft a cover note for my revision of "${report.oer.title}" under the "${report.rubricName}" review.\n\nNeeds Improvement criteria I addressed:\n${niSummary || "None"}${exceedsSummary ? `\n\nCriteria exceeding standard:\n${exceedsSummary}` : ""}`;

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { maxOutputTokens: 512 },
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      setCoverNote(text);
      setAiDraftApplied(true);
    } catch {
      setCoverNote("Sorry, AI draft generation failed. Please write your cover note manually.");
      setAiDraftApplied(false);
    } finally {
      setAiDraftLoading(false);
    }
  }

  function handleCoverNoteChange(val: string) {
    setCoverNote(val);
    if (aiDraftApplied) setAiDraftApplied(false);
  }

  async function handleSubmit() {
    if (!report || !oerId || !rubricId) return;
    setSubmitting(true);
    const submission: IRevisionSubmission = {
      oerId,
      rubricTemplateId: rubricId as RubricTemplateId,
      submittedAt: new Date().toISOString(),
      revisedOerUrl: revisedOerUrl.trim() || null,
      revisedOerFileId: uploadedFilename,
      criterionResponses: responses,
      coverNote,
      coverNoteAiGenerated: aiDraftApplied,
    };
    await submitRevisionPackage(submission);
    navigate(`/reports/${oerId}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center pt-32">
        <p className="text-on-surface-variant animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center pt-32">
        <p className="text-on-surface-variant">Report not found.</p>
      </div>
    );
  }

  const actionCriteria = report.criteria.filter(
    c => c.ratingSummary === "needs_improvement" || c.ratingSummary === "exceeds"
  );

  return (
    <div className="max-w-3xl mx-auto px-6 pt-20 pb-16 space-y-10">

      {/* Back link */}
      <Link
        to={`/reports/${oerId}/${rubricId}/read`}
        className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Back to review
      </Link>

      {/* Page header */}
      <div>
        <p className="text-xs tracking-widest uppercase text-on-surface-variant/60 mb-1">
          {report.rubricName} Review
        </p>
        <h1 className="text-2xl font-semibold text-primary">Submit Accessibility Review</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Review what you're submitting to the coordinator.
        </p>
      </div>

      {/* Section 1: Revised OER */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>Your Revised OER</p>

        <div className="bg-surface-container-low rounded-lg p-4 text-sm space-y-1">
          <p className="text-on-surface-variant">
            Current version on file:
            <span className="ml-1 font-medium text-on-surface">
              {report.currentVersion.label}
            </span>
            <span className="ml-2 text-on-surface-variant/60">
              (uploaded {new Date(report.currentVersion.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})
            </span>
          </p>
        </div>

        <p className="text-xs text-on-surface-variant/60 font-medium">Upload your revised version:</p>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-outline-variant/40 hover:border-outline-variant hover:bg-surface-container-lowest"
          }`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadedFilename ? (
            <div className="space-y-1">
              <span className="material-symbols-outlined text-[24px] text-secondary block">description</span>
              <p className="text-sm font-medium text-on-surface">{uploadedFilename}</p>
              <p className="text-xs text-on-surface-variant/60">Click to replace</p>
            </div>
          ) : (
            <div className="space-y-1">
              <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40 block">upload_file</span>
              <p className="text-sm text-on-surface-variant">Drop file here or click to browse</p>
              <p className="text-xs text-on-surface-variant/50">Accepted: PDF</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50">link</span>
          <input
            type="url"
            placeholder="Or provide a URL to your revised OER…"
            value={revisedOerUrl}
            onChange={e => setRevisedOerUrl(e.target.value)}
            className={FIELD_INPUT}
          />
        </div>

        <p className="text-xs text-on-surface-variant/50">
          Upload is optional. If you don't upload a new version, the current version will be used for verification.
        </p>
      </section>

      {/* Section 2: Revision summary */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>Summary of Your Revisions</p>
        <p className="text-sm text-on-surface-variant">
          The following will be sent to the coordinator:
        </p>
        <div className="space-y-3">
          {actionCriteria.map(c => {
            const resp = responses.find(r => r.criterionId === c.criterionId);
            const isExceeds = c.ratingSummary === "exceeds";
            const badge = STATUS_BADGE[resp?.status ?? "unresolved"];
            return (
              <div
                key={c.criterionId}
                className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 space-y-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-on-surface-variant/70 shrink-0">{c.criterionId}</span>
                  <span className="text-sm font-medium text-on-surface truncate">{c.criterionTitle}</span>
                  <div className="ml-auto shrink-0">
                    <RatingPill summary={c.ratingSummary} />
                  </div>
                </div>
                {isExceeds ? (
                  <p className="text-xs text-on-surface-variant/50 italic">No action needed</p>
                ) : (
                  <div className="space-y-1.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <p className="text-xs text-on-surface-variant/60">
                      {resp?.revisionLog?.trim()
                        ? `Revision log: "${resp.revisionLog.slice(0, 120)}${resp.revisionLog.length > 120 ? "…" : ""}"`
                        : <span className="italic">No notes recorded</span>}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Cover note */}
      <section className="space-y-3">
        <p className={SECTION_LABEL}>Optional Cover Note</p>
        <p className="text-sm text-on-surface-variant">
          Anything else you'd like the coordinator to know about your revisions?
        </p>
        <textarea
          rows={5}
          placeholder="Write a cover note…"
          value={coverNote}
          onChange={e => handleCoverNoteChange(e.target.value)}
          className={`${FIELD_INPUT} resize-none`}
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {aiDraftApplied && (
            <p className="text-xs text-secondary/80 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              AI-generated draft · Edit freely before submitting
            </p>
          )}
          <div className="ml-auto flex items-center gap-3">
            {aiDraftApplied && (
              <button
                onClick={handleDraftWithAI}
                disabled={aiDraftLoading}
                className="text-xs text-secondary/70 hover:underline disabled:opacity-40"
              >
                Regenerate
              </button>
            )}
            {coverNote && (
              <button
                onClick={() => { setCoverNote(""); setAiDraftApplied(false); }}
                className="text-xs text-on-surface-variant/50 hover:underline"
              >
                Clear
              </button>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={aiDraftLoading ? undefined : "auto_awesome"}
              onClick={handleDraftWithAI}
              disabled={aiDraftLoading}
            >
              {aiDraftLoading ? "Drafting…" : "Draft with AI"}
            </Button>
          </div>
        </div>
      </section>

      {/* Section 4: What happens next */}
      <section className="bg-surface-container-low rounded-lg px-5 py-4 space-y-2">
        <p className={SECTION_LABEL}>What Happens Next</p>
        <p className="text-sm text-on-surface leading-relaxed">
          The coordinator will verify your revisions against the reviewer's feedback. You'll be
          notified when the review is complete. Expected response time: within 5 business days.
        </p>
      </section>

      {/* Pre-submit notice + Submit */}
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant/60 flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[15px] mt-0.5">info</span>
          Once submitted, you cannot edit your revisions for this rubric review.
        </p>
        <div className="flex justify-end">
          <Button
            size="md"
            variant="primary"
            onClick={handleSubmit}
            disabled={submitting}
            icon={submitting ? undefined : "send"}
            iconPosition="right"
          >
            {submitting ? "Submitting…" : "Submit for review"}
          </Button>
        </div>
      </div>

    </div>
  );
}
