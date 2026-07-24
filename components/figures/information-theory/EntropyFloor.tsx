import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * EntropyFloor — expected code length vs the entropy floor.
 *
 * Horizontal bar chart: the balanced code costs L = 2.00 bits/symbol, the
 * matched code L = 1.75; a dashed blue line marks H(X) ≈ 1.74 bits, the
 * floor no code crosses. The ≈0.01-bit sliver between the matched bar's end
 * and the floor is called out with a leader arrow.
 *
 * One idea: L is the cost, H is the floor.
 */

const W = 620;
const HGT = 174;
const X0 = 130; // axis origin (bits = 0)
const PPB = 200; // px per bit
const xOf = (v: number) => X0 + v * PPB;

const H_X = 1.743;
const BAR_H = 26;
const BAR1_Y = 40; // balanced code
const BAR2_Y = 78; // matched code
const AXIS_Y = 134;
const FLOOR_X = xOf(H_X);

export default function EntropyFloor() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: HGT,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* balanced code: outline bar to 2.00 */}
        <rect
          x={X0}
          y={BAR1_Y}
          width={xOf(2) - X0}
          height={BAR_H}
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* matched code: amber bar to 1.75 */}
        <rect
          x={X0}
          y={BAR2_Y}
          width={xOf(1.75) - X0}
          height={BAR_H}
          rx="3"
          fill={ACCENT}
          opacity="0.9"
        />
        {/* entropy floor: dashed blue vertical line spanning both bars */}
        <line
          x1={FLOOR_X}
          y1={BAR1_Y - 14}
          x2={FLOOR_X}
          y2={BAR2_Y + BAR_H + 10}
          stroke={SUPPORT}
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />
        {/* gap leader arrow: from the label up-left into the sliver between
            the matched bar's end and the floor line */}
        <path
          d={`M ${xOf(1.75) + 34} ${BAR2_Y + BAR_H + 22} L ${xOf(1.75) + 1} ${BAR2_Y + BAR_H + 3}`}
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          opacity="0.75"
        />
        <path
          d={`M ${xOf(1.75) + 1} ${BAR2_Y + BAR_H + 3} l 6.5 1.2 l -2.6 6.1 Z`}
          fill="currentColor"
          opacity="0.75"
        />
        {/* axis */}
        <line
          x1={X0}
          y1={AXIS_Y}
          x2={xOf(2.25)}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <g key={v}>
            <line
              x1={xOf(v)}
              y1={AXIS_Y}
              x2={xOf(v)}
              y2={AXIS_Y + 5}
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <text
              x={xOf(v)}
              y={AXIS_Y + 19}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              opacity="0.7"
            >
              {v}
            </text>
          </g>
        ))}
        <text
          x={xOf(2.25) + 10}
          y={AXIS_Y + 4}
          fontSize="12"
          fill="currentColor"
          opacity="0.55"
          fontStyle="italic"
        >
          bits
        </text>
      </svg>

      {/* row labels */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: BAR1_Y,
          width: X0 - 12,
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        balanced code
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: BAR2_Y,
          width: X0 - 12,
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          color: ACCENT,
          fontWeight: 600,
        }}
      >
        matched code
      </div>

      {/* bar-end labels */}
      <div
        style={{
          position: "absolute",
          left: xOf(2) + 10,
          top: BAR1_Y,
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <M tex={String.raw`L = 2.00\ \text{bits}`} />
      </div>
      <div
        style={{
          position: "absolute",
          left: xOf(1.75) + 10,
          top: BAR2_Y,
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          color: ACCENT,
          whiteSpace: "nowrap",
        }}
      >
        <M tex={String.raw`\textcolor{${ACCENT}}{L = 1.75\ \text{bits}}`} />
      </div>

      {/* entropy floor label, above the dashed line */}
      <div
        style={{
          position: "absolute",
          left: FLOOR_X,
          top: 2,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          color: SUPPORT,
        }}
      >
        <M tex={String.raw`\textcolor{${SUPPORT}}{H(X) \approx 1.74\ \text{bits}}`} /> — the floor
      </div>

      {/* gap callout label, at the tail of the leader arrow */}
      <div
        style={{
          position: "absolute",
          left: xOf(1.75) + 40,
          top: BAR2_Y + BAR_H + 14,
          whiteSpace: "nowrap",
          fontSize: 12,
          opacity: 0.85,
        }}
      >
        gap ≈ 0.01 bits
      </div>
    </div>
  );
}
