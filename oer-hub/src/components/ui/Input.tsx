import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const labelCls = "block text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5";
const inputCls = "w-full bg-transparent border-0 border-b-2 border-outline-variant outline-none focus:border-secondary transition-colors duration-150 pb-1 text-body-md text-on-surface placeholder:text-on-surface-variant/50";
const hintCls  = "mt-1.5 text-body-sm text-on-surface-variant";
const errorCls = "mt-1.5 text-body-sm text-error";

export function Input({ label, hint, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className={labelCls}>{label}</label>}
      <input {...props} className={`${inputCls} ${className}`} />
      {error  && <p className={errorCls}>{error}</p>}
      {!error && hint && <p className={hintCls}>{hint}</p>}
    </div>
  );
}

export function Textarea({ label, hint, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && <label className={labelCls}>{label}</label>}
      <textarea
        {...props}
        className={`${inputCls} resize-none leading-relaxed ${className}`}
      />
      {error  && <p className={errorCls}>{error}</p>}
      {!error && hint && <p className={hintCls}>{hint}</p>}
    </div>
  );
}
