import { ACCENT } from "../palette";

/**
 * ThresholdSharpens — the sharp capacity threshold as the limit of steepening
 * finite-blocklength error curves.
 *
 * FigureSequence, 3 frames. Fixed axes (block error 0..1 vertical, rate 0..1
 * horizontal) with a dashed vertical guide at capacity C = 0.531 in
 * currentColor — pixel-identical across all frames. Each frame reveals ONE new
 * amber S-curve of block error vs rate, steeper than the last:
 *   frame 1  n = 10    — a gentle, wide transition crossing 0.5 near C
 *   frame 2  n = 100   — a steeper, narrower transition centered on C
 *   frame 3  n = 1000  — a near-step hugging 0 left of C and 1 right of it
 * Earlier curves fade to muted currentColor (opacity 0.35) so the eye tracks
 * the delta: the transition sharpening toward the limiting step at C.
 *
 * Color roles: amber = the current n's curve; muted currentColor = earlier
 * curves; dashed currentColor = the C guide.
 *
 * One idea: the sharp threshold is the limit of steepening finite-n slopes.
 * Inspiration: finite-blocklength dispersion plots (Polyanskiy & Wu ch. 20) —
 * recreated in house style, not copied.
 */

const C = 0.531;

// coordinate frame (shared with the capacity plots' idiom):
// x: rate 0 -> 90, rate 1 -> 590; y: error 0 -> 300 (bottom), error 1 -> 60.
const X = (r: number) => 90 + r * 500;
const Y = (e: number) => 300 - e * 240;

// logistic block-error models: P_e(r) = 1 / (1 + exp(-k (r - C))), = 0.5 at C.
const logistic = (k: number) => (r: number) => 1 / (1 + Math.exp(-k * (r - C)));

const N = 220;
const samples = Array.from({ length: N + 1 }, (_, i) => i / N);
const pathFor = (f: (r: number) => number) =>
  samples
    .map((r, i) => `${i ? "L" : "M"}${X(r).toFixed(1)},${Y(f(r)).toFixed(1)}`)
    .join(" ");

type Curve = {
  n: number;
  label: string;
  f: (r: number) => number;
  // label position in data coords (rate, error), placed in open space, tuned visually
  lx: number;
  ly: number;
  anchor: "start" | "middle" | "end";
};

const CURVES: Curve[] = [
  { n: 10, label: "n = 10", f: logistic(7), lx: 0.95, ly: 0.8, anchor: "start" },
  { n: 100, label: "n = 100", f: logistic(22), lx: 0.72, ly: 0.9, anchor: "start" },
  { n: 1000, label: "n = 1000", f: logistic(80), lx: 0.47, ly: 0.88, anchor: "end" },
];

const paths = CURVES.map((c) => pathFor(c.f));

export default function ThresholdSharpens({ frame = 1 }: { frame?: number }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <svg viewBox="0 0 640 360" fontFamily="system-ui, sans-serif" fontSize="14">
        {/* axes */}
        <line x1="90" y1="300" x2="600" y2="300" stroke="currentColor" strokeWidth="1.5" />
        <line x1="90" y1="300" x2="90" y2="45" stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks: 0, 0.5, 1 */}
        {[
          { r: 0, t: "0" },
          { r: 0.5, t: "0.5" },
          { r: 1, t: "1" },
        ].map(({ r, t }) => (
          <g key={`x${t}`}>
            <line x1={X(r)} y1="300" x2={X(r)} y2="306" stroke="currentColor" strokeWidth="1" />
            <text x={X(r)} y="322" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}
        <text x="345" y="346" textAnchor="middle" fill="currentColor">
          rate
        </text>

        {/* y ticks: 0, 0.5, 1 */}
        {[
          { e: 0, t: "0" },
          { e: 0.5, t: "0.5" },
          { e: 1, t: "1" },
        ].map(({ e, t }) => (
          <g key={`y${t}`}>
            <line x1="84" y1={Y(e)} x2="90" y2={Y(e)} stroke="currentColor" strokeWidth="1" />
            <text x="76" y={Y(e) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}
        <text x="30" y="36" fill="currentColor">
          block error
        </text>

        {/* dashed capacity guide at rate = C (currentColor) — identical every frame */}
        <line
          x1={X(C)}
          y1={Y(1)}
          x2={X(C)}
          y2={Y(0)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
        />
        <text x={X(C)} y={Y(1) - 8} textAnchor="middle" fill="currentColor" fontSize="12.5" opacity="0.7">
          C = 0.531
        </text>

        {/* curves: reveal one amber per frame; earlier ones muted */}
        {CURVES.map((c, i) => {
          if (i + 1 > frame) return null;
          const current = i + 1 === frame;
          const stroke = current ? ACCENT : "currentColor";
          const opacity = current ? 1 : 0.35;
          const width = current ? 2.6 : 1.6;
          return (
            <g key={c.label}>
              <path
                d={paths[i]}
                fill="none"
                stroke={stroke}
                strokeWidth={width}
                opacity={opacity}
                strokeLinecap="round"
              />
              <text
                x={X(c.lx)}
                y={Y(c.ly)}
                textAnchor={c.anchor}
                fill={stroke}
                opacity={current ? 1 : 0.5}
                fontWeight={current ? 600 : 400}
                fontSize="13"
              >
                {c.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
