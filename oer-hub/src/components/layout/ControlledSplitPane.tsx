import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { layout, transitions } from "../../design/tokens";

const HANDLE_WIDTH = 6;

interface ControlledSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  /** Initial left ratio (0–1). */
  initialRatio?: number;
}

export function ControlledSplitPane({
  left,
  right,
  initialRatio = layout.defaultSplit,
}: ControlledSplitPaneProps) {
  const [splitRatio, setSplitRatio] = useState(initialRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setSplitRatio(
      Math.min(layout.maxSplitLeft, Math.max(layout.minSplitLeft, ratio))
    );
  }, []);

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

  const leftPercent = Math.round(splitRatio * 100);
  const rightPercent = 100 - leftPercent;

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden">
      <div
        className="h-full"
        style={{
          display: "grid",
          gridTemplateColumns: `${leftPercent}fr ${HANDLE_WIDTH}px ${rightPercent}fr`,
          transition: transitions.split,
        }}
      >
        <div className="overflow-hidden min-w-0">{left}</div>
        <div className="relative group cursor-col-resize select-none z-10">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-px h-full bg-outline-variant/20 group-hover:bg-secondary/50 transition-colors duration-150" />
          </div>
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
        <div className="overflow-hidden min-w-0">{right}</div>
      </div>
    </div>
  );
}
