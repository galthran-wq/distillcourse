import { M } from "../M";
import { ACCENT, labelMuted } from "../palette";

/**
 * NeuronAsChannel — a single neuron drawn as a transition channel p(r|s),
 * styled after BscTransition from the channel-capacity lesson.
 *
 * Left: two stimulus inputs, s0 "weak" and s1 "strong". Middle: a small
 * rounded box "neuron p(r|s)" sitting at the channel's heart — the two noise
 * transitions cross behind it. Right: two response outputs, r=0 "silent" and
 * r=1 "spike". Four arrows carry the table entries: the reliable transitions
 * s0→0 and s1→1 (straight, labeled 7/8, currentColor) and the noise/error
 * transitions s0→1 and s1→0 (crossing diagonals, labeled 1/8, amber — the
 * subject). Far right, a tiny raster of three trials shows the binned spike
 * train that the r=1 output stands for.
 *
 * Below: the same 2×2 table p(r|s), with the two 1/8 entries amber to match
 * the crossing arrows. The color match is the binding — each amber 1/8 in the
 * table is one amber crossing arrow.
 *
 * Color roles: amber = the noise (flip) transitions; currentColor =
 * everything else (nodes, straight arrows, neuron box, raster).
 *
 * One idea: a neuron IS its stimulus→response transition table.
 *
 * Schematic recreation after Borst & Theunissen (1999) fig. 2 — idea only,
 * redrawn in house style, not traced.
 */

// SVG geometry
const LEFT_X = 72;
const RIGHT_X = 292;
const TOP_Y = 70;
const BOT_Y = 152;
const R = 17;

// neuron box (centered on the channel; crossing arrows pass behind it)
const BOX_X = 128;
const BOX_Y = 89;
const BOX_W = 104;
const BOX_H = 44;

// spike raster (far right — the binned spike train r=1 stands for)
const RAST_X = 352;
const RAST_ROWS = [116, 132, 148];
const RAST_TRIALS = [
  [6, 20, 37, 58, 74],
  [12, 30, 46, 68],
  [4, 24, 41, 55, 79, 90],
];

/** unit vector + node-edge trimmed endpoints */
function trim(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  return { sx: x1 + ux * R, sy: y1 + uy * R, ex: x2 - ux * R, ey: y2 - uy * R };
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  opacity = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  opacity?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const back = 9;
  const wid = 4;
  const bx = x2 - ux * back;
  const by = y2 - uy * back;
  const px = -uy;
  const py = ux;
  return (
    <g stroke={color} fill={color} opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by} strokeWidth="1.6" />
      <path
        d={`M ${x2} ${y2} L ${bx + px * wid} ${by + py * wid} L ${bx - px * wid} ${by - py * wid} Z`}
        stroke="none"
      />
    </g>
  );
}

/** input stimulus node: circle with s-subscript glyph + a role word beside it */
function InNode({
  cy,
  sub,
  role,
}: {
  cy: number;
  sub: string;
  role: string;
}) {
  return (
    <g>
      <circle
        cx={LEFT_X}
        cy={cy}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.7"
      />
      <text
        x={LEFT_X}
        y={cy + 5}
        textAnchor="middle"
        fontSize="15"
        fontStyle="italic"
        fontWeight="600"
        fill="currentColor"
      >
        s
        <tspan fontSize="10" dy="4" fontStyle="normal">
          {sub}
        </tspan>
      </text>
      <text
        x={LEFT_X - R - 8}
        y={cy + 4}
        textAnchor="end"
        fontSize="12.5"
        fill="currentColor"
        opacity="0.6"
      >
        {role}
      </text>
    </g>
  );
}

/** output response node: circle with digit + a role word beside it */
function OutNode({
  cy,
  digit,
  role,
}: {
  cy: number;
  digit: string;
  role: string;
}) {
  return (
    <g>
      <circle
        cx={RIGHT_X}
        cy={cy}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.7"
      />
      <text
        x={RIGHT_X}
        y={cy + 5}
        textAnchor="middle"
        fontSize="15"
        fontWeight="600"
        fill="currentColor"
      >
        {digit}
      </text>
      <text
        x={RIGHT_X + R + 7}
        y={cy + 4}
        textAnchor="start"
        fontSize="12.5"
        fill="currentColor"
        opacity="0.6"
      >
        {role}
      </text>
    </g>
  );
}

// crossing (noise) diagonals, edge-trimmed
const d01 = trim(LEFT_X, TOP_Y, RIGHT_X, BOT_Y); // s0 → 1
const d10 = trim(LEFT_X, BOT_Y, RIGHT_X, TOP_Y); // s1 → 0

export default function NeuronAsChannel() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        maxWidth: 560,
      }}
    >
      <svg viewBox="0 0 470 184" width="470" aria-hidden="true">
        {/* axis letters bind the columns to the matrix rows/cols */}
        <text
          x={LEFT_X}
          y={34}
          textAnchor="middle"
          fontSize="12.5"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.5"
        >
          stimulus s
        </text>
        <text
          x={RIGHT_X}
          y={34}
          textAnchor="middle"
          fontSize="12.5"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.5"
        >
          response r
        </text>

        {/* crossing noise diagonals first, so the neuron box occludes the cross */}
        <Arrow x1={d01.sx} y1={d01.sy} x2={d01.ex} y2={d01.ey} color={ACCENT} />
        <Arrow x1={d10.sx} y1={d10.sy} x2={d10.ex} y2={d10.ey} color={ACCENT} />

        {/* reliable straight transitions (clear above/below the box) */}
        <Arrow
          x1={LEFT_X + R}
          y1={TOP_Y}
          x2={RIGHT_X - R}
          y2={TOP_Y}
          color="currentColor"
          opacity={0.75}
        />
        <Arrow
          x1={LEFT_X + R}
          y1={BOT_Y}
          x2={RIGHT_X - R}
          y2={BOT_Y}
          color="currentColor"
          opacity={0.75}
        />

        {/* the neuron: small box at the channel's heart */}
        <rect
          x={BOX_X}
          y={BOX_Y}
          width={BOX_W}
          height={BOX_H}
          rx="6"
          fill="var(--paper, #fff)"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.85"
        />
        <text
          x={BOX_X + BOX_W / 2}
          y={BOX_Y + 18}
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="600"
          fill="currentColor"
        >
          neuron
        </text>
        <text
          x={BOX_X + BOX_W / 2}
          y={BOX_Y + 34}
          textAnchor="middle"
          fontSize="13"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.75"
        >
          p(r | s)
        </text>

        {/* nodes on top */}
        <InNode cy={TOP_Y} sub="0" role="weak" />
        <InNode cy={BOT_Y} sub="1" role="strong" />
        <OutNode cy={TOP_Y} digit="0" role="silent" />
        <OutNode cy={BOT_Y} digit="1" role="spike" />

        {/* reliable labels: 7/8, currentColor */}
        <text
          x={182}
          y={TOP_Y - 9}
          textAnchor="middle"
          fontSize="12.5"
          fill="currentColor"
          opacity="0.8"
        >
          7/8
        </text>
        <text
          x={182}
          y={BOT_Y + 19}
          textAnchor="middle"
          fontSize="12.5"
          fill="currentColor"
          opacity="0.8"
        >
          7/8
        </text>

        {/* noise labels: 1/8, amber (the flip) */}
        <text
          x={96}
          y={104}
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="600"
          fill={ACCENT}
        >
          1/8
        </text>
        <text
          x={96}
          y={130}
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="600"
          fill={ACCENT}
        >
          1/8
        </text>

        {/* connector: the r=1 output stands for a binned spike train */}
        <line
          x1={RIGHT_X + R + 2}
          y1={BOT_Y - 16}
          x2={RAST_X - 4}
          y2={130}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.4"
        />

        {/* spike raster: three trials of the binned spike train */}
        <text
          x={RAST_X + 44}
          y={104}
          textAnchor="middle"
          fontSize="11.5"
          fill="currentColor"
          opacity="0.55"
        >
          3 trials
        </text>
        {RAST_ROWS.map((ry, i) => (
          <g key={i}>
            <line
              x1={RAST_X}
              y1={ry}
              x2={RAST_X + 96}
              y2={ry}
              stroke="currentColor"
              strokeWidth="0.8"
              opacity="0.25"
            />
            {RAST_TRIALS[i].map((tx, j) => (
              <line
                key={j}
                x1={RAST_X + tx}
                y1={ry - 6}
                x2={RAST_X + tx}
                y2={ry + 6}
                stroke="currentColor"
                strokeWidth="1.6"
                opacity="0.8"
              />
            ))}
          </g>
        ))}
      </svg>

      {/* the same object, as the transition table p(r|s) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ ...labelMuted, fontSize: 11 }}>same object</span>
        <M
          display
          tex={String.raw`p(r\mid s)=\begin{array}{c|cc} & r{=}0 & r{=}1 \\ \hline s_0 & 7/8 & \textcolor{${ACCENT}}{1/8} \\ s_1 & \textcolor{${ACCENT}}{1/8} & 7/8 \end{array}`}
        />
      </div>
    </div>
  );
}
