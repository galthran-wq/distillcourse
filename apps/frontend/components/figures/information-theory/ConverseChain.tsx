import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * ConverseChain — the channel-coding converse compressed into one schematic.
 *
 * The chain W → X^n → Y^n → Ŵ runs across the middle (currentColor), arrows
 * labeled encoder / channel / decoder. Two brackets span the whole chain and
 * squeeze it from both sides:
 *   - Above, amber: the data-processing + memorylessness ceiling
 *     I(W;Ŵ) ≤ nC — the message can share at most nC bits with its estimate.
 *   - Below, blue: Fano's inequality H(W|Ŵ) ≤ 1 + Pe·nR — residual
 *     uncertainty about W after seeing Ŵ, priced in error probability.
 * The two meet in the boxed amber conclusion: nR = H(W) ≤ nC + 1 + Pe·nR,
 * hence Pe ≥ 1 − C/R − 1/(nR).
 *
 * Color roles: amber = the capacity ceiling and the conclusion; blue = the
 * Fano term; currentColor = the chain itself. One idea: nR message bits must
 * flow through a pipe of width nC, and Fano charges the shortfall to Pe.
 *
 * Recreated after Cover & Thomas §7.9 (idea only, redrawn in house style).
 */

const W = 600;
const HGT = 200;

// chain geometry
const BOX_W = 72;
const BOX_H = 44;
const BOX_TOP = 78;
const BOX_MID = BOX_TOP + BOX_H / 2; // 100
const BOX_BOT = BOX_TOP + BOX_H; // 122
const HALF = BOX_W / 2;

// four box centers, equal pitch
const CX = [72, 224, 376, 528];

const BOX_LABELS = [
  String.raw`W`,
  String.raw`X^n`,
  String.raw`Y^n`,
  String.raw`\hat W`,
];
const ARROW_LABELS = ["encoder", "channel", "decoder"];

// bracket vertical bands
const TOP_BR = 54; // top bracket horizontal
const BOT_BR = 140; // bottom bracket horizontal

function Arrow({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <g stroke="currentColor" strokeOpacity="0.7">
      <line x1={x1} y1={BOX_MID} x2={x2 - 4} y2={BOX_MID} strokeWidth="1.5" />
      <path
        d={`M ${x2} ${BOX_MID} l -7 -3.4 l 0 6.8 Z`}
        fill="currentColor"
        fillOpacity="0.7"
        stroke="none"
      />
    </g>
  );
}

export default function ConverseChain() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        maxWidth: 620,
      }}
    >
      <div style={{ position: "relative", width: W, height: HGT }}>
        <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
          {/* boxes */}
          {CX.map((cx, i) => (
            <rect
              key={`box${i}`}
              x={cx - HALF}
              y={BOX_TOP}
              width={BOX_W}
              height={BOX_H}
              rx="7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeOpacity="0.6"
            />
          ))}

          {/* data-flow arrows + labels */}
          {ARROW_LABELS.map((lbl, i) => {
            const x1 = CX[i] + HALF;
            const x2 = CX[i + 1] - HALF;
            return (
              <g key={`arr${i}`}>
                <Arrow x1={x1} x2={x2} />
                <text
                  x={(x1 + x2) / 2}
                  y={BOX_MID - 9}
                  textAnchor="middle"
                  fontSize="12"
                  fontStyle="italic"
                  fill="currentColor"
                  opacity="0.8"
                >
                  {lbl}
                </text>
              </g>
            );
          })}

          {/* top bracket (amber) spanning W … Ŵ, legs pointing down to the chain */}
          <path
            d={`M ${CX[0]} ${TOP_BR + 8} L ${CX[0]} ${TOP_BR} L ${CX[3]} ${TOP_BR} L ${CX[3]} ${TOP_BR + 8}`}
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.6"
            strokeOpacity="0.9"
          />
          <text
            x={W / 2}
            y={20}
            textAnchor="middle"
            fontSize="11.5"
            fontStyle="italic"
            fill={ACCENT}
            opacity="0.9"
          >
            data-processing + memorylessness
          </text>

          {/* bottom bracket (blue) spanning W … Ŵ, legs pointing up to the chain */}
          <path
            d={`M ${CX[0]} ${BOT_BR - 8} L ${CX[0]} ${BOT_BR} L ${CX[3]} ${BOT_BR} L ${CX[3]} ${BOT_BR - 8}`}
            fill="none"
            stroke={SUPPORT}
            strokeWidth="1.6"
            strokeOpacity="0.9"
          />
          <text
            x={W / 2}
            y={193}
            textAnchor="middle"
            fontSize="11.5"
            fontStyle="italic"
            fill={SUPPORT}
            opacity="0.9"
          >
            Fano&rsquo;s inequality
          </text>
        </svg>

        {/* box labels (KaTeX overlay) */}
        {CX.map((cx, i) => (
          <div
            key={`lbl${i}`}
            style={{
              position: "absolute",
              left: cx,
              top: BOX_MID,
              transform: "translate(-50%, -50%)",
            }}
          >
            <M tex={BOX_LABELS[i]} size={18} />
          </div>
        ))}

        {/* top bound: the capacity ceiling (amber) */}
        <div
          style={{
            position: "absolute",
            left: W / 2,
            top: 40,
            transform: "translate(-50%, -50%)",
            whiteSpace: "nowrap",
          }}
        >
          <M tex={String.raw`\textcolor{${ACCENT}}{I(W;\hat W) \le nC}`} size={17} />
        </div>

        {/* bottom bound: Fano (blue) */}
        <div
          style={{
            position: "absolute",
            left: W / 2,
            top: 160,
            transform: "translate(-50%, -50%)",
            whiteSpace: "nowrap",
          }}
        >
          <M
            tex={String.raw`\textcolor{${SUPPORT}}{H(W \mid \hat W) \le 1 + P_e\, nR}`}
            size={16}
          />
        </div>
      </div>

      {/* the two bounds meet: boxed amber conclusion */}
      <div
        style={{
          border: `1.6px solid ${ACCENT}`,
          borderRadius: 8,
          padding: "10px 18px",
        }}
      >
        <M
          display
          tex={String.raw`nR = H(W) \le \textcolor{${ACCENT}}{nC} + \textcolor{${SUPPORT}}{1 + P_e\, nR} \;\;\Rightarrow\;\; \textcolor{${ACCENT}}{P_e \ge 1 - \frac{C}{R} - \frac{1}{nR}}`}
        />
      </div>
    </div>
  );
}
