import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { RadioCard } from "../components/RadioCard";
import { saveReviewerType } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { trackEvent } from "../../../lib/analytics";
import type { ReviewerType } from "../../../store/onboardingStore";
import type { OnboardingRole } from "../onboardingUtils";
import { getNextStep, STEP_PATHS } from "../onboardingUtils";

const OPTIONS: {
  id: ReviewerType;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: "academic",
    icon: "school",
    title: "Academic Peer",
    description:
      "You're faculty, a researcher, or an academic expert evaluating OERs for scholarly rigor, disciplinary accuracy, and pedagogical quality.",
  },
  {
    id: "industry",
    icon: "business_center",
    title: "Industry Expert",
    description:
      "You bring workforce and industry perspective — evaluating whether OERs prepare learners for real-world professional contexts.",
  },
];

export function ReviewerTypeScreen() {
  const navigate     = useNavigate();
  const roles        = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const reviewerType = useOnboardingStore((s) => s.reviewer.type);
  const setReviewer  = useOnboardingStore((s) => s.setReviewer);
  const setStep      = useOnboardingStore((s) => s.setStep);
  const persistDraft = useOnboardingStore((s) => s.persistDraft);
  const h1Ref        = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  const canContinue = !!reviewerType;

  async function handleContinue() {
    if (!reviewerType) return;
    await saveReviewerType(reviewerType);
    const nextStep = getNextStep("reviewer-type", roles);
    if (!nextStep) return;
    setStep(nextStep);
    persistDraft();
    trackEvent("onboarding.step_completed", { step: "reviewer-type", reviewerType });
    navigate(STEP_PATHS[nextStep]);
  }

  return (
    <OnboardingShell
      continueEnabled={canContinue}
      onContinue={handleContinue}
    >
      <div className="flex flex-col items-center px-7 py-10">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">

          <div className="flex flex-col gap-1.5">
            <p className="text-[12px] font-medium uppercase tracking-widest text-ash-gray">
              Reviewer setup · 1 of 4
            </p>
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[28px] font-medium text-ink-black leading-tight outline-none"
            >
              What kind of reviewer are you?
            </h1>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              This is shown alongside your feedback so authors understand your
              perspective. It doesn't limit which rubrics you can apply.
            </p>
          </div>

          <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
            <legend className="sr-only">Select your reviewer type</legend>
            {OPTIONS.map((o) => (
              <RadioCard
                key={o.id}
                id={`reviewer-type-${o.id}`}
                name="reviewer-type"
                icon={o.icon}
                title={o.title}
                description={o.description}
                selected={reviewerType === o.id}
                onChange={() => setReviewer({ type: o.id })}
              />
            ))}
          </fieldset>
        </div>
      </div>
    </OnboardingShell>
  );
}
