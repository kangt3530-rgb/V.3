import accessibilityRaw from './accessibility.md?raw';
import copyEditingRaw from './copy-editing.md?raw';
import copyrightRaw from './copyright.md?raw';
import disciplinaryRaw from './disciplinary.md?raw';
import eLearningRaw from './elearning.md?raw';
import udlRaw from './udl.md?raw';
import type { RubricTemplateId } from '../../api/types';

export interface CriterionDefinition {
  id: string;
  title: string;
  standards: string[];
}

export interface RubricDefinition {
  id: RubricTemplateId;
  name: string;
  introduction: string;
  criteria: Record<string, CriterionDefinition>;
}

const RUBRIC_NAMES: Record<RubricTemplateId, string> = {
  accessibility: 'Accessibility',
  'copy-editing': 'Copy Editing',
  copyright: 'Copyright',
  disciplinary: 'Disciplinary Appropriateness',
  elearning: 'eLearning',
  udl: 'Universal Design for Learning',
};

function parseRubricFile(raw: string, id: RubricTemplateId): RubricDefinition {
  const lines = raw.split('\n');

  const tableHeaderIdx = lines.findIndex((l) => l.includes('Exceeds Established Standards'));
  const introduction =
    tableHeaderIdx > 0 ? lines.slice(0, tableHeaderIdx - 1).join('\n').trim() : '';

  const criteria: Record<string, CriterionDefinition> = {};
  for (const line of lines.slice(tableHeaderIdx > 0 ? tableHeaderIdx : 0)) {
    if (!line.includes('**Criteria')) continue;
    const cells = line.split('|').map((c) => c.trim());
    // cells[1] = criterion header, cells[3] = Exemplifies text
    const headerMatch = cells[1]?.match(/\*\*Criteria\s+(\d+):\s+(.+?)\*\*/);
    if (!headerMatch) continue;
    const criterionId = `C${headerMatch[1]}`;
    const title = headerMatch[2].trim();
    const exemplifies = cells[3] ?? '';
    const standards = exemplifies
      .split(/\.(?:\s+|\s*$)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => (s.endsWith('.') ? s : `${s}.`));
    criteria[criterionId] = { id: criterionId, title, standards };
  }

  return { id, name: RUBRIC_NAMES[id], introduction, criteria };
}

const RUBRIC_MAP: Record<RubricTemplateId, string> = {
  accessibility: accessibilityRaw,
  'copy-editing': copyEditingRaw,
  copyright: copyrightRaw,
  disciplinary: disciplinaryRaw,
  elearning: eLearningRaw,
  udl: udlRaw,
};

const _cache: Partial<Record<RubricTemplateId, RubricDefinition>> = {};

function getRubric(id: RubricTemplateId): RubricDefinition {
  if (!_cache[id]) _cache[id] = parseRubricFile(RUBRIC_MAP[id], id);
  return _cache[id]!;
}

export function getRubricDefinition(rubricId: RubricTemplateId): RubricDefinition | null {
  try {
    return getRubric(rubricId);
  } catch {
    return null;
  }
}

export function getCriterionDefinition(
  rubricId: RubricTemplateId,
  criterionId: string
): CriterionDefinition | null {
  const rubric = getRubricDefinition(rubricId);
  if (!rubric) return null;
  const normalized = criterionId.toUpperCase().replace(/^[A-Z](\d+)$/, 'C$1');
  return rubric.criteria[normalized] ?? null;
}
