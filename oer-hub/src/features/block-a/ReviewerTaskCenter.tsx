import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getActiveTasks, getMatchedPoolTasks } from "../../api";
import type { ITask } from "../../api/types";
import { useSessionStore } from "../../store/sessionStore";
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

// Notification frequency options for the zero-match empty state
const NOTIFY_OPTIONS = ["Daily digest", "Weekly digest", "Off"] as const;
type NotifyFreq = (typeof NOTIFY_OPTIONS)[number];

export function ReviewerTaskCenter() {
  const discipline          = useSessionStore((s) => s.discipline);
  const expertiseTags       = useSessionStore((s) => s.reviewer.expertiseTags);
  const rubricSpecializations = useSessionStore((s) => s.reviewer.rubricSpecializations);

  const [active, setActive] = useState<ITask[]>([]);
  const [pool, setPool]     = useState<ITask[]>([]);
  const [totalMatched, setTotalMatched] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifyFreq, setNotifyFreq] = useState<NotifyFreq>("Weekly digest");

  useEffect(() => {
    Promise.all([
      getActiveTasks(),
      getMatchedPoolTasks({ discipline, expertiseTags, rubricSpecializations }),
    ]).then(([a, { tasks, totalMatched: total }]) => {
      setActive(a);
      setPool(tasks);
      setTotalMatched(total);
      setLoading(false);
    });
  }, [discipline, expertiseTags, rubricSpecializations]);

  return (
    <div className="h-full overflow-y-auto bg-surface pt-16">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-2">
            Expert Workspace
          </p>
          <h1 className="font-headline text-headline-lg text-primary leading-tight">
            Task Center
          </h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Manage your active reviews and claim new assignments.
          </p>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-surface-container-low rounded-md animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active reviews */}
            <section>
              <h2 className="font-headline text-title-lg text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">edit_note</span>
                My Active Reviews
                <span className="ml-auto text-label-md font-label text-on-surface-variant">
                  {active.length} active
                </span>
              </h2>
              {active.length === 0 ? (
                <EmptyState message="No active reviews. Claim a task from the pool below." />
              ) : (
                <div className="space-y-4">
                  {active.map((task) => (
                    <ActiveTaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </section>

            {/* Task pool */}
            <section>
              <h2 className="font-headline text-title-lg text-primary mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">inbox</span>
                Task Pool
                <span className="ml-auto text-label-md font-label text-on-surface-variant">
                  {pool.length} available
                </span>
              </h2>

              {/* Match hero — shown when at least one match */}
              {totalMatched > 0 && (
                <p className="text-body-md text-on-surface-variant mb-4">
                  We found{" "}
                  <span className="font-semibold text-primary">{totalMatched}</span>{" "}
                  {totalMatched === 1 ? "task" : "tasks"} that match your expertise.
                </p>
              )}

              {pool.length === 0 ? (
                <ZeroMatchEmptyState
                  notifyFreq={notifyFreq}
                  onNotifyChange={setNotifyFreq}
                />
              ) : (
                <div className="space-y-4">
                  {pool.map((task) => (
                    <PoolTaskCard
                      key={task.id}
                      task={task}
                      onClaim={() => {
                        setPool((p) => p.filter((t) => t.id !== task.id));
                        setActive((a) => [
                          ...a,
                          { ...task, status: "claimed", completionPercent: 0 },
                        ]);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveTaskCard({ task }: { task: ITask }) {
  return (
    <Card surface="lowest" className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <Badge status={task.status} />
            <span className="text-label-sm font-label uppercase tracking-widest text-secondary">
              {RUBRIC_LABELS[task.rubricTemplateId]}
            </span>
          </div>
          <h3 className="font-headline text-title-lg text-primary truncate mb-1">
            {task.oer.title}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {task.oer.subject} · {task.oer.author}
          </p>

          {/* Progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all"
                style={{ width: `${task.completionPercent}%` }}
              />
            </div>
            <span className="text-label-sm font-label text-on-surface-variant whitespace-nowrap">
              {task.completionPercent}% complete
            </span>
          </div>
        </div>

        <Link to={`/review/${task.id}`}>
          <Button size="sm" icon="rate_review">
            {task.completionPercent > 0 ? "Continue" : "Start Review"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function PoolTaskCard({
  task,
  onClaim,
}: {
  task: ITask;
  onClaim: () => void;
}) {
  return (
    <Card surface="low" shadow={false} className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
              {RUBRIC_LABELS[task.rubricTemplateId]}
            </span>
            <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[12px]">
                {task.oer.oerType === "pdf" ? "picture_as_pdf" : "link"}
              </span>
              {task.oer.oerType === "pdf" ? "PDF" : "Web URL"}
            </span>
          </div>
          <h3 className="font-headline text-title-lg text-primary truncate mb-1">
            {task.oer.title}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {task.oer.subject} · Submitted{" "}
            {new Date(task.oer.submittedAt).toLocaleDateString()}
          </p>
        </div>

        <Button variant="secondary" size="sm" icon="add_task" onClick={onClaim}>
          Claim Task
        </Button>
      </div>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center text-body-md text-on-surface-variant bg-surface-container-low rounded-md">
      {message}
    </div>
  );
}

function ZeroMatchEmptyState({
  notifyFreq,
  onNotifyChange,
}: {
  notifyFreq: NotifyFreq;
  onNotifyChange: (freq: NotifyFreq) => void;
}) {
  return (
    <div className="py-10 px-6 text-center bg-surface-container-low rounded-md flex flex-col items-center gap-4">
      <span
        className="material-symbols-outlined text-[40px] text-outline/40"
        aria-hidden="true"
      >
        inbox
      </span>
      <div>
        <p className="text-body-md text-on-surface-variant font-medium mb-1">
          No tasks match your expertise yet
        </p>
        <p className="text-body-sm text-on-surface-variant max-w-xs mx-auto">
          Tasks matching your expertise will show up here as authors submit.
          We'll notify you when there's a match.
        </p>
      </div>

      {/* Notification frequency control */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="notify-freq"
          className="text-label-sm font-label text-on-surface-variant"
        >
          Notify me:
        </label>
        <select
          id="notify-freq"
          value={notifyFreq}
          onChange={(e) => onNotifyChange(e.target.value as NotifyFreq)}
          className="text-label-sm font-label text-on-surface border border-outline-variant rounded-md px-2 py-1 bg-surface-container-low outline-none focus:border-primary transition-colors cursor-pointer"
        >
          {NOTIFY_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
