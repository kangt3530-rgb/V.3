import { Link, useParams } from "react-router-dom";
import { getStampById } from "../../api";
import type { RubricTemplateId } from "../../api/types";
import { RUBRIC_LABELS } from "./rubricLabels";

export function ValidationLandingPage() {
  const { stampId = "" } = useParams();
  const stamp = getStampById(stampId);

  if (!stamp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-8 text-center">
        <span className="material-symbols-outlined text-[48px] text-outline mb-4">shield_lock</span>
        <h1 className="font-headline text-headline-md text-primary">Verification not found</h1>
        <p className="text-body-md text-on-surface-variant mt-2 max-w-md">
          This stamp ID is invalid or the resource is no longer published for public verification.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="max-w-3xl mx-auto px-6 py-10 flex items-start gap-4">
          <div className="w-14 h-14 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
          </div>
          <div>
            <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-1">
              OER Certification Hub
            </p>
            <h1 className="font-headline text-headline-lg text-primary leading-tight">Public validation</h1>
            <p className="text-body-sm text-on-surface-variant mt-2">
              Stamp ID: <code className="bg-surface-container px-1 rounded-sm">{stamp.id}</code>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <section>
          <h2 className="font-headline text-title-lg text-primary mb-2">{stamp.oerTitle}</h2>
          <p className="text-body-md text-on-surface-variant">{stamp.subject}</p>
          <p className="text-body-sm text-on-surface-variant mt-4">
            Author: <span className="text-on-surface font-medium">{stamp.authorDisplay}</span> · License{" "}
            <span className="text-on-surface font-medium">{stamp.license}</span>
          </p>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Issued: {new Date(stamp.issuedAt).toLocaleDateString(undefined, { dateStyle: "long" })}
          </p>
        </section>

        <section className="bg-surface-container-low rounded-md p-6 border border-outline-variant/10">
          <h3 className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-3">
            Certification summary
          </h3>
          <p className="text-body-md text-on-surface leading-relaxed">{stamp.certificationSummary}</p>
          <p className="text-body-sm text-on-surface-variant mt-4 italic">
            Detailed reviewer annotations and author rebuttals are intentionally omitted on this public page (PRD
            Block C).
          </p>
        </section>

        <section>
          <h3 className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-3">
            Rubrics applied
          </h3>
          <ul className="flex flex-wrap gap-2">
            {stamp.rubricsApplied.map((r: RubricTemplateId) => (
              <li
                key={r}
                className="px-3 py-1.5 bg-surface-container-lowest rounded-sm text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant border border-outline-variant/20"
              >
                {RUBRIC_LABELS[r]}
              </li>
            ))}
          </ul>
        </section>

        <footer className="pt-8 border-t border-outline-variant/10 text-center">
          <Link to="/" className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary hover:text-primary">
            OER Certification Hub home
          </Link>
        </footer>
      </main>
    </div>
  );
}
