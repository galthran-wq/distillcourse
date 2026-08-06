import type { ReactNode } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * FanoLeCamReduction — the two-point reduction that turns estimating a
 * Bernoulli mean into guessing one fair coin flip.
 *
 * A left-to-right chain of five boxes: W ~ Bern(1/2) (blue) → θ = 1/2 +
 * κ(−1)^W Δ_n (amber) → X^n i.i.d. Bern(θ) → θ̂ (the estimator we are given)
 * → Ŵ = 1{θ̂ ≤ 1/2} (blue), joined by straight data-flow arrows. An inset
 * above the parameter end of the chain plots the two-point prior: a parameter
 * axis from 0 to 1 carrying two spikes at 1/2 ± κΔ_n, their gap braced and
 * labelled 2κΔ_n. Above the θ → X^n segment, an amber bracket names the
 * data-processing ceiling I(W;Ŵ) ≤ I(θ;X^n); under the whole chain, a blue
 * bracket names the Fano floor I(W;Ŵ) ≥ 1 − H_2(P_e) with P_e ≤ κ^{-2} from
 * Chebyshev.
 *
 * Color roles: blue = the binary guessing problem the reduction manufactures
 * (W, Ŵ, and Fano's floor on it); amber = the parameter and the information
 * the samples carry about it (the prior, the data-processing ceiling);
 * currentColor = the sampling and estimation machinery in between.
 *
 * One idea: a good estimator would decide a coin flip that the samples
 * barely encode.
 *
 * Recreated after Polyanskiy & Wu §5.4 (idea only — the source has no figure).
 */

const W = 790;
const H = 322;

// ── chain geometry ────────────────────────────────────────────────────────
const BOX_W = [124, 162, 96, 120, 138];
const BOX_H = 54;
const BOX_TOP = 190;
const BOX_MID = BOX_TOP + BOX_H / 2; // 217
const BOX_BOT = BOX_TOP + BOX_H; // 244

const MARGIN = 10;
const GAP = (W - 2 * MARGIN - BOX_W.reduce((a, b) => a + b, 0)) / 4;

/** left edge of each box */
const BOX_X = BOX_W.reduce<number[]>((acc, w, i) => {
  acc.push(i === 0 ? MARGIN : acc[i - 1] + BOX_W[i - 1] + GAP);
  return acc;
}, []);
const CX = BOX_X.map((x, i) => x + BOX_W[i] / 2);

// ── inset geometry (the two-point prior) ──────────────────────────────────
const AX_L = 210;
const AX_R = 490;
const AX_C = (AX_L + AX_R) / 2; // 350 = θ = 1/2
const AX_Y = 90;
const SPIKE_TOP = 56;
const OFFSET = 25; // κΔ_n, in axis pixels
const BRACE_Y = 44;

// ── bracket bands ─────────────────────────────────────────────────────────
const TOP_BR = 170; // amber bracket over θ → X^n, legs pointing down
const BOT_BR = 262; // blue bracket under the whole chain, legs pointing up

const BLUE = String.raw`\textcolor{${SUPPORT}}`;
const AMBER = String.raw`\textcolor{${ACCENT}}`;

const BOXES: {
  tex: string;
  size: number;
  sub: ReactNode;
  color: string;
}[] = [
  {
    tex: String.raw`${BLUE}{W \sim \mathrm{Bern}(\tfrac12)}`,
    size: 13,
    sub: "the hidden bit",
    color: SUPPORT,
  },
  {
    tex: String.raw`${AMBER}{\theta = \tfrac12 + \kappa(-1)^{W}\Delta_n}`,
    size: 13,
    sub: "the parameter",
    color: ACCENT,
  },
  {
    tex: String.raw`X^n`,
    size: 16,
    sub: <M tex={String.raw`\text{i.i.d. } \mathrm{Bern}(\theta)`} size={10} />,
    color: "currentColor",
  },
  {
    tex: String.raw`\hat\theta`,
    size: 17,
    sub: "the given estimator",
    color: "currentColor",
  },
  {
    tex: String.raw`${BLUE}{\hat W = \mathbf{1}\{\hat\theta \le \tfrac12\}}`,
    size: 13,
    sub: "the induced decoder",
    color: SUPPORT,
  },
];

/** straight data-flow arrow at chain height */
function FlowArrow({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <g>
      <line
        x1={x1}
        y1={BOX_MID}
        x2={x2 - 5}
        y2={BOX_MID}
        stroke="currentColor"
        strokeOpacity="0.65"
        strokeWidth="1.5"
      />
      <path
        d={`M ${x2} ${BOX_MID} l -7.5 -3.6 l 0 7.2 Z`}
        fill="currentColor"
        fillOpacity="0.65"
      />
    </g>
  );
}

/** absolutely positioned overlay, centered on (x, y) */
function At({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

export default function FanoLeCamReduction() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        maxWidth: W,
      }}
    >
      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {/* ── inset: the two-point prior ─────────────────────────────── */}
          <line
            x1={AX_L}
            y1={AX_Y}
            x2={AX_R}
            y2={AX_Y}
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeWidth="1.3"
          />
          {[AX_L, AX_C, AX_R].map((x) => (
            <line
              key={`tick${x}`}
              x1={x}
              y1={AX_Y - 4}
              x2={x}
              y2={AX_Y + 4}
              stroke="currentColor"
              strokeOpacity={x === AX_C ? 0.3 : 0.45}
              strokeWidth="1.3"
            />
          ))}
          {/* the two mass points */}
          {[AX_C - OFFSET, AX_C + OFFSET].map((x) => (
            <g key={`spike${x}`}>
              <line
                x1={x}
                y1={AX_Y}
                x2={x}
                y2={SPIKE_TOP}
                stroke={ACCENT}
                strokeWidth="2"
              />
              <circle cx={x} cy={SPIKE_TOP} r="3.6" fill={ACCENT} />
            </g>
          ))}
          {/* brace over the gap between the two points */}
          <path
            d={`M ${AX_C - OFFSET} ${BRACE_Y + 7} L ${AX_C - OFFSET} ${BRACE_Y} L ${AX_C + OFFSET} ${BRACE_Y} L ${AX_C + OFFSET} ${BRACE_Y + 7}`}
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.5"
            strokeOpacity="0.9"
          />
          <text
            x={AX_C}
            y={126}
            textAnchor="middle"
            fontSize="11.5"
            fontStyle="italic"
            fill="currentColor"
            opacity="0.6"
          >
            the two-point prior
          </text>

          {/* ── amber bracket: θ → X^n, legs down onto the chain ────────── */}
          <path
            d={`M ${CX[1]} ${TOP_BR + 9} L ${CX[1]} ${TOP_BR} L ${CX[2]} ${TOP_BR} L ${CX[2]} ${TOP_BR + 9}`}
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.6"
            strokeOpacity="0.9"
          />

          {/* ── the chain ───────────────────────────────────────────────── */}
          {BOX_W.map((w, i) => (
            <rect
              key={`box${i}`}
              x={BOX_X[i]}
              y={BOX_TOP}
              width={w}
              height={BOX_H}
              rx="7"
              fill="none"
              stroke={BOXES[i].color}
              strokeWidth="1.6"
              strokeOpacity={BOXES[i].color === "currentColor" ? 0.5 : 0.85}
            />
          ))}
          {BOX_W.slice(0, 4).map((w, i) => (
            <FlowArrow
              key={`arr${i}`}
              x1={BOX_X[i] + w}
              x2={BOX_X[i + 1]}
            />
          ))}

          {/* ── blue bracket under the whole chain, legs up ─────────────── */}
          <path
            d={`M ${CX[0]} ${BOT_BR - 9} L ${CX[0]} ${BOT_BR} L ${CX[4]} ${BOT_BR} L ${CX[4]} ${BOT_BR - 9}`}
            fill="none"
            stroke={SUPPORT}
            strokeWidth="1.6"
            strokeOpacity="0.9"
          />
        </svg>

        {/* ── KaTeX overlays ───────────────────────────────────────────── */}

        {/* inset: gap label and axis ticks */}
        <At x={AX_C} y={BRACE_Y - 13}>
          <M tex={String.raw`${AMBER}{2\kappa\Delta_n}`} size={13} />
        </At>
        <At x={AX_L} y={AX_Y + 15}>
          <M tex={String.raw`0`} size={11} />
        </At>
        <At x={AX_C} y={AX_Y + 15}>
          <M tex={String.raw`\tfrac12`} size={11} />
        </At>
        <At x={AX_R} y={AX_Y + 15}>
          <M tex={String.raw`1`} size={11} />
        </At>
        <At x={AX_R + 22} y={AX_Y}>
          <M tex={String.raw`\theta`} size={12.5} />
        </At>

        {/* the data-processing ceiling (amber) */}
        <At x={(CX[1] + CX[2]) / 2} y={TOP_BR - 22}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <M
              tex={String.raw`${AMBER}{\text{data processing: } I(W;\hat W) \le I(\theta; X^n)}`}
              size={13}
            />
            <span style={{ fontSize: 11, color: ACCENT, opacity: 0.75 }}>
              small when the two points are close
            </span>
          </span>
        </At>

        {/* box contents */}
        {CX.map((cx, i) => (
          <At key={`lbl${i}`} x={cx} y={BOX_MID}>
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <M tex={BOXES[i].tex} size={BOXES[i].size} />
              <span style={{ fontSize: 10, opacity: 0.55 }}>{BOXES[i].sub}</span>
            </span>
          </At>
        ))}

        {/* the Fano floor (blue) */}
        <At x={W / 2} y={BOT_BR + 20}>
          <M
            tex={String.raw`${BLUE}{\text{Fano: } I(W;\hat W) \ge 1 - H_2(P_e)}`}
            size={14}
          />
        </At>
        <At x={W / 2} y={BOT_BR + 42}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 11, color: SUPPORT, opacity: 0.75 }}>
              and
            </span>
            <M tex={String.raw`${BLUE}{P_e \le \kappa^{-2}}`} size={12.5} />
            <span style={{ fontSize: 11, color: SUPPORT, opacity: 0.75 }}>
              by Chebyshev
            </span>
          </span>
        </At>
      </div>
    </div>
  );
}
