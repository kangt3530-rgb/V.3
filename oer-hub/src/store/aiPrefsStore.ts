import { create } from "zustand";
import type { RubricTemplateId } from "../api/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvolvementLevel = "minimal" | "balanced" | "proactive";

export type NudgeKey =
  | "tone_check"
  | "coherence_check"
  | "substance_check"
  | "gap_check"
  | "consistency_check";

export interface NudgeToggle {
  key: NudgeKey;
  label: string;
  explainer: string;
  enabled: boolean;
}

export interface RubricAIPrefs {
  involvementLevel: InvolvementLevel;
  nudgeToggles: NudgeToggle[];
  lastDialApplied: number;
  manualOverrides: NudgeKey[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NUDGE_METADATA: Record<NudgeKey, { label: string; explainer: string; defaultEnabled: boolean }> = {
  tone_check:        { label: "Tone check",        explainer: "Flags overly harsh or soft wording in your comments",            defaultEnabled: true  },
  coherence_check:   { label: "Coherence check",   explainer: "Flags mismatches between your rating, annotations, and comment", defaultEnabled: true  },
  substance_check:   { label: "Substance check",   explainer: "Suggests when comments are too broad or lack specific examples",  defaultEnabled: false },
  gap_check:         { label: "Gap check",          explainer: "Surfaces under-supported criteria before you submit",            defaultEnabled: true  },
  consistency_check: { label: "Consistency check", explainer: "Flags if your strictness varies significantly across criteria",   defaultEnabled: false },
};

const NUDGE_ORDER: NudgeKey[] = [
  "tone_check",
  "coherence_check",
  "substance_check",
  "gap_check",
  "consistency_check",
];

// Presets applied when the involvement dial is switched to a new level.
const LEVEL_PRESETS: Record<InvolvementLevel, Record<NudgeKey, boolean>> = {
  minimal: {
    tone_check: false, coherence_check: false, substance_check: false,
    gap_check: false, consistency_check: false,
  },
  balanced: {
    tone_check: true, coherence_check: true, substance_check: false,
    gap_check: true, consistency_check: false,
  },
  proactive: {
    tone_check: true, coherence_check: true, substance_check: true,
    gap_check: true, consistency_check: true,
  },
};

const ALL_RUBRIC_TYPES: RubricTemplateId[] = [
  "accessibility", "copy-editing", "copyright", "disciplinary", "elearning", "udl",
];

// ─── Defaults ─────────────────────────────────────────────────────────────────

// First-use defaults: balanced + tone_check on by default
function defaultRubricPrefs(): RubricAIPrefs {
  return {
    involvementLevel: "balanced",
    nudgeToggles: NUDGE_ORDER.map((key) => ({
      key,
      label: NUDGE_METADATA[key].label,
      explainer: NUDGE_METADATA[key].explainer,
      enabled: NUDGE_METADATA[key].defaultEnabled,
    })),
    lastDialApplied: 0,
    manualOverrides: [],
  };
}

function buildInitialPrefs(): Record<RubricTemplateId, RubricAIPrefs> {
  const prefs = {} as Record<RubricTemplateId, RubricAIPrefs>;
  for (const rt of ALL_RUBRIC_TYPES) {
    prefs[rt] = defaultRubricPrefs();
  }
  return prefs;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function storageKey(userId: string, rubricType: RubricTemplateId): string {
  return `aipref_${userId}_${rubricType}`;
}

function loadFromStorage(userId: string): Partial<Record<RubricTemplateId, RubricAIPrefs>> {
  const result: Partial<Record<RubricTemplateId, RubricAIPrefs>> = {};
  for (const rt of ALL_RUBRIC_TYPES) {
    try {
      const raw = localStorage.getItem(storageKey(userId, rt));
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<RubricAIPrefs>;
      // Merge into defaults so any newly added nudge keys are present
      const merged = defaultRubricPrefs();
      if (parsed.involvementLevel) merged.involvementLevel = parsed.involvementLevel;
      if (typeof parsed.lastDialApplied === "number") merged.lastDialApplied = parsed.lastDialApplied;
      if (Array.isArray(parsed.manualOverrides)) merged.manualOverrides = parsed.manualOverrides as NudgeKey[];
      if (Array.isArray(parsed.nudgeToggles)) {
        for (const toggle of merged.nudgeToggles) {
          const saved = (parsed.nudgeToggles as NudgeToggle[]).find((t) => t.key === toggle.key);
          if (saved !== undefined) toggle.enabled = saved.enabled;
        }
      }
      // Migration: balanced level should enable tone_check
      if (merged.involvementLevel === "balanced") {
        const toneToggle = merged.nudgeToggles.find((t) => t.key === "tone_check");
        if (toneToggle) toneToggle.enabled = true;
      }
      result[rt] = merged;
    } catch {
      // corrupt entry — fall back to defaults
    }
  }
  return result;
}

function saveToStorage(userId: string, rubricType: RubricTemplateId, prefs: RubricAIPrefs): void {
  if (!userId) return;
  try {
    localStorage.setItem(storageKey(userId, rubricType), JSON.stringify(prefs));
  } catch {
    // ignore (e.g. private browsing quota)
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AIPrefState {
  userId: string;
  prefs: Record<RubricTemplateId, RubricAIPrefs>;

  loadForUser: (userId: string) => void;
  isNudgeEnabled: (rubricType: RubricTemplateId, nudgeKey: NudgeKey) => boolean;
  getInvolvementLevel: (rubricType: RubricTemplateId) => InvolvementLevel;
  setInvolvementLevel: (rubricType: RubricTemplateId, level: InvolvementLevel) => void;
  toggleNudge: (rubricType: RubricTemplateId, nudgeKey: NudgeKey) => void;
}

export const useAIPrefsStore = create<AIPrefState>((set, get) => ({
  userId: "",
  prefs: buildInitialPrefs(),

  loadForUser: (userId) => {
    const loaded = loadFromStorage(userId);
    const prefs = buildInitialPrefs();
    for (const rt of ALL_RUBRIC_TYPES) {
      if (loaded[rt]) prefs[rt] = loaded[rt]!;
    }
    set({ userId, prefs });
  },

  isNudgeEnabled: (rubricType, nudgeKey) => {
    const rubricPrefs = get().prefs[rubricType];
    if (!rubricPrefs) return NUDGE_METADATA[nudgeKey].defaultEnabled;
    const toggle = rubricPrefs.nudgeToggles.find((t) => t.key === nudgeKey);
    return toggle?.enabled ?? NUDGE_METADATA[nudgeKey].defaultEnabled;
  },

  getInvolvementLevel: (rubricType) => {
    return get().prefs[rubricType]?.involvementLevel ?? "balanced";
  },

  setInvolvementLevel: (rubricType, level) => {
    set((s) => {
      const current = s.prefs[rubricType] ?? defaultRubricPrefs();
      if (current.involvementLevel === level) return s; // no-op for same level

      const preset = LEVEL_PRESETS[level];
      const newToggles = current.nudgeToggles.map((t) => ({
        ...t,
        enabled: preset[t.key],
      }));

      const updated: RubricAIPrefs = {
        involvementLevel: level,
        nudgeToggles: newToggles,
        lastDialApplied: Date.now(),
        manualOverrides: [], // clear overrides when switching levels
      };

      const prefs = { ...s.prefs, [rubricType]: updated };
      saveToStorage(s.userId, rubricType, updated);
      return { prefs };
    });
  },

  toggleNudge: (rubricType, nudgeKey) => {
    set((s) => {
      const current = s.prefs[rubricType] ?? defaultRubricPrefs();
      const newToggles = current.nudgeToggles.map((t) =>
        t.key === nudgeKey ? { ...t, enabled: !t.enabled } : t
      );
      const manualOverrides = current.manualOverrides.includes(nudgeKey)
        ? current.manualOverrides
        : [...current.manualOverrides, nudgeKey];

      const updated: RubricAIPrefs = {
        ...current,
        nudgeToggles: newToggles,
        manualOverrides,
      };

      const prefs = { ...s.prefs, [rubricType]: updated };
      saveToStorage(s.userId, rubricType, updated);
      return { prefs };
    });
  },
}));

// ─── Reactive helpers ─────────────────────────────────────────────────────────

export function useNudgeEnabled(rubricType: RubricTemplateId, nudgeKey: NudgeKey): boolean {
  return useAIPrefsStore((s) => {
    const rt = s.prefs[rubricType];
    if (!rt) return NUDGE_METADATA[nudgeKey].defaultEnabled;
    return rt.nudgeToggles.find((t) => t.key === nudgeKey)?.enabled ?? NUDGE_METADATA[nudgeKey].defaultEnabled;
  });
}
