/**
 * Design tokens — single source of truth.
 * All values mirror the Tailwind config. Components use Tailwind class names,
 * this file is used for any imperative style calculations (e.g. canvas, SVG).
 */

export const colors = {
  primary:               "#041627",
  onPrimary:             "#ffffff",
  primaryContainer:      "#1a2b3c",
  secondary:             "#735c00",
  secondaryContainer:    "#fed65b",
  surface:               "#f4f1ea",
  surfaceBright:         "#fcf9f2",
  surfaceContainerLowest:"#ffffff",
  surfaceContainerLow:   "#f6f3ec",
  surfaceContainer:      "#f1eee7",
  surfaceContainerHigh:  "#ebe8e1",
  surfaceContainerHighest:"#e5e2db",
  onSurface:             "#1c1c18",
  onSurfaceVariant:      "#44474c",
  outline:               "#74777d",
  outlineVariant:        "#c4c6cd",
  error:                 "#ba1a1a",
  annotationHighlight:   "rgba(254, 214, 91, 0.45)",
  annotationActive:      "rgba(254, 214, 91, 0.75)",
} as const;

export const shadows = {
  ambient: "0 12px 40px rgba(28, 28, 24, 0.06)",
  card:    "0 4px 16px rgba(28, 28, 24, 0.04)",
  panel:   "0 2px 8px rgba(28, 28, 24, 0.05)",
} as const;

export const layout = {
  topNavHeight:  64,    // px
  defaultSplit:  0.65,  // left pane ratio (65/35)
  focusSplit:    0.50,  // adaptive layout when rubric focused
  minSplitLeft:  0.30,
  maxSplitLeft:  0.80,
} as const;

export const transitions = {
  split:  "grid-template-columns 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  colors: "color 150ms ease, background-color 150ms ease",
} as const;
