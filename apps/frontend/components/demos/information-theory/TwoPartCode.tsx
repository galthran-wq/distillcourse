"use client";

/**
 * TwoPartCode — MDL model selection on a noisy polynomial record (Grünwald
 * §1.2 picture). Controls: record length n (10 / 25 / 60 points) and degree k.
 * Every (n, k) pair is least-squares fitted client-side, the hypothesis priced
 * at 8 bits per coefficient and the data at L(D|H) = n·log2(1/δ) +
 * (n/2)·log2(2πe·σ̂²) bits (δ = 1/16, clamped at 0 below that precision).
 * Task: sweep k at n = 10 (bottom at k = 2), push to k = 9 and watch L(D|H)
 * pin at zero while the total passes the underfit, then enlarge the record —
 * the minimum moves to k = 3 at n = 25 and k = 4 at n = 60.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a"; // model / L(H)
const BLUE = "#4c8dd6"; // fit / L(D|H)
const COEF_BITS = 8;
const DELTA_BITS = 4; // log2(1/δ) per point, δ = 1/16
const SIZES = [10, 25, 60];

/** One source, three record lengths: y = 3 − 1.8u + 1.62u² + 0.8u³ + 1.4u⁴
 *  in u = (x−5)/4.5, plus deterministic noise (σ = 0.28), rounded to 1/16. */
function record(n: number) {
  const xs = Array.from({ length: n }, (_, i) => 0.5 + (9 * i) / (n - 1));
  const ys = xs.map((x, i) => {
    const u = (x - 5) / 4.5;
    const s = Math.sin((i + 1) * 23.77) * 43758.5453;
    const t = 3 - 1.8 * u + 1.62 * u * u + 0.8 * u ** 3 + 1.4 * u ** 4;
    return Math.round((t + 0.28 * (2 * (s - Math.floor(s)) - 1)) * 16) / 16;
  });
  return { xs, ys };
}

/** Least-squares degree-k fit via normal equations on u = (x−5)/4.5. */
function fitDegree(xs: number[], ys: number[], k: number) {
  const n = xs.length;
  const m = k + 1;
  const A = Array.from({ length: m }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i < n; i++) {
    const pw = [1];
    for (let j = 1; j < m; j++) pw.push(pw[j - 1] * ((xs[i] - 5) / 4.5));
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < m; c++) A[r][c] += pw[r] * pw[c];
      A[r][m] += pw[r] * ys[i];
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
  const mse = xs.reduce((s, x, i) => s + (ys[i] - predict(x)) ** 2, 0) / n;
  const lh = COEF_BITS * (k + 1);
  const ld = Math.max(0, n * DELTA_BITS + (n / 2) * Math.log2(2 * Math.PI * Math.E * mse));
  return { predict, lh, ld, total: lh + ld };
}

// records are fixed, so every (n, k) pair is priced once at module load
const RECORDS = SIZES.map((n) => {
  const { xs, ys } = record(n);
  const res = Array.from({ length: 10 }, (_, k) => fitDegree(xs, ys, k));
  const best = res.reduce((b, r, k) => (r.total < res[b].total ? k : b), 0);
  const axisMax = Math.ceil(Math.max(...res.map((r) => r.total)) / 50) * 50;
  return { n, xs, ys, res, best, axisMax };
});

// scatter panel geometry (y data spans ~2.4–6.9)
const sx = (x: number) => 30 + (x / 10) * 195;
const sy = (y: number) => 160 - (y / 8) * 148;
// bits-vs-k panel geometry
const bx = (k: number) => 292 + (k / 9) * 168;

export default function TwoPartCode() {
  // D3: open on the 10-point record at the underfit — flat line, big blue bar
  const [si, setSi] = useState(0);
  const [k, setK] = useState(0);
  const rec = RECORDS[si];
  const { predict, lh, ld, total } = rec.res[k];
  const by = (bits: number) => 160 - (Math.min(bits, rec.axisMax) / rec.axisMax) * 148;

  const presets = [
    { label: "Underfit (k = 0)", k: 0 },
    { label: `Sweet spot (k = ${rec.best})`, k: rec.best },
    { label: rec.n === 10 ? "Interpolation (k = 9)" : "Overfit (k = 9)", k: 9 },
  ];
  const active = presets.findIndex((p) => p.k === k);

  const curve = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * 10;
    return `${sx(x).toFixed(1)},${sy(predict(x)).toFixed(1)}`;
  }).join(" ");
  const path = (f: (r: (typeof rec.res)[number]) => number) =>
    rec.res.map((r, j) => `${bx(j).toFixed(1)},${by(f(r)).toFixed(1)}`).join(" ");

  return (
    <Panel>
      <PresetGroup labels={SIZES.map((n) => `Record: n = ${n} points`)} activeIndex={si} onSelect={setSi} />
      <PresetGroup
        labels={presets.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => setK(presets[i].k)}
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
            total = <strong>{total.toFixed(1)} bits</strong> over {rec.n} points
            {k === rec.best && (
              <span className="pl-2 font-medium text-accent">minimum — the MDL choice</span>
            )}
          </span>
        </span>
      </Readout>

      <svg
        viewBox="0 0 480 196"
        className="mt-3 w-full select-none"
        role="img"
        aria-label={`Degree-${k} polynomial fit to the ${rec.n}-point record; model cost ${lh} bits, fit cost ${ld.toFixed(1)} bits, total ${total.toFixed(1)} bits; the total over all degrees is U-shaped with its minimum at degree ${rec.best}`}
      >
        <clipPath id="tpc-clip"><rect x="30" y="8" width="195" height="152" /></clipPath>
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
          the {rec.n}-point record, degree-{k} candidate
        </text>
        {rec.xs.map((x, i) => (
          <line key={`r${i}`} x1={sx(x)} y1={sy(rec.ys[i])} x2={sx(x)} y2={sy(Math.max(0, Math.min(8, predict(x))))} stroke={BLUE} strokeWidth={rec.n > 25 ? 0.9 : 1.5} opacity="0.8" />
        ))}
        <polyline points={curve} fill="none" stroke={AMBER} strokeWidth="2" clipPath="url(#tpc-clip)" />
        {rec.xs.map((x, i) => (
          <circle key={`p${i}`} cx={sx(x)} cy={sy(rec.ys[i])} r={rec.n > 25 ? 1.6 : 3} fill="currentColor" />
        ))}
        {/* right: L(H), L(D|H), and the U-shaped total vs degree */}
        <line x1="292" y1="160" x2="460" y2="160" stroke="currentColor" opacity="0.5" />
        <line x1="292" y1="12" x2="292" y2="160" stroke="currentColor" opacity="0.5" />
        {[0, rec.axisMax / 2, rec.axisMax].map((b) => (
          <text key={`b${b}`} x="286" y={by(b) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">
            {b}
          </text>
        ))}
        {rec.res.map((_, j) => (
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
        <text x={bx(1.4)} y={by(rec.res[1].lh) - 6} fontSize="10" fill={AMBER}>L(H)</text>
        <text x={bx(5.6)} y={by(rec.res[6].ld) + 14} fontSize="10" fill={BLUE}>L(D|H)</text>
        <text x={bx(6.2)} y={by(rec.res[7].total) - 8} fontSize="10" fontWeight="bold" fill="currentColor">total</text>
        <line x1={bx(k)} y1="12" x2={bx(k)} y2="160" stroke="currentColor" opacity="0.25" strokeDasharray="3 3" />
        <circle cx={bx(k)} cy={by(total)} r="4.5" fill="currentColor" />
      </svg>
    </Panel>
  );
}
