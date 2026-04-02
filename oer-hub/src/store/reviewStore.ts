import { create } from "zustand";
import { saveSession } from "../api";
import { layout } from "../design/tokens";
import type {
  IAnnotation,
  ICriterionRating,
  IReviewSession,
  OerType,
  RubricTemplateId,
} from "../api/types";

function defaultCriterionRating(): ICriterionRating {
  return {
    needsImprovementActive: false,
    exceedsActive: false,
    proficientConfirmed: false,
    needsImprovementText: "",
    exceedsText: "",
  };
}

function mergeRating(partial?: Partial<ICriterionRating>): ICriterionRating {
  return { ...defaultCriterionRating(), ...partial };
}

interface ReviewState extends IReviewSession {
  initSession: (session: IReviewSession) => void;
  resetSession: (params: {
    taskId: string;
    oerId: string;
    oerType: OerType;
    oerSource: string;
    rubricTemplateId: RubricTemplateId;
  }) => void;

  addAnnotation: (annotation: IAnnotation) => void;
  removeAnnotation: (annotationId: string) => void;
  getAnnotationsForCriterion: (criterionId: string) => IAnnotation[];

  toggleNeedsImprovementActive: (criterionId: string) => void;
  toggleExceedsActive: (criterionId: string) => void;
  toggleProficientConfirmed: (criterionId: string) => void;
  setNeedsImprovementText: (criterionId: string, text: string) => void;
  setExceedsText: (criterionId: string, text: string) => void;
  getCriterionRating: (criterionId: string) => ICriterionRating;

  setSplitRatio: (ratio: number) => void;
  setOerScrollY: (y: number) => void;

  setStatus: (status: IReviewSession["status"]) => void;
  setLastSaved: (iso: string) => void;
  persistSessionNow: () => void;

  isReadyToSubmit: (criteriaIds: string[]) => boolean;
  isCriterionAddressed: (criterionId: string) => boolean;
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
  taskId: "",
  oerId: "",
  oerType: "url",
  oerSource: "",
  rubricTemplateId: "accessibility",
  ...defaultSession(),

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

  addAnnotation: (annotation) =>
    set((s) => ({ annotations: [...s.annotations, annotation] })),

  removeAnnotation: (annotationId) =>
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== annotationId),
    })),

  getAnnotationsForCriterion: (criterionId) =>
    get().annotations.filter((a) => a.criterionId === criterionId),

  toggleNeedsImprovementActive: (criterionId) =>
    set((s) => {
      const cur = mergeRating(s.ratings[criterionId]);
      return {
        ratings: {
          ...s.ratings,
          [criterionId]: {
            ...cur,
            needsImprovementActive: !cur.needsImprovementActive,
          },
        },
      };
    }),

  toggleExceedsActive: (criterionId) =>
    set((s) => {
      const cur = mergeRating(s.ratings[criterionId]);
      return {
        ratings: {
          ...s.ratings,
          [criterionId]: { ...cur, exceedsActive: !cur.exceedsActive },
        },
      };
    }),

  toggleProficientConfirmed: (criterionId) =>
    set((s) => {
      const cur = mergeRating(s.ratings[criterionId]);
      return {
        ratings: {
          ...s.ratings,
          [criterionId]: {
            ...cur,
            proficientConfirmed: !cur.proficientConfirmed,
          },
        },
      };
    }),

  setNeedsImprovementText: (criterionId, text) =>
    set((s) => ({
      ratings: {
        ...s.ratings,
        [criterionId]: mergeRating({
          ...s.ratings[criterionId],
          needsImprovementText: text,
        }),
      },
    })),

  setExceedsText: (criterionId, text) =>
    set((s) => ({
      ratings: {
        ...s.ratings,
        [criterionId]: mergeRating({
          ...s.ratings[criterionId],
          exceedsText: text,
        }),
      },
    })),

  getCriterionRating: (criterionId) => mergeRating(get().ratings[criterionId]),

  setSplitRatio: (ratio) =>
    set({
      splitRatio: Math.min(
        layout.maxSplitLeft,
        Math.max(layout.minSplitLeft, ratio)
      ),
    }),

  setOerScrollY: (y) => set({ oerScrollY: y }),

  setStatus: (status) => set({ status }),
  setLastSaved: (iso) => set({ lastSaved: iso }),

  persistSessionNow: () => {
    const now = new Date().toISOString();
    const s = get();
    saveSession({
      taskId: s.taskId,
      oerId: s.oerId,
      oerType: s.oerType,
      oerSource: s.oerSource,
      rubricTemplateId: s.rubricTemplateId,
      annotations: s.annotations,
      ratings: s.ratings,
      splitRatio: s.splitRatio,
      oerScrollY: s.oerScrollY,
      lastSaved: now,
      status: s.status,
    });
    set({ lastSaved: now });
  },

  isCriterionAddressed: (criterionId) => {
    const r = mergeRating(get().ratings[criterionId]);
    return (
      r.proficientConfirmed ||
      r.needsImprovementActive ||
      r.exceedsActive
    );
  },

  isReadyToSubmit: (criteriaIds) => {
    const { isCriterionAddressed } = get();
    return criteriaIds.every((id) => isCriterionAddressed(id));
  },
}));
