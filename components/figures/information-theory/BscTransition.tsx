import { M } from "../M";
import { ACCENT, labelMuted } from "../palette";

/**
 * BscTransition — the binary symmetric channel BSC(p) shown twice: as a
 * two-column transition diagram and as the matrix p(y|x). Same object.
 *
 * Left half (SVG): input nodes 0 / 1 on the left, output nodes 0 / 1 on the
 * right. Two straight horizontal arrows 0→0 and 1→1 labeled 1−p in
 * currentColor (the bit survives); two crossing diagonal arrows 0→1 and 1→0
 * labeled p in amber (the flip — the error event, the subject).
 *
 * Right half (KaTeX): the 2×2 conditional table p(y|x), rows x=0 / x=1,
 * columns y=0 / y=1, entries [1−p, p ; p, 1−p]. The two p entries are amber
 * to match the crossing arrows; the 1−p entries are currentColor. The color
 * match is the binding: each amber p in the table is one amber crossing arrow.
 *
 * Color roles: amber = the flip (error) transitions; currentColor =
 * everything else (nodes, straight arrows, structure, 1−p entries).
 *
 * One idea: a channel IS its transition table — the diagram and the matrix
 * carry identical information.
 *
 * Recreated after Cover & Thomas §7.1.4 and MacKay ch. 9 (idea only, redrawn
 * in house style — not traced).
 */

// SVG geometry
const LEFT_X = 50;
const RIGHT_X = 250;
const TOP_Y = 60;
const BOT_Y = 140;
const R = 16;

/** unit vector + node-edge trimmed endpoints for the crossing diagonals */
function trim(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  return {
    sx: x1 + ux * R,
    sy: y1 + uy * R,
    ex: x2 - ux * R,
    ey: y2 - uy * R,
  };
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

function Node({ cx, cy, digit }: { cx: number; cy: number; digit: string }) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.7"
      />
      <text
        x={cx}
        y={cy + 5}
        textAnchor="middle"
        fontSize="15"
        fontWeight="600"
        fill="currentColor"
      >
        {digit}
      </text>
    </g>
  );
}

// crossing diagonals, edge-trimmed
const d01 = trim(LEFT_X, TOP_Y, RIGHT_X, BOT_Y); // 0 → 1
const d10 = trim(LEFT_X, BOT_Y, RIGHT_X, TOP_Y); // 1 → 0

export default function BscTransition() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        maxWidth: 620,
      }}
    >
      {/* ---- left half: transition diagram ---- */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>as a diagram</div>
        <svg viewBox="0 0 300 190" width="300" aria-hidden="true">
          {/* column letters bind to the matrix axes */}
          <text
            x={LEFT_X}
            y={30}
            textAnchor="middle"
            fontSize="12.5"
            fontStyle="italic"
            fill="currentColor"
            opacity="0.5"
          >
            x
          </text>
          <text
            x={RIGHT_X}
            y={30}
            textAnchor="middle"
            fontSize="12.5"
            fontStyle="italic"
            fill="currentColor"
            opacity="0.5"
          >
            y
          </text>

          {/* crossing diagonals first, so nodes sit on top */}
          <Arrow x1={d01.sx} y1={d01.sy} x2={d01.ex} y2={d01.ey} color={ACCENT} />
          <Arrow x1={d10.sx} y1={d10.sy} x2={d10.ex} y2={d10.ey} color={ACCENT} />

          {/* straight survivors */}
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

          {/* nodes */}
          <Node cx={LEFT_X} cy={TOP_Y} digit="0" />
          <Node cx={LEFT_X} cy={BOT_Y} digit="1" />
          <Node cx={RIGHT_X} cy={TOP_Y} digit="0" />
          <Node cx={RIGHT_X} cy={BOT_Y} digit="1" />

          {/* straight-arrow labels: 1 − p, currentColor */}
          <text
            x={150}
            y={TOP_Y - 8}
            textAnchor="middle"
            fontSize="13"
            fontStyle="italic"
            fill="currentColor"
            opacity="0.8"
          >
            1 − p
          </text>
          <text
            x={150}
            y={BOT_Y + 18}
            textAnchor="middle"
            fontSize="13"
            fontStyle="italic"
            fill="currentColor"
            opacity="0.8"
          >
            1 − p
          </text>

          {/* crossing-arrow labels: p, amber (the flip) */}
          <text
            x={112}
            y={80}
            textAnchor="middle"
            fontSize="13.5"
            fontStyle="italic"
            fontWeight="600"
            fill={ACCENT}
          >
            p
          </text>
          <text
            x={112}
            y={126}
            textAnchor="middle"
            fontSize="13.5"
            fontStyle="italic"
            fontWeight="600"
            fill={ACCENT}
          >
            p
          </text>
        </svg>
      </div>

      {/* ---- join: same object ---- */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <M tex={String.raw`\triangleq`} size={20} />
        <span style={{ ...labelMuted, fontSize: 11 }}>same</span>
      </div>

      {/* ---- right half: transition matrix p(y|x) ---- */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>as a matrix</div>
        <M
          display
          tex={String.raw`p(y\mid x)\;=\;\begin{array}{c|cc} & y{=}0 & y{=}1 \\ \hline x{=}0 & 1-p & \textcolor{${ACCENT}}{p} \\ x{=}1 & \textcolor{${ACCENT}}{p} & 1-p \end{array}`}
        />
      </div>
    </div>
  );
}
