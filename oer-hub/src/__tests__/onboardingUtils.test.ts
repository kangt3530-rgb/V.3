import { describe, it, expect } from "vitest";
import {
  getVisibleSteps,
  getStepIndex,
  getNextStep,
  getPrevStep,
  getUserId,
  onboardingKeys,
  STEP_PATHS,
  type OnboardingRole,
} from "../features/block-o/onboardingUtils";

describe("getVisibleSteps", () => {
  it("author only: skips primary and all reviewer steps", () => {
    expect(getVisibleSteps(["author"])).toEqual([
      "welcome",
      "roles",
      "profile",
      "done",
    ]);
  });

  it("reviewer only: includes the four reviewer sub-steps, skips primary", () => {
    expect(getVisibleSteps(["reviewer"])).toEqual([
      "welcome",
      "roles",
      "profile",
      "reviewer-type",
      "reviewer-expertise",
      "reviewer-rubrics",
      "reviewer-license",
      "done",
    ]);
  });

  it("two roles: inserts primary after roles", () => {
    const steps = getVisibleSteps(["author", "reviewer"]);
    expect(steps).toEqual([
      "welcome",
      "roles",
      "primary",
      "profile",
      "reviewer-type",
      "reviewer-expertise",
      "reviewer-rubrics",
      "reviewer-license",
      "done",
    ]);
  });

  it("includes coordinator step when coordinator selected", () => {
    expect(getVisibleSteps(["author", "coordinator"])).toContain("coordinator");
  });

  it("empty roles: only universal steps, no primary", () => {
    expect(getVisibleSteps([])).toEqual(["welcome", "roles", "profile", "done"]);
  });

  it("always starts with welcome and ends with done", () => {
    for (const roles of [[], ["author"], ["reviewer"], ["author", "reviewer"]] as OnboardingRole[][]) {
      const steps = getVisibleSteps(roles);
      expect(steps[0]).toBe("welcome");
      expect(steps[steps.length - 1]).toBe("done");
    }
  });
});

describe("getStepIndex", () => {
  it("returns the 0-based index within visible steps", () => {
    expect(getStepIndex("welcome", ["author"])).toBe(0);
    expect(getStepIndex("profile", ["author"])).toBe(2);
  });

  it("returns -1 for a step not visible for the given roles", () => {
    expect(getStepIndex("reviewer-type", ["author"])).toBe(-1);
    expect(getStepIndex("primary", ["author"])).toBe(-1);
  });
});

describe("getNextStep", () => {
  it("advances to the next visible step", () => {
    expect(getNextStep("welcome", ["author"])).toBe("roles");
    expect(getNextStep("roles", ["author", "reviewer"])).toBe("primary");
  });

  it("skips reviewer steps for an author-only user", () => {
    expect(getNextStep("profile", ["author"])).toBe("done");
  });

  it("returns null on the last step", () => {
    expect(getNextStep("done", ["author"])).toBeNull();
  });

  it("returns null for an unknown step", () => {
    expect(getNextStep("nonexistent", ["author"])).toBeNull();
  });
});

describe("getPrevStep", () => {
  it("goes back to the previous visible step", () => {
    expect(getPrevStep("roles", ["author"])).toBe("welcome");
    expect(getPrevStep("primary", ["author", "reviewer"])).toBe("roles");
  });

  it("returns null on the first step", () => {
    expect(getPrevStep("welcome", ["author"])).toBeNull();
  });

  it("returns null for an unknown step", () => {
    expect(getPrevStep("nonexistent", ["author"])).toBeNull();
  });
});

describe("STEP_PATHS", () => {
  it("has a path for every step that can appear in the flow", () => {
    const allSteps = getVisibleSteps(["author", "reviewer", "coordinator"]);
    for (const step of allSteps) {
      expect(STEP_PATHS[step]).toMatch(/^\/onboarding\//);
    }
  });
});

describe("getUserId + onboardingKeys", () => {
  it("generates and persists a stable id across calls", () => {
    const first = getUserId();
    const second = getUserId();
    expect(first).toBe(second);
    expect(localStorage.getItem("oer-hub:user-id")).toBe(first);
  });

  it("namespaces keys by user id", () => {
    const uid = getUserId();
    expect(onboardingKeys.complete(uid)).toBe(`oer-hub:${uid}:onboarding:complete`);
    expect(onboardingKeys.draft(uid)).toBe(`oer-hub:${uid}:onboarding:draft`);
    expect(onboardingKeys.addingRole(uid)).toBe(`oer-hub:${uid}:adding-role`);
  });
});
