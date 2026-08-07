import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * BitsPerCharLadder — bits per character of English under progressively
 * better coders.
 *
 * Horizontal bar chart on a shared 0–8 bits/char axis. Four amber bars,
 * descending: raw ASCII byte (8.0), fixed-width 27-symbol code (4.76 =
 * log2 27), letter frequencies (4.0, Shannon 1951 F1), bigram / one letter
 * of context (3.3, Shannon 1951 F2). A dashed blue vertical guide at ≈1 bit
 * marks the English entropy rate — the floor no model beats. The bottom
 * three bars are the demo's three models.
 *
 * One idea: a better model means a smaller file.
 */

const W = 648;
const HGT = 300;

const X0 = 214; // axis origin (bits = 0), bars start here
const PPB = 45; // px per bit
const xOf = (v: number) => X0 + v * PPB;

const BAR_H = 26;
const ROW0 = 52;
const ROW_STEP = 46;
const rowY = (i: number) => ROW0 + i * ROW_STEP;

const AXIS_Y = 250;
const FLOOR = 1; // entropy-rate guide
const FLOOR_X = xOf(FLOOR);

type Bar = { label: string; v: number; text: string };
const BARS: Bar[] = [
  { label: "raw ASCII byte", v: 8.0, text: "8.0" },
  { label: "fixed-width, 27 symbols", v: 4.76, text: "4.76" },
  { label: "letter frequencies", v: 4.0, text: "4.0" },
  { label: "bigram (1 letter of context)", v: 3.3, text: "3.3" },
];

export default function BitsPerCharLadder() {
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
        {/* amber bars */}
        {BARS.map((b, i) => (
          <rect
            key={b.label}
            x={X0}
            y={rowY(i)}
            width={xOf(b.v) - X0}
            height={BAR_H}
            rx="3"
            fill={ACCENT}
            opacity="0.9"
          />
        ))}

        {/* grouping bracket for the demo's three models (bottom three rows) */}
        {(() => {
          const top = rowY(1) - 3;
          const bot = rowY(3) + BAR_H + 3;
          const bx = X0 - 7;
          return (
            <path
              d={`M ${bx} ${top} q -5 0 -5 5 L ${bx - 5} ${bot - 5} q 0 5 5 5`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              opacity="0.4"
            />
          );
        })()}

        {/* entropy-rate guide: dashed blue vertical line spanning the chart */}
        <line
          x1={FLOOR_X}
          y1={ROW0 - 12}
          x2={FLOOR_X}
          y2={rowY(3) + BAR_H + 2}
          stroke={SUPPORT}
          strokeWidth="1.5"
          strokeDasharray="5 4"
        />

        {/* axis */}
        <line
          x1={X0}
          y1={AXIS_Y}
          x2={xOf(8) + 8}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
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
          x={(X0 + xOf(8)) / 2}
          y={AXIS_Y + 36}
          textAnchor="middle"
          fontSize="12"
          fill="currentColor"
          opacity="0.6"
          fontStyle="italic"
        >
          bits per character
        </text>

        {/* value at each bar's right end (amber) */}
        {BARS.map((b, i) => (
          <text
            key={b.label}
            x={xOf(b.v) + 9}
            y={rowY(i) + BAR_H / 2 + 4}
            fontSize="12.5"
            fontWeight="600"
            fill={ACCENT}
          >
            {b.text}
          </text>
        ))}
      </svg>

      {/* left row labels (currentColor) */}
      {BARS.map((b, i) => (
        <div
          key={b.label}
          style={{
            position: "absolute",
            left: 0,
            top: rowY(i),
            width: X0 - 18,
            height: BAR_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            textAlign: "right",
            lineHeight: 1.15,
          }}
        >
          {b.label}
        </div>
      ))}

      {/* muted note under the bigram row */}
      <div
        style={{
          position: "absolute",
          left: X0 + 4,
          top: rowY(3) + BAR_H + 4,
          fontSize: 11.5,
          opacity: 0.55,
          fontStyle: "italic",
        }}
      >
        the demo&apos;s three models
      </div>

      {/* entropy-rate guide label, above the dashed line */}
      <div
        style={{
          position: "absolute",
          left: FLOOR_X - 2,
          top: 6,
          whiteSpace: "nowrap",
          color: SUPPORT,
        }}
      >
        <M tex={String.raw`\textcolor{${SUPPORT}}{H_{\text{rate}} \approx 1}`} />{" "}
        — entropy rate{" "}
        <span style={{ opacity: 0.7, fontSize: 11.5 }}>(entropy-of-english)</span>
      </div>
    </div>
  );
}
