"use client";

/**
 * KMeansStepper — Lloyd's algorithm one half-step at a time on fixed 2D
 * datasets with k = 3. The step button alternates the assignment step
 * (points recolor to their nearest center) and the update step (each
 * center jumps to its cluster mean); the distortion readout J falls
 * monotonically, per half-step, until an assignment changes nothing.
 * Reseed re-draws random initial centers on the SAME data, so final J
 * values are comparable across runs — different local optima show up as
 * different final J (guided task in the lesson: reseed ten times on the
 * well-separated preset and record the spread of final J).
 */
import { useState } from "react";
import { Panel, PresetGroup, Button, Readout } from "@/components/ui";

const COLORS = ["#e2903a", "#4c8dd6", "#4caf7d"];
const K = 3;
const W = 340;
const H = 300;
// data live in [0,10] x [0,8]
const px = (x: number) => (x / 10) * W;
const py = (y: number) => H - (y / 8) * H;

type Pt = readonly [number, number];

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

function blob(rng: () => number, cx: number, cy: number, sd: number, n: number): Pt[] {
  return Array.from({ length: n }, () => [
    cl(cx + sd * gauss(rng), 0.2, 9.8),
    cl(cy + sd * gauss(rng), 0.2, 7.8),
  ] as const);
}

/** Fixed, seeded datasets — every visitor sees the same points. */
const PRESETS: { label: string; pts: Pt[] }[] = [
  {
    label: "well-separated blobs",
    pts: (() => {
      const r = mulberry32(11);
      return [...blob(r, 2, 2, 0.7, 20), ...blob(r, 7.5, 2.2, 0.7, 20), ...blob(r, 4.8, 6.3, 0.7, 20)];
    })(),
  },
  {
    label: "elongated clusters",
    pts: (() => {
      const r = mulberry32(7);
      return [1.6, 4, 6.4].flatMap((y) =>
        Array.from({ length: 22 }, () => [0.4 + 9.2 * r(), cl(y + 0.28 * gauss(r), 0.2, 7.8)] as const),
      );
    })(),
  },
  {
    label: "mouse-shaped data",
    pts: (() => {
      const r = mulberry32(23);
      return [...blob(r, 5, 3.1, 1.25, 40), ...blob(r, 2.3, 6.5, 0.42, 11), ...blob(r, 7.7, 6.5, 0.42, 11)];
    })(),
  },
];

const d2 = (p: Pt, c: Pt) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
const assign = (pts: Pt[], centers: Pt[]) =>
  pts.map((p) => centers.reduce((best, c, j) => (d2(p, c) < d2(p, centers[best]) ? j : best), 0));
const distortion = (pts: Pt[], labels: number[], centers: Pt[]) =>
  pts.reduce((s, p, i) => s + d2(p, centers[labels[i]]), 0);

type State = {
  centers: Pt[];
  labels: number[];
  next: "assign" | "update";
  steps: number;
  converged: boolean;
  j: number;
  prevJ: number | null;
};

/** Random init: k distinct data points as centers, first assignment applied. */
function init(pts: Pt[], seed: number): State {
  const rng = mulberry32(seed * 1013 + 17);
  const idx: number[] = [];
  while (idx.length < K) {
    const i = Math.floor(rng() * pts.length);
    if (!idx.includes(i)) idx.push(i);
  }
  const centers = idx.map((i) => pts[i]);
  const labels = assign(pts, centers);
  return { centers, labels, next: "update", steps: 0, converged: false, j: distortion(pts, labels, centers), prevJ: null };
}

function halfStep(s: State, pts: Pt[]): State {
  if (s.converged) return s;
  if (s.next === "update") {
    const centers = s.centers.map((c, jc) => {
      const mine = pts.filter((_, i) => s.labels[i] === jc);
      if (mine.length === 0) return c; // empty cluster keeps its center
      return [mine.reduce((a, p) => a + p[0], 0) / mine.length, mine.reduce((a, p) => a + p[1], 0) / mine.length] as const;
    });
    return { ...s, centers, next: "assign", steps: s.steps + 1, prevJ: s.j, j: distortion(pts, s.labels, centers) };
  }
  const labels = assign(pts, s.centers);
  const converged = labels.every((l, i) => l === s.labels[i]);
  return { ...s, labels, converged, next: "update", steps: s.steps + 1, prevJ: s.j, j: distortion(pts, labels, s.centers) };
}

export default function KMeansStepper() {
  // D3: open on the well-separated preset with the first assignment already
  // colored — the screenshot alone shows a mid-descent state, never a blank.
  const [preset, setPreset] = useState(0);
  const [seed, setSeed] = useState(1);
  const [s, setS] = useState(() => init(PRESETS[0].pts, 1));
  const pts = PRESETS[preset].pts;

  const runToEnd = () => {
    let cur = s;
    for (let i = 0; i < 400 && !cur.converged; i++) cur = halfStep(cur, pts);
    setS(cur);
  };
  const delta = s.prevJ === null ? null : s.j - s.prevJ;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={preset}
        onSelect={(i) => {
          setPreset(i);
          setS(init(PRESETS[i].pts, seed));
        }}
      />
      <div className="flex flex-wrap gap-2 pb-1">
        <Button onClick={() => setS(halfStep(s, pts))} disabled={s.converged} className="disabled:opacity-50">
          {s.next === "assign" ? "step: assign points" : "step: move centers"}
        </Button>
        <Button onClick={runToEnd} disabled={s.converged} className="disabled:opacity-50">
          run to convergence
        </Button>
        <Button
          onClick={() => {
            setSeed(seed + 1);
            setS(init(pts, seed + 1));
          }}
        >
          reseed
        </Button>
      </div>
      <Readout>
        J = <strong>{s.j.toFixed(1)}</strong>
        {delta !== null && <> (Δ {delta === 0 ? "0" : delta.toFixed(1)})</>} · half-steps: {s.steps}
        {s.converged ? " · converged — reseed for another local optimum" : ""}
      </Readout>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-2 block w-full max-w-90 select-none"
        role="img"
        aria-label={`k-means state after ${s.steps} half-steps: distortion J = ${s.j.toFixed(1)}${s.converged ? ", converged" : ""}`}
      >
        {pts.map((p, i) => (
          <circle key={i} cx={px(p[0])} cy={py(p[1])} r="3.5" fill={COLORS[s.labels[i]]} opacity="0.85" />
        ))}
        {s.centers.map((c, j) => (
          <path
            key={j}
            d={`M ${px(c[0])} ${py(c[1]) - 8} L ${px(c[0]) + 8} ${py(c[1])} L ${px(c[0])} ${py(c[1]) + 8} L ${px(c[0]) - 8} ${py(c[1])} Z`}
            fill={COLORS[j]}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}
        <text x="8" y="16" fontSize="10" fill="currentColor" opacity="0.65">
          diamonds = centers · dots colored by current assignment
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
