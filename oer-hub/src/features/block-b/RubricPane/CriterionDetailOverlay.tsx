import { useEffect } from "react";

interface CriterionDetailOverlayProps {
  open: boolean;
  onClose: () => void;
  criterionCode: string;
  title: string;
  /** Full academic text from rubric markdown (Inter body). */
  bodyText: string;
}

export function CriterionDetailOverlay({
  open,
  onClose,
  criterionCode,
  title,
  bodyText,
}: CriterionDetailOverlayProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="criterion-overlay-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close criterion details"
      />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-md bg-surface-container-lowest shadow-ambient flex flex-col">
        <div className="flex-shrink-0 flex items-start justify-between gap-4 px-6 py-5 border-b border-outline-variant/15">
          <div className="min-w-0">
            <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary mb-1">
              {criterionCode}
            </p>
            <h2
              id="criterion-overlay-title"
              className="font-headline text-title-md text-primary leading-snug"
              style={{ fontFamily: '"Newsreader", Georgia, serif' }}
            >
              {title}
            </h2>
            <p className="text-label-sm font-label uppercase tracking-widest text-on-surface-variant mt-2">
              Proficient standard — full rubric text
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-sm text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p
            className="text-body-md text-on-surface leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
          >
            {bodyText}
          </p>
        </div>
      </div>
    </div>
  );
}
