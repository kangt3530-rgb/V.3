/**
 * ChipInput — multi-select chip group with profile-derived suggestions
 * and free-text addition.
 *
 * Amendment 7: remove chips are <button> elements with aria-label="Remove {tag}".
 */

import { useState, useId, useRef } from "react";

interface ChipInputProps {
  id?: string;
  label: string;
  value: string[];
  suggestions?: string[];
  placeholder?: string;
  minRequired?: number;
  onChange: (tags: string[]) => void;
}

export function ChipInput({
  id: externalId,
  label,
  value,
  suggestions = [],
  placeholder = "Type and press Enter to add…",
  minRequired,
  onChange,
}: ChipInputProps) {
  const autoId = useId();
  const inputId = externalId ?? autoId;
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggestions not already selected
  const availableSuggestions = suggestions.filter(
    (s) => !value.includes(s),
  );

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  const metMinimum = minRequired === undefined || value.length >= minRequired;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-[13px] font-medium text-ink-black">
        {label}
        {minRequired !== undefined && (
          <span className="ml-1 text-ash-gray font-normal">
            (minimum {minRequired})
          </span>
        )}
      </label>

      {/* Selected chips */}
      {value.length > 0 && (
        <div
          role="list"
          aria-label={`Selected ${label.toLowerCase()}`}
          className="flex flex-wrap gap-1.5"
        >
          {value.map((tag) => (
            <span
              key={tag}
              role="listitem"
              className="inline-flex items-center gap-1 bg-ink-black text-white text-[12px] font-medium rounded-full px-3 py-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="ml-0.5 text-white/70 hover:text-white transition-colors leading-none"
              >
                <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                  close
                </span>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {availableSuggestions.length > 0 && (
        <div
          role="group"
          aria-label={`${label} suggestions`}
          className="flex flex-wrap gap-1.5"
        >
          {availableSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="text-[12px] border border-ghost-border text-slate-gray rounded-full px-3 py-1 hover:border-ink-black hover:text-ink-black transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      {/* Free-text input */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={[
          "flex items-center rounded-[10px] border px-3.5 py-2.5 transition-colors cursor-text",
          "focus-within:border-ink-black",
          !metMinimum && value.length > 0
            ? "border-ghost-border"
            : "border-ghost-border hover:border-slate-gray",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] text-ink-black placeholder:text-ash-gray outline-none"
          aria-label={`Add ${label.toLowerCase()} tag`}
        />
        {inputValue.trim() && (
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className="ml-2 text-[12px] font-medium text-slate-gray hover:text-ink-black transition-colors"
          >
            Add
          </button>
        )}
      </div>

      {minRequired !== undefined && !metMinimum && (
        <p className="text-[12px] text-ash-gray">
          Add at least {minRequired - value.length} more
          {minRequired - value.length === 1 ? " tag" : " tags"}
        </p>
      )}
    </div>
  );
}
