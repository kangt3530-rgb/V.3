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
  getAggregatedReport,
  getMediationQueue,
  getMediationItem,
  updateMediationItem,
  releaseMediationToAuthor,
  submitReviewToMediation,
  getRevisionCycleState,
  upsertRevisionCycleState,
  setRevisionCardProgress,
  getStampById,
  getStampForOer,
  approveAuthorRevisions,
  getOerStatusOverrides,
  setOerStatusOverride,
  ensureRevisionCardsInitialized,
  submitAuthorRevisionPackage,
  getOersPendingVerification,
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
