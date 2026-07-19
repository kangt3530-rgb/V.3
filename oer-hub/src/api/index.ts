/**
 * API layer — Repository Pattern.
 * All components call functions here; never import from mock/ directly.
 * To switch to a real backend: replace implementations below, keep signatures.
 */

import type { IOer, ITask, IRubricTemplate, RubricTemplateId } from "./types";
import { MOCK_AVAILABLE_OERS } from "./mock/oers";
import { MOCK_ACTIVE_TASKS, MOCK_POOL_TASKS, DEMO_TASK } from "./mock/tasks";
import { getMergedOers } from "./blockC";

export {
  loadSession,
  saveSession,
  clearSession,
  hasPreambleBeenSeen,
  markPreambleSeen,
} from "./sessionStorage";

export {
  getMergedOers,
  getOerById,
  getTasksForOer,
  getPerRubricReport,
  getMediationQueue,
  getMediationItem,
  updateMediationItem,
  releaseMediationToAuthor,
  submitReviewToMediation,
  getStampById,
  getStampForOer,
  approveAuthorRevisions,
  getOerStatusOverrides,
  setOerStatusOverride,
  getOersPendingVerification,
  getCriterionResponses,
  upsertCriterionResponse,
  getItemResponses,
  upsertItemResponse,
  submitRevisionPackage,
} from "./blockC";

// ── OER endpoints ─────────────────────────────────────────────────────────────

export async function getAuthorOers(): Promise<IOer[]> {
  return Promise.resolve(getMergedOers());
}

export async function getAvailableOers(): Promise<IOer[]> {
  return Promise.resolve([...MOCK_AVAILABLE_OERS]);
}

// ── Task endpoints ────────────────────────────────────────────────────────────

export async function getActiveTasks(): Promise<ITask[]> {
  return Promise.resolve([...MOCK_ACTIVE_TASKS]);
}

export async function getPoolTasks(): Promise<ITask[]> {
  return Promise.resolve([...MOCK_POOL_TASKS]);
}

export interface MatchedPoolTasksFilters {
  discipline: string;
  expertiseTags: string[];
  rubricSpecializations: RubricTemplateId[];
}

export interface MatchedPoolTasksResult {
  tasks: ITask[];
  totalMatched: number;
}

/**
 * Returns pool tasks filtered by the reviewer's rubric specializations and
 * expertise tags/discipline.
 * In mock mode: filters MOCK_POOL_TASKS by rubricTemplateId membership.
 * If rubricSpecializations is empty, returns all tasks (no filter applied).
 */
export async function getMatchedPoolTasks(
  filters: MatchedPoolTasksFilters,
): Promise<MatchedPoolTasksResult> {
  const { rubricSpecializations, expertiseTags, discipline } = filters;

  let tasks = [...MOCK_POOL_TASKS];

  // Filter by rubric specialization if the reviewer has declared any
  if (rubricSpecializations.length > 0) {
    tasks = tasks.filter((t) =>
      rubricSpecializations.includes(t.rubricTemplateId),
    );
  }

  // Soft-filter by expertise tags + discipline: prefer tasks whose OER subject
  // matches, but include all rubric-matched tasks when no tags are set.
  if (expertiseTags.length > 0 || discipline) {
    const keywords = [
      ...expertiseTags.map((t) => t.toLowerCase()),
      discipline.toLowerCase(),
    ].filter(Boolean);

    // Score each task: 1 point per keyword match in OER subject, author, title
    const scored = tasks.map((t) => {
      const haystack =
        `${t.oer.subject} ${t.oer.title} ${t.oer.author}`.toLowerCase();
      const score = keywords.filter((kw) => haystack.includes(kw)).length;
      return { task: t, score };
    });

    // Include all tasks that passed rubric filter; sort keyword-matched first
    tasks = scored
      .sort((a, b) => b.score - a.score)
      .map(({ task }) => task);
  }

  return Promise.resolve({ tasks, totalMatched: tasks.length });
}

export async function getTask(taskId: string): Promise<ITask | null> {
  const all = [...MOCK_ACTIVE_TASKS, ...MOCK_POOL_TASKS];
  return Promise.resolve(all.find((t) => t.id === taskId) ?? DEMO_TASK);
}

// ── Rubric endpoints ──────────────────────────────────────────────────────────

export async function getRubricTemplate(
  id: RubricTemplateId
): Promise<IRubricTemplate> {
  const module = await import(`../data/rubrics/${id}.json`);
  return module.default as IRubricTemplate;
}
