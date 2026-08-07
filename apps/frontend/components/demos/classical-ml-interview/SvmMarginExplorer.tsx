"use client";

/**
 * SvmMarginExplorer — soft-margin linear SVM on draggable 2D two-class
 * points. Re-solves on every change via dual coordinate descent
 * (LIBLINEAR-style, bias as an augmented regularized feature) and draws
 * the boundary, the dashed margin lines, and rings around support
 * vectors (points with y·f(x) ≤ 1, i.e. on or inside the margin).
 * C on a log slider. Presets: separable / one outlier / heavy overlap.
 * Guided task (lesson): on "one outlier", sweep C until the boundary
 * swings toward the outlier; drag a point into the band and watch it
 * acquire the support-vector ring as it crosses the dashed line.
 */
import { useMemo, useRef, useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const X0 = -3, X1 = 3, Y0 = -3, Y1 = 3;
const W = 340, H = 340;

type Pt = { x: number; y: number; c: 1 | -1 };

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

/** Two blobs of 8 points each at (±cx, ±cy) with spread s. */
function blobs(seed: number, cx: number, cy: number, s: number): Pt[] {
  const rng = mulberry32(seed);
  const clamp = (v: number) => Math.min(2.8, Math.max(-2.8, v));
  return Array.from({ length: 16 }, (_, i) => {
    const c: 1 | -1 = i < 8 ? 1 : -1;
    return {
      x: clamp(c * cx + s * gaussian(rng)),
      y: clamp(c * cy + s * gaussian(rng)),
      c,
    };
  });
}

const SEPARABLE = blobs(7, 1.3, 0.9, 0.55);
const OUTLIER = [...SEPARABLE, { x: -1.5, y: -1.3, c: 1 as const }];
const OVERLAP = blobs(3, 0.55, 0.4, 0.95);
const PRESETS = [
  { label: "separable", points: SEPARABLE, logC: 2 },
  { label: "one outlier", points: OUTLIER, logC: -1 },
  { label: "heavy overlap", points: OVERLAP, logC: 0 },
];

/** Soft-margin SVM by dual coordinate descent; bias = extra regularized feature. */
function solveSvm(pts: Pt[], C: number) {
  const n = pts.length;
  const a = new Float64Array(n);
  const q = pts.map((p) => p.x * p.x + p.y * p.y + 1);
  let w1 = 0, w2 = 0, b = 0;
  for (let e = 0; e < 6000; e++)
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const g = p.c * (w1 * p.x + w2 * p.y + b) - 1;
      const na = Math.min(Math.max(a[i] - g / q[i], 0), C);
      const d = (na - a[i]) * p.c;
      if (d !== 0) { w1 += d * p.x; w2 += d * p.y; b += d; a[i] = na; }
    }
  return { w1, w2, b };
}

const sx = (x: number) => ((x - X0) / (X1 - X0)) * W;
const sy = (y: number) => ((Y1 - y) / (Y1 - Y0)) * H;

/** Screen endpoints of the line w·x + b = k, long enough to cross the box. */
function lineEnds(w1: number, w2: number, b: number, k: number) {
  const n2 = w1 * w1 + w2 * w2;
  const px = ((k - b) * w1) / n2, py = ((k - b) * w2) / n2;
  const t = 10 / Math.sqrt(n2);
  const ux = -w2 * t, uy = w1 * t;
  return [sx(px - ux), sy(py - uy), sx(px + ux), sy(py + uy)] as const;
}

export default function SvmMarginExplorer() {
  // D3: open on "separable" — the canonical max-margin picture with few SVs.
  const [points, setPoints] = useState<Pt[]>(PRESETS[0].points);
  const [logC, setLogC] = useState<number>(PRESETS[0].logC);
  const dragRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const C = 10 ** logC;

  const { w1, w2, b } = useMemo(() => solveSvm(points, C), [points, C]);
  const nrm = Math.hypot(w1, w2);
  const ok = nrm > 1e-6;
  const marg = points.map((p) => p.c * (w1 * p.x + w2 * p.y + b));
  const isSv = marg.map((m) => ok && m <= 1 + 1e-3);
  const slack = marg.reduce((s, m) => s + Math.max(0, 1 - m), 0);
  const nSv = isSv.filter(Boolean).length;

  const active = PRESETS.findIndex((p) => p.points === points && p.logC === logC);

  const movePoint = (i: number, x: number, y: number) =>
    setPoints((pts) => pts.map((p, j) => (j === i ? { ...p, x, y } : p)));
  const toData = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    const cl = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
    return {
      x: cl(X0 + ((e.clientX - r.left) / r.width) * (X1 - X0), X0, X1),
      y: cl(Y1 - ((e.clientY - r.top) / r.height) * (Y1 - Y0), Y0, Y1),
    };
  };

  const fmtC = C >= 10 ? C.toFixed(0) : C >= 1 ? C.toFixed(1) : C.toFixed(2);
  const [bx1, by1, bx2, by2] = ok ? lineEnds(w1, w2, b, 0) : [0, 0, 0, 0];

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => { setPoints(PRESETS[i].points); setLogC(PRESETS[i].logC); }}
      />
      <Slider
        label="C (log scale) — price of slack"
        value={logC}
        min={-2}
        max={2}
        step={0.05}
        onChange={setLogC}
        display={`C = ${fmtC}`}
        ariaLabel="Slack penalty C, log scale"
      />
      <Readout>
        margin 2/‖w‖ = <strong>{ok ? (2 / nrm).toFixed(2) : "∞"}</strong> ·{" "}
        support vectors = <strong>{nSv}</strong> / {points.length} · Σξ ={" "}
        <strong>{slack.toFixed(2)}</strong>
      </Readout>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-2 block w-full max-w-90 select-none touch-none"
        role="img"
        aria-label={`Soft-margin SVM at C = ${fmtC}: margin ${ok ? (2 / nrm).toFixed(2) : "unbounded"}, ${nSv} support vectors, total slack ${slack.toFixed(2)}`}
        onPointerMove={(e) => {
          if (dragRef.current === null) return;
          const d = toData(e);
          movePoint(dragRef.current, d.x, d.y);
        }}
        onPointerUp={() => (dragRef.current = null)}
        onPointerCancel={() => (dragRef.current = null)}
      >
        <rect x="0" y="0" width={W} height={H} rx="4" fill="currentColor" opacity="0.04" />
        {ok && (
          <>
            <polygon
              points={[lineEnds(w1, w2, b, 1), lineEnds(w1, w2, b, -1)]
                .flatMap(([ax, ay, cx2, cy2], i) => (i === 0 ? [ax, ay, cx2, cy2] : [cx2, cy2, ax, ay]))
                .join(" ")}
              fill="currentColor"
              opacity="0.07"
            />
            <line x1={bx1} y1={by1} x2={bx2} y2={by2} stroke="currentColor" strokeWidth="1.8" />
            {[1, -1].map((k) => {
              const [ax, ay, cx2, cy2] = lineEnds(w1, w2, b, k);
              return (
                <line key={k} x1={ax} y1={ay} x2={cx2} y2={cy2}
                  stroke="currentColor" strokeWidth="1.2" strokeDasharray="6 5" opacity="0.65" />
              );
            })}
          </>
        )}
        {points.map((p, i) => (
          <g key={i} className="cursor-move">
            {isSv[i] && (
              <circle cx={sx(p.x)} cy={sy(p.y)} r="9.5" fill="none"
                stroke={p.c === 1 ? AMBER : BLUE} strokeWidth="2" opacity="0.9" />
            )}
            <circle cx={sx(p.x)} cy={sy(p.y)} r="5.5" fill={p.c === 1 ? AMBER : BLUE} />
            <circle
              cx={sx(p.x)} cy={sy(p.y)} r="16" fill="transparent" tabIndex={0} role="button"
              aria-label={`Class ${p.c === 1 ? "+1" : "−1"} point at (${p.x.toFixed(1)}, ${p.y.toFixed(1)})${isSv[i] ? ", support vector" : ""}; drag or use arrow keys to move`}
              onPointerDown={(e) => {
                dragRef.current = i;
                svgRef.current?.setPointerCapture(e.pointerId);
              }}
              onKeyDown={(e) => {
                const step = 0.15;
                const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
                const dy = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0;
                if (dx === 0 && dy === 0) return;
                e.preventDefault();
                movePoint(i, Math.min(X1, Math.max(X0, p.x + dx)), Math.min(Y1, Math.max(Y0, p.y + dy)));
              }}
            />
          </g>
        ))}
        <text x="8" y="16" fontSize="11" fontWeight="bold" fill={AMBER}>class +1</text>
        <text x="8" y="30" fontSize="11" fontWeight="bold" fill={BLUE}>class −1</text>
        <text x="8" y="44" fontSize="10" fill="currentColor" opacity="0.65">ring = support vector · dashed = margin</text>
        <text x={W - 10} y={H - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">x₁</text>
        <text x="8" y={H - 8} fontSize="11" fill="currentColor" opacity="0.65">x₂</text>
      </svg>
    </Panel>
  );
}
