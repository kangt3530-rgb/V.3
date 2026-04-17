// ─── Domain types ────────────────────────────────────────────────────────────

export type UserRole = "author" | "reviewer" | "coordinator";

export type OerStatus =
  | "submitted"
  | "under_review"
  | "in_revision"
  /** Author submitted revision summary; coordinator final check */
  | "pending_verification"
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

/** One row in the aggregated feedback report (per task × criterion). */
export interface IAggregatedCriterionFeedback {
  taskId: string;
  rubricTemplateId: RubricTemplateId;
  criterionId: string;
  criterionTitle: string;
  ratingSummary: CriterionRatingSummary;
  /** Coordinator / AI synthesized text shown to author */
  synthesizedComment: string;
  /** Immutable reviewer evidence (read-only for author). */
  annotations: IAnnotation[];
}

export type RevisionCardKind = "local" | "global";

export interface IRevisionCard {
  id: string;
  oerId: string;
  taskId: string;
  rubricTemplateId: RubricTemplateId;
  criterionId: string;
  title: string;
  kind: RevisionCardKind;
  synthesizedFeedback: string;
  annotationIds: string[];
}

export interface IRevisionCardProgress {
  cardId: string;
  resolved: boolean;
  fixLog: string;
  /** Pending question routed to coordinator (mock). */
  coordinatorQuestion: string;
}

export interface IRevisionCycleState {
  oerId: string;
  cards: IRevisionCardProgress[];
  summaryOfRevisions: string;
  submittedForVerification: boolean;
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

export interface IAggregatedReport {
  oer: IOer;
  releasedToAuthor: boolean;
  /** When false, author sees placeholder until coordinator releases */
  criteria: IAggregatedCriterionFeedback[];
  revisionCards: IRevisionCard[];
  anchorVersion: IOerVersion;
  currentVersion: IOerVersion;
}
