import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * BitsPerSpikeTally — a binned spike raster with a running information tally.
 *
 * Eight time bins; five carry a spike (amber tick). Above the raster, a
 * staircase gives the running information total in bits: it jumps by ~0.91
 * bit at each spike bin (amber vertical increment, aligned over the tick that
 * caused it) and stays flat over empty bins. A dashed guide of slope
 * "~1 bit per spike" shows the staircase hugging a straight line; the readout
 * reports I/E[R] ~= 0.91 bits/spike.
 *
 * One idea: information accumulates one spike at a time, roughly a bit each.
 * Inspiration: Borst & Theunissen (1999), Table 2 bits/spike column.
 *
 * Colors: amber = spikes and the increments they cause; currentColor = axis,
 * empty bins, and the running total (survives both themes).
 */

const W = 470;
const H = 330;

const PX0 = 58; // y-axis x
const PX1 = 450; // right edge of plot
const PTOP = 34; // top of plot (5 bits)
const PBOT = 210; // baseline (0 bits)
const YMAX = 5;

const BINS = 8;
const BW = (PX1 - PX0) / BINS;

// spike pattern over bins 1..8 (true = a spike tick in that bin)
const SPIKES = [false, true, true, false, true, false, true, true];
const INC = 0.91; // bits added per spike

// running cumulative bits, level AFTER each bin
const AFTER: number[] = [];
SPIKES.reduce((acc, s, i) => {
  const v = acc + (s ? INC : 0);
  AFTER[i] = v;
  return v;
}, 0);
const TOTAL = AFTER[BINS - 1];
const NSPIKES = SPIKES.filter(Boolean).length;

const RY = 258; // raster baseline
const yPx = (v: number) => PBOT - (v / YMAX) * (PBOT - PTOP);
const left = (i: number) => PX0 + i * BW;
const cx = (i: number) => PX0 + (i + 0.5) * BW;

const YTICKS = [0, 1, 2, 3, 4, 5];

export default function BitsPerSpikeTally() {
  // guide line endpoints: origin corner → final step top
  const gx0 = PX0;
  const gy0 = yPx(0);
  const gx1 = PX1;
  const gy1 = yPx(TOTAL);
  const gAngle = (Math.atan2(gy1 - gy0, gx1 - gx0) * 180) / Math.PI;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 22,
        maxWidth: 680,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* ── y gridlines + ticks ── */}
        {YTICKS.map((t) => {
          const y = yPx(t);
          return (
            <g key={`y${t}`}>
              <line
                x1={PX0}
                y1={y}
                x2={PX1}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity={t === 0 ? 0.45 : 0.1}
              />
              <text
                x={PX0 - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="currentColor"
                opacity="0.55"
              >
                {t}
              </text>
            </g>
          );
        })}
        {/* y-axis line */}
        <line
          x1={PX0}
          y1={PTOP}
          x2={PX0}
          y2={PBOT}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.45"
        />
        {/* y-axis title */}
        <text
          transform={`translate(15 ${(PTOP + PBOT) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="12"
          fill="currentColor"
          opacity="0.7"
        >
          information (bits)
        </text>

        {/* ── dashed guide: ~1 bit per spike ── */}
        <line
          x1={gx0}
          y1={gy0}
          x2={gx1}
          y2={gy1}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeDasharray="4 3"
          strokeOpacity="0.5"
        />
        <text
          transform={`translate(246 ${yPx(0) + (gy1 - gy0) * ((246 - gx0) / (gx1 - gx0)) - 8}) rotate(${gAngle})`}
          textAnchor="middle"
          fontSize="11.5"
          fill="currentColor"
          opacity="0.6"
        >
          ≈ 1 bit per spike
        </text>

        {/* ── running-total staircase ── */}
        {SPIKES.map((s, i) => {
          const before = i === 0 ? 0 : AFTER[i - 1];
          const after = AFTER[i];
          const yB = yPx(before);
          const yA = yPx(after);
          const xL = left(i);
          const xC = cx(i);
          const xR = left(i + 1);
          return (
            <g key={`step${i}`}>
              {/* horizontal at pre-jump level: bin left → center */}
              <line
                x1={xL}
                y1={yB}
                x2={s ? xC : xR}
                y2={yB}
                stroke="currentColor"
                strokeWidth="2"
                strokeOpacity="0.85"
              />
              {s && (
                <>
                  {/* amber vertical increment, aligned over the spike tick */}
                  <line
                    x1={xC}
                    y1={yB}
                    x2={xC}
                    y2={yA}
                    stroke={ACCENT}
                    strokeWidth="2.4"
                  />
                  {/* horizontal at post-jump level: center → bin right */}
                  <line
                    x1={xC}
                    y1={yA}
                    x2={xR}
                    y2={yA}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeOpacity="0.85"
                  />
                  {/* small tick showing +0.91 on the first increment */}
                </>
              )}
            </g>
          );
        })}
        {/* increment size annotation on the first jump */}
        <text
          x={cx(1) + 6}
          y={(yPx(0) + yPx(INC)) / 2 + 4}
          fontSize="11"
          fontWeight="600"
          fill={ACCENT}
        >
          +0.91
        </text>

        {/* ── raster: bin boxes + spike ticks ── */}
        {SPIKES.map((s, i) => {
          const xL = left(i);
          return (
            <g key={`bin${i}`}>
              <rect
                x={xL}
                y={RY - 20}
                width={BW}
                height={40}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity="0.28"
              />
              {s && (
                <line
                  x1={cx(i)}
                  y1={RY - 17}
                  x2={cx(i)}
                  y2={RY + 17}
                  stroke={ACCENT}
                  strokeWidth="2.6"
                />
              )}
              {/* dotted drop line tying spike tick to its increment */}
              {s && (
                <line
                  x1={cx(i)}
                  y1={PBOT}
                  x2={cx(i)}
                  y2={RY - 20}
                  stroke={ACCENT}
                  strokeWidth="1"
                  strokeDasharray="2 3"
                  strokeOpacity="0.35"
                />
              )}
            </g>
          );
        })}

        {/* time axis arrow + label */}
        <line
          x1={PX0}
          y1={RY + 32}
          x2={PX1}
          y2={RY + 32}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.45"
        />
        <path
          d={`M ${PX1} ${RY + 32} l -7 -3.5 l 0 7 z`}
          fill="currentColor"
          fillOpacity="0.45"
        />
        <text
          x={(PX0 + PX1) / 2}
          y={RY + 48}
          textAnchor="middle"
          fontSize="12"
          fill="currentColor"
          opacity="0.7"
        >
          time (spike raster, 8 bins)
        </text>
      </svg>

      {/* ── readout ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 150 }}>
        <div
          style={{
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 8,
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
          }}
        >
          <M
            display
            tex={String.raw`\frac{I}{\mathbb{E}[R]} \approx \textcolor{${ACCENT}}{0.91}`}
          />
          <div style={{ opacity: 0.75, fontSize: 12.5 }}>bits / spike</div>
        </div>
        <div style={{ fontSize: 12.5, opacity: 0.7, textAlign: "center" }}>
          {NSPIKES} spikes{"  →  "}
          <span style={{ color: ACCENT, fontWeight: 600 }}>{TOTAL.toFixed(2)} bits</span>
        </div>
      </div>
    </div>
  );
}
