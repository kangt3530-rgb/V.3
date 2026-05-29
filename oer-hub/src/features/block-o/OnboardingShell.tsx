import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";
import { useOnboardingStore } from "../../store/onboardingStore";
import { getPrevStep, STEP_PATHS } from "./onboardingUtils";
import type { OnboardingRole } from "./onboardingUtils";
import { getAddingRole } from "../../api/onboarding";

interface OnboardingShellProps {
  children: ReactNode;
  /**
   * When true, the footer Back/Continue row is hidden (e.g. Welcome screen
   * manages its own CTA). Each screen controls Continue via its own button;
   * Back is always available here except on the welcome screen.
   */
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
  const navigate = useNavigate();
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const roles       = useOnboardingStore((s) => s.roles) as OnboardingRole[];

  const isAddingRole = !!getAddingRole();
  const isWelcome    = currentStep === "welcome";

  function handleBack() {
    if (isAddingRole) {
      navigate("/reviewer/settings");
      return;
    }
    const prev = getPrevStep(currentStep, roles);
    if (prev && STEP_PATHS[prev]) navigate(STEP_PATHS[prev]);
  }

  const showBack = !isWelcome;

  return (
    <div className="min-h-screen bg-parchment font-suisseintl flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-7 pt-6 pb-0 flex-shrink-0">
        {/* Brand wordmark */}
        <span className="font-iowanold text-[18px] font-medium text-ink-black tracking-tight select-none">
          Open4Review
        </span>

        {/* Add-role context link or step counter */}
        {isAddingRole ? (
          <button
            onClick={() => navigate("/reviewer/settings")}
            className="text-[13px] text-slate-gray hover:text-ink-black transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Settings
          </button>
        ) : (
          <span className="text-[13px] text-ash-gray select-none">
            {/* intentionally empty — progress is shown in the bar */}
          </span>
        )}
      </header>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      {!isAddingRole && (
        <div className="px-0 pt-4 flex-shrink-0">
          <ProgressBar currentStep={currentStep} roles={roles} />
        </div>
      )}

      {/* ── Screen content ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* ── Footer: Back / Continue ──────────────────────────────────────── */}
      {!hideFoot && (
        <footer className="flex-shrink-0 border-t border-whisper-border bg-parchment px-7 py-5 flex items-center justify-between gap-4">
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              className="text-[14px] text-slate-gray hover:text-ink-black transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back
            </button>
          ) : (
            <span />
          )}

          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              disabled={!continueEnabled}
              className={[
                "px-6 py-3 rounded-[10px] text-[14px] font-medium transition-colors",
                continueEnabled
                  ? "bg-burnt-umber text-white hover:bg-[#3d1e04] active:bg-[#2b1503]"
                  : "bg-whisper-border text-ash-gray cursor-not-allowed",
              ].join(" ")}
            >
              {continueLabel}
              {continueEnabled && (
                <span className="ml-1 inline-block">→</span>
              )}
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
