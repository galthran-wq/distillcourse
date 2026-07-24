import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * DpiMarkovChain — the data-processing inequality as a Markov chain Y → X → T.
 *
 * Three boxes: Y (target, currentColor), X (data, amber), T (representation,
 * blue). Straight data-flow arrows carry p(x|y) then p(t|x) — "the processing".
 * A faint dashed arc straight from Y to T is crossed out: there is no direct
 * path, T sees Y only through X. Two span brackets measure how much each stage
 * knows about Y: I(X;Y) = 0.811 bits (amber) over Y–X, I(T;Y) = 0.467 bits
 * (blue) over the longer Y–T span. The KaTeX inequality states the payoff.
 *
 * Color roles: amber = X and the information it carries about Y (the subject);
 * blue = T and the information it retains; currentColor = Y and the structure
 * (boxes, arcs, brackets).
 *
 * One idea: the processing stage sits between the target and the
 * representation, and the span of information it gates can only shrink.
 *
 * Recreated after Cover & Thomas §2.8 (idea only, redrawn in house style).
 */

// SVG geometry
const BOX_W = 78;
const BOX_H = 48;
const BOX_TOP = 96;
const BOX_MID = BOX_TOP + BOX_H / 2; // 120
const BOX_BOT = BOX_TOP + BOX_H; // 144

const YX = 62; // Y center x
const XX = 252; // X center x
const TX = 442; // T center x

function Node({
  cx,
  letter,
  role,
  color,
}: {
  cx: number;
  letter: string;
  role: string;
  color: string;
}) {
  return (
    <g>
      <rect
        x={cx - BOX_W / 2}
        y={BOX_TOP}
        width={BOX_W}
        height={BOX_H}
        rx="7"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeOpacity={color === "currentColor" ? 0.55 : 0.9}
      />
      <text
        x={cx}
        y={BOX_MID - 1}
        textAnchor="middle"
        fontSize="19"
        fontStyle="italic"
        fontWeight="600"
        fill={color}
      >
        {letter}
      </text>
      <text
        x={cx}
        y={BOX_MID + 15}
        textAnchor="middle"
        fontSize="10.5"
        fill={color}
        opacity={color === "currentColor" ? 0.55 : 0.75}
      >
        {role}
      </text>
    </g>
  );
}

/** straight data-flow arrow from x1 to x2 at BOX_MID, left→right */
function FlowArrow({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <g stroke="currentColor" strokeOpacity="0.7" fill="currentColor" fillOpacity="0.7">
      <line x1={x1} y1={BOX_MID} x2={x2 - 4} y2={BOX_MID} strokeWidth="1.5" />
      <path
        d={`M ${x2} ${BOX_MID} l -7 -3.4 l 0 6.8 Z`}
        stroke="none"
      />
    </g>
  );
}

export default function DpiMarkovChain() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        maxWidth: 560,
      }}
    >
      <svg viewBox="0 0 520 236" width="520" aria-hidden="true">
        {/* faint dashed "no direct path" arc from Y to T, crossed out */}
        <path
          d={`M ${YX} ${BOX_TOP} Q ${XX} 8 ${TX} ${BOX_TOP}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeOpacity="0.35"
          strokeDasharray="4 4"
        />
        {/* cross-out mark at the apex */}
        <g stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.6">
          <line x1={XX - 7} y1={46} x2={XX + 7} y2={60} />
          <line x1={XX + 7} y1={46} x2={XX - 7} y2={60} />
        </g>
        <text
          x={XX}
          y={34}
          textAnchor="middle"
          fontSize="11.5"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.55"
        >
          no direct path
        </text>

        {/* nodes */}
        <Node cx={YX} letter="Y" role="target" color="currentColor" />
        <Node cx={XX} letter="X" role="data" color={ACCENT} />
        <Node cx={TX} letter="T" role="representation" color={SUPPORT} />

        {/* data-flow arrows */}
        <FlowArrow x1={YX + BOX_W / 2} x2={XX - BOX_W / 2} />
        <FlowArrow x1={XX + BOX_W / 2} x2={TX - BOX_W / 2} />

        {/* arrow labels */}
        <text
          x={(YX + XX) / 2}
          y={BOX_MID - 10}
          textAnchor="middle"
          fontSize="12.5"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.85"
        >
          p(x | y)
        </text>
        <text
          x={(XX + TX) / 2}
          y={BOX_MID - 10}
          textAnchor="middle"
          fontSize="12.5"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.85"
        >
          p(t | x)
        </text>
        <text
          x={(XX + TX) / 2}
          y={BOX_MID + 20}
          textAnchor="middle"
          fontSize="11.5"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.55"
        >
          the processing
        </text>

        {/* span bracket: Y–X, amber = information X carries about Y */}
        <path
          d={`M ${YX} ${BOX_BOT + 14} L ${YX} ${BOX_BOT + 20} L ${XX} ${BOX_BOT + 20} L ${XX} ${BOX_BOT + 14}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.5"
          strokeOpacity="0.9"
        />
        <text
          x={(YX + XX) / 2}
          y={BOX_BOT + 36}
          textAnchor="middle"
          fontSize="12.5"
          fill={ACCENT}
        >
          <tspan fontStyle="italic">I</tspan>(X;Y) = 0.811 bits
        </text>

        {/* span bracket: Y–T, blue = information T retains about Y */}
        <path
          d={`M ${YX} ${BOX_BOT + 52} L ${YX} ${BOX_BOT + 58} L ${TX} ${BOX_BOT + 58} L ${TX} ${BOX_BOT + 52}`}
          fill="none"
          stroke={SUPPORT}
          strokeWidth="1.5"
          strokeOpacity="0.9"
        />
        <text
          x={(YX + TX) / 2}
          y={BOX_BOT + 74}
          textAnchor="middle"
          fontSize="12.5"
          fill={SUPPORT}
        >
          <tspan fontStyle="italic">I</tspan>(T;Y) = 0.467 bits
        </text>
      </svg>

      {/* the payoff, as real typesetting */}
      <div style={{ marginTop: 2 }}>
        <M
          tex={String.raw`\textcolor{${SUPPORT}}{I(T;Y)} \;\le\; \textcolor{${ACCENT}}{I(X;Y)}`}
          size={17}
        />
      </div>
    </div>
  );
}
