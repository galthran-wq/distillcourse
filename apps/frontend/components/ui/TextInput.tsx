"use client";

import { FIELD_CLASS, FIELD_LABEL_CLASS } from "./styles";

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
      <span className={FIELD_LABEL_CLASS}>{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-label={ariaLabel ?? label}
        className={`${FIELD_CLASS} min-h-11 font-mono`}
      />
    </label>
  );
}
