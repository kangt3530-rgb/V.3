import { type ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";
import { useOnboardingStore } from "../../store/onboardingStore";
import { getPrevStep, getStepIndex, getVisibleSteps, STEP_PATHS } from "./onboardingUtils";
import type { OnboardingRole } from "./onboardingUtils";
import { getAddingRole } from "../../api/onboarding";

interface OnboardingShellProps {
  children: ReactNode;
  /** When true, the Continue action area is hidden (Welcome and Done manage their own CTAs). */
  hideFoot?: boolean;
  /** Label shown on the Continue button. Defaults to "Continue →". */
  continueLabel?: string;
  /** Whether the Continue button is enabled. Controlled by each screen. */
  continueEnabled?: boolean;
  /** Called when the user clicks Continue. Screen handles navigation. */
  onContinue?: () => void;
}

export function OnboardingShell({
  children,
  hideFoot = false,
  continueLabel = "Continue",
  continueEnabled = true,
  onContinue,
}: OnboardingShellProps) {
  const navigate    = useNavigate();
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const roles       = useOnboardingStore((s) => s.roles) as OnboardingRole[];

  const loadDraft = useOnboardingStore((s) => s.loadDraft);

  // Hydrate store from localStorage on direct navigation (e.g. page refresh
  // mid-flow). Only runs when roles is empty — meaning the in-memory store was
  // never populated through normal flow navigation.
  useEffect(() => {
    if (roles.length === 0) loadDraft();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAddingRole = !!getAddingRole();
  const isDone       = currentStep === "done";
  const isWelcome    = currentStep === "welcome";
  const showBack     = !isWelcome && !isDone && !isAddingRole;

  const visibleSteps = getVisibleSteps(roles);
  const stepIndex    = getStepIndex(currentStep, roles);
  const stepTotal    = visibleSteps.length;

  function handleBack() {
    if (isAddingRole) {
      navigate("/reviewer/settings");
      return;
    }
    const prev = getPrevStep(currentStep, roles);
    if (prev && STEP_PATHS[prev]) navigate(STEP_PATHS[prev]);
  }

  return (
    <div className="min-h-screen bg-parchment font-suisseintl flex flex-col">

      {/* ── Sticky top bar ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-parchment">
        <header className="grid grid-cols-3 items-center px-7 pt-6 pb-0">

          {/* Far left: Back link */}
          <div>
            {showBack && (
              <button
                type="button"
                onClick={handleBack}
                className="text-[14px] text-slate-gray hover:text-ink-black transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                Back
              </button>
            )}
            {isAddingRole && (
              <button
                type="button"
                onClick={() => navigate("/reviewer/settings")}
                className="text-[14px] text-slate-gray hover:text-ink-black transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                Back to Settings
              </button>
            )}
          </div>

          {/* Center: Brand wordmark */}
          <span className="font-iowanold text-[18px] font-medium text-ink-black tracking-tight select-none text-center">
            Open4Review
          </span>

          {/* Far right: Step counter */}
          <span className="text-[13px] text-ash-gray select-none text-right">
            {stepIndex >= 0 && stepTotal > 0
              ? `Step ${stepIndex + 1} of ${stepTotal}`
              : ""}
          </span>
        </header>

        {/* Progress bar */}
        {!isAddingRole && (
          <div className="px-0 pt-4">
            <ProgressBar currentStep={currentStep} roles={roles} />
          </div>
        )}
      </div>

      {/* ── Content + Continue: vertically centered in remaining viewport ─── */}
      <div className="flex-1 flex flex-col justify-center">
        <main>
          {children}
        </main>

        {!hideFoot && onContinue && (
          <div className="flex justify-center px-7 mt-8 pb-10">
            <button
              type="button"
              onClick={onContinue}
              disabled={!continueEnabled}
              className={[
                "w-full max-w-[480px] py-3.5 rounded-[10px] text-[15px] font-medium transition-colors",
                continueEnabled
                  ? "bg-primary text-on-primary hover:bg-primary-container active:opacity-90"
                  : "bg-whisper-border text-ash-gray cursor-not-allowed",
              ].join(" ")}
            >
              {continueLabel}
              {continueEnabled && <span className="ml-1">→</span>}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
