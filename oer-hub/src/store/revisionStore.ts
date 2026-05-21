import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CriterionRatingSummary,
  ICriterionResponse,
  RubricTemplateId,
  RevisionStatus,
} from "../api/types";

interface RevisionStoreState {
  // Current context (set at route mount; not persisted)
  currentOerId: string | null;
  currentRubricId: RubricTemplateId | null;

  // Filter state (arrays, not Sets, for JSON persist compat)
  activeRatingFilters: CriterionRatingSummary[];
  activeStatusFilters: RevisionStatus[];

  // Accordion state — criterion IDs that are collapsed; default = all expanded
  collapsedCriteria: string[];

  // OER preview pane
  oerPaneOpen: boolean;
  oerPaneWidth: number; // percentage, default 35
  viewingAnnotationId: string | null;

  // AI chatbox
  aiChatOpen: boolean;
  aiChatCriterionId: string | null;
  aiChatWidth: number; // percentage, default 25

  // Per-criterion draft responses (before saving to API), keyed by criterionId
  draftResponses: Record<string, Partial<ICriterionResponse>>;

  // Actions
  setContext: (oerId: string, rubricId: RubricTemplateId) => void;
  toggleRatingFilter: (rating: CriterionRatingSummary) => void;
  toggleStatusFilter: (status: RevisionStatus) => void;
  clearFilters: () => void;
  toggleCriterionCollapse: (criterionId: string) => void;
  openOerPane: (annotationId: string) => void;
  openOerPaneOnly: () => void;
  closeOerPane: () => void;
  setOerPaneWidth: (width: number) => void;
  navigateAnnotation: (direction: "prev" | "next", allAnnotationIds: string[]) => void;
  reportScrollPending: boolean;
  clearReportScroll: () => void;
  toggleAiChat: () => void;
  openAiChat: (criterionId?: string) => void;
  setAiChatWidth: (width: number) => void;
  updateDraftResponse: (criterionId: string, partial: Partial<ICriterionResponse>) => void;
}

export const useRevisionStore = create<RevisionStoreState>()(
  persist(
    (set, get) => ({
      currentOerId: null,
      currentRubricId: null,
      activeRatingFilters: [],
      activeStatusFilters: [],
      collapsedCriteria: [],
      oerPaneOpen: false,
      oerPaneWidth: 35,
      viewingAnnotationId: null,
      aiChatOpen: false,
      aiChatCriterionId: null,
      aiChatWidth: 25,
      reportScrollPending: false,
      draftResponses: {},

      setContext: (oerId, rubricId) => {
        set({ currentOerId: oerId, currentRubricId: rubricId });
      },

      toggleRatingFilter: (rating) => {
        const { activeRatingFilters } = get();
        set({
          activeRatingFilters: activeRatingFilters.includes(rating)
            ? activeRatingFilters.filter((r) => r !== rating)
            : [...activeRatingFilters, rating],
        });
      },

      toggleStatusFilter: (status) => {
        const { activeStatusFilters } = get();
        set({
          activeStatusFilters: activeStatusFilters.includes(status)
            ? activeStatusFilters.filter((s) => s !== status)
            : [...activeStatusFilters, status],
        });
      },

      clearFilters: () => {
        set({ activeRatingFilters: [], activeStatusFilters: [] });
      },

      toggleCriterionCollapse: (criterionId) => {
        const { collapsedCriteria } = get();
        set({
          collapsedCriteria: collapsedCriteria.includes(criterionId)
            ? collapsedCriteria.filter((id) => id !== criterionId)
            : [...collapsedCriteria, criterionId],
        });
      },

      openOerPane: (annotationId) => {
        set({ oerPaneOpen: true, viewingAnnotationId: annotationId });
      },

      openOerPaneOnly: () => {
        set({ oerPaneOpen: true, viewingAnnotationId: null });
      },

      closeOerPane: () => {
        set({ oerPaneOpen: false, viewingAnnotationId: null });
      },

      setOerPaneWidth: (width) => {
        set({ oerPaneWidth: width });
      },

      navigateAnnotation: (direction, allAnnotationIds) => {
        const { viewingAnnotationId } = get();
        if (!allAnnotationIds.length) return;
        const idx = viewingAnnotationId
          ? allAnnotationIds.indexOf(viewingAnnotationId)
          : -1;
        let next: number;
        if (direction === "next") {
          next = idx < allAnnotationIds.length - 1 ? idx + 1 : 0;
        } else {
          next = idx > 0 ? idx - 1 : allAnnotationIds.length - 1;
        }
        set({ viewingAnnotationId: allAnnotationIds[next], reportScrollPending: true });
      },

      clearReportScroll: () => {
        set({ reportScrollPending: false });
      },

      toggleAiChat: () => {
        set((s) => ({ aiChatOpen: !s.aiChatOpen }));
      },

      openAiChat: (criterionId) => {
        set({ aiChatOpen: true, aiChatCriterionId: criterionId ?? null });
      },

      setAiChatWidth: (width) => {
        set({ aiChatWidth: width });
      },

      updateDraftResponse: (criterionId, partial) => {
        const { draftResponses } = get();
        set({
          draftResponses: {
            ...draftResponses,
            [criterionId]: { ...draftResponses[criterionId], ...partial },
          },
        });
      },
    }),
    {
      name: "oer-hub:block-c:revision-store",
      // currentOerId and currentRubricId are set at route mount — do not persist them
      partialize: (state) => {
        const { currentOerId, currentRubricId, ...rest } = state;
        void currentOerId;
        void currentRubricId;
        return rest;
      },
    }
  )
);
