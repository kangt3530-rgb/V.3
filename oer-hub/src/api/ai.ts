// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** What to show in the chat UI — may differ from content (the actual API payload). */
  displayContent?: string;
  type?: "term_lookup" | "r4_standards";
  term?: string;
  collapsed?: boolean;
}

export interface AIFeatureContext {
  rubricName: string;
  criterionId?: string;
  criterionTitle?: string;
  criterionStandard?: string;
  reviewerDraft?: string;
  selectedText?: string;
}

export interface ActiveNudge {
  id: string;
  criterionId: string;
  message: string;
  dismissed: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "VITE_GEMINI_API_KEY is not set. Add it to your .env file."
    );
  }
  return key as string;
}

const MODEL = "gemini-flash-latest";
const MAX_TOKENS = 1000;

function geminiUrl(endpoint: "generateContent" | "streamGenerateContent", apiKey: string): string {
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:${endpoint}`;
  return endpoint === "streamGenerateContent" ? `${base}?key=${apiKey}&alt=sse` : `${base}?key=${apiKey}`;
}

// Gemini uses "model" for the assistant role; our ChatMessage uses "assistant"
function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function buildRequestBody(messages: ChatMessage[], systemPrompt: string, maxTokens = MAX_TOKENS) {
  return JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: toGeminiContents(messages),
    generationConfig: { maxOutputTokens: maxTokens },
  });
}

// ─── R4: Standards reference ──────────────────────────────────────────────────

const R4_SYSTEM_BLOCK = `### R4: STANDARDS REFERENCE LOOKUP INSTRUCTIONS

When you receive a message tagged [R4 STANDARDS REFERENCE REQUEST], respond with the standards list for the specified rubric using the format below.

**Response rules:**
- Use your training knowledge only. Do not search the web.
- For each standard: show its **name**, then a **1–2 sentence excerpt or clause** most directly relevant to the reviewer's active criterion (if provided), or most central to the rubric overall (if no criterion is specified).
- If an active criterion is provided, open with one sentence connecting the criterion to why these standards matter, then list the standards.
- Keep the tone concise and reference-like — not conversational.
- End with: "You can ask me about any of these in more detail."

**Standards by rubric — use exactly these, do not add or remove. Include the markdown hyperlinks exactly as written below — do not alter or omit any URL:**

#### 1. Accessibility
- **[WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)** (W3C) — Core web accessibility standard. Key clause: success criteria covering perceivable, operable, understandable, and robust content, including contrast ratios (1.4.3), alt text (1.1.1), and heading structure (1.3.1).
- **[Section 508](https://www.access-board.gov/ict/)** (U.S. Access Board) — Federal accessibility requirements for electronic content; requires equivalent access for users with disabilities.
- **[UDL Guidelines](https://udlguidelines.cast.org/)** (CAST) — Provides accessibility-adjacent design principles focused on removing barriers to perception and navigation.
- **[MERLOT Accessibility Checkpoints](https://www.merlot.org/merlot/viewAccessibilityCheckpoints.htm)** (CSU) — Checklist-based criteria for evaluating OER accessibility across media types.
- **[OER Accessibility Evaluation Rubric](https://www.affordablelearninggeorgia.org/open_textbooks/rubric/)** (Affordable Learning Georgia) — Rubric criteria for systematically reviewing accessibility in open textbooks.

#### 2. Copy Editing
- **[Chicago Manual of Style, 17th ed.](https://www.chicagomanualofstyle.org/)** — Authoritative style guide for grammar, punctuation, citation, and usage in academic publishing.
- **[APA Publication Manual, 7th ed.](https://apastyle.apa.org/)** — Standard for social sciences; governs in-text citation format, reference lists, and bias-free language.
- **[BCcampus Open Education Publishing Style Guide](https://opentextbc.ca/selfpublishguide/)** — OER-specific editorial standards for open textbook formatting and language consistency.
- **[AAC&U VALUE Rubric for Written Communication](https://www.aacu.org/initiatives/value-initiative/value-rubrics)** — Defines college-level expectations for clarity, mechanics, and genre conventions.
- **[CAUL OER Copyedit and Proofread Workflow](https://www.caul.edu.au/caul-programs/open-educational-resources)** (Council of Australian University Librarians) — Process standard for systematic copy editing of open resources.

#### 3. Copyright
- **[U.S. Copyright Act, 17 U.S.C. § 107](https://www.copyright.gov/title17/92chap1.html#107)** (Fair Use) — The four-factor fair use test: purpose and character, nature of work, amount used, market effect.
- **[Creative Commons License Framework](https://creativecommons.org/licenses/)** — Defines CC BY, CC BY-SA, CC BY-NC, CC0 terms and compatibility rules for combining openly licensed content.
- **[Code of Best Practices in Fair Use for OER](https://cmsimpact.org/code/open-educational-resources/)** (American University / NC State) — Practical guidance on applying fair use specifically in open educational resource contexts.
- **[U.S. Copyright Office Circular 1: Copyright Basics](https://www.copyright.gov/circs/circ01.pdf)** — Foundational definitions of copyrightable works, public domain, and ownership.
- **[Cornell Fair Use Checklist](https://copyright.cornell.edu/fairuse)** — Structured tool for documenting fair use analysis across the four statutory factors.

#### 4. Disciplinary Appropriateness
- **[AAC&U VALUE Rubric Development Guidelines](https://www.aacu.org/initiatives/value-initiative/value-rubrics)** — Framework for defining college-level disciplinary expectations across content areas.
- **[Boyer Model of Scholarship](https://www.aaup.org/sites/default/files/files/AAUP-Boyer.pdf)** — Defines scholarly rigor across discovery, integration, application, and teaching dimensions.
- **[ACRL Framework for Information Literacy](https://www.ala.org/acrl/standards/ilframework)** — Standards for source quality, currency, and evidence-based reasoning in higher education materials.
- **[HLC Criteria for Accreditation](https://www.hlcommission.org/Policies/criteria-and-core-components.html)** (Regional Accreditation) — Defines college-level cognitive demand and learning outcome appropriateness.

#### 5. eLearning Review
- **[QM Higher Education Rubric](https://www.qualitymatters.org/qa-resources/rubric-standards/higher-ed-rubric)** (Quality Matters) — Industry standard for online course design quality, covering usability, alignment, and accessibility.
- **[WCAG 2.1 AA](https://www.w3.org/WAI/WCAG21/quickref/)** (W3C) — Applies to all interactive and multimedia eLearning components; see Accessibility rubric for full clause details.
- **[IMS Global LTI / Common Cartridge Standards](https://www.imsglobal.org/activity/common-cartridge)** — Technical interoperability standards for LMS integration and content portability.
- **[FERPA](https://studentprivacy.ed.gov/)** (20 U.S.C. § 1232g) — Federal student data privacy law applicable to LMS-integrated tools that collect or process learner data.
- **[Section 508](https://www.access-board.gov/ict/)** (U.S. Access Board) — Applies to eLearning platforms and interactive tools used in federally funded educational contexts.

#### 6. Universal Design for Learning (UDL)
- **[UDL Guidelines 2.2](https://udlguidelines.cast.org/)** (CAST) — The canonical three-principle framework: multiple means of Representation, Action & Expression, and Engagement.
- **[IDEA 2004 / ADA Title II](https://sites.ed.gov/idea/)** — Legal foundation for disability-inclusive design in educational settings; informs UDL's equity rationale.
- **[AAC&U VALUE Rubric for Lifelong Learning](https://www.aacu.org/initiatives/value-initiative/value-rubrics)** — Defines metacognitive and self-regulation expectations that align with UDL Engagement principles.
- **[Disability Justice Framework](https://sinsinvalid.org/blog/10-principles-of-disability-justice)** (Sins Invalid, 10 Principles) — Equity lens for evaluating whether UDL choices center the most impacted learners.
- **[ASCCC OERI](https://oeri.asccc.org/)** (California Community Colleges) — OER-specific UDL implementation guidance for community college contexts.`;

export function buildR4Prompt(
  activeRubricName: string,
  activeCriterion?: { id: string; title: string }
): string {
  const criterionLine = activeCriterion
    ? `The reviewer is currently working on: ${activeCriterion.title} (${activeCriterion.id}).`
    : `The reviewer has not focused on a specific criterion yet.`;

  return [
    "[R4 STANDARDS REFERENCE REQUEST]",
    `Active rubric: ${activeRubricName}`,
    criterionLine,
    "Please return the standards reference list for this rubric as specified in your system prompt.",
  ].join("\n");
}

// ─── System prompt builder ─────────────────────────────────────────────────────

export function buildSystemPrompt(
  context: AIFeatureContext,
  handbookContent: string
): string {
  const parts: string[] = [
    "You are an AI assistant helping a peer reviewer evaluate an Open Educational Resource (OER) using a structured rubric. Your role is to support the reviewer's thinking — not to make rating decisions for them.",
    "",
    `Rubric: ${context.rubricName}`,
  ];

  if (context.criterionTitle) {
    parts.push(`Criterion: ${context.criterionTitle}`);
  }
  if (context.criterionStandard) {
    parts.push(`Standard: ${context.criterionStandard}`);
  }
  if (context.reviewerDraft) {
    parts.push("", `Reviewer's current draft notes: ${context.reviewerDraft}`);
  }
  if (context.selectedText) {
    parts.push("", `Selected text from the OER: "${context.selectedText}"`);
  }
  if (handbookContent) {
    parts.push("", "Relevant handbook guidance:", handbookContent);
  }

  parts.push(
    "",
    "Important: Do not assign a rating or tell the reviewer what score to give. Instead, help them think through the evidence, ask clarifying questions, and surface relevant criteria from the rubric and handbook. The final rating decision belongs to the reviewer."
  );

  parts.push("", R4_SYSTEM_BLOCK);

  return parts.join("\n");
}

// ─── callGemini (non-streaming) ───────────────────────────────────────────────

export async function callGemini(
  messages: ChatMessage[],
  systemPrompt: string,
  maxTokens = MAX_TOKENS
): Promise<string> {
  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (e) {
    return `Configuration error: ${(e as Error).message}`;
  }

  try {
    const response = await fetch(geminiUrl("generateContent", apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: buildRequestBody(messages, systemPrompt, maxTokens),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      return `API error ${response.status}: ${errorBody || response.statusText}`;
    }

    const data = await response.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      return "Unexpected response format from AI service.";
    }
    return text;
  } catch (e) {
    return `Network error: ${(e as Error).message}`;
  }
}

// ─── callGeminiOnce — single-turn, configurable max tokens ───────────────────

export async function callGeminiOnce(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number
): Promise<string> {
  return callGemini([{ role: "user", content: userMessage }], systemPrompt, maxTokens);
}

// ─── callGeminiStream (SSE streaming) ─────────────────────────────────────────

export async function callGeminiStream(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void
): Promise<void> {
  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (e) {
    onChunk(`Configuration error: ${(e as Error).message}`);
    return;
  }

  let response: Response;
  try {
    response = await fetch(geminiUrl("streamGenerateContent", apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: buildRequestBody(messages, systemPrompt),
    });
  } catch (e) {
    onChunk(`Network error: ${(e as Error).message}`);
    return;
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    onChunk(`API error ${response.status}: ${errorBody || response.statusText}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onChunk("Stream unavailable: response body is null.");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === "data: [DONE]") return;
      if (!trimmed.startsWith("data: ")) continue;

      const jsonStr = trimmed.slice("data: ".length);
      try {
        const event = JSON.parse(jsonStr);
        // Gemini SSE: each chunk has candidates[0].content.parts[0].text
        const text: string | undefined =
          event?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text === "string") {
          onChunk(text);
        }
      } catch {
        // Malformed JSON line — skip silently
      }
    }
  }
}

// ─── R6 & R8: Shared tone personas ───────────────────────────────────────────

export type ToneName = "neutral" | "collegial" | "editor" | "mentor";

export interface R13Prefs {
  enabled: boolean;
  showCriterionName: boolean;
  showPattern: boolean;
  showMissing: boolean;
}

export interface AIPreferences {
  coherenceCheckEnabled: boolean;
  gapCheckEnabled: boolean;
  nudgeTone: ToneName;
  toneCheckEnabled: boolean;
  substanceCheckEnabled: boolean;
  r13: R13Prefs;
}

export const DEFAULT_AI_PREFERENCES: AIPreferences = {
  coherenceCheckEnabled: true,
  gapCheckEnabled: true,
  nudgeTone: "neutral",
  toneCheckEnabled: true,
  substanceCheckEnabled: true,
  r13: {
    enabled: true,
    showCriterionName: true,
    showPattern: true,
    showMissing: true,
  },
};

const TONE_PERSONA: Record<ToneName, string> = {
  neutral: `You are a neutral review assistant. Be plain and informational. No warmth, no personality. State observations directly in 1–2 sentences. Always name the specific criterion (e.g. "C3") and the specific reason for the observation.`,
  collegial: `You are a collegial peer reviewer — warm, encouraging, conversational. Use "you" naturally. Keep it brief but human. Always name the specific criterion (e.g. "C3") and the specific reason for the observation.`,
  editor: `You are a professional editor — precise, concise, slightly formal. No hedging. Always name the specific criterion (e.g. "C3") and the specific reason for the observation.`,
  mentor: `You are a coaching mentor — supportive and reflective. Ask one short question that helps the reviewer think it through. Always name the specific criterion (e.g. "C3") and the specific reason for the observation.`,
};

// ─── R6: Per-criterion coherence check ───────────────────────────────────────

export type CoherenceSignal =
  | "rating_ni_all_positive_annotations"
  | "rating_exceeds_all_negative_annotations"
  | "comment_sentiment_conflicts_rating"
  | "no_annotations_for_criterion"
  | "comment_length_far_below_average"
  | "comment_extremely_short"
  | "comment_generic_no_criterion_reference";

export interface ComputeCoherenceSignalsParams {
  comment: string;
  criterionId: string;
  criterionTitle: string;
  /** Word counts of comments for all other rated criteria (exclude current). */
  otherCommentWordCounts: number[];
}

export interface R6Params {
  criterionId: string;
  criterionTitle: string;
  templateName: string;
  rating: "exceeds" | "proficient" | "needs_improvement";
  annotationCount: number;
  commentWordCount: number;
  avgCommentWordCount: number;
  detectedSignals: CoherenceSignal[];
  tone: ToneName;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "is", "are", "was", "were",
  "be", "been", "being", "its", "their", "this", "that",
]);

export function hasCriterionReference(comment: string, criterionId: string, criterionTitle: string): boolean {
  const lower = comment.toLowerCase();
  if (lower.includes(criterionId.toLowerCase())) return true;
  const titleWords = criterionTitle.toLowerCase()
    .split(/[\s&/()-]+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  return titleWords.some((w) => lower.includes(w));
}

export function computeCoherenceSignals(params: ComputeCoherenceSignalsParams): CoherenceSignal[] {
  const signals: CoherenceSignal[] = [];
  const wc = countWords(params.comment);

  if (wc < 20) signals.push("comment_extremely_short");

  if (params.otherCommentWordCounts.length > 0) {
    const avg =
      params.otherCommentWordCounts.reduce((a, b) => a + b, 0) /
      params.otherCommentWordCounts.length;
    if (avg > 0 && wc < avg * 0.4) signals.push("comment_length_far_below_average");
  }

  // Only flag generic if comment is long enough that absence of criterion words is meaningful
  if (wc >= 5 && !hasCriterionReference(params.comment, params.criterionId, params.criterionTitle)) {
    signals.push("comment_generic_no_criterion_reference");
  }

  return signals;
}

export function buildR6SystemPrompt(tone: ToneName): string {
  return `You are a review quality assistant embedded in an OER peer review platform.

Your role: surface a brief, non-authoritative observation when a reviewer's rating, annotations, and overall comment for a single criterion appear inconsistent.

Rules:
- ALWAYS name the specific criterion (e.g. "C3 — Alternative Text & Image Accessibility").
- ALWAYS state the specific reason (e.g. "your rating is Needs Improvement but your annotations are all positive").
- Keep your message to 1–3 sentences maximum.
- Never tell the reviewer they are wrong. This is an observation, not a correction.
- Never suggest what the correct rating or comment should be.
- End with a soft invitation to review (e.g. "— want to take another look?"), not a directive.
- Output plain text only. No markdown, no bullet points, no headers.

${TONE_PERSONA[tone]}`;
}

export function buildR6UserMessage(params: R6Params): string {
  const signalLines = params.detectedSignals.map((s) => `- ${s}`).join("\n");
  return [
    `The reviewer is working on: ${params.criterionId} — ${params.criterionTitle}`,
    `Rubric template: ${params.templateName}`,
    `Current rating: ${params.rating}`,
    `Annotation count: ${params.annotationCount}`,
    `Annotation sentiment breakdown: 0 positive, 0 negative`,
    `Overall comment word count: ${params.commentWordCount}`,
    `Reviewer's average comment word count across all criteria so far: ${Math.round(params.avgCommentWordCount)}`,
    ``,
    `Detected inconsistencies:`,
    signalLines,
    ``,
    `Generate a single nudge message for this criterion.`,
  ].join("\n");
}

export async function callR6CoherenceCheck(params: R6Params): Promise<string> {
  return callGeminiOnce(buildR6SystemPrompt(params.tone), buildR6UserMessage(params), 200);
}

// ─── R8: Pre-submit gap check ─────────────────────────────────────────────────

export type GapType =
  | "comment_under_20_words"
  | "no_annotations_ni_or_exceeds"
  | "comment_generic"
  | "comment_blank"
  | "comment_far_below_average";

export interface GapSignal {
  criterionId: string;
  criterionTitle: string;
  gaps: GapType[];
}

export interface ComputeGapSignalsParams {
  criteria: Array<{ id: string; title: string }>;
  ratings: Record<
    string,
    {
      needsImprovementActive: boolean;
      exceedsActive: boolean;
      needsImprovementText: string;
      exceedsText: string;
    }
  >;
  annotationCountByCriterion: Record<string, number>;
}

export function computeGapSignals(params: ComputeGapSignalsParams): GapSignal[] {
  const { criteria, ratings, annotationCountByCriterion } = params;

  // Compute average word count across criteria that have a comment
  const allWordCounts = criteria
    .map((c) => {
      const r = ratings[c.id];
      if (!r) return 0;
      const text = r.needsImprovementActive
        ? r.needsImprovementText
        : r.exceedsActive
          ? r.exceedsText
          : "";
      return countWords(text);
    })
    .filter((n) => n > 0);
  const avg =
    allWordCounts.length > 0
      ? allWordCounts.reduce((a, b) => a + b, 0) / allWordCounts.length
      : 0;

  const result: GapSignal[] = [];

  for (const c of criteria) {
    const r = ratings[c.id];
    if (!r) continue;

    const comment = r.needsImprovementActive
      ? r.needsImprovementText
      : r.exceedsActive
        ? r.exceedsText
        : "";
    const annCount = annotationCountByCriterion[c.id] ?? 0;
    const wc = countWords(comment);
    const gaps: GapType[] = [];

    if (!comment.trim()) {
      if (r.needsImprovementActive || r.exceedsActive) gaps.push("comment_blank");
    } else {
      if (wc < 20) gaps.push("comment_under_20_words");
      if (avg > 0 && wc < avg * 0.4) gaps.push("comment_far_below_average");
      if (!hasCriterionReference(comment, c.id, c.title)) gaps.push("comment_generic");
    }

    if ((r.needsImprovementActive || r.exceedsActive) && annCount === 0) {
      gaps.push("no_annotations_ni_or_exceeds");
    }

    if (gaps.length > 0) result.push({ criterionId: c.id, criterionTitle: c.title, gaps });
  }

  return result;
}

export interface R8Params {
  templateName: string;
  totalCriteria: number;
  avgCommentWordCount: number;
  gapSignals: GapSignal[];
  tone: ToneName;
}

export function buildR8SystemPrompt(tone: ToneName): string {
  return `You are a review quality assistant embedded in an OER peer review platform.

Your role: produce a pre-submission gap summary that helps the reviewer spot under-supported criteria before they submit.

Rules:
- Group findings by gap type, not by criterion. Use these exact group labels:
    - "Missing annotations" — criteria with NI or Exceeds rating but no annotations
    - "Short or blank comments" — criteria with comments under 20 words or no comment
    - "Generic comments" — criteria where the comment doesn't reference criterion-specific content
    - "Notably brief" — criteria whose comment is far shorter than the reviewer's own average
- Within each group, list affected criterion IDs and titles.
- After the grouped list, add one short sentence: "You can return to any criterion or proceed to submit."
- Keep the full output under 120 words.
- Do not evaluate the quality of the content — only report structural gaps.
- Do not tell the reviewer they must fix anything.
- Output plain text only. No markdown headers, no bullet symbols beyond simple dashes.

${TONE_PERSONA[tone]}`;
}

export function buildR8UserMessage(params: R8Params): string {
  return [
    `Rubric template: ${params.templateName}`,
    `Total criteria reviewed: ${params.totalCriteria}`,
    `Reviewer's average comment word count: ${Math.round(params.avgCommentWordCount)}`,
    ``,
    `Gap summary per criterion:`,
    JSON.stringify(params.gapSignals, null, 2),
    ``,
    `Generate a grouped pre-submission gap report.`,
  ].join("\n");
}

export async function callR8GapCheck(params: R8Params): Promise<string> {
  return callGeminiOnce(buildR8SystemPrompt(params.tone), buildR8UserMessage(params), 300);
}

// ─── R3: Tone check ───────────────────────────────────────────────────────────

export interface R3ToneResult {
  hasToneIssue: boolean;
  issueType: "harsh" | "soft" | "passive-aggressive" | null;
  problematicPhrase: string | null;
  diagnosis: string | null;
  reflectiveQuestion: string | null;
  sentenceStarter: string | null;
}

export async function callR3ToneCheck(
  comment: string,
  criterionName: string,
  criterionStandard: string
): Promise<R3ToneResult | null> {
  const systemPrompt = `You are a peer review tone coach for OER (Open Educational Resource) quality reviewers.
Your job is to identify tone problems in reviewer comments — not to rewrite them.

Analyze the following reviewer comment for tone issues. Look for:
- Harsh or personal language that attacks the author rather than the work
- Excessively soft or vague praise that avoids substantive critique
- Passive-aggressive, sarcastic, or dismissive phrasing

The rubric context is: ${criterionName} — ${criterionStandard}

Respond in JSON only:
{
  "hasToneIssue": boolean,
  "issueType": "harsh" | "soft" | "passive-aggressive" | null,
  "problematicPhrase": "exact phrase from the comment that is the problem, or null",
  "diagnosis": "one sentence explaining the issue in plain language, or null",
  "reflectiveQuestion": "one open-ended question to help the reviewer reconsider their phrasing, or null",
  "sentenceStarter": "an optional sentence starter (e.g., 'One area that could be strengthened is...'), or null"
}`;

  const raw = await callGeminiOnce(systemPrompt, comment, 500);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as R3ToneResult;
  } catch {
    return null;
  }
}

// ─── R16: Substance check ─────────────────────────────────────────────────────

export interface R16SubstanceResult {
  hasSubstanceIssue: boolean;
  diagnosis: string | null;
  reflectiveQuestion: string | null;
  sentenceStarters: string[];
}

export async function callR16SubstanceCheck(
  comment: string,
  criterionName: string,
  criterionStandard: string,
  annotationCount: number
): Promise<R16SubstanceResult | null> {
  const systemPrompt = `You are a peer review quality coach for OER reviewers. Your job is to identify when comments are too general — not to rewrite them.

Analyze the following reviewer comment. Determine if it contains at least one concrete reference to the OER content, such as:
- A direct quote or paraphrase from the resource
- A reference to a specific page, section, chapter, or figure
- A citation of a specific rubric standard or criterion language

The rubric context is: ${criterionName} — ${criterionStandard}
Annotations linked to this criterion: ${annotationCount} annotations

Respond in JSON only:
{
  "hasSubstanceIssue": boolean,
  "diagnosis": "one sentence explaining what is missing, or null",
  "reflectiveQuestion": "one open-ended question to prompt the reviewer to add specificity, or null",
  "sentenceStarters": ["up to 2 sentence starters that model how to anchor feedback to evidence, e.g., 'In Chapter 2, the resource demonstrates...' or 'The standard requires X; specifically, I noticed...'"]
}`;

  const raw = await callGeminiOnce(systemPrompt, comment, 500);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as R16SubstanceResult;
  } catch {
    return null;
  }
}

// ─── Shared context type for chatbox panel ────────────────────────────────────

export interface CommentNudgeContext {
  key: string;
  criterionId: string;
  fieldType: "ni" | "exceeds";
  criterionTitle: string;
  r3: R3ToneResult | null;
  r16: R16SubstanceResult | null;
}

// ─── R13: Cross-Criterion Consistency Check ───────────────────────────────────

export const rubricTemplateWeights: Record<string, Record<string, number>> = {
  accessibility: { c1: 1.5, c2: 1.5, c3: 1.5, c4: 1.2, c5: 1.2 },
  copyright: { c1: 1.5, c2: 1.5, c3: 1.2, c4: 1.5 },
  udl: { c1: 1.2, c3: 1.2, c7: 1.5 },
  "copy-editing": {},
  disciplinary: { c1: 1.5, c4: 1.2, c6: 1.2 },
  elearning: { c5: 1.5, c8: 1.2, c9: 1.2 },
};

export interface R13Finding {
  criterionId: string;
  criterionTitle: string;
  signalType: string;
  weight: number;
  observation: string;
}

export interface R13InputCriterion {
  criterionId: string;
  criterionTitle: string;
  exceedsText: string;
  doesNotMeetText: string;
  annotationComments: string[];
  exceedsActive: boolean;
  doesNotMeetActive: boolean;
}

export interface R13Params {
  templateId: string;
  criteria: R13InputCriterion[];
}

export function computeR13Signals(params: R13Params): R13Finding[] {
  const { templateId, criteria } = params;
  if (criteria.length < 2) return [];

  const templateWeights = rubricTemplateWeights[templateId] ?? {};
  const cid = (id: string) => id.toUpperCase();

  const weighted = criteria.map((c) => ({
    ...c,
    weight: (1 + (c.doesNotMeetActive ? 1 : 0)) * (templateWeights[c.criterionId] ?? 1),
  }));

  const findings: R13Finding[] = [];

  // Signal 1: Column Activation Asymmetry
  {
    const exceedsCount = weighted.filter((c) => c.exceedsActive).length;
    const niCount = weighted.filter((c) => c.doesNotMeetActive).length;
    const total = weighted.length;

    if (exceedsCount / total >= 0.8 && niCount / total <= 0.2) {
      weighted
        .filter((c) => c.doesNotMeetActive)
        .forEach((c) => {
          findings.push({
            criterionId: c.criterionId,
            criterionTitle: c.criterionTitle,
            signalType: "Column Activation Asymmetry",
            weight: c.weight,
            observation: `${cid(c.criterionId)} has 'Does Not Meet' activated; ${exceedsCount} of ${total - 1} other criteria have 'Exceeds' without 'Does Not Meet'.`,
          });
        });
    } else if (niCount / total >= 0.8 && exceedsCount / total <= 0.2) {
      weighted
        .filter((c) => c.exceedsActive)
        .forEach((c) => {
          findings.push({
            criterionId: c.criterionId,
            criterionTitle: c.criterionTitle,
            signalType: "Column Activation Asymmetry",
            weight: c.weight,
            observation: `${cid(c.criterionId)} has 'Exceeds' activated; ${niCount} of ${total - 1} other criteria have 'Does Not Meet' without 'Exceeds'.`,
          });
        });
    }
  }

  // Signal 2: Comment Depth Disparity
  {
    const depths = weighted.map((c) => countWords(c.exceedsText) + countWords(c.doesNotMeetText));
    const n = depths.length;
    const mean = depths.reduce((a, b) => a + b, 0) / n;
    const variance = depths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stddev = Math.sqrt(variance);

    if (mean > 0) {
      weighted.forEach((c, i) => {
        if (depths[i] < mean - 1.5 * stddev) {
          findings.push({
            criterionId: c.criterionId,
            criterionTitle: c.criterionTitle,
            signalType: "Comment Depth Disparity",
            weight: c.weight,
            observation: `${cid(c.criterionId)} contains ${depths[i]} words across all fields; the average across criteria is ${Math.round(mean)} words.`,
          });
        }
      });
    }
  }

  // Signal 3: Annotation-to-Comment Mismatch
  {
    weighted.forEach((c) => {
      const annotCount = c.annotationComments.length;
      const combinedWC = countWords(c.exceedsText) + countWords(c.doesNotMeetText);
      const niWC = countWords(c.doesNotMeetText);

      if (annotCount >= 4 && combinedWC < 30) {
        findings.push({
          criterionId: c.criterionId,
          criterionTitle: c.criterionTitle,
          signalType: "Annotation-to-Comment Mismatch",
          weight: c.weight,
          observation: `${cid(c.criterionId)} has ${annotCount} annotations but ${combinedWC} total words across all comment fields.`,
        });
      } else if (annotCount === 0 && niWC > 80) {
        findings.push({
          criterionId: c.criterionId,
          criterionTitle: c.criterionTitle,
          signalType: "Annotation-to-Comment Mismatch",
          weight: c.weight,
          observation: `${cid(c.criterionId)} has ${niWC} words in 'Does Not Meet' but no linked annotations.`,
        });
      }
    });
  }

  // Signal 4: Sentiment-Direction Mismatch (inferred from annotation comment text)
  {
    const posWords = new Set([
      "excellent", "good", "great", "well", "clear", "strong",
      "effective", "appropriate", "correct", "accurate", "thorough",
    ]);
    const negWords = new Set([
      "missing", "lacks", "poor", "unclear", "confusing", "incorrect",
      "inadequate", "fails", "absent", "insufficient",
    ]);

    weighted.forEach((c) => {
      if (c.annotationComments.length === 0) return;

      let posAnnotations = 0;
      let negAnnotations = 0;
      c.annotationComments.forEach((comment) => {
        const words = comment.toLowerCase().split(/\s+/);
        const pos = words.filter((w) => posWords.has(w)).length;
        const neg = words.filter((w) => negWords.has(w)).length;
        if (pos > neg) posAnnotations++;
        else if (neg > pos) negAnnotations++;
      });

      const excWC = countWords(c.exceedsText);
      const niWC = countWords(c.doesNotMeetText);

      if (posAnnotations > negAnnotations * 2 && niWC > excWC * 1.5 && niWC > 0) {
        findings.push({
          criterionId: c.criterionId,
          criterionTitle: c.criterionTitle,
          signalType: "Sentiment-Direction Mismatch",
          weight: c.weight,
          observation: `${cid(c.criterionId)} has ${posAnnotations} annotations with positive language but the 'Does Not Meet' column contains ${Math.round((niWC / Math.max(excWC, 1)) * 10) / 10}× more text than 'Exceeds'.`,
        });
      } else if (negAnnotations > posAnnotations * 2 && excWC > niWC * 1.5 && excWC > 0) {
        findings.push({
          criterionId: c.criterionId,
          criterionTitle: c.criterionTitle,
          signalType: "Sentiment-Direction Mismatch",
          weight: c.weight,
          observation: `${cid(c.criterionId)} has ${negAnnotations} annotations with critical language but the 'Exceeds' column contains ${Math.round((excWC / Math.max(niWC, 1)) * 10) / 10}× more text than 'Does Not Meet'.`,
        });
      }
    });
  }

  // Signal 5: Specificity Drift
  {
    const half = Math.ceil(weighted.length / 2);
    const firstHalf = weighted.slice(0, half);
    const secondHalf = weighted.slice(half);

    if (secondHalf.length > 0) {
      const allDepths = weighted.map((c) => countWords(c.exceedsText) + countWords(c.doesNotMeetText));
      const firstHalfAvg = firstHalf.map((_, i) => allDepths[i]).reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfDepths = secondHalf.map((_, i) => allDepths[half + i]);
      const secondHalfAvg = secondHalfDepths.reduce((a, b) => a + b, 0) / secondHalf.length;

      if (firstHalfAvg > 0 && secondHalfAvg < firstHalfAvg * 0.6) {
        secondHalf.forEach((c, i) => {
          if (secondHalfDepths[i] < firstHalfAvg) {
            findings.push({
              criterionId: c.criterionId,
              criterionTitle: c.criterionTitle,
              signalType: "Specificity Drift",
              weight: c.weight,
              observation: `${cid(c.criterionId)} contains ${secondHalfDepths[i]} words; criteria in the first half of the rubric average ${Math.round(firstHalfAvg)} words.`,
            });
          }
        });
      }
    }
  }

  // Signal 6: Column Length Inversion
  {
    const dual = weighted.filter((c) => c.exceedsActive && c.doesNotMeetActive);
    if (dual.length >= 3) {
      const ratios = dual.map((c) => {
        const excWC = Math.max(countWords(c.exceedsText), 1);
        const niWC = Math.max(countWords(c.doesNotMeetText), 1);
        return excWC / niWC;
      });
      const sorted = [...ratios].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

      dual.forEach((c, i) => {
        if (ratios[i] > median * 3 || ratios[i] < median / 3) {
          const excWC = countWords(c.exceedsText);
          const niWC = countWords(c.doesNotMeetText);
          findings.push({
            criterionId: c.criterionId,
            criterionTitle: c.criterionTitle,
            signalType: "Column Length Inversion",
            weight: c.weight,
            observation: `${cid(c.criterionId)} has ${excWC} words in 'Exceeds' and ${niWC} words in 'Does Not Meet'; other dual-activated criteria average a ${Math.round(median * 10) / 10}:1 ratio.`,
          });
        }
      });
    }
  }

  // Signal 7: Actionability Gap
  {
    const refPattern = /\b(figure|table|section|chapter|page|p\.|§|fig\.|appendix)\b/i;
    const verbPattern =
      /\b(add|revise|clarify|include|remove|update|replace|restructure|expand|fix|correct)\b/i;
    const quotePattern = /["'][^"']{5,}["']/;

    const isActionable = (text: string) =>
      refPattern.test(text) || verbPattern.test(text) || quotePattern.test(text);

    const niWithText = weighted.filter((c) => c.doesNotMeetActive && c.doesNotMeetText.trim());
    if (niWithText.length > 0) {
      const actionable = niWithText.filter((c) => isActionable(c.doesNotMeetText));
      const actionableRatio = actionable.length / niWithText.length;

      if (actionableRatio >= 0.6) {
        niWithText
          .filter((c) => !isActionable(c.doesNotMeetText))
          .forEach((c) => {
            findings.push({
              criterionId: c.criterionId,
              criterionTitle: c.criterionTitle,
              signalType: "Actionability Gap",
              weight: c.weight,
              observation: `${cid(c.criterionId)}'s 'Does Not Meet' column contains no specific references or actionable directives; ${actionable.length} of ${niWithText.length - 1} other criteria with 'Does Not Meet' comments do.`,
            });
          });
      }
    }
  }

  // Signal 8: Tone Register Shift
  {
    const harshTerms = [
      "unacceptable", "fails", "poor", "wrong", "missing",
      "absent", "inadequate", "severely", "completely",
    ];
    const warmTerms = [
      "great", "wonderful", "excellent", "impressive",
      "outstanding", "fantastic", "remarkable",
    ];

    const toneScores = weighted.map((c) => {
      const allText = `${c.exceedsText} ${c.doesNotMeetText}`.toLowerCase();
      const words = allText.split(/\s+/).filter((w) => w.length > 0);
      const harsh = words.filter((w) => harshTerms.some((t) => w.includes(t))).length;
      const warm = words.filter((w) => warmTerms.some((t) => w.includes(t))).length;
      return (harsh - warm) / Math.max(words.length, 1);
    });

    const n = toneScores.length;
    const toneMean = toneScores.reduce((a, b) => a + b, 0) / n;
    const toneVariance = toneScores.reduce((a, b) => a + Math.pow(b - toneMean, 2), 0) / n;
    const toneStddev = Math.sqrt(toneVariance);

    if (toneStddev > 0) {
      weighted.forEach((c, i) => {
        if (toneScores[i] > toneMean + 2 * toneStddev) {
          findings.push({
            criterionId: c.criterionId,
            criterionTitle: c.criterionTitle,
            signalType: "Tone Register Shift",
            weight: c.weight,
            observation: `${cid(c.criterionId)}'s language registers as notably harsher than the reviewer's pattern across other criteria.`,
          });
        } else if (toneScores[i] < toneMean - 2 * toneStddev) {
          findings.push({
            criterionId: c.criterionId,
            criterionTitle: c.criterionTitle,
            signalType: "Tone Register Shift",
            weight: c.weight,
            observation: `${cid(c.criterionId)}'s language registers as notably warmer than the reviewer's pattern across other criteria.`,
          });
        }
      });
    }
  }

  // Signal 9: Evidence Citation Consistency
  {
    const citationPattern =
      /\b(chapter|section|figure|table|page|p\.\s*\d|§|appendix)\b|\b\d+\s*(st|nd|rd|th)\s+(chapter|section)\b/i;
    const hasCitation = (text: string) => citationPattern.test(text);

    const withText = weighted.filter((c) => c.exceedsText.trim() || c.doesNotMeetText.trim());
    if (withText.length > 0) {
      const cited = withText.filter(
        (c) => hasCitation(c.exceedsText) || hasCitation(c.doesNotMeetText)
      );
      const citedRatio = cited.length / withText.length;

      if (citedRatio >= 0.6) {
        withText
          .filter((c) => !hasCitation(c.exceedsText) && !hasCitation(c.doesNotMeetText))
          .forEach((c) => {
            findings.push({
              criterionId: c.criterionId,
              criterionTitle: c.criterionTitle,
              signalType: "Evidence Citation Consistency",
              weight: c.weight,
              observation: `${cid(c.criterionId)} contains no location references; ${cited.length} of ${withText.length - 1} other criteria cite specific sections, figures, or pages.`,
            });
          });
      }
    }
  }

  // Sort: weight descending, then signalType ascending
  findings.sort((a, b) => b.weight - a.weight || a.signalType.localeCompare(b.signalType));

  return findings;
}

// ─── Exported helper (used by hooks) ─────────────────────────────────────────

export { countWords };
