/**
 * Review session persistence (Block B) — extracted to avoid circular imports with Block C.
 */

import type { IAnnotation, ICriterionRating, IReviewSession, RatingValue, RubricTemplateId } from "./types";

const SESSION_KEY_V3 = (taskId: string) => `oer-hub:session:v3:${taskId}`;
/** @deprecated Legacy key — migrated on load */
const SESSION_KEY_V2 = (taskId: string) => `oer-hub:session:v2:${taskId}`;
const PREAMBLE_KEY = (rubricId: string) => `oer-hub:preamble-seen:${rubricId}`;

function migrateCriterionRating(legacy: unknown): ICriterionRating {
  if (
    legacy &&
    typeof legacy === "object" &&
    "needsImprovementActive" in (legacy as object)
  ) {
    const r = legacy as ICriterionRating;
    return {
      needsImprovementActive: Boolean(r.needsImprovementActive),
      exceedsActive: Boolean(r.exceedsActive),
      proficientConfirmed: Boolean(r.proficientConfirmed),
      needsImprovementText: r.needsImprovementText ?? "",
      exceedsText: r.exceedsText ?? "",
    };
  }
  const L = legacy as {
    rating?: RatingValue | null;
    needsImprovementText?: string;
    exceedsText?: string;
  };
  const rating = L?.rating ?? null;
  return {
    needsImprovementActive: rating === "needs_improvement",
    exceedsActive: rating === "exceeds",
    proficientConfirmed: rating === "proficient",
    needsImprovementText: L?.needsImprovementText ?? "",
    exceedsText: L?.exceedsText ?? "",
  };
}

function migrateAnnotation(a: unknown): IAnnotation {
  const x = a as Partial<IAnnotation> & { evidencePolarity?: unknown };
  return {
    id: x.id ?? "",
    taskId: x.taskId ?? "",
    criterionId: x.criterionId ?? "",
    comment: x.comment ?? "",
    createdAt: x.createdAt ?? new Date().toISOString(),
    anchor: x.anchor ?? { type: "web", selectedText: "", rects: [] },
  };
}

function normalizeSession(raw: unknown): IReviewSession {
  const s = raw as Partial<IReviewSession> & {
    ratings?: Record<string, unknown>;
    annotations?: unknown[];
  };
  const ratings: Record<string, ICriterionRating> = {};
  if (s.ratings && typeof s.ratings === "object") {
    for (const [k, v] of Object.entries(s.ratings)) {
      ratings[k] = migrateCriterionRating(v);
    }
  }
  const annotations = (s.annotations ?? []).map(migrateAnnotation);
  return {
    taskId: s.taskId ?? "",
    oerId: s.oerId ?? "",
    oerType: s.oerType ?? "url",
    oerSource: s.oerSource ?? "",
    rubricTemplateId: s.rubricTemplateId ?? "accessibility",
    annotations,
    ratings,
    splitRatio: typeof s.splitRatio === "number" ? s.splitRatio : 0.5,
    oerScrollY: typeof s.oerScrollY === "number" ? s.oerScrollY : 0,
    lastSaved: s.lastSaved ?? new Date().toISOString(),
    status: s.status === "submitted" ? "submitted" : "draft",
  };
}

export function loadSession(taskId: string): IReviewSession | null {
  try {
    const v3 = localStorage.getItem(SESSION_KEY_V3(taskId));
    if (v3) {
      return normalizeSession(JSON.parse(v3));
    }
    const v2 = localStorage.getItem(SESSION_KEY_V2(taskId));
    if (v2) {
      const migrated = normalizeSession(JSON.parse(v2));
      saveSession(migrated);
      localStorage.removeItem(SESSION_KEY_V2(taskId));
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: IReviewSession): void {
  const normalized = normalizeSession(session);
  localStorage.setItem(SESSION_KEY_V3(normalized.taskId), JSON.stringify(normalized));
}

export function clearSession(taskId: string): void {
  localStorage.removeItem(SESSION_KEY_V3(taskId));
  localStorage.removeItem(SESSION_KEY_V2(taskId));
}

export function hasPreambleBeenSeen(rubricId: RubricTemplateId): boolean {
  return localStorage.getItem(PREAMBLE_KEY(rubricId)) === "true";
}

export function markPreambleSeen(rubricId: RubricTemplateId): void {
  localStorage.setItem(PREAMBLE_KEY(rubricId), "true");
}
