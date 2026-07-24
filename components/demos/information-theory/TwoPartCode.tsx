"use client";

/**
 * TwoPartCode — MDL model selection on one fixed noisy dataset (Grünwald
 * §1.2 picture). Slider picks the polynomial degree k; the demo least-squares
 * fits it, prices the hypothesis at 8 bits per coefficient and the data at
 * L(D|H) = n·log2(1/δ) + (n/2)·log2(2πe·σ̂²) bits (recording precision
 * δ = 1/16, clamped at 0 once residuals drop below δ), and traces the
 * U-shaped total. Guided task: sweep k up from 0, find the bottom at k = 2,
 * then push to k = 9 and watch L(D|H) pin at zero while the total climbs
 * past the k = 0 underfit.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a"; // model / L(H)
const BLUE = "#4c8dd6"; // fit / L(D|H)
const XS = Array.from({ length: 10 }, (_, i) => 0.5 + i);
// fixed record: 0.08x² − 1.2x + 7 plus noise, rounded to δ = 1/16
const YS = [6.8125, 5.4375, 4.9375, 4.0625, 3.375, 2.625, 2.75, 2.75, 3.125, 2.9375];
const N = 10;
const COEF_BITS = 8;
const CONST_BITS = N * 4; // n·log2(1/δ), δ = 1/16

/** Least-squares degree-k fit via normal equations on u = (x−5)/4.5. */
function fitDegree(k: number) {
  const m = k + 1;
  const A = Array.from({ length: m }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i < N; i++) {
    const pw = [1];
    for (let j = 1; j < m; j++) pw.push(pw[j - 1] * ((XS[i] - 5) / 4.5));
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) A[r][c] += pw[r] * pw[c];
      A[r][m] += pw[r] * YS[i];
    }
  }
  for (let c = 0; c < m; c++) {
    let p = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < m; r++)
      if (r !== c) {
        const t = A[r][c] / A[c][c];
        for (let j = c; j <= m; j++) A[r][j] -= t * A[c][j];
      }
  }
  const coef = A.map((row, i) => row[m] / A[i][i]);
  const predict = (x: number) =>
    coef.reduceRight((acc, c) => acc * ((x - 5) / 4.5) + c, 0);
  const mse = XS.reduce((s, x, i) => s + (YS[i] - predict(x)) ** 2, 0) / N;
  const lh = COEF_BITS * (k + 1);
  const ld = Math.max(0, CONST_BITS + (N / 2) * Math.log2(2 * Math.PI * Math.E * mse));
  return { predict, lh, ld, total: lh + ld };
}

// dataset is fixed, so every degree is priced once at module load
const RES = Array.from({ length: 10 }, (_, k) => fitDegree(k));
const BEST = RES.reduce((b, r, k) => (r.total < RES[b].total ? k : b), 0);

const PRESETS = [
  { label: "Underfit (k = 0)", k: 0 },
  { label: `Sweet spot (k = ${BEST})`, k: BEST },
  { label: "Interpolation (k = 9)", k: 9 },
];

// scatter panel geometry (y data spans ~2.6–6.9)
const sx = (x: number) => 30 + (x / 10) * 195;
const sy = (y: number) => 160 - (y / 8) * 148;
// bits-vs-k panel geometry
const bx = (k: number) => 292 + (k / 9) * 168;
const by = (bits: number) => 160 - (Math.min(bits, 100) / 100) * 148;

export default function TwoPartCode() {
  // D3: open on the underfit preset — flat line, long residual sticks, big blue bar
  const [k, setK] = useState(0);
  const { predict, lh, ld, total } = RES[k];
  const active = PRESETS.findIndex((p) => p.k === k);

  const curve = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * 10;
    return `${sx(x).toFixed(1)},${sy(predict(x)).toFixed(1)}`;
  }).join(" ");
  const path = (f: (r: (typeof RES)[number]) => number) =>
    RES.map((r, j) => `${bx(j).toFixed(1)},${by(f(r)).toFixed(1)}`).join(" ");

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => setK(PRESETS[i].k)}
      />
      <Slider
        label="polynomial degree k"
        value={k}
        min={0}
        max={9}
        step={1}
        onChange={setK}
        display={`k = ${k}`}
        ariaLabel="Polynomial degree k"
      />
      <Readout>
        <span className="grid gap-0.5">
          <span style={{ color: AMBER }}>
            L(H) = {COEF_BITS} bits × {k + 1} coefficient{k > 0 ? "s" : ""} ={" "}
            <strong>{lh} bits</strong>
          </span>
          <span style={{ color: BLUE }}>
            L(D | H) = <strong>{ld.toFixed(1)} bits</strong>
            {ld === 0 && " — residuals below the recording precision"}
          </span>
          <span>
            total = <strong>{total.toFixed(1)} bits</strong>
            {k === BEST && (
              <span className="pl-2 font-medium text-accent">minimum — the MDL choice</span>
            )}
          </span>
        </span>
      </Readout>

      <svg
        viewBox="0 0 480 196"
        className="mt-3 w-full select-none"
        role="img"
        aria-label={`Degree-${k} polynomial fit to the fixed 10-point dataset; model cost ${lh} bits, fit cost ${ld.toFixed(1)} bits, total ${total.toFixed(1)} bits; the total over all degrees is U-shaped with its minimum at degree ${BEST}`}
      >
        <clipPath id="tpc-clip">
          <rect x="30" y="8" width="195" height="152" />
        </clipPath>
        {/* left: data, candidate curve, residuals */}
        <line x1="30" y1="160" x2="225" y2="160" stroke="currentColor" opacity="0.5" />
        <line x1="30" y1="12" x2="30" y2="160" stroke="currentColor" opacity="0.5" />
        {[0, 5, 10].map((v) => (
          <text key={`x${v}`} x={sx(v)} y="174" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">
            {v}
          </text>
        ))}
        {[0, 4, 8].map((v) => (
          <text key={`y${v}`} x="24" y={sy(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">
            {v}
          </text>
        ))}
        <text x="128" y="190" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">
          the fixed dataset, degree-{k} candidate
        </text>
        {XS.map((x, i) => (
          <line key={`r${x}`} x1={sx(x)} y1={sy(YS[i])} x2={sx(x)} y2={sy(Math.max(0, Math.min(8, predict(x))))} stroke={BLUE} strokeWidth="1.5" opacity="0.8" />
        ))}
        <polyline points={curve} fill="none" stroke={AMBER} strokeWidth="2" clipPath="url(#tpc-clip)" />
        {XS.map((x, i) => (
          <circle key={`p${x}`} cx={sx(x)} cy={sy(YS[i])} r="3" fill="currentColor" />
        ))}
        {/* right: L(H), L(D|H), and the U-shaped total vs degree */}
        <line x1="292" y1="160" x2="460" y2="160" stroke="currentColor" opacity="0.5" />
        <line x1="292" y1="12" x2="292" y2="160" stroke="currentColor" opacity="0.5" />
        {[0, 50, 100].map((b) => (
          <text key={`b${b}`} x="286" y={by(b) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">
            {b}
          </text>
        ))}
        {RES.map((_, j) => (
          <text key={`k${j}`} x={bx(j)} y="174" textAnchor="middle" fontSize="10" fill="currentColor" opacity={j === k ? 1 : 0.6} fontWeight={j === k ? "bold" : "normal"}>
            {j}
          </text>
        ))}
        <text x="376" y="190" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">
          bits vs degree k
        </text>
        <polyline points={path((r) => r.lh)} fill="none" stroke={AMBER} strokeWidth="1.5" opacity="0.8" />
        <polyline points={path((r) => r.ld)} fill="none" stroke={BLUE} strokeWidth="1.5" opacity="0.8" />
        <polyline points={path((r) => r.total)} fill="none" stroke="currentColor" strokeWidth="2.5" />
        <text x={bx(1.4)} y={by(RES[1].lh) - 6} fontSize="10" fill={AMBER}>L(H)</text>
        <text x={bx(5.6)} y={by(RES[6].ld) + 14} fontSize="10" fill={BLUE}>L(D|H)</text>
        <text x={bx(6.2)} y={by(RES[7].total) - 8} fontSize="10" fontWeight="bold" fill="currentColor">total</text>
        <line x1={bx(k)} y1="12" x2={bx(k)} y2="160" stroke="currentColor" opacity="0.25" strokeDasharray="3 3" />
        <circle cx={bx(k)} cy={by(total)} r="4.5" fill="currentColor" />
      </svg>
    </Panel>
  );
}
