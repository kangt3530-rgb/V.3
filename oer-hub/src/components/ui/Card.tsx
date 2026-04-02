import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Surface tier. Defaults to "lowest" (white, highest perceived lift) */
  surface?: "lowest" | "low" | "mid" | "high";
  shadow?: boolean;
}

const SURFACE_CLS: Record<string, string> = {
  lowest: "bg-surface-container-lowest",
  low:    "bg-surface-container-low",
  mid:    "bg-surface-container",
  high:   "bg-surface-container-high",
};

export function Card({
  children,
  surface = "lowest",
  shadow = true,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={[
        SURFACE_CLS[surface],
        "rounded-md",
        shadow ? "shadow-card" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
