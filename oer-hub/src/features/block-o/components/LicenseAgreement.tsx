/**
 * LicenseAgreement — CC BY-ND consent block with plain-language explanation
 * and a required acknowledgment checkbox.
 */

import { useId } from "react";

interface LicenseAgreementProps {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}

export function LicenseAgreement({ accepted, onChange }: LicenseAgreementProps) {
  const checkId = useId();

  return (
    <div className="flex flex-col gap-4">
      {/* License explanation card */}
      <div className="rounded-[10px] border border-whisper-border bg-tinted-info p-5">
        <p className="text-[13px] font-semibold text-ink-black uppercase tracking-widest mb-3">
          Feedback License — CC BY-ND 4.0
        </p>
        <div className="space-y-2 text-[14px] text-slate-gray leading-relaxed">
          <p>
            Your feedback — written comments, annotations, and ratings — will be
            licensed under the{" "}
            <strong className="text-ink-black font-medium">
              Creative Commons Attribution-NoDerivs 4.0
            </strong>{" "}
            license (CC BY-ND 4.0).
          </p>
          <p>
            This means anyone can share your feedback with proper attribution,
            but <strong className="text-ink-black font-medium">no one</strong> —
            including the author of the resource — may alter, adapt, or build
            upon it. Your words are preserved exactly as you wrote them.
          </p>
          <p>
            Open4Review will attribute your feedback only to your reviewer role
            type (e.g. "Academic Peer") unless you separately agree to named
            attribution.
          </p>
        </div>

        {/* License badge link */}
        <div className="mt-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-ash-gray" aria-hidden="true">
            open_in_new
          </span>
          <a
            href="https://creativecommons.org/licenses/by-nd/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-slate-gray underline underline-offset-2 hover:text-ink-black transition-colors"
          >
            Read the full CC BY-ND 4.0 license
          </a>
        </div>
      </div>

      {/* Acknowledgment checkbox */}
      <label
        htmlFor={checkId}
        className={[
          "flex items-start gap-3 rounded-[10px] border p-4 cursor-pointer transition-colors select-none",
          accepted
            ? "border-ink-black bg-tinted-selected"
            : "border-ghost-border bg-parchment hover:border-slate-gray",
        ].join(" ")}
      >
        {/* Visually-hidden native checkbox */}
        <input
          id={checkId}
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />

        {/* Custom checkbox indicator */}
        <span
          className={[
            "flex-shrink-0 w-5 h-5 rounded-[4px] border-2 flex items-center justify-center mt-0.5 transition-colors",
            accepted ? "border-ink-black bg-ink-black" : "border-ghost-border bg-parchment",
          ].join(" ")}
          aria-hidden="true"
        >
          {accepted && (
            <span
              className="material-symbols-outlined text-[13px] text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check
            </span>
          )}
        </span>

        <p className="text-[14px] text-ink-black leading-relaxed">
          I understand that my feedback will be licensed under CC BY-ND 4.0 and
          cannot be modified by the resource author or anyone else.
        </p>
      </label>
    </div>
  );
}
