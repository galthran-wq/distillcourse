"use client";

import { FIELD_CLASS } from "./styles";

interface Props {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  /** Shown under the field, and names the field as the one at fault. */
  error?: string;
}

/** Single-line text field for forms; uncontrolled, read back by `name`. */
export function Input({ name, label, type = "text", required = false, error }: Props) {
  return (
    <label className="block text-sm">
      <span className="text-soft">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : `${name}-error`}
        className={`${FIELD_CLASS} mt-1`}
      />
      {error !== undefined && (
        <span id={`${name}-error`} className="mt-1 block text-[13px] text-accent">
          {error}
        </span>
      )}
    </label>
  );
}
