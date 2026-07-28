"use client";

/**
 * GradientDescentExplorer — batch GD on the lesson's running example, the
 * elongated quadratic bowl J(θ) = ½(θ₁² + 10θ₂²) from θ⁽⁰⁾ = (−8, 3).
 * Left: contours + trajectory. Right: loss per iteration on a log scale.
 * The update is closed-form, θ₁ ← (1−η)θ₁ and θ₂ ← (1−10η)θ₂, so the whole
 * trajectory recomputes synchronously as η moves. Newton preset: one jump.
 * Guided task (lesson): run the three η presets, read J after 10 iterations,
 * then find the slider threshold (η = 0.2 = 2/L) where convergence flips
 * into oscillating divergence.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const X0 = -8;
const Y0 = 3;
const MAX_K = 30;
const LEVELS = [2, 8, 18, 32, 50, 77]; // J = 77 passes through the start

const PRESETS = [
  { label: "Small η (0.02)", eta: 0.02, newton: false },
  { label: "Good η (0.17)", eta: 0.17, newton: false },
  { label: "Divergent η (0.25)", eta: 0.25, newton: false },
  { label: "Newton step", eta: 0.17, newton: true },
];

const loss = (x: number, y: number) => 0.5 * (x * x + 10 * y * y);

/** Iterate i of the trajectory, closed form (Newton lands exactly at 0). */
function point(eta: number, newton: boolean, i: number): [number, number] {
  if (newton) return i === 0 ? [X0, Y0] : [0, 0];
  return [X0 * (1 - eta) ** i, Y0 * (1 - 10 * eta) ** i];
}

const fmt = (v: number) =>
  v === 0 ? "0" : v >= 1e4 ? v.toExponential(1) : v >= 100 ? v.toFixed(0) : v >= 1 ? v.toFixed(2) : v.toFixed(3);

// left panel: θ₁ ∈ [−11, 11] → x, θ₂ ∈ [−4.4, 4.4] → y (near-isotropic scale)
const sx = (x: number) => 160 + 13.6 * x;
const sy = (y: number) => 70 - 13.2 * y;
const clampCoord = (v: number) => Math.max(-40, Math.min(40, v));
// right panel: iteration 0..30 → x, log₁₀ J ∈ [−3, 6] → y
const rx = (i: number) => 34 + (i / MAX_K) * 274;
const ry = (J: number) =>
  128 - ((Math.min(6, Math.max(-3, Math.log10(Math.max(J, 1e-3)))) + 3) / 9) * 116;

export default function GradientDescentExplorer() {
  // D3: open on the lesson figure's setting — good η, 10 steps of zig-zag.
  const [eta, setEta] = useState(0.17);
  const [newton, setNewton] = useState(false);
  const [k, setK] = useState(10);

  const traj = Array.from({ length: k + 1 }, (_, i) => point(eta, newton, i));
  const losses = traj.map(([x, y]) => loss(x, y));
  const J = losses[k];
  const m1 = 1 - eta;
  const m2 = 1 - 10 * eta;
  const activePreset = PRESETS.findIndex((p) =>
    p.newton ? newton : !newton && p.eta === eta,
  );
  const pathPts = traj
    .map(([x, y]) => `${sx(clampCoord(x)).toFixed(1)},${sy(clampCoord(y)).toFixed(1)}`)
    .join(" ");
  const lossPts = losses.map((v, i) => `${rx(i).toFixed(1)},${ry(v).toFixed(1)}`).join(" ");

  const selectPreset = (i: number) => {
    setEta(PRESETS[i].eta);
    setNewton(PRESETS[i].newton);
    setK(PRESETS[i].newton ? 1 : 10);
  };

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={selectPreset}
      />
      <Slider
        label="learning rate η"
        value={eta}
        min={0.005}
        max={0.3}
        step={0.005}
        onChange={(v) => {
          setEta(v);
          setNewton(false);
        }}
        display={eta.toFixed(3)}
        ariaLabel="Learning rate for gradient descent"
      />
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button onClick={() => setK((v) => Math.min(MAX_K, v + 1))} disabled={k >= MAX_K}>
          Step
        </Button>
        <Button onClick={() => setK(0)}>Reset</Button>
        <Readout>
          {newton ? (
            <>
              Newton: θ ← θ − H⁻¹∇J lands on the minimum in one step, whatever
              the conditioning — iteration <strong>{k}</strong>, J ={" "}
              <strong>{fmt(J)}</strong>
            </>
          ) : (
            <>
              iteration <strong>{k}</strong>: J = <strong>{fmt(J)}</strong>{" "}
              — per-step multipliers: shallow 1−η = {m1.toFixed(2)}, steep 1−10η ={" "}
              {m2.toFixed(2)}
            </>
          )}
        </Readout>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <svg
          viewBox="0 0 320 160"
          className="min-w-60 flex-1 select-none"
          role="img"
          aria-label={`Contours of the quadratic bowl with a ${newton ? "Newton" : "gradient-descent"} trajectory of ${k} steps from (−8, 3); current loss ${fmt(J)}`}
        >
          <clipPath id="gd-clip">
            <rect x="2" y="2" width="316" height="136" />
          </clipPath>
          {LEVELS.map((c) => (
            <ellipse
              key={c}
              cx={sx(0)}
              cy={sy(0)}
              rx={Math.sqrt(2 * c) * 13.6}
              ry={Math.sqrt(c / 5) * 13.2}
              fill="none"
              stroke="currentColor"
              opacity="0.25"
              clipPath="url(#gd-clip)"
            />
          ))}
          <text x={sx(9.2)} y={sy(3.4)} fontSize="10" fill="currentColor" opacity="0.7">
            J = 77
          </text>
          <g clipPath="url(#gd-clip)">
            <polyline points={pathPts} fill="none" stroke={AMBER} strokeWidth="1.8" />
            {traj.map(([x, y], i) => (
              <circle
                key={i}
                cx={sx(clampCoord(x))}
                cy={sy(clampCoord(y))}
                r={i === k ? 4 : 2.4}
                fill={AMBER}
              />
            ))}
          </g>
          <path d={`M ${sx(0) - 4} ${sy(0)} h 8 M ${sx(0)} ${sy(0) - 4} v 8`} stroke="currentColor" strokeWidth="1.5" />
          <text x={sx(0) + 7} y={sy(0) + 4} fontSize="10" fill="currentColor" opacity="0.7">
            minimum
          </text>
          <text x={sx(X0)} y={sy(Y0) - 8} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">
            θ⁽⁰⁾
          </text>
          <text x="160" y="153" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">
            θ₁ (shallow) — θ₂ (steep) · J(θ) = ½(θ₁² + 10θ₂²)
          </text>
        </svg>
        <svg
          viewBox="0 0 320 160"
          className="min-w-60 flex-1 select-none"
          role="img"
          aria-label={`Loss versus iteration on a log scale, ${k} iterations, final loss ${fmt(J)}`}
        >
          <line x1="34" y1="128" x2="308" y2="128" stroke="currentColor" opacity="0.5" />
          <line x1="34" y1="8" x2="34" y2="128" stroke="currentColor" opacity="0.5" />
          {[1e-3, 1, 1e3, 1e6].map((v) => (
            <text key={v} x="29" y={ry(v) + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.7">
              {v >= 1000 ? "1e" + Math.log10(v) : v}
            </text>
          ))}
          {[0, 10, 20, 30].map((i) => (
            <text key={i} x={rx(i)} y="140" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">
              {i}
            </text>
          ))}
          <text x="171" y="153" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">
            iteration — J, log scale
          </text>
          <polyline points={lossPts} fill="none" stroke={BLUE} strokeWidth="2" />
          <circle cx={rx(k)} cy={ry(J)} r="4" fill={BLUE} />
        </svg>
      </div>
    </Panel>
  );
}
