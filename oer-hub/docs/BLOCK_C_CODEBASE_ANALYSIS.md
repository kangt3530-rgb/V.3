# Block C redesign — codebase analysis (facts only)

Application root: `oer-hub/`.

---

## 1. Tech Stack

- **Framework:** React 19 + TypeScript + Vite (`react-router-dom` for routing); not Next.js (`oer-hub/package.json`).
- **Styling:** Tailwind CSS + PostCSS; design tokens in `oer-hub/src/design/tokens.ts` (referenced alongside Tailwind classes).
- **State management:** Zustand — `useReviewStore` (`oer-hub/src/store/reviewStore.ts`) for Block B review sessions; `useSessionStore` (`oer-hub/src/store/sessionStore.ts`) for demo role/profile; Block C persistence is **`localStorage` inside `oer-hub/src/api/blockC.ts`** plus `sessionStorage` (`oer-hub/src/api/sessionStorage.ts`) for per-task reviewer drafts (no Redux).
- **Backend:** None in-repo; `oer-hub/src/api/index.ts` documents a repository pattern over mocks + client persistence (“replace with HTTP in production”).
- **Database:** None; mock JSON/OER/task data under `oer-hub/src/api/mock/`.
- **AI/LLM:** No LLM SDK or API keys in dependencies; mediation “AI synthesis” is **`buildAiConsensusDraft`** string templating labeled `[AI synthesis — …]` in `blockC.ts` (lines ~216–236).

---

## 2. Current Block C Code

### File paths (Block C–specific sources)

| Path | Role |
|------|------|
| `oer-hub/src/features/block-c/FeedbackReport.tsx` | Author report route UI |
| `oer-hub/src/features/block-c/MediationQueue.tsx` | Coordinator mediation UI |
| `oer-hub/src/features/block-c/ReportEvidenceDrawer.tsx` | Evidence viewer overlay |
| `oer-hub/src/features/block-c/ReportPrintDocument.tsx` | Printable report subtree |
| `oer-hub/src/features/block-c/ValidationLandingPage.tsx` | Public `/verify/:stampId` |
| `oer-hub/src/features/block-c/rubricLabels.ts` | Rubric display labels |
| `oer-hub/src/api/blockC.ts` | Block C mock API (aggregation, mediation, revision cycle, stamps) |
| `oer-hub/src/api/types.ts` | Domain types including Block C interfaces |
| `oer-hub/src/api/index.ts` | Re-exports `blockC` + session helpers |
| `oer-hub/src/routes/index.tsx` | `/reports/:oerId`, `/coordinator/mediation`, `/verify/:stampId` |
| `oer-hub/src/index.css` | Print rules referencing `#block-c-print-root` |

### Components (one line each)

- **FeedbackReport** — Loads `IAggregatedReport` by `oerId`; filters criteria; revision-card progress + “Summary of revisions” submit; opens evidence drawer; print hook.
- **MediationQueue** — Lists/edits `IMediationItem`, releases to author, shows author packages pending verification and approves revisions.
- **ReportEvidenceDrawer** — Full-screen modal: `ControlledSplitPane` + `MockOERRenderer` (read-only) / stub message for non-mock + `EvidenceBank`.
- **ReportPrintDocument** — Print-oriented layout for report + revision tasks copy.
- **ValidationLandingPage** — Resolves stamp via `getStampById` and renders public certification view.

### Data models (definitions live in `types.ts`)

**Review session (reviewer work product):** `IReviewSession` — not named “Review”.

```ts
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
```

**Criterion (rubric row meta + reviewer toggles):** `IRubricCriterion` + per-session `ICriterionRating` / aggregated row `IAggregatedCriterionFeedback`.

```ts
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
```

```ts
export interface ICriterionRating {
  needsImprovementActive: boolean;
  exceedsActive: boolean;
  proficientConfirmed: boolean;
  needsImprovementText: string;
  exceedsText: string;
}
```

```ts
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
```

**Annotation:**

```ts
export interface IAnnotation {
  id: string;
  taskId: string;
  criterionId: string;
  anchor: AnnotationAnchor;
  comment: string;
  createdAt: string;
}
```

**RevisionCard:**

```ts
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
```

**Report:**

```ts
export interface IAggregatedReport {
  oer: IOer;
  releasedToAuthor: boolean;
  /** When false, author sees placeholder until coordinator releases */
  criteria: IAggregatedCriterionFeedback[];
  revisionCards: IRevisionCard[];
  anchorVersion: IOerVersion;
  currentVersion: IOerVersion;
}
```

### API / backend functions for Block C

All implemented in `blockC.ts` and re-exported from `api/index.ts`: `getAggregatedReport`, `submitReviewToMediation`, `getMediationQueue`, `getMediationItem`, `updateMediationItem`, `releaseMediationToAuthor`, revision cycle (`getRevisionCycleState`, `upsertRevisionCycleState`, `ensureRevisionCardsInitialized`, `setRevisionCardProgress`, `submitAuthorRevisionPackage`, `getOersPendingVerification`), stamps (`getStampById`, `getStampForOer`, `approveAuthorRevisions`), OER status overrides (`getMergedOers`, `getOerById`, etc.).

### Review status “state machine”

No dedicated state-machine library; **`OerStatus` union** on `IOer` (`oer-hub/src/api/types.ts`) defines pipeline values (`submitted` → `under_review` → `in_revision` → `pending_verification` → `certified`). Transitions are imperative in `blockC.ts` (e.g. `releaseMediationToAuthor` sets `in_revision`; `submitAuthorRevisionPackage` sets `pending_verification`; `approveAuthorRevisions` sets `certified`). **`ITask.status`** separately tracks reviewer task lifecycle (`available` | `claimed` | `in_progress` | `completed` | `mediation`).

---

## 3. Current Block B Code (reference)

- **Paths:** `oer-hub/src/features/block-b/ReviewerConsole.tsx` plus `OERPane/*` and `RubricPane/*` (11 TSX files total under `block-b`).
- **Split pane:** `ResizableSplitPane` (`oer-hub/src/components/layout/ResizableSplitPane.tsx`) — **reads/writes `useReviewStore.splitRatio`**; not generic. `ControlledSplitPane` (`oer-hub/src/components/layout/ControlledSplitPane.tsx`) uses **local React state** (used by Block C drawer).
- **AI chatbox / sidebar:** **No** dedicated chat component found; Block B right pane is **`RubricPanel`** (rubric/evidence/submit), not a chat UI.
- **Annotation rendering:** Highlights are **`anchor.rects`** as positioned DOM overlays — e.g. `AnnotationLayer` (`oer-hub/src/features/block-b/OERPane/AnnotationLayer.tsx`) for web/PDF path and `MockOERRenderer` (`oer-hub/src/features/block-b/OERPane/MockOERRenderer.tsx`) for mock HTML content; PDF/web routed via `OERRenderer` (`oer-hub/src/features/block-b/OERPane/OERRenderer.tsx`).

---

## 4. Shared Infrastructure

- **Design system:** Lightweight local primitives — `oer-hub/src/components/ui/` (`Button`, `Card`, `Input`, `Badge`) + tokens `design/tokens.ts`; no external component library in `package.json`.
- **Layout:** `AppShell` (`oer-hub/src/components/layout/AppShell.tsx`) + `TopNav` (`oer-hub/src/components/layout/TopNav.tsx`); Reviewer Console uses `AppShell fullScreen`.
- **Routing:** `BrowserRouter` / `Routes` in `oer-hub/src/routes/index.tsx`.
- **Authentication:** **None** — `useSessionStore` switches demo role/userId locally.
- **Feature flags / env toggles:** **No** `VITE_*` usage or flag modules found; `vite.config.ts` is default plugin-only.

---

## 5. Data Flow

- **B → C:** Reviewer **`submitReviewToMediation`** persists a **`IMediationItem`** to **`localStorage`** key `oer-hub:block-c:mediation-items`; coordinator **`releaseMediationToAuthor`** sets **`oer-hub:mock:oer-status-overrides`** so `IOer.status` becomes **`in_revision`**. Author report **`getAggregatedReport`** reads **`loadSession(taskId)`** from **`sessionStorage`** (keyed per task via `sessionStorage.ts`), not WebSockets/real-time.
- **Shape when “released”:** `Promise<IAggregatedReport | null>` as in §2 (`IAggregatedReport`). Example minimal JSON shape:

```json
{
  "oer": { "id": "oer-001", "title": "...", "status": "in_revision", "rubrics": ["accessibility"], "...": "..." },
  "releasedToAuthor": true,
  "criteria": [
    {
      "taskId": "task-001",
      "rubricTemplateId": "accessibility",
      "criterionId": "C1",
      "criterionTitle": "...",
      "ratingSummary": "needs_improvement",
      "synthesizedComment": "...",
      "annotations": []
    }
  ],
  "revisionCards": [
    {
      "id": "oer-001::task-001::accessibility::C1",
      "oerId": "oer-001",
      "taskId": "task-001",
      "rubricTemplateId": "accessibility",
      "criterionId": "C1",
      "title": "...",
      "kind": "local",
      "synthesizedFeedback": "...",
      "annotationIds": ["ann-demo-1"]
    }
  ],
  "anchorVersion": { "id": "oer-001-v1", "label": "1.0", "...": "..." },
  "currentVersion": { "id": "oer-001-v-current", "label": "1.1 (draft)", "...": "..." }
}
```

- **Per-rubric vs by OER:** Rows carry **`rubricTemplateId`** (`IAggregatedCriterionFeedback`), but **`getAggregatedReport`** currently builds criteria from **`tasks[0]`’s session only** (`primaryTask = tasks[0]`, `loadSession(taskId)`), so aggregation is **one submitted session per OER** in this mock — not merged multi-task/multi-rubric sessions unless extended.

---

## 6. Built vs stub

| Piece | Status |
|-------|--------|
| **FeedbackReport** | **Functional** for demo: filters, drawer, revision progress (`localStorage`), summary submit, certified stamp display; empty criteria if released but no submitted session (except seeded **`oer-001`** demo session). |
| **MediationQueue** | **Functional** mock (list, edit text, release, approve packages). |
| **ReportEvidenceDrawer** | **Partial:** mock OER highlights work via **`MockOERRenderer`** + **`EvidenceBank`**; non-mock shows placeholder copy (“External OER preview”). |
| **ReportPrintDocument** | **Functional** print subtree used by FeedbackReport. |
| **ValidationLandingPage** | **Functional** for stamps in **`localStorage`**. |
| **`blockC.ts` aggregation** | **Demo-limited:** single-session aggregation + **`demoSessionForOer001`** shortcut. |

**Worth preserving when redesigning:** Type definitions in `types.ts`, `blockC.ts`/`api/index.ts` contracts, and working flows (mediation release → report → revision cycle → verification → stamp) unless replacing the mock backend intentionally.

---

## 7. Deployment

- **How deployed:** Repo contains **no** `vercel.json`, `Dockerfile`, or IaC; root `README.md` is a stub (“V.3”); `oer-hub/README.md` is the stock Vite template — **deployment target not specified in codebase**.
- **Staging:** **Not defined** in repo.
- **CI/CD:** **No** `.github/workflows` (or similar) present — **no CI configuration in-tree**.
