import { Link, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

/**
 * Block C: Aggregated Feedback Report — Stub (PRD §3, Block C)
 * Full implementation in a subsequent development phase.
 * Routing and state contract are established here for Block B to link to.
 */
export function FeedbackReport() {
  const { taskId } = useParams();

  return (
    <div className="h-full overflow-y-auto bg-surface pt-16">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <header className="mb-10">
          <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-2">
            Block C — Feedback & Revision
          </p>
          <h1 className="font-headline text-headline-md text-primary leading-tight">
            Aggregated Feedback Report
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Full report view for task <code className="font-body text-body-sm bg-surface-container px-1 rounded-sm">{taskId}</code>
          </p>
        </header>

        <Card surface="lowest" className="p-8 space-y-6">
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-sm">
            <span className="material-symbols-outlined text-secondary">construction</span>
            <div>
              <p className="text-body-md font-semibold text-on-surface">
                Full implementation in next phase
              </p>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                This view will display: Coordinator mediation notes · Rubric-grouped criteria ratings · Evidence bank ·
                Revision Cards for "Needs Improvement" items · Author reflection module.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-headline text-title-md text-primary">Planned Sections (PRD Block C)</h2>
            {[
              { id: "C.1", label: "Mediated Feedback Release",        desc: "Coordinator-approved comments released to author" },
              { id: "C.2", label: "Aggregated Report View",           desc: "Rubric → Criterion → Rating → Synthesized Comment" },
              { id: "C.3", label: "Evidence-to-Content Linking",      desc: "Click annotation → scroll OER viewer" },
              { id: "C.4", label: "Actionable Revision Cards",        desc: "Auto-generated from 'Needs Improvement' ratings" },
              { id: "C.5", label: "Report Filtering & Sorting",       desc: "Filter by rating level or rubric area" },
              { id: "C.8", label: "Digital Stamp Generation",         desc: "Unique verifiable badge on certification" },
              { id: "C.9", label: "Validation Landing Page",          desc: "Public-facing certification proof" },
            ].map(({ id, label, desc }) => (
              <div key={id} className="flex items-start gap-3 p-3 bg-surface-container-low rounded-sm">
                <span className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary w-10 flex-shrink-0">
                  {id}
                </span>
                <div>
                  <p className="text-body-md font-semibold text-on-surface">{label}</p>
                  <p className="text-body-sm text-on-surface-variant">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6">
          <Link to="/author">
            <Button variant="ghost" icon="arrow_back">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
