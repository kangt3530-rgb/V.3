/**
 * Onboarding API layer — Repository Pattern.
 * Mock implementations persist to localStorage.
 * Swap these bodies for real fetch calls when the backend exists;
 * keep the function signatures identical.
 */

import { getUserId, onboardingKeys } from "../features/block-o/onboardingUtils";
import type { OnboardingRole } from "../features/block-o/onboardingUtils";
import type { RubricTemplateId } from "./types";

const CURRENT_LICENSE_VERSION = "cc-by-nd-4.0";

// ─── Shared persistence helper ────────────────────────────────────────────────

function readState(): Record<string, unknown> {
  const uid = getUserId();
  const raw = localStorage.getItem(onboardingKeys.draft(uid));
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeState(patch: Record<string, unknown>): void {
  const uid = getUserId();
  const current = readState();
  localStorage.setItem(
    onboardingKeys.draft(uid),
    JSON.stringify({ ...current, ...patch }),
  );
}

// ─── API functions ────────────────────────────────────────────────────────────

export async function acknowledgeWelcome(): Promise<void> {
  writeState({ welcomeAcknowledgedAt: new Date().toISOString() });
}

export async function saveRoles(roles: OnboardingRole[]): Promise<void> {
  writeState({ roles });
}

export async function savePrimaryWorkspace(
  role: "author" | "reviewer",
): Promise<void> {
  writeState({ primaryRole: role });
}

export interface OnboardingProfileData {
  displayName: string;
  institution: string;
  discipline: string;
  roleTitle: string;
}

export async function saveProfile(data: OnboardingProfileData): Promise<void> {
  writeState({ profile: data });
}

export async function saveReviewerType(
  type: "academic" | "industry",
): Promise<void> {
  writeState({ reviewerType: type });
}

export async function saveReviewerExpertise(tags: string[]): Promise<void> {
  writeState({ reviewerExpertiseTags: tags });
}

export async function saveReviewerRubrics(
  rubrics: RubricTemplateId[],
): Promise<void> {
  writeState({ reviewerRubricSpecializations: rubrics });
}

export interface LicenseAcceptanceResult {
  acceptedAt: string;
  version: string;
}

export async function saveReviewerLicense(): Promise<LicenseAcceptanceResult> {
  const acceptedAt = new Date().toISOString();
  const version = CURRENT_LICENSE_VERSION;
  writeState({ licenseAcceptedAt: acceptedAt, licenseVersion: version });
  return { acceptedAt, version };
}

export interface CoordinatorInterestData {
  organization: string;
  painPoints: string;
  notifyEmail: string;
}

export async function saveCoordinatorInterest(
  data: CoordinatorInterestData,
): Promise<void> {
  writeState({
    coordinatorOrganization: data.organization,
    coordinatorPainPoints:   data.painPoints,
    coordinatorNotifyEmail:  data.notifyEmail,
    coordinatorSubmittedAt:  new Date().toISOString(),
  });
}

export async function completeOnboarding(): Promise<void> {
  const uid = getUserId();
  localStorage.setItem(onboardingKeys.complete(uid), "true");
}

export interface OnboardingDraftState {
  currentStep?: string;
  roles?: OnboardingRole[];
  primaryRole?: "author" | "reviewer" | null;
  profile?: OnboardingProfileData;
  reviewerType?: "academic" | "industry" | null;
  reviewerExpertiseTags?: string[];
  reviewerRubricSpecializations?: RubricTemplateId[];
  licenseAcceptedAt?: string | null;
  licenseVersion?: string | null;
}

export async function getOnboardingState(): Promise<OnboardingDraftState | null> {
  const uid = getUserId();
  const isComplete = localStorage.getItem(onboardingKeys.complete(uid));
  if (isComplete) return null; // onboarding already done
  const raw = localStorage.getItem(onboardingKeys.draft(uid));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingDraftState;
  } catch {
    return null;
  }
}

export function isOnboardingComplete(): boolean {
  const uid = getUserId();
  return localStorage.getItem(onboardingKeys.complete(uid)) === "true";
}

export function getAddingRole(): OnboardingRole | null {
  const uid = getUserId();
  const val = localStorage.getItem(onboardingKeys.addingRole(uid));
  if (val === "author" || val === "reviewer" || val === "coordinator") return val;
  return null;
}

export function setAddingRole(role: OnboardingRole | null): void {
  const uid = getUserId();
  if (role) {
    localStorage.setItem(onboardingKeys.addingRole(uid), role);
  } else {
    localStorage.removeItem(onboardingKeys.addingRole(uid));
  }
}
