import { useState, useEffect, useRef } from "react";
import type { RubricTemplateId } from "../../../api/types";
import { useAIPrefsStore } from "../../../store/aiPrefsStore";
import type { NudgeKey, InvolvementLevel } from "../../../store/aiPrefsStore";

// ─── Metadata ─────────────────────────────────────────────────────────────────

const RUBRIC_TABS: { id: RubricTemplateId; label: string }[] = [
  { id: "accessibility", label: "Accessibility" },
  { id: "copyright",     label: "Copyright" },
  { id: "udl",           label: "UDL" },
  { id: "elearning",     label: "eLearning" },
  { id: "disciplinary",  label: "Disciplinary" },
  { id: "copy-editing",  label: "Copy Editing" },
];

const LEVEL_DESCRIPTIONS: Record<InvolvementLevel, string> = {
  minimal:   "AI stays quiet. Only shows document overview and criterion suggestions.",
  balanced:  "AI offers selected nudges at key moments. Nothing interrupts your flow.",
  proactive: "AI surfaces all available suggestions. You stay in control — nothing is blocked.",
};

const MINIMAL_TOOLTIP = "Switch to Balanced or Proactive to enable nudges.";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleSwitch({
  enabled,
  disabled,
  onToggle,
}: {
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={[
        "relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        enabled ? "bg-primary" : "bg-outline-variant",
        disabled ? "opacity-50 cursor-default" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
          enabled ? "left-5" : "left-1",
        ].join(" ")}
      />
    </button>
  );
}

function InvolvementSegment({
  level,
  selected,
  onSelect,
}: {
  level: InvolvementLevel;
  selected: boolean;
  onSelect: () => void;
}) {
  const LABELS: Record<InvolvementLevel, string> = {
    minimal: "Minimal",
    balanced: "Balanced",
    proactive: "Proactive",
  };

  return (
    <button
      onClick={onSelect}
      className={[
        "flex-1 py-2 text-label-sm font-label font-semibold uppercase tracking-widest transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
        selected
          ? "bg-primary text-on-primary shadow-sm"
          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
      ].join(" ")}
    >
      {LABELS[level]}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AIPreferencesPanel() {
  const [activeRubric, setActiveRubric] = useState<RubricTemplateId>("accessibility");
  const [savedVisible, setSavedVisible] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefs = useAIPrefsStore((s) => s.prefs);
  const setInvolvementLevel = useAIPrefsStore((s) => s.setInvolvementLevel);
  const toggleNudge = useAIPrefsStore((s) => s.toggleNudge);

  const currentPrefs = prefs[activeRubric];
  const involvementLevel = currentPrefs.involvementLevel;
  const nudgeToggles = currentPrefs.nudgeToggles;
  const isMinimal = involvementLevel === "minimal";

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  function showSaved() {
    setSavedVisible(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedVisible(false), 2000);
  }

  function handleLevelChange(level: InvolvementLevel) {
    setInvolvementLevel(activeRubric, level);
    showSaved();
  }

  function handleToggle(nudgeKey: NudgeKey) {
    toggleNudge(activeRubric, nudgeKey);
    showSaved();
  }

  return (
    <section>
      {/* Banner */}
      <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-secondary-container rounded-md">
        <span className="material-symbols-outlined text-[16px] text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
          info
        </span>
        <p className="text-body-sm text-on-secondary-container">
          Changes apply to your next review session.
        </p>
      </div>

      {/* Section header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-title-lg font-headline text-on-surface">AI Assistant</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Customize how much AI helps you during reviews. Settings are saved per rubric type.
          </p>
        </div>
        <span
          className={[
            "text-label-sm font-label text-secondary transition-opacity duration-300 mt-1",
            savedVisible ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-live="polite"
        >
          Saved
        </span>
      </div>

      {/* Rubric tabs */}
      <div className="flex gap-0 mt-6 border-b border-outline-variant overflow-x-auto">
        {RUBRIC_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveRubric(tab.id)}
            className={[
              "px-4 py-2.5 text-label-sm font-label font-semibold uppercase tracking-widest whitespace-nowrap transition-all duration-150 border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeRubric === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline-variant",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Per-rubric content */}
      <div className="mt-6 space-y-8">

        {/* Layer 1: Involvement level */}
        <div>
          <div className="flex rounded-md overflow-hidden border border-outline-variant">
            {(["minimal", "balanced", "proactive"] as InvolvementLevel[]).map((level) => (
              <InvolvementSegment
                key={level}
                level={level}
                selected={involvementLevel === level}
                onSelect={() => handleLevelChange(level)}
              />
            ))}
          </div>
          <p className="mt-2.5 text-body-sm text-on-surface-variant">
            {LEVEL_DESCRIPTIONS[involvementLevel]}
          </p>
        </div>

        {/* Layer 2: Fine-grained toggles */}
        <div>
          <div className="mb-4">
            <h3 className="text-title-sm font-label font-semibold text-on-surface">
              Customize which suggestions appear
            </h3>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              These settings override your involvement level for specific suggestions.
            </p>
          </div>

          <div className="space-y-1">
            {nudgeToggles.map((toggle) => (
              <div
                key={toggle.key}
                title={isMinimal ? MINIMAL_TOOLTIP : undefined}
                className={[
                  "flex items-start gap-4 px-4 py-3 rounded-md transition-colors",
                  isMinimal ? "opacity-60" : "hover:bg-surface-container-low",
                ].join(" ")}
              >
                <ToggleSwitch
                  enabled={toggle.enabled}
                  disabled={false}
                  onToggle={() => handleToggle(toggle.key)}
                />
                <div className="flex-1 min-w-0 pt-0.5">
                  <span className="text-body-sm font-label font-semibold text-on-surface">
                    {toggle.label}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {" "}·{" "}
                    {toggle.explainer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
