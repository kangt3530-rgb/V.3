import type { RubricTemplateId } from "../api/types";

import accessibilityMd from "./rubric-md/accessibility.md?raw";
import copyEditingMd   from "./rubric-md/copy-editing.md?raw";
import copyrightMd     from "./rubric-md/copyright.md?raw";
import disciplinaryMd  from "./rubric-md/disciplinary.md?raw";
import elearningMd     from "./rubric-md/elearning.md?raw";
import udlMd           from "./rubric-md/udl.md?raw";

const RAW: Record<RubricTemplateId, string> = {
  accessibility:  accessibilityMd,
  "copy-editing": copyEditingMd,
  copyright:      copyrightMd,
  disciplinary:   disciplinaryMd,
  elearning:      elearningMd,
  udl:            udlMd,
};

function parseGlossaryTerms(md: string): Set<string> {
  const start = md.indexOf("**Glossary of Terms**");
  if (start === -1) return new Set();
  const section = md.slice(start);
  const refIdx  = section.indexOf("**References");
  const glossary = refIdx !== -1 ? section.slice(0, refIdx) : section;

  const terms = new Set<string>();
  const termRegex = /\*\*([^*:]+?)\*\*:/g;
  let match;
  while ((match = termRegex.exec(glossary)) !== null) {
    const term = match[1].trim().toLowerCase();
    if (term && term !== "glossary of terms") terms.add(term);
  }
  return terms;
}

const termCache = new Map<RubricTemplateId, Set<string>>();

/** Set of lowercase glossary term names for the given rubric. */
export function getRubricTermSet(id: RubricTemplateId): Set<string> {
  let s = termCache.get(id);
  if (!s) {
    s = parseGlossaryTerms(RAW[id] ?? "");
    termCache.set(id, s);
  }
  return s;
}

/** Full raw markdown text for the given rubric — used as system prompt context. */
export function getRubricFullText(id: RubricTemplateId): string {
  return RAW[id] ?? "";
}
