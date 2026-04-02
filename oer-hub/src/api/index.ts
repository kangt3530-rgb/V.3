/**
 * API layer — Repository Pattern.
 * All components call functions here; never import from mock/ directly.
 * To switch to a real backend: replace implementations below, keep signatures.
 */

import type { IOer, ITask, IReviewSession, RubricTemplateId, IRubricTemplate } from "./types";
import { MOCK_OERS, MOCK_AVAILABLE_OERS } from "./mock/oers";
import { MOCK_ACTIVE_TASKS, MOCK_POOL_TASKS, DEMO_TASK } from "./mock/tasks";

const SESSION_KEY = (taskId: string) => `oer-hub:session:${taskId}`;
const PREAMBLE_KEY = (rubricId: string) => `oer-hub:preamble-seen:${rubricId}`;

// ── OER endpoints ─────────────────────────────────────────────────────────────

export async function getAuthorOers(): Promise<IOer[]> {
  return Promise.resolve([...MOCK_OERS]);
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
  // For demo purposes, always return DEMO_TASK for any taskId
  return Promise.resolve(all.find((t) => t.id === taskId) ?? DEMO_TASK);
}

// ── Rubric endpoints ──────────────────────────────────────────────────────────

export async function getRubricTemplate(
  id: RubricTemplateId
): Promise<IRubricTemplate> {
  const module = await import(`../data/rubrics/${id}.json`);
  return module.default as IRubricTemplate;
}

// ── Session (draft) persistence ───────────────────────────────────────────────

export function loadSession(taskId: string): IReviewSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY(taskId));
    if (!raw) return null;
    return JSON.parse(raw) as IReviewSession;
  } catch {
    return null;
  }
}

export function saveSession(session: IReviewSession): void {
  localStorage.setItem(SESSION_KEY(session.taskId), JSON.stringify(session));
}

export function clearSession(taskId: string): void {
  localStorage.removeItem(SESSION_KEY(taskId));
}

// ── Preamble seen tracking ────────────────────────────────────────────────────

export function hasPreambleBeenSeen(rubricId: RubricTemplateId): boolean {
  return localStorage.getItem(PREAMBLE_KEY(rubricId)) === "true";
}

export function markPreambleSeen(rubricId: RubricTemplateId): void {
  localStorage.setItem(PREAMBLE_KEY(rubricId), "true");
}
