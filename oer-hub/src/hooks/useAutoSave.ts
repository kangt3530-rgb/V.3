import { useEffect, useRef } from "react";
import { saveSession } from "../api";
import { useReviewStore } from "../store/reviewStore";

const DEBOUNCE_MS = 800;

/**
 * Auto-saves the review session to localStorage on every meaningful mutation.
 *
 * KEY RULE: never select an inline object `(s) => ({ a: s.a, b: s.b })` from
 * Zustand — that creates a new reference on every call and causes
 * useSyncExternalStore to loop infinitely.  Use one selector per primitive /
 * stable reference instead, and call getState() inside the debounced callback
 * to snapshot the full session at save-time.
 */
export function useAutoSave() {
  // Individual primitive / stable-reference selectors — no object creation.
  const taskId      = useReviewStore((s) => s.taskId);
  const annotations = useReviewStore((s) => s.annotations);   // stable ref until mutated
  const ratings     = useReviewStore((s) => s.ratings);       // stable ref until mutated
  const splitRatio  = useReviewStore((s) => s.splitRatio);
  const status      = useReviewStore((s) => s.status);
  const setLastSaved = useReviewStore((s) => s.setLastSaved);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!taskId) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const now = new Date().toISOString();
      // Read the full store state imperatively at save-time — avoids subscribing
      // to every field or snapshotting into an object during render.
      const s = useReviewStore.getState();
      saveSession({
        taskId:           s.taskId,
        oerId:            s.oerId,
        oerType:          s.oerType,
        oerSource:        s.oerSource,
        rubricTemplateId: s.rubricTemplateId,
        annotations:      s.annotations,
        ratings:          s.ratings,
        splitRatio:       s.splitRatio,
        oerScrollY:       s.oerScrollY,
        lastSaved:        now,
        status:           s.status,
      });
      setLastSaved(now);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [taskId, annotations, ratings, splitRatio, status, setLastSaved]);
}
