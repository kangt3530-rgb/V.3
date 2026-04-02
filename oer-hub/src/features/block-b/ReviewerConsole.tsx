import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTask, getRubricTemplate, loadSession, hasPreambleBeenSeen } from "../../api";
import { useReviewStore } from "../../store/reviewStore";
import { useAutoSave } from "../../hooks/useAutoSave";
import { ResizableSplitPane } from "../../components/layout/ResizableSplitPane";
import { OERRenderer } from "./OERPane/OERRenderer";
import { RubricPanel } from "./RubricPane/RubricPanel";
import { PreambleModal } from "./RubricPane/PreambleModal";
import type { IRubricTemplate, IAnnotation, ITask } from "../../api/types";
import { layout } from "../../design/tokens";

export function ReviewerConsole() {
  const { taskId = "task-001" } = useParams();
  const navigate = useNavigate();

  const [task, setTask]               = useState<ITask | null>(null);
  const [rubricTemplate, setRubricTemplate] = useState<IRubricTemplate | null>(null);
  const [showPreamble, setShowPreamble]     = useState(false);
  const [loading, setLoading]              = useState(true);
  const [isSubmitting, setIsSubmitting]    = useState(false);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  const initSession  = useReviewStore((s) => s.initSession);
  const resetSession = useReviewStore((s) => s.resetSession);
  const setSplitRatio = useReviewStore((s) => s.setSplitRatio);
  const setStatus    = useReviewStore((s) => s.setStatus);

  // Mount: load task + rubric + restore draft
  useEffect(() => {
    async function init() {
      try {
        const t = await getTask(taskId);
        if (!t) { navigate("/reviewer"); return; }
        setTask(t);

        const tmpl = await getRubricTemplate(t.rubricTemplateId);
        setRubricTemplate(tmpl);

        // Restore draft or start fresh
        const saved = loadSession(taskId);
        if (saved) {
          initSession(saved);
        } else {
          resetSession({
            taskId,
            oerId:            t.oerId,
            oerType:          t.oer.oerType,
            oerSource:        t.oer.oerSource,
            rubricTemplateId: t.rubricTemplateId,
          });
        }

        // Preamble check
        if (!hasPreambleBeenSeen(t.rubricTemplateId)) {
          setShowPreamble(true);
        }
      } catch (err) {
        console.error("[ReviewerConsole] Failed to load task:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [taskId]);

  // Auto-save on every store mutation
  useAutoSave();

  // Adaptive layout: focus on rubric panel → 5:5 split
  function handleRubricFocus() {
    setSplitRatio(layout.focusSplit);
  }

  // Bi-directional navigation: evidence click → highlight in OER
  function handleEvidenceClick(annotation: IAnnotation) {
    setActiveAnnotationId(annotation.id);
    // Scroll the OER pane if PDF; for web iframe this is best-effort
    setTimeout(() => setActiveAnnotationId(null), 2000);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setStatus("submitted");
    // In production: POST to API, then navigate to coordinator queue
    await new Promise((r) => setTimeout(r, 800));
    navigate("/reviewer");
  }

  if (loading) return <LoadingShell />;
  if (!task || !rubricTemplate) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface pt-16">
      {/* Console header bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-surface-container-low border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/reviewer")}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="text-label-md font-label uppercase tracking-widest">Task Center</span>
          </button>
          <div className="w-px h-4 bg-outline-variant/30" />
          <div>
            <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
              {rubricTemplate.name} Review
            </p>
            <p className="font-headline text-title-md text-primary leading-tight">
              {task.oer.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud_done
            </span>
            <span className="font-label uppercase tracking-widest">Draft</span>
          </div>
          <button
            onClick={() => navigate(`/reports/${task.oer.id}`)}
            className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            View Rubric Preamble
          </button>
        </div>
      </div>

      {/* Main split-pane workspace */}
      <div className="flex-1 overflow-hidden relative">
        <ResizableSplitPane
          left={
            <OERRenderer
              rubricTemplate={rubricTemplate}
              activeAnnotationId={activeAnnotationId}
            />
          }
          right={
            <RubricPanel
              template={rubricTemplate}
              activeAnnotationId={activeAnnotationId}
              onEvidenceClick={handleEvidenceClick}
              onRubricFocus={handleRubricFocus}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          }
        />
      </div>

      {/* Preamble modal — shown on first visit */}
      {showPreamble && rubricTemplate && (
        <PreambleModal
          template={rubricTemplate}
          onProceed={() => setShowPreamble(false)}
        />
      )}
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="h-full flex flex-col pt-16 bg-surface">
      <div className="flex-shrink-0 h-14 bg-surface-container-low animate-pulse" />
      <div className="flex-1 flex">
        <div className="w-[65%] bg-surface-container-low animate-pulse" />
        <div className="w-[35%] bg-surface-container animate-pulse" />
      </div>
    </div>
  );
}
