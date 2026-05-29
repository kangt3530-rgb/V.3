import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { LicenseAgreement } from "../components/LicenseAgreement";
import { saveReviewerLicense, setAddingRole } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { useSessionStore } from "../../../store/sessionStore";
import { trackEvent } from "../../../lib/analytics";
import type { OnboardingRole } from "../onboardingUtils";
import { getNextStep, STEP_PATHS } from "../onboardingUtils";
import { getAddingRole } from "../../../api/onboarding";

export function ReviewerLicenseScreen() {
  const navigate     = useNavigate();
  const roles        = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const reviewer     = useOnboardingStore((s) => s.reviewer);
  const setReviewer  = useOnboardingStore((s) => s.setReviewer);
  const setStep      = useOnboardingStore((s) => s.setStep);
  const persistDraft = useOnboardingStore((s) => s.persistDraft);
  const setReviewerProfile = useSessionStore((s) => s.setReviewerProfile);
  const h1Ref        = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  const canContinue = reviewer.licenseAccepted;

  async function handleContinue() {
    if (!canContinue) return;

    const { acceptedAt, version } = await saveReviewerLicense();
    setReviewer({ licenseAcceptedAt: acceptedAt, licenseVersion: version });

    const addingRole = getAddingRole();

    if (addingRole === "reviewer") {
      // Re-onboarding path: update sessionStore, clear flag, return to Settings
      setReviewerProfile({
        type:                 reviewer.type,
        expertiseTags:        reviewer.expertiseTags,
        rubricSpecializations: reviewer.rubricSpecializations,
        licenseAcceptedAt:    acceptedAt,
        licenseVersion:       version,
      });
      setAddingRole(null);
      trackEvent("onboarding.add_role_completed", { role: "reviewer" });
      navigate("/reviewer/settings", { replace: true });
      return;
    }

    // Normal onboarding path
    const nextStep = getNextStep("reviewer-license", roles);
    if (!nextStep) return;
    setStep(nextStep);
    persistDraft();
    trackEvent("onboarding.step_completed", { step: "reviewer-license" });
    navigate(STEP_PATHS[nextStep]);
  }

  return (
    <OnboardingShell
      continueLabel="I agree — continue"
      continueEnabled={canContinue}
      onContinue={handleContinue}
    >
      <div className="flex flex-col items-center px-7 py-10">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">

          <div className="flex flex-col gap-1.5">
            <p className="text-[12px] font-medium uppercase tracking-widest text-ash-gray">
              Reviewer setup · 4 of 4
            </p>
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[28px] font-medium text-ink-black leading-tight outline-none"
            >
              One last thing
            </h1>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              Before you start reviewing, please read and accept the feedback
              license below.
            </p>
          </div>

          <LicenseAgreement
            accepted={reviewer.licenseAccepted}
            onChange={(v) => setReviewer({ licenseAccepted: v })}
          />
        </div>
      </div>
    </OnboardingShell>
  );
}
