"use client";

/**
 * MaxEntDice — slide the target mean of a six-sided die and watch the
 * maximum-entropy pmf tilt exponentially: p*_i ∝ e^{-λ i}, with live λ and
 * H readouts. Guided task (lesson prose): check λ = 0, H = 2.585 at mean
 * 3.5; λ ≈ -0.371, H ≈ 2.33 at Jaynes' 4.5; λ ≈ 0.63, H ≈ 1.97 at mean 2.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const PRESETS = [
  { label: "Mean 3.5 (uniform)", m: 3.5 },
  { label: "Jaynes' 4.5", m: 4.5 },
  { label: "Mean 2", m: 2 },
] as const;

const FACES = [1, 2, 3, 4, 5, 6];
const H_MAX = Math.log2(6); // 2.585 bits, the unconstrained maximum

// SVG geometry (user units)
const VW = 480;
const VH = 254;
const X0 = 36;
const X1 = 470;
const Y_TOP = 18;
const Y_BASE = 196;
const SLOT = (X1 - X0) / 6;

function yOf(p: number): number {
  return Y_BASE - p * (Y_BASE - Y_TOP);
}

/** pmf p_i ∝ e^{t·i} (t = -λ), max-subtracted so extremes never overflow. */
function pmf(t: number): number[] {
  const w = FACES.map((i) => Math.exp(t * i - Math.max(t * 6, 0)));
  const z = w.reduce((a, v) => a + v, 0);
  return w.map((v) => v / z);
}

function meanOf(p: number[]): number {
  return p.reduce((a, v, i) => a + v * FACES[i], 0);
}

/** Bisect t = -λ so that the exponential family hits the target mean. */
function solveTilt(target: number): number {
  let lo = -30;
  let hi = 30;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    if (meanOf(pmf(mid)) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function entropy(p: number[]): number {
  return p.reduce((h, v) => (v > 0 ? h - v * Math.log2(v) : h), 0);
}

export default function MaxEntDice() {
  // D3: open on Jaynes' Brandeis dice — the ladder already visibly tilted.
  const [m, setM] = useState<number>(4.5);

  const t = solveTilt(m);
  const p = pmf(t);
  const lambda = -t;
  const H = entropy(p);
  const uniform = Math.abs(lambda) < 0.005;

  const activePreset = PRESETS.findIndex((preset) => preset.m === m);
  const meanX = X0 + SLOT * (m - 0.5); // face i is centered at X0 + SLOT(i-1/2)

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setM(PRESETS[i].m)}
      />

      <Slider
        label="target mean ⟨i⟩"
        value={m}
        min={1.2}
        max={5.8}
        step={0.01}
        onChange={setM}
        display={m.toFixed(2)}
        ariaLabel="Target mean of the die"
      />

      <Readout>
        λ = <strong className="font-mono">{lambda.toFixed(3)}</strong>
        <span className="px-1" aria-hidden="true">
          ·
        </span>
        H(p*) = <strong className="font-mono">{H.toFixed(3)}</strong> bits (max
        log&#8322;6 = {H_MAX.toFixed(3)})
        {uniform && (
          <span className="pl-2 font-medium text-accent">
            λ = 0 — the constraint is inert; uniform recovered
          </span>
        )}
      </Readout>

      {/* entropy gauge: how much the constraint costs against log2 6 */}
      <div className="mt-1 h-2 w-full rounded-sm bg-line">
        <div
          className="h-2 rounded-sm bg-accent"
          style={{ width: `${(H / H_MAX) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs opacity-70">
        <span>0</span>
        <span>max = log&#8322;6 = {H_MAX.toFixed(3)} bits</span>
      </div>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full select-none"
        role="img"
        aria-label={`Maximum-entropy die for target mean ${m.toFixed(
          2,
        )}: probabilities ${p
          .map((v, i) => `face ${FACES[i]} ${v.toFixed(3)}`)
          .join(", ")}; lambda ${lambda.toFixed(3)}, entropy ${H.toFixed(3)} bits`}
      >
        {/* axes + p ticks */}
        <line x1={X0} y1={Y_TOP} x2={X0} y2={Y_BASE} stroke="currentColor" />
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={X0 - 4} y1={yOf(v)} x2={X0} y2={yOf(v)} stroke="currentColor" />
            <text x={X0 - 7} y={yOf(v) + 4} textAnchor="end" fontSize="11" fill="currentColor">
              {v}
            </text>
          </g>
        ))}
        {/* dashed guide at 1/6 — the uniform height */}
        <line
          x1={X0}
          y1={yOf(1 / 6)}
          x2={X1}
          y2={yOf(1 / 6)}
          stroke="currentColor"
          strokeDasharray="4 4"
          opacity="0.45"
        />
        <text x={X1} y={yOf(1 / 6) - 5} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
          &#8537; = uniform
        </text>
        {/* bars */}
        {p.map((v, i) => {
          const cx = X0 + SLOT * (i + 0.5);
          return (
            <g key={FACES[i]}>
              <rect
                x={cx - SLOT * 0.29}
                y={yOf(v)}
                width={SLOT * 0.58}
                height={Y_BASE - yOf(v)}
                rx="3"
                fill="#e2903a"
              />
              <text x={cx} y={yOf(v) - 6} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">
                {v.toFixed(2)}
              </text>
              <text x={cx} y={Y_BASE + 17} textAnchor="middle" fontSize="12" fill="currentColor">
                {FACES[i]}
              </text>
            </g>
          );
        })}
        {/* target-mean marker sliding continuously between the faces */}
        <line x1={meanX} y1={Y_TOP} x2={meanX} y2={Y_BASE} stroke="var(--accent, #e2903a)" strokeDasharray="3 3" />
        <path
          d={`M ${meanX - 5} ${Y_BASE + 31} L ${meanX + 5} ${Y_BASE + 31} L ${meanX} ${Y_BASE + 22} Z`}
          fill="var(--accent, #e2903a)"
        />
        <text x={meanX} y={Y_BASE + 44} textAnchor="middle" fontSize="11" fill="currentColor">
          ⟨i⟩ = {m.toFixed(2)}
        </text>
        <text x={12} y={(Y_TOP + Y_BASE) / 2} textAnchor="middle" fontSize="12" fill="currentColor" transform={`rotate(-90 12 ${(Y_TOP + Y_BASE) / 2})`}>
          p*
        </text>
      </svg>
    </Panel>
  );
}
