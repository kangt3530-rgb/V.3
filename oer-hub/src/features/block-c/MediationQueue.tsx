import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getMediationQueue,
  getMediationItem,
  updateMediationItem,
  releaseMediationToAuthor,
  getOersPendingVerification,
  approveAuthorRevisions,
} from "../../api";
import type { IMediationItem } from "../../api/types";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

export function MediationQueue() {
  const { mediationId } = useParams();
  if (mediationId) {
    return <MediationDetail mediationId={mediationId} />;
  }
  return <MediationList />;
}

function MediationList() {
  const [items, setItems] = useState(() => getMediationQueue());
  const [pendingOers, setPendingOers] = useState(() => getOersPendingVerification());

  function refresh() {
    setItems(getMediationQueue());
    setPendingOers(getOersPendingVerification());
  }

  return (
    <div className="h-full overflow-y-auto bg-surface pt-16">
      <div className="max-w-5xl mx-auto px-8 py-12">
        <header className="mb-10">
          <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-2">
            Coordinator
          </p>
          <h1 className="font-headline text-headline-lg text-primary leading-tight">Mediation queue</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Review AI-assisted synthesis, resolve conflicts, and release feedback to authors (C.1 / C.2).
          </p>
        </header>

        <section className="mb-12">
          <h2 className="font-headline text-title-lg text-primary mb-4">Pending reviewer releases</h2>
          {items.filter((i) => i.status === "pending").length === 0 ? (
            <Card surface="low" className="p-8 text-body-sm text-on-surface-variant">
              No items awaiting mediation. When a reviewer finalizes a task, it appears here.
            </Card>
          ) : (
            <div className="space-y-3">
              {items
                .filter((i) => i.status === "pending")
                .map((item) => (
                  <Card key={item.id} surface="lowest" className="p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Badge status="mediation" className="mb-2" />
                      <p className="font-headline text-title-md text-primary truncate">{item.oerTitle}</p>
                      <p className="text-body-sm text-on-surface-variant mt-1">
                        Tasks: {item.taskIds.join(", ")} · {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Link to={`/coordinator/mediation/${item.id}`}>
                      <Button size="sm" icon="edit_note">
                        Review
                      </Button>
                    </Link>
                  </Card>
                ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-headline text-title-lg text-primary mb-4">Author revision packages</h2>
          <p className="text-body-sm text-on-surface-variant mb-4">
            Authors who submitted a Summary of Revisions appear here for final verification before certification.
          </p>
          {pendingOers.length === 0 ? (
            <Card surface="low" className="p-8 text-body-sm text-on-surface-variant">
              No author packages pending verification.
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingOers.map((oer) => (
                <Card key={oer.id} surface="lowest" className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <Badge status="pending_verification" className="mb-2" />
                    <p className="font-headline text-title-md text-primary">{oer.title}</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">{oer.subject}</p>
                  </div>
                  <Button
                    size="sm"
                    icon="verified"
                    onClick={async () => {
                      await approveAuthorRevisions(oer.id);
                      refresh();
                    }}
                  >
                    Verify &amp; certify
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MediationDetail({ mediationId }: { mediationId: string }) {
  const item = getMediationItem(mediationId);
  if (!item) {
    return (
      <div className="h-full pt-24 px-8 text-on-surface-variant">
        Mediation item not found.{" "}
        <Link to="/coordinator/mediation" className="text-secondary font-semibold underline">
          Back
        </Link>
      </div>
    );
  }
  return <MediationDetailForm key={item.id} item={item} />;
}

function MediationDetailForm({ item }: { item: IMediationItem }) {
  const navigate = useNavigate();
  const [releaseText, setReleaseText] = useState(
    () => item.coordinatorReleaseText ?? item.aiConsensusDraft ?? ""
  );

  return (
    <div className="h-full overflow-y-auto bg-surface pt-16">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <button
          type="button"
          onClick={() => navigate("/coordinator/mediation")}
          className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary mb-6"
        >
          ← Back to queue
        </button>

        <header className="mb-8">
          <h1 className="font-headline text-headline-md text-primary">{item.oerTitle}</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Mediation ID: {item.id}</p>
        </header>

        <Card surface="lowest" className="p-6 space-y-4 mb-6">
          <h2 className="font-headline text-title-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">smart_toy</span>
            AI conflict resolution (C.2)
          </h2>
          <pre className="whitespace-pre-wrap text-body-sm text-on-surface bg-surface-container-low p-4 rounded-sm border border-outline-variant/10">
            {item.aiConsensusDraft}
          </pre>
          {item.reviewerBConflictNote && (
            <div className="border-t border-outline-variant/10 pt-4">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary mb-2">
                Reviewer B counterpoint (mock)
              </p>
              <p className="text-body-sm text-on-surface">{item.reviewerBConflictNote}</p>
            </div>
          )}
        </Card>

        <Card surface="lowest" className="p-6 space-y-4 mb-8">
          <h2 className="font-headline text-title-md text-primary">Coordinator release text</h2>
          <p className="text-body-sm text-on-surface-variant">
            Edit the synthesis below. Authors will see this as the single source of truth after release.
          </p>
          <textarea
            className="w-full min-h-[160px] rounded-sm border border-outline-variant/30 bg-surface px-3 py-2 text-body-md text-on-surface font-body"
            value={releaseText}
            onChange={(e) => setReleaseText(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                updateMediationItem(item.id, { coordinatorReleaseText: releaseText });
              }}
            >
              Save draft
            </Button>
            <Button
              icon="send"
              onClick={async () => {
                await updateMediationItem(item.id, { coordinatorReleaseText: releaseText });
                await releaseMediationToAuthor(item.id);
                navigate("/coordinator/mediation");
              }}
            >
              Release to author
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
