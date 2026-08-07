"use client";

/**
 * KernelBoundaryExplorer — RBF-SVM on fixed ring-in-disk data (seeded
 * PRNG: inner disk class −1, surrounding ring class +1, overlapping
 * radii so memorization hurts). Every γ/C change re-solves the kernel
 * dual by coordinate descent (bias folded in as K+1) and redraws the
 * decision regions, green support-vector rings, and train/test error.
 * Presets: γ too small (underfit) / balanced / γ too large (islands),
 * all at C = 1 so the lesson task "start from balanced, push γ up"
 * walks straight through them.
 */
import { useMemo, useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const GREEN = "#5aa46a";
const X0 = -3, X1 = 3, Y0 = -3, Y1 = 3;
const W = 340, H = 340, GW = 56, GH = 56;
const N_TRAIN = 64, N_TEST = 256, EPOCHS = 300;

const PRESETS = [
  { label: "γ too small (underfit)", lg: -1.5, lc: 0 },
  { label: "balanced", lg: 0, lc: 0 },
  { label: "γ too large (islands)", lg: 2.4, lc: 0 },
];

type Pt = { x: number; y: number; c: 1 | -1 };

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

/** Ring (class +1, radius ≈ 1.9) around a disk (class −1); radii overlap. */
function makeData(seed: number, n: number): Pt[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, (_, i) => {
    const c: 1 | -1 = i % 2 === 0 ? -1 : 1;
    const ang = 2 * Math.PI * rng();
    const r = c === -1 ? Math.abs(gaussian(rng)) * 0.62 : 1.9 + 0.38 * gaussian(rng);
    return { x: r * Math.cos(ang), y: r * Math.sin(ang), c };
  });
}

const TRAIN = makeData(11, N_TRAIN);
const TEST = makeData(99, N_TEST);

/** Dual coordinate descent on the kernel soft-margin SVM; K+1 absorbs the bias. */
function solveSvm(gamma: number, C: number): Float64Array {
  const n = TRAIN.length;
  const K = new Float64Array(n * n);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const d = (TRAIN[i].x - TRAIN[j].x) ** 2 + (TRAIN[i].y - TRAIN[j].y) ** 2;
      K[i * n + j] = Math.exp(-gamma * d) + 1;
    }
  const a = new Float64Array(n);
  const f = new Float64Array(n); // f[j] = Σᵢ αᵢ yᵢ K(xᵢ, xⱼ)
  for (let e = 0; e < EPOCHS; e++)
    for (let i = 0; i < n; i++) {
      const g = TRAIN[i].c * f[i] - 1;
      const na = Math.min(Math.max(a[i] - g / K[i * n + i], 0), C);
      const d = na - a[i];
      if (d !== 0) {
        for (let j = 0; j < n; j++) f[j] += d * TRAIN[i].c * K[i * n + j];
        a[i] = na;
      }
    }
  return a;
}

/** Decision function f(p) = Σ αᵢ yᵢ (exp(−γ‖xᵢ − p‖²) + 1). */
function decide(a: Float64Array, gamma: number, px: number, py: number): number {
  let s = 0;
  for (let i = 0; i < TRAIN.length; i++) {
    if (a[i] === 0) continue;
    const d = (TRAIN[i].x - px) ** 2 + (TRAIN[i].y - py) ** 2;
    s += a[i] * TRAIN[i].c * (Math.exp(-gamma * d) + 1);
  }
  return s;
}

const sx = (x: number) => ((x - X0) / (X1 - X0)) * W;
const sy = (y: number) => ((Y1 - y) / (Y1 - Y0)) * H;
const fmt = (v: number) => (v < 0.1 ? v.toFixed(3) : v < 10 ? v.toFixed(2) : v.toFixed(0));

export default function KernelBoundaryExplorer() {
  // D3: open on "balanced" — a nonlinear ring boundary a linear SVM cannot draw.
  const [lg, setLg] = useState(PRESETS[1].lg); // log10 γ
  const [lc, setLc] = useState(PRESETS[1].lc); // log10 C
  const gamma = 10 ** lg, C = 10 ** lc;

  const { runs, sv, trainErr, testErr } = useMemo(() => {
    const a = solveSvm(gamma, C);
    const err = (pts: Pt[]) =>
      pts.filter((p) => decide(a, gamma, p.x, p.y) * p.c <= 0).length / pts.length;
    // merge each grid row's predicted-ring cells into horizontal run rectangles
    const runs: { x: number; y: number; w: number }[] = [];
    const cw = W / GW, ch = H / GH;
    for (let gy = 0; gy < GH; gy++) {
      let start = -1;
      for (let gx = 0; gx <= GW; gx++) {
        const px = X0 + ((gx + 0.5) / GW) * (X1 - X0);
        const py = Y1 - ((gy + 0.5) / GH) * (X1 - X0);
        const ring = gx < GW && decide(a, gamma, px, py) > 0;
        if (ring && start < 0) start = gx;
        else if (!ring && start >= 0) {
          runs.push({ x: start * cw, y: gy * ch, w: (gx - start) * cw });
          start = -1;
        }
      }
    }
    return { runs, sv: TRAIN.map((_, i) => a[i] > 1e-6), trainErr: err(TRAIN), testErr: err(TEST) };
  }, [gamma, C]);

  const nSv = sv.filter(Boolean).length;
  const active = PRESETS.findIndex((p) => p.lg === lg && p.lc === lc);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => { setLg(PRESETS[i].lg); setLc(PRESETS[i].lc); }}
      />
      <Slider
        label="γ (log scale) — kernel bandwidth, how local each vote is"
        value={lg}
        min={-2}
        max={2.6}
        step={0.05}
        onChange={setLg}
        display={`γ = ${fmt(gamma)}`}
        ariaLabel="RBF kernel width gamma, log scale"
      />
      <Slider
        label="C (log scale) — price of slack"
        value={lc}
        min={-1}
        max={2}
        step={0.05}
        onChange={setLc}
        display={`C = ${fmt(C)}`}
        ariaLabel="Slack penalty C, log scale"
      />
      <Readout>
        train error = <strong>{trainErr.toFixed(3)}</strong> · test error ={" "}
        <strong>{testErr.toFixed(3)}</strong> ({N_TEST} held-out) · support vectors ={" "}
        <strong>{nSv}</strong> / {N_TRAIN}
      </Readout>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-2 block w-full max-w-90 select-none"
        role="img"
        aria-label={`RBF-SVM decision regions at gamma ${fmt(gamma)}, C ${fmt(C)}: train error ${trainErr.toFixed(3)}, test error ${testErr.toFixed(3)}, ${nSv} support vectors`}
      >
        <rect x="0" y="0" width={W} height={H} rx="4" fill={BLUE} opacity="0.12" />
        {runs.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={H / GH + 0.5} fill={AMBER} opacity="0.22" />
        ))}
        {TRAIN.map((p, i) => (
          <g key={i}>
            {sv[i] && (
              <circle cx={sx(p.x)} cy={sy(p.y)} r="6.5" fill="none" stroke={GREEN} strokeWidth="2" />
            )}
            <circle cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={p.c === 1 ? AMBER : BLUE} />
          </g>
        ))}
        <text x="8" y="16" fontSize="11" fontWeight="bold" fill={AMBER}>ring class +1</text>
        <text x="8" y="30" fontSize="11" fontWeight="bold" fill={BLUE}>disk class −1</text>
        <text x="8" y="44" fontSize="10" fill="currentColor" opacity="0.65">
          shading = predicted class · green ring = support vector
        </text>
        <text x={W - 10} y={H - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">x₁</text>
        <text x="8" y={H - 8} fontSize="11" fill="currentColor" opacity="0.65">x₂</text>
      </svg>
    </Panel>
  );
}
