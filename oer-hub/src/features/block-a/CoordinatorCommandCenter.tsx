import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveTasks } from "../../api";
import type { ITask } from "../../api/types";
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

const PIPELINE_STAGES = [
  { key: "submitted",    label: "Submitted",    icon: "inbox" },
  { key: "under_review", label: "Under Review", icon: "rate_review" },
  { key: "in_revision",  label: "In Revision",  icon: "edit_note" },
  { key: "certified",    label: "Certified",    icon: "verified" },
];

export function CoordinatorCommandCenter() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveTasks().then((data) => {
      setTasks(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-surface pt-16">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-label-md font-label font-semibold uppercase tracking-widest text-secondary mb-2">
              Coordinator View
            </p>
            <h1 className="font-headline text-headline-lg text-primary leading-tight">
              Pipeline Command Center
            </h1>
            <p className="mt-2 text-body-md text-on-surface-variant">
              Monitor all active reviews, assign experts, and manage the mediation queue.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" icon="manage_accounts">Assign Expert</Button>
            <Button size="sm" icon="mediation" onClick={() => navigate("/coordinator/mediation")}>
              Mediation Queue
            </Button>
          </div>
        </header>

        {/* Pipeline stages */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {PIPELINE_STAGES.map(({ key, label, icon }) => (
            <Card key={key} surface="low" shadow={false} className="p-5 text-center">
              <span className="material-symbols-outlined text-secondary text-[24px] mb-2 block">
                {icon}
              </span>
              <p className="font-headline text-display-md text-primary font-light">
                {tasks.filter((t) => t.oer.status === key).length}
              </p>
              <p className="text-label-md font-label uppercase tracking-widest text-on-surface-variant mt-1">
                {label}
              </p>
            </Card>
          ))}
        </div>

        {/* Active task table */}
        <section>
          <h2 className="font-headline text-title-lg text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">view_list</span>
            All Active Reviews
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface-container-low rounded-md animate-pulse" />)}
            </div>
          ) : (
            <Card surface="lowest" className="overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low">
                    {["Resource", "Rubric", "Reviewer", "Progress", "Status", ""].map((h) => (
                      <th key={h} className="px-5 py-3 text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-headline text-body-md text-primary font-semibold leading-snug max-w-xs truncate">
                          {task.oer.title}
                        </p>
                        <p className="text-body-sm text-on-surface-variant">{task.oer.subject}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-body-sm text-on-surface">
                          {RUBRIC_LABELS[task.rubricTemplateId]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-body-sm text-on-surface">
                          {task.reviewerId ? "Prof. James Okafor" : (
                            <span className="text-error">Unassigned</span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full"
                              style={{ width: `${task.completionPercent}%` }}
                            />
                          </div>
                          <span className="text-label-sm text-on-surface-variant">{task.completionPercent}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={task.status} />
                      </td>
                      <td className="px-5 py-4">
                        <Button variant="ghost" size="sm">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
