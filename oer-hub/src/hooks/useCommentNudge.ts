import { useEffect, useRef, useState } from "react";
import {
  callR3ToneCheck,
  callR16SubstanceCheck,
  countWords,
  hasCriterionReference,
} from "../api/ai";
import type { R3ToneResult, R16SubstanceResult } from "../api/ai";
import { useReviewStore } from "../store/reviewStore";
import { useNudgeEnabled } from "../store/aiPrefsStore";

const MIN_WORDS_TONE      = 1;
const MIN_WORDS_SUBSTANCE = 30;
const MIN_WORDS_GENERIC   = 5;
const MIN_WORDS_SHORT     = 20;
const DEBOUNCE_MS         = 2000;

export type NudgeIssueType =
  | "harsh_tone"
  | "lacks_evidence"
  | "short_comment"
  | "generic_comment";

export interface NudgeIssue {
  type: NudgeIssueType;
  label: string;
  description: string | null;
}

export interface CommentNudgeResult {
  issues: NudgeIssue[];
  r3: R3ToneResult | null;
  r16: R16SubstanceResult | null;
  loading: boolean;
  pending: boolean;
  allClear: boolean;
  dismiss: () => void;
  openInChat: () => void;
}

export function useCommentNudge(
  criterionId: string,
  criterionTitle: string,
  criterionStandard: string,
  comment: string,
  fieldType: "ni" | "exceeds",
  annotationCount: number,
  fieldActive: boolean
): CommentNudgeResult {
  const rubricType             = useReviewStore((s) => s.rubricTemplateId);
  const showCommentNudgeInChat = useReviewStore((s) => s.showCommentNudgeInChat);
  const toneEnabled            = useNudgeEnabled(rubricType, "tone_check");
  const substanceEnabled       = useNudgeEnabled(rubricType, "substance_check");

  const [r3,  setR3]  = useState<R3ToneResult | null>(null);
  const [r16, setR16] = useState<R16SubstanceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const dismissedTextRef = useRef<string>("");
  const abortRef         = useRef(false);
  const checkedForRef    = useRef<string>("");

  const bothOff = !toneEnabled && !substanceEnabled;

  useEffect(() => {
    if (!fieldActive || bothOff) return;

    if (dismissedTextRef.current && dismissedTextRef.current !== comment) {
      dismissedTextRef.current = "";
    }
    if (dismissedTextRef.current === comment && comment.length > 0) return;

    if (checkedForRef.current !== comment) checkedForRef.current = "";

    const wc = countWords(comment);
    const runR3  = toneEnabled      && wc >= MIN_WORDS_TONE;
    const runR16 = substanceEnabled && wc >= MIN_WORDS_SUBSTANCE;
    if (!runR3 && !runR16) { setR3(null); setR16(null); return; }

    abortRef.current = false;
    const timer = setTimeout(async () => {
      if (abortRef.current) return;
      setLoading(true);

      const [r3Res, r16Res] = await Promise.all([
        runR3  ? callR3ToneCheck(comment, criterionTitle, criterionStandard)                        : Promise.resolve(null),
        runR16 ? callR16SubstanceCheck(comment, criterionTitle, criterionStandard, annotationCount) : Promise.resolve(null),
      ]);

      if (!abortRef.current) {
        setR3(r3Res);
        setR16(r16Res);
        setLoading(false);
        checkedForRef.current = comment;
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current = true;
      setLoading(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment, annotationCount, toneEnabled, substanceEnabled, bothOff, fieldActive]);

  const wc               = countWords(comment);
  const alreadyDismissed = dismissedTextRef.current === comment && comment.length > 0;
  const alreadyChecked   = checkedForRef.current === comment;

  const activeR3  = r3?.hasToneIssue       ? r3  : null;
  const activeR16 = r16?.hasSubstanceIssue ? r16 : null;

  // Rule-based issues — immediate, no debounce
  const ruleIssues: NudgeIssue[] = [];
  if (!alreadyDismissed && wc > 0) {
    if (wc < MIN_WORDS_SHORT) {
      ruleIssues.push({ type: "short_comment", label: "Short comment", description: null });
    }
    if (wc >= MIN_WORDS_GENERIC && !hasCriterionReference(comment, criterionId, criterionTitle)) {
      ruleIssues.push({ type: "generic_comment", label: "Generic comment", description: null });
    }
  }

  // AI-based issues — appear after debounce + API call
  const aiIssues: NudgeIssue[] = [];
  if (!alreadyDismissed) {
    if (activeR3)  aiIssues.push({ type: "harsh_tone",    label: "Harsh tone",       description: activeR3.diagnosis  ?? null });
    if (activeR16) aiIssues.push({ type: "lacks_evidence", label: "Lacks references", description: activeR16.diagnosis ?? null });
  }

  const issues = [...ruleIssues, ...aiIssues];

  const wouldRunR3  = !bothOff && toneEnabled      && wc >= MIN_WORDS_TONE;
  const wouldRunR16 = !bothOff && substanceEnabled && wc >= MIN_WORDS_SUBSTANCE;
  const wouldRunAI  = fieldActive && (wouldRunR3 || wouldRunR16);
  const pending     = wouldRunAI && !alreadyDismissed && !loading && !alreadyChecked;

  // Show all-clear only after AI has actually run and confirmed no issues
  const allClear = (
    fieldActive &&
    wc > 0 &&
    !alreadyDismissed &&
    !loading &&
    !pending &&
    alreadyChecked &&
    issues.length === 0
  );

  function dismiss() {
    dismissedTextRef.current = comment;
    checkedForRef.current    = comment;
    setR3(null);
    setR16(null);
  }

  function openInChat() {
    showCommentNudgeInChat({
      key: `${criterionId}-${fieldType}`,
      criterionId,
      fieldType,
      criterionTitle,
      r3: activeR3,
      r16: activeR16,
    });
  }

  return { issues, r3: activeR3, r16: activeR16, loading, pending, allClear, dismiss, openInChat };
}
