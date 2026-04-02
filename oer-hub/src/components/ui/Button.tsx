import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;          // Material Symbol name
  iconPosition?: "left" | "right";
  children?: ReactNode;
}

const VARIANT_CLS: Record<Variant, string> = {
  primary:   "bg-primary text-on-primary hover:bg-primary-container active:opacity-90 shadow-card",
  secondary: "bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim",
  ghost:     "bg-transparent text-on-surface-variant hover:bg-surface-container-high",
  danger:    "bg-error-container text-on-error-container hover:opacity-90",
};

const SIZE_CLS: Record<Size, string> = {
  sm: "px-3 py-1.5 text-label-md gap-1.5",
  md: "px-5 py-2.5 text-label-lg gap-2",
  lg: "px-7 py-3   text-body-md  gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center font-label font-semibold uppercase tracking-widest",
        "rounded-md transition-all duration-150 select-none",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANT_CLS[variant],
        SIZE_CLS[size],
        className,
      ].join(" ")}
    >
      {icon && iconPosition === "left" && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      )}
    </button>
  );
}
