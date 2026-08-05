import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * RedundancyBar — most of written English is predictable structure.
 *
 * Two horizontal bars share a bits axis (0–8), one bit = storage per letter:
 *   top    length 4.76  — fixed-width slot for 27 symbols (log2 27 bits)
 *   bottom length 8     — one ASCII byte
 * Both carry the SAME amber sliver at the far left: ~1.2 bits of actual
 * information (the entropy rate of English). A dashed guide at 1.2 bits joins
 * the two ambers to show the boundary is identical; everything to its right is
 * hatched "redundancy". A brace under the fixed-width bar's remainder calls out
 * ≈75% — the share a lossless coder can strip. Two tones only: amber = the
 * information (subject), currentColor/hatch = the redundant remainder.
 *
 * One idea: the stored bits are mostly removable structure, not information.
 */

const W = 680;
const HGT = 182;
const X0 = 150; // bits = 0
const PPB = 50; // px per bit
const xOf = (v: number) => X0 + v * PPB;

const INFO = 1.2; // bits of actual information per letter
const FIXED = 4.76; // log2 27
const ASCII = 8;

const BAR_H = 30;
const TOP_Y = 28;
const BOT_Y = 104;
const AXIS_Y = 148;
const GUIDE_X = xOf(INFO);
const BRACE_Y = 63; // brace under the fixed-width remainder

function Bar({
  y,
  total,
}: {
  y: number;
  total: number;
}) {
  return (
    <g>
      {/* redundant remainder: soft field + diagonal hatch */}
      <rect
        x={GUIDE_X}
        y={y}
        width={xOf(total) - GUIDE_X}
        height={BAR_H}
        fill="currentColor"
        opacity="0.05"
      />
      <rect
        x={GUIDE_X}
        y={y}
        width={xOf(total) - GUIDE_X}
        height={BAR_H}
        fill="url(#rb-hatch)"
      />
      {/* information: amber sliver at the far left */}
      <rect x={X0} y={y} width={GUIDE_X - X0} height={BAR_H} fill={ACCENT} opacity="0.9" />
      {/* whole-bar hairline outline */}
      <rect
        x={X0}
        y={y}
        width={xOf(total) - X0}
        height={BAR_H}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeOpacity="0.45"
      />
    </g>
  );
}

export default function RedundancyBar() {
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
        <defs>
          <pattern
            id="rb-hatch"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="1" strokeOpacity="0.32" />
          </pattern>
        </defs>

        {/* dashed guide at 1.2 bits — the shared information boundary */}
        <line
          x1={GUIDE_X}
          y1={14}
          x2={GUIDE_X}
          y2={TOP_Y + BAR_H}
          stroke={ACCENT}
          strokeWidth="1.3"
          strokeDasharray="4 3"
          opacity="0.9"
        />
        <line
          x1={GUIDE_X}
          y1={BOT_Y}
          x2={GUIDE_X}
          y2={AXIS_Y}
          stroke={ACCENT}
          strokeWidth="1.3"
          strokeDasharray="4 3"
          opacity="0.9"
        />

        <Bar y={TOP_Y} total={FIXED} />
        <Bar y={BOT_Y} total={ASCII} />

        {/* brace under the fixed-width remainder → redundancy callout */}
        <path
          d={`M ${GUIDE_X} ${BRACE_Y + 6} L ${GUIDE_X} ${BRACE_Y} L ${xOf(FIXED)} ${BRACE_Y} L ${xOf(FIXED)} ${BRACE_Y + 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.55"
        />
        <path
          d={`M ${(GUIDE_X + xOf(FIXED)) / 2} ${BRACE_Y} L ${(GUIDE_X + xOf(FIXED)) / 2} ${BRACE_Y + 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeOpacity="0.55"
        />

        {/* axis */}
        <line
          x1={X0}
          y1={AXIS_Y}
          x2={xOf(ASCII) + 8}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.55"
        />
        {[0, 2, 4, 6, 8].map((v) => (
          <g key={v}>
            <line
              x1={xOf(v)}
              y1={AXIS_Y}
              x2={xOf(v)}
              y2={AXIS_Y + 5}
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.55"
            />
            <text x={xOf(v)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {v}
            </text>
          </g>
        ))}
        {/* 1.2 tick, amber */}
        <line x1={GUIDE_X} y1={AXIS_Y} x2={GUIDE_X} y2={AXIS_Y + 5} stroke={ACCENT} strokeWidth="1.3" />
        <text x={GUIDE_X} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill={ACCENT} fontWeight="600">
          1.2
        </text>
        <text x={xOf(ASCII) + 14} y={AXIS_Y + 4} fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits
        </text>
      </svg>

      {/* row labels (left of the axis) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: TOP_Y,
          width: X0 - 12,
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          fontWeight: 600,
        }}
      >
        fixed-width
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: TOP_Y + BAR_H - 3,
          width: X0 - 12,
          textAlign: "right",
          fontSize: 11,
          opacity: 0.55,
        }}
      >
        27 symbols
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: BOT_Y,
          width: X0 - 12,
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          fontWeight: 600,
        }}
      >
        ASCII
      </div>

      {/* bar-end value labels (length in bits) */}
      <div
        style={{
          position: "absolute",
          left: xOf(FIXED) + 12,
          top: TOP_Y,
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <M tex={String.raw`\log_2 27 = 4.76\ \text{bits}`} />
      </div>
      <div
        style={{
          position: "absolute",
          left: xOf(ASCII) + 12,
          top: BOT_Y,
          height: BAR_H,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <M tex={String.raw`8\ \text{bits}`} />
      </div>

      {/* information callout, above the guide */}
      <div
        style={{
          position: "absolute",
          left: GUIDE_X,
          top: 0,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          color: ACCENT,
          fontWeight: 600,
        }}
      >
        <M tex={String.raw`\textcolor{${ACCENT}}{\text{information} \approx 1.2\ \text{bits}}`} />
      </div>

      {/* redundancy callout, under the fixed-width brace */}
      <div
        style={{
          position: "absolute",
          left: (GUIDE_X + xOf(FIXED)) / 2,
          top: BRACE_Y + 10,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          textAlign: "center",
          opacity: 0.8,
        }}
      >
        redundancy ≈ 75% — removable by lossless compression
      </div>
    </div>
  );
}
