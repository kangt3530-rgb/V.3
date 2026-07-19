/**
 * Utilities shared across the onboarding flow.
 * getUserId() is the single source of the stable per-browser identity used to
 * namespace all onboarding localStorage keys. When real auth lands, replace
 * this function body with a call that returns the server-issued user ID —
 * all key lookups update automatically.
 */

const USER_ID_KEY = "oer-hub:user-id";

export function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

/** Namespaced localStorage keys for onboarding state. */
export const onboardingKeys = {
  complete:   (uid: string) => `oer-hub:${uid}:onboarding:complete`,
  draft:      (uid: string) => `oer-hub:${uid}:onboarding:draft`,
  addingRole: (uid: string) => `oer-hub:${uid}:adding-role`,
} as const;

export type OnboardingRole = "author" | "reviewer" | "coordinator";

/**
 * Compute the ordered list of step IDs that are visible given the user's
 * selected roles. The progress bar percentage is calculated against this
 * list, not the full maximum step set.
 */
export function getVisibleSteps(roles: OnboardingRole[]): string[] {
  const steps: string[] = ["welcome", "roles"];
  if (roles.length >= 2) steps.push("primary");
  steps.push("profile");
  if (roles.includes("reviewer")) {
    steps.push(
      "reviewer-type",
      "reviewer-expertise",
      "reviewer-rubrics",
      "reviewer-license",
    );
  }
  if (roles.includes("coordinator")) steps.push("coordinator");
  steps.push("done");
  return steps;
}

/**
 * Returns the 0-based index of `step` in the visible steps for the given roles,
 * or -1 if not found.
 */
export function getStepIndex(step: string, roles: OnboardingRole[]): number {
  return getVisibleSteps(roles).indexOf(step);
}

/**
 * Returns the next step ID after `currentStep`, or null if already on the
 * last step.
 */
export function getNextStep(
  currentStep: string,
  roles: OnboardingRole[],
): string | null {
  const steps = getVisibleSteps(roles);
  const idx = steps.indexOf(currentStep);
  if (idx === -1 || idx === steps.length - 1) return null;
  return steps[idx + 1];
}

/**
 * Returns the previous step ID before `currentStep`, or null if on the
 * first step.
 */
export function getPrevStep(
  currentStep: string,
  roles: OnboardingRole[],
): string | null {
  const steps = getVisibleSteps(roles);
  const idx = steps.indexOf(currentStep);
  if (idx <= 0) return null;
  return steps[idx - 1];
}

/** Maps step ID to its /onboarding/* path segment. */
export const STEP_PATHS: Record<string, string> = {
  welcome:              "/onboarding/welcome",
  roles:                "/onboarding/roles",
  primary:              "/onboarding/primary",
  profile:              "/onboarding/profile",
  "reviewer-type":      "/onboarding/reviewer/type",
  "reviewer-expertise": "/onboarding/reviewer/expertise",
  "reviewer-rubrics":   "/onboarding/reviewer/rubrics",
  "reviewer-license":   "/onboarding/reviewer/license",
  coordinator:          "/onboarding/coordinator",
  done:                 "/onboarding/done",
};
