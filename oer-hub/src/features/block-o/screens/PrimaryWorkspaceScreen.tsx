import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { RadioCard } from "../components/RadioCard";
import { savePrimaryWorkspace } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { trackEvent } from "../../../lib/analytics";
import type { OnboardingRole } from "../onboardingUtils";
import { getNextStep, STEP_PATHS } from "../onboardingUtils";

const OPTIONS: {
  id: "author" | "reviewer";
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: "author",
    icon: "edit_note",
    title: "Author workspace",
    description:
      "Open to your resource dashboard by default. You can switch to reviewing at any time.",
  },
  {
    id: "reviewer",
    icon: "rate_review",
    title: "Reviewer workspace",
    description:
      "Open to the Task Center by default. You can switch to authoring at any time.",
  },
];

export function PrimaryWorkspaceScreen() {
  const navigate      = useNavigate();
  const roles         = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const primaryRole   = useOnboardingStore((s) => s.primaryRole);
  const setPrimaryRole = useOnboardingStore((s) => s.setPrimaryRole);
  const setStep       = useOnboardingStore((s) => s.setStep);
  const persistDraft  = useOnboardingStore((s) => s.persistDraft);
  const h1Ref         = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  const canContinue = !!primaryRole;

  async function handleContinue() {
    if (!primaryRole) return;
    await savePrimaryWorkspace(primaryRole);
    const nextStep = getNextStep("primary", roles);
    if (!nextStep) return;
    setStep(nextStep);
    persistDraft();
    trackEvent("onboarding.step_completed", { step: "primary", primaryRole });
    navigate(STEP_PATHS[nextStep]);
  }

  // Only show options for roles the user selected
  const visibleOptions = OPTIONS.filter((o) => roles.includes(o.id));

  return (
    <OnboardingShell
      continueEnabled={canContinue}
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
              Which workspace should open first?
            </h1>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              You can switch between workspaces anytime using the switcher in
              the top corner. This just sets your default landing.
            </p>
          </div>

          <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
            <legend className="sr-only">Select your primary workspace</legend>
            {visibleOptions.map((o) => (
              <RadioCard
                key={o.id}
                id={`primary-${o.id}`}
                name="primary-workspace"
                icon={o.icon}
                title={o.title}
                description={o.description}
                selected={primaryRole === o.id}
                onChange={() => setPrimaryRole(o.id)}
              />
            ))}
          </fieldset>

          <p className="text-[12px] text-ash-gray">
            You can change your default workspace in Settings at any time.
          </p>
        </div>
      </div>
    </OnboardingShell>
  );
}
