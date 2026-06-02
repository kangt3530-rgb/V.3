/**
 * Block C — Per-rubric reports, mediation queue, author responses, stamps.
 * Mock persistence via localStorage; replace with HTTP in production.
 */

import type {
  IAggregatedCriterionFeedback,
  IPerRubricReport,
  IAnnotation,
  ICriterionRating,
  ICriterionResponse,
  IRevisionSubmission,
  IDigitalStamp,
  IMediationItem,
  IOer,
  IOerVersion,
  IReviewSession,
  IRubricTemplate,
  RubricTemplateId,
  CriterionRatingSummary,
} from "./types";
import { MOCK_OERS } from "./mock/oers";
import { MOCK_ACTIVE_TASKS, MOCK_POOL_TASKS } from "./mock/tasks";
import { loadSession } from "./sessionStorage";

const LS_OER_STATUS = "oer-hub:mock:oer-status-overrides";
const LS_MEDIATION = "oer-hub:block-c:mediation-items";
const LS_STAMPS = "oer-hub:block-c:digital-stamps";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getOerStatusOverrides(): Record<string, IOer["status"]> {
  return readJson(LS_OER_STATUS, {});
}

export function setOerStatusOverride(oerId: string, status: IOer["status"]) {
  const m = getOerStatusOverrides();
  m[oerId] = status;
  writeJson(LS_OER_STATUS, m);
}

export function clearOerStatusOverride(oerId: string) {
  const m = getOerStatusOverrides();
  delete m[oerId];
  writeJson(LS_OER_STATUS, m);
}

function mergeOer(base: IOer): IOer {
  const ov = getOerStatusOverrides()[base.id];
  return ov ? { ...base, status: ov } : base;
}

export function getMergedOers(): IOer[] {
  return MOCK_OERS.map(mergeOer);
}

export function getOerById(oerId: string): IOer | null {
  return getMergedOers().find((o) => o.id === oerId) ?? null;
}

function allTasks() {
  return [...MOCK_ACTIVE_TASKS, ...MOCK_POOL_TASKS];
}

export function getTasksForOer(oerId: string) {
  return allTasks().filter((t) => t.oerId === oerId);
}

// ── Mediation queue ───────────────────────────────────────────────────────────

function readMediationItems(): IMediationItem[] {
  return readJson<IMediationItem[]>(LS_MEDIATION, []);
}

function writeMediationItems(items: IMediationItem[]) {
  writeJson(LS_MEDIATION, items);
}

export function getMediationQueue(): IMediationItem[] {
  return readMediationItems();
}

export function getMediationItem(id: string): IMediationItem | null {
  return readMediationItems().find((m) => m.id === id) ?? null;
}

/** Called when reviewer finalizes — pushes coordinator queue + freezes session. */
export async function submitReviewToMediation(session: IReviewSession): Promise<void> {
  const oer = getOerById(session.oerId);
  if (!oer) return;

  const rubricModule = await import(`../data/rubrics/${session.rubricTemplateId}.json`);
  const rubric = rubricModule.default as IRubricTemplate;
  const niCount = Object.values(session.ratings).filter((r) => r.needsImprovementActive).length;
  const exCount = Object.values(session.ratings).filter((r) => r.exceedsActive).length;
  const draft = [
    `[AI synthesis — ${rubric.name}] Cross-checked reviewer annotations and ratings for this submission.`,
    niCount ? `• ${niCount} criterion/criteria flagged for improvement; mapped to evidence highlights where present.` : null,
    exCount ? `• ${exCount} criterion/criteria noted as exemplary strengths.` : null,
    "No contradictory reviewer pair was detected in this mock (single reviewer). When multiple reviewers disagree, a Consensus Card would merge opposing notes here.",
  ].filter(Boolean).join("\n");

  const items = readMediationItems();
  const id = `med-${session.taskId}-${Date.now()}`;
  items.unshift({
    id,
    oerId: session.oerId,
    oerTitle: oer.title,
    taskIds: [session.taskId],
    status: "pending",
    aiConsensusDraft: draft,
    reviewerBConflictNote:
      "Mock: If a second reviewer disagreed, their counterpoint would appear here for coordinator merge (C.2).",
    coordinatorReleaseText: "",
    createdAt: new Date().toISOString(),
  });
  writeMediationItems(items);
}

export async function updateMediationItem(
  id: string,
  patch: Partial<Pick<IMediationItem, "coordinatorReleaseText" | "aiConsensusDraft" | "reviewerBConflictNote">>
) {
  const items = readMediationItems().map((m) => (m.id === id ? { ...m, ...patch } : m));
  writeMediationItems(items);
}

export async function releaseMediationToAuthor(itemId: string): Promise<void> {
  const items = readMediationItems();
  const item = items.find((m) => m.id === itemId);
  if (!item || item.status !== "pending") return;

  const text =
    item.coordinatorReleaseText?.trim() ||
    item.aiConsensusDraft ||
    "Feedback approved for author release.";

  const next = items.map((m) =>
    m.id === itemId
      ? {
          ...m,
          status: "released" as const,
          coordinatorReleaseText: text,
          releasedAt: new Date().toISOString(),
        }
      : m
  );
  writeMediationItems(next);

  setOerStatusOverride(item.oerId, "feedback_available");
}

// ── Digital stamps ────────────────────────────────────────────────────────────

function readStamps(): IDigitalStamp[] {
  return readJson<IDigitalStamp[]>(LS_STAMPS, []);
}

function writeStamps(stamps: IDigitalStamp[]) {
  writeJson(LS_STAMPS, stamps);
}

/** Seed certified stamp for oer-003 if none exists (demo). */
export function ensureSeedStamps() {
  const stamps = readStamps();
  if (stamps.some((s) => s.oerId === "oer-003")) return;
  stamps.push({
    id: "stamp-demo-macro-2026",
    oerId: "oer-003",
    oerTitle: "Principles of Macroeconomics",
    subject: "Economics",
    authorDisplay: "Dr. Sarah Chen",
    license: "CC BY",
    issuedAt: "2026-02-28T16:00:00Z",
    rubricsApplied: ["copyright", "disciplinary", "accessibility"],
    certificationSummary:
      "This resource met proficiency across selected rubric areas via peer review on the OER Certification Hub.",
  });
  writeStamps(stamps);
}

export function getStampById(stampId: string): IDigitalStamp | null {
  ensureSeedStamps();
  return readStamps().find((s) => s.id === stampId) ?? null;
}

export function getStampForOer(oerId: string): IDigitalStamp | null {
  ensureSeedStamps();
  return readStamps().find((s) => s.oerId === oerId) ?? null;
}

export async function approveAuthorRevisions(oerId: string): Promise<IDigitalStamp | null> {
  const oer = getOerById(oerId);
  if (!oer) return null;
  const stamp: IDigitalStamp = {
    id: `stamp-${oerId}-${Date.now()}`,
    oerId,
    oerTitle: oer.title,
    subject: oer.subject,
    authorDisplay: oer.author,
    license: oer.license,
    issuedAt: new Date().toISOString(),
    rubricsApplied: oer.rubrics,
    certificationSummary:
      "Certified via OER Certification Hub peer review. Detailed reviewer notes remain private to the author and coordinator.",
  };
  const stamps = readStamps().filter((s) => s.oerId !== oerId);
  stamps.push(stamp);
  writeStamps(stamps);
  setOerStatusOverride(oerId, "certified");
  return stamp;
}

export function getOersPendingVerification(): IOer[] {
  return getMergedOers().filter((o) => o.status === "pending_verification");
}

// ── Rating helpers ────────────────────────────────────────────────────────────

function ratingSummary(r: ICriterionRating | undefined): CriterionRatingSummary {
  if (!r) return "proficient";
  const ni = r.needsImprovementActive;
  const ex = r.exceedsActive;
  const pf = r.proficientConfirmed;
  if (ni && ex) return "needs_improvement";
  if (ni) return "needs_improvement";
  if (ex) return "exceeds";
  if (pf) return "proficient";
  return "proficient";
}

function overallCommentForCriterion(r: ICriterionRating | undefined): string {
  if (!r) return "";
  const parts: string[] = [];
  if (r.needsImprovementActive && r.needsImprovementText.trim()) {
    parts.push(r.needsImprovementText.trim());
  }
  if (r.exceedsActive && r.exceedsText.trim()) {
    parts.push(r.exceedsText.trim());
  }
  if (parts.length === 0 && r.proficientConfirmed) {
    return "This criterion meets the standard.";
  }
  return parts.join("\n\n");
}

function annotationsForCriterion(
  session: IReviewSession,
  criterionId: string
): IAnnotation[] {
  return session.annotations.filter((a) => (a.criterionIds ?? []).includes(criterionId));
}

function buildVersions(oer: IOer): { current: IOerVersion; anchor: IOerVersion } {
  const anchor: IOerVersion = {
    id: `${oer.id}-v1`,
    oerId: oer.id,
    label: "1.0",
    createdAt: oer.submittedAt,
    oerType: oer.oerType,
    oerSource: oer.oerSource,
  };
  const current: IOerVersion = {
    id: `${oer.id}-v-current`,
    oerId: oer.id,
    label: oer.status === "feedback_available" ? "1.1 (draft)" : "1.0",
    createdAt: oer.updatedAt,
    oerType: oer.oerType,
    oerSource: oer.oerSource,
  };
  return { current, anchor };
}

// ── Demo session ──────────────────────────────────────────────────────────────

/**
 * Rich demo session for oer-001 (accessibility rubric) when no submitted session
 * is in localStorage. Reset by removing `oer-hub:session:v3:task-001` in DevTools.
 */
function demoSessionForOer001(): IReviewSession {
  return {
    taskId: "task-001",
    oerId: "oer-001",
    oerType: "mock",
    oerSource: "mock://quantum-mechanics",
    rubricTemplateId: "accessibility",
    annotations: [
      // C1 — needs_improvement: 3 annotations with mixed tags (exercises To-Do List + tag icon display)
      {
        id: "ann-demo-1",
        taskId: "task-001",
        criterionIds: ["C1"],
        tag: "action_item",
        comment:
          "Opening chapter skips from H1 to H3; insert an H2 for the screen reader document outline. Decorative headings detected on p. 4.",
        createdAt: "2026-03-22T11:00:00Z",
        anchor: {
          type: "web",
          selectedText: "Wave–Particle Duality and Quantum Uncertainty",
          rects: [],
        },
      },
      {
        id: "ann-demo-1b",
        taskId: "task-001",
        criterionIds: ["C1"],
        tag: "quick_fix",
        comment:
          "The learning objectives section has no landmark role. Add role=\"navigation\" or a skip-navigation link — this is a one-line change.",
        createdAt: "2026-03-22T11:02:00Z",
        anchor: {
          type: "web",
          selectedText: "Learning Objectives",
          rects: [],
        },
      },
      {
        id: "ann-demo-1c",
        taskId: "task-001",
        criterionIds: ["C1"],
        tag: "general_feedback",
        comment:
          "The paragraph introduces both wave and particle concepts in the same sentence without visual separation. DOM reading order may not match intended instructional flow for AT users.",
        createdAt: "2026-03-22T11:04:00Z",
        anchor: {
          type: "web",
          selectedText: "The foundations of quantum mechanics challenge our classical intuitions about the nature of matter and light.",
          rects: [],
        },
      },
      // C2 — proficient (1 annotation, general_feedback — exercises "no To-Do List" case)
      {
        id: "ann-demo-2",
        taskId: "task-001",
        criterionIds: ["C2"],
        tag: "general_feedback",
        comment:
          "Figure 3.1 caption text uses a reduced-contrast gray on the beige background (~3.1:1). Darken the caption to meet WCAG AA (4.5:1 for small text).",
        createdAt: "2026-03-22T11:05:00Z",
        anchor: {
          type: "web",
          selectedText: "Figure 3.1",
          rects: [],
        },
      },
      // C3 — needs_improvement: 2 action_items + 1 general_feedback
      {
        id: "ann-demo-3",
        taskId: "task-001",
        criterionIds: ["C3"],
        tag: "action_item",
        comment:
          "The figure placeholder uses a generic icon with no alt text or aria-label. Replace with a descriptive alternative explaining the interference pattern shown.",
        createdAt: "2026-03-22T11:12:00Z",
        anchor: {
          type: "web",
          selectedText: "Electron double-slit interference pattern.",
          rects: [],
        },
      },
      {
        id: "ann-demo-3b",
        taskId: "task-001",
        criterionIds: ["C3"],
        tag: "action_item",
        comment:
          "This paragraph introduces the double-slit result without a text description of the interference pattern figure above it. Students using screen readers cannot access the visual.",
        createdAt: "2026-03-22T11:13:00Z",
        anchor: {
          type: "web",
          selectedText: "The double-slit experiment is perhaps the most profound demonstration of quantum behavior.",
          rects: [],
        },
      },
      {
        id: "ann-demo-3c",
        taskId: "task-001",
        criterionIds: ["C3"],
        tag: "general_feedback",
        comment:
          "The \"Key Insight\" callout uses a decorative border and color cue without an accessible role or label. Screen readers will read it as a plain paragraph with no structural context.",
        createdAt: "2026-03-22T11:14:00Z",
        anchor: {
          type: "web",
          selectedText: "Key Insight",
          rects: [],
        },
      },
      // C4 — needs_improvement: linked to BOTH C3 and C4 (exercises multi-criterion "Also under" indicator)
      {
        id: "ann-demo-4",
        taskId: "task-001",
        criterionIds: ["C3", "C4"],
        tag: "action_item",
        comment:
          "The de Broglie equation λ = h/p is rendered as styled text with no MathML or alt text. Screen readers cannot interpret the equation — affects both alt-text (C3) and multimedia accessibility (C4).",
        createdAt: "2026-03-22T11:18:00Z",
        anchor: {
          type: "web",
          selectedText: "In 1924, Louis de Broglie proposed a radical extension of wave–particle duality",
          rects: [],
        },
      },
      // C5 — mixed: quick_fix
      {
        id: "ann-demo-5",
        taskId: "task-001",
        criterionIds: ["C5"],
        tag: "quick_fix",
        comment:
          "The learning objectives list uses bullet spans instead of a semantic <ul>/<ol>. Swap the wrapper element — keyboard and AT users cannot navigate list items individually.",
        createdAt: "2026-03-22T11:24:00Z",
        anchor: {
          type: "web",
          selectedText: "State and interpret the Heisenberg uncertainty principle.",
          rects: [],
        },
      },
      // C6 — exceeds: all general_feedback (exercises "no To-Do List" on an exceeds criterion)
      {
        id: "ann-demo-6",
        taskId: "task-001",
        criterionIds: ["C6"],
        tag: "general_feedback",
        comment:
          "The Key Terms section uses a <dl>/<dt>/<dd> structure — exemplary semantic markup for a glossary. Screen readers announce each term/definition pair correctly.",
        createdAt: "2026-03-22T11:30:00Z",
        anchor: {
          type: "web",
          selectedText: "Heisenberg uncertainty principle",
          rects: [],
        },
      },
      {
        id: "ann-demo-6b",
        taskId: "task-001",
        criterionIds: ["C6"],
        tag: "general_feedback",
        comment:
          "\"Wave function collapse\" definition pairs concise label with an accurate, self-contained description — no external reference needed. Excellent for AT users reading out of context.",
        createdAt: "2026-03-22T11:31:00Z",
        anchor: {
          type: "web",
          selectedText: "Wave function collapse",
          rects: [],
        },
      },
      {
        id: "ann-demo-6c",
        taskId: "task-001",
        criterionIds: ["C6"],
        tag: "general_feedback",
        comment:
          "\"Interference pattern\" definition avoids jargon and provides a complete self-contained explanation — strong plain-language writing that benefits all learners.",
        createdAt: "2026-03-22T11:32:00Z",
        anchor: {
          type: "web",
          selectedText: "Interference pattern",
          rects: [],
        },
      },
      // C7 — needs_improvement: quick_fix
      {
        id: "ann-demo-7",
        taskId: "task-001",
        criterionIds: ["C7"],
        tag: "quick_fix",
        comment:
          "Review question 1 contains ambiguous link text. Replace 'click here' and 'read more' with descriptive labels that make sense out of context — a straightforward copy fix.",
        createdAt: "2026-03-22T11:36:00Z",
        anchor: {
          type: "web",
          selectedText: "An electron is accelerated through a potential difference of 100 V.",
          rects: [],
        },
      },
    ],
    freeNotes: [
      // Two unlinked notes → appear in Reviewer's General Comments section
      {
        id: "fn-demo-1",
        taskId: "task-001",
        text: "Overall this resource lacks a coherent accessibility strategy. Individual fixes will help, but a structural review against WCAG 2.1 AA is recommended before the next revision cycle.",
        tag: "general_feedback",
        criterionIds: [],
        createdAt: "2026-03-22T12:00:00Z",
      },
      {
        id: "fn-demo-2",
        taskId: "task-001",
        text: "Please run the resource through an automated checker (axe, WAVE) and attach the report to your revision submission — it will surface issues beyond what inline annotation can cover.",
        tag: "action_item",
        criterionIds: [],
        createdAt: "2026-03-22T12:05:00Z",
      },
      // One note linked to C1 with action_item tag → appears in C1's To-Do List
      {
        id: "fn-demo-3",
        taskId: "task-001",
        text: "Heading structure fix (C1) is the highest-priority item. Address it before the other criteria — a corrected DOM outline will resolve several downstream AT navigation issues automatically.",
        tag: "action_item",
        criterionIds: ["C1"],
        createdAt: "2026-03-22T12:10:00Z",
      },
      // One note linked to C5 with general_feedback tag → does NOT appear in To-Do (general only)
      {
        id: "fn-demo-4",
        taskId: "task-001",
        text: "The keyboard interaction issues in C5 are partly offset by the excellent microcopy. If you address the focus-trap and color-only errors, this criterion is likely to reach Exceeds.",
        tag: "general_feedback",
        criterionIds: ["C5"],
        createdAt: "2026-03-22T12:15:00Z",
      },
    ],
    ratings: {
      C1: {
        needsImprovementActive: true,
        exceedsActive: false,
        proficientConfirmed: false,
        needsImprovementText:
          "The heading hierarchy skips levels in Chapter 1 (H1 → H3) and uses decorative headings on several pages. Landmark regions are absent on most templates. DOM reading order in the two-column layout does not match the visual order, and no skip-navigation link is present.",
        exceedsText: "",
      },
      C2: {
        needsImprovementActive: false,
        exceedsActive: false,
        proficientConfirmed: true,
        needsImprovementText: "",
        exceedsText: "",
      },
      C3: {
        needsImprovementActive: true,
        exceedsActive: false,
        proficientConfirmed: false,
        needsImprovementText:
          "Several informative images use filenames or are completely missing alt text. The wave interference animation has no textual alternative. Complex diagrams (Figures 1.3 and 5) lack the extended descriptions required for learners who cannot perceive the visual content.",
        exceedsText: "",
      },
      C4: {
        needsImprovementActive: true,
        exceedsActive: false,
        proficientConfirmed: false,
        needsImprovementText:
          "The primary embedded video relies on auto-generated captions that contain significant technical errors. No downloadable transcript is provided. Revised captions and a timestamped transcript are required before this criterion can be considered met.",
        exceedsText: "",
      },
      C5: {
        needsImprovementActive: true,
        exceedsActive: true,
        proficientConfirmed: false,
        needsImprovementText:
          "Some interactive quiz widgets are not keyboard-operable and focus styles are suppressed via CSS. Error messages in the practice exercises rely on color alone without a text label or icon alternative.",
        exceedsText:
          "Where interactions do work, the microcopy is clear and recovery hints are helpful. The glossary tooltips are an excellent inclusive touch — they appear on both hover and focus, and the trigger text is screen-reader-accessible.",
      },
      C6: {
        needsImprovementActive: false,
        exceedsActive: true,
        proficientConfirmed: false,
        needsImprovementText: "",
        exceedsText:
          "All data tables use captions, scoped headers, and where appropriate, summary paragraphs that explain the structure. Complex data is also available in a downloadable CSV. This is exemplary alignment with accessible data presentation practices and exceeds the standard.",
      },
      C7: {
        needsImprovementActive: true,
        exceedsActive: false,
        proficientConfirmed: false,
        needsImprovementText:
          "Multiple external links use generic text ('Read more', 'click here') that is ambiguous when read out of context. Several identical link labels point to different destinations. External links that open new tabs are not labelled as such.",
        exceedsText: "",
      },
      C8: {
        needsImprovementActive: false,
        exceedsActive: false,
        proficientConfirmed: true,
        needsImprovementText: "",
        exceedsText: "",
      },
    },
    splitRatio: 0.65,
    oerScrollY: 0,
    lastSaved: new Date().toISOString(),
    status: "submitted",
    chatHistory: [],
    aiPaneOpen: false,
    activeNudges: [],
  };
}

// ── Per-rubric report ─────────────────────────────────────────────────────────

export async function getPerRubricReport(
  oerId: string,
  rubricTemplateId: RubricTemplateId
): Promise<IPerRubricReport | null> {
  const oer = getOerById(oerId);
  if (!oer) return null;

  const released =
    oer.status === "feedback_available" ||
    oer.status === "pending_verification" ||
    oer.status === "certified";

  const { current, anchor } = buildVersions(oer);

  if (!released) {
    return {
      oer,
      rubricTemplateId,
      rubricName: "",
      reviewCompletedAt: "",
      releasedToAuthor: false,
      criteria: [],
      freeNotes: [],
      anchorVersion: anchor,
      currentVersion: current,
    };
  }

  // Find the completed task for this specific rubric
  const task = allTasks().find(
    (t) =>
      t.oerId === oerId &&
      t.rubricTemplateId === rubricTemplateId &&
      t.status === "completed"
  );
  const taskId = task?.id ?? (oerId === "oer-001" ? "task-001" : null);
  if (!taskId) return null;

  let session = loadSession(taskId);
  if (oerId === "oer-001" && (!session || session.status !== "submitted")) {
    session = demoSessionForOer001();
  }
  if (!session) return null;

  const rubricModule = await import(`../data/rubrics/${rubricTemplateId}.json`);
  const rubric = rubricModule.default as IRubricTemplate;

  const criteria: IAggregatedCriterionFeedback[] = rubric.criteria.map((c) => {
    const r = session!.ratings[c.id];
    const summary = ratingSummary(r);
    // Polarity: exceeds-only → positive; anything else (NI, mixed, proficient) → negative
    const polarity: "positive" | "negative" =
      summary === "exceeds" ? "positive" : "negative";

    return {
      taskId,
      rubricTemplateId,
      criterionId: c.id,
      criterionTitle: c.title,
      criterionStandard: c.standard,
      ratingSummary: summary,
      overallComment: overallCommentForCriterion(r),
      annotations: annotationsForCriterion(session!, c.id).map((a) => ({
        ...a,
        polarity,
      })),
    };
  });

  return {
    oer,
    rubricTemplateId,
    rubricName: rubric.name,
    reviewCompletedAt: task?.submittedAt ?? session.lastSaved,
    releasedToAuthor: true,
    criteria,
    freeNotes: session.freeNotes ?? [],
    anchorVersion: anchor,
    currentVersion: current,
  };
}

// ── Author response CRUD ──────────────────────────────────────────────────────

function responsesKey(oerId: string, rubricTemplateId: RubricTemplateId): string {
  return `oer-hub:block-c:responses:${oerId}:${rubricTemplateId}`;
}

export async function getCriterionResponses(
  oerId: string,
  rubricTemplateId: RubricTemplateId
): Promise<ICriterionResponse[]> {
  return readJson<ICriterionResponse[]>(responsesKey(oerId, rubricTemplateId), []);
}

export async function upsertCriterionResponse(
  response: ICriterionResponse
): Promise<ICriterionResponse> {
  const key = responsesKey(response.oerId, response.rubricTemplateId);
  const existing = readJson<ICriterionResponse[]>(key, []);
  const idx = existing.findIndex((r) => r.criterionId === response.criterionId);
  const next =
    idx >= 0
      ? existing.map((r, i) => (i === idx ? response : r))
      : [...existing, response];
  writeJson(key, next);
  return response;
}

export async function submitRevisionPackage(
  submission: IRevisionSubmission
): Promise<void> {
  const key = `oer-hub:block-c:submission:${submission.oerId}:${submission.rubricTemplateId}`;
  writeJson(key, submission);
  setOerStatusOverride(submission.oerId, "pending_verification");
}

export function getRevisionSubmission(
  oerId: string,
  rubricTemplateId: RubricTemplateId
): IRevisionSubmission | null {
  return readJson<IRevisionSubmission | null>(
    `oer-hub:block-c:submission:${oerId}:${rubricTemplateId}`,
    null
  );
}
