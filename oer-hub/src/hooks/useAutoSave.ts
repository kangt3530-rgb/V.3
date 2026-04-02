import { useEffect, useRef } from "react";
import { saveSession } from "../api";
import { useReviewStore } from "../store/reviewStore";

const DEBOUNCE_MS = 800;

/**
 * Watches the review store and auto-saves to localStorage on every mutation.
 * Must be called inside ReviewerConsole (which owns an active taskId).
 */
export function useAutoSave() {
  const session = useReviewStore((s) => ({
    taskId: s.taskId,
    oerId: s.oerId,
    oerType: s.oerType,
    oerSource: s.oerSource,
    rubricTemplateId: s.rubricTemplateId,
    annotations: s.annotations,
    ratings: s.ratings,
    splitRatio: s.splitRatio,
    oerScrollY: s.oerScrollY,
    lastSaved: s.lastSaved,
    status: s.status,
  }));

  const setLastSaved = useReviewStore((s) => s.setLastSaved);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session.taskId) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const now = new Date().toISOString();
      saveSession({ ...session, lastSaved: now });
      setLastSaved(now);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    session.annotations,
    session.ratings,
    session.splitRatio,
    session.status,
  ]);
}
