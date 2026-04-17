import { useState } from "react";
import type { IAnnotation, IRubricTemplate, OerType } from "../../api/types";
import { ControlledSplitPane } from "../../components/layout/ControlledSplitPane";
import { MockOERRenderer } from "../block-b/OERPane/MockOERRenderer";
import { EvidenceBank } from "../block-b/RubricPane/EvidenceBank";
import { Button } from "../../components/ui/Button";

interface ReportEvidenceDrawerProps {
  open: boolean;
  onClose: () => void;
  oerType: OerType;
  oerSource: string;
  annotations: IAnnotation[];
  rubricTemplate: IRubricTemplate | null;
  anchorVersionLabel: string;
  currentVersionLabel: string;
  versionMismatch: boolean;
}

export function ReportEvidenceDrawer({
  open,
  onClose,
  oerType,
  oerSource,
  annotations,
  rubricTemplate,
  anchorVersionLabel,
  currentVersionLabel,
  versionMismatch,
}: ReportEvidenceDrawerProps) {
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-surface print-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Evidence context viewer"
    >
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-surface-container-low border-b border-outline-variant/10">
        <div>
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
            Evidence context
          </p>
          <p className="font-headline text-title-md text-primary">Bi-directional viewer</p>
        </div>
        <Button variant="ghost" icon="close" onClick={onClose}>
          Close
        </Button>
      </header>

      {versionMismatch && (
        <div className="flex-shrink-0 px-6 py-2 bg-secondary-container/40 border-b border-outline-variant/20 text-body-sm text-on-surface">
          <span className="material-symbols-outlined text-[18px] align-middle mr-2 text-secondary">
            warning
          </span>
          Note: These highlight anchors are based on <strong>{anchorVersionLabel}</strong>. Locations may
          have shifted in your current version (<strong>{currentVersionLabel}</strong>).
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <ControlledSplitPane
          left={
            oerType === "mock" ? (
              <MockOERRenderer
                annotations={annotations}
                activeAnnotationId={activeAnnotationId}
                rubricTemplate={rubricTemplate ?? undefined}
                readOnly
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-surface-container-low p-8 text-center">
                <span className="material-symbols-outlined text-[40px] text-secondary mb-3">
                  link
                </span>
                <p className="text-body-md text-on-surface font-semibold mb-1">External OER preview</p>
                <p className="text-body-sm text-on-surface-variant break-all max-w-lg">{oerSource}</p>
                <p className="text-body-sm text-on-surface-variant mt-4">
                  Full proxy rendering is unchanged from Block B; mock resources show anchored highlights here.
                </p>
              </div>
            )
          }
          right={
            <div className="h-full overflow-y-auto bg-surface-container-lowest p-6">
              <EvidenceBank
                annotations={annotations}
                activeAnnotationId={activeAnnotationId}
                onEvidenceClick={(a) => setActiveAnnotationId(a.id)}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
