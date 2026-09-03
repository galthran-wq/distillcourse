"use client";

/**
 * GpPosteriorExplorer — 1D GP regression with an SE kernel, refit on every
 * change by the lesson's own Algorithm 2.1 (Cholesky once, two triangular
 * solves, never an inverse). Click the plot (or the cursor slider + button)
 * to place an observation; the posterior mean and 95% band update live.
 * Guided task (lesson): pin the widest band on [0,1] under 1.00 with as few
 * points as possible at the medium lengthscale, then switch to short and
 * watch the same points stop sufficing — the prior is doing real work.
 * The band is drawn from where you measured only: y never enters the
 * variance, which is why the widest-gap marker is the whole strategy.
 */
import { useMemo, useRef, useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button, Switch } from "@/components/ui";

const AMBER = "#e2903a"; // posterior mean
const BLUE = "#4c8dd6"; // 95% band
const YLO = -2.6, YHI = 2.6;
const W = 360, H = 240, PL = 30, PR = 352, PT = 12, PB = 208;
const NGRID = 121, MAX_PTS = 24, TARGET = 1.0, SIGMA_N = 0.2, SIGMA_FREE = 0.02;
const PRESETS = [
  { label: "short", l: 0.05 },
  { label: "medium", l: 0.15 },
  { label: "long", l: 0.4 },
];

type Pt = { x: number; y: number };

const sx = (x: number) => PL + x * (PR - PL);
const sy = (y: number) =>
  PT + ((YHI - Math.min(YHI, Math.max(YLO, y))) / (YHI - YLO)) * (PB - PT);
const kern = (a: number, b: number, l: number) => Math.exp(-((a - b) ** 2) / (2 * l * l));

// The latent function the observations are read off, so placing a point is
// one choice (where) rather than two — and the mean has something to converge to.
const trueF = (x: number) => 0.9 * Math.sin(5.5 * x - 0.8) + 0.5 * x;
// Deterministic jitter: the same x always yields the same y, so toggling a
// control never silently redraws the data underneath the comparison.
const jitter = (x: number) => {
  const s = Math.sin(x * 127.1) * 43758.5453;
  return 2 * (s - Math.floor(s)) - 1;
};
const observe = (x: number): Pt => ({ x, y: trueF(x) + 0.18 * jitter(x) });

/** Algorithm 2.1: L = chol(K + σn²I), α = Lᵀ\(L\y), v = L\k*, V = 1 − vᵀv. */
function posterior(pts: Pt[], l: number, sn: number) {
  const grid = Array.from({ length: NGRID }, (_, i) => i / (NGRID - 1));
  const n = pts.length;
  if (n === 0) return { grid, mean: grid.map(() => 0), sd: grid.map(() => 1) };
  const L = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = kern(pts[i].x, pts[j].x, l) + (i === j ? sn * sn : 0);
      for (let m = 0; m < j; m++) s -= L[i][m] * L[j][m];
      L[i][j] = i === j ? Math.sqrt(Math.max(s, 1e-10)) : s / L[j][j];
    }
  }
  const solveL = (b: number[]) => {
    const y = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      let s = b[i];
      for (let m = 0; m < i; m++) s -= L[i][m] * y[m];
      y[i] = s / L[i][i];
    }
    return y;
  };
  const z = solveL(pts.map((p) => p.y));
  const alpha = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = z[i];
    for (let m = i + 1; m < n; m++) s -= L[m][i] * alpha[m];
    alpha[i] = s / L[i][i];
  }
  const mean: number[] = [], sd: number[] = [];
  for (const x of grid) {
    const ks = pts.map((p) => kern(p.x, x, l));
    const v = solveL(ks);
    mean.push(ks.reduce((a, b, i) => a + b * alpha[i], 0));
    sd.push(Math.sqrt(Math.max(1 - v.reduce((a, b) => a + b * b, 0), 0)));
  }
  return { grid, mean, sd };
}

export default function GpPosteriorExplorer() {
  // D3: three observations already placed — the band pinches at each and
  // reopens between them before the learner touches anything.
  const [pts, setPts] = useState<Pt[]>(() => [0.15, 0.5, 0.85].map(observe));
  const [l, setL] = useState(PRESETS[1].l);
  const [noisy, setNoisy] = useState(true);
  const [cursor, setCursor] = useState(0.5);
  const svgRef = useRef<SVGSVGElement>(null);

  const sn = noisy ? SIGMA_N : SIGMA_FREE;
  const { grid, mean, sd } = useMemo(() => posterior(pts, l, sn), [pts, l, sn]);

  let wi = 0;
  for (let i = 1; i < sd.length; i++) if (sd[i] > sd[wi]) wi = i;
  const widest = 2 * 1.96 * sd[wi];
  const met = widest <= TARGET;

  const paths = useMemo(() => {
    const line = (f: (i: number) => number) =>
      grid.map((x, i) => `${i ? "L" : "M"}${sx(x).toFixed(1)} ${sy(f(i)).toFixed(1)}`).join(" ");
    // The band closes by walking the lower edge back to x = 0.
    const back = grid
      .map((_, i) => NGRID - 1 - i)
      .map((j) => `L${sx(grid[j]).toFixed(1)} ${sy(mean[j] - 1.96 * sd[j]).toFixed(1)}`)
      .join(" ");
    return {
      mean: line((i) => mean[i]),
      truth: line((i) => trueF(grid[i])),
      band: `${line((i) => mean[i] + 1.96 * sd[i])} ${back} Z`,
    };
  }, [grid, mean, sd]);

  const add = (x: number) => setPts((p) => (p.length >= MAX_PTS ? p : [...p, observe(x)]));
  const activePreset = PRESETS.findIndex((p) => p.l === l);

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PresetGroup
          labels={PRESETS.map((p) => p.label)}
          activeIndex={activePreset === -1 ? null : activePreset}
          onSelect={(i) => setL(PRESETS[i].l)}
        />
        <Button onClick={() => setPts([])}>clear points</Button>
      </div>

      <Slider
        label="lengthscale ℓ"
        value={l}
        min={0.03}
        max={0.5}
        step={0.01}
        onChange={setL}
        display={l.toFixed(2)}
        ariaLabel="Squared-exponential lengthscale"
      />

      <div className="flex items-center gap-3 py-2 text-sm">
        <Switch on={noisy} label="Observation noise" onToggle={() => setNoisy((v) => !v)} />
        <span>
          noise σ<sub>n</sub> = <span className="font-mono">{sn.toFixed(2)}</span>
          {noisy ? "" : " — near noise-free, the GP interpolates"}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Slider
            label="cursor x"
            value={cursor}
            min={0}
            max={1}
            step={0.01}
            onChange={setCursor}
            display={cursor.toFixed(2)}
            ariaLabel="Where the next observation goes"
          />
        </div>
        <Button onClick={() => add(cursor)}>add observation</Button>
      </div>

      <Readout>
        {pts.length} point{pts.length === 1 ? "" : "s"} — widest 95% band on [0,1] ={" "}
        <strong>{widest.toFixed(2)}</strong> at x = {grid[wi].toFixed(2)}
        {met ? (
          <> — <strong>target met</strong> (≤ {TARGET.toFixed(2)}) with {pts.length} points</>
        ) : (
          <> — target ≤ {TARGET.toFixed(2)}; the marker shows where to measure next</>
        )}
      </Readout>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto mt-2 block w-full max-w-125 cursor-crosshair select-none touch-none"
        role="img"
        aria-label={`Gaussian process posterior over ${pts.length} observations at lengthscale ${l.toFixed(2)}; widest 95% band ${widest.toFixed(2)} at x equals ${grid[wi].toFixed(2)}`}
        onPointerDown={(e) => {
          const r = svgRef.current!.getBoundingClientRect();
          const vx = ((e.clientX - r.left) / r.width) * W;
          const x = Math.min(1, Math.max(0, (vx - PL) / (PR - PL)));
          setCursor(Number(x.toFixed(2)));
          add(x);
        }}
      >
        <rect x={PL} y={PT} width={PR - PL} height={PB - PT} rx="4" fill="currentColor" opacity="0.04" />
        <path d={paths.band} fill={BLUE} opacity="0.2" />
        <path d={paths.truth} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.45" />
        <path d={paths.mean} fill="none" stroke={AMBER} strokeWidth="2.5" />
        {/* The widest-band marker is the strategy made visible: it moves to
            the biggest gap, never to wherever the y-values happen to be. */}
        <line
          x1={sx(grid[wi])} x2={sx(grid[wi])}
          y1={sy(mean[wi] + 1.96 * sd[wi])} y2={sy(mean[wi] - 1.96 * sd[wi])}
          stroke={met ? "#5aa46a" : BLUE} strokeWidth="2"
        />
        {pts.map((p, i) => (
          <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill="currentColor" opacity="0.85" />
        ))}
        <line x1={PL} x2={PR} y1={sy(0)} y2={sy(0)} stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <text x={PL} y={H - 6} fontSize="11" fill="currentColor" opacity="0.65">x = 0</text>
        <text x={PR} y={H - 6} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">1</text>
        {[2, 0, -2].map((t) => (
          <text key={t} x={PL - 4} y={sy(t) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.65">
            {t < 0 ? "−2" : t}
          </text>
        ))}
        <text x={PL + 6} y={PT + 14} fontSize="11" fontWeight="bold" fill={AMBER}>posterior mean</text>
        <text x={PL + 6} y={PT + 28} fontSize="11" fontWeight="bold" fill={BLUE}>95% band</text>
      </svg>
    </Panel>
  );
}
