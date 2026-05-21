import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { IPerRubricReport, RubricTemplateId } from "../../api/types";
import { getOerById, getPerRubricReport } from "../../api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { RUBRIC_LABELS } from "./rubricLabels";

interface RubricRow {
  rubricId: RubricTemplateId;
  report: IPerRubricReport | null;
}

export function OerRubricList() {
  const { oerId } = useParams<{ oerId: string }>();
  const [rows, setRows] = useState<RubricRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [oerTitle, setOerTitle] = useState<string>("");

  useEffect(() => {
    if (!oerId) return;
    const oer = getOerById(oerId);
    if (!oer) {
      setLoading(false);
      return;
    }
    setOerTitle(oer.title);
    Promise.all(
      oer.rubrics.map((rubricId) =>
        getPerRubricReport(oerId, rubricId).then((report) => ({ rubricId, report }))
      )
    )
      .then(setRows)
      .finally(() => setLoading(false));
  }, [oerId]);

  if (loading) {
    return (
      <div className="pt-16 h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <p className="text-on-surface-variant animate-pulse">Loading reviews…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-on-surface-variant">
          <Link to="/author" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <span>›</span>
          <span className="truncate max-w-xs">{oerTitle}</span>
        </nav>

        <div>
          <h1 className="font-headline text-3xl text-primary truncate">{oerTitle}</h1>
          <p className="text-on-surface-variant mt-1.5">Rubric reviews</p>
        </div>

        {rows.length === 0 ? (
          <Card surface="low" className="p-6 text-center">
            <p className="text-on-surface-variant">No reviews found for this OER.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map(({ rubricId, report }) => {
              const released = report?.releasedToAuthor ?? false;
              const oerStatus = report?.oer.status;
              return (
                <Card key={rubricId} surface="lowest" shadow={false} className="border border-outline-variant/30 p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-headline text-base text-primary">
                      {RUBRIC_LABELS[rubricId]} Review
                    </p>
                    {oerStatus && (
                      <div className="mt-1.5">
                        <Badge status={oerStatus} />
                      </div>
                    )}
                  </div>
                  {released ? (
                    <Link to={`/reports/${oerId}/${rubricId}`}>
                      <Button size="sm" icon="arrow_forward" iconPosition="right">
                        View feedback
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-sm text-on-surface-variant">Not yet released</span>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
