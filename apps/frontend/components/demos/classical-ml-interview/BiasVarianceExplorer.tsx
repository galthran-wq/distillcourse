"use client";

/**
 * BiasVarianceExplorer — polynomial degree vs generalization on noisy samples
 * of a fixed target f(x) = sin(πx). Left: one training draw and the current
 * fit. Right: train/test MSE vs degree (log scale) with the degree marked.
 * Resample refits the same degree to a fresh draw: degree-9 fits jump
 * (variance), degree-0 fits stand still but miss (bias). Guided task
 * (lesson): degree 9 + resample, then degree 0, then find the test minimum.
 */
import { useMemo, useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const SIGMA = 0.3; // label noise σ, so the noise floor is σ² = 0.09
const N_TRAIN = 12;
const MAX_DEG = 9;
const TRAIN_X = Array.from({ length: N_TRAIN }, (_, i) => -1 + (2 * i) / (N_TRAIN - 1));
const GRID = Array.from({ length: 101 }, (_, i) => -1 + i / 50);

const PRESETS = [
  { label: "Underfit (degree 0)", deg: 0 },
  { label: "Sweet spot (degree 3)", deg: 3 },
  { label: "Overfit (degree 9)", deg: 9 },
];

const target = (x: number) => Math.sin(Math.PI * x);

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gaussian = (rng: () => number) =>
  Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

/** Gauss–Jordan solve of Ax = b (small SPD systems from the normal equations). */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c || M[c][c] === 0) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1));
}

function polyfit(ys: number[], deg: number): number[] {
  const n = deg + 1;
  const A = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const b = new Array<number>(n).fill(0);
  for (let i = 0; i < TRAIN_X.length; i++) {
    const pows = [1];
    for (let k = 1; k < n; k++) pows.push(pows[k - 1] * TRAIN_X[i]);
    for (let r = 0; r < n; r++) {
      b[r] += pows[r] * ys[i];
      for (let c = 0; c < n; c++) A[r][c] += pows[r] * pows[c];
    }
  }
  for (let r = 0; r < n; r++) A[r][r] += 1e-9; // numerical safety only
  return solve(A, b);
}

const polyval = (beta: number[], x: number) =>
  beta.reduceRight((acc, c) => acc * x + c, 0);

const mse = (beta: number[], xs: number[], ys: number[]) =>
  xs.reduce((s, x, i) => s + (ys[i] - polyval(beta, x)) ** 2, 0) / xs.length;

export default function BiasVarianceExplorer() {
  // D3: open on the overfit preset — the degree-9 wiggle is the hook.
  const [degree, setDegree] = useState(9);
  const [seed, setSeed] = useState(1);

  const { ys, fits } = useMemo(() => {
    const rng = mulberry32(seed * 747796405 + 2891336453);
    const drawn = TRAIN_X.map((x) => target(x) + SIGMA * gaussian(rng));
    const all = Array.from({ length: MAX_DEG + 1 }, (_, d) => {
      const beta = polyfit(drawn, d);
      // expected test MSE at a fresh noisy point: σ² + mean squared miss of f
      const test = SIGMA ** 2 + mse(beta, GRID, GRID.map(target));
      return { beta, train: mse(beta, TRAIN_X, drawn), test };
    });
    return { ys: drawn, fits: all };
  }, [seed]);

  const cur = fits[degree];
  const activePreset = PRESETS.findIndex((p) => p.deg === degree);
  const fmt = (v: number) => (v >= 10 ? v.toFixed(1) : v.toFixed(3));

  // left panel: x ∈ [-1.08, 1.08] → [30, 292]; y ∈ [-1.9, 1.9] → [188, 8]
  const lx = (x: number) => 30 + ((x + 1.08) / 2.16) * 262;
  const ly = (y: number) => Math.min(188, Math.max(6, 98 - y * (180 / 3.8)));
  const path = (f: (x: number) => number) =>
    GRID.map((x) => `${lx(x).toFixed(1)},${ly(f(x)).toFixed(1)}`).join(" ");

  // right panel: degree → [34, 288]; log₁₀ MSE ∈ [-2, 2] → [182, 8]
  const rx = (d: number) => 34 + (d / MAX_DEG) * 254;
  const ry = (v: number) =>
    182 - ((Math.min(2, Math.max(-2, Math.log10(v))) + 2) / 4) * 174;
  const trace = (key: "train" | "test") =>
    fits.map((f, d) => `${rx(d).toFixed(1)},${ry(Math.max(f[key], 1e-4)).toFixed(1)}`).join(" ");

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setDegree(PRESETS[i].deg)}
      />
      <Slider
        label="polynomial degree"
        value={degree}
        min={0}
        max={MAX_DEG}
        step={1}
        onChange={setDegree}
        display={String(degree)}
        ariaLabel="Polynomial degree of the fitted model"
      />
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button onClick={() => setSeed((s) => s + 1)}>Resample training set</Button>
        <Readout>
          train MSE = <strong>{fmt(cur.train)}</strong>, test MSE ={" "}
          <strong>{fmt(cur.test)}</strong> (noise floor σ² = {(SIGMA ** 2).toFixed(2)})
        </Readout>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <svg viewBox="0 0 300 224" className="min-w-60 flex-1 select-none" role="img"
          aria-label={`Degree-${degree} polynomial fit to ${N_TRAIN} noisy samples of sine of pi x; train MSE ${fmt(cur.train)}, test MSE ${fmt(cur.test)}`}>
          <line x1="30" y1="188" x2="292" y2="188" stroke="currentColor" opacity="0.5" />
          <line x1="30" y1="4" x2="30" y2="188" stroke="currentColor" opacity="0.5" />
          {[-1, 0, 1].map((v) => (
            <g key={v}>
              <text x={lx(v)} y="201" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{v}</text>
              <text x="24" y={ly(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">{v}</text>
            </g>
          ))}
          <text x="161" y="215" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">x — fit (amber) vs target (dashed)</text>
          <polyline points={path(target)} fill="none" stroke="currentColor" opacity="0.45" strokeDasharray="4 3" strokeWidth="1.5" />
          <polyline points={path((x) => polyval(cur.beta, x))} fill="none" stroke={AMBER} strokeWidth="2.5" />
          {TRAIN_X.map((x, i) => (
            <circle key={i} cx={lx(x)} cy={ly(Math.min(1.9, Math.max(-1.9, ys[i])))} r="3" fill="currentColor" opacity="0.8" />
          ))}
        </svg>
        <svg viewBox="0 0 300 224" className="min-w-60 flex-1 select-none" role="img"
          aria-label={`Train and test MSE versus polynomial degree on a log scale, current degree ${degree} marked; test error is U-shaped, train error falls monotonically`}>
          <line x1="34" y1="182" x2="288" y2="182" stroke="currentColor" opacity="0.5" />
          <line x1="34" y1="4" x2="34" y2="182" stroke="currentColor" opacity="0.5" />
          {[0.01, 0.1, 1, 10, 100].map((v) => (
            <text key={v} x="29" y={ry(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">{v}</text>
          ))}
          {fits.map((_, d) => (
            <text key={d} x={rx(d)} y="195" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{d}</text>
          ))}
          <text x="161" y="212" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">degree — MSE, log scale</text>
          <line x1={rx(degree)} y1="8" x2={rx(degree)} y2="182" stroke="currentColor" opacity="0.3" strokeDasharray="3 3" />
          <line x1="34" y1={ry(SIGMA ** 2)} x2="288" y2={ry(SIGMA ** 2)} stroke="currentColor" opacity="0.3" strokeDasharray="2 4" />
          <text x="286" y={ry(SIGMA ** 2) - 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">σ²</text>
          <polyline points={trace("train")} fill="none" stroke={BLUE} strokeWidth="2" />
          <polyline points={trace("test")} fill="none" stroke={AMBER} strokeWidth="2.5" />
          <circle cx={rx(degree)} cy={ry(Math.max(cur.train, 1e-4))} r="4" fill={BLUE} />
          <circle cx={rx(degree)} cy={ry(cur.test)} r="4" fill={AMBER} />
          <text x="44" y="16" fontSize="11" fontWeight="bold" fill={AMBER}>test</text>
          <text x="44" y="30" fontSize="11" fontWeight="bold" fill={BLUE}>train</text>
        </svg>
      </div>
    </Panel>
  );
}
