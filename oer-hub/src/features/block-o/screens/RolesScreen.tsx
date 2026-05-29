import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { RoleCard } from "../components/RoleCard";
import { saveRoles } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { trackEvent } from "../../../lib/analytics";
import type { OnboardingRole } from "../onboardingUtils";
import { getNextStep, STEP_PATHS } from "../onboardingUtils";

const ROLES: {
  id: OnboardingRole;
  icon: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}[] = [
  {
    id: "author",
    icon: "edit_note",
    title: "Author",
    description:
      "You create Open Educational Resources and want structured expert feedback to improve your work and pursue certification.",
  },
  {
    id: "reviewer",
    icon: "rate_review",
    title: "Reviewer",
    description:
      "You're a subject-matter expert who evaluates OERs against professional rubrics and provides evidence-based feedback.",
  },
  {
    id: "coordinator",
    icon: "manage_accounts",
    title: "Coordinator",
    description:
      "You oversee review pipelines, match reviewers to resources, and ensure feedback quality before it reaches authors.",
    comingSoon: true,
  },
];

export function RolesScreen() {
  const navigate     = useNavigate();
  const roles        = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const setRoles     = useOnboardingStore((s) => s.setRoles);
  const setStep      = useOnboardingStore((s) => s.setStep);
  const persistDraft = useOnboardingStore((s) => s.persistDraft);
  const h1Ref        = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  function toggleRole(role: OnboardingRole) {
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  }

  // Selectable roles only (coordinator is not selectable)
  const selectableSelected = roles.filter((r) => r !== "coordinator");
  const canContinue = selectableSelected.length > 0;

  async function handleContinue() {
    await saveRoles(roles);
    const nextStep = getNextStep("roles", roles);
    if (!nextStep) return;
    setStep(nextStep);
    persistDraft();
    trackEvent("onboarding.step_completed", { step: "roles", roles });
    navigate(STEP_PATHS[nextStep]);
  }

  return (
    <OnboardingShell
      continueEnabled={canContinue}
      onContinue={handleContinue}
    >
      <div className="flex flex-col items-center px-7 py-10">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">

          {/* Heading */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[12px] font-medium uppercase tracking-widest text-ash-gray">
              Step 1 of your setup
            </p>
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[28px] font-medium text-ink-black leading-tight outline-none"
            >
              How do you participate in OER?
            </h1>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              Pick all that apply — many people both create and review. You can
              always add roles later from your profile settings.
            </p>
          </div>

          {/* Role cards */}
          <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
            <legend className="sr-only">Select your role or roles</legend>
            {ROLES.map((r) => (
              <RoleCard
                key={r.id}
                id={`role-${r.id}`}
                icon={r.icon}
                title={r.title}
                description={r.description}
                selected={roles.includes(r.id)}
                comingSoon={r.comingSoon}
                onChange={() => !r.comingSoon && toggleRole(r.id)}
              />
            ))}
          </fieldset>
        </div>
      </div>
    </OnboardingShell>
  );
}
