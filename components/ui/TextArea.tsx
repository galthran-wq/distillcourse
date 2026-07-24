"use client";

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
      <span>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        aria-label={ariaLabel ?? label}
        className="mt-1 block w-full resize-y rounded border border-line bg-panel p-2 font-mono text-sm focus:border-accent focus:outline-none"
      />
    </label>
  );
}
