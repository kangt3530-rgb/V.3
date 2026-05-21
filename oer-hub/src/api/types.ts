// ─── Domain types ────────────────────────────────────────────────────────────

export type UserRole = "author" | "reviewer" | "coordinator";

export type OerStatus =
  | "submitted"
  | "under_review"
  /** Feedback released to author; author is responding per-criterion */
  | "feedback_available"
  /** Author submitted revision package; coordinator final check */
  | "pending_verification"
  | "certified"
  /** Reserved for future multi-cycle support */
  | "revision_requested_again";

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
  /** Set when surfaced in a Block C report; optional so Block B can create annotations without it. */
  polarity?: "positive" | "negative";
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

// ─── Block C: Reports, mediation, revision, stamps ─────────────────────────

/** High-level outcome shown to authors (maps from Block B toggles). */
export type CriterionRatingSummary =
  | "needs_improvement"
  | "proficient"
  | "exceeds"
  | "mixed";

export interface IOerVersion {
  id: string;
  oerId: string;
  label: string;
  createdAt: string;
  oerType: OerType;
  oerSource: string;
}

/** One row in the per-rubric feedback report (per rubric × criterion). */
export interface IAggregatedCriterionFeedback {
  taskId: string;
  rubricTemplateId: RubricTemplateId;
  criterionId: string;
  criterionTitle: string;
  /** Short rubric definition text shown in "About this criterion" section. */
  criterionStandard: string;
  ratingSummary: CriterionRatingSummary;
  /** Reviewer's holistic criterion-level assessment. */
  overallComment: string;
  /** Specific anchored reviewer notes with location + comment. */
  annotations: IAnnotation[];
}

/** Feedback report scoped to one rubric review (replaces IAggregatedReport). */
export interface IPerRubricReport {
  oer: IOer;
  rubricTemplateId: RubricTemplateId;
  rubricName: string;
  reviewCompletedAt: string;
  releasedToAuthor: boolean;
  criteria: IAggregatedCriterionFeedback[];
  anchorVersion: IOerVersion;
  currentVersion: IOerVersion;
}

export type MediationItemStatus = "pending" | "released";

export interface IMediationItem {
  id: string;
  oerId: string;
  oerTitle: string;
  taskIds: string[];
  status: MediationItemStatus;
  /** Mock AI / merge layer — shown to coordinator for editing */
  aiConsensusDraft: string;
  /** Optional second reviewer voice for C.2 demo */
  reviewerBConflictNote?: string;
  /** Edited text coordinator approves */
  coordinatorReleaseText?: string;
  createdAt: string;
  releasedAt?: string;
}

/** Public certification record (C.10 / C.11) — no private annotations. */
export interface IDigitalStamp {
  id: string;
  oerId: string;
  oerTitle: string;
  subject: string;
  authorDisplay: string;
  license: CCLicense;
  issuedAt: string;
  rubricsApplied: RubricTemplateId[];
  /** Short public summary only */
  certificationSummary: string;
}

// ─── Block C: Author response layer ─────────────────────────────────────────

export type RevisionStatus = "unresolved" | "resolved" | "awaiting_clarification";

export interface ICoordinatorQuestion {
  id: string;
  questionText: string;
  sentAt: string;
  reply: string | null;
  repliedAt: string | null;
}

export interface ICriterionResponse {
  oerId: string;
  rubricTemplateId: RubricTemplateId;
  criterionId: string;
  revisionLog: string;
  coordinatorQuestion: ICoordinatorQuestion | null;
  status: RevisionStatus;
  resolvedAt: string | null;
}

export interface IRevisionSubmission {
  oerId: string;
  rubricTemplateId: RubricTemplateId;
  submittedAt: string;
  revisedOerUrl: string | null;
  revisedOerFileId: string | null;
  criterionResponses: ICriterionResponse[];
  coverNote: string;
  /** Tracks whether the cover note was AI-assisted (transparency). */
  coverNoteAiGenerated: boolean;
}
