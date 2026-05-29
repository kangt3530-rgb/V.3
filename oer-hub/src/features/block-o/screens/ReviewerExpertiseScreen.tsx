import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { ChipInput } from "../components/ChipInput";
import { saveReviewerExpertise } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { trackEvent } from "../../../lib/analytics";
import type { OnboardingRole } from "../onboardingUtils";
import { getNextStep, STEP_PATHS } from "../onboardingUtils";

const MIN_TAGS = 2;

// Suggestions seeded from the discipline list (profile already collected)
const SUGGESTION_POOL = [
  "Accessibility",
  "Assessment Design",
  "Computer Science",
  "Curriculum Development",
  "Data Science",
  "eLearning",
  "Engineering Education",
  "Environmental Science",
  "Health Literacy",
  "Instructional Design",
  "Linguistics",
  "Machine Learning",
  "Mathematics Education",
  "Open Pedagogy",
  "Science Education",
  "UDL",
  "Workforce Development",
  "Writing & Composition",
];

export function ReviewerExpertiseScreen() {
  const navigate      = useNavigate();
  const roles         = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const profile       = useOnboardingStore((s) => s.profile);
  const expertiseTags = useOnboardingStore((s) => s.reviewer.expertiseTags);
  const setReviewer   = useOnboardingStore((s) => s.setReviewer);
  const setStep       = useOnboardingStore((s) => s.setStep);
  const persistDraft  = useOnboardingStore((s) => s.persistDraft);
  const h1Ref         = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  // Seed suggestions from the user's discipline if not already in pool
  const disciplineSuggestion = profile.discipline && !SUGGESTION_POOL.includes(profile.discipline)
    ? [profile.discipline, ...SUGGESTION_POOL]
    : SUGGESTION_POOL;

  const canContinue = expertiseTags.length >= MIN_TAGS;

  async function handleContinue() {
    if (!canContinue) return;
    await saveReviewerExpertise(expertiseTags);
    const nextStep = getNextStep("reviewer-expertise", roles);
    if (!nextStep) return;
    setStep(nextStep);
    persistDraft();
    trackEvent("onboarding.step_completed", {
      step: "reviewer-expertise",
      tagCount: expertiseTags.length,
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
              Reviewer setup · 2 of 4
            </p>
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[28px] font-medium text-ink-black leading-tight outline-none"
            >
              What are your areas of expertise?
            </h1>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              These tags surface tasks that match your knowledge. Add at least
              two — you can always update them in Settings.
            </p>
          </div>

          <ChipInput
            id="reviewer-expertise"
            label="Expertise tags"
            value={expertiseTags}
            suggestions={disciplineSuggestion}
            placeholder="Type a topic and press Enter…"
            minRequired={MIN_TAGS}
            onChange={(tags) => setReviewer({ expertiseTags: tags })}
          />
        </div>
      </div>
    </OnboardingShell>
  );
}
