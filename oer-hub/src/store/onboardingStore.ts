import { create } from "zustand";
import type { RubricTemplateId } from "../api/types";
import { getUserId, onboardingKeys } from "../features/block-o/onboardingUtils";
import type { OnboardingRole } from "../features/block-o/onboardingUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReviewerType = "academic" | "industry";

interface ProfileData {
  displayName: string;
  institution: string;
  discipline: string;
  roleTitle: string;
}

interface ReviewerData {
  type: ReviewerType | null;
  expertiseTags: string[];
  rubricSpecializations: RubricTemplateId[];
  licenseAccepted: boolean;
  licenseAcceptedAt: string | null;
  licenseVersion: string | null;
}

interface CoordinatorData {
  organization: string;
  painPoints: string;
  notifyEmail: string;
  submittedAt: string | null;
}

interface OnboardingState {
  currentStep: string;
  roles: OnboardingRole[];
  primaryRole: "author" | "reviewer" | null;
  profile: ProfileData;
  reviewer: ReviewerData;
  coordinator: CoordinatorData;

  // Actions
  setStep: (step: string) => void;
  setRoles: (roles: OnboardingRole[]) => void;
  setPrimaryRole: (role: "author" | "reviewer" | null) => void;
  setProfile: (data: Partial<ProfileData>) => void;
  setReviewer: (data: Partial<ReviewerData>) => void;
  setCoordinator: (data: Partial<CoordinatorData>) => void;
  /** Persist current draft state to localStorage. */
  persistDraft: () => void;
  /** Load draft state from localStorage, if present. */
  loadDraft: () => void;
  reset: () => void;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const defaultProfile: ProfileData = {
  displayName: "",
  institution: "",
  discipline: "",
  roleTitle: "",
};

const defaultReviewer: ReviewerData = {
  type: null,
  expertiseTags: [],
  rubricSpecializations: [],
  licenseAccepted: false,
  licenseAcceptedAt: null,
  licenseVersion: null,
};

const defaultCoordinator: CoordinatorData = {
  organization: "",
  painPoints: "",
  notifyEmail: "",
  submittedAt: null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: "welcome",
  roles: [],
  primaryRole: null,
  profile: { ...defaultProfile },
  reviewer: { ...defaultReviewer },
  coordinator: { ...defaultCoordinator },

  setStep: (step) => set({ currentStep: step }),

  setRoles: (roles) => set({ roles }),

  setPrimaryRole: (role) => set({ primaryRole: role }),

  setProfile: (data) =>
    set((s) => ({ profile: { ...s.profile, ...data } })),

  setReviewer: (data) =>
    set((s) => ({ reviewer: { ...s.reviewer, ...data } })),

  setCoordinator: (data) =>
    set((s) => ({ coordinator: { ...s.coordinator, ...data } })),

  persistDraft: () => {
    const uid = getUserId();
    const { currentStep, roles, primaryRole, profile, reviewer, coordinator } =
      get();
    const draft = {
      currentStep,
      roles,
      primaryRole,
      profile,
      reviewer,
      coordinator,
    };
    localStorage.setItem(
      onboardingKeys.draft(uid),
      JSON.stringify(draft),
    );
  },

  loadDraft: () => {
    const uid = getUserId();
    const raw = localStorage.getItem(onboardingKeys.draft(uid));
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as Partial<OnboardingState>;
      set({
        currentStep: draft.currentStep ?? "welcome",
        roles:       draft.roles      ?? [],
        primaryRole: draft.primaryRole ?? null,
        profile:     draft.profile    ? { ...defaultProfile, ...draft.profile } : { ...defaultProfile },
        reviewer:    draft.reviewer   ? { ...defaultReviewer, ...draft.reviewer } : { ...defaultReviewer },
        coordinator: draft.coordinator ? { ...defaultCoordinator, ...draft.coordinator } : { ...defaultCoordinator },
      });
    } catch {
      // Malformed draft — ignore and start fresh
    }
  },

  reset: () => {
    set({
      currentStep: "welcome",
      roles: [],
      primaryRole: null,
      profile: { ...defaultProfile },
      reviewer: { ...defaultReviewer },
      coordinator: { ...defaultCoordinator },
    });
  },
}));
