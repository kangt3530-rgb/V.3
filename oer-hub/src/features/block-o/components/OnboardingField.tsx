/**
 * OnboardingField — labeled text input or select wrapper.
 * Amendment 7: explicit <label htmlFor> on every field.
 */

interface BaseProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
}

interface InputProps extends BaseProps {
  type: "text" | "email";
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

interface SelectProps extends BaseProps {
  type: "select";
  value: string;
  options: readonly string[];
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

type OnboardingFieldProps = InputProps | SelectProps;

export function OnboardingField(props: OnboardingFieldProps) {
  const { id, label, required, error } = props;

  const inputClasses = [
    "w-full h-11 px-3.5 rounded-[10px] border text-[14px] text-ink-black bg-parchment",
    "placeholder:text-ash-gray outline-none transition-colors",
    "focus:border-ink-black focus:ring-0",
    error ? "border-[#ba1a1a]" : "border-ghost-border hover:border-slate-gray",
  ].join(" ");

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[13px] font-medium text-ink-black"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-[#ba1a1a]" aria-hidden="true">*</span>
        )}
      </label>

      {props.type === "select" ? (
        <select
          id={id}
          value={props.value}
          required={required}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
          className={[inputClasses, "appearance-none cursor-pointer pr-9"].join(" ")}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238c8c8c' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            backgroundSize: "16px",
          }}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        >
          {props.placeholder && (
            <option value="" disabled>
              {props.placeholder}
            </option>
          )}
          {props.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={props.type}
          value={props.value}
          placeholder={props.placeholder}
          required={required}
          onChange={(e) => props.onChange(e.target.value)}
          onBlur={props.onBlur}
          className={inputClasses}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      )}

      {error && (
        <p id={`${id}-error`} role="alert" className="text-[12px] text-[#ba1a1a]">
          {error}
        </p>
      )}
    </div>
  );
}
