import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * BitsPerContext — the N-gram entropy F_N as a convergence curve.
 *
 * Line plot: bits per letter (y, 0–5) against letters of known context N
 * (x: 0,1,2,3, an axis break, then 100). Amber points at F_0..F_3 =
 * 4.76, 4.03, 3.32, 3.10, joined by a dashed amber curve that keeps
 * descending past the break toward a blue experimental error bar (0.6–1.3
 * bits) at N = 100. A dashed amber horizontal asymptote near 1 bit marks
 * H_rate, the entropy rate — the limit the curve is falling toward.
 *
 * One idea: F_N falls toward its limit, the entropy rate (~1 bit/letter).
 */

const W = 560;
const H = 300;

const AXIS_Y = 250; // bits = 0
const Y_AXIS_X = 64; // vertical axis position
const PPB = 42; // px per bit
const yOf = (b: number) => AXIS_Y - b * PPB;

// x positions: small-N ticks, then a break, then N = 100
const xN = (n: number) => 95 + n * 52; // 95, 147, 199, 251
const X_100 = 470;
const BREAK_X = 280; // centre of the axis break

const H_RATE = 1; // asymptote height (bits)
const ASY_Y = yOf(H_RATE);

// measured F_N points
const PTS: { n: number; b: number }[] = [
  { n: 0, b: 4.76 },
  { n: 1, b: 4.03 },
  { n: 2, b: 3.32 },
  { n: 3, b: 3.1 },
];

// curve control points (pixels): the four data points, then a descending
// tail that flattens toward the asymptote and arrives at the error bar
const CURVE: [number, number][] = [
  [xN(0), yOf(4.76)],
  [xN(1), yOf(4.03)],
  [xN(2), yOf(3.32)],
  [xN(3), yOf(3.1)],
  [305, yOf(2.35)],
  [350, yOf(1.75)],
  [400, yOf(1.35)],
  [440, yOf(1.12)],
  [X_100 - 4, yOf(1.02)],
];

/** Catmull-Rom → cubic-bezier smooth path through pts. */
function smooth(pts: [number, number][]): string {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export default function BitsPerContext() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* ---- axes ---- */}
        <line
          x1={Y_AXIS_X}
          y1={yOf(5) - 6}
          x2={Y_AXIS_X}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
        {/* x-axis, split by the break */}
        <line
          x1={Y_AXIS_X}
          y1={AXIS_Y}
          x2={BREAK_X - 8}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
        <line
          x1={BREAK_X + 8}
          y1={AXIS_Y}
          x2={510}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
        {/* break marks (double slash) */}
        {[-8, 8].map((dx) => (
          <line
            key={dx}
            x1={BREAK_X + dx - 4}
            y1={AXIS_Y + 5}
            x2={BREAK_X + dx + 4}
            y2={AXIS_Y - 5}
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.6"
          />
        ))}

        {/* y ticks + gridless labels */}
        {[0, 1, 2, 3, 4, 5].map((b) => (
          <g key={b}>
            <line
              x1={Y_AXIS_X - 5}
              y1={yOf(b)}
              x2={Y_AXIS_X}
              y2={yOf(b)}
              stroke="currentColor"
              strokeWidth="1.1"
              opacity="0.6"
            />
            <text
              x={Y_AXIS_X - 9}
              y={yOf(b) + 4}
              textAnchor="end"
              fontSize="11"
              fill="currentColor"
              opacity="0.7"
            >
              {b}
            </text>
          </g>
        ))}

        {/* x ticks */}
        {[0, 1, 2, 3].map((n) => (
          <g key={n}>
            <line
              x1={xN(n)}
              y1={AXIS_Y}
              x2={xN(n)}
              y2={AXIS_Y + 5}
              stroke="currentColor"
              strokeWidth="1.1"
              opacity="0.6"
            />
            <text
              x={xN(n)}
              y={AXIS_Y + 18}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              opacity="0.7"
            >
              {n}
            </text>
          </g>
        ))}
        <g>
          <line
            x1={X_100}
            y1={AXIS_Y}
            x2={X_100}
            y2={AXIS_Y + 5}
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.6"
          />
          <text
            x={X_100}
            y={AXIS_Y + 18}
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
            opacity="0.7"
          >
            100
          </text>
        </g>

        {/* ---- entropy-rate asymptote (dashed amber horizontal) ---- */}
        <line
          x1={Y_AXIS_X}
          y1={ASY_Y}
          x2={505}
          y2={ASY_Y}
          stroke={ACCENT}
          strokeWidth="1.1"
          strokeDasharray="2 3"
          opacity="0.75"
        />

        {/* ---- the F_N curve (dashed amber) ---- */}
        <path
          d={smooth(CURVE)}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.8"
          strokeDasharray="6 4"
        />
        {/* measured points */}
        {PTS.map((p) => (
          <circle
            key={p.n}
            cx={xN(p.n)}
            cy={yOf(p.b)}
            r="4"
            fill={ACCENT}
          />
        ))}
        {/* point value labels */}
        {PTS.map((p) => (
          <text
            key={p.n}
            x={xN(p.n)}
            y={yOf(p.b) - 10}
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="600"
            fill={ACCENT}
          >
            {p.b.toFixed(2)}
          </text>
        ))}

        {/* ---- experimental bounds at N = 100 (blue error bar) ---- */}
        <line
          x1={X_100}
          y1={yOf(0.6)}
          x2={X_100}
          y2={yOf(1.3)}
          stroke={SUPPORT}
          strokeWidth="2.2"
        />
        {[0.6, 1.3].map((b) => (
          <line
            key={b}
            x1={X_100 - 6}
            y1={yOf(b)}
            x2={X_100 + 6}
            y2={yOf(b)}
            stroke={SUPPORT}
            strokeWidth="2.2"
          />
        ))}
      </svg>

      {/* ---- overlaid KaTeX / text labels ---- */}

      {/* curve identity */}
      <div
        style={{
          position: "absolute",
          left: xN(1) + 12,
          top: yOf(4.03) + 6,
          color: ACCENT,
          fontWeight: 600,
        }}
      >
        <M tex={String.raw`\textcolor{${ACCENT}}{F_N}`} />
      </div>

      {/* entropy-rate label, just above the asymptote in the open band */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: ASY_Y - 26,
          color: ACCENT,
          whiteSpace: "nowrap",
        }}
      >
        <M tex={String.raw`\textcolor{${ACCENT}}{H_{rate}}`} /> — the entropy rate
      </div>

      {/* measured-bounds label, right of the error bar */}
      <div
        style={{
          position: "absolute",
          left: X_100 + 14,
          top: yOf(0.95) - 18,
          color: SUPPORT,
          lineHeight: 1.35,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontWeight: 600 }}>0.6–1.3 bits</div>
        <div style={{ fontSize: 11.5, opacity: 0.85 }}>measured bounds</div>
      </div>

      {/* x-axis title */}
      <div
        style={{
          position: "absolute",
          left: Y_AXIS_X,
          top: AXIS_Y + 26,
          width: 510 - Y_AXIS_X,
          textAlign: "center",
          fontStyle: "italic",
          opacity: 0.6,
          fontSize: 12,
        }}
      >
        letters of known context <M tex={"N"} size={12} />
      </div>

      {/* y-axis title */}
      <div
        style={{
          position: "absolute",
          left: 8,
          top: yOf(1.6),
          transform: "rotate(-90deg)",
          transformOrigin: "left top",
          fontStyle: "italic",
          opacity: 0.6,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        bits per letter
      </div>
    </div>
  );
}
