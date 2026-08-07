"use client";

/**
 * MutualInfoDial — one slider for the agreement probability q = P(Y = X)
 * morphs a 2×2 joint table with uniform marginals from independent
 * (q = 0.5) through noisy coupling to lockstep (q = 1); a stacked bar
 * splits the fixed H(X) = 1 bit into I(X;Y) = 1 − H₂(q) and
 * H(X|Y) = H₂(q) live. Guided task (lesson): load the three presets in
 * order, then drag slowly and check the segments always sum to 1 bit.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const PRESETS = [
  { label: "Independent", q: 0.5 },
  { label: "Noisy channel", q: 0.75 },
  { label: "Lockstep", q: 1 },
];

const AMBER = "#e2903a";

// SVG geometry (user units)
const VW = 480;
const VH = 258;
const TX = 168; // table left edge
const CW = 86; // cell width
const CH = 60; // cell height
const TY = 24; // table top edge
const BAR_X = 40;
const BAR_W = 400;
const BAR_Y = 206;
const BAR_H = 24;

function h2(p: number): number {
  const term = (v: number) => (v > 1e-12 ? -v * Math.log2(v) : 0);
  return term(p) + term(1 - p);
}

export default function MutualInfoDial() {
  // D3: open on the noisy-channel preset — a visible partial split.
  const [q, setQ] = useState<number>(PRESETS[1].q);

  const HxGivenY = h2(q); // every column conditions X to (q, 1−q)
  const I = Math.max(0, 1 - HxGivenY);
  const cells = [q / 2, (1 - q) / 2, (1 - q) / 2, q / 2]; // X=0/1 rows × Y=0/1 cols
  const activePreset = PRESETS.findIndex((preset) => preset.q === q);

  const independent = Math.abs(q - 0.5) < 0.0025;
  const lockstep = q > 0.9975;
  const mirrored = q < 0.0025;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setQ(PRESETS[i].q)}
      />

      <Slider
        label="agreement q = P(Y = X)"
        value={q}
        min={0}
        max={1}
        step={0.005}
        onChange={setQ}
        display={q.toFixed(3)}
        ariaLabel="Agreement probability q, the chance that Y equals X"
      />

      <Readout>
        I(X;Y) = 1 − H₂(q) = <strong>{I.toFixed(3)} bits</strong>,
        H(X&thinsp;|&thinsp;Y) = <strong>{HxGivenY.toFixed(3)} bits</strong>
        {independent && (
          <span className="pl-2 font-medium text-accent">
            every cell equals the product of its marginals — independent, I = 0
          </span>
        )}
        {lockstep && (
          <span className="pl-2 font-medium text-accent">
            Y determines X — I = H(X) = 1 bit, the upper bound
          </span>
        )}
        {mirrored && (
          <span className="pl-2 font-medium text-accent">
            perfect disagreement — lockstep with Y&apos;s labels swapped, I = 1 bit
          </span>
        )}
      </Readout>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full select-none"
        role="img"
        aria-label={`Joint table at agreement ${q.toFixed(3)}: diagonal cells ${(q / 2).toFixed(3)}, off-diagonal cells ${((1 - q) / 2).toFixed(3)}; I(X;Y) ${I.toFixed(3)} bits, H(X given Y) ${HxGivenY.toFixed(3)} bits, summing to H(X) = 1 bit`}
      >
        {/* joint table: column/row labels, uniform marginals */}
        {[0, 1].map((j) => (
          <text key={`col-${j}`} x={TX + CW * (j + 0.5)} y={TY - 8} textAnchor="middle" fontSize="12" fill="currentColor">
            Y = {j}
          </text>
        ))}
        {[0, 1].map((i) => (
          <g key={`row-${i}`}>
            <text x={TX - 10} y={TY + CH * (i + 0.5) + 4} textAnchor="end" fontSize="12" fill="currentColor">
              X = {i}
            </text>
            <text x={TX + 2 * CW + 10} y={TY + CH * (i + 0.5) + 4} fontSize="11" fill="currentColor" opacity="0.6">
              1/2
            </text>
          </g>
        ))}
        {[0, 1].map((j) => (
          <text key={`mcol-${j}`} x={TX + CW * (j + 0.5)} y={TY + 2 * CH + 16} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6">
            1/2
          </text>
        ))}
        <text x={TX + 2 * CW + 10} y={TY - 8} fontSize="11" fill="currentColor" opacity="0.6">
          p(x)
        </text>
        {/* cells: outline, mass square scaled by probability, value */}
        {cells.map((p, i) => {
          const x = TX + (i % 2) * CW;
          const y = TY + (i >> 1) * CH;
          const side = (p / 0.5) * (CH - 10);
          return (
            <g key={i}>
              <rect x={x} y={y} width={CW} height={CH} fill="transparent" stroke="currentColor" opacity="0.35" />
              <rect x={x + CW / 2 - side / 2} y={y + CH / 2 - side / 2} width={side} height={side} rx="3" fill={AMBER} opacity="0.55" />
              <text x={x + CW / 2} y={y + CH / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">
                {p.toFixed(3)}
              </text>
            </g>
          );
        })}

        {/* stacked bar: H(X) = 1 bit split into I(X;Y) and H(X|Y) */}
        <text x={BAR_X + BAR_W / 2} y={BAR_Y - 18} textAnchor="middle" fontSize="12" fill="currentColor">
          H(X) = 1 bit
        </text>
        <path d={`M ${BAR_X} ${BAR_Y - 12} v 4 H ${BAR_X + BAR_W} v -4`} fill="none" stroke="currentColor" opacity="0.5" />
        <rect x={BAR_X} y={BAR_Y} width={I * BAR_W} height={BAR_H} fill={AMBER} />
        <rect x={BAR_X + I * BAR_W} y={BAR_Y} width={HxGivenY * BAR_W} height={BAR_H} fill="currentColor" opacity="0.22" />
        <text x={BAR_X} y={BAR_Y + BAR_H + 16} fontSize="12" fill={AMBER} fontWeight="bold">
          I(X;Y) = {I.toFixed(3)}
        </text>
        <text x={BAR_X + BAR_W} y={BAR_Y + BAR_H + 16} textAnchor="end" fontSize="12" fill="currentColor" opacity="0.75">
          H(X|Y) = {HxGivenY.toFixed(3)}
        </text>
      </svg>
    </Panel>
  );
}
