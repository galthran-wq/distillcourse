"use client";

/**
 * JointEntropyGrid — drag the four cell masses of a 2×2 sky × rain joint
 * table (auto-renormalized to sum 1) and watch H(rain), H(rain|sky), and
 * their difference respond. Guided task (lesson): the presets give drop
 * 0 / partial / full at fixed H(rain); dragging mass into clear·wet of
 * Realistic shrinks the difference toward 0 as the rows grow proportional.
 */
import { useRef, useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

type Cells = [number, number, number, number]; // clear·dry, clear·wet, overcast·dry, overcast·wet

// All three presets share the column sums (3/4, 1/4), so H(rain) = 0.811
// bits throughout and only the coupling — hence the difference — changes.
const PRESETS: { label: string; p: Cells }[] = [
  { label: "Independent", p: [0.375, 0.125, 0.375, 0.125] },
  { label: "Realistic", p: [0.5, 0, 0.25, 0.25] },
  { label: "Perfectly linked", p: [0.75, 0, 0, 0.25] },
];

const ROWS = ["clear", "overcast"] as const;
const COLS = ["dry", "wet"] as const;

// SVG geometry (user units)
const VW = 480;
const VH = 274;
const GX = 96; // grid left edge
const COL_W = 160;
const ROW_T = [28, 140] as const; // cell tops; boundary between rows ≈ 134
const CELL_H = 100;
const BAR_W = 92;

function entropy(dist: number[]): number {
  return dist.reduce((h, v) => (v > 1e-12 ? h - v * Math.log2(v) : h), 0);
}

function fmtP(v: number): string {
  return String(Math.round(v * 1000) / 1000);
}

export default function JointEntropyGrid() {
  // D3: open on the lesson's weather table — a partial 0.31-bit drop.
  const [c, setC] = useState<Cells>(PRESETS[1].p);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragIdx = useRef<number | null>(null);

  // Set cell i to t and renormalize the other three proportionally.
  function setCell(i: number, t: number) {
    setC((prev) => {
      const v = Math.min(1, Math.max(0, Math.round(t * 200) / 200));
      const rest = 1 - prev[i];
      return prev.map((w, j) =>
        j === i ? v : rest > 1e-9 ? (w / rest) * (1 - v) : (1 - v) / 3,
      ) as Cells;
    });
  }

  function dragTo(e: React.PointerEvent<SVGSVGElement>, lockIdx?: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = ((e.clientX - rect.left) / rect.width) * VW;
    const sy = ((e.clientY - rect.top) / rect.height) * VH;
    const i =
      lockIdx ?? (sy < 134 ? 0 : 2) + (sx < GX + COL_W ? 0 : 1);
    dragIdx.current = i;
    setCell(i, (ROW_T[i >> 1] + CELL_H - sy) / CELL_H);
  }

  const pClear = c[0] + c[1];
  const pOver = c[2] + c[3];
  const pDry = c[0] + c[2];
  const pWet = c[1] + c[3];
  const HY = entropy([pDry, pWet]);
  const HYgX =
    (pClear > 1e-12 ? pClear * entropy([c[0] / pClear, c[1] / pClear]) : 0) +
    (pOver > 1e-12 ? pOver * entropy([c[2] / pOver, c[3] / pOver]) : 0);
  const drop = Math.max(0, HY - HYgX);
  const independent = drop < 0.005;
  const determined = HYgX < 0.005 && HY > 0.005;
  const activePreset = PRESETS.findIndex((pr) =>
    pr.p.every((v, i) => Math.abs(v - c[i]) < 1e-9),
  );

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setC(PRESETS[i].p)}
      />

      <Readout>
        H(rain) = <strong>{HY.toFixed(2)}</strong>, H(rain&thinsp;|&thinsp;sky) ={" "}
        <strong>{HYgX.toFixed(2)}</strong>, difference ={" "}
        <strong>{drop.toFixed(2)} bits</strong>
        {independent && (
          <span className="pl-2 font-medium text-accent">
            rows proportional — sky says nothing about rain
          </span>
        )}
        {determined && (
          <span className="pl-2 font-medium text-accent">
            sky determines rain — all of H(rain) is the difference
          </span>
        )}
      </Readout>

      {/* H(rain) split on a 1-bit scale: difference (accent) + leftover */}
      <div className="mt-1 flex h-2 w-full rounded bg-line">
        <div className="h-2 rounded-l bg-accent" style={{ width: `${drop * 100}%` }} />
        <div className="h-2 rounded-r bg-faint" style={{ width: `${HYgX * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs opacity-70">
        <span>difference + leftover H(rain&thinsp;|&thinsp;sky) = H(rain)</span>
        <span>1 bit</span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full touch-none select-none"
        role="img"
        aria-label={`Joint table: ${c
          .map((v, i) => `${ROWS[i >> 1]} ${COLS[i & 1]} ${fmtP(v)}`)
          .join(", ")}; H(rain) ${HY.toFixed(2)} bits, H(rain given sky) ${HYgX.toFixed(2)} bits`}
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
        {/* column and row labels, marginal headers */}
        {COLS.map((col, j) => (
          <text key={col} x={GX + COL_W * (j + 0.5)} y={16} textAnchor="middle" fontSize="12" fill="currentColor">
            {col}
          </text>
        ))}
        <text x={GX + 2 * COL_W + 8} y={16} fontSize="11" fill="currentColor" opacity="0.7">
          p(sky)
        </text>
        <text x={GX - 8} y={ROW_T[1] + CELL_H + 18} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
          p(rain)
        </text>
        {ROWS.map((row, i) => (
          <g key={row}>
            <text x={GX - 8} y={ROW_T[i] + CELL_H / 2 + 4} textAnchor="end" fontSize="12" fill="currentColor">
              {row}
            </text>
            <text x={GX + 2 * COL_W + 8} y={ROW_T[i] + CELL_H / 2 + 4} fontSize="12" fill="currentColor" opacity="0.7">
              {fmtP(i === 0 ? pClear : pOver)}
            </text>
          </g>
        ))}
        {[pDry, pWet].map((v, j) => (
          <text key={COLS[j]} x={GX + COL_W * (j + 0.5)} y={ROW_T[1] + CELL_H + 18} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.7">
            {fmtP(v)}
          </text>
        ))}
        {/* cells: outline, full-cell hit zone, mass bar, value label */}
        {c.map((v, i) => {
          const x = GX + (i & 1) * COL_W;
          const top = ROW_T[i >> 1];
          const barY = top + CELL_H - v * CELL_H;
          return (
            <g key={`${ROWS[i >> 1]}-${COLS[i & 1]}`} style={{ cursor: "ns-resize" }}>
              <rect x={x} y={top} width={COL_W} height={CELL_H} fill="transparent" stroke="currentColor" opacity="0.35" />
              <rect x={x + (COL_W - BAR_W) / 2} y={barY} width={BAR_W} height={v * CELL_H} rx="3" fill="#e2903a" />
              <text x={x + COL_W / 2} y={Math.max(barY - 5, top + 12)} textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">
                {fmtP(v)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* keyboard path: one native slider per cell, same renormalization */}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        {c.map((v, i) => (
          <Slider
            key={`${ROWS[i >> 1]}-${COLS[i & 1]}`}
            label={`${ROWS[i >> 1]} · ${COLS[i & 1]}`}
            value={v}
            min={0}
            max={1}
            step={0.005}
            onChange={(t) => setCell(i, t)}
            display={fmtP(v)}
            ariaLabel={`Joint probability of ${ROWS[i >> 1]} sky and ${COLS[i & 1]} ground`}
          />
        ))}
      </div>
    </Panel>
  );
}
