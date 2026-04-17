import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { IAnnotation, IRubricTemplate } from "../../../api/types";
import { AnnotationPopover } from "./AnnotationPopover";

interface MockOERRendererProps {
  annotations:        IAnnotation[];
  activeAnnotationId: string | null | undefined;
  rubricTemplate?:    IRubricTemplate;
  /** When true, disables new selections / annotation authoring (Block C report mode). */
  readOnly?: boolean;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SelectionCapture {
  selectedText: string;
  rects:  HighlightRect[];  // content-relative coords
  viewX:  number;           // relative to outerRef (for toolbar / popover)
  viewY:  number;
}

interface HoverState {
  annotation: IAnnotation;
  viewX: number;
  viewY: number;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MockOERRenderer({
  annotations,
  activeAnnotationId,
  rubricTemplate,
  readOnly = false,
}: MockOERRendererProps) {
  const outerRef   = useRef<HTMLDivElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [selection, setSelection] = useState<SelectionCapture | null>(null);
  const [pending,   setPending]   = useState<SelectionCapture | null>(null);
  const [hovered,   setHovered]   = useState<HoverState | null>(null);

  // ── Bi-directional nav: scroll to annotation anchor ───────────────────────
  useEffect(() => {
    if (!activeAnnotationId || !scrollRef.current) return;
    const ann = annotations.find((a) => a.id === activeAnnotationId);
    if (!ann?.anchor.rects.length) return;
    const target = ann.anchor.rects[0].top - 120;
    scrollRef.current.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [activeAnnotationId, annotations]);

  // ── Clear selection on outside click ──────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = e.target as Node;
      // Keep selection if clicking inside the toolbar or popover
      const toolbar = document.getElementById("oer-floating-toolbar");
      const popover = document.getElementById("oer-annotation-popover");
      if (toolbar?.contains(el) || popover?.contains(el)) return;
      setSelection(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Capture text selection on mouseup ─────────────────────────────────────
  function handleMouseUp(e: ReactMouseEvent<HTMLDivElement>) {
    if (readOnly) return;
    if (pending) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }

    const outer   = outerRef.current;
    const content = contentRef.current;
    if (!outer || !content) return;

    const outerRect   = outer.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    const range    = sel.getRangeAt(0);
    const rawRects = Array.from(range.getClientRects());

    // Store rects relative to contentRef (content-space coords).
    // Both rawRect and contentRect are viewport-relative at the same instant,
    // so the subtraction gives stable content-relative coordinates that remain
    // correct after the user scrolls.
    const rects: HighlightRect[] = rawRects
      .filter((r) => r.width > 2 && r.height > 2)
      .map((r) => ({
        top:    r.top    - contentRect.top,
        left:   r.left   - contentRect.left,
        width:  r.width,
        height: r.height,
      }));

    if (!rects.length) { setSelection(null); return; }

    setSelection({
      selectedText: sel.toString().trim(),
      rects,
      viewX: e.clientX - outerRect.left,
      viewY: e.clientY - outerRect.top,
    });
  }

  // ── Virtual hover: map mouse position to annotation highlights ────────────
  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    if (readOnly) return;
    if (selection || pending) return;
    const content = contentRef.current;
    const outer   = outerRef.current;
    const scroll  = scrollRef.current;
    if (!content || !outer || !scroll) return;

    const contentRect = content.getBoundingClientRect();
    const outerRect   = outer.getBoundingClientRect();

    // Mouse position in content-space
    const mx = e.clientX - contentRect.left;
    const my = e.clientY - contentRect.top;

    for (const ann of annotations) {
      for (const rect of ann.anchor.rects) {
        if (
          mx >= rect.left && mx <= rect.left + rect.width &&
          my >= rect.top  && my <= rect.top  + rect.height
        ) {
          setHovered({
            annotation: ann,
            viewX: e.clientX - outerRect.left,
            viewY: e.clientY - outerRect.top,
          });
          return;
        }
      }
    }
    setHovered(null);
  }

  const activeCapture = selection ?? pending;

  return (
    // outerRef: position:relative, no overflow — anchors absolute children
    <div ref={outerRef} className="relative h-full overflow-hidden bg-[#F4F1EA]">

      {/* ── Scrollable reading pane ──────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto"
        onMouseUp={readOnly ? undefined : handleMouseUp}
        onMouseMove={readOnly ? undefined : handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        {/* contentRef: position:relative, so absolute highlights anchor here */}
        <div ref={contentRef} className="relative max-w-2xl mx-auto px-8 pt-10 pb-24">

          {/* ── OER book content ─────────────────────────────────────────── */}
          <OERContent />

          {/* ── Persistent annotation highlights ─────────────────────────── */}
          {annotations.map((ann) =>
            ann.anchor.rects.map((rect, i) => (
              <div
                key={`${ann.id}-${i}`}
                className={[
                  "absolute pointer-events-none annotation-highlight",
                  activeAnnotationId === ann.id ? "active" : "",
                ].join(" ")}
                style={{
                  top:    rect.top,
                  left:   rect.left,
                  width:  rect.width,
                  height: rect.height,
                }}
              />
            ))
          )}

          {/* ── Live selection / pending preview highlights ────────────────── */}
          {activeCapture?.rects.map((rect, i) => (
            <div
              key={`sel-${i}`}
              className="absolute pointer-events-none"
              style={{
                top:             rect.top,
                left:            rect.left,
                width:           rect.width,
                height:          rect.height,
                backgroundColor: "rgba(254, 214, 91, 0.55)",
                borderRadius:    "2px",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Floating action toolbar (appears on text selection) ──────────── */}
      {selection && !pending && (
        <FloatingToolbar
          id="oer-floating-toolbar"
          viewX={selection.viewX}
          viewY={selection.viewY}
          // Toolbar positioning reads live container width; ref is stable for this paint.
          // eslint-disable-next-line react-hooks/refs -- measured width for popover clamping
          containerWidth={outerRef.current?.offsetWidth ?? 600}
          onAnnotate={() => {
            setPending(selection);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
          onDismiss={() => {
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        />
      )}

      {/* ── Annotation creation popover ──────────────────────────────────── */}
      {pending && (
        <div id="oer-annotation-popover">
          <AnnotationPopover
            containerRef={outerRef}
            selectedText={pending.selectedText}
            rects={pending.rects}
            anchorType="web"
            popoverX={pending.viewX}
            popoverY={pending.viewY}
            rubricTemplate={rubricTemplate}
            onSave={() => setPending(null)}
            onCancel={() => setPending(null)}
          />
        </div>
      )}

      {/* ── Hover tooltip for existing annotations ───────────────────────── */}
      {hovered && !selection && !pending && (
        <AnnotationTooltip
          annotation={hovered.annotation}
          viewX={hovered.viewX}
          viewY={hovered.viewY}
          rubricTemplate={rubricTemplate}
          // eslint-disable-next-line react-hooks/refs -- measured dimensions for tooltip placement
          containerWidth={outerRef.current?.offsetWidth ?? 600}
          // eslint-disable-next-line react-hooks/refs
          containerHeight={outerRef.current?.offsetHeight ?? 400}
        />
      )}
    </div>
  );
}

// ─── Floating toolbar ─────────────────────────────────────────────────────────

function FloatingToolbar({
  id,
  viewX,
  viewY,
  containerWidth,
  onAnnotate,
  onDismiss,
}: {
  id: string;
  viewX: number;
  viewY: number;
  containerWidth: number;
  onAnnotate: () => void;
  onDismiss: () => void;
}) {
  const TOOLBAR_W = 188;
  const left = Math.min(viewX - 8, containerWidth - TOOLBAR_W - 8);
  const top  = Math.max(8, viewY - 48);

  return (
    <div
      id={id}
      className="absolute z-40 flex items-center gap-0.5 rounded-md bg-primary shadow-ambient overflow-hidden"
      style={{ left: Math.max(8, left), top }}
    >
      <button
        onMouseDown={(e) => e.preventDefault()} // prevent blur / selection loss
        onClick={onAnnotate}
        className="flex items-center gap-1.5 px-3 py-2 text-on-primary hover:bg-white/10 transition-colors"
      >
        <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>
          ink_highlighter
        </span>
        <span className="text-label-sm font-label font-semibold uppercase tracking-widest">
          Add Evidence
        </span>
      </button>
      <div className="w-px h-6 bg-white/20" />
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={onDismiss}
        className="px-2.5 py-2 text-on-primary/70 hover:text-on-primary hover:bg-white/10 transition-colors"
      >
        <span className="material-symbols-outlined text-[15px]">close</span>
      </button>
    </div>
  );
}

// ─── Hover tooltip ────────────────────────────────────────────────────────────

function AnnotationTooltip({
  annotation,
  viewX,
  viewY,
  rubricTemplate,
  containerWidth,
  containerHeight,
}: {
  annotation: IAnnotation;
  viewX: number;
  viewY: number;
  rubricTemplate?: IRubricTemplate;
  containerWidth: number;
  containerHeight: number;
}) {
  const TOOLTIP_W = 256;
  const TOOLTIP_H = 100;
  const criterion = rubricTemplate?.criteria.find((c) => c.id === annotation.criterionId);

  let left = viewX + 12;
  let top  = viewY - 8;
  if (left + TOOLTIP_W > containerWidth - 8)  left = viewX - TOOLTIP_W - 12;
  if (top  + TOOLTIP_H > containerHeight - 8) top  = viewY - TOOLTIP_H - 8;

  return (
    <div
      className="absolute z-50 pointer-events-none w-64 bg-surface-container-lowest rounded-sm shadow-ambient overflow-hidden"
      style={{ left: Math.max(8, left), top: Math.max(8, top) }}
    >
      <div className="px-3 py-2 bg-surface-container-low">
        <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary truncate">
          {criterion ? `${criterion.id}: ${criterion.title}` : annotation.criterionId}
        </p>
      </div>
      <div className="px-3 py-2">
        <p className="text-body-sm text-on-surface line-clamp-3">{annotation.comment}</p>
      </div>
    </div>
  );
}

// ─── OER Book Content ─────────────────────────────────────────────────────────
// Simulates Chapter 3 of "Quantum Mechanics: An Open Resource" — chosen because
// it naturally surfaces accessibility evaluation opportunities: heading hierarchy,
// figure alt text, equation accessibility, callout structure, list formatting.

function OERContent() {
  return (
    <article className="font-['Newsreader',Georgia,serif] text-[#1c1c18] leading-relaxed select-text">

      {/* ── Chapter header ─────────────────────────────────────────────── */}
      <header className="mb-10">
        <p className="text-label-sm font-['Inter',system-ui,sans-serif] font-semibold uppercase tracking-[0.2em] text-[#735c00] mb-2">
          Chapter 3
        </p>
        <h1 className="text-4xl font-bold leading-tight text-[#041627] mb-4">
          Wave–Particle Duality and Quantum Uncertainty
        </h1>
        <p className="text-lg text-[#41403c] font-['Inter'] leading-relaxed max-w-xl">
          This chapter examines the foundational experimental evidence for quantum behavior,
          including the double-slit experiment, de Broglie matter waves, and Heisenberg's
          uncertainty principle.
        </p>
        <div className="mt-6 h-px bg-[#e8e4da]" />
      </header>

      {/* ── Learning Objectives callout ───────────────────────────────── */}
      <section className="mb-8 p-5 bg-[#f0ece0] rounded-sm" aria-labelledby="obj-heading">
        <h2 id="obj-heading" className="text-label-sm font-['Inter'] font-semibold uppercase tracking-widest text-[#735c00] mb-3">
          Learning Objectives
        </h2>
        <ul className="space-y-1.5 text-base text-[#41403c]">
          {[
            "Describe the experimental basis for wave–particle duality.",
            "Apply de Broglie's relation λ = h/p to calculate matter wavelengths.",
            "State and interpret the Heisenberg uncertainty principle.",
            "Explain the measurement problem in the context of the double-slit experiment.",
          ].map((obj, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#735c00] flex-shrink-0" />
              {obj}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Section 3.1 ───────────────────────────────────────────────── */}
      <section className="mb-8" data-section="3.1">
        <h2 className="text-2xl font-bold text-[#041627] mb-4">
          3.1&nbsp;&nbsp;Introduction to Wave–Particle Duality
        </h2>
        <p className="text-base mb-4">
          The foundations of quantum mechanics challenge our classical intuitions about the
          nature of matter and light. At the macroscopic scale, we readily distinguish between
          particles—localized objects with definite positions—and waves—extended disturbances
          that propagate through a medium. Classical physics treats these as fundamentally
          different phenomena. Yet at the quantum scale, this distinction breaks down completely.
        </p>
        <p className="text-base mb-4">
          The concept of wave–particle duality emerged from a series of experiments in the early
          twentieth century that could not be explained by classical physics. The photoelectric
          effect, first explained by Einstein in 1905, demonstrated that light behaves as discrete
          particles (photons) when interacting with matter, with each photon carrying energy
          E = hf, where h is Planck's constant and f is the frequency of the light.
        </p>
        <p className="text-base">
          Yet Young's double-slit experiment, which had convincingly demonstrated the wave nature
          of light since 1801, remained equally valid. Light is neither purely a wave nor purely
          a particle; it is a quantum entity that exhibits properties of both, depending entirely
          on which experimental question we ask.
        </p>
      </section>

      {/* ── Section 3.2 ───────────────────────────────────────────────── */}
      <section className="mb-8" data-section="3.2">
        <h2 className="text-2xl font-bold text-[#041627] mb-4">
          3.2&nbsp;&nbsp;The Double-Slit Experiment
        </h2>
        <p className="text-base mb-4">
          The double-slit experiment is perhaps the most profound demonstration of quantum
          behavior. When a beam of electrons is directed at a barrier with two narrow slits,
          the electrons detected on a screen behind the barrier do not form two bands, as
          classical particles would. Instead, they form an interference pattern—alternating
          bright and dark fringes—characteristic of waves.
        </p>

        {/* Figure — deliberate accessibility gap for annotation */}
        <figure className="my-6 p-4 bg-[#ede9dd] rounded-sm" aria-label="Figure 3.1">
          <div className="h-32 flex items-center justify-center bg-[#e4dfd0] rounded-sm mb-3 text-[#735c00]">
            <div className="text-center">
              <span className="material-symbols-outlined text-[32px] block mb-1">science</span>
              <span className="font-['Inter'] text-label-sm uppercase tracking-widest">Figure 3.1</span>
            </div>
          </div>
          <figcaption className="text-sm text-[#5c5a54] font-['Inter'] leading-snug">
            <strong>Figure 3.1</strong> — Electron double-slit interference pattern.
            Horizontal axis: detector position. Vertical axis: electron count.
            Slit separation d = 0.5 μm; slit width a = 0.1 μm; electron energy 50 keV.
          </figcaption>
        </figure>

        <p className="text-base mb-4">
          What makes this result remarkable is that the pattern persists even when electrons
          are sent through the apparatus one at a time. Each individual electron lands at a
          single, definite location on the screen, producing a discrete click in the detector.
          Yet over many thousands of such events, the accumulating distribution of landing
          positions traces out an unmistakable interference pattern.
        </p>
        <p className="text-base mb-4">
          This means the interference is not between different electrons: each electron in some
          sense passes through both slits simultaneously and interferes with itself. The electron's
          wave function—a mathematical description of its quantum state—propagates through both
          openings and produces the interference pattern as a probability distribution.
        </p>

        {/* Callout — measurement problem */}
        <div className="my-6 p-5 bg-[#fdf8ee] border-l-4 border-[#735c00]" role="note" aria-label="Key insight">
          <p className="text-label-sm font-['Inter'] font-semibold uppercase tracking-widest text-[#735c00] mb-2">
            Key Insight
          </p>
          <p className="text-base">
            When a detector is placed at one of the slits to determine which slit the electron
            passed through, the interference pattern <em>disappears</em>. The act of measurement
            forces the electron into a definite state, collapsing the wave-like superposition
            into a definite trajectory. This "measurement problem" remains one of the deepest
            open questions in quantum foundations.
          </p>
        </div>
      </section>

      {/* ── Section 3.3 ───────────────────────────────────────────────── */}
      <section className="mb-8" data-section="3.3">
        <h2 className="text-2xl font-bold text-[#041627] mb-4">
          3.3&nbsp;&nbsp;De Broglie's Hypothesis and Matter Waves
        </h2>
        <p className="text-base mb-4">
          In 1924, Louis de Broglie proposed a radical extension of wave–particle duality:
          not only does light exhibit particle properties, but all matter—including electrons,
          atoms, and in principle any massive object—possesses wave properties. The de Broglie
          wavelength of a particle with momentum p is given by:
        </p>

        {/* Equation block */}
        <div
          className="my-5 px-8 py-4 bg-[#ede9dd] rounded-sm text-center"
          role="math"
          aria-label="De Broglie wavelength equation: lambda equals h divided by p"
        >
          <p className="text-2xl tracking-wider text-[#041627]">
            λ = <em>h</em> / <em>p</em>
          </p>
          <p className="text-sm font-['Inter'] text-[#5c5a54] mt-2">
            where h = 6.626 × 10⁻³⁴ J·s (Planck's constant) and p is the particle's momentum.
          </p>
        </div>

        <p className="text-base mb-4">
          For a baseball of mass 0.145 kg moving at 30 m/s, the de Broglie wavelength is
          approximately 1.5 × 10⁻³⁴ m—a scale far smaller than any physically measurable
          length, which explains why we observe no wave behavior in everyday objects. For an
          electron with kinetic energy of 50 eV, however, the wavelength is approximately
          0.17 nm—comparable to the spacing between atoms in a crystal lattice.
        </p>
        <p className="text-base">
          De Broglie's prediction was experimentally confirmed in 1927 by Clinton Davisson and
          Lester Germer, who observed the diffraction of electrons reflecting from a nickel
          crystal surface—exactly the pattern one would expect if electrons had a wavelength
          comparable to the crystal's lattice spacing of 0.215 nm. The experiment earned
          de Broglie the Nobel Prize in Physics in 1929.
        </p>
      </section>

      {/* ── Section 3.4 ───────────────────────────────────────────────── */}
      <section className="mb-8" data-section="3.4">
        <h2 className="text-2xl font-bold text-[#041627] mb-4">
          3.4&nbsp;&nbsp;The Heisenberg Uncertainty Principle
        </h2>
        <p className="text-base mb-4">
          The wave nature of quantum particles has a profound consequence for measurement.
          A classical particle can, in principle, have a perfectly well-defined position and
          momentum simultaneously—we simply measure each with sufficient precision. For a
          quantum particle, however, the uncertainty principle (formulated by Werner Heisenberg
          in 1927) establishes a fundamental limit on the simultaneous precision of conjugate
          observables:
        </p>

        <div
          className="my-5 px-8 py-4 bg-[#ede9dd] rounded-sm text-center"
          role="math"
          aria-label="Heisenberg uncertainty principle: delta x times delta p is greater than or equal to h-bar over 2"
        >
          <p className="text-2xl tracking-wider text-[#041627]">
            Δx · Δp ≥ ℏ/2
          </p>
          <p className="text-sm font-['Inter'] text-[#5c5a54] mt-2">
            where ℏ = h/2π ≈ 1.055 × 10⁻³⁴ J·s is the reduced Planck constant.
          </p>
        </div>

        <p className="text-base mb-4">
          This relationship tells us that the more precisely we determine a particle's position
          (small Δx), the greater the irreducible uncertainty in its momentum (large Δp), and
          vice versa. Crucially, this is not a statement about the limitations of our measuring
          instruments. Even with a hypothetically perfect apparatus, the uncertainty principle
          would still hold.
        </p>

        <div className="my-6 p-5 bg-[#fdf8ee] border-l-4 border-[#735c00]" role="note" aria-label="Important clarification">
          <p className="text-label-sm font-['Inter'] font-semibold uppercase tracking-widest text-[#735c00] mb-2">
            Important Clarification
          </p>
          <p className="text-base">
            The uncertainty principle is a statement about quantum states, not about experimental
            limitations. It reflects a fundamental feature of physical reality at the quantum scale:
            a particle localized in a small region of space must—by the mathematics of Fourier
            analysis—be described by a broad superposition of wavelengths and therefore momenta.
            Position and momentum are not simultaneously well-defined properties of a quantum system.
          </p>
        </div>
      </section>

      {/* ── Section 3.5 ───────────────────────────────────────────────── */}
      <section className="mb-8" data-section="3.5">
        <h2 className="text-2xl font-bold text-[#041627] mb-4">
          3.5&nbsp;&nbsp;Key Terms
        </h2>
        <dl className="space-y-4">
          {[
            {
              term: "Wave–particle duality",
              def: "The principle that quantum objects exhibit characteristics of both classical waves and classical particles, depending on the experimental context in which they are observed.",
            },
            {
              term: "Interference pattern",
              def: "The spatial distribution of alternating constructive and destructive wave superpositions, producing characteristic bright and dark fringes on a detection screen.",
            },
            {
              term: "De Broglie wavelength",
              def: "The wavelength λ = h/p associated with any moving particle of momentum p. Decreases with increasing momentum; observable only for particles with very small mass or high speed.",
            },
            {
              term: "Heisenberg uncertainty principle",
              def: "The fundamental quantum mechanical constraint Δx · Δp ≥ ℏ/2 on the simultaneous precision of position and momentum measurements.",
            },
            {
              term: "Wave function collapse",
              def: "The non-unitary change in the quantum state of a system that occurs when a measurement is made, projecting the superposition onto a definite eigenstate.",
            },
          ].map(({ term, def }) => (
            <div key={term} className="flex gap-4">
              <dt className="font-bold text-[#041627] w-52 flex-shrink-0">{term}</dt>
              <dd className="text-base text-[#41403c]">{def}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Section 3.6 ───────────────────────────────────────────────── */}
      <section className="mb-2" data-section="3.6">
        <h2 className="text-2xl font-bold text-[#041627] mb-4">
          3.6&nbsp;&nbsp;Review Questions
        </h2>
        <ol className="list-decimal list-inside space-y-4 text-base text-[#41403c]">
          <li>
            An electron is accelerated through a potential difference of 100 V.
            Calculate its de Broglie wavelength and compare it to the wavelength
            of visible light (400–700 nm).
          </li>
          <li>
            In a double-slit experiment with photons, describe what happens to
            the interference pattern if a "which-path" detector is placed at one
            slit. Explain this result in terms of wave function collapse and the
            uncertainty principle.
          </li>
          <li>
            If an electron is confined to a region of 0.1 nm (approximately the
            size of a hydrogen atom), what is the minimum uncertainty in its
            momentum implied by the uncertainty principle? What minimum kinetic
            energy does this imply for the electron?
          </li>
          <li>
            Davisson and Germer used electrons with kinetic energy K<sub>e</sub>.
            Determine the value of K<sub>e</sub> that would produce a de Broglie
            wavelength equal to the interplanar spacing of nickel (d = 0.215 nm).
          </li>
        </ol>
      </section>

    </article>
  );
}
