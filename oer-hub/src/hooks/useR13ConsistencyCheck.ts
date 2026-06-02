import { computeR13Signals, type R13Finding } from "../api/ai";
import type { IAnnotation, ICriterionRating, IRubricTemplate } from "../api/types";

export function computeR13Findings(
  template: IRubricTemplate,
  ratings: Record<string, ICriterionRating>,
  annotations: IAnnotation[]
): R13Finding[] {
  const criteria = template.criteria.map((c) => {
    const r: ICriterionRating = ratings[c.id] ?? {
      needsImprovementActive: false,
      exceedsActive: false,
      proficientConfirmed: false,
      needsImprovementText: "",
      exceedsText: "",
    };
    return {
      criterionId: c.id,
      criterionTitle: c.title,
      exceedsText: r.exceedsText,
      doesNotMeetText: r.needsImprovementText,
      annotationComments: annotations
        .filter((a) => (a.criterionIds ?? []).includes(c.id))
        .map((a) => a.comment),
      exceedsActive: r.exceedsActive,
      doesNotMeetActive: r.needsImprovementActive,
    };
  });

  return computeR13Signals({ templateId: template.id, criteria });
}
