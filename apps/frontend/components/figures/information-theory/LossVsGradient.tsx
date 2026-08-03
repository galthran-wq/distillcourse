import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * LossVsGradient — the penalty is unbounded, the update is not.
 *
 * One plot, one shared x-axis q(true) (linear, 0 to 1), two curves on two
 * y-axes:
 *   amber, LEFT axis "loss (bits)" 0..10 : -log2 q(true), which leaves the top
 *     of the frame near q = 0 and keeps going;
 *   blue, RIGHT axis "|gradient| per logit" 0..1 : 1 - q, a straight line that
 *     reaches its ceiling of 1 at q = 0 and stops there — the ceiling is drawn
 *     as a blue dashed line with visible empty space above it, which is exactly
 *     the room the amber curve uses.
 *
 * Two guides read the same two examples off both curves: q = 0.9 (mildly wrong)
 * and q = 0.001 (confidently wrong). The readout strip under the axis states
 * the payoff as a tally: x65 the loss, x10 the step.
 *
 * Colors (playbook rule 1): amber = the loss, everywhere — curve, dots, left
 * axis title and ticks, the "65" tally; blue = the gradient magnitude, likewise
 * on its own axis. currentColor = axes, guides, q values, gloss. Dual axes are
 * unreadable without that binding, so the tick labels carry the hue too.
 */

// plot box
const X0 = 66; // q = 0 (the asymptote)
const X1 = 512; // q = 1
const T = 70; // top of the plot box = loss 10 bits
const B = 318; // baseline = loss 0 = gradient 0
const GTOP = 104; // gradient = 1 sits BELOW the frame top: the ceiling
const LMAX = 10;

const px = (q: number) => X0 + q * (X1 - X0);
const pyL = (loss: number) => B - (loss / LMAX) * (B - T);
const pyG = (g: number) => B - g * (B - GTOP);
const L2 = (q: number) => -Math.log2(q);

// -log2 q, sampled evenly in loss so the steep part stays smooth; the top end
// runs past the frame top (y = 22) so the curve visibly exits the chart.
const LOSS_CURVE = (() => {
  const top = (B - 22) / ((B - T) / LMAX);
  const pts: string[] = [];
  for (let loss = top; loss >= -1e-9; loss -= 0.04) {
    pts.push(`${px(Math.pow(2, -loss)).toFixed(2)} ${pyL(loss).toFixed(2)}`);
  }
  return "M " + pts.join(" L ");
})();

const LOSS_TICKS = [0, 2, 4, 6, 8, 10];
const GRAD_TICKS = [0, 0.25, 0.5, 0.75, 1];
const X_TICKS: [number, string][] = [
  [0, "0"],
  [0.25, "0.25"],
  [0.5, "0.5"],
  [0.75, "0.75"],
  [1, "1"],
];

const QA = 0.001; // confidently wrong
const QB = 0.9; // mildly wrong

/** readout strip geometry */
const RY_Q = 382;
const RY_LOSS = 404;
const RY_GRAD = 424;

function Ratio({ y, text, tail, color }: { y: number; text: string; tail: string; color: string }) {
  return (
    <g>
      <line x1={398} y1={y - 4} x2={312} y2={y - 4} stroke={color} strokeWidth="1" opacity="0.55" />
      <line x1={222} y1={y - 4} x2={139} y2={y - 4} stroke={color} strokeWidth="1" opacity="0.55" />
      <path d={`M 133 ${y - 4} l 7 -3 l 0 6 Z`} fill={color} opacity="0.55" />
      <text x={267} y={y} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={color}>
        {text}
        <tspan fontSize="11" fontWeight="400" fill="currentColor" opacity="0.6">
          {tail}
        </tspan>
      </text>
    </g>
  );
}

export default function LossVsGradient() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 640 }}>
      <svg width="100%" viewBox="0 0 600 442" aria-hidden="true">
        {/* ── left-axis gridlines + ticks (loss) ── */}
        {LOSS_TICKS.map((t) => {
          const y = pyL(t);
          return (
            <g key={`l${t}`}>
              <line
                x1={X0}
                y1={y}
                x2={X1}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity={t === 0 ? 0.45 : 0.08}
              />
              <text x={X0 - 8} y={y + 4} textAnchor="end" fontSize="11" fill={ACCENT} opacity="0.85">
                {t}
              </text>
            </g>
          );
        })}

        {/* ── right-axis ticks (gradient magnitude) ── */}
        {GRAD_TICKS.map((g) => {
          const y = pyG(g);
          return (
            <g key={`g${g}`}>
              <line x1={X1} y1={y} x2={X1 + 5} y2={y} stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <text x={X1 + 10} y={y + 4} fontSize="11" fill={SUPPORT} opacity="0.9">
                {g === 0 ? "0" : g === 1 ? "1" : g.toString()}
              </text>
            </g>
          );
        })}

        {/* ── axes ── */}
        <line x1={X0} y1={B} x2={X1} y2={B} stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1={X0} y1={T} x2={X0} y2={B} stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
        <line x1={X1} y1={GTOP} x2={X1} y2={B} stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />

        {/* axis titles */}
        <text transform={`translate(20 ${(T + B) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill={ACCENT}>
          loss (bits)
        </text>
        <text
          transform={`translate(572 ${(GTOP + B) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="12"
          fill={SUPPORT}
        >
          |gradient| per logit
        </text>

        {/* x ticks + title */}
        {X_TICKS.map(([q, lbl]) => (
          <g key={`x${lbl}`}>
            <line x1={px(q)} y1={B} x2={px(q)} y2={B + 5} stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <text
              x={q === 0 ? X0 - 6 : px(q)}
              y={B + 18}
              textAnchor={q === 0 ? "end" : "middle"}
              fontSize="11"
              fill="currentColor"
              opacity="0.55"
            >
              {lbl}
            </text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y={B + 36} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.6">
          q(true) — the model&rsquo;s probability on the class that happened
        </text>

        {/* ── the gradient ceiling: 1, and the empty room above it ── */}
        <line
          x1={X0}
          y1={GTOP}
          x2={X1}
          y2={GTOP}
          stroke={SUPPORT}
          strokeWidth="1.4"
          strokeDasharray="5 4"
          opacity="0.75"
        />
        <text x={X1 - 6} y={GTOP - 8} textAnchor="end" fontSize="12" fontWeight="600" fill={SUPPORT}>
          ceiling: the step never exceeds 1
        </text>

        {/* ── the gradient line: 1 − q ── */}
        <line x1={px(0)} y1={pyG(1)} x2={px(1)} y2={pyG(0)} stroke={SUPPORT} strokeWidth="2.6" />
        <text x={344} y={214} fontSize="13" fontWeight="700" fill={SUPPORT}>
          1 &#8722; q
        </text>

        {/* ── the loss curve: −log2 q, leaving the frame ── */}
        <path d={LOSS_CURVE} fill="none" stroke={ACCENT} strokeWidth="2.6" />
        <path d={`M ${X0 + 0.2} 14 l -4 8 l 8 0 Z`} fill={ACCENT} />
        <text x={80} y={26} fontSize="12.5" fontWeight="700" fill={ACCENT}>
          loss: unbounded
        </text>
        <text x={80} y={41} fontSize="11" fill="currentColor" opacity="0.6">
          no ceiling — it leaves the chart
        </text>
        <text x={296} y={296} fontSize="13" fontWeight="700" fill={ACCENT}>
          &#8722;log
          <tspan fontSize="9.5" dy="3">
            2
          </tspan>
          <tspan dy="-3"> q</tspan>
        </text>

        {/* ── guide at q = 0.9, with its two readings ── */}
        <line
          x1={px(QB)}
          y1={T}
          x2={px(QB)}
          y2={370}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.4"
        />
        <circle cx={px(QB)} cy={pyG(1 - QB)} r="4.2" fill={SUPPORT} />
        <circle cx={px(QB)} cy={pyL(L2(QB))} r="4.2" fill={ACCENT} />

        {/* ── guide at q = 0.001: it sits on the axis, which is the point ── */}
        <line
          x1={px(QA)}
          y1={B}
          x2={px(QA)}
          y2={370}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.4"
        />
        <circle cx={px(QA)} cy={pyG(1 - QA)} r="4.2" fill={SUPPORT} />
        <circle cx={px(QA)} cy={pyL(L2(QA))} r="4.2" fill={ACCENT} />
        <path
          d={`M 84 162 Q 74 142 ${px(QA) + 3} 118`}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.4"
        />
        <text x={87} y={170} fontSize="11" fill="currentColor" opacity="0.6">
          q = 0.001
        </text>

        {/* ── readout strip ── */}
        <line x1={X0} y1={366} x2={X1} y2={366} stroke="currentColor" strokeWidth="1" opacity="0.15" />

        <text x={X0} y={RY_Q} fontSize="12.5" fontWeight="700" fill="currentColor">
          q(true) = 0.001
          <tspan fontSize="11" fontWeight="400" opacity="0.6">
            {" "}
            confidently wrong
          </tspan>
        </text>
        <text x={px(QB)} y={RY_Q} textAnchor="end" fontSize="12.5" fontWeight="700" fill="currentColor">
          q(true) = 0.9
          <tspan fontSize="11" fontWeight="400" opacity="0.6">
            {" "}
            mildly wrong
          </tspan>
        </text>

        <text x={X0} y={RY_LOSS} fontSize="13" fontWeight="700" fill={ACCENT}>
          9.97 bits
        </text>
        <text x={px(QB)} y={RY_LOSS} textAnchor="end" fontSize="13" fontWeight="700" fill={ACCENT}>
          0.15 bits
        </text>
        <Ratio y={RY_LOSS} text="&#215;65" tail="  the loss" color={ACCENT} />

        <text x={X0} y={RY_GRAD} fontSize="13" fontWeight="700" fill={SUPPORT}>
          0.999
        </text>
        <text x={px(QB)} y={RY_GRAD} textAnchor="end" fontSize="13" fontWeight="700" fill={SUPPORT}>
          0.10
        </text>
        <Ratio y={RY_GRAD} text="&#215;10" tail="  the step" color={SUPPORT} />
      </svg>

      {/* legend: the two curves, named with their math (playbook rule 11) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 26px", marginTop: 12, fontSize: 13 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 22, borderTop: `3px solid ${ACCENT}` }} />
          <M tex={String.raw`\text{loss} = -\log_2 q(\text{true})`} size={13} />
          <span style={{ color: ACCENT, fontWeight: 600 }}>: unbounded</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-block", width: 22, borderTop: `3px solid ${SUPPORT}` }} />
          <M
            tex={String.raw`\left|\partial \mathcal{L}/\partial z_{\text{true}}\right| = 1 - q`}
            size={13}
          />
          <span style={{ color: SUPPORT, fontWeight: 600 }}>: capped at 1</span>
        </span>
      </div>

      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
        the softmax Jacobian cancels the <M tex={String.raw`1/q`} size={12.5} />; squared error does not
      </div>
    </div>
  );
}
