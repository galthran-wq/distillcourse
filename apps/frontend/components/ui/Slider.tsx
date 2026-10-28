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
  /** Spoken value; use when the raw slider number is not the quantity (e.g. a log scale). */
  ariaValueText?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
  ariaLabel,
  ariaValueText,
}: Props) {
  return (
    <label className="block text-sm">
      <span className="flex items-baseline justify-between">
        <span>{label}</span>
        {display !== undefined && <span className="tabular-nums">{display}</span>}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={ariaLabel ?? label}
        aria-valuetext={ariaValueText}
        className="range-accent mt-1 block h-11 w-full"
      />
    </label>
  );
}
