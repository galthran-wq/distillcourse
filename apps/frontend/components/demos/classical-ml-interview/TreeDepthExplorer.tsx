"use client";

/**
 * TreeDepthExplorer — greedy Gini CART on a fixed noisy 2D two-class dataset
 * (true labels = union of two axis-aligned boxes, 18% label noise, seeded
 * PRNG). The max-depth slider truncates one fully grown tree: the partition
 * redraws as nested rectangles and train/test error curves trace up to the
 * chosen depth. Test error bottoms at depth 3 (0.226), climbs to 0.324 by
 * depth 10; train error falls monotonically to exactly 0. Guided task
 * (lesson): slide 1→10 and find where test error turns back up.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const NOISE = 0.18, N_TRAIN = 150, N_TEST = 500, MAX_DEPTH = 10;
const W = 320, H = 300; // partition plot, domain [0,1]²
const CW = 320, CH = 180, CX0 = 38, CX1 = 306, CY0 = 10, CY1 = 152; // curves

const PRESETS = [
  { label: "Stump (depth 1)", d: 1 },
  { label: "Depth 3 (best test)", d: 3 },
  { label: "Depth 10 (memorized)", d: 10 },
];

type Pt = { x: number; y: number; c: 0 | 1 };
type Feat = "x" | "y";
interface TreeNode {
  cls: 0 | 1;
  depth: number;
  feat?: Feat;
  thr?: number;
  left?: TreeNode;
  right?: TreeNode;
}
type Box = [number, number, number, number]; // x0, x1, y0, y1

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fixed dataset: uniform points, two-box true class, noisy labels. */
function makeData(seed: number): { train: Pt[]; test: Pt[] } {
  const rng = mulberry32(seed);
  const draw = (n: number): Pt[] =>
    Array.from({ length: n }, () => {
      const x = rng(), y = rng();
      const truth = (x > 0.62 && y > 0.4) || (x < 0.35 && y < 0.45) ? 1 : 0;
      const c = (rng() < NOISE ? 1 - truth : truth) as 0 | 1;
      return { x, y, c };
    });
  return { train: draw(N_TRAIN), test: draw(N_TEST) };
}

const gini = (n1: number, n: number) =>
  n === 0 ? 0 : 2 * (n1 / n) * (1 - n1 / n);

/** Greedy CART: exact scan of every threshold on both features, Gini. */
function build(pts: Pt[], depth: number): TreeNode {
  const n = pts.length, n1 = pts.reduce((s, p) => s + p.c, 0);
  const node: TreeNode = { cls: n1 * 2 >= n ? 1 : 0, depth };
  if (depth >= MAX_DEPTH || n1 === 0 || n1 === n) return node;
  let best: { w: number; feat: Feat; thr: number } | null = null;
  for (const feat of ["x", "y"] as const) {
    const sorted = [...pts].sort((a, b) => a[feat] - b[feat]);
    let l1 = 0;
    for (let i = 0; i < n - 1; i++) {
      l1 += sorted[i].c;
      if (sorted[i][feat] === sorted[i + 1][feat]) continue;
      const ln = i + 1;
      const w = (ln / n) * gini(l1, ln) + ((n - ln) / n) * gini(n1 - l1, n - ln);
      if (w < gini(n1, n) - 1e-12 && (best === null || w < best.w))
        best = { w, feat, thr: (sorted[i][feat] + sorted[i + 1][feat]) / 2 };
    }
  }
  if (best === null) return node;
  node.feat = best.feat;
  node.thr = best.thr;
  node.left = build(pts.filter((p) => p[best.feat] <= best.thr), depth + 1);
  node.right = build(pts.filter((p) => p[best.feat] > best.thr), depth + 1);
  return node;
}

const { train: TRAIN, test: TEST } = makeData(7);
const ROOT = build(TRAIN, 0);

function collectLeaves(
  node: TreeNode, d: number, box: Box, out: { box: Box; cls: 0 | 1 }[],
): void {
  if (node.left === undefined || node.right === undefined || node.depth >= d) {
    out.push({ box, cls: node.cls });
    return;
  }
  const [x0, x1, y0, y1] = box;
  const t = node.thr as number;
  const [lBox, rBox]: [Box, Box] =
    node.feat === "x" ? [[x0, t, y0, y1], [t, x1, y0, y1]] : [[x0, x1, y0, t], [x0, x1, t, y1]];
  collectLeaves(node.left, d, lBox, out);
  collectLeaves(node.right, d, rBox, out);
}

function predict(p: Pt, d: number): 0 | 1 {
  let node = ROOT;
  while (node.left !== undefined && node.right !== undefined && node.depth < d)
    node = p[node.feat as Feat] <= (node.thr as number) ? node.left : node.right;
  return node.cls;
}

// Every depth is precomputed once at module load; the slider just indexes.
const STATS = Array.from({ length: MAX_DEPTH }, (_, i) => {
  const d = i + 1;
  const rects: { box: Box; cls: 0 | 1 }[] = [];
  collectLeaves(ROOT, d, [0, 1, 0, 1], rects);
  const err = (pts: Pt[]) =>
    pts.reduce((s, p) => s + (predict(p, d) !== p.c ? 1 : 0), 0) / pts.length;
  return { rects, trainErr: err(TRAIN), testErr: err(TEST) };
});

const sx = (x: number) => x * W;
const sy = (y: number) => (1 - y) * H;
const rx = (d: number) => CX0 + ((d - 1) / (MAX_DEPTH - 1)) * (CX1 - CX0);
const ry = (e: number) => CY1 - (e / 0.5) * (CY1 - CY0);
const trace = (key: "trainErr" | "testErr", d: number) =>
  STATS.slice(0, d).map((s, i) => `${rx(i + 1)},${ry(s[key])}`).join(" ");

export default function TreeDepthExplorer() {
  // D3: open on the depth-10 preset — sliver rectangles around single noise
  // points plus train error 0.000 vs test 0.324 is the memorization hook.
  const [depth, setDepth] = useState(10);
  const { rects, trainErr, testErr } = STATS[depth - 1];
  const activePreset = PRESETS.findIndex((p) => p.d === depth);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setDepth(PRESETS[i].d)}
      />
      <Slider
        label="max depth (splits allowed on any path)"
        value={depth}
        min={1}
        max={MAX_DEPTH}
        step={1}
        onChange={setDepth}
        display={String(depth)}
        ariaLabel="Maximum tree depth"
      />
      <Readout>
        {rects.length} leaves · train error = <strong>{trainErr.toFixed(3)}</strong> ({N_TRAIN} points) ·
        test error = <strong>{testErr.toFixed(3)}</strong> ({N_TEST} held-out points)
      </Readout>
      <div className="mt-2 flex flex-wrap items-start justify-center gap-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full max-w-80 select-none"
          role="img"
          aria-label={`CART partition at max depth ${depth}: ${rects.length} axis-aligned rectangles over a two-class scatter`}
        >
          {rects.map((r, i) => (
            <rect
              key={i}
              x={sx(r.box[0])}
              y={sy(r.box[3])}
              width={(r.box[1] - r.box[0]) * W}
              height={(r.box[3] - r.box[2]) * H}
              fill={r.cls ? AMBER : BLUE}
              opacity={r.cls ? 0.22 : 0.12}
              stroke="currentColor"
              strokeOpacity="0.35"
            />
          ))}
          {TRAIN.map((p, i) => (
            <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3" fill={p.c ? AMBER : BLUE} />
          ))}
          <text x="8" y="16" fontSize="11" fontWeight="bold" fill={BLUE}>class 0</text>
          <text x="8" y="30" fontSize="11" fontWeight="bold" fill={AMBER}>class 1</text>
          <text x="8" y="44" fontSize="10" fill="currentColor" opacity="0.65">shading = predicted class</text>
          <text x={W - 8} y={H - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">x₁</text>
          <text x="8" y={H - 8} fontSize="11" fill="currentColor" opacity="0.65">x₂</text>
        </svg>
        <svg
          viewBox={`0 0 ${CW} ${CH}`}
          className="block w-full max-w-80 select-none"
          role="img"
          aria-label={`Error versus depth, traced up to depth ${depth}: train ${trainErr.toFixed(3)}, test ${testErr.toFixed(3)}`}
        >
          <line x1={CX0} y1={CY1} x2={CX1} y2={CY1} stroke="currentColor" opacity="0.5" />
          <line x1={CX0} y1={CY0} x2={CX0} y2={CY1} stroke="currentColor" opacity="0.5" />
          <line x1={rx(depth)} y1={CY0} x2={rx(depth)} y2={CY1} stroke="currentColor" opacity="0.3" strokeDasharray="3 3" />
          <polyline points={trace("trainErr", depth)} fill="none" stroke={BLUE} strokeWidth="2" />
          <polyline points={trace("testErr", depth)} fill="none" stroke={AMBER} strokeWidth="2.5" />
          <circle cx={rx(depth)} cy={ry(trainErr)} r="3.5" fill={BLUE} />
          <circle cx={rx(depth)} cy={ry(testErr)} r="3.5" fill={AMBER} />
          <text x={CX0 - 6} y={CY1 + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">0</text>
          <text x={CX0 - 6} y={ry(0.5) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">0.5</text>
          {[1, 3, 5, 10].map((d) => (
            <text key={d} x={rx(d)} y={CY1 + 14} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{d}</text>
          ))}
          <text x={(CX0 + CX1) / 2} y={CH - 2} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">max depth</text>
          <text x={CX1} y={CY0 + 10} textAnchor="end" fontSize="11" fontWeight="bold" fill={BLUE}>train</text>
          <text x={CX1} y={CY0 + 24} textAnchor="end" fontSize="11" fontWeight="bold" fill={AMBER}>test</text>
        </svg>
      </div>
    </Panel>
  );
}
