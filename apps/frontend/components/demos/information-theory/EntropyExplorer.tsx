"use client";

/**
 * EntropyExplorer — drag the bars of a 4-outcome distribution (they
 * renormalize to sum 1) and watch H(X) = -sum p log2 p respond live.
 * Guided task (lesson caption): make H hit exactly 0, rebuild to the
 * 2-bit maximum, then try to beat 2 bits with any shape.
 */
import { useRef, useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

type Dist = [number, number, number, number];

const PRESETS: { label: string; p: Dist }[] = [
  { label: "Uniform", p: [0.25, 0.25, 0.25, 0.25] },
  { label: "Certain", p: [1, 0, 0, 0] },
  { label: "Skewed", p: [0.5, 0.25, 0.125, 0.125] },
];

const OUTCOMES = ["A", "B", "C", "D"] as const;
const H_MAX = 2; // log2(4)

// SVG geometry (user units)
const VW = 480;
const VH = 248;
const X0 = 40;
const X1 = 470;
const Y_TOP = 14;
const Y_BASE = 214;
const SLOT = (X1 - X0) / 4;
const BAR_W = SLOT * 0.58;

function yOf(p: number): number {
  return Y_BASE - p * (Y_BASE - Y_TOP);
}

function entropy(p: Dist): number {
  return p.reduce((h, v) => (v > 0 ? h - v * Math.log2(v) : h), 0);
}

export default function EntropyExplorer() {
  // D3: open on the skewed shape from the worked example — already mid-scale,
  // so the Uniform/Certain presets both visibly move H.
  const [p, setP] = useState<Dist>(PRESETS[2].p);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragIdx = useRef<number | null>(null);

  // Set outcome i to t and renormalize the rest proportionally (sum stays 1).
  function setOutcome(i: number, t: number) {
    setP((prev) => {
      const clamped = Math.min(1, Math.max(0, Math.round(t * 100) / 100));
      const rest = 1 - prev[i];
      return prev.map((v, j) =>
        j === i
          ? clamped
          : rest > 1e-9
            ? (v / rest) * (1 - clamped)
            : (1 - clamped) / 3,
      ) as Dist;
    });
  }

  function dragTo(e: React.PointerEvent<SVGSVGElement>, lockIdx?: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = ((e.clientX - rect.left) / rect.width) * VW;
    const sy = ((e.clientY - rect.top) / rect.height) * VH;
    const idx =
      lockIdx ?? Math.min(3, Math.max(0, Math.floor((sx - X0) / SLOT)));
    dragIdx.current = idx;
    setOutcome(idx, (Y_BASE - sy) / (Y_BASE - Y_TOP));
  }

  const H = entropy(p);
  const hitZero = H < 0.005;
  const hitMax = H > 1.995;
  const activePreset = PRESETS.findIndex((pr) =>
    pr.p.every((v, i) => Math.abs(v - p[i]) < 1e-9),
  );

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setP(PRESETS[i].p)}
      />

      <Readout>
        H(X) = <strong className="text-base">{H.toFixed(2)} bits</strong>
        {hitZero && (
          <span className="pl-2 font-medium text-accent">
            exactly 0 — certainty never surprises
          </span>
        )}
        {hitMax && (
          <span className="pl-2 font-medium text-accent">
            2.00 bits = log&#8322;4 — the maximum; no shape beats uniform
          </span>
        )}
      </Readout>

      {/* 0-to-2-bit gauge: the ceiling makes "try to beat 2 bits" visible */}
      <div className="mt-1 h-2 w-full rounded-sm bg-line">
        <div
          className="h-2 rounded-sm bg-accent"
          style={{ width: `${(Math.min(H, H_MAX) / H_MAX) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs opacity-70">
        <span>0</span>
        <span>max = log&#8322;4 = 2 bits</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full touch-none select-none"
        role="img"
        aria-label={`Bar chart of the four outcome probabilities ${p
          .map((v, i) => `${OUTCOMES[i]} ${v.toFixed(2)}`)
          .join(", ")}; entropy ${H.toFixed(2)} bits`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragTo(e);
        }}
        onPointerMove={(e) => {
          if (dragIdx.current !== null) dragTo(e, dragIdx.current);
        }}
        onPointerUp={() => (dragIdx.current = null)}
        onPointerCancel={() => (dragIdx.current = null)}
      >
        {/* axes + p ticks */}
        <line x1={X0} y1={Y_TOP} x2={X0} y2={Y_BASE} stroke="currentColor" />
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={X0 - 4} y1={yOf(t)} x2={X0} y2={yOf(t)} stroke="currentColor" />
            <text x={X0 - 7} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill="currentColor">
              {t}
            </text>
          </g>
        ))}
        {/* dashed guide at 1/4 — the uniform height */}
        <line
          x1={X0}
          y1={yOf(0.25)}
          x2={X1}
          y2={yOf(0.25)}
          stroke="currentColor"
          strokeDasharray="4 4"
          opacity="0.45"
        />
        <text x={X1} y={yOf(0.25) - 5} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
          &frac14; = uniform
        </text>
        {/* bars */}
        {p.map((v, i) => {
          const cx = X0 + SLOT * (i + 0.5);
          return (
            <g key={OUTCOMES[i]} style={{ cursor: "ns-resize" }}>
              {/* full-height invisible hit zone so tiny bars stay draggable */}
              <rect x={cx - SLOT / 2} y={Y_TOP} width={SLOT} height={Y_BASE - Y_TOP} fill="transparent" />
              <rect
                x={cx - BAR_W / 2}
                y={yOf(v)}
                width={BAR_W}
                height={Y_BASE - yOf(v)}
                rx="3"
                fill="#e2903a"
              />
              <text x={cx} y={yOf(v) - 6} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">
                {v.toFixed(2)}
              </text>
              <text x={cx} y={Y_BASE + 18} textAnchor="middle" fontSize="12" fill="currentColor">
                {OUTCOMES[i]}
              </text>
            </g>
          );
        })}
        <text x={12} y={(Y_TOP + Y_BASE) / 2} textAnchor="middle" fontSize="12" fill="currentColor" transform={`rotate(-90 12 ${(Y_TOP + Y_BASE) / 2})`}>
          p
        </text>
      </svg>

      {/* keyboard path: one native slider per outcome, same renormalization */}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {p.map((v, i) => (
          <Slider
            key={OUTCOMES[i]}
            label={OUTCOMES[i]}
            value={v}
            min={0}
            max={1}
            step={0.01}
            onChange={(t) => setOutcome(i, t)}
            display={v.toFixed(2)}
            ariaLabel={`Probability of outcome ${OUTCOMES[i]}`}
          />
        ))}
      </div>
    </Panel>
  );
}
