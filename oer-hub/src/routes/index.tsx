import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";

// Block A
import { AuthorDashboard }          from "../features/block-a/AuthorDashboard";
import { SubmissionForm }           from "../features/block-a/SubmissionForm";
import { ReviewerTaskCenter }        from "../features/block-a/ReviewerTaskCenter";
import { ProfileSettingsPage }       from "../features/block-a/ProfileSettingsPage";
import { CoordinatorCommandCenter }  from "../features/block-a/CoordinatorCommandCenter";

// Block B
import { ReviewerConsole }           from "../features/block-b/ReviewerConsole";

// Block C
import FeedbackReport                from "../features/block-c/FeedbackReport";
import FinalSubmission               from "../features/block-c/FinalSubmission";
import { OerRubricList }             from "../features/block-c/OerRubricList";
import { RubricReviewEntry }         from "../features/block-c/RubricReviewEntry";
import { MediationQueue }            from "../features/block-c/MediationQueue";
import { ValidationLandingPage }     from "../features/block-c/ValidationLandingPage";

// Block O — Onboarding
import { WelcomeScreen }             from "../features/block-o/screens/WelcomeScreen";
import { RolesScreen }               from "../features/block-o/screens/RolesScreen";
import { PrimaryWorkspaceScreen }    from "../features/block-o/screens/PrimaryWorkspaceScreen";
import { ProfileScreen }             from "../features/block-o/screens/ProfileScreen";
import { ReviewerTypeScreen }        from "../features/block-o/screens/ReviewerTypeScreen";
import { ReviewerExpertiseScreen }   from "../features/block-o/screens/ReviewerExpertiseScreen";
import { ReviewerRubricsScreen }     from "../features/block-o/screens/ReviewerRubricsScreen";
import { ReviewerLicenseScreen }     from "../features/block-o/screens/ReviewerLicenseScreen";
import { CoordinatorScreen }         from "../features/block-o/screens/CoordinatorScreen";
import { DoneScreen }                from "../features/block-o/screens/DoneScreen";

// Onboarding helpers
import {
  isOnboardingComplete,
} from "../api/onboarding";
import { getUserId, onboardingKeys, STEP_PATHS } from "../features/block-o/onboardingUtils";

// ─── Feature flag ─────────────────────────────────────────────────────────────
const ONBOARDING_ENABLED = import.meta.env.VITE_ENABLE_ONBOARDING === "true";

// ─── Guard components ─────────────────────────────────────────────────────────

/**
 * Wraps dashboard routes. When ONBOARDING_ENABLED and the user has not
 * completed onboarding, redirects to the first incomplete step (or welcome).
 */
function RequireOnboarding({ children }: { children: React.ReactNode }) {
  if (!ONBOARDING_ENABLED) return <>{children}</>;

  if (!isOnboardingComplete()) {
    // Resume at the last persisted step, or start from welcome
    const uid = getUserId();
    const raw = localStorage.getItem(onboardingKeys.draft(uid));
    let lastStep = "welcome";
    if (raw) {
      try {
        const draft = JSON.parse(raw) as { currentStep?: string };
        if (draft.currentStep) lastStep = draft.currentStep;
      } catch { /* ignore */ }
    }
    const path = STEP_PATHS[lastStep] ?? "/onboarding/welcome";
    return <Navigate to={path} replace />;
  }

  return <>{children}</>;
}

/**
 * Wraps onboarding routes. When onboarding is already complete, redirects
 * to the user's primary dashboard.
 */
function OnboardingOnly({ children }: { children: React.ReactNode }) {
  if (!ONBOARDING_ENABLED) return <Navigate to="/author" replace />;

  if (isOnboardingComplete()) {
    // Redirect to primary role dashboard
    const uid = getUserId();
    const raw = localStorage.getItem(onboardingKeys.draft(uid));
    let primary: string | null = null;
    if (raw) {
      try {
        const draft = JSON.parse(raw) as { primaryRole?: string };
        primary = draft.primaryRole ?? null;
      } catch { /* ignore */ }
    }
    const dest = primary === "reviewer" ? "/reviewer" : "/author";
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
}

// ─── App routes ───────────────────────────────────────────────────────────────

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/author" replace />} />

        {/* ── Block O: Onboarding ──────────────────────────────────────────── */}
        {/* Each screen renders its own OnboardingShell — no wrapper here */}
        <Route
          path="/onboarding/welcome"
          element={<OnboardingOnly><WelcomeScreen /></OnboardingOnly>}
        />
        <Route
          path="/onboarding/roles"
          element={<OnboardingOnly><RolesScreen /></OnboardingOnly>}
        />
        <Route
          path="/onboarding/primary"
          element={<OnboardingOnly><PrimaryWorkspaceScreen /></OnboardingOnly>}
        />
        <Route
          path="/onboarding/profile"
          element={<OnboardingOnly><ProfileScreen /></OnboardingOnly>}
        />
        <Route path="/onboarding/reviewer/type"     element={<ReviewerTypeScreen />} />
        <Route path="/onboarding/reviewer/expertise" element={<ReviewerExpertiseScreen />} />
        <Route path="/onboarding/reviewer/rubrics"  element={<ReviewerRubricsScreen />} />
        <Route path="/onboarding/reviewer/license"  element={<ReviewerLicenseScreen />} />
        <Route path="/onboarding/coordinator"       element={<CoordinatorScreen />} />
        <Route path="/onboarding/done"              element={<DoneScreen />} />

        {/* ── Block A: Dashboards ──────────────────────────────────────────── */}
        <Route
          path="/author"
          element={
            <RequireOnboarding>
              <AppShell><AuthorDashboard /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/submit"
          element={
            <RequireOnboarding>
              <AppShell><SubmissionForm /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/reviewer"
          element={
            <RequireOnboarding>
              <AppShell><ReviewerTaskCenter /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/reviewer/archive"
          element={
            <RequireOnboarding>
              <AppShell>
                <div className="pt-16 p-8 text-on-surface-variant">
                  Archive — coming soon
                </div>
              </AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/reviewer/settings"
          element={
            <RequireOnboarding>
              <AppShell><ProfileSettingsPage /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/coordinator"
          element={
            <RequireOnboarding>
              <AppShell><CoordinatorCommandCenter /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/coordinator/mediation"
          element={
            <RequireOnboarding>
              <AppShell><MediationQueue /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/coordinator/mediation/:mediationId"
          element={
            <RequireOnboarding>
              <AppShell><MediationQueue /></AppShell>
            </RequireOnboarding>
          }
        />

        {/* ── Block B: Reviewer Console (full-screen) ──────────────────────── */}
        <Route
          path="/review/:taskId"
          element={
            <RequireOnboarding>
              <AppShell fullScreen><ReviewerConsole /></AppShell>
            </RequireOnboarding>
          }
        />

        {/* ── Block C: Per-rubric feedback reports ─────────────────────────── */}
        <Route
          path="/reports/:oerId"
          element={
            <RequireOnboarding>
              <AppShell><OerRubricList /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/reports/:oerId/:rubricId"
          element={
            <RequireOnboarding>
              <AppShell><RubricReviewEntry /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/reports/:oerId/:rubricId/read"
          element={
            <RequireOnboarding>
              <AppShell fullScreen><FeedbackReport /></AppShell>
            </RequireOnboarding>
          }
        />
        <Route
          path="/reports/:oerId/:rubricId/submit"
          element={
            <RequireOnboarding>
              <AppShell><FinalSubmission /></AppShell>
            </RequireOnboarding>
          }
        />

        {/* ── Public validation landing (no main app chrome) ───────────────── */}
        <Route path="/verify/:stampId" element={<ValidationLandingPage />} />

        {/* ── Catch-all ────────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/author" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
