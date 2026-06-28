import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface ResizableSplitPaneProps {
  left:  ReactNode;
  right: ReactNode;
}

const HANDLE_WIDTH = 6; // px

export function ResizableSplitPane({ left, right }: ResizableSplitPaneProps) {
  const [splitRatio, setSplitRatio] = useState(0.5);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging     = useRef(false);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect  = containerRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(Math.min(0.85, Math.max(0.15, ratio)));
    },
    []
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
    <div ref={containerRef} className="relative h-full overflow-hidden">
      <div
        className="h-full"
        style={{
          display: "grid",
          gridTemplateColumns: `${leftPercent}fr ${HANDLE_WIDTH}px ${rightPercent}fr`,
          transition: "grid-template-columns 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="overflow-hidden min-w-0">{left}</div>

        <div className="relative group cursor-col-resize select-none z-10">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-px h-full bg-outline-variant/20 group-hover:bg-secondary/50 transition-colors duration-150" />
          </div>
          <div className="absolute inset-0"
            onMouseDown={(e) => {
              e.preventDefault();
              dragging.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          />
        </div>

        <div className="overflow-hidden min-w-0">{right}</div>
      </div>

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
