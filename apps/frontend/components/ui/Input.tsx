"use client";

import { FIELD_CLASS, FIELD_LABEL_CLASS } from "./styles";

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
    <div className="text-sm">
      <label className="block">
        <span className={FIELD_LABEL_CLASS}>{label}</span>
        <input
          name={name}
          type={type}
          required={required}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : `${name}-error`}
          className={FIELD_CLASS}
        />
      </label>
      {/* Outside the label on purpose: text inside it is part of the field's
          accessible NAME, so an inline error there would rename the field to
          its own complaint at the moment the name matters most. */}
      {error !== undefined && (
        <span id={`${name}-error`} className="mt-1 block text-[13px] text-accent">
          {error}
        </span>
      )}
    </div>
  );
}
