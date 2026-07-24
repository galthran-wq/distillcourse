import { ACCENT } from "../palette";

/**
 * Finite-sample bias of the plug-in mutual-information estimate. With few
 * trials per stimulus the plug-in estimate (amber) sits well above the true
 * value I = 0.456 bits and decays toward it as N grows; the rose gap at small
 * N is the bias. A shuffled control (rose curve), whose true I is exactly 0,
 * still reads clearly positive at small N and decays to 0 — so it measures how
 * many bits the finite sample manufactured. Warning rose = the bias / shuffle;
 * amber = the estimate; currentColor = axes and truth.
 * One idea: small samples manufacture information; the shuffle reveals it.
 * Component tier, pure inline SVG (a labeled plot).
 */

const WARN = "#d1495b"; // warning rose: the manufactured bits (bias + shuffle)

const I_TRUE = 0.456;
const C = 1.4; // bias coefficient: bias(N) = C / N

// x = log2(N), N from 4 (l=2) to 1024 (l=10); y = estimated I in bits (0..0.9)
const X = (l: number) => 100 + ((l - 2) / 8) * 500; // l=2 -> 100, l=10 -> 600
const Y = (v: number) => 320 - v * 305.6; // v=0 -> 320, v=0.9 -> 45

const bias = (l: number) => C / Math.pow(2, l);
const plugin = (l: number) => I_TRUE + bias(l);
const shuffle = (l: number) => bias(l);

const N = 220;
const ls = Array.from({ length: N + 1 }, (_, i) => 2 + (i / N) * 8);
const curvePath = (f: (l: number) => number) =>
  ls.map((l, i) => `${i ? "L" : "M"}${X(l).toFixed(1)},${Y(f(l)).toFixed(1)}`).join(" ");

const pluginPath = curvePath(plugin);
const shufflePath = curvePath(shuffle);

// bias band: between the plug-in curve and the truth line, over small N (l=2..4)
const bandLs = ls.filter((l) => l <= 4);
const bandPath =
  bandLs.map((l, i) => `${i ? "L" : "M"}${X(l).toFixed(1)},${Y(plugin(l)).toFixed(1)}`).join(" ") +
  ` L${X(4).toFixed(1)},${Y(I_TRUE).toFixed(1)} L${X(2).toFixed(1)},${Y(I_TRUE).toFixed(1)} Z`;

const xticks = [
  { l: 2, t: "4" },
  { l: 4, t: "16" },
  { l: 6, t: "64" },
  { l: 8, t: "256" },
  { l: 10, t: "1024" },
];
const yticks = [0, 0.2, 0.4, 0.6, 0.8];

export default function EstimationBias() {
  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      <svg viewBox="0 0 660 372" fontFamily="system-ui, sans-serif" fontSize="14">
        {/* axes */}
        <line x1="100" y1="320" x2="610" y2="320" stroke="currentColor" strokeWidth="1.5" />
        <line x1="100" y1="320" x2="100" y2="42" stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks */}
        {xticks.map(({ l, t }) => (
          <g key={t}>
            <line x1={X(l)} y1="320" x2={X(l)} y2="326" stroke="currentColor" strokeWidth="1" />
            <text x={X(l)} y="341" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}
        <text x={X(6)} y="364" textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="13">
          trials per stimulus N (log scale)
        </text>

        {/* y ticks */}
        {yticks.map((v) => (
          <g key={v}>
            <line x1="94" y1={Y(v)} x2="100" y2={Y(v)} stroke="currentColor" strokeWidth="1" />
            <text x="86" y={Y(v) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text
          x="40"
          y={Y(0.45)}
          textAnchor="middle"
          fill="currentColor"
          opacity="0.7"
          fontSize="13"
          transform={`rotate(-90 40 ${Y(0.45)})`}
        >
          estimated I (bits)
        </text>

        {/* bias band: shaded gap between plug-in and truth at small N */}
        <path d={bandPath} fill={WARN} opacity="0.16" stroke="none" />
        <text x={X(2.35)} y={Y(0.60)} textAnchor="start" fill={WARN} fontWeight="700" fontSize="13">
          bias
        </text>

        {/* truth line: flat dashed at I = 0.456 */}
        <line
          x1={X(2)}
          y1={Y(I_TRUE)}
          x2={X(10)}
          y2={Y(I_TRUE)}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeDasharray="5 4"
          opacity="0.6"
        />
        <text x={X(10)} y={Y(I_TRUE) - 8} textAnchor="end" fill="currentColor" opacity="0.7" fontSize="12.5">
          truth  I = 0.456
        </text>

        {/* plug-in estimate curve (amber) */}
        <path d={pluginPath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x={X(3.55)} y={Y(0.80)} textAnchor="start" fill={ACCENT} fontWeight="600" fontSize="13">
          plug-in estimate
        </text>

        {/* shuffled control curve (rose): true I = 0 */}
        <path d={shufflePath} fill="none" stroke={WARN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x={X(4.4)} y={Y(0.235)} textAnchor="start" fill={WARN} fontWeight="600" fontSize="13">
          shuffled control (true I = 0)
        </text>
      </svg>
    </div>
  );
}
