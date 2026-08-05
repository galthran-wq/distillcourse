import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * BscVsBecBars — at matched noise 0.2, erasure beats flipping (playbook rule 8:
 * twin bars on one shared scale, the payoff stated as a tally).
 *
 * Two horizontal capacity bars share a bits axis 0 … 1, with a dashed
 * currentColor ceiling at 1 bit ("noiseless"):
 *   top    BEC(0.2):  amber, length 0.8   — C = 1 − e = 0.8      "failures are flagged"
 *   bottom BSC(0.2):  blue,  length 0.278 — C = 1 − H(0.2) ≈ 0.28 "failures are silent"
 * A small monochrome channel icon sits left of each bar (0/1→0/?/1 erasure;
 * 0/1→0/1 with crossing arrows). Colors: amber = BEC (the winner/subject),
 * blue = BSC (the contrast), currentColor = axis, ceiling, icons, text.
 *
 * One idea: erasure beats flipping at the same noise level — the 0.52-bit gap
 * is the value of knowing which symbols failed.
 */

const WHITE = "#fff";

const W = 640;
const HGT = 222;

const X0 = 96; // bits = 0
const BARW = 430; // px for a full 1 bit
const X1 = X0 + BARW; // ceiling (1 bit)
const bx = (bits: number) => X0 + bits * BARW;

const BEC_C = 0.8; // C = 1 - e
const BSC_C = 0.278; // C = 1 - H(0.2)

const BAR_H = 34;
const R1_Y = 64;
const R1_MID = R1_Y + BAR_H / 2;
const R2_Y = 140;
const R2_MID = R2_Y + BAR_H / 2;
const AXIS_Y = 200;

const BEC_END = bx(BEC_C);
const BSC_END = bx(BSC_C);

/** BEC(0.2): 0/1 → 0/?/1. Each input reaches its own symbol and the ? erasure. */
function BecIcon({ y }: { y: number }) {
  const in0 = [12, 10];
  const in1 = [12, 36];
  const o0 = [38, 4];
  const oq = [38, 23];
  const o1 = [38, 42];
  const line = (a: number[], b: number[]) => (
    <line
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.6"
      markerEnd="url(#bvb-arrow)"
    />
  );
  return (
    <g transform={`translate(4 ${y - 23})`}>
      {line(in0, o0)}
      {line(in0, oq)}
      {line(in1, o1)}
      {line(in1, oq)}
      {[in0, in1].map((p, i) => (
        <circle key={`i${i}`} cx={p[0]} cy={p[1]} r="1.8" fill="currentColor" />
      ))}
      {[o0, oq, o1].map((p, i) => (
        <circle key={`o${i}`} cx={p[0]} cy={p[1]} r="1.8" fill="currentColor" opacity="0.55" />
      ))}
      <text x="5" y="13" textAnchor="end" fontSize="8" fill="currentColor" opacity="0.6">0</text>
      <text x="5" y="39" textAnchor="end" fontSize="8" fill="currentColor" opacity="0.6">1</text>
      <text x="45" y="7" fontSize="8" fill="currentColor" opacity="0.6">0</text>
      <text x="45" y="26" fontSize="8" fill="currentColor" opacity="0.6">?</text>
      <text x="45" y="45" fontSize="8" fill="currentColor" opacity="0.6">1</text>
    </g>
  );
}

/** BSC(0.2): 0/1 → 0/1 with crossing arrows (each symbol may flip). */
function BscIcon({ y }: { y: number }) {
  const in0 = [12, 11];
  const in1 = [12, 35];
  const o0 = [38, 11];
  const o1 = [38, 35];
  const line = (a: number[], b: number[]) => (
    <line
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.6"
      markerEnd="url(#bvb-arrow)"
    />
  );
  return (
    <g transform={`translate(4 ${y - 23})`}>
      {line(in0, o0)}
      {line(in1, o1)}
      {line(in0, o1)}
      {line(in1, o0)}
      {[in0, in1].map((p, i) => (
        <circle key={`i${i}`} cx={p[0]} cy={p[1]} r="1.8" fill="currentColor" />
      ))}
      {[o0, o1].map((p, i) => (
        <circle key={`o${i}`} cx={p[0]} cy={p[1]} r="1.8" fill="currentColor" opacity="0.55" />
      ))}
      <text x="5" y="14" textAnchor="end" fontSize="8" fill="currentColor" opacity="0.6">0</text>
      <text x="5" y="38" textAnchor="end" fontSize="8" fill="currentColor" opacity="0.6">1</text>
      <text x="45" y="14" fontSize="8" fill="currentColor" opacity="0.6">0</text>
      <text x="45" y="38" fontSize="8" fill="currentColor" opacity="0.6">1</text>
    </g>
  );
}

export default function BscVsBecBars() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      <div style={{ position: "relative", width: W, height: HGT }}>
        <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
          <defs>
            <marker
              id="bvb-arrow"
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
            >
              <path d="M0 0 L5 2.5 L0 5 Z" fill="currentColor" opacity="0.6" />
            </marker>
          </defs>

          {/* dashed ceiling at 1 bit, across both rows */}
          <line
            x1={X1}
            y1={30}
            x2={X1}
            y2={AXIS_Y}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeDasharray="4 3"
            strokeOpacity="0.7"
          />

          {/* channel icons */}
          <BecIcon y={R1_MID} />
          <BscIcon y={R2_MID} />

          {/* row 1: BEC — amber bar to 0.8 */}
          <rect
            x={X0}
            y={R1_Y}
            width={BARW}
            height={BAR_H}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.28"
          />
          <rect x={X0} y={R1_Y} width={BEC_END - X0} height={BAR_H} fill={ACCENT} opacity="0.92" />
          <text
            x={(X0 + BEC_END) / 2}
            y={R1_MID + 4}
            textAnchor="middle"
            fontSize="11"
            fontStyle="italic"
            fill={WHITE}
          >
            failures are flagged
          </text>

          {/* row 2: BSC — blue bar to 0.278 */}
          <rect
            x={X0}
            y={R2_Y}
            width={BARW}
            height={BAR_H}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.28"
          />
          <rect x={X0} y={R2_Y} width={BSC_END - X0} height={BAR_H} fill={SUPPORT} opacity="0.92" />
          <text
            x={(X0 + BSC_END) / 2}
            y={R2_MID + 4}
            textAnchor="middle"
            fontSize="11"
            fontStyle="italic"
            fill={WHITE}
          >
            failures are silent
          </text>

          {/* bits axis */}
          <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
          {[0, 1].map((b) => (
            <g key={`t${b}`}>
              <line x1={bx(b)} y1={AXIS_Y} x2={bx(b)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
              <text x={bx(b)} y={AXIS_Y + 16} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6">
                {b}
              </text>
            </g>
          ))}
          {/* colored ticks bind bar ends to their capacities */}
          <line x1={BEC_END} y1={AXIS_Y} x2={BEC_END} y2={AXIS_Y + 5} stroke={ACCENT} strokeWidth="1.4" />
          <text x={BEC_END} y={AXIS_Y + 16} textAnchor="middle" fontSize="11" fill={ACCENT} fontWeight="600">
            0.8
          </text>
          <line x1={BSC_END} y1={AXIS_Y} x2={BSC_END} y2={AXIS_Y + 5} stroke={SUPPORT} strokeWidth="1.4" />
          <text x={BSC_END} y={AXIS_Y + 16} textAnchor="middle" fontSize="11" fill={SUPPORT} fontWeight="600">
            0.28
          </text>
          <text x={X1 + 8} y={AXIS_Y + 4} fontSize="11" fill="currentColor" opacity="0.55" fontStyle="italic">
            bits
          </text>
        </svg>

        {/* ceiling label */}
        <div
          style={{
            position: "absolute",
            left: X1,
            top: 10,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            opacity: 0.6,
            fontStyle: "italic",
          }}
        >
          noiseless
        </div>

        {/* row 1 equation label (above the amber bar) */}
        <div style={{ position: "absolute", left: X0, top: 40, whiteSpace: "nowrap" }}>
          <b style={{ color: ACCENT }}>BEC(0.2)</b>
          <span style={{ opacity: 0.55 }}>: </span>
          <M tex={String.raw`C = 1 - e = 0.8`} size={13} />
        </div>

        {/* row 2 equation label (above the blue bar) */}
        <div style={{ position: "absolute", left: X0, top: 116, whiteSpace: "nowrap" }}>
          <b style={{ color: SUPPORT }}>BSC(0.2)</b>
          <span style={{ opacity: 0.55 }}>: </span>
          <M tex={String.raw`C = 1 - H(0.2) \approx 0.28`} size={13} />
        </div>
      </div>

      {/* payoff line */}
      <div style={{ marginTop: 8, maxWidth: W }}>
        same 20% noise — knowing which symbols failed is worth <b>0.52 bits</b> per use
      </div>
    </div>
  );
}
