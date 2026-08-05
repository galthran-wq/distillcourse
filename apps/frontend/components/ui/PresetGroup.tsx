"use client";

import { Button } from "./Button";

interface Props {
  labels: string[];
  /** Index of the active preset, or null when none matches. */
  activeIndex: number | null;
  onSelect: (index: number) => void;
}

/** Named-preset row (pedagogy D3: presets are narrative anchors). */
export function PresetGroup({ labels, activeIndex, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 pb-3">
      {labels.map((label, i) => (
        <Button key={label} active={i === activeIndex} onClick={() => onSelect(i)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
