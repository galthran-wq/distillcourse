import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * ConfidentWrongBlowup — the single-example cross-entropy loss as the surprisal
 * curve. x = q(true), the probability the model assigns to the outcome that
 * actually happened; y = the loss -log2 q(true), in bits.
 *
 * The amber curve y = -log2 x with amber dots at q = 0.9, 0.5, 0.1, 0.01, 0.001
 * (losses 0.15, 1, 3.3, 6.6, 10 bits). To the right (q -> 1) the loss sinks to
 * 0 ("confident and right"). To the left (q -> 0) the curve runs off the top of
 * the frame; the y-axis is the asymptote q(true) = 0 where the loss diverges.
 *
 * Colors: amber = the loss curve and its dots (playbook rule 1: bound to
 * q(true) in the headline formula). Warning rose only on the blowup annotation
 * and the asymptote label (rule 10: warning color is reserved for the "don't").
 * currentColor = axes, ticks, structure, and the "confident and right" note.
 *
 * One idea: the log punishes overconfidence without bound — the same curve, the
 * same reason, as a rare event's surprisal (reuses the surprisal curve from
 * lesson 1, `what-is-surprise`).
 */

const WARN = "#d1495b"; // warning rose: the "don't" — the unbounded blowup

// plot pixel box
const X0 = 62; // y-axis (q = 0, the asymptote)
const X1 = 486; // right edge (q = 1)
const T = 40; // top (loss = YMAX)
const B = 300; // bottom (loss = 0)
const YMAX = 10;

const px = (q: number) => X0 + q * (X1 - X0);
const py = (loss: number) => B - (loss / YMAX) * (B - T);

// the curve y = -log2 q, sampled evenly in loss so the steep part is smooth
const CURVE = (() => {
  const pts: string[] = [];
  for (let loss = YMAX; loss >= -1e-6; loss -= 0.05) {
    pts.push(`${px(Math.pow(2, -loss)).toFixed(2)} ${py(loss).toFixed(2)}`);
  }
  return "M " + pts.join(" L ");
})();

const YT = [0, 2, 4, 6, 8, 10];
const XT: [number, string][] = [
  [0, "0"],
  [0.1, "0.1"],
  [0.5, "0.5"],
  [0.9, "0.9"],
  [1, "1"],
];

const L2 = (q: number) => -Math.log2(q);

export default function ConfidentWrongBlowup() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 600 }}>
      <div style={{ marginBottom: 6 }}>
        <M
          tex={String.raw`\text{loss} \;=\; -\log_2 \textcolor{${ACCENT}}{q(\text{true})}`}
          size={15}
        />
      </div>

      <svg width="100%" viewBox="0 0 560 360" aria-hidden="true">
        {/* y gridlines + ticks */}
        {YT.map((t) => {
          const y = py(t);
          return (
            <g key={`y${t}`}>
              <line
                x1={X0}
                y1={y}
                x2={X1}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity={t === 0 ? 0.45 : 0.1}
              />
              <text x={X0 - 8} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55">
                {t}
              </text>
            </g>
          );
        })}

        {/* axes */}
        <line x1={X0} y1={B} x2={X1} y2={B} stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
        <line x1={X0} y1={T} x2={X0} y2={B} stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
        {/* x-axis arrowhead + title */}
        <path d={`M ${X1 + 8} ${B} l -6 -3 l 0 6 Z`} fill="currentColor" opacity="0.6" />
        <text x={X1 + 12} y={B + 4} fontSize="12" fill="currentColor" opacity="0.6">
          q(true)
        </text>
        {/* x ticks */}
        {XT.map(([q, lbl]) => (
          <g key={`x${lbl}`}>
            <line x1={px(q)} y1={B} x2={px(q)} y2={B + 5} stroke="currentColor" strokeWidth="1" opacity="0.55" />
            <text x={px(q)} y={B + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
              {lbl}
            </text>
          </g>
        ))}
        {/* y-axis title */}
        <text
          transform={`translate(20 ${(T + B) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="11.5"
          fill="currentColor"
          opacity="0.6"
        >
          loss (bits)
        </text>

        {/* ── the asymptote: q(true) = 0 is the y-axis; loss diverges ── */}
        <line x1={X0} y1={T} x2={X0} y2={8} stroke={WARN} strokeWidth="1.6" strokeDasharray="4 3" />
        <path d={`M ${X0} 2 l -3.5 7 l 7 0 Z`} fill={WARN} />
        <text x={X0 + 8} y={20} fontSize="11.5" fontWeight="600" fill={WARN}>
          q(true) = 0 &#8658; loss = &#8734;
        </text>

        {/* ── the loss curve ── */}
        <path d={CURVE} fill="none" stroke={ACCENT} strokeWidth="2.6" />
        <text x={392} y={150} fontSize="12.5" fontWeight="600" fill={ACCENT}>
          &#8722;log
          <tspan fontSize="9" dy="3">
            2
          </tspan>
          <tspan dy="-3"> q(true)</tspan>
        </text>

        {/* ── dots on the curve ── */}
        {/* q = 0.001 → 10 bits (the Task's crossing point, near the top) */}
        <line x1={px(0.001)} y1={py(L2(0.001))} x2={116} y2={48} stroke="currentColor" strokeWidth="0.9" opacity="0.4" />
        <circle cx={px(0.001)} cy={py(L2(0.001))} r="4.5" fill={ACCENT} />
        <text x={120} y={46} fontSize="12" fontWeight="700" fill={ACCENT}>
          10 bits
        </text>
        <text x={120} y={59} fontSize="10.5" fill="currentColor" opacity="0.55">
          q = 0.001
        </text>

        {/* q = 0.01 → 6.6 bits */}
        <line x1={px(0.01)} y1={py(L2(0.01))} x2={116} y2={py(L2(0.01))} stroke="currentColor" strokeWidth="0.9" opacity="0.4" />
        <circle cx={px(0.01)} cy={py(L2(0.01))} r="4.5" fill={ACCENT} />
        <text x={120} y={py(L2(0.01)) - 2} fontSize="12" fontWeight="700" fill={ACCENT}>
          6.6 bits
        </text>
        <text x={120} y={py(L2(0.01)) + 11} fontSize="10.5" fill="currentColor" opacity="0.55">
          q = 0.01
        </text>

        {/* q = 0.1 → 3.3 bits */}
        <circle cx={px(0.1)} cy={py(L2(0.1))} r="4.5" fill={ACCENT} />
        <text x={px(0.1) + 9} y={py(L2(0.1)) - 4} fontSize="12" fontWeight="700" fill={ACCENT}>
          3.3 bits
        </text>

        {/* q = 0.5 → 1 bit */}
        <circle cx={px(0.5)} cy={py(1)} r="4.5" fill={ACCENT} />
        <text x={px(0.5) + 9} y={py(1) - 4} fontSize="12" fontWeight="700" fill={ACCENT}>
          1 bit
        </text>

        {/* q = 0.9 → 0.15 bits */}
        <circle cx={px(0.9)} cy={py(L2(0.9))} r="4.5" fill={ACCENT} />
        <text x={px(0.9) - 8} y={py(L2(0.9)) - 7} textAnchor="end" fontSize="12" fontWeight="700" fill={ACCENT}>
          0.15 bits
        </text>

        {/* ── annotation: confident and right (currentColor) ── */}
        <text x={318} y={244} fontSize="12" fill="currentColor" opacity="0.75">
          confident and right:
        </text>
        <text x={318} y={259} fontSize="12" fill="currentColor" opacity="0.75">
          loss &#8594; 0
        </text>
        <path
          d={`M 366 262 Q 430 272 468 ${B - 4}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <path d={`M 468 ${B - 4} l -6 -1.5 l 3 5.5 Z`} fill="currentColor" opacity="0.5" />

        {/* ── annotation: confident and wrong (warning) ── */}
        <text x={150} y={78} fontSize="12.5" fontWeight="700" fill={WARN}>
          confident and wrong:
        </text>
        <text x={150} y={94} fontSize="11.5" fontWeight="600" fill={WARN}>
          large surprisal = large loss,
        </text>
        <text x={150} y={109} fontSize="11.5" fontWeight="600" fill={WARN}>
          unbounded
        </text>
        <path
          d={`M 148 88 Q 100 92 ${px(0.006) + 3} 96`}
          fill="none"
          stroke={WARN}
          strokeWidth="1"
          opacity="0.6"
        />
        <path d={`M ${px(0.006) + 3} 96 l 7 -1 l -4 6 Z`} fill={WARN} opacity="0.6" />
      </svg>

      <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.45 }}>
        The log punishes <b>overconfidence</b> without bound: a vanishing{" "}
        <M tex={String.raw`\textcolor{${ACCENT}}{q(\text{true})}`} size={12.5} /> is a rare event under the
        model, and its surprisal — the loss — grows without limit. Same curve, same reason, as a rare
        event&rsquo;s surprisal.
      </div>
    </div>
  );
}
