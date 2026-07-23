"use client";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Formatted current value shown at the right of the label. */
  display?: string;
  ariaLabel?: string;
}

export function Slider({ label, value, min, max, step, onChange, display, ariaLabel }: Props) {
  return (
    <label className="block text-sm">
      <span className="flex items-baseline justify-between">
        <span>{label}</span>
        {display !== undefined && <span className="font-mono">{display}</span>}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel ?? label}
        className="mt-1 block h-11 w-full"
        style={{ accentColor: "var(--accent)" }}
      />
    </label>
  );
}
