/**
 * CoordinatorScreen (Stage 4C) — non-blocking placeholder.
 * All three inputs are optional; a visible Skip button is present.
 * The Coordinator card in RolesScreen is currently non-selectable in UI,
 * so this screen is reachable only by direct URL in this release.
 * Data model and routing are complete so flipping the card to selectable
 * requires no further schema or routing changes.
 */

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingShell } from "../OnboardingShell";
import { saveCoordinatorInterest } from "../../../api/onboarding";
import { useOnboardingStore } from "../../../store/onboardingStore";
import { trackEvent } from "../../../lib/analytics";
import type { OnboardingRole } from "../onboardingUtils";
import { getNextStep, STEP_PATHS } from "../onboardingUtils";

export function CoordinatorScreen() {
  const navigate       = useNavigate();
  const roles          = useOnboardingStore((s) => s.roles) as OnboardingRole[];
  const coordinator    = useOnboardingStore((s) => s.coordinator);
  const setCoordinator = useOnboardingStore((s) => s.setCoordinator);
  const setStep        = useOnboardingStore((s) => s.setStep);
  const persistDraft   = useOnboardingStore((s) => s.persistDraft);
  const h1Ref          = useRef<HTMLHeadingElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    h1Ref.current?.focus();
  }, []);

  async function submit(skip: boolean) {
    if (submitting) return;
    setSubmitting(true);
    await saveCoordinatorInterest(
      skip
        ? { organization: "", painPoints: "", notifyEmail: "" }
        : {
            organization: coordinator.organization,
            painPoints:   coordinator.painPoints,
            notifyEmail:  coordinator.notifyEmail,
          },
    );
    const nextStep = getNextStep("coordinator", roles);
    if (!nextStep) return;
    setStep(nextStep);
    persistDraft();
    trackEvent("onboarding.step_completed", { step: "coordinator", skipped: skip });
    navigate(STEP_PATHS[nextStep]);
  }

  return (
    <OnboardingShell hideFoot>
      <div className="flex flex-col items-center px-7 py-10">
        <div className="w-full max-w-[480px] mx-auto flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-ash-gray" aria-hidden="true">
                manage_accounts
              </span>
              <span className="text-[12px] font-medium uppercase tracking-widest text-ash-gray">
                Coordinator tools — coming soon
              </span>
            </div>
            <h1
              ref={h1Ref}
              tabIndex={-1}
              className="font-iowanold text-[28px] font-medium text-ink-black leading-tight outline-none"
            >
              You're ahead of the curve
            </h1>
            <p className="text-[14px] text-slate-gray leading-relaxed">
              Coordinator tools are on their way. We'd love to learn about your
              programme before they launch — but feel free to skip if you're in
              a hurry.
            </p>
          </div>

          {/* Optional inputs */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="coord-org" className="text-[13px] font-medium text-ink-black">
                Organisation or programme you manage
                <span className="ml-1 text-ash-gray font-normal">(optional)</span>
              </label>
              <input
                id="coord-org"
                type="text"
                value={coordinator.organization}
                onChange={(e) => setCoordinator({ organization: e.target.value })}
                placeholder="e.g. Open Learning Initiative at CMU"
                className="h-11 px-3.5 rounded-[10px] border border-ghost-border bg-parchment text-[14px] text-ink-black placeholder:text-ash-gray outline-none focus:border-ink-black transition-colors hover:border-slate-gray"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="coord-pain" className="text-[13px] font-medium text-ink-black">
                What's your biggest pain point today?
                <span className="ml-1 text-ash-gray font-normal">(optional)</span>
              </label>
              <textarea
                id="coord-pain"
                value={coordinator.painPoints}
                onChange={(e) => setCoordinator({ painPoints: e.target.value })}
                placeholder="e.g. Manually matching reviewers to submissions takes too long…"
                rows={3}
                className="px-3.5 py-2.5 rounded-[10px] border border-ghost-border bg-parchment text-[14px] text-ink-black placeholder:text-ash-gray outline-none focus:border-ink-black transition-colors hover:border-slate-gray resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="coord-email" className="text-[13px] font-medium text-ink-black">
                Email for launch notification
                <span className="ml-1 text-ash-gray font-normal">(optional)</span>
              </label>
              <input
                id="coord-email"
                type="email"
                value={coordinator.notifyEmail}
                onChange={(e) => setCoordinator({ notifyEmail: e.target.value })}
                placeholder="you@institution.edu"
                className="h-11 px-3.5 rounded-[10px] border border-ghost-border bg-parchment text-[14px] text-ink-black placeholder:text-ash-gray outline-none focus:border-ink-black transition-colors hover:border-slate-gray"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={submitting}
              className="flex-1 py-3 rounded-[10px] bg-primary text-on-primary text-[14px] font-medium hover:bg-primary-container active:opacity-90 transition-colors disabled:opacity-50"
            >
              Submit and continue →
            </button>
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={submitting}
              className="px-5 py-3 rounded-[10px] border border-ghost-border text-[14px] text-slate-gray hover:border-ink-black hover:text-ink-black transition-colors disabled:opacity-50"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
