# Open4Review Onboarding — Implementation Spec

> **Document purpose**
> Engineering-facing breakdown of the onboarding feature defined in PRD v3.5 Block O. Use this alongside the interactive prototype (visual reference of record) and the Opennote style document (token reference).

---

## 1. Scope

### In scope
- All UI screens from post-authentication through dashboard landing (Block O screens 1–10)
- Client-side state management for the onboarding flow
- Backend persistence of onboarding state and collected data
- Routing and route guards that resume interrupted flows
- Re-onboarding trigger for existing users adding a new role from Settings

### Out of scope
- Authentication / login UI (assumed already implemented)
- Dashboard internals (assumed already implemented)
- Block A / B / C internals
- The actual Coordinator dashboard (this work delivers a placeholder only)

---

## 2. Screen Inventory

| Screen ID | Suggested path | Visible when |
|---|---|---|
| `login` | `/login` | Always (existing route — Block O hooks in after successful sign-in) |
| `welcome` | `/onboarding/welcome` | First Block O screen for first-time users |
| `roles` | `/onboarding/roles` | Always |
| `primary-workspace` | `/onboarding/primary` | Only if 2+ roles selected in `roles` |
| `profile` | `/onboarding/profile` | Always |
| `reviewer-type` | `/onboarding/reviewer/type` | Only if Reviewer selected |
| `reviewer-expertise` | `/onboarding/reviewer/expertise` | Only if Reviewer selected |
| `reviewer-rubrics` | `/onboarding/reviewer/rubrics` | Only if Reviewer selected |
| `reviewer-license` | `/onboarding/reviewer/license` | Only if Reviewer selected |
| `coordinator-placeholder` | `/onboarding/coordinator` | Only if Coordinator selected (currently un-selectable in UI) |
| `done` | `/onboarding/done` | Always |

Paths are suggestions — adapt to the existing project's routing convention.

---

## 3. Routing and Guards

### Forward navigation
Each Continue button persists the current step's data, then navigates to the next visible screen given the current `roles` state.

### Direct URL access
Any direct access to an `/onboarding/*` URL must:
1. Check whether the user has completed required prior steps.
2. If not, redirect to the earliest incomplete required step.
3. If onboarding is fully complete, redirect to the user's primary workspace dashboard.

### Browser back navigation
Allowed within the onboarding flow. The Back button persists the current step's data as draft state and returns to the previous visible step.

### Skip past onboarding
Authenticated users who have completed onboarding cannot land on `/onboarding/*`. Attempting it redirects them to their primary dashboard.

### First post-login redirect
After successful authentication, the auth layer should check the user's onboarding state and redirect:
- If onboarding incomplete → `/onboarding/{last-incomplete-step}`
- If complete → primary workspace dashboard

---

## 4. State Model

### Client-side state (during the flow)

```
{
  currentStep: string,
  roles: ['author' | 'reviewer' | 'coordinator'],
  primaryRole: 'author' | 'reviewer' | null,
  profile: {
    displayName: string,
    institution: string,
    discipline: string,
    roleTitle: string
  },
  reviewer: {
    type: 'academic' | 'industry' | null,
    expertiseTags: string[],
    rubricSpecializations: string[],
    licenseAccepted: boolean,
    licenseAcceptedAt: ISO timestamp | null,
    licenseVersion: string | null
  },
  coordinator: {
    organization: string,
    painPoints: string,
    notifyEmail: string,
    submittedAt: ISO timestamp | null
  }
}
```

### Server-side persistence

Add the following fields to the User model (names are illustrative — match existing project conventions):

**User table additions**
- `user.author_onboarded`: boolean, default false
- `user.reviewer_onboarded`: boolean, default false
- `user.coordinator_interest_logged`: boolean, default false
- `user.primary_role`: enum (`author` | `reviewer` | null)
- `user.profile_display_name`: string
- `user.profile_institution`: string
- `user.profile_discipline`: string
- `user.profile_role_title`: string

**ReviewerProfile table (new)**
- `user_id`: foreign key
- `type`: enum (`academic` | `industry`)
- `expertise_tags`: string array, indexed for Task Pool matching
- `rubric_specializations`: enum array (subset of the six rubrics)
- `license_accepted_at`: timestamp
- `license_version`: string

**CoordinatorInterest table (new)**
- `user_id`: foreign key
- `organization`: string, nullable
- `pain_points`: text, nullable
- `notify_email`: string, nullable
- `submitted_at`: timestamp
- Reserved fields for future use: `permission_tier`, `managed_organizations`, `mediation_queue_access`

**OnboardingProgress table (new)**
- `user_id`: foreign key
- `last_completed_step`: string
- `draft_state`: JSON (for resumability)
- `updated_at`: timestamp

---

## 5. Component Architecture

### Shell components
- `OnboardingShell` — outermost wrapper providing parchment background, brand header, progress bar, and footer slot
- `ProgressBar` — receives currentStep and visibleSteps, computes percentage based on visible steps only
- `OnboardingFooter` — Back / Continue button row; Continue's disabled state is controlled by the current screen

### Screen components
One component per screen ID listed in Section 2. Each receives the current state slice and an onAdvance callback.

### Reusable form components (Opennote-styled)
- `OnboardingCard` — selectable card with icon, title, description, supports selected / disabled states
- `RoleCard` — `OnboardingCard` variant for role selection
- `RubricCard` — variant for the 2-column rubric specialization grid; renders a circular check indicator
- `RadioCard` — variant for single-select like Reviewer Type
- `ChipInput` — multi-select chip group with suggestions plus free-text addition
- `LicenseAgreement` — bordered license-explanation box paired with an acknowledgment checkbox
- `OnboardingField` — labeled input or select wrapper
- `Illustration` — centered SVG container for Welcome and Done screens

The interactive prototype (delivered separately) is the visual reference of record for all these components. Translate the prototype's vanilla HTML into the project's framework while preserving the exact visual treatment.

---

## 6. Data Persistence

### Save points
After each Continue click, persist the current step's data to the backend before navigating forward.

### API endpoints (REST-style; adapt to project's existing API conventions)

```
POST /api/onboarding/welcome-acknowledged
  Marks onboarding_progress.last_completed_step = 'welcome'

POST /api/onboarding/roles
  Body: { roles: string[] }
  Side effect: if 'author' in roles, sets user.author_onboarded = true

POST /api/onboarding/primary-workspace
  Body: { primaryRole: string }

POST /api/onboarding/profile
  Body: { displayName, institution, discipline, roleTitle }

POST /api/onboarding/reviewer/type
  Body: { type: 'academic' | 'industry' }

POST /api/onboarding/reviewer/expertise
  Body: { tags: string[] }

POST /api/onboarding/reviewer/rubrics
  Body: { rubrics: string[] }

POST /api/onboarding/reviewer/license
  Body: { accepted: true, version: string }
  Side effect: stamps license_accepted_at = now(); sets user.reviewer_onboarded = true

POST /api/onboarding/coordinator
  Body: { organization, painPoints, notifyEmail }
  Side effect: sets user.coordinator_interest_logged = true

POST /api/onboarding/complete
  Marks onboarding_progress complete; clears draft_state

GET /api/onboarding/state
  Returns current state for resumability and for the first post-login redirect logic
```

### Optimistic UI
Each Continue may navigate optimistically while the persist call is in flight. On failure, surface a non-blocking toast and keep the user where they are with their input retained.

---

## 7. Validation Rules

| Field | Rule |
|---|---|
| Display name | Required; 1–80 characters |
| Institution | Required; 1–160 characters |
| Discipline | Required; must be one of the dropdown options |
| Role title | Required; must be one of the dropdown options |
| Roles | At least one selected; Coordinator is not selectable |
| Primary role | Required only if 2+ roles selected; must be one of the selected roles |
| Reviewer type | Required if Reviewer in roles |
| Expertise tags | If Reviewer in roles: minimum 2 tags |
| Rubric specializations | If Reviewer in roles: minimum 1 rubric |
| License acceptance | Required boolean true if Reviewer in roles |

All rules enforced both client-side (for UX) and server-side (for integrity).

---

## 8. Design Tokens (Opennote)

Pull from the attached Opennote style reference. Quick summary for implementation:

**Colors**
- Parchment background: `#fffdf8`
- Ink black (primary text): `#0a0a0a`
- Slate gray (secondary text): `#474747`
- Ash gray (tertiary text): `#8c8c8c`
- Whisper border (subtle): `#e5e5e5`
- Ghost border (field outline): `#d1d1d1`
- Burnt umber (primary CTA): `#512906`
- Goldenrod (accent only): `#ffc934`
- Tinted selected state: `#fefaf0`
- Tinted info card background: `#fef5de`

**Typography**
- Heading font: `'Iowan Old Style', Georgia, serif`
- Body font: `'SuisseIntl', Inter, system-ui, sans-serif`
- Weights used: 400 regular, 500 medium
- Heading scale: 32px for screen H1, 18px for brand wordmark
- Body scale: 15px body, 13px small, 12px footnote

**Layout**
- Border radius: 10px (cards, buttons, inputs)
- Card padding: 18–20px
- Input height: ~44px (12px vertical padding)
- Button padding: 12px vertical, 24px horizontal
- Content max width: 480px, centered
- Onboarding shell padding: 28px horizontal, 24–32px vertical

---

## 9. Edge Cases

### Mid-flow refresh
`GET /api/onboarding/state` returns the last persisted state. Client hydrates and resumes at the last completed step + 1.

### User adds a role later (from Settings)
- Settings exposes "Add a role" UI.
- When a user adds Reviewer to an Author-only account:
  - Server flags `user.adding_role = 'reviewer'`
  - Client redirects to `/onboarding/reviewer/type`
  - User walks through only the Reviewer Stage 4 sub-stages
  - On license submission, `user.reviewer_onboarded = true` and the user lands on the Reviewer dashboard

### User declines or skips the license
- Cannot proceed past the license screen.
- Already-collected Reviewer data is retained as draft state, not lost.
- User can return later to accept.

### Zero matching tasks for a Reviewer at landing
- Hero shows empathic empty-state copy: "Tasks matching your expertise will show up here as authors submit. We'll email you when there's a match."
- A notification-frequency control surfaces inline (daily digest / weekly digest / off).

### Network failure mid-step
- Continue button briefly shows a loading state.
- On failure, show a toast: "We couldn't save that. Try again."
- Form state is retained client-side.
- User can retry without losing input.

### Multi-role users at landing
- Persistent workspace switcher in the top corner of the app chrome.
- First-time tooltip points to the switcher.
- Switching workspaces does not re-trigger onboarding.

### Coordinator selection (when enabled in the future)
The card is currently non-selectable in the UI. The data layer and routing must already support a Coordinator-selected user reaching `/onboarding/coordinator` and proceeding — so that flipping the selectable flag in a future release does not require new schema or routing work.

---

## 10. Acceptance Criteria

This feature is complete when all of the following are verifiable:

1. A first-time user can sign in and walk through the full onboarding for any role combination (Author only, Reviewer only, or both).
2. The Coordinator role appears as a warm placeholder, is non-selectable, and reads as forthcoming rather than disabled.
3. Onboarding state persists across browser refreshes; reopening the tab resumes at the last incomplete step.
4. Re-onboarding works: an Author-only user can add Reviewer via Settings and walks through only the Reviewer Stage 4 sub-stages.
5. A user who completes the Reviewer flow lands on the Task Pool with pre-filtered matching tasks, or sees the documented zero-match empty state.
6. A user who completes the Author flow lands on the dashboard with the Submit New Resource CTA prominent.
7. License acceptance is timestamped and version-stamped per the API spec, and the timestamp is visible in the admin or user record.
8. All form validation rules from Section 7 are enforced both client-side and server-side, with server-side as the source of truth.
9. The flow visually matches the Opennote design tokens in Section 8 and the visual treatment shown in the attached prototype.
10. Multi-role users see and can use the workspace switcher in their dashboard chrome.

---

## 11. Reference Materials

- **PRD v3.5 Block O** — functional requirements source of truth
- **Opennote style reference** — color, type, spacing, and component tokens
- **Interactive prototype** (HTML/JS, delivered separately) — visual and interaction reference of record
- **Notion onboarding flow on Mobbin** — referenced pattern for the role identification screen

---

## 12. Open Questions for Engineering

These items were not resolvable at spec-writing time. Surface answers from the existing codebase walk and confirm before implementation:

- What is the existing User model's profile structure? Do `display_name`, `institution`, `discipline`, `role_title` fields already exist in some form? If so, reuse them rather than duplicating.
- Is there an existing onboarding or welcome route? If yes, propose replacement vs. extension.
- Is there an existing analytics layer? If yes, fire events at each step transition (`onboarding.step_completed` with step ID).
- Is there a feature-flag mechanism? This work should ship behind a flag for the first wave of users.
- Auth flow: where does the post-login redirect currently happen? That's the hook point for routing into onboarding.
