"use client";

/**
 * InfoNCESaturation — the InfoNCE bound live. Toy pair: X uniform on 1024
 * symbols, Y = X with the chosen match probability, else uniform on the rest.
 * The optimal (exact-ratio) critic's contrastive loss L_N is enumerated
 * exactly, and the certificate log₂N − L_N is plotted against the true
 * I(X;Y), clipping at the log₂N ceiling. Guided task (lesson): load the
 * strong-dependence/small-N preset, raise N (ceiling lifts one bit per
 * doubling), then lower the dependence to find the tracking regime.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const K = 1024; // alphabet size; max I = log2 K = 10 bits
const LOG2K = 10;
const PRESETS = [
  { label: "Weak dependence", s: 0.3, exp: 4 },
  { label: "Strong dependence, small N", s: 0.95, exp: 2 },
  { label: "Strong dependence, large N", s: 0.95, exp: 10 },
];

const AMBER = "#e2903a";
const VW = 480;
const VH = 300;
const PX = 52;
const PW = 400;
const PY = 18;
const PH = 224;
const BOTTOM = PY + PH;

// match probability m = P(Y = X) from dependence strength s in [0, 1]
const matchProb = (s: number) => 1 / K + s * (1 - 1 / K);

// I(X;Y) = m log2(mK) + (1−m) log2((1−m)K/(K−1)), with 0 log 0 = 0
function trueI(m: number): number {
  const t = (p: number, w: number) => (p > 1e-15 ? p * Math.log2(p / w) : 0);
  return t(m, 1 / K) + t(1 - m, (K - 1) / K);
}

// Exact InfoNCE loss of the optimal critic r = p(y|x)/p(y): enumerate the
// number k of negatives (of N−1, each uniform on K) that collide with x.
function lossN(m: number, N: number): number {
  const rMatch = K * m;
  const rMis = (K * (1 - m)) / (K - 1);
  const q = 1 / K;
  let pmf = Math.pow(1 - q, N - 1); // Bin(N−1, 1/K) at k = 0
  let loss = 0;
  for (let k = 0; k <= N - 1; k++) {
    const rest = k * rMatch + (N - 1 - k) * rMis;
    if (m > 0) loss += m * pmf * Math.log2((rMatch + rest) / rMatch);
    if (m < 1) loss += (1 - m) * pmf * Math.log2((rMis + rest) / rMis);
    if (pmf < 1e-13 && k > (N - 1) * q) break;
    pmf *= ((N - 1 - k) / (k + 1)) * (q / (1 - q));
  }
  return loss;
}

const xOf = (bits: number) => PX + (bits / LOG2K) * PW;
const yOf = (bits: number) => BOTTOM - (Math.max(0, bits) / LOG2K) * PH;
const TICKS = [0, 2, 4, 6, 8, 10];

export default function InfoNCESaturation() {
  // D3: open on the weak-dependence preset — the bound visibly tracking I.
  const [s, setS] = useState(PRESETS[0].s);
  const [exp, setExp] = useState(PRESETS[0].exp);

  const N = 2 ** exp;
  const m = matchProb(s);
  const I = trueI(m);
  const L = lossN(m, N);
  const bound = exp - L;
  const saturated = I > exp;

  const activePreset = PRESETS.findIndex((p) => p.s === s && p.exp === exp);

  // certificate-vs-I curve for the current N, dependence swept 0 → 1
  const pts = Array.from({ length: 81 }, (_, i) => {
    const mi = matchProb(i / 80);
    return `${xOf(trueI(mi)).toFixed(1)},${yOf(exp - lossN(mi, N)).toFixed(1)}`;
  }).join(" ");

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setS(PRESETS[i].s);
          setExp(PRESETS[i].exp);
        }}
      />

      <Slider
        label="candidate count N (one positive, N − 1 negatives)"
        value={exp}
        min={1}
        max={10}
        step={1}
        onChange={setExp}
        display={`N = ${N}`}
        ariaLabel="Candidate count N as a power of two"
      />
      <Slider
        label="dependence strength (P(Y = X) on the 1024-symbol toy pair)"
        value={s}
        min={0}
        max={1}
        step={0.01}
        onChange={setS}
        display={s.toFixed(2)}
        ariaLabel="Dependence strength between X and Y"
      />

      <Readout>
        true I(X;Y) = <strong>{I.toFixed(2)} bits</strong> · L
        <sub>{N}</sub> = {L.toFixed(2)} bits · certified log₂N − L
        <sub>{N}</sub> = <strong>{bound.toFixed(2)} bits</strong>
        {saturated && (
          <span className="pl-2 font-medium text-accent">
            saturated: I exceeds the log₂ N = {exp} bit ceiling
          </span>
        )}
      </Readout>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full select-none"
        role="img"
        aria-label={`InfoNCE certificate versus true mutual information for N = ${N}: the curve clips at the ceiling of ${exp} bits; at true I ${I.toFixed(2)} bits the certificate is ${bound.toFixed(2)} bits`}
      >
        <line x1={PX} y1={BOTTOM} x2={PX + PW} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        <line x1={PX} y1={PY} x2={PX} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        {TICKS.map((b) => (
          <g key={b}>
            <text x={PX - 8} y={yOf(b) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
              {b}
            </text>
            <text x={xOf(b)} y={BOTTOM + 15} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {b}
            </text>
          </g>
        ))}
        <text x={PX - 30} y={PY + PH / 2} fontSize="11" fill="currentColor" opacity="0.7" transform={`rotate(-90 ${PX - 30} ${PY + PH / 2})`} textAnchor="middle">
          certified log₂N − L_N, bits
        </text>
        <text x={PX + PW / 2} y={BOTTOM + 31} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
          true mutual information I(X;Y), bits
        </text>

        {/* perfect-certification diagonal and the log2 N ceiling */}
        <line x1={xOf(0)} y1={yOf(0)} x2={xOf(LOG2K)} y2={yOf(LOG2K)} stroke="currentColor" opacity="0.35" strokeDasharray="4 4" />
        <text x={xOf(5.4)} y={yOf(5.4) - 7} fontSize="11" fill="currentColor" opacity="0.7" textAnchor="middle" transform={`rotate(-29.3 ${xOf(5.4)} ${yOf(5.4) - 7})`}>
          bound = I
        </text>
        <line x1={PX} y1={yOf(exp)} x2={PX + PW} y2={yOf(exp)} stroke="currentColor" opacity="0.35" strokeDasharray="4 4" />
        <text x={PX + PW - 4} y={yOf(exp) - 5} fontSize="11" fill="currentColor" opacity="0.7" textAnchor="end">
          ceiling log₂ {N} = {exp}
        </text>

        {/* guides to the operating point, then the curve on top */}
        <line x1={xOf(I)} y1={BOTTOM} x2={xOf(I)} y2={yOf(bound)} stroke="currentColor" opacity="0.4" strokeDasharray="3 3" />
        <polyline points={pts} fill="none" stroke={AMBER} strokeWidth="2.5" />
        <circle cx={xOf(I)} cy={yOf(bound)} r="4.5" fill={AMBER} />
        <text x={Math.min(xOf(I) + 9, PX + PW - 88)} y={Math.min(yOf(bound) + 16, BOTTOM - 6)} fontSize="12" fontWeight="bold" fill={AMBER}>
          bound = {bound.toFixed(2)}
        </text>
      </svg>
    </Panel>
  );
}
