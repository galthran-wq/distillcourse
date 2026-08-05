import { ACCENT, SUPPORT } from "../palette";

/**
 * The Gaussian rate–distortion curve R(D) = ½ log₂(σ²/D) for σ² = 1, plotted
 * over D ∈ (0, 1.1]. One idea: on this curve, one extra bit halves the
 * amplitude (RMS) error — it divides the mean squared error D by 4, the 6 dB
 * per bit rule. Amber = the curve and its two marked points (the subject);
 * blue = the one-bit step annotation (guides + brackets); axes = currentColor.
 * Component tier, pure inline SVG. Recreation of Cover & Thomas §10.3.2 (not
 * copied) — noted for the lesson's References.
 */

// coordinate frame
const X = (d: number) => 90 + (d / 1.1) * 490; // D = 0 -> 90, D = 1.1 -> 580
const Y = (r: number) => 350 - (r / 3) * 280; // R = 0 -> 350, R = 3 -> 70

const R = (d: number) => -0.5 * Math.log2(d); // σ² = 1

// curve from R = 3 (D = 2^-6) down to R = 0 (D = 1)
const D_START = Math.pow(2, -6); // 0.015625, where R = 3
const N = 320;
const curvePath = Array.from({ length: N + 1 }, (_, i) => {
  const d = D_START + (i / N) * (1 - D_START);
  return `${i ? "L" : "M"}${X(d).toFixed(1)},${Y(R(d)).toFixed(1)}`;
}).join(" ");

// the two marked points
const A = { d: 0.25, r: 1, label: "(0.25, 1)" };
const B = { d: 0.0625, r: 2, label: "(0.0625, 2)" };

// right-hand end of the horizontal guides / seat of the "+1 bit" bracket
const GUIDE_R = 250;

export default function GaussianRdCurve() {
  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      <svg viewBox="0 0 660 410" fontFamily="system-ui, sans-serif" fontSize="14">
        {/* axes */}
        <line x1="90" y1="350" x2="600" y2="350" stroke="currentColor" strokeWidth="1.5" />
        <line x1="90" y1="350" x2="90" y2="55" stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks: 0 and 1 (= σ²) */}
        <line x1={X(1)} y1="350" x2={X(1)} y2="356" stroke="currentColor" strokeWidth="1" />
        <text x={X(1)} y="371" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
          σ²
        </text>
        <text x="90" y="371" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
          0
        </text>
        <text x="600" y="372" textAnchor="end" fill="currentColor" opacity="0.55" fontSize="13" fontStyle="italic">
          D
        </text>

        {/* y ticks: 0..3 bits */}
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            <line x1="84" y1={Y(r)} x2="90" y2={Y(r)} stroke="currentColor" strokeWidth="1" />
            <text x="76" y={Y(r) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {r}
            </text>
          </g>
        ))}
        <text x="66" y="46" textAnchor="start" fill="currentColor" opacity="0.55" fontSize="12">
          R (bits)
        </text>

        {/* --- blue step annotation: guides --- */}
        {/* horizontal guides at R = 1 and R = 2 */}
        {[A.r, B.r].map((r) => (
          <line
            key={`h${r}`}
            x1="90"
            y1={Y(r)}
            x2={GUIDE_R}
            y2={Y(r)}
            stroke={SUPPORT}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
        ))}
        {/* vertical guides at D = 0.25 and D = 0.0625 */}
        {[A, B].map((p) => (
          <line
            key={`v${p.d}`}
            x1={X(p.d)}
            y1={Y(p.r)}
            x2={X(p.d)}
            y2="308"
            stroke={SUPPORT}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.6"
          />
        ))}

        {/* "+1 bit" vertical bracket at x = GUIDE_R, spanning R = 1..2 */}
        <path
          d={`M${GUIDE_R - 5},${Y(2)} L${GUIDE_R},${Y(2)} L${GUIDE_R},${Y(1)} L${GUIDE_R - 5},${Y(1)}`}
          fill="none"
          stroke={SUPPORT}
          strokeWidth="1.5"
        />
        <text x={GUIDE_R + 8} y={(Y(1) + Y(2)) / 2 + 4} textAnchor="start" fill={SUPPORT} fontWeight="600" fontSize="13">
          +1 bit
        </text>

        {/* "D ÷ 4 (−6 dB)" horizontal bracket below, spanning the two D's */}
        <path
          d={`M${X(B.d)},303 L${X(B.d)},308 L${X(A.d)},308 L${X(A.d)},303`}
          fill="none"
          stroke={SUPPORT}
          strokeWidth="1.5"
        />
        <text x={(X(A.d) + X(B.d)) / 2} y="326" textAnchor="middle" fill={SUPPORT} fontWeight="600" fontSize="13">
          D ÷ 4 (−6 dB)
        </text>

        {/* --- amber curve --- */}
        <path d={curvePath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
        {/* flat zero for D ≥ σ² */}
        <line x1={X(1)} y1={Y(0)} x2={X(1.1)} y2={Y(0)} stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
        <text x={X(1.02)} y="342" textAnchor="start" fill={ACCENT} opacity="0.85" fontSize="12">
          R = 0
        </text>

        {/* curve equation */}
        <text x="300" y="115" textAnchor="start" fill={ACCENT} fontWeight="600" fontSize="15">
          R = ½ log₂(σ²/D)
        </text>

        {/* marked points */}
        <circle cx={X(B.d)} cy={Y(B.r)} r="4.5" fill={ACCENT} />
        <text x={X(B.d) + 9} y={Y(B.r) - 8} textAnchor="start" fill={ACCENT} fontWeight="600" fontSize="12">
          {B.label}
        </text>
        <circle cx={X(A.d)} cy={Y(A.r)} r="4.5" fill={ACCENT} />
        <text x={X(A.d) + 20} y={Y(A.r) + 34} textAnchor="start" fill={ACCENT} fontWeight="600" fontSize="12">
          {A.label}
        </text>

        {/* gloss line, in the open space under the curve */}
        <text x="430" y="250" textAnchor="middle" fill="currentColor" opacity="0.6" fontSize="12.5" fontStyle="italic">
          each extra bit quarters the mean squared error:
        </text>
        <text x="430" y="270" textAnchor="middle" fill="currentColor" opacity="0.6" fontSize="12.5" fontStyle="italic">
          RMS error halves per bit
        </text>
      </svg>
    </div>
  );
}
