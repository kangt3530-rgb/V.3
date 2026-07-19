import { describe, it, expect, beforeEach } from "vitest";
import { useOnboardingStore } from "../store/onboardingStore";
import { getUserId, onboardingKeys } from "../features/block-o/onboardingUtils";

const initial = useOnboardingStore.getState();

beforeEach(() => {
  useOnboardingStore.setState(initial, true);
});

describe("onboardingStore actions", () => {
  it("sets step, roles and primary role", () => {
    const s = useOnboardingStore.getState();
    s.setStep("profile");
    s.setRoles(["author", "reviewer"]);
    s.setPrimaryRole("reviewer");
    const next = useOnboardingStore.getState();
    expect(next.currentStep).toBe("profile");
    expect(next.roles).toEqual(["author", "reviewer"]);
    expect(next.primaryRole).toBe("reviewer");
  });

  it("merges partial profile updates", () => {
    useOnboardingStore.getState().setProfile({ displayName: "Ada" });
    useOnboardingStore.getState().setProfile({ institution: "CMU" });
    const { profile } = useOnboardingStore.getState();
    expect(profile.displayName).toBe("Ada");
    expect(profile.institution).toBe("CMU");
  });

  it("merges partial reviewer updates", () => {
    useOnboardingStore.getState().setReviewer({ type: "academic" });
    useOnboardingStore.getState().setReviewer({ expertiseTags: ["math", "cs"] });
    const { reviewer } = useOnboardingStore.getState();
    expect(reviewer.type).toBe("academic");
    expect(reviewer.expertiseTags).toEqual(["math", "cs"]);
  });
});

describe("draft persistence", () => {
  it("round-trips draft state through localStorage", () => {
    const s = useOnboardingStore.getState();
    s.setStep("reviewer-type");
    s.setRoles(["reviewer"]);
    s.setProfile({ displayName: "Grace", institution: "CMU", discipline: "CS", roleTitle: "Prof" });
    s.persistDraft();

    // simulate a fresh tab
    useOnboardingStore.setState(initial, true);
    expect(useOnboardingStore.getState().currentStep).toBe("welcome");

    useOnboardingStore.getState().loadDraft();
    const loaded = useOnboardingStore.getState();
    expect(loaded.currentStep).toBe("reviewer-type");
    expect(loaded.roles).toEqual(["reviewer"]);
    expect(loaded.profile.displayName).toBe("Grace");
  });

  it("loadDraft is a no-op when no draft exists", () => {
    useOnboardingStore.getState().loadDraft();
    expect(useOnboardingStore.getState().currentStep).toBe("welcome");
  });

  it("loadDraft ignores malformed JSON and keeps defaults", () => {
    const uid = getUserId();
    localStorage.setItem(onboardingKeys.draft(uid), "{not valid json");
    useOnboardingStore.getState().loadDraft();
    expect(useOnboardingStore.getState().currentStep).toBe("welcome");
    expect(useOnboardingStore.getState().roles).toEqual([]);
  });

  it("loadDraft backfills missing nested fields from defaults", () => {
    const uid = getUserId();
    localStorage.setItem(
      onboardingKeys.draft(uid),
      JSON.stringify({ currentStep: "profile", profile: { displayName: "Partial" } }),
    );
    useOnboardingStore.getState().loadDraft();
    const { profile, reviewer } = useOnboardingStore.getState();
    expect(profile.displayName).toBe("Partial");
    expect(profile.institution).toBe("");
    expect(reviewer.type).toBeNull();
  });
});

describe("reset", () => {
  it("returns all slices to defaults", () => {
    const s = useOnboardingStore.getState();
    s.setRoles(["author", "reviewer"]);
    s.setPrimaryRole("author");
    s.setReviewer({ type: "industry", licenseAccepted: true });
    s.reset();
    const r = useOnboardingStore.getState();
    expect(r.roles).toEqual([]);
    expect(r.primaryRole).toBeNull();
    expect(r.reviewer.type).toBeNull();
    expect(r.reviewer.licenseAccepted).toBe(false);
    expect(r.currentStep).toBe("welcome");
  });
});
