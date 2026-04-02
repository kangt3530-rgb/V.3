// ─── Domain types ────────────────────────────────────────────────────────────

export type UserRole = "author" | "reviewer" | "coordinator";

export type OerStatus =
  | "submitted"
  | "under_review"
  | "in_revision"
  | "certified";

export type CCLicense =
  | "CC BY"
  | "CC BY-SA"
  | "CC BY-ND"
  | "CC BY-NC"
  | "CC BY-NC-SA"
  | "CC BY-NC-ND";

export type RubricTemplateId =
  | "accessibility"
  | "copy-editing"
  | "copyright"
  | "disciplinary"
  | "elearning"
  | "udl";

export type OerType = "url" | "pdf" | "mock";

/** @deprecated Legacy single-select rubric */
export type RatingValue = "needs_improvement" | "proficient" | "exceeds";

export interface IOer {
  id: string;
  title: string;
  subject: string;
  author: string;
  authorId: string;
  oerType: OerType;
  oerSource: string;
  license: CCLicense;
  rubrics: RubricTemplateId[];
  status: OerStatus;
  submittedAt: string;
  updatedAt: string;
  thirdPartyContent?: string;
}

export interface ITask {
  id: string;
  oerId: string;
  oer: IOer;
  rubricTemplateId: RubricTemplateId;
  reviewerId?: string;
  status: "available" | "claimed" | "in_progress" | "completed" | "mediation";
  completionPercent: number;
  claimedAt?: string;
  submittedAt?: string;
}

export interface AnnotationAnchor {
  type: "pdf" | "web";
  selectedText: string;
  page?: number;
  charStart?: number;
  charEnd?: number;
  xpath?: string;
  startOffset?: number;
  endOffset?: number;
  rects: { top: number; left: number; width: number; height: number }[];
}

export interface IAnnotation {
  id: string;
  taskId: string;
  criterionId: string;
  anchor: AnnotationAnchor;
  comment: string;
  createdAt: string;
}

export interface ICriterionRating {
  needsImprovementActive: boolean;
  exceedsActive: boolean;
  proficientConfirmed: boolean;
  needsImprovementText: string;
  exceedsText: string;
}

export interface IReviewSession {
  taskId: string;
  oerId: string;
  oerType: OerType;
  oerSource: string;
  rubricTemplateId: RubricTemplateId;
  annotations: IAnnotation[];
  ratings: Record<string, ICriterionRating>;
  splitRatio: number;
  oerScrollY: number;
  lastSaved: string;
  status: "draft" | "submitted";
}

export interface IRubricCriterion {
  id: string;
  title: string;
  standard: string;
  needsImprovementPrompt: string;
  exceedsPrompt: string;
}

export interface IRubricTemplate {
  id: RubricTemplateId;
  name: string;
  description: string;
  preamble: string;
  criteria: IRubricCriterion[];
}
