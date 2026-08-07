"use client";

/**
 * EmStepper — EM for a two-component full-covariance GMM, one half-step
 * at a time, on fixed Old-Faithful-style 2D data (two elongated
 * correlated clusters). The step button alternates the E-step (points
 * recolor by responsibility — boundary points hold blended colors) and
 * the M-step (ellipses move and reshape, ℓ rises); the log-likelihood
 * readout never decreases and Δ = 0 on E-steps, since only the M-step
 * changes parameters. The k-means toggle recolors the same points by
 * hard argmax assignment for comparison. Presets are initializations on
 * the same data, so final ℓ values are comparable.
 */
import { useState } from "react";
import { Panel, PresetGroup, Button, Readout } from "@/components/ui";

const COLORS = ["#e2903a", "#4c8dd6"];
const W = 350;
const H = 280;
const S = 35; // px per data unit, equal on both axes so ellipses rotate truly
const px = (x: number) => x * S;
const py = (y: number) => H - y * S;

type Pt = readonly [number, number];
type Cov = readonly [number, number, number]; // [a, b, c] = [[a, b], [b, c]]
type Params = { pi: number[]; mu: Pt[]; cov: Cov[] };

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
const cl = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Fixed, seeded dataset — every visitor sees the same 90 points. */
const PTS: Pt[] = (() => {
  const r = mulberry32(5);
  const blob = (n: number, cx: number, cy: number, sx: number, sy: number, rho: number) =>
    Array.from({ length: n }, () => {
      const g1 = gauss(r);
      const g2 = gauss(r);
      return [
        cl(cx + sx * g1, 0.3, 9.7),
        cl(cy + sy * (rho * g1 + Math.sqrt(1 - rho * rho) * g2), 0.3, 7.7),
      ] as const;
    });
  return [...blob(38, 2.6, 2.0, 0.55, 0.55, 0.6), ...blob(52, 7.1, 5.6, 0.85, 0.7, 0.6)];
})();

const PRESETS: { label: string; params: Params }[] = [
  {
    label: "wide overlap start",
    params: { pi: [0.5, 0.5], mu: [[3.6, 4.6], [6.2, 2.8]], cov: [[3, 0, 3], [3, 0, 3]] },
  },
  {
    label: "bad init: both left",
    params: { pi: [0.5, 0.5], mu: [[1.8, 1.5], [3.4, 2.7]], cov: [[0.7, 0, 0.7], [0.7, 0, 0.7]] },
  },
  {
    label: "near the fit",
    params: { pi: [0.42, 0.58], mu: [[2.6, 2.0], [7.1, 5.6]], cov: [[0.35, 0.18, 0.35], [0.75, 0.35, 0.55]] },
  },
];

function pdf(p: Pt, mu: Pt, cov: Cov): number {
  const [a, b, c] = cov;
  const det = Math.max(a * c - b * b, 1e-6);
  const dx = p[0] - mu[0];
  const dy = p[1] - mu[1];
  const q = (c * dx * dx - 2 * b * dx * dy + a * dy * dy) / det;
  return Math.exp(-q / 2) / (2 * Math.PI * Math.sqrt(det));
}

/** Responsibilities γ (for component 0) and log-likelihood of the params. */
function eStep(P: Params): { gamma: number[]; ll: number } {
  let ll = 0;
  const gamma = PTS.map((p) => {
    const w0 = P.pi[0] * pdf(p, P.mu[0], P.cov[0]);
    const w1 = P.pi[1] * pdf(p, P.mu[1], P.cov[1]);
    ll += Math.log(w0 + w1 + 1e-300);
    return w0 / (w0 + w1 + 1e-300);
  });
  return { gamma, ll };
}

/** Weighted MLE; small diagonal regularizer keeps covariances non-singular. */
function mStep(gamma: number[]): Params {
  const comps = [0, 1].map((k) => {
    const g = gamma.map((gi) => (k === 0 ? gi : 1 - gi));
    const N = Math.max(g.reduce((s, v) => s + v, 0), 1e-6);
    const mx = g.reduce((s, v, i) => s + v * PTS[i][0], 0) / N;
    const my = g.reduce((s, v, i) => s + v * PTS[i][1], 0) / N;
    let a = 0, b = 0, c = 0;
    g.forEach((v, i) => {
      const dx = PTS[i][0] - mx;
      const dy = PTS[i][1] - my;
      a += v * dx * dx;
      b += v * dx * dy;
      c += v * dy * dy;
    });
    return { pi: N / PTS.length, mu: [mx, my] as const, cov: [a / N + 0.02, b / N, c / N + 0.02] as const };
  });
  return { pi: comps.map((c) => c.pi), mu: comps.map((c) => c.mu), cov: comps.map((c) => c.cov) };
}

type State = { params: Params; gamma: number[]; ll: number; next: "M" | "E"; steps: number; converged: boolean; prevLl: number | null };

/** Initial E-step already applied: points arrive colored, soft blends visible. */
function init(i: number): State {
  const params = PRESETS[i].params;
  const { gamma, ll } = eStep(params);
  return { params, gamma, ll, next: "M", steps: 0, converged: false, prevLl: null };
}

function halfStep(s: State): State {
  if (s.converged) return s;
  if (s.next === "M") {
    const params = mStep(s.gamma);
    const e = eStep(params); // e.ll = ℓ(θ_new)
    if (e.ll - s.ll < 1e-3) {
      // Converged: near the fixed point the regularized update stops
      // improving ℓ (the +0.02 regularizer perturbs the exact maximizer),
      // so freeze at the current state — the readout stays monotone.
      return { ...s, converged: true, steps: s.steps + 1, prevLl: s.ll };
    }
    return { params, gamma: s.gamma, ll: e.ll, next: "E", steps: s.steps + 1, converged: false, prevLl: s.ll };
  }
  const e = eStep(s.params); // params unchanged, so Δℓ = 0 on E-steps
  return { ...s, gamma: e.gamma, ll: e.ll, next: "M", steps: s.steps + 1, prevLl: s.ll };
}

/** Blend the two component colors by responsibility for component 0. */
function mix(g: number): string {
  const c0 = [226, 144, 58];
  const c1 = [76, 141, 214];
  const c = c0.map((v, i) => Math.round(v * g + c1[i] * (1 - g)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** 1σ ellipse of a 2×2 covariance: eigen radii + data-space angle (deg). */
function ellipse(cov: Cov): { rx: number; ry: number; deg: number } {
  const [a, b, c] = cov;
  const t = (a + c) / 2;
  const d = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const l1 = t + d;
  const l2 = Math.max(t - d, 1e-4);
  return { rx: Math.sqrt(l1) * S, ry: Math.sqrt(l2) * S, deg: (Math.atan2(l1 - a, b) * 180) / Math.PI };
}

export default function EmStepper() {
  const [preset, setPreset] = useState(0);
  const [hard, setHard] = useState(false);
  const [s, setS] = useState(() => init(0));

  const runToEnd = () => {
    let cur = s;
    for (let i = 0; i < 600 && !cur.converged; i++) cur = halfStep(cur);
    setS(cur);
  };
  const delta = s.prevLl === null ? null : s.ll - s.prevLl;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={s.steps === 0 ? preset : null}
        onSelect={(i) => {
          setPreset(i);
          setS(init(i));
        }}
      />
      <div className="flex flex-wrap gap-2 pb-1">
        <Button onClick={() => setS(halfStep(s))} disabled={s.converged} className="disabled:opacity-50">
          {s.next === "M" ? "step: M — move ellipses" : "step: E — recolor points"}
        </Button>
        <Button onClick={runToEnd} disabled={s.converged} className="disabled:opacity-50">
          run to convergence
        </Button>
        <Button active={hard} onClick={() => setHard(!hard)}>
          k-means hard colors
        </Button>
      </div>
      <Readout>
        ℓ = <strong>{s.ll.toFixed(2)}</strong>
        {delta !== null && <> (Δ {delta < 5e-3 ? "0" : `+${delta.toFixed(2)}`})</>} · half-steps: {s.steps}
        {s.converged ? " · converged — try another start" : ""}
      </Readout>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-2 block w-full max-w-90 select-none"
        role="img"
        aria-label={`EM state after ${s.steps} half-steps: log-likelihood ${s.ll.toFixed(2)}${s.converged ? ", converged" : ""}`}
      >
        {PTS.map((p, i) => (
          <circle
            key={i}
            cx={px(p[0])}
            cy={py(p[1])}
            r="3.5"
            fill={hard ? COLORS[s.gamma[i] >= 0.5 ? 0 : 1] : mix(s.gamma[i])}
            opacity="0.85"
          />
        ))}
        {[0, 1].map((k) => {
          const e = ellipse(s.params.cov[k]);
          const cx = px(s.params.mu[k][0]);
          const cy = py(s.params.mu[k][1]);
          return (
            <g key={k} transform={`rotate(${-e.deg} ${cx} ${cy})`}>
              <ellipse cx={cx} cy={cy} rx={e.rx} ry={e.ry} fill="none" stroke={COLORS[k]} strokeWidth="2" />
              <ellipse cx={cx} cy={cy} rx={2 * e.rx} ry={2 * e.ry} fill="none" stroke={COLORS[k]} strokeWidth="1" strokeDasharray="4 3" opacity="0.55" />
            </g>
          );
        })}
        {[0, 1].map((k) => (
          <circle key={k} cx={px(s.params.mu[k][0])} cy={py(s.params.mu[k][1])} r="4" fill={COLORS[k]} stroke="currentColor" strokeWidth="1.5" />
        ))}
        <text x="8" y="16" fontSize="10" fill="currentColor" opacity="0.65">
          ellipses = 1σ / 2σ contours · dots colored by responsibility γ
        </text>
        <text x={W - 10} y={H - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">
          x₁
        </text>
        <text x="8" y={H - 8} fontSize="11" fill="currentColor" opacity="0.65">
          x₂
        </text>
      </svg>
    </Panel>
  );
}
