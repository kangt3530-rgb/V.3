import { useRef } from "react";
import { useReviewStore } from "../../../store/reviewStore";
import { WebRenderer } from "./WebRenderer";
import type { IRubricTemplate } from "../../../api/types";

interface OERRendererProps {
  rubricTemplate?: IRubricTemplate;
  activeAnnotationId?: string | null;
  onAnnotationScroll?: (annotationId: string) => void;
}

export function OERRenderer({
  activeAnnotationId,
}: OERRendererProps) {
  const oerType       = useReviewStore((s) => s.oerType);
  const oerSource     = useReviewStore((s) => s.oerSource);
  const annotations   = useReviewStore((s) => s.annotations);
  const scrollRef     = useRef<((id: string) => void) | null>(null);

  if (oerType === "url") {
    return (
      <WebRenderer
        url={oerSource}
        annotations={annotations}
        activeAnnotationId={activeAnnotationId}
        onScrollRef={scrollRef}
      />
    );
  }

  // PDF — rendered by PDFRenderer (imported separately to keep bundle lazy)
  return (
    <div className="flex items-center justify-center h-full bg-surface-container-low text-on-surface-variant">
      <div className="text-center">
        <span className="material-symbols-outlined text-[40px] mb-3 block">picture_as_pdf</span>
        <p className="text-body-md">PDF viewer loading…</p>
        <p className="text-body-sm mt-1 text-on-surface-variant/60">{oerSource}</p>
      </div>
    </div>
  );
}
