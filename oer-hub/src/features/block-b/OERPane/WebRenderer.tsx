import { useRef, useState, type RefObject } from "react";
import type { IAnnotation, IRubricTemplate } from "../../../api/types";
import { AnnotationLayer } from "./AnnotationLayer";

interface WebRendererProps {
  url: string;
  annotations: IAnnotation[];
  activeAnnotationId?: string | null;
  onScrollRef?: RefObject<((annotationId: string) => void) | null>;
  rubricTemplate?: IRubricTemplate;
}

export function WebRenderer({
  url,
  annotations,
  activeAnnotationId,
  rubricTemplate,
}: WebRendererProps) {
  const [loadError, setLoadError] = useState(false);
  const [annotationMode, setAnnotationMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Annotation mode toolbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-surface-container-low border-b border-outline-variant/10">
        <button
          onClick={() => setAnnotationMode((m) => !m)}
          title={annotationMode ? "Exit annotation mode" : "Enter annotation mode to highlight text"}
          className={[
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-sm font-label font-semibold uppercase tracking-widest transition-colors",
            annotationMode
              ? "bg-secondary-container text-secondary"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
          ].join(" ")}
        >
          <span className="material-symbols-outlined text-[16px]">ink_highlighter</span>
          {annotationMode ? "Exit Annotation Mode" : "Annotate"}
        </button>
        {annotationMode && (
          <p className="text-label-sm text-secondary font-label uppercase tracking-widest animate-pulse">
            Select text in the document below
          </p>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 text-label-sm text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          Open Original
        </a>
      </div>

      {/* Content area */}
      <div className="relative flex-1 overflow-hidden">
        {loadError ? (
          <CrossOriginFallback url={url} />
        ) : (
          <iframe
            src={url}
            title="OER Content"
            sandbox="allow-same-origin allow-scripts allow-forms"
            className="w-full h-full border-0"
            onError={() => setLoadError(true)}
            onLoad={(e) => {
              // Try detecting cross-origin block
              try {
                const doc = (e.target as HTMLIFrameElement).contentDocument;
                if (!doc || doc.body.innerHTML === "") setLoadError(true);
              } catch {
                setLoadError(true);
              }
            }}
          />
        )}

        {/* Annotation overlay — sits above iframe, captures selection in annotation mode */}
        <AnnotationLayer
          containerRef={containerRef}
          annotations={annotations}
          activeAnnotationId={activeAnnotationId}
          annotationMode={annotationMode}
          type="web"
          rubricTemplate={rubricTemplate}
        />
      </div>
    </div>
  );
}

function CrossOriginFallback({ url }: { url: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-12 text-center bg-surface-container-low">
      <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-4">link_off</span>
      <h3 className="font-headline text-title-lg text-primary mb-2">
        External content cannot be embedded
      </h3>
      <p className="text-body-md text-on-surface-variant mb-6 max-w-md">
        This resource restricts embedding. Open it in a new tab and use manual annotations below.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-md text-label-lg font-label font-semibold uppercase tracking-widest hover:bg-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
        Open Resource
      </a>
      <p className="mt-6 text-label-sm text-on-surface-variant uppercase tracking-widest">
        Use the annotation tools in the rubric panel →
      </p>
    </div>
  );
}
