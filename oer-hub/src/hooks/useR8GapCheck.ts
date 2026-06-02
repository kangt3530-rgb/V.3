import { useCallback } from "react";
import {
  callR8GapCheck,
  computeGapSignals,
  countWords,
} from "../api/ai";
import { useReviewStore } from "../store/reviewStore";
import { useAIPrefsStore } from "../store/aiPrefsStore";
import type { IRubricTemplate } from "../api/types";

const RUBRIC_NAMES: Record<string, string> = {
  accessibility:  "Accessibility",
  "copy-editing": "Copy Editing",
  copyright:      "Copyright",
  disciplinary:   "Disciplinary Appropriateness",
  elearning:      "eLearning",
  udl:            "Universal Design for Learning (UDL)",
};

/**
 * Returns a function that runs the R8 pre-submit gap check.
 * Result is injected into the AI chatbox and the pane is opened automatically.
 * Returns true if the check ran, false if skipped (disabled or no gaps found).
 */
export function useR8GapCheck(): (template: IRubricTemplate) => Promise<boolean> {
  const addChatMessage = useReviewStore((s) => s.addChatMessage);
  const setAIPaneOpen  = useReviewStore((s) => s.setAIPaneOpen);

  return useCallback(
    async (template: IRubricTemplate): Promise<boolean> => {
      const s = useReviewStore.getState();

      const gapEnabled = useAIPrefsStore.getState().isNudgeEnabled(s.rubricTemplateId, "gap_check");
      if (!gapEnabled) return false;

      // Build annotation count map
      const annotationCountByCriterion: Record<string, number> = {};
      for (const a of s.annotations) {
        for (const id of a.criterionIds ?? []) {
          annotationCountByCriterion[id] =
            (annotationCountByCriterion[id] ?? 0) + 1;
        }
      }

      const gapSignals = computeGapSignals({
        criteria: template.criteria.map((c) => ({ id: c.id, title: c.title })),
        ratings: s.ratings,
        annotationCountByCriterion,
      });

      if (gapSignals.length === 0) return false;

      // Compute average word count across all rated criteria
      const allCounts = template.criteria
        .map((c) => {
          const r = s.ratings[c.id];
          if (!r) return 0;
          const t = r.needsImprovementActive
            ? r.needsImprovementText
            : r.exceedsActive
              ? r.exceedsText
              : "";
          return countWords(t);
        })
        .filter((n) => n > 0);
      const avg = allCounts.length
        ? allCounts.reduce((a, b) => a + b, 0) / allCounts.length
        : 0;

      const message = await callR8GapCheck({
        templateName: RUBRIC_NAMES[s.rubricTemplateId] ?? s.rubricTemplateId,
        totalCriteria: template.criteria.length,
        avgCommentWordCount: avg,
        gapSignals,
        tone: s.aiPreferences.nudgeTone,
      });

      addChatMessage({ role: "assistant", content: message });
      setAIPaneOpen(true);
      return true;
    },
    [addChatMessage, setAIPaneOpen]
  );
}
