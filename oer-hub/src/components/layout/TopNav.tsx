import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSessionStore } from "../../store/sessionStore";
import { useRevisionStore } from "../../store/revisionStore";
import type { UserRole } from "../../api/types";

const ROLE_LABELS: Record<UserRole, string> = {
  author:      "Author",
  reviewer:    "Reviewer",
  coordinator: "Coordinator",
};

const ROLE_ROUTE: Record<UserRole, string> = {
  author:      "/reports/oer-001/disciplinary/read",
  reviewer:    "/reviewer",
  coordinator: "/coordinator",
};

export function TopNav() {
  const { role, displayName, setRole } = useSessionStore();
  const lastSaved = useRevisionStore((s) => s.lastSaved);
  const [roleOpen, setRoleOpen] = useState(false);
  const navigate = useNavigate();

  const savedTime = lastSaved
    ? new Date(lastSaved).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <header className="print-hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-8 h-16 bg-surface-container-low">
      {/* Left: Logo */}
      <div className="flex items-center gap-10">
        <Link to={ROLE_ROUTE[role]} className="flex items-center gap-2.5">
          <span className="w-6 h-6 flex items-center justify-center bg-primary rounded-sm">
            <span className="material-symbols-outlined text-on-primary text-[14px]">verified</span>
          </span>
          <span className="font-headline font-semibold text-title-md text-primary tracking-tight">
            OER Certification Hub
          </span>
        </Link>
      </div>

      {/* Right: Save indicator + Role switcher + Notifications + Avatar */}
      <div className="flex items-center gap-5">
        {/* Auto-save indicator */}
        {savedTime && (
          <div className="hidden sm:flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud_done
            </span>
            <span className="font-label uppercase tracking-widest">Saved {savedTime}</span>
          </div>
        )}

        {/* Role switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleOpen((o) => !o)}
            className="flex items-center gap-1.5 text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            {ROLE_LABELS[role]}
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>

          {roleOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest shadow-ambient rounded-md overflow-hidden z-50">
              {(["author", "reviewer", "coordinator"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRole(r);
                    setRoleOpen(false);
                    navigate(ROLE_ROUTE[r]);
                  }}
                  className={[
                    "w-full text-left px-4 py-3 text-body-sm transition-colors",
                    r === role
                      ? "bg-surface-container text-primary font-semibold"
                      : "text-on-surface hover:bg-surface-container-low",
                  ].join(" ")}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
          <span className="text-label-sm font-label font-bold text-on-primary-container">
            {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </span>
        </div>
      </div>
    </header>
  );
}
