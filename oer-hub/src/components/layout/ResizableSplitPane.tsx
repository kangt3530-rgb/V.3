import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { layout } from "../../design/tokens";
import { useReviewStore } from "../../store/reviewStore";

interface ResizableSplitPaneProps {
  left:  ReactNode;
  right: ReactNode;
}

const HANDLE_WIDTH = 6; // px

export function ResizableSplitPane({ left, right }: ResizableSplitPaneProps) {
  const splitRatio    = useReviewStore((s) => s.splitRatio);
  const setSplitRatio = useReviewStore((s) => s.setSplitRatio);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect  = containerRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(ratio);
    },
    [setSplitRatio]
  );

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const leftPercent  = Math.round(splitRatio * 100);
  const rightPercent = 100 - leftPercent;

  return (
    // position:relative so LayoutPresets can be absolutely positioned inside
    <div ref={containerRef} className="relative h-full overflow-hidden">
      {/*
        3-column grid: left content | 6px drag handle | right content.
        LayoutPresets is NOT a grid child — it's absolute-positioned above.
        transition on grid-template-columns animates the adaptive layout change.
      */}
      <div
        className="h-full"
        style={{
          display: "grid",
          gridTemplateColumns: `${leftPercent}fr ${HANDLE_WIDTH}px ${rightPercent}fr`,
          transition: "grid-template-columns 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Column 1 — OER content pane */}
        <div className="overflow-hidden min-w-0">{left}</div>

        {/* Column 2 — Drag handle (6px) */}
        <div className="relative group cursor-col-resize select-none z-10">
          {/* Thin separator line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-px h-full bg-outline-variant/20 group-hover:bg-secondary/50 transition-colors duration-150" />
          </div>
          {/* Grab pills */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-outline-variant" />
            ))}
          </div>
          {/* Full-height invisible hit area */}
          <div
            className="absolute inset-0"
            onMouseDown={(e) => {
              e.preventDefault();
              dragging.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          />
        </div>

        {/* Column 3 — Rubric console pane */}
        <div className="overflow-hidden min-w-0">{right}</div>
      </div>

      {/* Layout preset buttons — absolutely positioned, NOT a grid child */}
      <LayoutPresets splitRatio={splitRatio} setSplitRatio={setSplitRatio} />
    </div>
  );
}

function LayoutPresets({
  splitRatio,
  setSplitRatio,
}: {
  splitRatio: number;
  setSplitRatio: (r: number) => void;
}) {
  const presets = [
    { label: "7:3", ratio: 0.7, title: "Wide reading view" },
    { label: "5:5", ratio: 0.5, title: "Balanced view" },
    { label: "3:7", ratio: 0.3, title: "Wide review view" },
  ];

  const activeRatio = presets.find((p) => Math.abs(splitRatio - p.ratio) < 0.04);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-lowest/90 shadow-ambient pointer-events-auto">
      {presets.map(({ label, ratio, title }) => (
        <button
          key={label}
          title={title}
          onClick={() => setSplitRatio(ratio)}
          className={[
            "px-2.5 py-0.5 rounded-full text-label-sm font-label font-semibold uppercase tracking-widest transition-colors",
            activeRatio?.ratio === ratio
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-primary hover:bg-surface-container",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export { layout };
