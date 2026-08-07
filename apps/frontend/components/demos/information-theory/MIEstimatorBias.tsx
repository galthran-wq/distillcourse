"use client";

/**
 * Plug-in mutual information on a sample whose two coordinates are
 * independent by construction (disjoint hash streams, so the true I(X;Y) is
 * exactly 0). Sliders: sample size n and bins per axis r. The bar shows what
 * the estimator reports, against the (r-1)^2 / (2n ln 2) prediction, the
 * Miller-Madow correction and the two targets the lesson's <Task> sets.
 * "New sample" redraws: the estimate moves but never crosses zero, which is
 * the lesson's point that the failure is bias and not noise.
 */
import { useMemo, useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button, TargetList } from "@/components/ui";

const POOL = 20000;
const N_LADDER = [
  50, 65, 80, 100, 125, 160, 200, 250, 320, 400, 500, 650, 800, 1000, 1250,
  1600, 2000, 2500, 3200, 4000, 5000, 6500, 8000, 10000, 12500, 16000, 20000,
];
const MAX_DRAWN = 3000; // points plotted; the estimate always uses all n
const ACCENT = "#e2903a";
const LN2 = Math.LN2;

const PRESETS = [
  { label: "the lesson's 20×20", ni: 13, r: 20 }, // n = 1000, ~0.29 bits
  { label: "fine bins, few samples", ni: 3, r: 48 }, // n = 100, ~3.7 bits
  { label: "coarse bins, many samples", ni: 26, r: 4 }, // n = 20000, ~0.000
  { label: "the honest regime", ni: 25, r: 16 }, // n = 16000, ~0.010
] as const;

type S = { ni: number; r: number; seed: number; hit: boolean[]; hitR: number };
interface Sample {
  xs: Float64Array;
  ys: Float64Array;
}

/** lowbias32 integer hash to [0,1). */
function u01(k: number): number {
  let a = k | 0;
  a = Math.imul(a ^ (a >>> 16), 0x7feb352d);
  a = Math.imul(a ^ (a >>> 15), 0x846ca68b);
  a ^= a >>> 16;
  return (a >>> 0) / 4294967296;
}

const CACHE = new Map<number, Sample>();
/** Draw pool for a seed; x and y read disjoint index ranges of the hash. */
function poolFor(seed: number): Sample {
  let p = CACHE.get(seed);
  if (!p) {
    const base = seed * 2 * POOL;
    const xs = new Float64Array(POOL);
    const ys = new Float64Array(POOL);
    for (let i = 0; i < POOL; i++) {
      xs[i] = u01(base + i);
      ys[i] = u01(base + POOL + i);
    }
    p = { xs, ys };
    if (CACHE.size > 4) CACHE.clear();
    CACHE.set(seed, p);
  }
  return p;
}

/** Plug-in estimate, Miller-Madow correction and cell occupancy. */
function estimate(s: Sample, n: number, r: number) {
  const cnt = new Int32Array(r * r);
  const row = new Int32Array(r);
  const col = new Int32Array(r);
  for (let i = 0; i < n; i++) {
    const a = Math.min(r - 1, (s.xs[i] * r) | 0);
    const b = Math.min(r - 1, (s.ys[i] * r) | 0);
    cnt[a * r + b]++;
    row[a]++;
    col[b]++;
  }
  let bits = 0;
  let occ = 0;
  let orow = 0;
  let ocol = 0;
  for (let a = 0; a < r; a++) {
    if (row[a] > 0) orow++;
    if (col[a] > 0) ocol++;
    for (let b = 0; row[a] > 0 && b < r; b++) {
      const c = cnt[a * r + b];
      if (c === 0) continue;
      occ++;
      bits += (c / n) * Math.log2((c * n) / (row[a] * col[b]));
    }
  }
  return { bits, occ, mm: bits - (occ - orow - ocol + 1) / (2 * n * LN2) };
}

const met = (bits: number, r: number, hitR: number) => [bits > 0.5, hitR === r && bits < 0.05];
/** n needed for the artefact to fall under 0.05 bits at r bins per axis. */
const needN = (r: number) => Math.ceil((r - 1) ** 2 / (2 * 0.05 * LN2));

// Geometry: scatter square on the left, bits bar on the right.
const X0 = 24, Y0 = 10, SIZE = 232, BY0 = 242, BY1 = 20, BX = 322;
const bitsY = (v: number) => BY0 - Math.min(v, 1) * (BY0 - BY1);

export default function MIEstimatorBias() {
  // D3: opens on the lesson's headline experiment — 0.29 bits out of nothing.
  const [s, setS] = useState<S>({ ni: PRESETS[0].ni, r: PRESETS[0].r, seed: 1, hit: [false, false], hitR: -1 });
  const n = N_LADDER[s.ni];
  const { bits, occ, mm } = useMemo(() => estimate(poolFor(s.seed), n, s.r), [s.seed, n, s.r]);

  const set = (patch: Partial<S>) =>
    setS((prev) => {
      const next = { ...prev, ...patch };
      const e = estimate(poolFor(next.seed), N_LADDER[next.ni], next.r);
      const m = met(e.bits, next.r, prev.hitR);
      return { ...next, hitR: m[0] ? next.r : prev.hitR, hit: prev.hit.map((h, i) => h || m[i]) };
    });

  const pool = poolFor(s.seed);
  const now = met(bits, s.r, s.hitR);
  const predicted = (s.r - 1) ** 2 / (2 * n * LN2);
  const active = PRESETS.findIndex((p) => p.ni === s.ni && p.r === s.r);
  const grid = Array.from({ length: s.r - 1 }, (_, k) => {
    const t = ((k + 1) * SIZE) / s.r;
    return `M${X0 + t},${Y0}v${SIZE}M${X0},${Y0 + t}h${SIZE}`;
  }).join("");
  const dots = Array.from(
    { length: Math.min(n, MAX_DRAWN) },
    (_, i) => `M${(X0 + pool.xs[i] * SIZE).toFixed(1)},${(Y0 + (1 - pool.ys[i]) * SIZE).toFixed(1)}h.01`,
  ).join("");

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => set({ ni: PRESETS[i].ni, r: PRESETS[i].r })}
      />

      <TargetList
        targets={[
          {
            label: "1. Report more than 0.5 bits between independent variables",
            detail: `Î = ${bits.toFixed(3)} bits at n = ${n}, ${s.r} bins`,
            met: now[0],
            latched: s.hit[0],
          },
          {
            label: "2. Holding those bins, raise n until Î falls below 0.05",
            detail:
              s.hitR < 0
                ? "hit target 1 first — the bins you did it at get locked in here"
                : `${s.hitR} bins: (r−1)²/(2·0.05·ln 2) predicts n ≈ ${needN(s.hitR)}` +
                  (s.r === s.hitR ? "" : ` — you are at ${s.r} bins`),
            met: now[1],
            latched: s.hit[1],
          },
        ]}
      />

      <Slider
        label="sample size n" value={s.ni} min={0} max={N_LADDER.length - 1} step={1}
        onChange={(v) => set({ ni: v })} display={`n = ${n.toLocaleString("en-US")}`}
        ariaLabel="Sample size" ariaValueText={`${n} samples`}
      />
      <Slider
        label="bins per axis r" value={s.r} min={2} max={64} step={1}
        onChange={(v) => set({ r: v })} display={`${s.r} × ${s.r} table`} ariaLabel="Bins per axis"
      />

      <div className="pt-2">
        <Button onClick={() => set({ seed: s.seed + 1 })}>new sample</Button>
      </div>

      <Readout>
        Î = <strong>{bits.toFixed(3)} bits</strong> · predicted artefact {predicted.toFixed(3)} ·
        Miller–Madow {mm.toFixed(3)} · ceiling log₂ n = {Math.log2(n).toFixed(2)}
      </Readout>
      <Readout>
        {occ.toLocaleString("en-US")} of {(s.r * s.r).toLocaleString("en-US")} cells occupied,{" "}
        {(n / (s.r * s.r)).toFixed(n >= s.r * s.r ? 1 : 2)} points per cell on average
      </Readout>

      <svg
        viewBox="0 0 480 268" className="mt-3 w-full" role="img"
        aria-label={`${n} independent draws in a ${s.r} by ${s.r} table: plug-in estimate ${bits.toFixed(3)} bits, true value 0`}
      >
        <rect x={X0} y={Y0} width={SIZE} height={SIZE} fill="none" stroke="currentColor" opacity="0.5" />
        <path d={grid} stroke="currentColor" strokeWidth="0.5" opacity="0.28" />
        <path d={dots} stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" opacity="0.6" />
        <text x={X0 + SIZE} y={Y0 + SIZE + 16} fontSize="11" fill="currentColor" textAnchor="end">
          x uniform{n > MAX_DRAWN ? ` (${MAX_DRAWN} of ${n} drawn)` : ""}
        </text>
        <text x={X0} y={Y0 - 1} fontSize="11" fill="currentColor">
          y uniform, independent of x
        </text>

        {/* bits axis */}
        <line x1={BX - 4} y1={BY0} x2={470} y2={BY0} stroke="currentColor" opacity="0.5" />
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={BX - 4} y1={bitsY(v)} x2={BX} y2={bitsY(v)} stroke="currentColor" opacity="0.6" />
            <text x={BX - 7} y={bitsY(v) + 4} fontSize="10" fill="currentColor" textAnchor="end">{v}</text>
          </g>
        ))}
        {[0.5, 0.05].map((v, i) => (
          <g key={v} opacity="0.75">
            <line x1={BX} y1={bitsY(v)} x2={470} y2={bitsY(v)} stroke="currentColor" strokeDasharray="4 3" />
            <text x={470} y={bitsY(v) - 4} fontSize="10" fill="currentColor" textAnchor="end">
              target {i + 1}: {v} bits
            </text>
          </g>
        ))}
        <rect x={BX} y={bitsY(bits)} width={40} height={BY0 - bitsY(bits)} fill={ACCENT} />
        <line x1={BX - 2} y1={bitsY(predicted)} x2={BX + 46} y2={bitsY(predicted)} stroke="currentColor" strokeWidth="1.5" />
        <text x={BX + 50} y={bitsY(predicted) + 4} fontSize="10" fill="currentColor">
          predicted {predicted > 1 ? "→ " : ""}{predicted.toFixed(3)}
        </text>
        <text x={BX} y={bitsY(bits) - 5} fontSize="11" fontWeight="bold" fill="currentColor">
          {bits > 1 ? "→ " : ""}{bits.toFixed(3)} bits
        </text>
        <text x={BX + 46} y={BY0 - 3} fontSize="10" fill="currentColor" opacity="0.7">
          true I(X;Y) = 0
        </text>
      </svg>
    </Panel>
  );
}
