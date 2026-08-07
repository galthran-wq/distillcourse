"use client";

/**
 * DynamicArrayGrowth — click-driven dynamic array with doubling. An append
 * into a full array copies everything into a block twice the size (copied
 * slots turn blue, the new element amber — the lesson's figure color code);
 * the chart logs each append's slot-write cost and the running average,
 * whose spikes double in height and spacing while the average stays pinned
 * under the amortized bound of 3. Guided task (lesson <Task>): predict the
 * expensive append numbers (capacity + 1), then append past 50 and confirm
 * the average holds below 3. Presets: the lesson's 17-append worked trace
 * (initial state), start empty, pre-sized to 8 (the exercise's setup).
 */
import { useState } from "react";
import { Panel, PresetGroup, Button, Readout } from "@/components/ui";

const AMBER = "#e2903a"; // newly written element / running-average line
const BLUE = "#4c8dd6"; // elements copied by a resize / cost spikes
const MAX_N = 100; // capacity tops out at 128 = full strip width

const PRESETS = [
  { label: "Worked trace (17 appends)", cap: 0, count: 17 },
  { label: "Start empty", cap: 0, count: 0 },
  { label: "Pre-sized to 8", cap: 8, count: 0 },
];

/** Deterministic replay of `count` appends from an empty array of `initCap` slots. */
function simulate(initCap: number, count: number) {
  let capacity = initCap;
  let total = 0;
  const costs: number[] = [];
  const avgs: number[] = [];
  const spikes: number[] = []; // 1-based append numbers that copied elements
  for (let i = 1; i <= count; i++) {
    let cost = 1; // the append's own slot-write
    if (i - 1 === capacity) {
      cost += i - 1; // copy the i−1 elements already stored
      capacity = Math.max(1, capacity * 2);
      if (i > 1) spikes.push(i); // the first-ever append copies nothing
    }
    total += cost;
    costs.push(cost);
    avgs.push(total / i);
  }
  return { capacity, costs, avgs, total, spikes };
}

// chart geometry (SVG user units)
const PX = 40, PW = 428, PY = 12, PH = 160, BOTTOM = PY + PH;
const BW = PW / MAX_N; // one bar slot per possible append
const SLOT_W = PW / 128; // array strip: fixed scale, so capacity doubles visibly

export default function DynamicArrayGrowth() {
  // D3: opens on the worked trace — spikes at 2, 3, 5, 9, 17 and the
  // 48/17 ≈ 2.8 average are on screen before the first click.
  const [initCap, setInitCap] = useState(PRESETS[0].cap);
  const [count, setCount] = useState(PRESETS[0].count);

  const { capacity, costs, avgs, total, spikes } = simulate(initCap, count);
  const lastCost = costs[count - 1] ?? 0;
  const lastResized = lastCost > 1;
  const avg = count > 0 ? total / count : 0;
  const yMax = Math.max(10, Math.max(0, ...costs) + 2);
  const y = (v: number) => BOTTOM - (v / yMax) * PH;
  const avgLine = avgs
    .map((a, i) => `${(PX + (i + 0.5) * BW).toFixed(1)},${y(a).toFixed(1)}`)
    .join(" ");
  const activePreset = PRESETS.findIndex(
    (p) => p.cap === initCap && p.count === count,
  );
  const full = count >= MAX_N;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setInitCap(PRESETS[i].cap);
          setCount(PRESETS[i].count);
        }}
      />
      <div className="flex flex-wrap gap-2 pb-1">
        <Button disabled={full} className="disabled:opacity-40" onClick={() => setCount((c) => Math.min(MAX_N, c + 1))}>
          append
        </Button>
        <Button disabled={full} className="disabled:opacity-40" onClick={() => setCount((c) => Math.min(MAX_N, c + 10))}>
          append ×10
        </Button>
      </div>
      <Readout>
        {count === 0 ? (
          <>
            Empty, capacity {capacity}. Predict which append numbers will be
            expensive before clicking — a resize fires when an append finds
            the array full.
          </>
        ) : (
          <>
            Append {count} cost <strong>{lastCost}</strong>{" "}
            {lastResized ? (
              <>slot-writes — copied {count - 1} elements into a block of {capacity}. </>
            ) : (
              <>slot-write into a free slot. </>
            )}
            Total {total} writes over {count} appends: average{" "}
            <strong>{avg.toFixed(2)}</strong>. Expensive so far:{" "}
            {spikes.length > 0 ? spikes.join(", ") : "none yet"}.
            {count >= 50 && <> Past 50 appends the average still holds under 3.</>}
            {full && <> Limit of {MAX_N} appends reached — pick a preset to reset.</>}
          </>
        )}
      </Readout>

      <svg
        viewBox="0 0 480 60"
        className="mt-2 w-full"
        role="img"
        aria-label={`Backing array: ${count} of ${capacity} slots filled.${lastResized ? ` The last append copied ${count - 1} elements.` : ""}`}
      >
        {capacity === 0 ? (
          <text x={PX} y={26} fontSize="12" fill="currentColor" opacity="0.7">
            no block yet — the first append allocates 1 slot
          </text>
        ) : (
          Array.from({ length: capacity }, (_, s) => (
            <rect
              key={s}
              x={PX + s * SLOT_W + 0.4} y={6}
              width={Math.max(SLOT_W - 0.8, 0.8)} height={22}
              className="transition-colors duration-150"
              fill={s >= count ? "none" : s === count - 1 ? AMBER : lastResized ? BLUE : "currentColor"}
              opacity={s < count - 1 && !lastResized ? 0.3 : 1}
              stroke="currentColor" strokeOpacity={0.35} strokeWidth="0.6"
            />
          ))
        )}
        <text x={PX} y={50} fontSize="11" fill="currentColor" opacity="0.7">
          n = {count} of capacity {capacity}
        </text>
        {lastResized && (
          <text x={PX + PW} y={50} textAnchor="end" fontSize="11" fontWeight="bold" fill={BLUE}>
            resize: {count - 1} copies (blue)
          </text>
        )}
      </svg>

      <svg
        viewBox="0 0 480 212"
        className="mt-1 w-full select-none"
        role="img"
        aria-label={`Per-append cost for ${count} appends: spikes of doubling height at each resize, running average ${avg.toFixed(2)}, dashed guide at the amortized bound of 3.`}
      >
        <line x1={PX} y1={BOTTOM} x2={PX + PW} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        <line x1={PX} y1={PY} x2={PX} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        {[1, 25, 50, 75, 100].map((t) => (
          <g key={t}>
            <line x1={PX + (t - 0.5) * BW} y1={BOTTOM} x2={PX + (t - 0.5) * BW} y2={BOTTOM + 4} stroke="currentColor" opacity="0.5" />
            <text x={PX + (t - 0.5) * BW} y={BOTTOM + 17} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {t}
            </text>
          </g>
        ))}
        <text x={PX + PW / 2} y={BOTTOM + 34} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
          append number
        </text>
        {[1, Math.round(yMax / 2), yMax].map((t) => (
          <text key={t} x={PX - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">
            {t}
          </text>
        ))}
        <text x={12} y={PY + PH / 2} fontSize="11" fill="currentColor" opacity="0.7" textAnchor="middle" transform={`rotate(-90 12 ${PY + PH / 2})`}>
          slot-writes
        </text>
        {costs.map((c, i) => (
          <rect
            key={i}
            x={PX + i * BW + 0.4} y={y(c)}
            width={Math.max(BW - 0.8, 1)} height={BOTTOM - y(c)}
            fill={c > 1 ? BLUE : "currentColor"} opacity={c > 1 ? 0.9 : 0.35}
          />
        ))}
        <line x1={PX} y1={y(3)} x2={PX + PW} y2={y(3)} stroke="currentColor" strokeDasharray="5 4" opacity="0.6" />
        <text x={PX + PW} y={y(3) - 5} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.75">
          3 — amortized bound
        </text>
        {count > 0 && (
          <>
            <polyline points={avgLine} fill="none" stroke={AMBER} strokeWidth="2" />
            <text
              x={Math.min(PX + (count - 0.5) * BW + 5, PX + PW - 4)}
              y={Math.max(y(avg) - 6, PY + 10)}
              textAnchor={count > 80 ? "end" : "start"}
              fontSize="11" fontWeight="bold" fill={AMBER}
            >
              average {avg.toFixed(2)}
            </text>
          </>
        )}
      </svg>
    </Panel>
  );
}
