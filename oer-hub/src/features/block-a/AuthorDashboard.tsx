import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthorOers } from "../../api";
import type { IOer } from "../../api/types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const RUBRIC_LABELS: Record<string, string> = {
  accessibility:  "Accessibility",
  "copy-editing": "Copy Editing",
  copyright:      "Copyright",
  disciplinary:   "Disciplinary Appropriateness",
  elearning:      "eLearning Review",
  udl:            "UDL",
};

export function AuthorDashboard() {
  const [oers, setOers] = useState<IOer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthorOers().then((data) => {
      setOers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-surface pt-16">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-2">
              My Workspace
            </p>
            <h1 className="font-headline text-headline-lg text-primary leading-tight">
              Resource Dashboard
            </h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Track your submissions through the certification pipeline.
            </p>
          </div>
          <Link to="/submit">
            <Button icon="add" size="md">New Submission</Button>
          </Link>
        </header>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: "Submitted",    value: oers.filter(o => o.status === "submitted").length,    color: "text-on-surface-variant" },
            { label: "Under Review", value: oers.filter(o => o.status === "under_review").length, color: "text-primary" },
            { label: "In Revision",  value: oers.filter(o => o.status === "in_revision").length,  color: "text-secondary" },
            { label: "Certified",    value: oers.filter(o => o.status === "certified").length,    color: "text-[#1a5c1a]" },
          ].map(({ label, value, color }) => (
            <Card key={label} surface="low" shadow={false} className="p-5">
              <p className={`text-display-md font-headline font-light ${color}`}>{value}</p>
              <p className="text-label-md font-label uppercase tracking-widest text-on-surface-variant mt-1">{label}</p>
            </Card>
          ))}
        </div>

        {/* OER card list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-surface-container-low rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {oers.map((oer) => (
              <OerCard key={oer.id} oer={oer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OerCard({ oer }: { oer: IOer }) {
  return (
    <Card surface="lowest" className="p-6">
      <div className="flex items-start justify-between gap-4">
        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Badge status={oer.status} />
            <span className="text-label-sm font-label uppercase tracking-widest text-on-surface-variant">
              {oer.subject}
            </span>
          </div>

          <h2 className="font-headline text-title-lg text-primary leading-snug mb-2 truncate">
            {oer.title}
          </h2>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">
                {oer.oerType === "pdf" ? "picture_as_pdf" : "link"}
              </span>
              {oer.oerType === "pdf" ? "PDF" : "Web URL"}
            </span>
            <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">copyright</span>
              {oer.license}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {oer.rubrics.map((r) => (
                <span
                  key={r}
                  className="px-2 py-0.5 bg-surface-container-low text-label-sm font-label text-on-surface-variant rounded-sm"
                >
                  {RUBRIC_LABELS[r] ?? r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col gap-2 items-end">
          <ActionCTA oer={oer} />
          <p className="text-label-sm text-on-surface-variant/60">
            {new Date(oer.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Certified seal */}
      {oer.status === "certified" && (
        <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-[#1a5c1a]" style={{ fontVariationSettings: "'FILL' 1" }}>
            verified
          </span>
          <span className="text-label-sm font-label font-semibold uppercase tracking-widest text-[#1a5c1a]">
            Certified — Digital Stamp Available
          </span>
          <button className="ml-auto text-label-sm font-label font-semibold uppercase tracking-widest text-secondary hover:text-primary transition-colors">
            Download Stamp
          </button>
        </div>
      )}
    </Card>
  );
}

function ActionCTA({ oer }: { oer: IOer }) {
  switch (oer.status) {
    case "certified":
      return (
        <Link to={`/reports/${oer.id}`}>
          <Button variant="secondary" size="sm">View Report</Button>
        </Link>
      );
    case "in_revision":
      return (
        <Link to={`/reports/${oer.id}`}>
          <Button size="sm" icon="edit_note">View Revision Cards</Button>
        </Link>
      );
    case "under_review":
      return <Button variant="ghost" size="sm" disabled>Under Review</Button>;
    default:
      return <Button variant="ghost" size="sm" disabled>Pending</Button>;
  }
}
