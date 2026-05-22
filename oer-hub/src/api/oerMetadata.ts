// ─── Types ────────────────────────────────────────────────────────────────────

export interface OERMetadata {
  oerId: string;
  wordCount: number;
  estimatedReadingTimeMin: number;
  chapterCount: number;
  imageCount: number;
  mediaCount: number;
  language: string;
  fleschKincaidGrade: number;
  analyzedAt: string;
}

// ─── Cache (localStorage) ─────────────────────────────────────────────────────

const cacheKey = (oerId: string, rubricId: string) =>
  `oer-hub:r10:${oerId}:${rubricId}`;

export function getCachedMetadata(
  oerId: string,
  rubricId: string,
): OERMetadata | null {
  try {
    const raw = localStorage.getItem(cacheKey(oerId, rubricId));
    return raw ? (JSON.parse(raw) as OERMetadata) : null;
  } catch {
    return null;
  }
}

export function setCachedMetadata(
  metadata: OERMetadata,
  rubricId: string,
): void {
  try {
    localStorage.setItem(
      cacheKey(metadata.oerId, rubricId),
      JSON.stringify(metadata),
    );
  } catch {
    // ignore quota / private-browsing errors
  }
}

// ─── Readability computation (no AI — pure math) ──────────────────────────────

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w.length) return 1;
  const groups = w.match(/[aeiouy]+/g);
  let n = groups ? groups.length : 1;
  // silent trailing -e
  if (w.length > 2 && w.endsWith("e") && n > 1) n--;
  return Math.max(1, n);
}

export function computeReadability(text: string): { fkgl: number } {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const words = text.match(/\b[a-zA-Z'-]+\b/g) ?? [];

  if (!words.length || !sentences.length) return { fkgl: 10 };

  const totalSyl = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const ASL = words.length / sentences.length;
  const ASW = totalSyl / words.length;

  const fkgl = Math.max(0, 0.39 * ASL + 11.8 * ASW - 15.59);

  return { fkgl: Math.round(fkgl * 10) / 10 };
}

// ─── OER analysis ────────────────────────────────────────────────────────────

function langCodeToName(code: string): string {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "language" }).of(
        code.split("-")[0],
      ) ?? "English"
    );
  } catch {
    return "English";
  }
}

function readingTime(wordCount: number): number {
  // Round to nearest 5 min; minimum 5 min
  return Math.max(5, Math.round(wordCount / 200 / 5) * 5);
}

export async function analyzeOER(
  oerType: "url" | "pdf" | "mock",
  oerSource: string,
  oerId: string,
): Promise<OERMetadata> {
  // ── Mock OER: query the live DOM after the OER pane has painted ────────────
  if (oerType === "mock") {
    await new Promise<void>((r) => setTimeout(r, 100));

    const article = document.querySelector<HTMLElement>(
      "article[data-oer-content]",
    );

    let text = "";
    let chapterCount = 7; // fallback: h1 + 6 h2 in Quantum Mechanics Ch. 3
    let imageCount = 1;
    let mediaCount = 0;

    if (article) {
      text = article.textContent ?? "";
      const headings = article.querySelectorAll("h1, h2").length;
      chapterCount = headings || chapterCount;
      imageCount = article.querySelectorAll("img").length;
      mediaCount = article.querySelectorAll("video, audio, iframe").length;
    }

    const words = text.match(/\b[a-zA-Z'-]+\b/g) ?? [];
    const wordCount = words.length || 1_850;
    const { fkgl } = computeReadability(text);

    return {
      oerId,
      wordCount,
      estimatedReadingTimeMin: readingTime(wordCount),
      chapterCount,
      imageCount,
      mediaCount,
      language: "English",
      fleschKincaidGrade: fkgl,
      analyzedAt: new Date().toISOString(),
    };
  }

  // ── URL OER: fetch HTML and parse DOM ─────────────────────────────────────
  if (oerType === "url") {
    let html: string;
    try {
      const res = await fetch(oerSource, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch {
      throw new Error("fetch_failed");
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    const text = doc.body.textContent ?? "";
    const words = text.match(/\b[a-zA-Z'-]+\b/g) ?? [];
    const h1s = doc.querySelectorAll("h1").length;
    const h2s = doc.querySelectorAll("h2").length;
    const { fkgl } = computeReadability(text);

    return {
      oerId,
      wordCount: words.length,
      estimatedReadingTimeMin: readingTime(words.length),
      chapterCount: h1s || h2s,
      imageCount: doc.querySelectorAll("img").length,
      mediaCount: doc.querySelectorAll("video, audio, iframe").length,
      language: langCodeToName(
        doc.documentElement.getAttribute("lang") ?? "en",
      ),
      fleschKincaidGrade: fkgl,
      analyzedAt: new Date().toISOString(),
    };
  }

  // ── PDF: not yet supported ────────────────────────────────────────────────
  throw new Error("pdf_not_supported");
}
