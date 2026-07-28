"use client";

/**
 * PcaExplorer — draggable 2D point cloud with live principal axes drawn
 * through the mean (half-lengths proportional to each component's
 * explained-variance share) and a per-component variance bar chart; a
 * toggle projects every point onto PC1 to show reconstruction and its
 * error (mean squared residual = λ2). Presets: correlated cloud,
 * isotropic cloud (λ1 ≈ λ2, axes unstable), two elongated blobs.
 * Guided task (lesson): on "correlated cloud", drag one point far out
 * and watch PC1 rotate toward it; on "isotropic cloud", gentle drags
 * swing the axes wildly.
 */
import { useMemo, useRef, useState } from "react";
import { Panel, PresetGroup, Button, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const X0 = -3, X1 = 3, Y0 = -3, Y1 = 3;
const W = 340, H = 340;

type Pt = { x: number; y: number };

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
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** n points from a Gaussian with sds (sdA, sdB), rotated by deg, centered at (cx, cy). */
function cloud(seed: number, n: number, sdA: number, sdB: number, deg: number, cx = 0, cy = 0): Pt[] {
  const rng = mulberry32(seed);
  const th = (deg * Math.PI) / 180, co = Math.cos(th), si = Math.sin(th);
  return Array.from({ length: n }, () => {
    const a = sdA * gaussian(rng), b = sdB * gaussian(rng);
    return { x: clamp(cx + a * co - b * si, -2.9, 2.9), y: clamp(cy + a * si + b * co, -2.9, 2.9) };
  });
}

const PRESETS = [
  { label: "correlated cloud", points: cloud(11, 26, 1.5, 0.45, 35) },
  { label: "isotropic cloud", points: cloud(5, 26, 0.95, 0.95, 0) },
  {
    label: "two elongated blobs",
    points: [...cloud(2, 13, 0.9, 0.28, 0, -1.3, 1.15), ...cloud(9, 13, 0.9, 0.28, 0, 1.3, -1.15)],
  },
];

/** Mean, eigenvalues λ1 ≥ λ2 ≥ 0 and unit top eigenvector of the 2×2 covariance. */
function pca(pts: Pt[]) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let a = 0, b = 0, c = 0;
  for (const p of pts) {
    const dx = p.x - mx, dy = p.y - my;
    a += dx * dx; b += dx * dy; c += dy * dy;
  }
  a /= n; b /= n; c /= n;
  const mid = (a + c) / 2, disc = Math.hypot((a - c) / 2, b);
  const l1 = mid + disc, l2 = Math.max(0, mid - disc);
  let ux: number, uy: number;
  if (Math.abs(b) > 1e-9) { ux = b; uy = l1 - a; }
  else if (a >= c) { ux = 1; uy = 0; }
  else { ux = 0; uy = 1; }
  const nm = Math.hypot(ux, uy) || 1;
  ux /= nm; uy /= nm;
  if (ux < 0) { ux = -ux; uy = -uy; } // canonical sign: angle stays in (−90°, 90°]
  return { mx, my, l1, l2, ux, uy };
}

const sx = (x: number) => ((x - X0) / (X1 - X0)) * W;
const sy = (y: number) => ((Y1 - y) / (Y1 - Y0)) * H;

export default function PcaExplorer() {
  // D3: open on "correlated cloud" — the canonical tilted ellipse with a dominant PC1.
  const [points, setPoints] = useState<Pt[]>(PRESETS[0].points);
  const [project, setProject] = useState(false);
  const dragRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { mx, my, l1, l2, ux, uy } = useMemo(() => pca(points), [points]);
  const total = l1 + l2;
  const r1 = total > 1e-12 ? l1 / total : 0.5;
  const r2 = 1 - r1;
  const theta = (Math.atan2(uy, ux) * 180) / Math.PI;
  const hl1 = 2.8 * r1, hl2 = 2.8 * r2;
  const proj = points.map((p) => {
    const t = (p.x - mx) * ux + (p.y - my) * uy;
    return { x: mx + t * ux, y: my + t * uy };
  });

  const active = PRESETS.findIndex((p) => p.points === points);

  const movePoint = (i: number, x: number, y: number) =>
    setPoints((pts) => pts.map((p, j) => (j === i ? { x, y } : p)));
  const toData = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: clamp(X0 + ((e.clientX - r.left) / r.width) * (X1 - X0), X0, X1),
      y: clamp(Y1 - ((e.clientY - r.top) / r.height) * (Y1 - Y0), Y0, Y1),
    };
  };
  const axisLabel = (hl: number, vx: number, vy: number) => ({
    x: clamp(sx(mx + (hl + 0.28) * vx), 16, W - 16),
    y: clamp(sy(my + (hl + 0.28) * vy), 14, H - 6),
  });
  const p1 = axisLabel(hl1, ux, uy), p2 = axisLabel(hl2, -uy, ux);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => setPoints(PRESETS[i].points)}
      />
      <Button active={project} onClick={() => setProject((v) => !v)}>
        project onto PC1
      </Button>
      <Readout>
        λ₁ = <strong>{l1.toFixed(2)}</strong> ({(r1 * 100).toFixed(0)}%) · λ₂ ={" "}
        <strong>{l2.toFixed(2)}</strong> ({(r2 * 100).toFixed(0)}%) · PC1 angle ={" "}
        <strong>{theta.toFixed(0)}°</strong>
        {project && (
          <>
            {" "}· reconstruction MSE = λ₂ = <strong>{l2.toFixed(2)}</strong>
          </>
        )}
      </Readout>
      <svg viewBox="0 0 340 46" className="mt-1 w-full" role="img"
        aria-label={`Explained variance: PC1 ${(r1 * 100).toFixed(0)} percent, PC2 ${(r2 * 100).toFixed(0)} percent`}>
        {[
          { r: r1, y: 4, col: AMBER, lab: "PC1" },
          { r: r2, y: 26, col: BLUE, lab: "PC2" },
        ].map(({ r, y, col, lab }) => (
          <g key={lab}>
            <text x="0" y={y + 12} fontSize="11" fill="currentColor">{lab}</text>
            <rect x="34" y={y} width={Math.max(1, r * 240)} height="15" rx="2" fill={col} />
            <text x={38 + Math.max(1, r * 240)} y={y + 12} fontSize="11" fill="currentColor">
              {(r * 100).toFixed(0)}%
            </text>
          </g>
        ))}
      </svg>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-2 block w-full max-w-90 select-none touch-none"
        role="img"
        aria-label={`Point cloud with principal axes: PC1 at ${theta.toFixed(0)} degrees explaining ${(r1 * 100).toFixed(0)} percent of variance${project ? ", points projected onto PC1" : ""}`}
        onPointerMove={(e) => {
          if (dragRef.current === null) return;
          const d = toData(e);
          movePoint(dragRef.current, d.x, d.y);
        }}
        onPointerUp={() => (dragRef.current = null)}
        onPointerCancel={() => (dragRef.current = null)}
      >
        <rect x="0" y="0" width={W} height={H} rx="4" fill="currentColor" opacity="0.04" />
        <line x1={sx(mx - hl1 * ux)} y1={sy(my - hl1 * uy)} x2={sx(mx + hl1 * ux)} y2={sy(my + hl1 * uy)}
          stroke={AMBER} strokeWidth="2.5" />
        <line x1={sx(mx + hl2 * uy)} y1={sy(my - hl2 * ux)} x2={sx(mx - hl2 * uy)} y2={sy(my + hl2 * ux)}
          stroke={BLUE} strokeWidth="2" />
        <text x={p1.x} y={p1.y} textAnchor="middle" fontSize="11" fontWeight="bold" fill={AMBER}>PC1</text>
        <text x={p2.x} y={p2.y} textAnchor="middle" fontSize="11" fontWeight="bold" fill={BLUE}>PC2</text>
        {points.map((p, i) => (
          <g key={i} className="cursor-move">
            {project && (
              <>
                <line x1={sx(p.x)} y1={sy(p.y)} x2={sx(proj[i].x)} y2={sy(proj[i].y)}
                  stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                <circle cx={sx(proj[i].x)} cy={sy(proj[i].y)} r="4.5" fill={AMBER} />
              </>
            )}
            <circle cx={sx(p.x)} cy={sy(p.y)} r="5" fill="currentColor" opacity={project ? 0.3 : 0.85} />
            <circle
              cx={sx(p.x)} cy={sy(p.y)} r="16" fill="transparent" tabIndex={0} role="button"
              aria-label={`Point at (${p.x.toFixed(1)}, ${p.y.toFixed(1)}); drag or use arrow keys to move`}
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
                movePoint(i, clamp(p.x + dx, X0, X1), clamp(p.y + dy, Y0, Y1));
              }}
            />
          </g>
        ))}
        <text x="8" y="16" fontSize="10" fill="currentColor" opacity="0.65">
          axis length ∝ explained variance{project ? " · dashed = residual" : ""}
        </text>
        <text x={W - 10} y={H - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">x₁</text>
        <text x="8" y={H - 8} fontSize="11" fill="currentColor" opacity="0.65">x₂</text>
      </svg>
    </Panel>
  );
}
