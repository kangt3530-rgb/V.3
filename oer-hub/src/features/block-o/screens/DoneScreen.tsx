import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { completeOnboarding } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { useSessionStore } from "../../../store/sessionStore";
import { trackEvent } from "../../../lib/analytics";
import type { OnboardingRole } from "../onboardingUtils";

export function DoneScreen() {
  const navigate       = useNavigate();
  const roles          = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const primaryRole    = useOnboardingStore((s) => s.primaryRole);
  const profile        = useOnboardingStore((s) => s.profile);
  const reviewer       = useOnboardingStore((s) => s.reviewer);
  const completeStore  = useSessionStore((s) => s.completeOnboarding);
  const reset          = useOnboardingStore((s) => s.reset);
  const h1Ref          = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  const isAuthor   = roles.includes("author");
  const isReviewer = roles.includes("reviewer");
  const isBoth     = isAuthor && isReviewer;

  const effectivePrimary = primaryRole ?? (isReviewer ? "reviewer" : "author");

  // Simulated matched-task count derived from expertise profile
  const matchedTaskCount = reviewer.expertiseTags.length > 0
    ? reviewer.expertiseTags.length * 4 + 2
    : 8;

  async function handleEnter(dest: string) {
    // Hydrate session store with completed profile
    completeStore({
      roles,
      primaryRole: effectivePrimary,
      displayName: profile.displayName,
      institution: profile.institution,
      discipline:  profile.discipline,
      roleTitle:   profile.roleTitle,
      reviewer: isReviewer
        ? {
            type:                 reviewer.type,
            expertiseTags:        reviewer.expertiseTags,
            rubricSpecializations: reviewer.rubricSpecializations,
            licenseAcceptedAt:    reviewer.licenseAcceptedAt,
            licenseVersion:       reviewer.licenseVersion,
          }
        : undefined,
    });

    await completeOnboarding();
    reset();

    trackEvent("onboarding.completed", { roles, primaryRole });

    navigate(dest, { replace: true });
  }

  return (
    <OnboardingShell hideFoot>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-7 py-12">
        <div className="w-full max-w-[480px] mx-auto flex flex-col items-center text-center gap-8">

          {/* Celebration icon */}
          <div
            className="w-20 h-20 rounded-full bg-goldenrod/20 border border-goldenrod/40 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="material-symbols-outlined text-[36px] text-[#735c00]" style={{ fontVariationSettings: "'FILL' 1" }}>
              celebration
            </span>
          </div>

          {/* Heading and sub-copy */}
          <div className="flex flex-col gap-3">
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[32px] font-medium text-ink-black leading-tight outline-none"
            >
              You're all set, {profile.displayName.split(" ")[0] || "there"}!
            </h1>

            {effectivePrimary === "reviewer" ? (
              <p className="text-[15px] text-slate-gray leading-relaxed max-w-sm mx-auto">
                We found {matchedTaskCount} tasks that match your expertise. Take
                a look whenever you're ready.
              </p>
            ) : (
              <p className="text-[15px] text-slate-gray leading-relaxed max-w-sm mx-auto">
                Ready to submit your first resource? Walking through it takes
                about 5 minutes.
              </p>
            )}
          </div>

          {/* What's ready list */}
          <ul className="w-full text-left flex flex-col gap-2.5" aria-label="What's ready for you">
            {isAuthor && (
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-burnt-umber mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="text-[14px] text-slate-gray leading-snug">
                  Author dashboard — submit and track your OERs
                </span>
              </li>
            )}
            {isReviewer && (
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-burnt-umber mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="text-[14px] text-slate-gray leading-snug">
                  Task Center — claim and complete review assignments
                </span>
              </li>
            )}
            {isBoth && (
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[18px] text-burnt-umber mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <span className="text-[14px] text-slate-gray leading-snug">
                  Workspace switcher in the top corner of your dashboard
                </span>
              </li>
            )}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-4 w-full">
            <button
              type="button"
              onClick={() => handleEnter(effectivePrimary === "reviewer" ? "/reviewer" : "/author")}
              className="w-full max-w-[280px] py-3.5 rounded-[10px] bg-primary text-on-primary font-suisseintl text-[15px] font-medium hover:bg-primary-container active:opacity-90 transition-colors"
            >
              {effectivePrimary === "reviewer"
                ? "Browse my task pool →"
                : "Submit my first resource →"}
            </button>

            {isBoth && (
              <button
                type="button"
                onClick={() => handleEnter(effectivePrimary === "reviewer" ? "/author" : "/reviewer")}
                className="text-[14px] text-slate-gray hover:text-ink-black transition-colors"
              >
                {effectivePrimary === "reviewer"
                  ? "Or submit your first resource as an Author →"
                  : "Or browse review tasks matching your expertise →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
