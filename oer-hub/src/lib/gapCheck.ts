import type { IRubricCriterion, ICriterionRating, IAnnotation } from "../api/types";

export type GapRuleKey =
  | "EMPTY_COMMENT"
  | "SHORT_COMMENT"
  | "NO_ANNOTATIONS";

// 'ni_comment' | 'exceeds_comment' maps to the two separate text fields in ICriterionRating
export type GapFieldRef = "ni_comment" | "exceeds_comment" | "annotations";

export interface GapItem {
  id: string;
  criterionId: string;
  criterionName: string;
  ruleKey: GapRuleKey;
  label: string;
  fieldRef: GapFieldRef;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function defaultRating(): ICriterionRating {
  return {
    needsImprovementActive: false,
    exceedsActive: false,
    proficientConfirmed: false,
    needsImprovementText: "",
    exceedsText: "",
  };
}

/**
 * Pure, synchronous gap detection. Run before submission.
 * Checks A) missing comment, B) short comment (<30 words), C) no annotations.
 * Proficient-only criteria are skipped — they have no required text fields.
 */
export function detectGaps(
  criteria: IRubricCriterion[],
  ratings: Record<string, ICriterionRating>,
  annotations: IAnnotation[]
): GapItem[] {
  const items: GapItem[] = [];

  const annotationCounts: Record<string, number> = {};
  for (const a of annotations) {
    annotationCounts[a.criterionId] = (annotationCounts[a.criterionId] ?? 0) + 1;
  }

  for (const c of criteria) {
    const r = { ...defaultRating(), ...ratings[c.id] };
    const isNI = r.needsImprovementActive;
    const isExceeds = r.exceedsActive;

    if (!isNI && !isExceeds) continue;

    const annotCount = annotationCounts[c.id] ?? 0;

    // A + B: NI comment
    if (isNI) {
      const text = r.needsImprovementText ?? "";
      if (!text.trim()) {
        items.push({
          id: `${c.id}-NI-EMPTY_COMMENT`,
          criterionId: c.id,
          criterionName: c.title,
          ruleKey: "EMPTY_COMMENT",
          label: `${c.title}: feedback comment is missing (Needs Improvement).`,
          fieldRef: "ni_comment",
        });
      } else if (wordCount(text) < 30) {
        items.push({
          id: `${c.id}-NI-SHORT_COMMENT`,
          criterionId: c.id,
          criterionName: c.title,
          ruleKey: "SHORT_COMMENT",
          label: `${c.title}: comment is too short — fewer than 30 words (Needs Improvement).`,
          fieldRef: "ni_comment",
        });
      }
    }

    // A + B: Exceeds comment
    if (isExceeds) {
      const text = r.exceedsText ?? "";
      if (!text.trim()) {
        items.push({
          id: `${c.id}-EX-EMPTY_COMMENT`,
          criterionId: c.id,
          criterionName: c.title,
          ruleKey: "EMPTY_COMMENT",
          label: `${c.title}: feedback comment is missing (Exceeds).`,
          fieldRef: "exceeds_comment",
        });
      } else if (wordCount(text) < 30) {
        items.push({
          id: `${c.id}-EX-SHORT_COMMENT`,
          criterionId: c.id,
          criterionName: c.title,
          ruleKey: "SHORT_COMMENT",
          label: `${c.title}: comment is too short — fewer than 30 words (Exceeds).`,
          fieldRef: "exceeds_comment",
        });
      }
    }

    // C: No annotations — once per criterion
    if (annotCount === 0) {
      items.push({
        id: `${c.id}-NO_ANNOTATIONS`,
        criterionId: c.id,
        criterionName: c.title,
        ruleKey: "NO_ANNOTATIONS",
        label: `${c.title}: no annotations support this rating.`,
        fieldRef: "annotations",
      });
    }
  }

  return items;
}
