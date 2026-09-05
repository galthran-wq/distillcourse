"use client";

/**
 * QuadraticVariationZoom — one seeded Brownian path (65 536 steps on [0, 1])
 * beside the smooth curve f(t) = 0.4 sin 4t + 0.3t. A mesh slider refines the
 * partition from 1/2 to 1/4096 and both curves' first-order and quadratic
 * sums are read at that mesh: the Brownian first-order sum grows by √2 per
 * halving and never stops, its quadratic sum stays inside the √(2/n) spread
 * around T = 1, the smooth curve's falls to zero. A zoom re-centres both on
 * t = 0.5 at widths 1, 0.1, 0.01 with the axes refitted, and only the smooth
 * curve straightens (lesson: brownian-motion).
 */
import { useState } from "react";
import { Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

const AMBER = "#e2903a", BLUE = "#4c8dd6";
const N = 1 << 16; // the path's own steps: the finest slider mesh, 1/4096, still spans 16 of them
const MAX_K = 12;
const ZOOMS = [1, 10, 100];
const MESH_PRESETS = [3, 6, 12];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rng: () => number) =>
  Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());

// One fixed path, so every reader sees the same numbers and the prose can quote them.
const rng = mulberry32(20260903);
const W = new Float64Array(N + 1);
for (let i = 1; i <= N; i++) W[i] = W[i - 1] + gauss(rng) / Math.sqrt(N);
const F = Float64Array.from({ length: N + 1 }, (_, i) => 0.4 * Math.sin((4 * i) / N) + (0.3 * i) / N);

interface Sums { first: number; quad: number }
function sums(x: Float64Array, k: number): Sums {
  const stride = N >> k;
  let first = 0, quad = 0;
  for (let i = stride; i <= N; i += stride) {
    const d = x[i] - x[i - stride];
    first += Math.abs(d);
    quad += d * d;
  }
  return { first, quad };
}
// Every mesh once at load: target 1 compares each mesh with the one twice as coarse.
const SUMS = Array.from({ length: MAX_K + 1 }, (_, k) => ({ w: sums(W, k), f: sums(F, k) }));

/** The window of width 1/zoom around t = 0.5, as sample indices, with the path's range on it. */
function window(x: Float64Array, zoom: number) {
  const lo = Math.round((0.5 - 0.5 / zoom) * N), hi = Math.round((0.5 + 0.5 / zoom) * N);
  let min = Infinity, max = -Infinity;
  for (let i = lo; i <= hi; i++) { min = Math.min(min, x[i]); max = Math.max(max, x[i]); }
  return { lo, hi, min, max };
}
const HEIGHTS = ZOOMS.map((z) => ({ w: window(W, z), f: window(F, z) }));

const f2 = (v: number) => v.toFixed(2);
const f3 = (v: number) => v.toFixed(v < 0.1 ? 4 : 3);
const spread = (k: number) => Math.sqrt(2 / (1 << k)); // std of Σ(ΔW)² over n = 2^k cells, T = 1

const PANE_W = 180, PANE_H = 128, TOP = 18, SVG_W = 400, SVG_H = 186;

function Pane({ x, zi, k, px, color, name }: { x: Float64Array; zi: number; k: number; px: number; color: string; name: string }) {
  const { lo, hi, min, max } = window(x, ZOOMS[zi]);
  const sx = (i: number) => px + ((i - lo) / (hi - lo)) * PANE_W;
  const sy = (v: number) => TOP + PANE_H - ((v - min) / (max - min)) * PANE_H;
  // The raw path drawn at ≤512 points; the chords are the partition points that fall in the window.
  const step = Math.max(1, Math.floor((hi - lo) / 512));
  const pts: string[] = [];
  for (let i = lo; i <= hi; i += step) pts.push(`${sx(i)},${sy(x[i])}`);
  const stride = N >> k;
  const chords: string[] = [];
  for (let i = Math.ceil(lo / stride) * stride; i <= hi; i += stride) chords.push(`${sx(i)},${sy(x[i])}`);
  return (
    <g>
      <text x={px} y={12} fontSize="10" fill={color}>{name}</text>
      <rect x={px} y={TOP} width={PANE_W} height={PANE_H} fill="none" stroke="currentColor" opacity="0.25" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.2" />
      {chords.length > 1 && <polyline points={chords.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />}
      <text x={px + 3} y={TOP + 9} fontSize="8" fill="currentColor" opacity="0.7">{f3(max)}</text>
      <text x={px + 3} y={TOP + PANE_H - 3} fontSize="8" fill="currentColor" opacity="0.7">{f3(min)}</text>
      <text x={px} y={TOP + PANE_H + 13} fontSize="9" fill="currentColor" opacity="0.8">
        t ∈ [{(lo / N).toFixed(3)}, {(hi / N).toFixed(3)}]
      </text>
      <text x={px} y={TOP + PANE_H + 25} fontSize="9" fill="currentColor" opacity="0.8">
        height {f3(max - min)}{chords.length < 2 && " — one cell is wider than this window"}
      </text>
    </g>
  );
}

interface State { k: number; zi: number; hit: boolean[] }
const targetsMet = ({ k, zi }: State) => [
  k === MAX_K,
  SUMS[k].f.quad < 0.01 && Math.abs(SUMS[k].w.quad - 1) <= spread(k),
  zi === 2,
];

export default function QuadraticVariationZoom() {
  // D3: open at mesh 1/8, zoom 1× — the coarse chords visibly under-count the path.
  const [s, setS] = useState<State>({ k: 3, zi: 0, hit: [false, false, false] });
  const set = (patch: Partial<State>) =>
    setS((st) => {
      const next = { ...st, ...patch };
      return { ...next, hit: st.hit.map((h, i) => h || targetsMet(next)[i]) };
    });
  const { k, zi } = s;
  const n = 1 << k;
  const { w, f } = SUMS[k];
  const met = targetsMet(s);
  const meshPreset = MESH_PRESETS.indexOf(k);
  const growth = w.first / SUMS[k - 1].w.first;
  const heights = (c: "w" | "f") => HEIGHTS.map((h) => f3(h[c].max - h[c].min)).join(" → ");
  const cell = "px-1.5 py-1 text-right font-mono tabular-nums";

  return (
    <Panel>
      <PresetGroup
        labels={MESH_PRESETS.map((p) => `mesh 1/${1 << p}`)}
        activeIndex={meshPreset === -1 ? null : meshPreset}
        onSelect={(i) => set({ k: MESH_PRESETS[i] })}
      />
      <PresetGroup labels={ZOOMS.map((z) => `zoom ${z}×`)} activeIndex={zi} onSelect={(i) => set({ zi: i })} />
      <TargetList
        targets={[
          ["1. Find a mesh at which the Brownian first-order sum stops growing: refine to 1/4096 — it rose at every one of the eleven halvings, by √2 on average",
            `Σ|ΔW| = ${f2(w.first)} at mesh 1/${n}, ×${growth.toFixed(2)} over mesh 1/${n / 2}`],
          ["2. Refine until the smooth curve's quadratic sum is below 0.01 while the Brownian one stays inside the predicted spread √(2/n) around T = 1",
            `Σ(ΔW)² = ${f2(w.quad)} against 1 ± ${f2(spread(k))}; Σ(Δf)² = ${f3(f.quad)}`],
          ["3. Zoom to 100×: the smooth curve becomes a line and the Brownian path does not — its height falls by √10 ≈ 3.2 per step, the smooth curve's by 10",
            `heights at 1×, 10×, 100× — smooth: ${heights("f")}; Brownian: ${heights("w")}`],
        ].map(([label, detail], i) => ({ label, detail, met: met[i], latched: s.hit[i] }))}
      />
      <Slider
        label="mesh of the partition"
        value={k}
        min={1}
        max={MAX_K}
        step={1}
        onChange={(v) => set({ k: v })}
        display={`1/${n}`}
        ariaLabel="Mesh of the partition, as a power of one half"
        ariaValueText={`one over ${n}, ${n} cells`}
      />
      <Readout>
        {n} cells of width 1/{n}: the sampled quadratic variation of W is expected within{" "}
        <strong>√(2/{n}) = {f2(spread(k))}</strong> of T = 1; the smooth curve&rsquo;s is bounded by its mesh times a constant.
      </Readout>
      <div className="overflow-x-auto pt-1">
        <table className="w-full border-collapse text-xs" aria-label="First-order and quadratic sums of both curves at the chosen mesh">
          <thead>
            <tr className="text-faint">
              <th className="py-1 text-left font-normal">curve</th>
              <th className={`${cell} font-normal`}>Σ|ΔX| (first-order)</th>
              <th className={`${cell} font-normal`}>Σ(ΔX)² (quadratic)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="py-1" style={{ color: AMBER }}>Brownian path W</td><td className={cell}>{f2(w.first)}</td><td className={cell}>{f2(w.quad)}</td></tr>
            <tr><td className="py-1" style={{ color: BLUE }}>smooth f</td><td className={cell}>{f2(f.first)}</td><td className={cell}>{f3(f.quad)}</td></tr>
          </tbody>
        </table>
      </div>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="mt-2 w-full select-none" role="img"
        aria-label={`Brownian path and smooth curve on a window of width ${1 / ZOOMS[zi]} around t = 0.5 with axes refitted, chords of the mesh 1/${n} overlaid`}>
        <Pane x={W} zi={zi} k={k} px={10} color={AMBER} name="Brownian path W" />
        <Pane x={F} zi={zi} k={k} px={210} color={BLUE} name="smooth f(t) = 0.4 sin 4t + 0.3t" />
        <text x={SVG_W - 2} y={SVG_H - 2} textAnchor="end" fontSize="8" fill="currentColor" opacity="0.6">grey chords: the partition at mesh 1/{n}</text>
      </svg>
    </Panel>
  );
}
