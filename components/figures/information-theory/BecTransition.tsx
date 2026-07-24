import { ACCENT } from "../palette";

/**
 * BecTransition — the binary erasure channel BEC(e) as a transition diagram.
 *
 * Inputs 0 and 1 on the left; outputs 0, ?, 1 on the right with the erasure
 * mark ? sitting vertically between the two clean symbols. Straight arrows
 * 0→0 and 1→1 (currentColor) carry the faithful transitions, labeled 1−e.
 * Diagonal arrows 0→? and 1→? (amber) both converge on the amber-outlined ?
 * node, each labeled e.
 *
 * Color roles: amber = the erasure event (the subject — errors land here);
 * currentColor = the faithful transitions and the clean nodes/structure.
 *
 * One idea: the erasure channel flags its own failures — a lost symbol turns
 * into a visible ? the receiver can see, never into the wrong valid symbol.
 *
 * Recreated after Cover & Thomas §7.1.5 (idea only, redrawn in house style).
 */

const R = 20; // node radius

// column x
const LX = 96;
const RX = 384;

// row y
const TOP = 72; // 0
const MID = 132; // ?
const BOT = 192; // 1

type Pt = { x: number; y: number };

/** Straight or diagonal arrow between two node centers, trimmed to the rims. */
function Arrow({
  from,
  to,
  color,
  opacity = 1,
}: {
  from: Pt;
  to: Pt;
  color: string;
  opacity?: number;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const sx = from.x + R * ux;
  const sy = from.y + R * uy;
  const ex = to.x - R * ux;
  const ey = to.y - R * uy;
  // arrowhead triangle
  const px = -uy;
  const py = ux;
  const bx = ex - 8 * ux;
  const by = ey - 8 * uy;
  const head = `M ${ex} ${ey} L ${bx + 3.6 * px} ${by + 3.6 * py} L ${bx - 3.6 * px} ${by - 3.6 * py} Z`;
  return (
    <g stroke={color} strokeOpacity={opacity} fill={color} fillOpacity={opacity}>
      <line x1={sx} y1={sy} x2={bx} y2={by} strokeWidth="1.6" />
      <path d={head} stroke="none" />
    </g>
  );
}

/** A labeled channel node (circle + centered symbol). */
function Node({
  cx,
  cy,
  symbol,
  color,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  symbol: string;
  color: string;
  opacity?: number;
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth="1.7"
      />
      <text
        x={cx}
        y={cy + 6.5}
        textAnchor="middle"
        fontSize="19"
        fontWeight="600"
        fill={color}
        fillOpacity={opacity}
      >
        {symbol}
      </text>
    </g>
  );
}

export default function BecTransition() {
  const in0 = { x: LX, y: TOP };
  const in1 = { x: LX, y: BOT };
  const out0 = { x: RX, y: TOP };
  const outQ = { x: RX, y: MID };
  const out1 = { x: RX, y: BOT };

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        maxWidth: 520,
      }}
    >
      <svg viewBox="0 0 480 250" width="480" aria-hidden="true">
        {/* column captions */}
        <text x={LX} y={32} textAnchor="middle" fontSize="11.5" fill="currentColor" opacity="0.55">
          input
        </text>
        <text x={RX} y={32} textAnchor="middle" fontSize="11.5" fill="currentColor" opacity="0.55">
          output
        </text>

        {/* faithful transitions (straight, currentColor) */}
        <Arrow from={in0} to={out0} color="currentColor" opacity={0.8} />
        <Arrow from={in1} to={out1} color="currentColor" opacity={0.8} />

        {/* erasure transitions (diagonal, amber) converging on ? */}
        <Arrow from={in0} to={outQ} color={ACCENT} />
        <Arrow from={in1} to={outQ} color={ACCENT} />

        {/* nodes */}
        <Node cx={in0.x} cy={in0.y} symbol="0" color="currentColor" />
        <Node cx={in1.x} cy={in1.y} symbol="1" color="currentColor" />
        <Node cx={out0.x} cy={out0.y} symbol="0" color="currentColor" />
        <Node cx={out1.x} cy={out1.y} symbol="1" color="currentColor" />
        <Node cx={outQ.x} cy={outQ.y} symbol="?" color={ACCENT} />

        {/* faithful labels: 1 − e */}
        <text x={(LX + RX) / 2} y={TOP - 9} textAnchor="middle" fontSize="13" fill="currentColor" opacity="0.85">
          1 − <tspan fontStyle="italic">e</tspan>
        </text>
        <text x={(LX + RX) / 2} y={BOT + 18} textAnchor="middle" fontSize="13" fill="currentColor" opacity="0.85">
          1 − <tspan fontStyle="italic">e</tspan>
        </text>

        {/* erasure labels: e (amber, on the converging arrows) */}
        <text x={222} y={94} textAnchor="middle" fontSize="13" fontStyle="italic" fontWeight="600" fill={ACCENT}>
          e
        </text>
        <text x={222} y={182} textAnchor="middle" fontSize="13" fontStyle="italic" fontWeight="600" fill={ACCENT}>
          e
        </text>
      </svg>

      {/* color-matched legend (rule 11) */}
      <div style={{ display: "flex", gap: 22, fontSize: 12.5, opacity: 0.9 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 22, height: 0, borderTop: `2px solid ${ACCENT}` }} />
          <span style={{ color: ACCENT }}>erasure: lands on a visible&nbsp;?</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 22, height: 0, borderTop: "2px solid currentColor", opacity: 0.7 }} />
          <span style={{ opacity: 0.75 }}>faithful: symbol survives</span>
        </span>
      </div>
    </div>
  );
}
