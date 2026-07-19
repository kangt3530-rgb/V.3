import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { setAddingRole } from "../../api/onboarding";
import { AIPreferencesPanel } from "../block-b/AIPane/AIPreferencesPanel";

// ─── Toast (minimal inline implementation) ───────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-primary text-on-primary text-body-sm font-label px-5 py-3 rounded-xl shadow-ambient flex items-center gap-3"
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
        check_circle
      </span>
      {message}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-2 text-on-primary/60 hover:text-on-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
      </button>
    </div>
  );
}

// ─── My Roles section ─────────────────────────────────────────────────────────

type RoleId = "author" | "reviewer" | "coordinator";

interface RoleRowProps {
  icon: string;
  title: string;
  description: string;
  active: boolean;
  comingSoon?: boolean;
  onAdd?: () => void;
}

function RoleRow({ icon, title, description, active, comingSoon, onAdd }: RoleRowProps) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-outline-variant/20 last:border-0">
      <span className="material-symbols-outlined text-[20px] text-on-surface-variant flex-shrink-0" aria-hidden="true">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-label font-semibold text-on-surface">{title}</p>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {active ? (
          <span className="inline-flex items-center gap-1 text-label-sm font-label text-on-surface-variant bg-surface-container-high rounded-full px-3 py-1">
            <span className="material-symbols-outlined text-[12px]" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
              check
            </span>
            Active
          </span>
        ) : comingSoon ? (
          <span className="text-label-sm font-label text-on-surface-variant/60 border border-outline-variant rounded-full px-3 py-1">
            Coming soon
          </span>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="text-label-sm font-label font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1"
          >
            Add
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileSettingsPage() {
  const navigate       = useNavigate();
  const role           = useSessionStore((s) => s.role);
  const roles          = useSessionStore((s) => s.roles);
  const displayName    = useSessionStore((s) => s.displayName);
  const addRole        = useSessionStore((s) => s.addRole);
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function handleAddAuthor() {
    addRole("author");
    showToast("Author role added. Visit your Author dashboard to submit your first resource.");
  }

  function handleAddReviewer() {
    // Reset onboarding store so we start fresh reviewer sub-flow
    resetOnboarding();
    setAddingRole("reviewer");
    navigate("/onboarding/reviewer/type");
  }

  const ROLE_DEFS: { id: RoleId; icon: string; title: string; description: string; comingSoon?: boolean }[] = [
    {
      id: "author",
      icon: "edit_note",
      title: "Author",
      description: "Create and submit OERs for peer review and certification.",
    },
    {
      id: "reviewer",
      icon: "rate_review",
      title: "Reviewer",
      description: "Evaluate OERs against professional rubrics and provide expert feedback.",
    },
    {
      id: "coordinator",
      icon: "manage_accounts",
      title: "Coordinator",
      description: "Oversee review pipelines and match reviewers to resources.",
      comingSoon: true,
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-surface">
      <div className="max-w-2xl mx-auto px-8 py-10">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-title-sm font-label font-bold text-on-primary-container">
                {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-headline-sm font-headline text-on-surface leading-tight">
                {displayName}
              </h1>
              <p className="text-label-sm font-label uppercase tracking-widest text-on-surface-variant">
                {role === "reviewer"
                  ? "Reviewer"
                  : role === "coordinator"
                  ? "Coordinator"
                  : "Author"}
              </p>
            </div>
          </div>
        </div>

        {/* AI Preferences (reviewer-only) */}
        {role === "reviewer" ? (
          <AIPreferencesPanel />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[40px] text-outline mb-4">
              lock
            </span>
            <p className="text-body-md text-on-surface-variant max-w-xs">
              AI assistant preferences are available for the Reviewer role only.
              Switch to Reviewer to configure these settings.
            </p>
          </div>
        )}

        {/* My Roles */}
        <section className="mt-10">
          <h2 className="font-headline text-title-lg text-on-surface mb-1">
            My Roles
          </h2>
          <p className="text-body-sm text-on-surface-variant mb-4">
            Manage your participation across Open4Review.
          </p>
          <div className="bg-surface-container-low rounded-lg px-4">
            {ROLE_DEFS.map((r) => (
              <RoleRow
                key={r.id}
                icon={r.icon}
                title={r.title}
                description={r.description}
                active={roles.includes(r.id)}
                comingSoon={r.comingSoon}
                onAdd={
                  r.id === "author"
                    ? handleAddAuthor
                    : r.id === "reviewer"
                    ? handleAddReviewer
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
