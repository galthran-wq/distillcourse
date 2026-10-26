"use client";

/**
 * IsolationSplitter — a 2-D cloud; following a point grows one random
 * isolation tree around it, cut by cut, and a counter keeps that point's
 * mean path over the trees grown. The sub-sample size ψ sets how many points
 * each tree is built on. In "Masked cluster" a forest of 100 trees reports
 * the planted cluster's mean path against the normal points': at full data
 * the cluster isolates slower than the crowd, and lowering ψ reverses it.
 */
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { Button, Panel, PresetGroup, Readout, Slider } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#3a7bd5";
const FOREST_TREES = 100;
const STEP_MS = 140;

type Pt = [number, number];
type Tree = { q: 0 | 1; v: number; l: Tree; r: Tree } | null;
interface Data { pts: Pt[]; anomaly: boolean[]; marks: { label: string; i: number }[] }

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cloud(r: () => number, n: number, cx: number, cy: number, sd: number): Pt[] {
  return Array.from({ length: n }, () => {
    const a = Math.sqrt(-2 * Math.log(1 - r()));
    const b = 2 * Math.PI * r();
    return [cx + sd * a * Math.cos(b), cy + sd * a * Math.sin(b)];
  });
}

const nearest = (pts: Pt[], x: number, y: number) =>
  pts.reduce((best, p, i) => (Math.hypot(p[0] - x, p[1] - y) < Math.hypot(pts[best][0] - x, pts[best][1] - y) ? i : best), 0);

function singleOutlier(): Data {
  const pts = [...cloud(rng(3), 134, 0, 0, 1), [3.2, 2.6] as Pt];
  const anomaly = pts.map((_, i) => i === 134);
  const edge = nearest(pts.slice(0, 134), -3, -3);
  return { pts, anomaly, marks: [{ label: "A", i: nearest(pts, 0, 0) }, { label: "B", i: edge }, { label: "C", i: 134 }] };
}

// Tuned so the forest readout reverses where the lesson says it should: the
// planted 50 isolate slower than the crowd at every ψ down to 32 and faster
// from 16 on, near N/g = 380/50 — one cluster member per sample.
function maskedCluster(): Data {
  const r = rng(7);
  const pts = [...cloud(r, 300, 0, 0, 1), ...cloud(r, 30, 1.8, 1.8, 0.45), ...cloud(r, 50, 1.8, 1.8, 0.15)];
  const anomaly = pts.map((_, i) => i >= 330);
  return { pts, anomaly, marks: [{ label: "K", i: 350 }, { label: "N", i: nearest(pts.slice(0, 300), 0, 0) }] };
}

const PRESETS = [
  { label: "Single outlier", data: singleOutlier() },
  { label: "Masked cluster", data: maskedCluster() },
];

function build(pts: Pt[], r: () => number): Tree {
  const range = (q: 0 | 1) => [Math.min(...pts.map((p) => p[q])), Math.max(...pts.map((p) => p[q]))];
  const cols = ([0, 1] as const).filter((q) => range(q)[1] > range(q)[0]);
  if (pts.length <= 1 || cols.length === 0) return null;
  const q = cols[Math.floor(r() * cols.length)];
  const [lo, hi] = range(q);
  const v = lo + r() * (hi - lo);
  return { q, v, l: build(pts.filter((p) => p[q] < v), r), r: build(pts.filter((p) => p[q] >= v), r) };
}

function cutsOf(tree: Tree, x: Pt): { q: 0 | 1; v: number }[] {
  const out: { q: 0 | 1; v: number }[] = [];
  for (let t = tree; t; t = x[t.q] < t.v ? t.l : t.r) out.push({ q: t.q, v: t.v });
  return out;
}

function sample(n: number, k: number, r: () => number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(r() * (n - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, k);
}

const c = (n: number) => (n <= 1 ? 0 : 2 * (Array.from({ length: n - 1 }, (_, i) => 1 / (i + 2)).reduce((a, b) => a + b, 0)));

// Plot frame: data square [-3.6, 3.8]² → 0..340 px.
const LO = -3.6;
const SPAN = 7.4;
const px = (v: number) => 10 + ((v - LO) / SPAN) * 340;
const py = (v: number) => 350 - ((v - LO) / SPAN) * 340;

export default function IsolationSplitter() {
  const [preset, setPreset] = useState(0);
  const { pts, anomaly, marks } = PRESETS[preset].data;
  const psiSteps = [8, 16, 32, 64, 128, 256, pts.length].filter((v, i, a) => v <= pts.length && a.indexOf(v) === i);
  const [psiIdx, setPsiIdx] = useState(psiSteps.length - 1);
  const k = Math.min(psiIdx, psiSteps.length - 1);
  const psi = psiSteps[k];
  const [target, setTarget] = useState<number | null>(null);
  const [paths, setPaths] = useState<number[]>([]);
  const [tree, setTree] = useState<{ inSample: Set<number>; cuts: { q: 0 | 1; v: number }[] } | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!tree || shown >= tree.cuts.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [tree, shown]);

  const forest = useMemo(() => {
    if (preset !== 1) return null; // in "Single outlier" it would answer the prediction
    const r = rng(11);
    let sumA = 0;
    let sumN = 0;
    for (let t = 0; t < FOREST_TREES; t++) {
      const tr = build(sample(pts.length, psi, r).map((i) => pts[i]), r);
      pts.forEach((p, i) => (anomaly[i] ? (sumA += cutsOf(tr, p).length) : (sumN += cutsOf(tr, p).length)));
    }
    const nA = anomaly.filter(Boolean).length;
    return { a: sumA / FOREST_TREES / nA, n: sumN / FOREST_TREES / (pts.length - nA) };
  }, [preset, pts, anomaly, psi]);

  function grow(i: number, trees = 1) {
    const fresh = Array.from({ length: trees }, () => {
      const idx = sample(pts.length, psi, Math.random);
      return { inSample: new Set(idx), cuts: cutsOf(build(idx.map((j) => pts[j]), Math.random), pts[i]) };
    });
    const last = fresh[trees - 1];
    const still = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPaths((prev) => [...(i === target ? prev : []), ...fresh.map((f) => f.cuts.length)]);
    setTarget(i);
    setTree(last);
    setShown(trees > 1 || still ? last.cuts.length : 0);
  }

  function reset(next: number, nextPsi: number) {
    setPreset(next);
    setPsiIdx(nextPsi);
    setTarget(null);
    setTree(null);
    setPaths([]);
  }

  function onPlotClick(e: MouseEvent<SVGSVGElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    const x = LO + (((e.clientX - b.left) / b.width) * 360 - 10) * (SPAN / 340);
    const y = LO + (350 - ((e.clientY - b.top) / b.height) * 360) * (SPAN / 340);
    grow(nearest(pts, x, y));
  }

  // The box the followed point is still in after `shown` cuts, and the cut lines drawn inside it.
  const box = [LO, LO + SPAN, LO, LO + SPAN];
  const lines: number[][] = [];
  for (const { q, v } of tree?.cuts.slice(0, shown) ?? []) {
    lines.push(q === 0 ? [px(v), py(box[2]), px(v), py(box[3])] : [px(box[0]), py(v), px(box[1]), py(v)]);
    box[2 * q + (pts[target!][q] < v ? 1 : 0)] = v;
  }
  const inBox = (p: Pt) => p[0] >= box[0] && p[0] <= box[1] && p[1] >= box[2] && p[1] <= box[3];
  const mean = paths.length ? paths.reduce((a, b) => a + b, 0) / paths.length : 0;
  const mark = marks.find((m) => m.i === target)?.label;
  const activePsiFull = k === psiSteps.length - 1;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePsiFull ? preset : null}
        onSelect={(i) => reset(i, psiSteps.length)}
      />
      <Slider
        label="sub-sample ψ (points per tree)"
        value={k}
        min={0}
        max={psiSteps.length - 1}
        step={1}
        onChange={(v) => reset(preset, v)}
        display={activePsiFull ? `${psi} (all)` : String(psi)}
        ariaValueText={`${psi} points per tree`}
      />
      <div className="flex flex-wrap items-center gap-2 pt-2">
        {marks.map((m) => (
          <Button key={m.label} active={target === m.i} onClick={() => grow(m.i)}>Grow a tree for {m.label}</Button>
        ))}
        {target !== null && <Button variant="ghost" onClick={() => grow(target, 10)}>+10 trees</Button>}
      </div>
      <svg viewBox="0 0 360 360" className="mt-3 w-full max-w-md cursor-crosshair" onClick={onPlotClick} role="img"
        aria-label={target === null ? "Point cloud; choose a point to isolate" : `Isolating point ${mark ?? ""}: ${shown} cuts so far`}>
        <rect x={px(box[0])} y={py(box[3])} width={px(box[1]) - px(box[0])} height={py(box[2]) - py(box[3])} fill={AMBER} fillOpacity={tree ? 0.08 : 0} />
        {pts.map((p, i) => {
          const op = !tree || i === target || (tree.inSample.has(i) && inBox(p)) ? 0.85 : 0.15;
          return anomaly[i]
            ? <rect key={i} x={px(p[0]) - 3} y={py(p[1]) - 3} width="6" height="6" fill={AMBER} opacity={op} />
            : <circle key={i} cx={px(p[0])} cy={py(p[1])} r="2.6" fill="currentColor" opacity={op} />;
        })}
        {lines.map((s, k) => <line key={k} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={AMBER} strokeWidth="1.5" />)}
        {marks.map((m) => (
          <text key={m.label} x={px(pts[m.i][0]) + 6} y={py(pts[m.i][1]) - 6} fill="currentColor" fontSize="13" fontWeight="600">{m.label}</text>
        ))}
        {target !== null && <circle cx={px(pts[target][0])} cy={py(pts[target][1])} r="6" fill="none" stroke={BLUE} strokeWidth="2" />}
      </svg>
      <Readout>
        {target === null ? "Pick a point: which of the marked points will be alone after the fewest cuts?" : (
          <>
            {mark ? `Point ${mark}` : "This point"}: <strong>{shown}</strong> cuts this tree
            {tree && shown >= tree.cuts.length ? " (leaf reached)" : ""}; mean over {paths.length} tree{paths.length > 1 ? "s" : ""}:{" "}
            <strong>{mean.toFixed(2)}</strong>, c({psi}) = {c(psi).toFixed(2)}, score s = {Math.pow(2, -mean / c(psi)).toFixed(2)}
          </>
        )}
      </Readout>
      {forest && (
        <Readout>
          Forest of {FOREST_TREES} trees on ψ = {psi}: planted cluster mean path <strong style={{ color: AMBER }}>{forest.a.toFixed(2)}</strong>,
          normal points <strong>{forest.n.toFixed(2)}</strong>
          {forest.a < forest.n ? " — the cluster now isolates faster than the crowd." : " — the cluster is masked: it takes longer than a normal point."}
        </Readout>
      )}
    </Panel>
  );
}
