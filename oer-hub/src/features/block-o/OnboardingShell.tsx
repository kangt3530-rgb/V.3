/**
 * OnboardingShell — outer wrapper for all onboarding screens.
 * Provides the parchment background, brand wordmark, progress bar, and
 * Back/Continue footer. Screens are rendered as children.
 *
 * Full implementation in commit 3a. This file is a structural placeholder
 * that satisfies the router so routes can be wired in commit 2.
 */

import { type ReactNode } from "react";

interface OnboardingShellProps {
  children: ReactNode;
}

export function OnboardingShell({ children }: OnboardingShellProps) {
  return (
    <div className="min-h-screen bg-parchment font-suisseintl">
      {children}
    </div>
  );
}
