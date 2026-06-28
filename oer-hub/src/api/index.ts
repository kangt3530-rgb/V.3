/**
 * API layer — Repository Pattern.
 * All components call functions here; never import from mock/ directly.
 * To switch to a real backend: replace implementations below, keep signatures.
 */

import type { IOer, IRubricTemplate, RubricTemplateId } from "./types";
import { MOCK_AVAILABLE_OERS } from "./mock/oers";
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

// ── Rubric endpoints ──────────────────────────────────────────────────────────

export async function getRubricTemplate(
  id: RubricTemplateId
): Promise<IRubricTemplate> {
  const module = await import(`../data/rubrics/${id}.json`);
  return module.default as IRubricTemplate;
}
