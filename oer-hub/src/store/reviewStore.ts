import { create } from "zustand";
import { layout } from "../design/tokens";
import type {
  IAnnotation,
  ICriterionRating,
  IReviewSession,
  OerType,
  RatingValue,
  RubricTemplateId,
} from "../api/types";

interface ReviewState extends IReviewSession {
  // ── Setters ────────────────────────────────────────────────────────────────
  initSession: (session: IReviewSession) => void;
  resetSession: (params: {
    taskId: string;
    oerId: string;
    oerType: OerType;
    oerSource: string;
    rubricTemplateId: RubricTemplateId;
  }) => void;

  // Annotations
  addAnnotation: (annotation: IAnnotation) => void;
  removeAnnotation: (annotationId: string) => void;
  getAnnotationsForCriterion: (criterionId: string) => IAnnotation[];

  // Ratings
  setRating: (criterionId: string, rating: RatingValue) => void;
  setNeedsImprovementText: (criterionId: string, text: string) => void;
  setExceedsText: (criterionId: string, text: string) => void;
  getRating: (criterionId: string) => ICriterionRating | undefined;

  // Layout
  setSplitRatio: (ratio: number) => void;
  setOerScrollY: (y: number) => void;

  // Status
  setStatus: (status: IReviewSession["status"]) => void;
  setLastSaved: (iso: string) => void;

  // Derived
  isReadyToSubmit: (criteriaIds: string[]) => boolean;
}

const defaultSession = (): Omit<
  IReviewSession,
  "taskId" | "oerId" | "oerType" | "oerSource" | "rubricTemplateId"
> => ({
  annotations: [],
  ratings: {},
  splitRatio: layout.defaultSplit,
  oerScrollY: 0,
  lastSaved: new Date().toISOString(),
  status: "draft",
});

export const useReviewStore = create<ReviewState>((set, get) => ({
  // Initial placeholder state
  taskId: "",
  oerId: "",
  oerType: "url",
  oerSource: "",
  rubricTemplateId: "accessibility",
  ...defaultSession(),

  // ── Init ──────────────────────────────────────────────────────────────────

  initSession: (session) => set({ ...session }),

  resetSession: ({ taskId, oerId, oerType, oerSource, rubricTemplateId }) =>
    set({
      taskId,
      oerId,
      oerType,
      oerSource,
      rubricTemplateId,
      ...defaultSession(),
    }),

  // ── Annotations ───────────────────────────────────────────────────────────

  addAnnotation: (annotation) =>
    set((s) => ({ annotations: [...s.annotations, annotation] })),

  removeAnnotation: (annotationId) =>
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== annotationId),
    })),

  getAnnotationsForCriterion: (criterionId) =>
    get().annotations.filter((a) => a.criterionId === criterionId),

  // ── Ratings ───────────────────────────────────────────────────────────────

  setRating: (criterionId, rating) =>
    set((s) => ({
      ratings: {
        ...s.ratings,
        [criterionId]: {
          rating,
          needsImprovementText: s.ratings[criterionId]?.needsImprovementText ?? "",
          exceedsText: s.ratings[criterionId]?.exceedsText ?? "",
        },
      },
    })),

  setNeedsImprovementText: (criterionId, text) =>
    set((s) => ({
      ratings: {
        ...s.ratings,
        [criterionId]: {
          ...s.ratings[criterionId],
          rating: s.ratings[criterionId]?.rating ?? null,
          exceedsText: s.ratings[criterionId]?.exceedsText ?? "",
          needsImprovementText: text,
        },
      },
    })),

  setExceedsText: (criterionId, text) =>
    set((s) => ({
      ratings: {
        ...s.ratings,
        [criterionId]: {
          ...s.ratings[criterionId],
          rating: s.ratings[criterionId]?.rating ?? null,
          needsImprovementText: s.ratings[criterionId]?.needsImprovementText ?? "",
          exceedsText: text,
        },
      },
    })),

  getRating: (criterionId) => get().ratings[criterionId],

  // ── Layout ────────────────────────────────────────────────────────────────

  setSplitRatio: (ratio) =>
    set({
      splitRatio: Math.min(
        layout.maxSplitLeft,
        Math.max(layout.minSplitLeft, ratio)
      ),
    }),

  setOerScrollY: (y) => set({ oerScrollY: y }),

  // ── Status ────────────────────────────────────────────────────────────────

  setStatus: (status) => set({ status }),
  setLastSaved: (iso) => set({ lastSaved: iso }),

  // ── Derived ───────────────────────────────────────────────────────────────

  isReadyToSubmit: (criteriaIds) => {
    const { ratings, annotations } = get();

    // All criteria must have a rating
    const allRated = criteriaIds.every((id) => ratings[id]?.rating != null);
    if (!allRated) return false;

    // "Needs Improvement" or "Exceeds" require evidence
    const flagged = criteriaIds.filter(
      (id) =>
        ratings[id]?.rating === "needs_improvement" ||
        ratings[id]?.rating === "exceeds"
    );
    const hasEvidence = flagged.every(
      (id) => annotations.some((a) => a.criterionId === id)
    );

    return hasEvidence;
  },
}));
