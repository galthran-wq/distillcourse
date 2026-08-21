"use client";

/**
 * SmootherRobustnessExplorer — n=50 1D scatter with three smooths refit on
 * every change: Nadaraya–Watson (tricube-weighted mean), local linear
 * (tricube weighted least squares), and robust LOESS (local linear + two
 * bisquare robustness iterations). Points drag in x and y. Guided task
 * (lesson): drag a mid-curve point off the trend — N–W and local linear
 * follow, LOESS cuts the point's vote to zero past six median residuals;
 * drag it to the left edge to see N–W fail twice (boundary bias + outlier);
 * bandwidth presets narrow/default/wide show the narrow fit tracking noise.
 */
import { useMemo, useRef, useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button } from "@/components/ui";

const AMBER = "#e2903a"; // Nadaraya–Watson
const BLUE = "#4c8dd6"; // local linear
const GREEN = "#5aa46a"; // robust LOESS
const X0 = 0, X1 = 1, Y0 = -2, Y1 = 4;
const W = 360, H = 270, N_GRID = 81;
const PRESETS = [
  { label: "narrow", h: 0.05 },
  { label: "default", h: 0.15 },
  { label: "wide", h: 0.4 },
];

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

// Sloped at both edges so N–W's boundary bias is visible on arrival (D3).
const trueF = (x: number) => 0.4 + 1.2 * x + Math.sin(3.1 * x);
// Seed chosen so the arrival state is canonical: at both edges N–W sits
// visibly off the trend while local linear tracks it (boundary bias, D3).
const DATA: Pt[] = (() => {
  const rng = mulberry32(110);
  const gauss = () =>
    Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
  return Array.from({ length: 50 }, (_, i) => {
    const x = (i + 0.5 + 0.6 * (rng() - 0.5)) / 50;
    return { x, y: trueF(x) + 0.3 * gauss() };
  });
})();

function tricube(u: number): number {
  const a = Math.abs(u);
  if (a >= 1) return 0;
  const t = 1 - a * a * a;
  return t * t * t;
}

/** One local fit at x0; deg 0 = N–W, deg 1 = local linear. Widens the
 *  window when it holds fewer than two weighted points (never NaN). */
function fitAt(x0: number, pts: Pt[], h: number, deg: 0 | 1, delta?: number[]): number {
  for (let hh = h; ; hh *= 1.7) {
    let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0, cnt = 0;
    for (let k = 0; k < pts.length; k++) {
      const w = tricube((pts[k].x - x0) / hh) * (delta ? delta[k] : 1);
      if (w <= 0) continue;
      cnt++;
      sw += w; swx += w * pts[k].x; swy += w * pts[k].y;
      swxx += w * pts[k].x * pts[k].x; swxy += w * pts[k].x * pts[k].y;
    }
    if (cnt < 2 && hh < 8) continue;
    if (sw <= 1e-9) return 0;
    const mx = swx / sw, my = swy / sw;
    if (deg === 0) return my;
    const vxx = swxx / sw - mx * mx;
    const beta = vxx > 1e-9 ? (swxy / sw - mx * my) / vxx : 0;
    return my + beta * (x0 - mx);
  }
}

/** Two bisquare robustness iterations; returns per-point weights and s. */
function robustWeights(pts: Pt[], h: number) {
  let delta = pts.map(() => 1);
  let s = 0;
  for (let iter = 0; iter < 2; iter++) {
    const e = pts.map((p) => p.y - fitAt(p.x, pts, h, 1, delta));
    const abs = e.map(Math.abs).sort((a, b) => a - b);
    s = (abs[24] + abs[25]) / 2;
    delta = e.map((ek) => {
      const u = Math.abs(ek) / Math.max(6 * s, 1e-9);
      return u >= 1 ? 0 : (1 - u * u) ** 2;
    });
  }
  return { delta, s };
}

const sx = (x: number) => ((x - X0) / (X1 - X0)) * W;
const sy = (y: number) => ((Y1 - y) / (Y1 - Y0)) * H;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function SmootherRobustnessExplorer() {
  const [points, setPoints] = useState<Pt[]>(DATA);
  const [h, setH] = useState<number>(PRESETS[1].h);
  const [watched, setWatched] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { delta, s } = useMemo(() => robustWeights(points, h), [points, h]);
  const curves = useMemo(() => {
    const xs = Array.from({ length: N_GRID }, (_, i) => X0 + (i / (N_GRID - 1)) * (X1 - X0));
    const path = (f: (x: number) => number) =>
      xs.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(clamp(f(x), Y0 - 1, Y1 + 1)).toFixed(1)}`).join(" ");
    return {
      nw: path((x) => fitAt(x, points, h, 0)),
      ll: path((x) => fitAt(x, points, h, 1)),
      loess: path((x) => fitAt(x, points, h, 1, delta)),
    };
  }, [points, h, delta]);

  const activePreset = PRESETS.findIndex((p) => p.h === h);
  const movePoint = (i: number, x: number, y: number) => {
    setWatched(i);
    setPoints((pts) => pts.map((p, j) => (j === i ? { x, y } : p)));
  };
  const toData = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: clamp(X0 + ((e.clientX - r.left) / r.width) * (X1 - X0), X0, X1),
      y: clamp(Y1 - ((e.clientY - r.top) / r.height) * (Y1 - Y0), Y0, Y1),
    };
  };
  const ratio = watched === null ? 0 : Math.abs(points[watched].y - fitAt(points[watched].x, points, h, 1, delta)) / Math.max(6 * s, 1e-9);

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PresetGroup
          labels={PRESETS.map((p) => p.label)}
          activeIndex={activePreset === -1 ? null : activePreset}
          onSelect={(i) => setH(PRESETS[i].h)}
        />
        <Button onClick={() => { setPoints(DATA); setWatched(null); }}>reset points</Button>
      </div>
      <Slider
        label="bandwidth h"
        value={h}
        min={0.03}
        max={0.5}
        step={0.01}
        onChange={setH}
        display={h.toFixed(2)}
        ariaLabel="Kernel bandwidth h"
      />
      <Readout>
        {watched === null ? (
          <>median |residual| s = <strong>{s.toFixed(2)}</strong> — drag a point off the trend</>
        ) : (
          <>
            moved point: |residual| = <strong>{ratio.toFixed(2)}</strong> × 6s → bisquare δ ={" "}
            <strong>{delta[watched].toFixed(2)}</strong>
            {delta[watched] === 0 && <> — vote deleted; LOESS refuses to follow</>}
          </>
        )}
      </Readout>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-2 block w-full max-w-100 select-none touch-none"
        role="img"
        aria-label={`Three smooths at bandwidth ${h.toFixed(2)}${watched !== null ? `; moved point bisquare weight ${delta[watched].toFixed(2)}` : ""}`}
        onPointerMove={(e) => {
          if (dragRef.current === null) return;
          const d = toData(e);
          movePoint(dragRef.current, d.x, d.y);
        }}
        onPointerUp={() => (dragRef.current = null)}
        onPointerCancel={() => (dragRef.current = null)}
      >
        <rect x="0" y="0" width={W} height={H} rx="4" fill="currentColor" opacity="0.04" />
        {points.map((p, i) => (
          <g key={i} className="cursor-move">
            <circle
              cx={sx(p.x)} cy={sy(p.y)} r={i === watched ? 5.5 : 3.5}
              fill="currentColor" opacity={i === watched ? 0.95 : 0.4}
            />
            {/* Points sit ~7px apart, so the hit circles tile the curve:
                a finger anywhere on the trend always lands on one. */}
            <circle
              cx={sx(p.x)} cy={sy(p.y)} r="12" fill="transparent"
              tabIndex={0} role="button"
              aria-label={`Point ${i + 1} at (${p.x.toFixed(2)}, ${p.y.toFixed(1)}); drag or use arrow keys to move`}
              onPointerDown={(e) => {
                dragRef.current = i;
                setWatched(i);
                svgRef.current?.setPointerCapture(e.pointerId);
              }}
              onKeyDown={(e) => {
                const dx = e.key === "ArrowRight" ? 0.02 : e.key === "ArrowLeft" ? -0.02 : 0;
                const dy = e.key === "ArrowUp" ? 0.2 : e.key === "ArrowDown" ? -0.2 : 0;
                if (dx === 0 && dy === 0) return;
                e.preventDefault();
                movePoint(i, clamp(p.x + dx, X0, X1), clamp(p.y + dy, Y0, Y1));
              }}
            />
          </g>
        ))}
        <path d={curves.nw} fill="none" stroke={AMBER} strokeWidth="2" strokeDasharray="5 4" />
        <path d={curves.ll} fill="none" stroke={BLUE} strokeWidth="2" />
        <path d={curves.loess} fill="none" stroke={GREEN} strokeWidth="2.5" />
        <text x="8" y="16" fontSize="11" fontWeight="bold" fill={AMBER}>Nadaraya–Watson</text>
        <text x="8" y="30" fontSize="11" fontWeight="bold" fill={BLUE}>local linear</text>
        <text x="8" y="44" fontSize="11" fontWeight="bold" fill={GREEN}>robust LOESS</text>
        <text x={W - 8} y={H - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">x</text>
        <text x="8" y={H - 8} fontSize="11" fill="currentColor" opacity="0.65">y</text>
      </svg>
    </Panel>
  );
}
