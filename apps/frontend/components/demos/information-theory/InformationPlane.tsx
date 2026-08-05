"use client";

/**
 * Information bottleneck frontier on the lesson's toy joint:
 * X uniform on {a,b,c,d}, p(y=1|x) = 0, 1/4, 3/4, 1.
 * A beta slider moves the optimal encoder's point along the frontier,
 * computed once at load by the self-consistent Gibbs iteration
 * (Tishby-Pereira-Bialek Theorem 4), annealed upward in beta.
 */
import { useState } from "react";
import { Panel, PresetGroup, Readout, Slider } from "@/components/ui";

const N = 4;
const PX = [0.25, 0.25, 0.25, 0.25];
const PY1X = [0, 0.25, 0.75, 1]; // p(y=1 | x)
const IXY = 0.594; // I(X;Y) of the toy joint, bits
const BETA_MAX = 15;
const BETA_STEP = 0.05;
const ACCENT = "#e2903a";

type Enc = number[][]; // enc[x][t] = p(t|x)

/** Binary KL divergence D((p,1-p) || (q,1-q)) in bits, zero-guarded. */
function klBin(p: number, q: number): number {
  const qq = Math.min(Math.max(q, 1e-9), 1 - 1e-9);
  let d = 0;
  if (p > 0) d += p * Math.log2(p / qq);
  if (p < 1) d += (1 - p) * Math.log2((1 - p) / (1 - qq));
  return d;
}

/** Cluster marginals p(t) and p(t, y=1) induced by an encoder. */
function marginals(enc: Enc) {
  const pt = Array<number>(N).fill(0);
  const pt1 = Array<number>(N).fill(0);
  for (let x = 0; x < N; x++)
    for (let t = 0; t < N; t++) {
      pt[t] += PX[x] * enc[x][t];
      pt1[t] += PX[x] * enc[x][t] * PY1X[x];
    }
  return { pt, pt1 };
}

/** One Gibbs self-consistency update: p(t|x) ∝ p(t) 2^(-beta D). */
function ibStep(enc: Enc, beta: number): Enc {
  const { pt, pt1 } = marginals(enc);
  return enc.map((row, x) => {
    const w = pt.map((m, t) =>
      m <= 1e-12 ? 0 : m * 2 ** (-beta * klBin(PY1X[x], pt1[t] / m)),
    );
    const z = w.reduce((a, b) => a + b, 0);
    return z > 0 ? w.map((v) => v / z) : row;
  });
}

/** Plane coordinates (I(X;T), I(T;Y)) of an encoder, in bits. */
function planePoint(enc: Enc) {
  const { pt, pt1 } = marginals(enc);
  let ixt = 0;
  let ity = 0;
  for (let x = 0; x < N; x++)
    for (let t = 0; t < N; t++) {
      const v = PX[x] * enc[x][t];
      if (v > 1e-12) ixt += v * Math.log2(enc[x][t] / pt[t]);
    }
  for (let t = 0; t < N; t++) {
    const p1 = pt1[t];
    const p0 = pt[t] - p1;
    if (p1 > 1e-12) ity += p1 * Math.log2(p1 / (pt[t] * 0.5));
    if (p0 > 1e-12) ity += p0 * Math.log2(p0 / (pt[t] * 0.5));
  }
  return { ixt, ity };
}

/** Frontier sweep: anneal beta upward, warm-starting each step and nudging
 * toward the identity encoder so the trivial fixed point can be escaped. */
const SWEEP = (() => {
  let enc: Enc = Array.from({ length: N }, () => Array<number>(N).fill(1 / N));
  const points: { beta: number; ixt: number; ity: number }[] = [];
  for (let i = 0; i <= Math.round(BETA_MAX / BETA_STEP); i++) {
    const beta = i * BETA_STEP;
    enc = enc.map((row, x) => row.map((v, t) => 0.98 * v + (t === x ? 0.02 : 0)));
    for (let k = 0; k < 200; k++) enc = ibStep(enc, beta);
    points.push({ beta, ...planePoint(enc) });
  }
  return points;
})();

// Plane geometry: I(X;T) in [0, 2.2] -> x px, I(T;Y) in [0, 0.7] -> y px.
const sx = (v: number) => 44 + (v / 2.2) * 424;
const sy = (v: number) => 264 - (v / 0.7) * 252;
const FRONTIER = SWEEP.map(
  (p, i) => `${i ? "L" : "M"}${sx(p.ixt).toFixed(1)},${sy(p.ity).toFixed(1)}`,
).join(" ");

const PRESETS = [
  { label: "collapse", beta: 0.5 },
  { label: "the knee", beta: 4 },
  { label: "copy", beta: 15 },
] as const;

export default function InformationPlane() {
  const [beta, setBeta] = useState<number>(PRESETS[1].beta); // D3: start at the knee
  const idx = Math.min(SWEEP.length - 1, Math.max(0, Math.round(beta / BETA_STEP)));
  const { ixt, ity } = SWEEP[idx];
  const active = PRESETS.findIndex((p) => p.beta === beta);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => setBeta(PRESETS[i].beta)}
      />
      <Slider
        label="β — price of a relevant bit, in bits of rate"
        value={beta}
        min={0}
        max={BETA_MAX}
        step={BETA_STEP}
        onChange={setBeta}
        display={`β = ${beta.toFixed(2)}`}
        ariaLabel="Trade-off parameter beta"
      />
      <Readout>
        I(X;T) = <strong>{ixt.toFixed(3)} bits</strong> · I(T;Y) ={" "}
        <strong>{ity.toFixed(3)} bits</strong> of the {IXY.toFixed(3)}-bit
        ceiling
      </Readout>
      <svg
        viewBox="0 0 480 300"
        className="mt-3 w-full"
        role="img"
        aria-label={`Information plane at beta ${beta.toFixed(2)}: rate ${ixt.toFixed(3)} bits, relevance ${ity.toFixed(3)} bits`}
      >
        {/* axes with ticks */}
        <line x1={sx(0)} y1={sy(0)} x2={sx(2.2)} y2={sy(0)} stroke="currentColor" />
        <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(0.7)} stroke="currentColor" />
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <g key={`x${v}`}>
            <line x1={sx(v)} y1={sy(0)} x2={sx(v)} y2={sy(0) + 4} stroke="currentColor" />
            <text x={sx(v)} y={sy(0) + 17} fontSize="11" fill="currentColor" textAnchor="middle">
              {v}
            </text>
          </g>
        ))}
        {[0.2, 0.4, 0.6].map((v) => (
          <g key={`y${v}`}>
            <line x1={sx(0) - 4} y1={sy(v)} x2={sx(0)} y2={sy(v)} stroke="currentColor" />
            <text x={sx(0) - 8} y={sy(v) + 4} fontSize="11" fill="currentColor" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <text x={sx(2.2)} y={sy(0) + 32} fontSize="12" fill="currentColor" textAnchor="end">
          rate I(X;T) bits
        </text>
        <text x={sx(0) + 6} y={sy(0.7) + 4} fontSize="12" fill="currentColor">
          relevance I(T;Y) bits
        </text>
        {/* DPI bounds */}
        <line x1={sx(0)} y1={sy(0)} x2={sx(0.7)} y2={sy(0.7)} stroke="currentColor" strokeDasharray="4 4" opacity="0.45" />
        <text x={sx(0.72)} y={sy(0.66)} fontSize="11" fill="currentColor" opacity="0.7">
          I(T;Y) ≤ I(X;T)
        </text>
        <line x1={sx(0)} y1={sy(IXY)} x2={sx(2.2)} y2={sy(IXY)} stroke="currentColor" strokeDasharray="4 4" opacity="0.45" />
        <text x={sx(2.15)} y={sy(IXY) - 6} fontSize="11" fill="currentColor" opacity="0.7" textAnchor="end">
          ceiling I(X;Y) = 0.594
        </text>
        {/* frontier and reference encoders */}
        <path d={FRONTIER} fill="none" stroke={ACCENT} strokeWidth="2" />
        <circle cx={sx(1)} cy={sy(0.456)} r="3.5" fill="currentColor" opacity="0.55" />
        <text x={sx(1) + 7} y={sy(0.456) + 12} fontSize="11" fill="currentColor" opacity="0.7">
          ab|cd (1, 0.456)
        </text>
        <circle cx={sx(2)} cy={sy(IXY)} r="3.5" fill="currentColor" opacity="0.55" />
        <text x={sx(2)} y={sy(IXY) + 16} fontSize="11" fill="currentColor" opacity="0.7" textAnchor="middle">
          T = X
        </text>
        {/* current operating point with drop lines */}
        <line x1={sx(ixt)} y1={sy(ity)} x2={sx(ixt)} y2={sy(0)} stroke={ACCENT} strokeDasharray="2 3" opacity="0.6" />
        <line x1={sx(0)} y1={sy(ity)} x2={sx(ixt)} y2={sy(ity)} stroke={ACCENT} strokeDasharray="2 3" opacity="0.6" />
        <circle cx={sx(ixt)} cy={sy(ity)} r="6" fill={ACCENT} />
      </svg>
    </Panel>
  );
}
