import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

const INPUT_CLASSES =
  "min-h-[44px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400";

const INPUT_ERROR_CLASSES =
  "min-h-[44px] w-full rounded-xl border border-red-500 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-400 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-400";

// Shared labeled wrapper: Vietnamese label, required mark, hint and the
// approved red error palette. Every booking input goes through here so
// the form reads as one consistent surface.
export function BookingField({
  id,
  label,
  required,
  error,
  hint,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-zinc-800 dark:text-zinc-300"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{hint}</p>
      )}
      {error && (
        <p
          role="alert"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

type TextProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "numeric";
  type?: "text" | "password";
};

export function BookingTextInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  autoComplete,
  inputMode,
  type = "text",
}: TextProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      className={error ? INPUT_ERROR_CLASSES : INPUT_CLASSES}
    />
  );
}

type AreaProps = TextProps & { rows?: number };

export function BookingTextArea({
  id,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  rows = 3,
}: AreaProps) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      aria-invalid={Boolean(error)}
      className={`${error ? INPUT_ERROR_CLASSES : INPUT_CLASSES} min-h-[88px] resize-y`}
    />
  );
}
