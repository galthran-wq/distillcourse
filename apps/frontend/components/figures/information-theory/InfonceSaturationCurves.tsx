import { ACCENT } from "../palette";

/**
 * Static twin of the InfoNCESaturation demo. The InfoNCE certificate
 * log2 N - L_N tracks the true mutual information I(X;Y) while I is small,
 * then clips at the ceiling log2 N: 1, 4, and 8 bits for N = 2, 16, 256.
 * Three amber curves (one hue, three opacities) fan off a dashed diagonal of
 * "perfect certification"; the dashed currentColor guides mark each ceiling.
 * One idea: more negatives raise the ceiling by one bit per doubling of N.
 * Component tier, pure inline SVG (a labeled plot).
 */

// coordinate frame: x = true I in bits (0..10), y = certificate in bits (0..9).
const X = (i: number) => 90 + i * 50; // I=0 -> 90, I=10 -> 590
const Y = (v: number) => 320 - v * 30; // 0 bits -> 320, 9 bits -> 50

// Smooth lower-approximation of min(I, C): a softmin that hugs just below the
// diagonal for I < C and flattens onto the plateau C. k sets corner sharpness.
const K = 3.5;
function cert(i: number, c: number): number {
  const v = -(1 / K) * Math.log2(Math.pow(2, -K * i) + Math.pow(2, -K * c));
  return Math.max(0, v);
}

const N = 240;
const samples = Array.from({ length: N + 1 }, (_, j) => (j / N) * 10);
const curvePath = (c: number) =>
  samples
    .map((i, j) => `${j ? "L" : "M"}${X(i).toFixed(1)},${Y(cert(i, c)).toFixed(1)}`)
    .join(" ");

// N = 2, 16, 256 -> ceilings 1, 4, 8 bits, drawn faint-to-bold so the boldest
// (N = 2) sits on top where the curves overlap on the diagonal.
const curves = [
  { n: 256, c: 8, op: 0.5 },
  { n: 16, c: 4, op: 0.75 },
  { n: 2, c: 1, op: 1.0 },
];

const ceilings = [
  { c: 1, label: "log₂ 2 = 1" },
  { c: 4, label: "log₂ 16 = 4" },
  { c: 8, label: "log₂ 256 = 8" },
];

export default function InfonceSaturationCurves() {
  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      <svg viewBox="0 0 660 380" fontFamily="system-ui, sans-serif" fontSize="14">
        {/* axes */}
        <line x1="90" y1="320" x2="600" y2="320" stroke="currentColor" strokeWidth="1.5" />
        <line x1="90" y1="320" x2="90" y2="45" stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks: 0, 2, 4, 6, 8, 10 */}
        {[0, 2, 4, 6, 8, 10].map((i) => (
          <g key={`x${i}`}>
            <line x1={X(i)} y1="320" x2={X(i)} y2="326" stroke="currentColor" strokeWidth="1" />
            <text x={X(i)} y="341" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {i}
            </text>
          </g>
        ))}
        <text x={X(5)} y="366" textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="13">
          true I(X;Y) (bits)
        </text>

        {/* y ticks: 0, 3, 6, 9 (ceilings carry their own labels) */}
        {[0, 3, 6, 9].map((v) => (
          <g key={`y${v}`}>
            <line x1="84" y1={Y(v)} x2="90" y2={Y(v)} stroke="currentColor" strokeWidth="1" />
            <text x="76" y={Y(v) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {v}
            </text>
          </g>
        ))}
        <text
          x="34"
          y={Y(4.5)}
          textAnchor="middle"
          fill="currentColor"
          opacity="0.7"
          fontSize="13"
          transform={`rotate(-90 34 ${Y(4.5)})`}
        >
          certificate log₂N − Lₙ (bits)
        </text>

        {/* dashed diagonal: perfect certification (slope 1 through origin) */}
        <line
          x1={X(0)}
          y1={Y(0)}
          x2={X(9)}
          y2={Y(9)}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeDasharray="5 4"
          opacity="0.55"
        />
        <text
          x={X(6.4)}
          y={Y(6.4) - 9}
          textAnchor="middle"
          fill="currentColor"
          opacity="0.6"
          fontSize="12.5"
          transform={`rotate(-31 ${X(6.4)} ${Y(6.4) - 9})`}
        >
          perfect certification
        </text>

        {/* dashed horizontal ceilings at log2 N, with left-side labels */}
        {ceilings.map(({ c, label }) => (
          <g key={`ceil${c}`}>
            <line
              x1={X(0)}
              y1={Y(c)}
              x2={X(10)}
              y2={Y(c)}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.5"
            />
            <text x={X(0.15)} y={Y(c) - 6} textAnchor="start" fill="currentColor" opacity="0.6" fontSize="12">
              {label}
            </text>
          </g>
        ))}

        {/* amber certificate curves, faint (N=256) to bold (N=2) */}
        {curves.map(({ n, c, op }) => (
          <path key={`c${n}`} d={curvePath(c)} fill="none" stroke={ACCENT} strokeWidth="2.5" opacity={op} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* right-end curve labels: N = ... at each plateau */}
        {curves.map(({ n, c, op }) => (
          <text
            key={`l${n}`}
            x={X(10) + 8}
            y={Y(c) + 4}
            textAnchor="start"
            fill={ACCENT}
            opacity={op}
            fontWeight="600"
            fontSize="13"
          >
            N = {n}
          </text>
        ))}
      </svg>
    </div>
  );
}
