import { describe, it, expect } from "vitest";
import {
  saveRoles,
  savePrimaryWorkspace,
  saveProfile,
  saveReviewerType,
  saveReviewerExpertise,
  saveReviewerLicense,
  saveCoordinatorInterest,
  completeOnboarding,
  getOnboardingState,
  isOnboardingComplete,
  getAddingRole,
  setAddingRole,
} from "../api/onboarding";
import { getUserId, onboardingKeys } from "../features/block-o/onboardingUtils";

function rawDraft() {
  const uid = getUserId();
  return JSON.parse(localStorage.getItem(onboardingKeys.draft(uid)) ?? "{}");
}

describe("save functions persist to the draft", () => {
  it("accumulates fields across multiple saves", async () => {
    await saveRoles(["author", "reviewer"]);
    await savePrimaryWorkspace("reviewer");
    await saveProfile({
      displayName: "Ada",
      institution: "CMU",
      discipline: "CS",
      roleTitle: "Prof",
    });
    await saveReviewerType("academic");
    await saveReviewerExpertise(["math", "cs"]);

    const d = rawDraft();
    expect(d.roles).toEqual(["author", "reviewer"]);
    expect(d.primaryRole).toBe("reviewer");
    expect(d.profile.displayName).toBe("Ada");
    expect(d.reviewerType).toBe("academic");
    expect(d.reviewerExpertiseTags).toEqual(["math", "cs"]);
  });
});

describe("saveReviewerLicense", () => {
  it("stamps an ISO timestamp and the current license version", async () => {
    const result = await saveReviewerLicense();
    expect(result.version).toBe("cc-by-nd-4.0");
    expect(() => new Date(result.acceptedAt).toISOString()).not.toThrow();
    expect(new Date(result.acceptedAt).toISOString()).toBe(result.acceptedAt);

    const d = rawDraft();
    expect(d.licenseAcceptedAt).toBe(result.acceptedAt);
    expect(d.licenseVersion).toBe("cc-by-nd-4.0");
  });
});

describe("saveCoordinatorInterest", () => {
  it("writes coordinator fields and a submission timestamp", async () => {
    await saveCoordinatorInterest({
      organization: "OpenOrg",
      painPoints: "discovery",
      notifyEmail: "a@b.co",
    });
    const d = rawDraft();
    expect(d.coordinatorOrganization).toBe("OpenOrg");
    expect(d.coordinatorPainPoints).toBe("discovery");
    expect(d.coordinatorNotifyEmail).toBe("a@b.co");
    expect(typeof d.coordinatorSubmittedAt).toBe("string");
  });
});

describe("completion state", () => {
  it("isOnboardingComplete is false until completeOnboarding is called", async () => {
    expect(isOnboardingComplete()).toBe(false);
    await completeOnboarding();
    expect(isOnboardingComplete()).toBe(true);
  });

  it("getOnboardingState returns null once onboarding is complete", async () => {
    await saveRoles(["author"]);
    expect(await getOnboardingState()).not.toBeNull();
    await completeOnboarding();
    expect(await getOnboardingState()).toBeNull();
  });

  it("getOnboardingState returns null when no draft exists", async () => {
    expect(await getOnboardingState()).toBeNull();
  });
});

describe("adding-role flag (re-onboarding)", () => {
  it("sets, reads and clears the adding-role flag", () => {
    expect(getAddingRole()).toBeNull();
    setAddingRole("reviewer");
    expect(getAddingRole()).toBe("reviewer");
    setAddingRole(null);
    expect(getAddingRole()).toBeNull();
  });
});
