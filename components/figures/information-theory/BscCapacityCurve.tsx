import { ACCENT, SUPPORT } from "../palette";

/**
 * Capacity of the binary symmetric channel: C = 1 - H(p) plotted over the
 * crossover probability. The faint blue curve is the binary entropy H(p) (the
 * same curve as the entropy lesson's binary-entropy figure); the amber curve is
 * its mirror C = 1 - H(p). The two sum to 1 everywhere, so capacity hits zero
 * at p = 1/2, not at p = 1. Component tier, pure inline SVG (a labeled plot).
 */

// coordinate frame shared with the entropy lesson's binary-entropy.svg:
// x: p=0 -> 90, p=0.5 -> 340, p=1 -> 590; y: 0 bits -> 300, 1 bit -> 60.
const X = (p: number) => 90 + p * 500;
const Y = (v: number) => 300 - v * 240;

function H(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

const N = 240;
const samples = Array.from({ length: N + 1 }, (_, i) => i / N);
const path = (f: (p: number) => number) =>
  samples
    .map((p, i) => `${i ? "L" : "M"}${X(p).toFixed(1)},${Y(f(p)).toFixed(1)}`)
    .join(" ");

const entropyPath = path(H);
const capacityPath = path((p) => 1 - H(p));

// three points marked on the capacity curve
const marks: { p: number; c: number; label: string; anchor: "start" | "middle" | "end"; dx: number; dy: number }[] = [
  { p: 0, c: 1, label: "noiseless", anchor: "start", dx: 10, dy: 4 },
  { p: 0.1, c: 0.531, label: "(0.1, 0.531)", anchor: "start", dx: 10, dy: 4 },
  { p: 0.5, c: 0, label: "useless", anchor: "middle", dx: 0, dy: -12 },
];

export default function BscCapacityCurve() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <svg viewBox="0 0 640 360" fontFamily="system-ui, sans-serif" fontSize="14">
        {/* axes */}
        <line x1="90" y1="300" x2="600" y2="300" stroke="currentColor" strokeWidth="1.5" />
        <line x1="90" y1="300" x2="90" y2="45" stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks: 0, 0.5, 1 */}
        {[
          { p: 0, t: "0" },
          { p: 0.5, t: "0.5" },
          { p: 1, t: "1" },
        ].map(({ p, t }) => (
          <g key={t}>
            <line x1={X(p)} y1="300" x2={X(p)} y2="306" stroke="currentColor" strokeWidth="1" />
            <text x={X(p)} y="322" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}
        <text x="345" y="345" textAnchor="middle" fill="currentColor">
          p
        </text>

        {/* y ticks: 0, 0.5, 1 */}
        {[
          { v: 0, t: "0" },
          { v: 0.5, t: "0.5" },
          { v: 1, t: "1" },
        ].map(({ v, t }) => (
          <g key={t}>
            <line x1="84" y1={Y(v)} x2="90" y2={Y(v)} stroke="currentColor" strokeWidth="1" />
            <text x="76" y={Y(v) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}
        <text x="40" y="36" fill="currentColor">
          bits
        </text>

        {/* vertical dashed guide at p = 0.5 */}
        <line
          x1={X(0.5)}
          y1={Y(1)}
          x2={X(0.5)}
          y2={Y(0)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
        />

        {/* faint blue entropy reference curve H(p) */}
        <path d={entropyPath} fill="none" stroke={SUPPORT} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
        <text x={X(0.5) + 12} y={Y(1) + 12} fill={SUPPORT} opacity="0.7" fontSize="13">
          H(p)
        </text>

        {/* amber capacity curve C = 1 - H(p) */}
        <path d={capacityPath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
        <text x={X(0.86)} y={Y(0.62)} textAnchor="end" fill={ACCENT} fontWeight="600" fontSize="13">
          C = 1 − H(p)
        </text>

        {/* marked points */}
        {marks.map((m) => (
          <g key={m.label}>
            <circle cx={X(m.p)} cy={Y(m.c)} r="4" fill={ACCENT} />
            <text
              x={X(m.p) + m.dx}
              y={Y(m.c) + m.dy}
              textAnchor={m.anchor}
              fill={ACCENT}
              fontWeight="600"
              fontSize="12"
            >
              {m.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
