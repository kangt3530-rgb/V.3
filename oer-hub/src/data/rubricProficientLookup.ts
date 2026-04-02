import type { RubricTemplateId } from "../api/types";
import { criterionIdToIndex, extractProficientTextsFromRubricMd } from "./parseRubricMarkdown";

import accessibilityMd from "./rubric-md/accessibility.md?raw";
import copyEditingMd from "./rubric-md/copy-editing.md?raw";
import copyrightMd from "./rubric-md/copyright.md?raw";
import disciplinaryMd from "./rubric-md/disciplinary.md?raw";
import elearningMd from "./rubric-md/elearning.md?raw";
import udlMd from "./rubric-md/udl.md?raw";

const RAW: Record<RubricTemplateId, string> = {
  accessibility: accessibilityMd,
  "copy-editing": copyEditingMd,
  copyright: copyrightMd,
  disciplinary: disciplinaryMd,
  elearning: elearningMd,
  udl: udlMd,
};

const cache = new Map<RubricTemplateId, Map<number, string>>();

function mapFor(rubricId: RubricTemplateId): Map<number, string> {
  let m = cache.get(rubricId);
  if (!m) {
    m = extractProficientTextsFromRubricMd(RAW[rubricId] ?? "");
    cache.set(rubricId, m);
  }
  return m;
}

/** Full academic "Proficient" column text from the source rubric markdown, if present. */
export function getProficientRubricMarkdownText(
  rubricId: RubricTemplateId,
  criterionId: string
): string | undefined {
  const idx = criterionIdToIndex(criterionId);
  if (idx <= 0) return undefined;
  const text = mapFor(rubricId).get(idx);
  return text && text.length > 0 ? text : undefined;
}
