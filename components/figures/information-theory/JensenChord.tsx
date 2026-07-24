import { ACCENT, SUPPORT } from "../palette";

/**
 * Gibbs via Jensen (after Cover & Thomas Fig. 2.6, redrawn — not copied): why
 * D(p‖q) >= 0. Horizontal axis is the ratio t = q/p, vertical axis is the
 * concave log2 t (currentColor), through (1, 0). Two amber ratio values
 * t1 < 1 < t2 sit on the curve; the amber chord between them lies below the
 * curve. The blue p-weighted average E[log2(q/p)] on the chord sits below the
 * curve value log2 E[q/p] at the mean ratio E[q/p] = 1, which is at most 0.
 * That gap IS the divergence: average below the curve => E[log2(q/p)] <= 0,
 * i.e. D >= 0. Component tier, pure inline SVG (a labeled plot).
 */

// coordinate frame: t in [0.25, 2.4] -> x in [90, 560];
// v = log2 t in [-2.3, 1.4] -> y in [340, 55].
const X = (t: number) => 90 + ((t - 0.25) / 2.15) * 470;
const Y = (v: number) => 55 + ((1.4 - v) / 3.7) * 285;
const L2 = (t: number) => Math.log2(t);

// the two ratio values and their p-weights, chosen so the weighted mean ratio
// is exactly 1 (a genuine distribution: E[q/p] = sum q = 1).
const T1 = 0.4;
const T2 = 1.8;
const W1 = (T2 - 1) / (T2 - T1); // weight on t1
const W2 = 1 - W1;
const AVG_V = W1 * L2(T1) + W2 * L2(T2); // E[log2(q/p)] = -D, sits on the chord

const YB = 340; // bottom (t) axis
const XL = 90; // left (log2 t) axis

// concave log2 curve
const N = 200;
const curve = Array.from({ length: N + 1 }, (_, i) => 0.27 + (2.4 - 0.27) * (i / N))
  .map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(L2(t)).toFixed(1)}`)
  .join(" ");

// faint lens between the curve and the chord over [t1, t2]
const lens =
  Array.from({ length: 81 }, (_, i) => T1 + (T2 - T1) * (i / 80))
    .map((t, i) => `${i ? "L" : "M"}${X(t).toFixed(1)},${Y(L2(t)).toFixed(1)}`)
    .join(" ") + ` L${X(T1).toFixed(1)},${Y(L2(T1)).toFixed(1)} Z`;

export default function JensenChord() {
  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <svg viewBox="0 0 620 372" fontFamily="system-ui, sans-serif" fontSize="13">
        {/* log2 t = 0 reference line */}
        <line x1={XL} y1={Y(0)} x2="565" y2={Y(0)} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />

        {/* axes */}
        <line x1={XL} y1="50" x2={XL} y2={YB} stroke="currentColor" strokeWidth="1.5" />
        <line x1={XL} y1={YB} x2="565" y2={YB} stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks: t = 0.5, 1, 1.5, 2 */}
        {[0.5, 1, 1.5, 2].map((t) => (
          <g key={`xt${t}`}>
            <line x1={X(t)} y1={YB} x2={X(t)} y2={YB + 6} stroke="currentColor" strokeWidth="1" />
            <text x={X(t)} y={YB + 20} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}
        <text x="558" y={YB + 20} textAnchor="end" fill="currentColor" fontStyle="italic">
          t = q/p
        </text>

        {/* y ticks: v = 1, 0, -1, -2 */}
        {[1, 0, -1, -2].map((v) => (
          <g key={`yt${v}`}>
            <line x1={XL - 6} y1={Y(v)} x2={XL} y2={Y(v)} stroke="currentColor" strokeWidth="1" />
            <text x={XL - 10} y={Y(v) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {v}
            </text>
          </g>
        ))}
        <text x={XL - 4} y="44" textAnchor="middle" fill="currentColor" fontStyle="italic">
          log₂ t
        </text>

        {/* dashed guides from the ratio values down to the t-axis */}
        {[
          { t: T1, lab: "t₁" },
          { t: T2, lab: "t₂" },
        ].map(({ t, lab }) => (
          <g key={`g${t}`}>
            <line x1={X(t)} y1={Y(L2(t))} x2={X(t)} y2={YB} stroke={ACCENT} strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <text x={X(t)} y={YB + 20} textAnchor="middle" fill={ACCENT} fontSize="12">
              {lab}
            </text>
          </g>
        ))}

        {/* guides for the (1,0) point: down to t-axis (through the average) and left to the log-axis */}
        <line x1={X(1)} y1={Y(0)} x2={X(1)} y2={YB} stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        <line x1={XL} y1={Y(0)} x2={X(1)} y2={Y(0)} stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

        {/* concave gap (average below the curve) */}
        <path d={lens} fill={ACCENT} opacity="0.1" stroke="none" />

        {/* the concave log2 curve */}
        <path d={curve} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />

        {/* the chord between the two ratio values (amber) */}
        <line x1={X(T1)} y1={Y(L2(T1))} x2={X(T2)} y2={Y(L2(T2))} stroke={ACCENT} strokeWidth="2" />

        {/* the Jensen gap: blue average up to the curve value at the mean ratio */}
        <line x1={X(1)} y1={Y(0)} x2={X(1)} y2={Y(AVG_V)} stroke="currentColor" strokeWidth="1.5" opacity="0.7" />

        {/* points */}
        <circle cx={X(T1)} cy={Y(L2(T1))} r="4.5" fill={ACCENT} />
        <circle cx={X(T2)} cy={Y(L2(T2))} r="4.5" fill={ACCENT} />
        <circle cx={X(1)} cy={Y(0)} r="4.5" fill="currentColor" />
        <circle cx={X(1)} cy={Y(AVG_V)} r="4.5" fill={SUPPORT} />

        {/* amber ratio-value labels */}
        <text x={X(T1)} y={Y(L2(T1)) + 22} textAnchor="middle" fill={ACCENT} fontWeight="600" fontSize="12">
          log₂ t₁
        </text>
        <text x={X(T2) + 12} y={Y(L2(T2))} fill={ACCENT} fontWeight="600" fontSize="12">
          log₂ t₂
        </text>

        {/* curve value at the mean ratio (currentColor point) */}
        <line x1={X(1) - 4} y1={Y(0) - 2} x2="252" y2="126" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <text x="248" y="122" textAnchor="end" fill="currentColor" fontWeight="600">
          log₂ E[q/p]
        </text>

        {/* blue average on the chord */}
        <text x={X(1) + 12} y={Y(AVG_V) + 14} fill={SUPPORT} fontWeight="600">
          E[log₂(q/p)]
        </text>

        {/* the Jensen idea, with a leader down to the blue average dot */}
        <line x1="315" y1="222" x2={X(1) + 3} y2={Y(AVG_V) - 2} stroke="currentColor" strokeWidth="1" opacity="0.5" />
        <text x="322" y="226" fill="currentColor" opacity="0.75" fontSize="12">
          Jensen: average below the curve
        </text>

        {/* the takeaway: mean ratio is at most 1, so its log is at most 0 */}
        <text x="322" y="252" fill="currentColor" fontStyle="italic" fontSize="12.5">
          E[q/p] ≤ 1 ⇒ log₂ E[q/p] ≤ 0
        </text>
      </svg>
    </div>
  );
}
