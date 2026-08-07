"use client";

/**
 * CoefficientPathExplorer — ridge vs lasso coefficient paths on one fixed
 * 8-feature problem (n = 40, standardized columns, penalties on the (1/2n)·RSS
 * scale). A log-λ slider moves a marker across both panels; dots mark the
 * current coefficients (amber = nonzero, hollow = exactly zero). Lasso paths
 * hit exact zero one feature at a time; ridge stays 8/8 dense at any finite λ.
 * Guided task (lesson): sweep up from "none" counting active features, then at
 * "heavy" check the survivors are the paths that started largest.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const N = 40;
const P = 8;
const K = 61; // λ-grid size; slider value = grid index
const TRUE_BETA = [5, -4, 3, -2, 1.2, -0.8, 0.4, 0];

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

/** Gauss–Jordan solve of Ax = b (8×8 SPD ridge systems). */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

/** Fixed dataset + full ridge/lasso paths, computed once at module load. */
function buildPaths() {
  const rng = mulberry32(11);
  const common = Array.from({ length: N }, () => gaussian(rng));
  const X = Array.from({ length: N }, () => new Array<number>(P).fill(0));
  for (let j = 0; j < P; j++)
    for (let i = 0; i < N; i++) X[i][j] = gaussian(rng) + 0.3 * common[i];
  let y = X.map((row) => row.reduce((s, x, j) => s + x * TRUE_BETA[j], 0) + gaussian(rng));
  for (let j = 0; j < P; j++) {
    let m = 0;
    for (let i = 0; i < N; i++) m += X[i][j];
    m /= N;
    let s = 0;
    for (let i = 0; i < N; i++) s += (X[i][j] - m) ** 2;
    s = Math.sqrt(s / N);
    for (let i = 0; i < N; i++) X[i][j] = (X[i][j] - m) / s;
  }
  const yMean = y.reduce((a, b) => a + b, 0) / N;
  y = y.map((v) => v - yMean);

  const G = Array.from({ length: P }, (_, a) =>
    Array.from({ length: P }, (_, b) => {
      let s = 0;
      for (let i = 0; i < N; i++) s += X[i][a] * X[i][b];
      return s / N;
    }),
  );
  const c0 = Array.from({ length: P }, (_, j) => {
    let s = 0;
    for (let i = 0; i < N; i++) s += X[i][j] * y[i];
    return s / N;
  });
  const lamMax = Math.max(...c0.map(Math.abs));
  const lamMin = lamMax / 1000;
  const lams = Array.from({ length: K }, (_, k) => lamMin * (lamMax / lamMin) ** (k / (K - 1)));

  const ridge = lams.map((l) =>
    solve(G.map((row, a) => row.map((v, b) => v + (a === b ? l : 0))), c0),
  );

  const soft = (z: number, g: number) => Math.sign(z) * Math.max(0, Math.abs(z) - g);
  const beta = new Array<number>(P).fill(0);
  const lasso: number[][] = new Array(K);
  for (let k = K - 1; k >= 0; k--) {
    for (let it = 0; it < 200; it++) {
      let maxDelta = 0;
      for (let j = 0; j < P; j++) {
        let r = 0;
        for (let i = 0; i < N; i++) {
          let pred = 0;
          for (let jj = 0; jj < P; jj++) if (jj !== j) pred += X[i][jj] * beta[jj];
          r += X[i][j] * (y[i] - pred);
        }
        const nb = soft(r / N, lams[k]) / G[j][j];
        maxDelta = Math.max(maxDelta, Math.abs(nb - beta[j]));
        beta[j] = nb;
      }
      if (maxDelta < 1e-9) break;
    }
    lasso[k] = beta.map((b) => (Math.abs(b) < 1e-8 ? 0 : b));
  }
  return { lams, ridge, lasso };
}

const { lams, ridge, lasso } = buildPaths();

// D3: presets are grid indices; "moderate" already shows lasso 4/8 vs ridge 8/8.
const PRESETS = [
  { label: "None", k: 0 },
  { label: "Moderate", k: 45 },
  { label: "Heavy", k: 53 },
];

const px = (k: number) => 34 + (k / (K - 1)) * 254; // grid index → x
const py = (v: number) => 96 - v * (88 / 6.3); // coefficient → y, range ±6.3
const fmtLam = (l: number) => (l < 0.1 ? l.toFixed(3) : l.toFixed(2));

function PathPanel({ paths, k, title }: { paths: number[][]; k: number; title: string }) {
  const active = paths[k].filter((v) => v !== 0).length;
  const ticks = [0.01, 0.1, 1];
  const tickX = (l: number) => 34 + (Math.log(l / lams[0]) / Math.log(lams[K - 1] / lams[0])) * 254;
  return (
    <svg viewBox="0 0 300 224" className="min-w-60 flex-1 select-none" role="img"
      aria-label={`${title} coefficient paths versus lambda; at the current lambda ${fmtLam(lams[k])}, ${active} of ${P} coefficients are nonzero`}>
      <line x1="34" y1="8" x2="34" y2="184" stroke="currentColor" opacity="0.5" />
      <line x1="34" y1={py(0)} x2="288" y2={py(0)} stroke="currentColor" opacity="0.4" strokeDasharray="2 4" />
      {[-4, 0, 4].map((v) => (
        <text key={v} x="29" y={py(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">{v}</text>
      ))}
      {ticks.map((l) => (
        <text key={l} x={tickX(l)} y="197" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{l}</text>
      ))}
      <text x="161" y="213" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">λ (log scale) — coefficient value</text>
      {Array.from({ length: P }, (_, j) => (
        <polyline key={j} fill="none" stroke="currentColor" opacity="0.55" strokeWidth="1.5"
          points={paths.map((b, i) => `${px(i).toFixed(1)},${py(b[j]).toFixed(1)}`).join(" ")} />
      ))}
      <line x1={px(k)} y1="8" x2={px(k)} y2="184" stroke={AMBER} opacity="0.6" strokeDasharray="3 3" />
      {paths[k].map((v, j) =>
        v !== 0 ? (
          <circle key={j} cx={px(k)} cy={py(v)} r="3.5" fill={AMBER} />
        ) : (
          <circle key={j} cx={px(k)} cy={py(0)} r="3.5" fill="none" stroke="currentColor" opacity="0.6" />
        ),
      )}
      <text x="40" y="20" fontSize="11" fontWeight="bold" fill="currentColor">{title}</text>
      <text x="40" y="34" fontSize="11" fill={active === P ? "currentColor" : AMBER}>{active}/{P} nonzero</text>
    </svg>
  );
}

export default function CoefficientPathExplorer() {
  const [k, setK] = useState(PRESETS[1].k);
  const activePreset = PRESETS.findIndex((p) => p.k === k);
  const nRidge = ridge[k].filter((v) => v !== 0).length;
  const nLasso = lasso[k].filter((v) => v !== 0).length;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setK(PRESETS[i].k)}
      />
      <Slider
        label="penalty λ (log scale)"
        value={k}
        min={0}
        max={K - 1}
        step={1}
        onChange={setK}
        display={`λ = ${fmtLam(lams[k])}`}
        ariaLabel="Penalty strength lambda, moved on a logarithmic grid"
      />
      <Readout>
        λ = <strong>{fmtLam(lams[k])}</strong> — nonzero coefficients: ridge{" "}
        <strong>{nRidge}/{P}</strong>, lasso <strong>{nLasso}/{P}</strong>
      </Readout>
      <div className="flex flex-wrap gap-3 pt-2">
        <PathPanel paths={ridge} k={k} title="ridge" />
        <PathPanel paths={lasso} k={k} title="lasso" />
      </div>
    </Panel>
  );
}
