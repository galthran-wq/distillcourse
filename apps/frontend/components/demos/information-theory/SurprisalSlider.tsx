"use client";

/**
 * SurprisalSlider — drag a probability p and watch the surprisal -log2 p
 * ride the log curve. Guided task (from the lesson caption): find the
 * probability that gives exactly 3 bits.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const PRESETS = [
  { label: "Coin flip", p: 0.5 },
  { label: "Die shows 6", p: 1 / 6 },
  { label: "Certain event", p: 1 },
] as const;

const P_MIN = 0.005;
const P_STEP = 0.005;
const MAX_BITS = -Math.log2(P_MIN); // ≈ 7.64, top of the y-axis

// Plot geometry (SVG user units)
const X0 = 44;
const X1 = 464;
const Y0 = 208; // y at 0 bits
const Y1 = 16; // y at MAX_BITS

function x(p: number): number {
  return X0 + p * (X1 - X0);
}
function y(bits: number): number {
  return Y0 - (Math.min(bits, MAX_BITS) / MAX_BITS) * (Y0 - Y1);
}

// The curve is fixed; build its path once at module load.
const CURVE = (() => {
  const pts: string[] = [];
  for (let p = P_MIN; p <= 1.0000001; p += P_STEP) {
    pts.push(`${x(p).toFixed(1)},${y(-Math.log2(p)).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
})();

export default function SurprisalSlider() {
  // D3: open on the coin flip — the unit itself (exactly 1 bit).
  const [p, setP] = useState<number>(PRESETS[0].p);

  const bits = -Math.log2(p);
  const hitTarget = Math.abs(bits - 3) < 0.01; // guided task: exactly 3 bits
  const px = x(p);
  const py = y(bits);

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
        min={P_MIN}
        max={1}
        step={P_STEP}
        onChange={setP}
        display={p.toFixed(3)}
        ariaLabel="Probability of the event"
      />

      <Readout>
        surprisal = &minus;log&#8322;({p.toFixed(3)}) ={" "}
        <strong>{bits.toFixed(2)} bits</strong>
        {hitTarget && (
          <span className="pl-2 font-medium text-accent">
            exactly 3 bits — p = 1/8, three coin flips&rsquo; worth
          </span>
        )}
      </Readout>

      <svg
        viewBox="0 0 480 240"
        className="mt-2 w-full"
        role="img"
        aria-label={`Curve of surprisal versus probability; at p = ${p.toFixed(
          3,
        )} the surprisal is ${bits.toFixed(2)} bits`}
      >
        {/* axes */}
        <line x1={X0} y1={Y1} x2={X0} y2={Y0} stroke="currentColor" strokeWidth="1" />
        <line x1={X0} y1={Y0} x2={X1} y2={Y0} stroke="currentColor" strokeWidth="1" />
        {/* y ticks: bits */}
        {[0, 2, 4, 6].map((b) => (
          <g key={b}>
            <line x1={X0 - 4} y1={y(b)} x2={X0} y2={y(b)} stroke="currentColor" />
            <text x={X0 - 8} y={y(b) + 4} textAnchor="end" fontSize="11" fill="currentColor">
              {b}
            </text>
          </g>
        ))}
        {/* x ticks: p */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={x(t)} y1={Y0} x2={x(t)} y2={Y0 + 4} stroke="currentColor" />
            <text x={x(t)} y={Y0 + 16} textAnchor="middle" fontSize="11" fill="currentColor">
              {t}
            </text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y={236} textAnchor="middle" fontSize="12" fill="currentColor">
          probability p
        </text>
        <text
          x={12}
          y={(Y0 + Y1) / 2}
          textAnchor="middle"
          fontSize="12"
          fill="currentColor"
          transform={`rotate(-90 12 ${(Y0 + Y1) / 2})`}
        >
          bits
        </text>
        {/* blow-up annotation near p → 0 */}
        <text x={X0 + 10} y={Y1 + 12} fontSize="11" fill="currentColor" opacity="0.7">
          &rarr; &infin; as p &rarr; 0
        </text>
        {/* the curve */}
        <path d={CURVE} fill="none" stroke="#e2903a" strokeWidth="2.5" />
        {/* guides from the marker to both axes */}
        <line x1={px} y1={py} x2={px} y2={Y0} stroke="currentColor" strokeDasharray="3 3" opacity="0.5" />
        <line x1={X0} y1={py} x2={px} y2={py} stroke="currentColor" strokeDasharray="3 3" opacity="0.5" />
        {/* current point */}
        <circle cx={px} cy={py} r="6" fill="#e2903a" stroke="currentColor" strokeWidth="1.5" />
        <text
          x={Math.min(px + 10, X1 - 70)}
          y={Math.max(py - 10, Y1 + 24)}
          fontSize="12"
          fontWeight="bold"
          fill="currentColor"
        >
          {bits.toFixed(2)} bits
        </text>
      </svg>
    </Panel>
  );
}
