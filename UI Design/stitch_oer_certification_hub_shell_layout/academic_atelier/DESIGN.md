# Design System: Editorial Excellence for OER Certification

## 1. Overview & Creative North Star: "The Modern Archivist"
This design system is built upon the Creative North Star of **The Modern Archivist**. It rejects the sterile, "bootstrap" aesthetic of typical B2B platforms in favor of an interface that feels like a high-end digital atelier. We are blending the prestige of academic heritage—the weight of ink on pearl-white paper—with the frictionless utility of modern minimalism.

The layout philosophy leverages **Intentional Asymmetry**. By utilizing a split-pane workspace and varied content densities, we move away from the rigid, predictable grid. Instead, we use high-contrast typography scales and overlapping "layered" surfaces to guide the user’s eye through complex certification workflows with editorial grace.

---

## 2. Colors: Tonal Depth & The No-Line Rule
The palette is rooted in #F4F1EA (Pearl White), providing a warm, scholarly foundation that reduces eye strain compared to pure digital white.

### The "No-Line" Rule
To achieve a premium, custom feel, **1px solid borders are prohibited for sectioning.** Traditional dividers are replaced by:
- **Background Color Shifts:** Using the `surface-container` tiers to define functional zones.
- **Tonal Transitions:** A transition from `surface` (#FCF9F2) to `surface-container-low` (#F6F3EC) is sufficient to denote a sidebar or utility pane.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical materials.
- **Base Layer:** `surface` (#FCF9F2) for main backgrounds.
- **Nesting:** Place `surface-container-lowest` (#FFFFFF) cards atop `surface-container-low` sections. This creates a natural "lift" that mimics fine stationery.
- **Signature Textures:** For high-impact CTAs or "Pro" features, use subtle linear gradients transitioning from `primary` (#041627) to `primary-container` (#1A2B3C).

### Glassmorphism
Floating elements (e.g., hover menus, toast notifications) should utilize a backdrop-blur effect (12px–20px) combined with a semi-transparent `surface-variant` color. This ensures the UI feels integrated and ethereal rather than "pasted on."

---

## 3. Typography: The Editorial Voice
Our typography pairing is designed to convey both authority and accessibility.

*   **Display & Headlines (Newsreader/Serif):** These are our "Heritage" anchors. Use `display-lg` (3.5rem) for hero titles and `headline-md` (1.75rem) for section headers. The serif high-contrast strokes evoke the feel of a published journal.
*   **Body & UI (Inter/Sans-Serif):** All functional text, labels, and long-form certification criteria use Inter. It provides the "Modern" counter-balance, ensuring maximum readability at `body-md` (0.875rem).
*   **Hierarchy:** Use the `secondary` color (#735C00) sparingly for `label-md` elements to highlight "In Progress" or "Verified" statuses, creating a gold-leaf metadata effect.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to hide poor layout; we use them to simulate natural, ambient light.

*   **The Layering Principle:** Depth is primarily achieved via color. A `surface-container-high` header sitting above a `surface` body provides enough contrast to imply depth without a single shadow pixel.
*   **Ambient Shadows:** For floating cards, use a "Large & Diffuse" shadow: `box-shadow: 0 12px 40px rgba(28, 28, 24, 0.06);`. The shadow color is a tinted version of `on-surface`, never pure black.
*   **The Ghost Border Fallback:** If a container lacks enough contrast against its parent, use a "Ghost Border": `outline-variant` (#C4C6CD) at **15% opacity**. This creates a suggestion of an edge without creating visual noise.

---

## 5. Components

### Primary Buttons
Large, high-contrast blocks.
- **Style:** Background: `primary` (#041627); Text: `on-primary` (#FFFFFF).
- **Radius:** `md` (0.375rem) for a crisp, professional corner.
- **Interaction:** On hover, transition to `primary-container` with a subtle elevation increase.

### Cards & Workspaces
- **Rule:** Forbid divider lines within cards.
- **Spacing:** Use `spacing-6` (2rem) as the default internal padding. Separate the "Header" of a card from the "Body" using a background shift to `surface-container-low` for the header area.

### Input Fields
- **Style:** "Underlined" style or "Ghost Fill." 
- **Active State:** A 2px bottom border in `secondary` (#735C00). This mimics a highlighter or a gold nib pen marking a document.

### AI Sidekick / Split-Pane Components
- **Style:** Use `surface-container-high` for the secondary pane. 
- **Typography:** Use `title-sm` (1rem) for metadata labels to maintain a compact, "audit-log" feel.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical spacing (e.g., `spacing-12` on the left, `spacing-8` on the right) in the Split-pane workspace to create an editorial flow.
*   **Do** use "White Space" as a functional separator. If two elements feel cluttered, add `spacing-10` rather than a line.
*   **Do** ensure all `Newsreader` (Serif) text has adequate line-height (1.4–1.5) to maintain its academic elegance.

### Don't:
*   **Don't** use 100% opaque borders. It breaks the "Modern Archivist" illusion.
*   **Don't** use high-intensity shadows. If a shadow is noticeable, it is too dark.
*   **Don't** mix the serif and sans-serif within a single line of text. The serif is for "Reading," the sans-serif is for "Doing."
*   **Don't** use pure #000000. Always use `primary` (#041627) or `on-surface` (#1C1C18) to maintain the "Ink and Paper" warmth.