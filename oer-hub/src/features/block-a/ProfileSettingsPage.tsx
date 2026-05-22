import { useSessionStore } from "../../store/sessionStore";
import { AIPreferencesPanel } from "../block-b/AIPane/AIPreferencesPanel";

export function ProfileSettingsPage() {
  const role = useSessionStore((s) => s.role);
  const displayName = useSessionStore((s) => s.displayName);

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
                {role === "reviewer" ? "Reviewer" : role === "coordinator" ? "Coordinator" : "Author"}
              </p>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
}
