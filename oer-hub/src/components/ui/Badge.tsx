import type { OerStatus } from "../../api/types";

interface BadgeProps {
  status: OerStatus | "available" | "claimed" | "in_progress" | "completed" | "mediation";
  className?: string;
}

const CONFIG: Record<string, { label: string; cls: string }> = {
  submitted:    { label: "Submitted",    cls: "bg-surface-container text-on-surface-variant" },
  under_review: { label: "Under Review", cls: "bg-primary-fixed/40 text-primary" },
  in_revision:  { label: "In Revision",  cls: "bg-secondary-container/60 text-secondary" },
  pending_verification: {
    label: "Pending Verification",
    cls: "bg-surface-container-high text-primary",
  },
  certified:    { label: "Certified",    cls: "bg-[#d4f0d4] text-[#1a5c1a]" },
  available:    { label: "Available",    cls: "bg-surface-container text-on-surface-variant" },
  claimed:      { label: "Claimed",      cls: "bg-primary-fixed/40 text-primary" },
  in_progress:  { label: "In Progress",  cls: "bg-secondary-container/60 text-secondary" },
  completed:    { label: "Completed",    cls: "bg-[#d4f0d4] text-[#1a5c1a]" },
  mediation:    { label: "Mediation",    cls: "bg-error-container text-error" },
};

export function Badge({ status, className = "" }: BadgeProps) {
  const { label, cls } = CONFIG[status] ?? CONFIG.submitted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-label-sm font-label font-semibold uppercase tracking-widest rounded-sm ${cls} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
