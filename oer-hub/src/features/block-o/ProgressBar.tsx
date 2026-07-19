import { useMemo } from "react";
import { getVisibleSteps, getStepIndex } from "./onboardingUtils";
import type { OnboardingRole } from "./onboardingUtils";

interface ProgressBarProps {
  currentStep: string;
  roles: OnboardingRole[];
}

export function ProgressBar({ currentStep, roles }: ProgressBarProps) {
  const { percent, current, total } = useMemo(() => {
    const steps = getVisibleSteps(roles);
    const idx = Math.max(0, getStepIndex(currentStep, roles));
    const pct = Math.round(((idx + 1) / steps.length) * 100);
    return { percent: pct, current: idx + 1, total: steps.length };
  }, [currentStep, roles]);

  return (
    // aria-live so screen readers announce progress changes without interrupting
    <div aria-live="polite" aria-atomic="true" className="w-full">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Onboarding progress: step ${current} of ${total}`}
        className="h-0.5 w-full bg-whisper-border overflow-hidden"
      >
        <div
          className="h-full bg-burnt-umber transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
