import type { ITask } from "../types";
import { MOCK_OERS, MOCK_AVAILABLE_OERS } from "./oers";

export const MOCK_ACTIVE_TASKS: ITask[] = [
  {
    id: "task-001",
    oerId: "oer-001",
    oer: MOCK_OERS[0],
    rubricTemplateId: "accessibility",
    reviewerId: "user-reviewer-01",
    status: "in_progress",
    completionPercent: 62,
    claimedAt: "2026-03-22T10:00:00Z",
  },
  {
    id: "task-002",
    oerId: "oer-002",
    oer: MOCK_OERS[1],
    rubricTemplateId: "udl",
    reviewerId: "user-reviewer-01",
    status: "claimed",
    completionPercent: 0,
    claimedAt: "2026-03-31T09:00:00Z",
  },
];

export const MOCK_POOL_TASKS: ITask[] = [
  {
    id: "task-pool-01",
    oerId: "oer-pool-01",
    oer: MOCK_AVAILABLE_OERS[0],
    rubricTemplateId: "accessibility",
    status: "available",
    completionPercent: 0,
  },
  {
    id: "task-pool-02",
    oerId: "oer-pool-02",
    oer: MOCK_AVAILABLE_OERS[1],
    rubricTemplateId: "disciplinary",
    status: "available",
    completionPercent: 0,
  },
];

// The task used for the reviewer console demo (Block B)
export const DEMO_TASK: ITask = MOCK_ACTIVE_TASKS[0];
