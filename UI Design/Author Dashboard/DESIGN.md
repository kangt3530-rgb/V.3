# Design System Strategy: The Scholarly Archive

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Atelier."** 

This is not a standard web portal; it is a curated space of academic rigor and craftsmanship. We are moving away from the "software-as-a-service" aesthetic and toward a "university-press-as-a-service" experience. The interface should feel like physical parchment sheets laid out on a clean oak desk—tactile, high-contrast, and intellectually quiet.

To break the "template" look, we utilize **intentional asymmetry**. Align large display headers to the far left while keeping body copy in a narrower, scholarly column to the right. Use the "white space" not as empty room, but as a structural material that guides the eye.

## 2. Colors: The Parchment & Charcoal Palette
The palette is grounded in high-contrast legibility and archival warmth.

*   **Primary (#07131e / #1c2833):** Our "Ink." Used for all critical text and structural weight.
*   **Surface (#faf9f6):** Our "Parchment." This is the foundation of the entire experience. It is warmer than pure white, reducing eye strain and suggesting a physical medium.
*   **Secondary (#715c1f / #c1a661):** Our "Muted Brass." This is a signature accent. Use it sparingly for interactive highlights, "Verified" statuses, or subtle brand moments.

### The "No-Line" Rule
Standard UI relies on 1px borders to separate sections. In this design system, **1px solid borders for sectioning are prohibited.** 
Boundaries must be defined through background color shifts. For example, a sidebar should not be "bordered off"; it should be rendered in `surface-container-low` (#f4f3f1) sitting directly against the `surface` (#faf9f6) background.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked paper sheets. 
*   **Level 1 (Base):** `surface` (#faf9f6)
*   **Level 2 (In-set Content):** `surface-container-low` (#f4f3f1)
*   **Level 3 (Interactive Cards):** `surface-container-lowest` (#ffffff)
This creates a natural, soft lift. By nesting a slightly lighter container inside a darker one, you define hierarchy without visual clutter.

### The "Glass & Gradient" Rule
To add a layer of "Atelier" sophistication, use **Glassmorphism** for floating navigation bars or modal overlays. Utilize the `surface` color at 80% opacity with a `backdrop-blur` of 12px. For main CTAs, apply a subtle linear gradient from `primary` (#07131e) to `primary-container` (#1c2833) to give the "ink" a rich, pressurized depth.

## 3. Typography: The Editorial Voice
Our typography mimics the hierarchy of a prestigious academic journal.

*   **The Authority (Display/Headline):** **Noto Serif.** This is our "Masthead" font. Use it for page titles and major section headers. It should feel grand and established.
*   **The Narrative (Body/Title):** **Newsreader.** Selected for its high-legibility at long lengths. It carries the "Editorial" weight of the certification hub.
*   **The Metadata (Label/UI):** **Inter (Uppercase).** All UI elements (buttons, tags, table headers) must be in Inter Uppercase with a letter-spacing of 0.05em. This creates a sharp, technical contrast against the fluid serifs, signaling "functional data."

## 4. Elevation & Depth: Tonal Layering
We reject the heavy, blurry shadows of "Material" defaults in favor of high-end tonal layering.

*   **The Layering Principle:** Depth is achieved by "stacking" tones. Place a `surface-container-highest` element behind a `surface` element to create a recessed effect.
*   **Ambient Shadows:** If an element must float (like a dropdown menu), use an extremely diffused shadow: `0px 12px 32px rgba(28, 40, 51, 0.06)`. The shadow color is a tint of our Charcoal Ink, never pure black.
*   **The "Ghost Border" Fallback:** If a container needs more definition (e.g., a card on a background of the same color), use a "Ghost Border": `1px solid` using the `outline-variant` (#c4c6cb) at **15% opacity**. It should be felt, not seen.
*   **The Sharp Edge:** All corners are **0px (Sharp)**. No exceptions. This communicates architectural precision and formal authority.

## 5. Components

### Buttons
*   **Primary:** Solid `primary-container` (#1c2833), white `inter` uppercase text. 0px border radius.
*   **Secondary:** Ghost style. `1px solid outline` (#74777c) at 20% opacity. `primary` text.
*   **Tertiary/Link:** `secondary` (#715c1f) text with a 1px underline that only appears on hover.

### Cards & Lists
*   **Forbid Divider Lines:** Never use a horizontal rule `<hr>` to separate list items. Use 24px–32px of vertical white space or a subtle shift to `surface-container-low` for every second item.
*   **Certification Cards:** Use a `surface-container-lowest` (#ffffff) background with a "Ghost Border" to make the parchment feel premium and thick.

### Input Fields
*   **The "Minimalist Ledger" Style:** Inputs should not be boxes. They should be a simple bottom-border (1px, `outline`) with the label in Inter Uppercase (#44474b) floating above.

### Editorial Signature Components
*   **The Marginalia:** Use the far right or left margins for small `label-sm` notes in `secondary` (Brass).
*   **The Seal:** A unique component for OER certification badges—rendered as a thin-line SVG circle with `notoSerif` text inside.

## 6. Do's and Don'ts

### Do
*   **Do** use extreme margins. Let the content breathe like a well-designed book.
*   **Do** mix your typography. A `display-lg` header in Serif next to a `label-md` date in Sans-Serif creates a premium editorial tension.
*   **Do** use "Brass" (#c1a661) for success states and "Gold" achievements rather than generic green.

### Don't
*   **Don't** use rounded corners. Everything must be 90-degree angles to maintain the "Atelier" architectural feel.
*   **Don't** use "Alert Red" for everything. Use `error_container` (#ffdad6) for subtle warnings to avoid breaking the calm aesthetic.
*   **Don't** use standard "Drop Shadows." If it doesn't look like paper on a table, it’s too heavy.