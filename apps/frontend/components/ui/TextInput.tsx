"use client";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  ariaLabel?: string;
}

/** Single-line text input for demos that operate on a learner-typed value. */
export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  ariaLabel,
}: Props) {
  return (
    <label className="block text-sm">
      <span>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-label={ariaLabel ?? label}
        className="mt-1 block min-h-11 w-full rounded border border-line bg-panel px-2 font-mono text-sm focus:border-accent focus:outline-none"
      />
    </label>
  );
}
