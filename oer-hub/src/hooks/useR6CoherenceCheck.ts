import { useEffect, useRef, useState } from "react";
import {
  callR6CoherenceCheck,
  computeCoherenceSignals,
  countWords,
} from "../api/ai";
import type { CoherenceSignal } from "../api/ai";
import { useReviewStore } from "../store/reviewStore";
import { useNudgeEnabled } from "../store/aiPrefsStore";
import type { IAnnotation } from "../api/types";

const RUBRIC_NAMES: Record<string, string> = {
  accessibility:  "Accessibility",
  "copy-editing": "Copy Editing",
  copyright:      "Copyright",
  disciplinary:   "Disciplinary Appropriateness",
  elearning:      "eLearning",
  udl:            "Universal Design for Learning (UDL)",
};

interface R6Result {
  nudgeMessage: string | null;
  loading: boolean;
  dismiss: () => void;
}

export function useR6CoherenceCheck(
  criterionId: string,
  criterionTitle: string,
  annotations: IAnnotation[]
): R6Result {
  const niActive        = useReviewStore((s) => s.ratings[criterionId]?.needsImprovementActive ?? false);
  const exceedsActive   = useReviewStore((s) => s.ratings[criterionId]?.exceedsActive ?? false);
  const proficientConfirmed = useReviewStore((s) => s.ratings[criterionId]?.proficientConfirmed ?? false);
  const niText          = useReviewStore((s) => s.ratings[criterionId]?.needsImprovementText ?? "");
  const exceedsText     = useReviewStore((s) => s.ratings[criterionId]?.exceedsText ?? "");
  const allRatings      = useReviewStore((s) => s.ratings);
  const rubricId        = useReviewStore((s) => s.rubricTemplateId);
  const coherenceEnabled = useNudgeEnabled(rubricId, "coherence_check");

  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [loading, setLoading]           = useState(false);
  // stateHash at the time the user dismissed — prevents re-fire without new edits
  const dismissedHashRef = useRef<string | null>(null);
  const abortRef         = useRef(false);

  const ratingSelected = niActive || exceedsActive || proficientConfirmed;
  const comment = niActive ? niText : exceedsActive ? exceedsText : "";
  const hasComment = comment.trim().length > 0;
  const shouldFire = ratingSelected && annotations.length > 0 && hasComment;

  const ratingLabel: "needs_improvement" | "exceeds" | "proficient" = niActive
    ? "needs_improvement"
    : exceedsActive
      ? "exceeds"
      : "proficient";

  // Stable hash of the inputs that drive R6; changes re-arm dismissal
  const stateHash = `${ratingLabel}:${annotations.length}:${comment}`;

  // When the reviewer edits after dismissal, clear the nudge so R6 can re-fire
  useEffect(() => {
    if (dismissedHashRef.current && dismissedHashRef.current !== stateHash) {
      dismissedHashRef.current = null;
      setNudgeMessage(null);
    }
  }, [stateHash]);

  useEffect(() => {
    if (!shouldFire) return;
    if (!coherenceEnabled) return;
    if (dismissedHashRef.current === stateHash) return;

    abortRef.current = false;
    const timer = setTimeout(async () => {
      if (abortRef.current) return;

      // Compute average word count from other rated criteria (exclude current)
      const otherCounts = Object.entries(allRatings)
        .filter(([id]) => id !== criterionId)
        .map(([, r]) => {
          const t = r.needsImprovementActive
            ? r.needsImprovementText
            : r.exceedsActive
              ? r.exceedsText
              : "";
          return countWords(t);
        })
        .filter((n) => n > 0);

      const signals: CoherenceSignal[] = computeCoherenceSignals({
        comment,
        criterionId,
        criterionTitle,
        otherCommentWordCounts: otherCounts,
      });

      if (signals.length === 0) return;

      setLoading(true);
      const avg = otherCounts.length
        ? otherCounts.reduce((a, b) => a + b, 0) / otherCounts.length
        : 0;

      const message = await callR6CoherenceCheck({
        criterionId,
        criterionTitle,
        templateName: RUBRIC_NAMES[rubricId] ?? rubricId,
        rating: ratingLabel,
        annotationCount: annotations.length,
        commentWordCount: countWords(comment),
        avgCommentWordCount: avg,
        detectedSignals: signals,
        tone: useReviewStore.getState().aiPreferences.nudgeTone,
      });

      if (!abortRef.current) {
        setNudgeMessage(message);
        setLoading(false);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      abortRef.current = true;
      setLoading(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateHash, shouldFire, coherenceEnabled]);

  function dismiss() {
    dismissedHashRef.current = stateHash;
    setNudgeMessage(null);
  }

  return { nudgeMessage, loading, dismiss };
}
