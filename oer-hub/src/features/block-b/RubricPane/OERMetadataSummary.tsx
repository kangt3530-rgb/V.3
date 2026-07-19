import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  analyzeOER,
  getCachedMetadata,
  setCachedMetadata,
} from "../../../api/oerMetadata";
import type { OERMetadata } from "../../../api/oerMetadata";
import { useReviewStore } from "../../../store/reviewStore";

// ─── Label helpers ────────────────────────────────────────────────────────────

function fkglLabel(grade: number): string {
  if (grade < 6) return "Elementary Level";
  if (grade < 9) return "Middle School";
  if (grade < 13) return `Grade ${Math.round(grade)} · High School`;
  return "College Level";
}


// ─── Collapse persistence ────────────────────────────────────────────────────

const collapseKey = (taskId: string) => `r10_collapsed_${taskId}`;

// ─── Grade Level popover (portal-based) ──────────────────────────────────────

function GradeLevelPopover() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const popover = document.getElementById("fkgl-info-popover");
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !popover?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popoverWidth = 280;
      const gap = 8;
      const rightPosition = rect.right + window.scrollX + gap;
      const fitsOnRight = rightPosition + popoverWidth <= window.innerWidth;

      setPopPos({
        top: rect.top + window.scrollY,
        left: fitsOnRight
          ? rightPosition
          : Math.max(rect.left + window.scrollX - popoverWidth - gap, gap),
      });
    }
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Grade Level information"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="flex items-center text-on-surface-variant/60 hover:text-secondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded"
      >
        <span className="material-symbols-outlined text-[13px]">info</span>
      </button>
      {open &&
        createPortal(
          <div
            id="fkgl-info-popover"
            role="dialog"
            aria-label="Flesch-Kincaid Grade Level information"
            className="fixed z-[9999] max-w-[280px] bg-surface border border-outline-variant rounded-lg shadow-lg p-4"
            style={{
              top: popPos.top,
              left: popPos.left,
            }}
          >
            <p className="text-[12px] font-semibold text-on-surface mb-1.5">
              Flesch-Kincaid Grade Level
            </p>
            <p className="text-[13px] text-on-surface-variant leading-relaxed mb-2">
              Estimates the U.S. school grade level needed to understand the
              text. A score of 8.0 = 8th grade reading level. College-level is
              typically 13+.
            </p>
            <p className="text-[11px] font-semibold text-on-surface-variant mb-1">
              Score ranges:
            </p>
            <ul className="text-[13px] text-on-surface-variant space-y-0.5 mb-2">
              <li>≤ 6 — Elementary</li>
              <li>7–8 — Middle School</li>
              <li>9–12 — High School</li>
              <li>13–15 — College Level</li>
              <li>16+ — Graduate Level</li>
            </ul>
            <p className="text-[11px] text-on-surface-variant/50">
              Source: Kincaid, J.P. et al. (1975). Naval Technical Training
              Command.
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}

function SectionInfoPopover() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const popover = document.getElementById("sections-info-popover");
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !popover?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const popoverWidth = 260;
      const gap = 8;
      const rightPosition = rect.right + window.scrollX + gap;
      const fitsOnRight = rightPosition + popoverWidth <= window.innerWidth;

      setPopPos({
        top: rect.top + window.scrollY,
        left: fitsOnRight
          ? rightPosition
          : Math.max(rect.left + window.scrollX - popoverWidth - gap, gap),
      });
    }
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Sections information"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="flex items-center text-on-surface-variant/60 hover:text-secondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary rounded"
      >
        <span className="material-symbols-outlined text-[13px]">info</span>
      </button>
      {open &&
        createPortal(
          <div
            id="sections-info-popover"
            role="dialog"
            aria-label="Sections information"
            className="fixed z-[9999] max-w-[260px] bg-surface border border-outline-variant rounded-lg shadow-lg p-4"
            style={{
              top: popPos.top,
              left: popPos.left,
            }}
          >
            <p className="text-[12px] font-semibold text-on-surface mb-1.5">
              Sections
            </p>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              Sections are counted from heading structure (H1/H2 elements) in
              the document.
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}

// ─── Stat chip ───────────────────────────────────────────────────────────────

function Stat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className="material-symbols-outlined text-[14px] text-secondary flex-shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {icon}
      </span>
      <span className="text-[11px] text-on-surface-variant font-label uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span className="text-[11px] font-semibold text-on-surface truncate">
        {value}
      </span>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="mb-3 rounded-md bg-surface-container-low border border-outline-variant/10 p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3.5 h-3.5 rounded bg-outline-variant/30" />
        <div className="h-3 w-24 rounded bg-outline-variant/30" />
        <div className="ml-auto text-[10px] text-on-surface-variant/50 font-label tracking-wide">
          Analyzing OER…
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
        {[80, 72, 56, 44].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded bg-outline-variant/25"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="h-2.5 w-24 rounded bg-outline-variant/25" />
        <div className="h-5 w-10 rounded bg-outline-variant/20" />
        <div className="h-2 w-20 rounded bg-outline-variant/20" />
      </div>
    </div>
  );
}

// ─── Collapsed bar ────────────────────────────────────────────────────────────

function CollapsedBar({
  metadata,
  onExpand,
}: {
  metadata: OERMetadata;
  onExpand: () => void;
}) {
  const summary = [
    `~${metadata.estimatedReadingTimeMin} min read`,
    `${metadata.chapterCount} sections`,
    `Grade ${Math.round(metadata.fleschKincaidGrade)}`,
  ].join(" · ");

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label="Expand OER Snapshot"
      className="w-full mb-3 flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container transition-colors text-left group"
    >
      <span
        className="material-symbols-outlined text-[15px] text-secondary flex-shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        description
      </span>
      <span className="text-label-md font-label font-semibold uppercase tracking-widest text-on-surface flex-shrink-0">
        OER Snapshot
      </span>
      <span className="text-[11px] text-on-surface-variant truncate flex-1">
        {summary}
      </span>
      <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50 group-hover:text-on-surface transition-colors flex-shrink-0">
        expand_more
      </span>
    </button>
  );
}

// ─── Expanded card ────────────────────────────────────────────────────────────

function ExpandedCard({
  metadata,
  onCollapse,
}: {
  metadata: OERMetadata;
  onCollapse: () => void;
}) {
  return (
    <div className="w-full mb-3 rounded-md bg-surface-container-low border border-outline-variant/10 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-[14px] text-secondary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            description
          </span>
          <span className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
            OER Snapshot
          </span>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse OER Snapshot"
          className="p-0.5 rounded text-on-surface-variant/50 hover:text-on-surface transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary"
        >
          <span className="material-symbols-outlined text-[16px]">
            expand_less
          </span>
        </button>
      </div>

      {/* Structure stats */}
      <div className="px-3 pt-3 pb-2 flex flex-wrap gap-x-4 gap-y-2">
        <Stat
          icon="schedule"
          label="Read"
          value={`~${metadata.estimatedReadingTimeMin} min`}
        />
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="material-symbols-outlined text-[14px] text-secondary flex-shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            article
          </span>
          <span className="text-[11px] text-on-surface-variant font-label uppercase tracking-wide flex-shrink-0">
            Sections
          </span>
          <SectionInfoPopover />
          <span className="text-[11px] font-semibold text-on-surface truncate">
            {String(metadata.chapterCount)}
          </span>
        </div>
        <Stat
          icon="image"
          label="Images"
          value={String(metadata.imageCount)}
        />
        {metadata.mediaCount > 0 && (
          <Stat
            icon="play_circle"
            label="Media"
            value={String(metadata.mediaCount)}
          />
        )}
      </div>

      {/* Readability score */}
      <div className="px-3 pt-2 pb-3 border-t border-outline-variant/10">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="material-symbols-outlined text-[14px] text-secondary flex-shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            school
          </span>
          <span className="text-[11px] text-on-surface-variant font-label uppercase tracking-wide flex-shrink-0">
            Readability
          </span>
          <GradeLevelPopover />
          <span className="text-[11px] font-semibold text-on-surface truncate">
            {`${fkglLabel(metadata.fleschKincaidGrade)} ${metadata.fleschKincaidGrade.toFixed(1)}`}
          </span>
        </div>
      </div>

      {/* Footer */}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OERMetadataSummary() {
  const taskId  = useReviewStore((s) => s.taskId);
  const oerId   = useReviewStore((s) => s.oerId);
  const rubricId = useReviewStore((s) => s.rubricTemplateId);
  const oerType  = useReviewStore((s) => s.oerType);
  const oerSource = useReviewStore((s) => s.oerSource);

  const [metadata, setMetadata] = useState<OERMetadata | null>(null);
  const [status, setStatus]     = useState<"loading" | "done" | "error">("loading");
  const [collapsed, setCollapsed] = useState<boolean>(
    () => taskId ? sessionStorage.getItem(collapseKey(taskId)) === "true" : false,
  );

  useEffect(() => {
    if (!oerId) return;

    // Step 1: check cache
    const cached = getCachedMetadata(oerId, rubricId);
    if (cached) {
      setMetadata(cached);
      setStatus("done");
      return;
    }

    // Step 2 + 3: analyze OER (async, non-blocking)
    let cancelled = false;
    analyzeOER(oerType, oerSource, oerId)
      .then((result) => {
        if (cancelled) return;
        // Step 4: cache for future loads
        setCachedMetadata(result, rubricId);
        setMetadata(result);
        setStatus("done");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [oerId, rubricId, oerType, oerSource]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    if (taskId) sessionStorage.setItem(collapseKey(taskId), String(next));
  }

  if (status === "error") {
    return (
      <p className="mb-3 px-3 py-2.5 text-[11px] text-on-surface-variant/60 bg-surface-container-low border border-outline-variant/10 rounded-md font-label">
        Snapshot unavailable for this resource.
      </p>
    );
  }

  if (status === "loading" || !metadata) {
    return <LoadingSkeleton />;
  }

  if (collapsed) {
    return <CollapsedBar metadata={metadata} onExpand={toggleCollapsed} />;
  }

  return <ExpandedCard metadata={metadata} onCollapse={toggleCollapsed} />;
}
