import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { IPerRubricReport, RubricTemplateId } from "../../api/types";
import { getPerRubricReport } from "../../api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { OutcomeBar } from "./OutcomeBar";
import { RatingPill } from "./RatingPill";

export function RubricReviewEntry() {
  const { oerId, rubricId } = useParams<{ oerId: string; rubricId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<IPerRubricReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!oerId || !rubricId) return;
    getPerRubricReport(oerId, rubricId as RubricTemplateId)
      .then(setReport)
      .finally(() => setLoading(false));
  }, [oerId, rubricId]);

  if (loading) {
    return (
      <div className="pt-16 h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-on-surface-variant animate-pulse">Loading review…</p>
        </div>
      </div>
    );
  }

  if (!report || !report.releasedToAuthor) {
    return (
      <div className="pt-16 h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Card surface="low" className="p-6 text-center space-y-2">
            <p className="font-headline text-lg text-primary">This review is not yet available.</p>
            <p className="text-sm text-on-surface-variant">
              Your coordinator will release feedback once mediation is complete.
            </p>
            <div className="mt-4">
              <Link to="/author">
                <Button variant="secondary" size="sm">Back to Dashboard</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const reviewDate = report.reviewCompletedAt
    ? new Date(report.reviewCompletedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="pt-16 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant flex-wrap">
          <Link to="/author" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>›</span>
          <span className="truncate max-w-[200px]">{report.oer.title}</span>
          <span>›</span>
          <span>{report.rubricName} Review</span>
        </nav>

        {/* Header */}
        <div>
          <h1 className="font-headline text-3xl text-primary">{report.rubricName} Review</h1>
          <p className="text-on-surface-variant mt-1.5">Review completed · {reviewDate}</p>
        </div>

        {/* Overall outcome */}
        <div className="space-y-4">
          <OutcomeBar criteria={report.criteria} compact={false} />
          <p className="text-sm text-on-surface-variant leading-relaxed">
            After reading the feedback, you&rsquo;ll be asked to respond to items marked{" "}
            <strong>Needs Improvement</strong> before finalizing this review.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="flex justify-center">
          <Button
            size="lg"
            icon="arrow_forward"
            iconPosition="right"
            onClick={() => navigate(`/reports/${oerId}/${rubricId}/read`)}
          >
            Begin reviewing feedback
          </Button>
        </div>

        {/* Contents list */}
        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-4">
            Contents
          </h2>
          <div className="divide-y divide-outline-variant/20 border border-outline-variant/20 rounded-lg overflow-hidden">
            {report.criteria.map((c) => (
              <Link
                key={c.criterionId}
                to={`/reports/${oerId}/${rubricId}/read#${c.criterionId}`}
                className="block hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-on-surface-variant w-7 flex-shrink-0">
                      {c.criterionId}
                    </span>
                    <span className="text-body-md text-on-surface truncate">
                      {c.criterionTitle}
                    </span>
                  </div>
                  <RatingPill summary={c.ratingSummary} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
