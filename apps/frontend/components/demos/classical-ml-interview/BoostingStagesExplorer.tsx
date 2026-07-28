"use client";

/**
 * BoostingStagesExplorer — gradient boosting with regression stumps on a
 * fixed 1D noisy dataset (y = 0.7·sin(2πx) + 0.5x − 0.25 + ε, σ = 0.25,
 * seeded PRNG). Both runs (ν = 0.1 and ν = 1.0, M = 0…100) are precomputed
 * at module load; the iteration slider just indexes frames. Left panel:
 * data, true curve, accumulated fit F_M. Right panel: current residuals
 * y − F_M — the targets the next tree would fit — with the ±σ noise floor
 * marked. Guided task (lesson): find where ν = 1.0 residuals stop shrinking.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const N = 60, GRID = 160, M_MAX = 100, SIGMA = 0.25;
const NUS = [0.1, 1.0];
const W = 320, FH = 210, RH = 150; // fit panel and residual panel sizes

const PRESETS = [
  { label: "Mean only (M = 0)", nu: 0.1, m: 0 },
  { label: "ν = 0.1, mid-run (M = 30)", nu: 0.1, m: 30 },
  { label: "ν = 0.1, M = 100 (smooth)", nu: 0.1, m: 100 },
  { label: "ν = 1.0, M = 100 (rough)", nu: 1.0, m: 100 },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rng: () => number) =>
  Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

const f = (x: number) => 0.7 * Math.sin(2 * Math.PI * x) + 0.5 * x - 0.25;
const rng = mulberry32(11);
const XS = Array.from({ length: N }, () => rng()).sort((a, b) => a - b);
const YS = XS.map((x) => f(x) + SIGMA * gauss(rng));
const GX = Array.from({ length: GRID }, (_, j) => j / (GRID - 1));

interface Frame { grid: number[]; resid: number[]; rmse: number }

/** Squared-error boosting with exact-RSS stumps; snapshots every M. */
function runBoost(nu: number): Frame[] {
  const mean = YS.reduce((s, y) => s + y, 0) / N;
  const trainF: number[] = Array(N).fill(mean);
  const gridF: number[] = Array(GRID).fill(mean);
  const frames: Frame[] = [];
  const snap = () => {
    const resid = YS.map((y, i) => y - trainF[i]);
    const rmse = Math.sqrt(resid.reduce((s, r) => s + r * r, 0) / N);
    frames.push({ grid: [...gridF], resid, rmse });
  };
  snap();
  for (let m = 0; m < M_MAX; m++) {
    const r = YS.map((y, i) => y - trainF[i]);
    const total = r.reduce((s, v) => s + v, 0);
    let best = { score: -Infinity, k: 0 };
    let sl = 0;
    for (let k = 0; k < N - 1; k++) {
      sl += r[k];
      if (XS[k] === XS[k + 1]) continue;
      const score = (sl * sl) / (k + 1) + ((total - sl) * (total - sl)) / (N - k - 1);
      if (score > best.score) best = { score, k };
    }
    const nL = best.k + 1;
    const sL = r.slice(0, nL).reduce((s, v) => s + v, 0);
    const thr = (XS[best.k] + XS[best.k + 1]) / 2;
    const lVal = sL / nL, rVal = (total - sL) / (N - nL);
    for (let i = 0; i < N; i++) trainF[i] += nu * (XS[i] <= thr ? lVal : rVal);
    for (let j = 0; j < GRID; j++) gridF[j] += nu * (GX[j] <= thr ? lVal : rVal);
    snap();
  }
  return frames;
}

const RUN_SLOW = runBoost(0.1);
const RUN_FAST = runBoost(1.0);

const px = (x: number) => 8 + x * (W - 16);
const fy = (y: number) => FH / 2 - (y / 1.6) * (FH / 2 - 8);
const ry = (r: number) => RH / 2 - (r / 1.6) * (RH / 2 - 8);
const linePath = (ys: number[], sy: (v: number) => number) =>
  GX.map((x, j) => `${px(x)},${sy(ys[j])}`).join(" ");
const TRUE_PATH = linePath(GX.map(f), fy);

export default function BoostingStagesExplorer() {
  // D3: open mid-run — the fit already tracks the curve, residuals still
  // carry visible structure the next tree could fit.
  const [nu, setNu] = useState(0.1);
  const [m, setM] = useState(30);
  const { grid, resid, rmse } = (nu === 0.1 ? RUN_SLOW : RUN_FAST)[m];
  const activePreset = PRESETS.findIndex(
    (p) => p.m === m && (m === 0 || p.nu === nu),
  );

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => { setNu(PRESETS[i].nu); setM(PRESETS[i].m); }}
      />
      <Slider
        label="iterations M (trees so far)"
        value={m}
        min={0}
        max={M_MAX}
        step={1}
        onChange={setM}
        display={String(m)}
        ariaLabel="Number of boosting iterations"
      />
      <div className="flex items-center gap-2 pb-1 pt-2 text-sm">
        <span>learning rate ν</span>
        {NUS.map((v) => (
          <Button key={v} active={nu === v} onClick={() => setNu(v)}>
            {v.toFixed(1)}
          </Button>
        ))}
      </div>
      <Readout>
        M = {m} · ν = {nu.toFixed(1)} · residual RMSE ={" "}
        <strong>{rmse.toFixed(3)}</strong> (noise floor σ = {SIGMA.toFixed(2)})
      </Readout>
      <div className="mt-2 flex flex-wrap items-start justify-center gap-4">
        <svg
          viewBox={`0 0 ${W} ${FH}`}
          className="block w-full max-w-80 select-none"
          role="img"
          aria-label={`Boosted fit after ${m} trees at learning rate ${nu}, plotted over the noisy data and the true curve`}
        >
          <line x1={px(0)} y1={fy(0)} x2={px(1)} y2={fy(0)} stroke="currentColor" opacity="0.25" />
          <polyline points={TRUE_PATH} fill="none" stroke="currentColor" opacity="0.45" strokeDasharray="4 3" />
          {XS.map((x, i) => (
            <circle key={i} cx={px(x)} cy={fy(YS[i])} r="2.5" fill={BLUE} />
          ))}
          <polyline points={linePath(grid, fy)} fill="none" stroke={AMBER} strokeWidth="2.5" />
          <text x="10" y="14" fontSize="11" fontWeight="bold" fill={BLUE}>data</text>
          <text x="10" y="28" fontSize="11" fill="currentColor" opacity="0.65">true f(x)</text>
          <text x="10" y="42" fontSize="11" fontWeight="bold" fill={AMBER}>fit F_M(x)</text>
          <text x={W - 8} y={FH - 6} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">x</text>
        </svg>
        <svg
          viewBox={`0 0 ${W} ${RH}`}
          className="block w-full max-w-80 select-none"
          role="img"
          aria-label={`Residuals after ${m} trees, root mean square ${rmse.toFixed(3)} against noise floor ${SIGMA}`}
        >
          <line x1={px(0)} y1={ry(0)} x2={px(1)} y2={ry(0)} stroke="currentColor" opacity="0.5" />
          <line x1={px(0)} y1={ry(SIGMA)} x2={px(1)} y2={ry(SIGMA)} stroke={AMBER} opacity="0.6" strokeDasharray="3 3" />
          <line x1={px(0)} y1={ry(-SIGMA)} x2={px(1)} y2={ry(-SIGMA)} stroke={AMBER} opacity="0.6" strokeDasharray="3 3" />
          {XS.map((x, i) => (
            <circle key={i} cx={px(x)} cy={ry(resid[i])} r="2.5" fill={BLUE} />
          ))}
          <text x="10" y="14" fontSize="11" fontWeight="bold" fill="currentColor" opacity="0.8">
            residuals y − F_M(x): the next tree&apos;s targets
          </text>
          <text x={W - 8} y={ry(SIGMA) - 4} textAnchor="end" fontSize="10" fill={AMBER}>±σ noise floor</text>
        </svg>
      </div>
    </Panel>
  );
}
