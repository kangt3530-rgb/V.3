import { create } from "zustand";
import type { UserRole } from "../api/types";
import type { RubricTemplateId } from "../api/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingRole = "author" | "reviewer" | "coordinator";

export interface ReviewerProfile {
  type: "academic" | "industry" | null;
  expertiseTags: string[];
  rubricSpecializations: RubricTemplateId[];
  licenseAcceptedAt: string | null;
  licenseVersion: string | null;
}

interface SessionState {
  // ── Active workspace role (unchanged — drives TopNav routing) ──────────────
  role: UserRole;

  // ── Identity ───────────────────────────────────────────────────────────────
  userId: string;
  displayName: string;

  // ── Profile (populated after onboarding) ──────────────────────────────────
  institution: string;
  discipline: string;
  roleTitle: string;

  // ── Multi-role membership ─────────────────────────────────────────────────
  /** All roles this user holds. Distinct from `role` (active workspace). */
  roles: OnboardingRole[];
  primaryRole: "author" | "reviewer" | null;

  // ── Onboarding completion flags ────────────────────────────────────────────
  authorOnboarded: boolean;
  reviewerOnboarded: boolean;
  coordinatorInterestLogged: boolean;

  // ── Reviewer-specific profile ─────────────────────────────────────────────
  reviewer: ReviewerProfile;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Switch the active workspace role. Preserves multi-role membership. */
  setRole: (role: UserRole) => void;

  /** Called once at the end of the onboarding flow to hydrate full profile. */
  completeOnboarding: (data: {
    roles: OnboardingRole[];
    primaryRole: "author" | "reviewer";
    displayName: string;
    institution: string;
    discipline: string;
    roleTitle: string;
    reviewer?: Partial<ReviewerProfile>;
  }) => void;

  /** Called from ProfileSettingsPage when adding a single role post-onboarding. */
  addRole: (role: OnboardingRole) => void;

  /** Update reviewer profile fields (e.g. after re-onboarding sub-flow). */
  setReviewerProfile: (data: Partial<ReviewerProfile>) => void;
}

// ─── Demo profiles (used for role-switching in dev / demo) ───────────────────

const DEMO_PROFILES: Record<UserRole, {
  userId: string;
  displayName: string;
  institution: string;
  discipline: string;
  roleTitle: string;
}> = {
  author: {
    userId:      "user-author-01",
    displayName: "Dr. Sarah Chen",
    institution: "Stanford University",
    discipline:  "Education",
    roleTitle:   "Faculty/Professor",
  },
  reviewer: {
    userId:      "user-reviewer-01",
    displayName: "Prof. James Okafor",
    institution: "MIT",
    discipline:  "Computer Science & Information Technology",
    roleTitle:   "Faculty/Professor",
  },
  coordinator: {
    userId:      "user-coordinator-01",
    displayName: "Mark Davidson",
    institution: "Open4Review",
    discipline:  "Education",
    roleTitle:   "Other",
  },
};

const DEFAULT_REVIEWER_PROFILE: ReviewerProfile = {
  type: "academic",
  expertiseTags: ["Computer Science", "Accessibility", "eLearning"],
  rubricSpecializations: ["accessibility", "udl", "elearning"],
  licenseAcceptedAt: "2025-01-15T10:00:00.000Z",
  licenseVersion: "cc-by-nd-4.0",
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionState>((set) => ({
  role:       "author",
  userId:     DEMO_PROFILES.author.userId,
  displayName: DEMO_PROFILES.author.displayName,
  institution: DEMO_PROFILES.author.institution,
  discipline:  DEMO_PROFILES.author.discipline,
  roleTitle:   DEMO_PROFILES.author.roleTitle,

  roles:       ["author"],
  primaryRole: "author",

  authorOnboarded:          true,
  reviewerOnboarded:        false,
  coordinatorInterestLogged: false,

  reviewer: {
    type: null,
    expertiseTags: [],
    rubricSpecializations: [],
    licenseAcceptedAt: null,
    licenseVersion: null,
  },

  setRole: (role) => {
    const profile = DEMO_PROFILES[role];
    const isReviewer = role === "reviewer";
    set({
      role,
      ...profile,
      reviewer: isReviewer ? DEFAULT_REVIEWER_PROFILE : {
        type: null,
        expertiseTags: [],
        rubricSpecializations: [],
        licenseAcceptedAt: null,
        licenseVersion: null,
      },
    });
  },

  completeOnboarding: (data) => {
    set({
      roles:       data.roles,
      primaryRole: data.primaryRole,
      displayName: data.displayName,
      institution: data.institution,
      discipline:  data.discipline,
      roleTitle:   data.roleTitle,
      role:        data.primaryRole,
      authorOnboarded:   data.roles.includes("author"),
      reviewerOnboarded: data.roles.includes("reviewer"),
      reviewer: data.reviewer
        ? { ...{ type: null, expertiseTags: [], rubricSpecializations: [], licenseAcceptedAt: null, licenseVersion: null }, ...data.reviewer }
        : { type: null, expertiseTags: [], rubricSpecializations: [], licenseAcceptedAt: null, licenseVersion: null },
    });
  },

  addRole: (role) => {
    set((s) => {
      const newRoles = s.roles.includes(role) ? s.roles : [...s.roles, role];
      return {
        roles: newRoles,
        authorOnboarded: role === "author" ? true : s.authorOnboarded,
        coordinatorInterestLogged:
          role === "coordinator" ? true : s.coordinatorInterestLogged,
      };
    });
  },

  setReviewerProfile: (data) => {
    set((s) => ({
      reviewer: { ...s.reviewer, ...data },
      reviewerOnboarded: true,
      roles: s.roles.includes("reviewer") ? s.roles : [...s.roles, "reviewer"],
    }));
  },
}));
