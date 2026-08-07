import { ACCENT, SUPPORT } from "../palette";

/**
 * The MDL "U": the worked-example tally for the 41-bit sticky-alternator
 * record (20 ones, 21 zeros) scored under Markov orders B(0)..B(3) with a
 * fixed hypothesis code (order in unary + 1 bit; 6-bit parameters on a
 * 64-value grid). The amber model term L(H) keeps climbing; the blue fit
 * term L(D|H) flattens after order 1; their bold currentColor sum turns over,
 * bottoming at k = 1 (33.8 bits) — the MDL choice. Component tier, pure SVG.
 */

// coordinate frame: x: k=0 -> 90, k=3 -> 590; y: 0 bits -> 300, 80 bits -> 60.
const X = (k: number) => 90 + (k / 3) * 500;
const Y = (v: number) => 300 - (v / 80) * 240;

type Pt = { k: number; v: number; label: string; anchor: "start" | "middle" | "end"; dx: number; dy: number; open?: boolean };

const model: Pt[] = [
  { k: 0, v: 7, label: "7", anchor: "start", dx: 7, dy: -8 },
  { k: 1, v: 14, label: "14", anchor: "start", dx: 8, dy: 15 },
  { k: 2, v: 27, label: "27", anchor: "start", dx: 8, dy: 4 },
  { k: 3, v: 52, label: "52", anchor: "end", dx: -8, dy: 4 },
];

const fit: Pt[] = [
  { k: 0, v: 41.0, label: "41.0", anchor: "start", dx: 9, dy: 4 },
  { k: 1, v: 19.8, label: "19.8", anchor: "end", dx: -7, dy: 15 },
  { k: 2, v: 19.9, label: "19.9", anchor: "middle", dx: 0, dy: 18 },
  { k: 3, v: 20, label: "≈ 20 (barely moves)", anchor: "end", dx: -10, dy: 18, open: true },
];

const total: Pt[] = [
  { k: 0, v: 48.0, label: "48.0", anchor: "start", dx: 9, dy: -7 },
  { k: 1, v: 33.8, label: "33.8", anchor: "start", dx: 15, dy: 4 },
  { k: 2, v: 46.9, label: "46.9", anchor: "middle", dx: 0, dy: -11 },
  { k: 3, v: 72, label: "≈ 72", anchor: "end", dx: -8, dy: -8 },
];

const line = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${X(p.k)},${Y(p.v)}`).join(" ");

export default function MarkovUCurve() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <svg viewBox="0 0 640 360" fontFamily="system-ui, sans-serif" fontSize="14">
        {/* axes */}
        <line x1="90" y1="300" x2="600" y2="300" stroke="currentColor" strokeWidth="1.5" />
        <line x1="90" y1="300" x2="90" y2="45" stroke="currentColor" strokeWidth="1.5" />

        {/* y grid + ticks: 0, 20, 40, 60, 80 */}
        {[0, 20, 40, 60, 80].map((v) => (
          <g key={v}>
            <line x1="90" y1={Y(v)} x2="600" y2={Y(v)} stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.15" />
            <line x1="84" y1={Y(v)} x2="90" y2={Y(v)} stroke="currentColor" strokeWidth="1" />
            <text x="76" y={Y(v) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {v}
            </text>
          </g>
        ))}
        <text x="40" y="36" fill="currentColor">
          bits
        </text>

        {/* x ticks: 0, 1, 2, 3 */}
        {[0, 1, 2, 3].map((k) => (
          <g key={k}>
            <line x1={X(k)} y1="300" x2={X(k)} y2="306" stroke="currentColor" strokeWidth="1" />
            <text x={X(k)} y="322" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {k}
            </text>
          </g>
        ))}
        <text x="345" y="346" textAnchor="middle" fill="currentColor">
          Markov order k
        </text>

        {/* --- lines --- */}
        {/* amber model term L(H) */}
        <path d={line(model)} fill="none" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* blue fit term L(D|H) */}
        <path d={line(fit)} fill="none" stroke={SUPPORT} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* bold currentColor total */}
        <path d={line(total)} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* amber ring on the total's minimum + callout */}
        <line x1={X(1) - 10} y1={Y(33.8) + 2} x2={205} y2={288} stroke={ACCENT} strokeWidth="1" opacity="0.7" />
        <circle cx={X(1)} cy={Y(33.8)} r="10" fill="none" stroke={ACCENT} strokeWidth="2" />
        <text x="200" y="292" textAnchor="end" fill={ACCENT} fontWeight="600" fontSize="12.5">
          MDL choice: k = 1
        </text>

        {/* markers + printed values */}
        {model.map((p) => (
          <g key={`m${p.k}`}>
            <circle cx={X(p.k)} cy={Y(p.v)} r="3.6" fill={ACCENT} />
            <text x={X(p.k) + p.dx} y={Y(p.v) + p.dy} textAnchor={p.anchor} fill={ACCENT} fontSize="12">
              {p.label}
            </text>
          </g>
        ))}
        {fit.map((p) => (
          <g key={`f${p.k}`}>
            <circle cx={X(p.k)} cy={Y(p.v)} r="3.6" fill={p.open ? "var(--fig-bg, #fff)" : SUPPORT} stroke={SUPPORT} strokeWidth={p.open ? 1.6 : 0} />
            <text x={X(p.k) + p.dx} y={Y(p.v) + p.dy} textAnchor={p.anchor} fill={SUPPORT} fontSize="12">
              {p.label}
            </text>
          </g>
        ))}
        {total.map((p) => (
          <g key={`t${p.k}`}>
            <circle cx={X(p.k)} cy={Y(p.v)} r="4" fill="currentColor" />
            <text x={X(p.k) + p.dx} y={Y(p.v) + p.dy} textAnchor={p.anchor} fill="currentColor" fontWeight="600" fontSize="12">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {/* legend: three color-matched labels directly under the plot */}
      <div style={{ display: "flex", gap: 22, justifyContent: "center", fontFamily: "system-ui, sans-serif", fontSize: 13, marginTop: 2 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: ACCENT }}>
          <span style={{ width: 20, height: 0, borderTop: `2px solid ${ACCENT}` }} />
          L(H) — model
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: SUPPORT }}>
          <span style={{ width: 20, height: 0, borderTop: `2px solid ${SUPPORT}` }} />
          L(D|H) — fit
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
          <span style={{ width: 20, height: 0, borderTop: "3px solid currentColor" }} />
          total
        </span>
      </div>
    </div>
  );
}
