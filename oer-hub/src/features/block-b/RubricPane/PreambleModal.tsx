import type { IRubricTemplate } from "../../../api/types";
import { markPreambleSeen } from "../../../api";

interface PreambleModalProps {
  template: IRubricTemplate;
  onProceed: () => void;
}

export function PreambleModal({ template, onProceed }: PreambleModalProps) {
  function handleSkipAndRemember() {
    markPreambleSeen(template.id);
    onProceed();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-surface-container-lowest shadow-ambient rounded-md overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 bg-surface-container-low">
          <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-1">
            Rubric Introduction
          </p>
          <h2 className="font-headline text-headline-sm text-primary leading-tight">
            {template.name}
          </h2>
          <p className="mt-2 text-body-md text-on-surface-variant">{template.description}</p>
        </div>

        {/* Preamble */}
        <div className="px-8 py-6 max-h-72 overflow-y-auto">
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
            Operational Definition & Framing Language
          </p>
          <p className="text-body-lg text-on-surface leading-relaxed whitespace-pre-line serif-italic">
            {template.preamble}
          </p>
        </div>

        {/* Criteria preview */}
        <div className="px-8 pb-2 max-h-48 overflow-y-auto">
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
            Criteria to Evaluate ({template.criteria.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {template.criteria.map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-body-sm text-on-surface">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                <span className="font-semibold text-on-surface-variant">{c.id}:</span> {c.title}
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-8 py-6 flex items-center justify-between gap-4">
          <button
            onClick={handleSkipAndRemember}
            className="text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            Skip & Don't Show Again
          </button>
          <div className="flex gap-3">
            <button
              onClick={onProceed}
              className="text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              Skip
            </button>
            <button
              onClick={onProceed}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-sm text-label-lg font-label font-semibold uppercase tracking-widest hover:bg-primary-container transition-colors"
            >
              Begin Review
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
