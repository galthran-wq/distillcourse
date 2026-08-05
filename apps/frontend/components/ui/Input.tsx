"use client";

import { FIELD_CLASS } from "./field";

interface Props {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}

/** Single-line text field for forms; uncontrolled, read back by `name`. */
export function Input({
  name,
  label,
  type = "text",
  required = false,
  minLength,
}: Props) {
  return (
    <label className="block text-sm">
      <span className="text-soft">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className={FIELD_CLASS}
      />
    </label>
  );
}
