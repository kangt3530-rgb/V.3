import { create } from "zustand";
import { saveSession } from "../api";
import { layout } from "../design/tokens";
import type { ChatMessage, AIPreferences, CommentNudgeContext } from "../api/ai";
import { DEFAULT_AI_PREFERENCES } from "../api/ai";
import type {
  IAnnotation,
  IFreeNote,
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
  updateAnnotation: (annotationId: string, partial: Partial<Pick<IAnnotation, "comment" | "tag" | "criterionIds">>) => void;
  getAnnotationsForCriterion: (criterionId: string) => IAnnotation[];

  addFreeNote: (note: IFreeNote) => void;
  updateFreeNote: (noteId: string, partial: Partial<Pick<IFreeNote, "text" | "tag" | "criterionIds">>) => void;
  removeFreeNote: (noteId: string) => void;
  getLinkedFreeNotesForCriterion: (criterionId: string) => IFreeNote[];

  linkAnnotationToCriterion: (annotationId: string, criterionId: string) => void;
  unlinkAnnotationFromCriterion: (annotationId: string, criterionId: string) => void;
  getUnlinkedAnnotations: () => IAnnotation[];

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

  addChatMessage: (message: ChatMessage) => void;
  setChatHistory: (messages: ChatMessage[]) => void;
  toggleAIPane: () => void;
  setAIPaneOpen: (open: boolean) => void;

  // R1 runtime-only state (not persisted to IReviewSession)
  activeRubricTerms: Set<string>;
  rubricFullText: string;
  pendingLookup: { term: string } | null;
  setRubricContext: (terms: Set<string>, fullText: string) => void;
  dispatchLookup: (term: string) => void;
  clearPendingLookup: () => void;
  toggleLookupCollapse: (index: number) => void;

  // R4 runtime-only state (not persisted)
  activeCriterionId: string | null;
  activeCriterionTitle: string | null;
  setActiveCriterion: (id: string | null, title: string | null) => void;

  // R7 runtime-only (not persisted)
  activeVoiceFieldId: string | null;
  setActiveVoiceField: (id: string | null) => void;

  // AI preferences (runtime-only, not persisted with session)
  aiPreferences: AIPreferences;
  setAIPreferences: (prefs: Partial<AIPreferences>) => void;

  // R3+R16 comment nudge (runtime-only)
  activeCommentNudge: CommentNudgeContext | null;
  showCommentNudgeInChat: (context: CommentNudgeContext) => void;
  clearActiveCommentNudge: () => void;
  appendToCommentField: (criterionId: string, fieldType: "ni" | "exceeds", text: string) => void;

  isReadyToSubmit: (criteriaIds: string[]) => boolean;
  isCriterionAddressed: (criterionId: string) => boolean;
}

const defaultSession = (): Omit<
  IReviewSession,
  "taskId" | "oerId" | "oerType" | "oerSource" | "rubricTemplateId"
> => ({
  annotations: [],
  freeNotes: [],
  ratings: {},
  splitRatio: layout.defaultSplit,
  oerScrollY: 0,
  lastSaved: new Date().toISOString(),
  status: "draft",
  chatHistory: [],
  aiPaneOpen: false,
  activeNudges: [],
});

export const useReviewStore = create<ReviewState>((set, get) => ({
  taskId: "",
  oerId: "",
  oerType: "url",
  oerSource: "",
  rubricTemplateId: "accessibility",
  ...defaultSession(),

  // R1 runtime-only
  activeRubricTerms: new Set<string>(),
  rubricFullText: "",
  pendingLookup: null,

  // R4 runtime-only
  activeCriterionId: null,
  activeCriterionTitle: null,

  // R7 runtime-only
  activeVoiceFieldId: null,

  // AI preferences runtime-only
  aiPreferences: { ...DEFAULT_AI_PREFERENCES },

  // R3+R16 runtime-only
  activeCommentNudge: null,

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

  updateAnnotation: (annotationId, partial) =>
    set((s) => ({
      annotations: s.annotations.map((a) => a.id === annotationId ? { ...a, ...partial } : a),
    })),

  getAnnotationsForCriterion: (criterionId) =>
    get().annotations.filter((a) => {
      // Guard against legacy persisted sessions that stored criterionId: string
      const ids = Array.isArray(a.criterionIds)
        ? a.criterionIds
        : [(a as unknown as { criterionId?: string }).criterionId ?? ""].filter(Boolean);
      return ids.includes(criterionId);
    }),

  addFreeNote: (note) =>
    set((s) => ({ freeNotes: [...s.freeNotes, note] })),

  updateFreeNote: (noteId, partial) =>
    set((s) => ({
      freeNotes: s.freeNotes.map((n) => n.id === noteId ? { ...n, ...partial } : n),
    })),

  removeFreeNote: (noteId) =>
    set((s) => ({ freeNotes: s.freeNotes.filter((n) => n.id !== noteId) })),

  getLinkedFreeNotesForCriterion: (criterionId) =>
    get().freeNotes.filter((n) => n.criterionIds.includes(criterionId)),

  linkAnnotationToCriterion: (annotationId, criterionId) =>
    set((s) => ({
      annotations: s.annotations.map((a) => {
        if (a.id !== annotationId) return a;
        const ids = Array.isArray(a.criterionIds) ? a.criterionIds : [];
        return ids.includes(criterionId) ? a : { ...a, criterionIds: [...ids, criterionId] };
      }),
    })),

  unlinkAnnotationFromCriterion: (annotationId, criterionId) =>
    set((s) => ({
      annotations: s.annotations.map((a) =>
        a.id !== annotationId ? a : { ...a, criterionIds: (Array.isArray(a.criterionIds) ? a.criterionIds : []).filter((id) => id !== criterionId) }
      ),
    })),

  getUnlinkedAnnotations: () =>
    get().annotations.filter((a) => {
      const ids = Array.isArray(a.criterionIds) ? a.criterionIds : [];
      return ids.length === 0;
    }),

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
      taskId:           s.taskId,
      oerId:            s.oerId,
      oerType:          s.oerType,
      oerSource:        s.oerSource,
      rubricTemplateId: s.rubricTemplateId,
      annotations:      s.annotations,
      freeNotes:        s.freeNotes,
      ratings:          s.ratings,
      splitRatio:       s.splitRatio,
      oerScrollY:       s.oerScrollY,
      lastSaved:        now,
      status:           s.status,
      chatHistory:      s.chatHistory,
      aiPaneOpen:       s.aiPaneOpen,
      activeNudges:     s.activeNudges,
    });
    set({ lastSaved: now });
  },

  addChatMessage: (message) =>
    set((s) => {
      const next = [...s.chatHistory, message];
      return { chatHistory: next.length > 50 ? next.slice(next.length - 50) : next };
    }),

  setChatHistory: (messages) => set({ chatHistory: messages }),

  toggleAIPane: () => set((s) => ({ aiPaneOpen: !s.aiPaneOpen })),

  setAIPaneOpen: (open) => set({ aiPaneOpen: open }),

  setRubricContext: (terms, fullText) =>
    set({ activeRubricTerms: terms, rubricFullText: fullText }),

  dispatchLookup: (term) =>
    set((s) => {
      const collapsed = s.chatHistory.map((m) =>
        m.type === "term_lookup" ? { ...m, collapsed: true } : m
      );
      const withUser = [...collapsed, { role: "user" as const, content: `Look up: ${term}` }];
      const capped = withUser.length > 50 ? withUser.slice(withUser.length - 50) : withUser;
      return { chatHistory: capped, aiPaneOpen: true, pendingLookup: { term } };
    }),

  clearPendingLookup: () => set({ pendingLookup: null }),

  setActiveCriterion: (id, title) => set({ activeCriterionId: id, activeCriterionTitle: title }),

  setActiveVoiceField: (id) => set({ activeVoiceFieldId: id }),

  setAIPreferences: (prefs) =>
    set((s) => ({ aiPreferences: { ...s.aiPreferences, ...prefs } })),

  showCommentNudgeInChat: (context) =>
    set({ activeCommentNudge: context, aiPaneOpen: true }),

  clearActiveCommentNudge: () => set({ activeCommentNudge: null }),

  appendToCommentField: (criterionId, fieldType, text) =>
    set((s) => {
      const key = fieldType === "ni" ? "needsImprovementText" : "exceedsText";
      const current = s.ratings[criterionId]?.[key] ?? "";
      const updated = current.trim() ? `${current.trim()} ${text}` : text;
      return {
        ratings: {
          ...s.ratings,
          [criterionId]: mergeRating({ ...s.ratings[criterionId], [key]: updated }),
        },
      };
    }),

  toggleLookupCollapse: (index) =>
    set((s) => {
      const chatHistory = s.chatHistory.map((m, i) =>
        i === index ? { ...m, collapsed: !m.collapsed } : m
      );
      return { chatHistory };
    }),

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
