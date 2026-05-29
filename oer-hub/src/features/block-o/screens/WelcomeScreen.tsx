import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { acknowledgeWelcome } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { trackEvent } from "../../../lib/analytics";

export function WelcomeScreen() {
  const navigate     = useNavigate();
  const setStep      = useOnboardingStore((s) => s.setStep);
  const persistDraft = useOnboardingStore((s) => s.persistDraft);
  const h1Ref        = useRef<HTMLHeadingElement>(null);

  // Amendment 7: move focus to h1 on mount
  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  async function handleContinue() {
    await acknowledgeWelcome();
    setStep("roles");
    persistDraft();
    trackEvent("onboarding.step_completed", { step: "welcome" });
    navigate("/onboarding/roles");
  }

  return (
    // Welcome manages its own CTA so the shell footer is hidden
    <OnboardingShell hideFoot>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-7 py-12">
        <div className="w-full max-w-[480px] mx-auto flex flex-col items-center text-center gap-8">

          {/* Illustration placeholder */}
          <div
            className="w-20 h-20 rounded-full bg-tinted-info border border-whisper-border flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-[36px] text-burnt-umber">
              menu_book
            </span>
          </div>

          {/* Copy */}
          <div className="flex flex-col gap-4">
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[32px] font-medium text-ink-black leading-tight outline-none"
            >
              Welcome to Open4Review
            </h1>
            <p className="font-suisseintl text-[16px] text-slate-gray leading-relaxed max-w-sm mx-auto">
              Open Educational Resources improve when experts and authors
              collaborate. Whether you create OERs or evaluate them — your
              contribution strengthens learning for everyone.
            </p>
            <p className="font-suisseintl text-[14px] text-ash-gray">
              This takes about 3 minutes.
            </p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleContinue}
            className="w-full max-w-[280px] py-3.5 rounded-[10px] bg-burnt-umber text-white font-suisseintl text-[15px] font-medium hover:bg-[#3d1e04] active:bg-[#2b1503] transition-colors"
          >
            Get started →
          </button>

          <p className="text-[12px] text-ash-gray">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/author")}
              className="underline underline-offset-2 hover:text-slate-gray transition-colors"
            >
              Go to dashboard
            </button>
          </p>
        </div>
      </div>
    </OnboardingShell>
  );
}
