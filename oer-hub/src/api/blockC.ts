/**
 * Block C — Aggregated reports, mediation queue, revision cycle, stamps.
 * Mock persistence via localStorage; replace with HTTP in production.
 */

import type {
  IAggregatedCriterionFeedback,
  IAggregatedReport,
  IAnnotation,
  ICriterionRating,
  IDigitalStamp,
  IMediationItem,
  IOer,
  IOerVersion,
  IRevisionCard,
  IRevisionCardProgress,
  IRevisionCycleState,
  IReviewSession,
  IRubricCriterion,
  IRubricTemplate,
  RubricTemplateId,
  CriterionRatingSummary,
} from "./types";
import { MOCK_OERS } from "./mock/oers";
import { MOCK_ACTIVE_TASKS, MOCK_POOL_TASKS } from "./mock/tasks";
import { loadSession } from "./sessionStorage";

const LS_OER_STATUS = "oer-hub:mock:oer-status-overrides";
const LS_MEDIATION = "oer-hub:block-c:mediation-items";
const LS_REVISION = "oer-hub:block-c:revision-cycle";
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

function readMediationItems(): IMediationItem[] {
  return readJson<IMediationItem[]>(LS_MEDIATION, []);
}

function writeMediationItems(items: IMediationItem[]) {
  writeJson(LS_MEDIATION, items);
}

function readStamps(): IDigitalStamp[] {
  return readJson<IDigitalStamp[]>(LS_STAMPS, []);
}

function writeStamps(stamps: IDigitalStamp[]) {
  writeJson(LS_STAMPS, stamps);
}

function readRevisionState(): Record<string, IRevisionCycleState> {
  return readJson(LS_REVISION, {} as Record<string, IRevisionCycleState>);
}

function writeRevisionState(map: Record<string, IRevisionCycleState>) {
  writeJson(LS_REVISION, map);
}

export function getRevisionCycleState(oerId: string): IRevisionCycleState | null {
  return readRevisionState()[oerId] ?? null;
}

export function upsertRevisionCycleState(oerId: string, partial: Partial<IRevisionCycleState>) {
  const map = readRevisionState();
  const cur: IRevisionCycleState = map[oerId] ?? {
    oerId,
    cards: [],
    summaryOfRevisions: "",
    submittedForVerification: false,
  };
  map[oerId] = { ...cur, ...partial, oerId };
  writeRevisionState(map);
}

export function ensureRevisionCardsInitialized(oerId: string, cards: IRevisionCard[]) {
  const map = readRevisionState();
  if (map[oerId]?.cards?.length) return;
  upsertRevisionCycleState(oerId, {
    cards: cards.map((c) => ({
      cardId: c.id,
      resolved: false,
      fixLog: "",
      coordinatorQuestion: "",
    })),
  });
}

export function submitAuthorRevisionPackage(oerId: string, summary: string) {
  upsertRevisionCycleState(oerId, {
    summaryOfRevisions: summary,
    submittedForVerification: true,
  });
  setOerStatusOverride(oerId, "pending_verification");
}

export function getOersPendingVerification(): IOer[] {
  return getMergedOers().filter((o) => o.status === "pending_verification");
}

export function setRevisionCardProgress(
  oerId: string,
  cardId: string,
  progress: Partial<IRevisionCardProgress>
) {
  const map = readRevisionState();
  const cur: IRevisionCycleState = map[oerId] ?? {
    oerId,
    cards: [],
    summaryOfRevisions: "",
    submittedForVerification: false,
  };
  const idx = cur.cards.findIndex((c) => c.cardId === cardId);
  const existing = idx >= 0 ? cur.cards[idx] : undefined;
  const next: IRevisionCardProgress = {
    cardId,
    resolved: false,
    fixLog: "",
    coordinatorQuestion: "",
    ...existing,
    ...progress,
  };
  const cards =
    idx >= 0
      ? cur.cards.map((c, i) => (i === idx ? next : c))
      : [...cur.cards, next];
  map[oerId] = { ...cur, cards };
  writeRevisionState(map);
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

export function getMediationQueue(): IMediationItem[] {
  return readMediationItems();
}

export function getMediationItem(id: string): IMediationItem | null {
  return readMediationItems().find((m) => m.id === id) ?? null;
}

function buildAiConsensusDraft(session: IReviewSession, rubricName: string): string {
  const ni = Object.entries(session.ratings).filter(
    ([, r]) => r.needsImprovementActive
  );
  const ex = Object.entries(session.ratings).filter(([, r]) => r.exceedsActive);
  const lines: string[] = [];
  lines.push(
    `[AI synthesis — ${rubricName}] Cross-checked reviewer annotations and ratings for this submission.`
  );
  if (ni.length) {
    lines.push(
      `• ${ni.length} criterion/criteria flagged for improvement; mapped to evidence highlights where present.`
    );
  }
  if (ex.length) {
    lines.push(`• ${ex.length} criterion/criteria noted as exemplary strengths.`);
  }
  lines.push(
    "No contradictory reviewer pair was detected in this mock (single reviewer). When multiple reviewers disagree, a Consensus Card would merge opposing notes here."
  );
  return lines.join("\n");
}

/** Called when reviewer finalizes — pushes coordinator queue + freezes session. */
export async function submitReviewToMediation(session: IReviewSession): Promise<void> {
  const oer = getOerById(session.oerId);
  if (!oer) return;

  const rubricModule = await import(`../data/rubrics/${session.rubricTemplateId}.json`);
  const rubric = rubricModule.default as IRubricTemplate;
  const draft = buildAiConsensusDraft(session, rubric.name);

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

  setOerStatusOverride(item.oerId, "in_revision");
}

function ratingSummary(r: ICriterionRating | undefined): CriterionRatingSummary {
  if (!r) return "proficient";
  const ni = r.needsImprovementActive;
  const ex = r.exceedsActive;
  const pf = r.proficientConfirmed;
  if (ni && ex) return "mixed";
  if (ni) return "needs_improvement";
  if (ex) return "exceeds";
  if (pf) return "proficient";
  return "proficient";
}

function synthesizedTextForCriterion(
  criterion: IRubricCriterion,
  r: ICriterionRating | undefined
): string {
  if (!r) return criterion.standard;
  const parts: string[] = [];
  if (r.needsImprovementActive && r.needsImprovementText.trim()) {
    parts.push(`Needs improvement: ${r.needsImprovementText.trim()}`);
  }
  if (r.exceedsActive && r.exceedsText.trim()) {
    parts.push(`Strengths: ${r.exceedsText.trim()}`);
  }
  if (r.proficientConfirmed && parts.length === 0) {
    parts.push("Marked as meeting the standard for this criterion.");
  }
  if (parts.length === 0) return criterion.standard;
  return parts.join("\n\n");
}

function annotationsForCriterion(
  session: IReviewSession,
  criterionId: string
): IAnnotation[] {
  return session.annotations.filter((a) => a.criterionId === criterionId);
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
    label: oer.status === "in_revision" ? "1.1 (draft)" : "1.0",
    createdAt: oer.updatedAt,
    oerType: oer.oerType,
    oerSource: oer.oerSource,
  };
  return { current, anchor };
}

/**
 * Rich demo session for `/reports/oer-001` when no submitted session is in localStorage.
 * To reset to this dataset, remove key `oer-hub:session:v3:task-001` in DevTools → Application.
 */
function demoSessionForOer001(): IReviewSession {
  return {
    taskId: "task-001",
    oerId: "oer-001",
    oerType: "mock",
    oerSource: "mock://quantum-mechanics",
    rubricTemplateId: "accessibility",
    annotations: [
      {
        id: "ann-demo-1",
        taskId: "task-001",
        criterionId: "C1",
        comment:
          "Opening chapter skips from H1 to H3; add an H2 for screen reader outline. Decorative headings detected on p. 4.",
        createdAt: "2026-03-22T11:00:00Z",
        anchor: {
          type: "web",
          selectedText: "Chapter 1: Wave–particle duality",
          rects: [{ top: 180, left: 64, width: 280, height: 22 }],
        },
      },
      {
        id: "ann-demo-2",
        taskId: "task-001",
        criterionId: "C2",
        comment:
          "Figure 2 caption uses light gray (#c8c8c8) on white (~2.8:1). Increase contrast or darken caption text to meet AA.",
        createdAt: "2026-03-22T11:05:00Z",
        anchor: {
          type: "web",
          selectedText: "Figure 2 — Probability density",
          rects: [{ top: 320, left: 64, width: 240, height: 20 }],
        },
      },
      {
        id: "ann-demo-3",
        taskId: "task-001",
        criterionId: "C3",
        comment:
          "Diagram 1.3 uses filename as alt text (\"fig13.png\"). Replace with a concise description of the double-slit setup and outcomes.",
        createdAt: "2026-03-22T11:12:00Z",
        anchor: {
          type: "web",
          selectedText: "Double-slit experiment schematic",
          rects: [{ top: 520, left: 64, width: 300, height: 20 }],
        },
      },
      {
        id: "ann-demo-4",
        taskId: "task-001",
        criterionId: "C4",
        comment:
          "Embedded lecture clip has auto-generated captions with frequent errors for technical terms (e.g., \"de Broglie\"). Provide edited captions or a verbatim transcript.",
        createdAt: "2026-03-22T11:18:00Z",
        anchor: {
          type: "web",
          selectedText: "Watch: Introduction to matter waves (12:40)",
          rects: [{ top: 720, left: 64, width: 340, height: 20 }],
        },
      },
      {
        id: "ann-demo-5",
        taskId: "task-001",
        criterionId: "C5",
        comment:
          "Inline quiz radio buttons are not reachable via Tab order; focus ring is suppressed in CSS. Restore visible focus and logical tab sequence.",
        createdAt: "2026-03-22T11:24:00Z",
        anchor: {
          type: "web",
          selectedText: "Quick check: Which statement best describes wave–particle duality?",
          rects: [{ top: 900, left: 64, width: 420, height: 22 }],
        },
      },
      {
        id: "ann-demo-6",
        taskId: "task-001",
        criterionId: "C6",
        comment:
          "Table 4.1 uses merged cells without scope; screen readers announce row/column relationships inconsistently. Add scoped <th> or simplify layout.",
        createdAt: "2026-03-22T11:30:00Z",
        anchor: {
          type: "web",
          selectedText: "Table 4.1 — Commonly used quantum symbols",
          rects: [{ top: 1120, left: 64, width: 360, height: 20 }],
        },
      },
    ],
    ratings: {
      C1: {
        needsImprovementActive: true,
        exceedsActive: false,
        proficientConfirmed: false,
        needsImprovementText:
          "Chapter 1 jumps from H1 to H3; add intermediate H2s. Landmark regions are missing on several templates. Reading order in the two-column layout does not match visual order in one sidebar block.",
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
          "Several informative images use filenames or empty alt. Complex diagrams lack extended descriptions; add a short paragraph alternative adjacent to each figure.",
        exceedsText: "",
      },
      C4: {
        needsImprovementActive: true,
        exceedsActive: false,
        proficientConfirmed: false,
        needsImprovementText:
          "Primary video relies on auto captions with technical errors. Provide edited captions and a downloadable transcript with timestamps.",
        exceedsText: "",
      },
      C5: {
        needsImprovementActive: true,
        exceedsActive: true,
        proficientConfirmed: false,
        needsImprovementText:
          "Some interactive widgets are not fully keyboard-operable and focus styles are suppressed. Error messages for the practice quiz rely on color alone.",
        exceedsText:
          "Where interactions work, microcopy is clear and hints are helpful; glossary tooltips are a strong inclusive touch.",
      },
      C6: {
        needsImprovementActive: false,
        exceedsActive: true,
        proficientConfirmed: false,
        needsImprovementText: "",
        exceedsText:
          "Data tables include captions and scoped headers; complex table includes a summary paragraph. Excellent alignment with accessible data presentation practices.",
      },
      C7: {
        needsImprovementActive: true,
        exceedsActive: false,
        proficientConfirmed: false,
        needsImprovementText:
          "Across the manuscript, external links often read as \"click here\" or duplicate \"read more\" while pointing to different destinations. Add unique, descriptive link phrases and note when links open a new window.",
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
  };
}

function revisionCardId(oerId: string, taskId: string, rubricId: RubricTemplateId, criterionId: string) {
  return `${oerId}::${taskId}::${rubricId}::${criterionId}`;
}

function buildRevisionCards(
  oerId: string,
  taskId: string,
  rubricId: RubricTemplateId,
  criteria: IAggregatedCriterionFeedback[],
  criterionMeta: Map<string, IRubricCriterion>
): IRevisionCard[] {
  const cards: IRevisionCard[] = [];
  for (const row of criteria) {
    if (row.ratingSummary !== "needs_improvement" && row.ratingSummary !== "mixed") continue;
    const anns = row.annotations;
    const hasAnchor = anns.some((a) => (a.anchor.rects?.length ?? 0) > 0);
    const kind: IRevisionCard["kind"] = hasAnchor ? "local" : "global";
    const crit = criterionMeta.get(row.criterionId);
    cards.push({
      id: revisionCardId(oerId, taskId, rubricId, row.criterionId),
      oerId,
      taskId,
      rubricTemplateId: rubricId,
      criterionId: row.criterionId,
      title: crit?.title ?? row.criterionTitle,
      kind,
      synthesizedFeedback: row.synthesizedComment,
      annotationIds: anns.map((a) => a.id),
    });
  }
  return cards;
}

export async function getAggregatedReport(oerId: string): Promise<IAggregatedReport | null> {
  const oer = getOerById(oerId);
  if (!oer) return null;

  const tasks = getTasksForOer(oerId);
  const released =
    oer.status === "in_revision" ||
    oer.status === "pending_verification" ||
    oer.status === "certified";

  const { current, anchor } = buildVersions(oer);

  if (!released) {
    return {
      oer,
      releasedToAuthor: false,
      criteria: [],
      revisionCards: [],
      anchorVersion: anchor,
      currentVersion: current,
    };
  }

  const primaryTask = tasks[0];
  const taskId = primaryTask?.id ?? "task-001";
  let session = loadSession(taskId);

  if (oerId === "oer-001" && (!session || session.status !== "submitted")) {
    session = demoSessionForOer001();
  }

  if (!session) {
    return {
      oer,
      releasedToAuthor: true,
      criteria: [],
      revisionCards: [],
      anchorVersion: anchor,
      currentVersion: current,
    };
  }

  const rubricModule = await import(`../data/rubrics/${session.rubricTemplateId}.json`);
  const rubric = rubricModule.default as IRubricTemplate;
  const meta = new Map(rubric.criteria.map((c) => [c.id, c]));

  const criteriaRows: IAggregatedCriterionFeedback[] = rubric.criteria.map((c) => {
    const r = session.ratings[c.id];
    return {
      taskId: session.taskId,
      rubricTemplateId: session.rubricTemplateId,
      criterionId: c.id,
      criterionTitle: c.title,
      ratingSummary: ratingSummary(r),
      synthesizedComment: synthesizedTextForCriterion(c, r),
      annotations: annotationsForCriterion(session, c.id).map((a) => ({ ...a })),
    };
  });

  const revisionCards = buildRevisionCards(
    oerId,
    session.taskId,
    session.rubricTemplateId,
    criteriaRows,
    meta
  );

  return {
    oer,
    releasedToAuthor: true,
    criteria: criteriaRows,
    revisionCards,
    anchorVersion: anchor,
    currentVersion: current,
  };
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
