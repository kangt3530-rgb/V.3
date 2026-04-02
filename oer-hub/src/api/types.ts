// ─── Domain types ────────────────────────────────────────────────────────────
// These types are shared across the entire application.
// When a real backend is added, only src/api/mock/ changes; these types stay.

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

export type OerType = "url" | "pdf";

export type RatingValue = "needs_improvement" | "proficient" | "exceeds";

// ─── OER resource ────────────────────────────────────────────────────────────

export interface IOer {
  id: string;
  title: string;
  subject: string;
  author: string;
  authorId: string;
  oerType: OerType;
  oerSource: string;        // URL string or filename for PDF
  license: CCLicense;
  rubrics: RubricTemplateId[];
  status: OerStatus;
  submittedAt: string;      // ISO date string
  updatedAt: string;
  thirdPartyContent?: string;
}

// ─── Review task ─────────────────────────────────────────────────────────────

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

// ─── Annotation ──────────────────────────────────────────────────────────────

export interface AnnotationAnchor {
  type: "pdf" | "web";
  selectedText: string;
  // PDF
  page?: number;
  charStart?: number;
  charEnd?: number;
  // Web overlay
  xpath?: string;
  startOffset?: number;
  endOffset?: number;
  // Bounding boxes for highlight rendering (relative to OER pane container)
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

// ─── Criterion rating ─────────────────────────────────────────────────────────

export interface ICriterionRating {
  rating: RatingValue | null;
  needsImprovementText: string;
  exceedsText: string;
}

// ─── Full review session ──────────────────────────────────────────────────────

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

// ─── Rubric template ──────────────────────────────────────────────────────────

export interface IRubricCriterion {
  id: string;
  title: string;
  standard: string;       // Center column: "Proficient Standard" description
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
