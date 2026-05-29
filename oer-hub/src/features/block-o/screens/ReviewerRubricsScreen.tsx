import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { RubricCard } from "../components/RubricCard";
import { saveReviewerRubrics } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { trackEvent } from "../../../lib/analytics";
import type { RubricTemplateId } from "../../../api/types";
import type { OnboardingRole } from "../onboardingUtils";
import { getNextStep, STEP_PATHS } from "../onboardingUtils";

const RUBRICS: {
  id: RubricTemplateId;
  label: string;
  description: string;
}[] = [
  {
    id: "accessibility",
    label: "Accessibility",
    description: "Screen reader navigation, colour contrast, alt text, multimedia captions, and form usability.",
  },
  {
    id: "copy-editing",
    label: "Copy Editing",
    description: "Grammar, spelling, punctuation, style consistency, and inclusive language.",
  },
  {
    id: "copyright",
    label: "Copyright",
    description: "Licensing compliance, third-party attribution, fair use documentation, and permissions.",
  },
  {
    id: "disciplinary",
    label: "Disciplinary Appropriateness",
    description: "Content accuracy, currency, scholarly rigour, and college-level cognitive demand.",
  },
  {
    id: "elearning",
    label: "eLearning Review",
    description: "Usability, LMS compatibility, mobile accessibility, privacy, and pedagogical effectiveness.",
  },
  {
    id: "udl",
    label: "Universal Design for Learning",
    description: "Multiple means of representation, expression, and engagement for diverse learners.",
  },
];

export function ReviewerRubricsScreen() {
  const navigate              = useNavigate();
  const roles                 = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const rubricSpecializations = useOnboardingStore((s) => s.reviewer.rubricSpecializations);
  const setReviewer           = useOnboardingStore((s) => s.setReviewer);
  const setStep               = useOnboardingStore((s) => s.setStep);
  const persistDraft          = useOnboardingStore((s) => s.persistDraft);
  const h1Ref                 = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  function toggle(id: RubricTemplateId) {
    if (rubricSpecializations.includes(id)) {
      setReviewer({ rubricSpecializations: rubricSpecializations.filter((r) => r !== id) });
    } else {
      setReviewer({ rubricSpecializations: [...rubricSpecializations, id] });
    }
  }

  const canContinue = rubricSpecializations.length >= 1;

  async function handleContinue() {
    if (!canContinue) return;
    await saveReviewerRubrics(rubricSpecializations);
    const nextStep = getNextStep("reviewer-rubrics", roles);
    if (!nextStep) return;
    setStep(nextStep);
    persistDraft();
    trackEvent("onboarding.step_completed", {
      step: "reviewer-rubrics",
      rubrics: rubricSpecializations,
    });
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
              Reviewer setup · 3 of 4
            </p>
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[28px] font-medium text-ink-black leading-tight outline-none"
            >
              Which rubrics are you qualified to apply?
            </h1>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              Only tasks using your selected rubrics will appear in your Task
              Pool. You can update this in Settings.
            </p>
          </div>

          <fieldset className="grid grid-cols-2 gap-3 border-0 p-0 m-0">
            <legend className="sr-only">Select rubric specializations (at least one required)</legend>
            {RUBRICS.map((r) => (
              <RubricCard
                key={r.id}
                id={`rubric-${r.id}`}
                label={r.label}
                description={r.description}
                selected={rubricSpecializations.includes(r.id)}
                onChange={() => toggle(r.id)}
              />
            ))}
          </fieldset>

          {!canContinue && (
            <p className="text-[12px] text-ash-gray text-center">
              Select at least one rubric to continue
            </p>
          )}
        </div>
      </div>
    </OnboardingShell>
  );
}
