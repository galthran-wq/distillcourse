"use client";

/**
 * Reference demo implementation — the idiom every demo follows:
 * compose controls/containers from `@/components/ui` (Panel, PresetGroup,
 * Slider, Readout), custom visuals as plain SVG with currentColor text,
 * synchronous updates, meaningful initial state.
 * (This example: probability vs. surprisal.)
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const PRESETS = [
  { label: "Coin flip", p: 0.5 },
  { label: "Die shows 6", p: 1 / 6 },
  { label: "Sunrise", p: 0.9999 },
] as const;

const MIN_P = 0.0001;

function surprisal(p: number): number {
  return -Math.log2(p);
}

export default function ExampleDemo() {
  // D3: start on a preset that already shows the idea, never a blank state.
  const [p, setP] = useState<number>(PRESETS[0].p);

  const bits = surprisal(p);
  const maxBits = surprisal(MIN_P);
  const barWidth = Math.min(1, bits / maxBits) * 420;

  // Presets are compared against live state so the active one highlights,
  // and un-highlights the moment the slider leaves it (null = no match).
  const activePreset = PRESETS.findIndex((preset) => preset.p === p);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setP(PRESETS[i].p)}
      />

      <Slider
        label="probability p"
        value={p}
        min={MIN_P}
        max={1}
        step={0.0001}
        onChange={setP}
        display={p.toFixed(4)}
        ariaLabel="Probability of the event"
      />

      <Readout>
        surprisal = <strong>{bits.toFixed(2)} bits</strong>
      </Readout>

      {/* Custom visuals stay plain SVG — only controls come from the kit. */}
      <svg viewBox="0 0 480 60" className="mt-3 w-full" role="img" aria-label={`Surprisal ${bits.toFixed(2)} bits`}>
        <rect x="0" y="18" width={barWidth} height="24" rx="4" fill="#e2903a" />
        <text x={barWidth + 8} y="36" fill="currentColor" fontSize="14">
          {bits.toFixed(2)} bits
        </text>
      </svg>
    </Panel>
  );
}
