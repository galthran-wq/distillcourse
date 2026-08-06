"use client";

interface Props {
  on: boolean;
  /** Names the control; there is no visible label inside the track. */
  label: string;
  onToggle: () => void;
}

/** A setting that is simply on or off, so it is shown as on or off. */
export function Switch({ on, label, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-(--motion-fast) ${
        on ? "border-accent bg-accent" : "border-line bg-panel"
      }`}
    >
      <span
        className={`size-4 rounded-full transition-transform duration-(--motion-fast) ${
          on ? "translate-x-[1.5rem] bg-paper" : "translate-x-[0.1875rem] bg-faint"
        }`}
      />
    </button>
  );
}
