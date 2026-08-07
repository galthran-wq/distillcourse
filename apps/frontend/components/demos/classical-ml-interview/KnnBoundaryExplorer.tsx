"use client";

/**
 * KnnBoundaryExplorer — k-NN decision regions on a fixed two-class 2D
 * mixture (ESL-style: 6 Gaussian centers per class, seeded PRNG so every
 * visitor sees the same data). The k slider (odd 1…51) redraws the
 * predicted regions and reports train error (100 points, self included,
 * so k = 1 gives exactly 0) and test error (300 held-out points).
 * Guided task (lesson): start at k = 1, watch the noise islands vanish
 * as k grows, record the k where test error bottoms out (≈ 9–15 here).
 */
import { useMemo, useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const N_TRAIN = 100;
const N_TEST = 300;
const NOISE = 0.45;
// plot domain (data spans x ∈ [-2.2, 2.8], y ∈ [-1.5, 4.1]) and grid
const X0 = -2.5, X1 = 3.1, Y0 = -1.9, Y1 = 4.4;
const W = 320, H = 340, GW = 56, GH = 60;

const PRESETS = [
  { label: "k = 1 (islands)", k: 1 },
  { label: "k = 15 (smooth)", k: 15 },
  { label: "k = 51 (oversmoothed)", k: 51 },
];

type Pt = { x: number; y: number; c: 0 | 1 };

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

/** Fixed dataset: 6 centers per class ~ N(μ_c, I), samples ~ N(center, NOISE²·I). */
function makeData(seed: number): { train: Pt[]; test: Pt[] } {
  const rng = mulberry32(seed);
  const centers: [number, number][][] = [[], []];
  ([[0, 1], [1, 0]] as const).forEach((mu, c) => {
    for (let m = 0; m < 6; m++)
      centers[c].push([mu[0] + gaussian(rng), mu[1] + gaussian(rng)]);
  });
  const draw = (n: number): Pt[] =>
    Array.from({ length: n }, (_, i) => {
      const c = (i % 2) as 0 | 1;
      const ctr = centers[c][Math.floor(rng() * 6)];
      return { x: ctr[0] + NOISE * gaussian(rng), y: ctr[1] + NOISE * gaussian(rng), c };
    });
  return { train: draw(N_TRAIN), test: draw(N_TEST) };
}

const { train: TRAIN, test: TEST } = makeData(2);

/** Cumulative count of class-1 labels among TRAIN sorted by distance to (px, py). */
function cumOnes(px: number, py: number): Uint8Array {
  const d = TRAIN.map((t) => ({ d: (t.x - px) ** 2 + (t.y - py) ** 2, c: t.c }));
  d.sort((a, b) => a.d - b.d);
  const cum = new Uint8Array(N_TRAIN);
  let s = 0;
  d.forEach((e, i) => { s += e.c; cum[i] = s; });
  return cum;
}

// Neighbor tables are fixed by the data, so every k-change is O(1) per point/cell.
const TRAIN_CUM = TRAIN.map((p) => cumOnes(p.x, p.y));
const TEST_CUM = TEST.map((p) => cumOnes(p.x, p.y));
const GRID_CUM: Uint8Array[] = [];
for (let gy = 0; gy < GH; gy++)
  for (let gx = 0; gx < GW; gx++)
    GRID_CUM.push(
      cumOnes(X0 + ((gx + 0.5) / GW) * (X1 - X0), Y1 - ((gy + 0.5) / GH) * (Y1 - Y0)),
    );

const sx = (x: number) => ((x - X0) / (X1 - X0)) * W;
const sy = (y: number) => ((Y1 - y) / (Y1 - Y0)) * H;

export default function KnnBoundaryExplorer() {
  // D3: open on the k = 1 preset — the islands around noise points are the hook.
  const [k, setK] = useState(1);

  const { rects, trainErr, testErr } = useMemo(() => {
    const maj = (cum: Uint8Array) => (cum[k - 1] * 2 > k ? 1 : 0);
    const err = (cums: Uint8Array[], pts: Pt[]) =>
      cums.reduce((s, cum, i) => s + (maj(cum) !== pts[i].c ? 1 : 0), 0) / pts.length;
    // merge each grid row's class-1 cells into horizontal run rectangles
    const runs: { x: number; y: number; w: number }[] = [];
    const cw = W / GW, ch = H / GH;
    for (let gy = 0; gy < GH; gy++) {
      let start = -1;
      for (let gx = 0; gx <= GW; gx++) {
        const one = gx < GW && maj(GRID_CUM[gy * GW + gx]) === 1;
        if (one && start < 0) start = gx;
        else if (!one && start >= 0) {
          runs.push({ x: start * cw, y: gy * ch, w: (gx - start) * cw });
          start = -1;
        }
      }
    }
    return { rects: runs, trainErr: err(TRAIN_CUM, TRAIN), testErr: err(TEST_CUM, TEST) };
  }, [k]);

  const activePreset = PRESETS.findIndex((p) => p.k === k);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setK(PRESETS[i].k)}
      />
      <Slider
        label="k (neighbors voting; odd, so no ties)"
        value={k}
        min={1}
        max={51}
        step={2}
        onChange={setK}
        display={String(k)}
        ariaLabel="Number of nearest neighbors k"
      />
      <Readout>
        train error = <strong>{trainErr.toFixed(2)}</strong> ({N_TRAIN} points, memorized) ·
        test error = <strong>{testErr.toFixed(3)}</strong> ({N_TEST} held-out points)
      </Readout>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-2 block w-full max-w-90 select-none"
        role="img"
        aria-label={`k-NN decision regions at k = ${k}: two-class scatter with shaded predicted regions; train error ${trainErr.toFixed(2)}, test error ${testErr.toFixed(3)}`}
      >
        <rect x="0" y="0" width={W} height={H} rx="4" fill={BLUE} opacity="0.12" />
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={H / GH + 0.5} fill={AMBER} opacity="0.22" />
        ))}
        {TRAIN.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={p.c ? AMBER : BLUE} />
        ))}
        <text x="8" y="16" fontSize="11" fontWeight="bold" fill={BLUE}>class 0</text>
        <text x="8" y="30" fontSize="11" fontWeight="bold" fill={AMBER}>class 1</text>
        <text x="8" y="44" fontSize="10" fill="currentColor" opacity="0.65">shading = predicted class</text>
        <text x={W - 10} y={H - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">x₁</text>
        <text x="8" y={H - 8} fontSize="11" fill="currentColor" opacity="0.65">x₂</text>
      </svg>
    </Panel>
  );
}
