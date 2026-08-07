"use client";

import { FIELD_CLASS, FIELD_LABEL_CLASS } from "./styles";

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  ariaLabel?: string;
}

/** Multi-line text input for demos that operate on learner-typed text. */
export function TextArea({ label, value, onChange, rows = 3, ariaLabel }: Props) {
  return (
    <label className="block text-sm">
      <span className={FIELD_LABEL_CLASS}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        aria-label={ariaLabel ?? label}
        className={`${FIELD_CLASS} resize-y font-mono`}
      />
    </label>
  );
}
