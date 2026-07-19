import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { OnboardingField } from "../components/OnboardingField";
import { saveProfile } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { trackEvent } from "../../../lib/analytics";
import { DISCIPLINES } from "../../../constants/disciplines";
import type { OnboardingRole } from "../onboardingUtils";
import { getNextStep, STEP_PATHS } from "../onboardingUtils";

const ROLE_TITLES = [
  "Faculty/Professor",
  "Instructional Designer",
  "Editor",
  "Industry Practitioner",
  "Graduate Student",
  "Other",
] as const;

export function ProfileScreen() {
  const navigate     = useNavigate();
  const roles        = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const profile      = useOnboardingStore((s) => s.profile);
  const setProfile   = useOnboardingStore((s) => s.setProfile);
  const setStep      = useOnboardingStore((s) => s.setStep);
  const persistDraft = useOnboardingStore((s) => s.persistDraft);
  const h1Ref        = useRef<HTMLHeadingElement>(null);

  // Local touched state for inline validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  const errors = {
    displayName: touched.displayName && !profile.displayName.trim()
      ? "Display name is required" : undefined,
    institution: touched.institution && !profile.institution.trim()
      ? "Institution is required" : undefined,
    discipline: touched.discipline && !profile.discipline
      ? "Please select a discipline" : undefined,
    roleTitle: touched.roleTitle && !profile.roleTitle
      ? "Please select a role title" : undefined,
  };

  const isValid =
    !!profile.displayName.trim() &&
    !!profile.institution.trim() &&
    !!profile.discipline &&
    !!profile.roleTitle;

  async function handleContinue() {
    // Touch all fields to show errors if any are empty
    setTouched({ displayName: true, institution: true, discipline: true, roleTitle: true });
    if (!isValid) return;

    await saveProfile({
      displayName: profile.displayName.trim(),
      institution: profile.institution.trim(),
      discipline:  profile.discipline,
      roleTitle:   profile.roleTitle,
    });

    const nextStep = getNextStep("profile", roles);
    if (!nextStep) return;
    setStep(nextStep);
    persistDraft();
    trackEvent("onboarding.step_completed", { step: "profile" });
    navigate(STEP_PATHS[nextStep]);
  }

  return (
    <OnboardingShell
      continueEnabled={isValid}
      onContinue={handleContinue}
    >
      <div className="flex flex-col items-center px-7 py-10">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">

          <div className="flex flex-col gap-1.5">
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[28px] font-medium text-ink-black leading-tight outline-none"
            >
              Tell us about yourself
            </h1>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              This helps match you with the right tasks and gives reviewers and
              authors helpful context.
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); handleContinue(); }}
            className="flex flex-col gap-4"
            noValidate
          >
            <OnboardingField
              id="profile-display-name"
              type="text"
              label="Display name"
              value={profile.displayName}
              placeholder="e.g. Dr. Sarah Chen"
              required
              error={errors.displayName}
              onChange={(v) => setProfile({ displayName: v })}
              onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
            />

            <OnboardingField
              id="profile-institution"
              type="text"
              label="Institution or organization"
              value={profile.institution}
              placeholder="e.g. Maricopa Community Colleges"
              required
              error={errors.institution}
              onChange={(v) => setProfile({ institution: v })}
              onBlur={() => setTouched((t) => ({ ...t, institution: true }))}
            />

            <OnboardingField
              id="profile-discipline"
              type="select"
              label="Primary discipline"
              value={profile.discipline}
              options={DISCIPLINES}
              placeholder="Select a discipline…"
              required
              error={errors.discipline}
              onChange={(v) => setProfile({ discipline: v })}
              onBlur={() => setTouched((t) => ({ ...t, discipline: true }))}
            />

            <OnboardingField
              id="profile-role-title"
              type="select"
              label="Role title"
              value={profile.roleTitle}
              options={ROLE_TITLES}
              placeholder="Select a title…"
              required
              error={errors.roleTitle}
              onChange={(v) => setProfile({ roleTitle: v })}
              onBlur={() => setTouched((t) => ({ ...t, roleTitle: true }))}
            />
          </form>
        </div>
      </div>
    </OnboardingShell>
  );
}
