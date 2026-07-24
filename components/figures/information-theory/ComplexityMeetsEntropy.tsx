import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * Kolmogorov complexity meets Shannon entropy for the 90/10 biased coin.
 *
 * One idea: the algorithmic and probabilistic measures of information agree in
 * the limit. The per-flip expected Kolmogorov complexity E[K(X^n)]/n is
 * squeezed between the entropy H = 0.469 bits (blue dashed floor) and a
 * computable two-part upper envelope H + (log2(n+1) + 50)/n (amber curve),
 * whose O(log n / n) gap shrinks to nothing as n grows to 10^4.
 *
 * Inspiration: Shen, Uspensky & Vereshchagin ch. 7 / Cover & Thomas §14.3
 * (redrawn, not copied).
 *
 * Component tier: inline SVG for the plot (log-x axis, curves, shaded gap),
 * HTML overlay + KaTeX (<M>) for the labels that carry real math.
 */

const H = 0.469; // binary entropy of the 90/10 coin, bits per flip

// --- coordinate frame (viewBox 640 x 400) -------------------------------
// x is log10(n) on [1, 4]  (n = 10 .. 10^4)
const X0 = 92;
const X1 = 592;
const Xl = (l: number) => X0 + ((l - 1) / 3) * (X1 - X0);
const Xn = (n: number) => Xl(Math.log10(n));

// y is bits per flip on [0, 1.1]
const YB = 322; // y = 0
const YSPAN = 1.1;
const YH = 262; // pixels for the full 0..1.1 range
const Y = (v: number) => YB - (Math.min(v, YSPAN) / YSPAN) * YH;

// two-part upper envelope, clamped into the axis range
const raw = (n: number) => H + (Math.log2(n + 1) + 50) / n;
const env = (n: number) => Math.min(raw(n), YSPAN);

// sample the curve in log-space
const NS = 160;
const ns = Array.from({ length: NS + 1 }, (_, i) => 10 ** (1 + (3 * i) / NS));
const curvePath = ns
  .map((n, i) => `${i ? "L" : "M"}${Xn(n).toFixed(1)},${Y(env(n)).toFixed(1)}`)
  .join(" ");

// shaded gap: under the envelope, above the H line
const gapPath =
  ns.map((n, i) => `${i ? "L" : "M"}${Xn(n).toFixed(1)},${Y(env(n)).toFixed(1)}`).join(" ") +
  ` L${Xn(ns[ns.length - 1]).toFixed(1)},${Y(H).toFixed(1)}` +
  ` L${Xn(ns[0]).toFixed(1)},${Y(H).toFixed(1)} Z`;

const xticks = [
  { n: 10, t: "10" },
  { n: 100, t: "100" },
  { n: 1000, t: "1000" },
  { n: 10000, t: "10^4", sup: true },
];

// overlay label: HTML node placed at svg-pixel (px, py) in the 640x400 frame
function Label({
  px,
  py,
  children,
  color,
  weight = 600,
  align = "center",
}: {
  px: number;
  py: number;
  children: React.ReactNode;
  color: string;
  weight?: number;
  align?: "center" | "left" | "right";
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${(px / 640) * 100}%`,
        top: `${(py / 400) * 100}%`,
        transform:
          align === "center"
            ? "translate(-50%, -50%)"
            : align === "right"
              ? "translate(-100%, -50%)"
              : "translateY(-50%)",
        color,
        fontWeight: weight,
        fontSize: 13,
        lineHeight: 1.25,
        textAlign: align === "right" ? "right" : align === "left" ? "left" : "center",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
}

export default function ComplexityMeetsEntropy() {
  return (
    <div style={{ position: "relative", maxWidth: 640, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <svg viewBox="0 0 640 400" fontFamily="system-ui, sans-serif" fontSize="14" style={{ width: "100%", height: "auto" }}>
        {/* shaded O(log n / n) gap between envelope and entropy line */}
        <path d={gapPath} fill={ACCENT} opacity="0.12" stroke="none" />

        {/* axes */}
        <line x1={X0} y1={YB} x2={X1 + 14} y2={YB} stroke="currentColor" strokeWidth="1.5" />
        <line x1={X0} y1={YB} x2={X0} y2={Y(YSPAN) - 8} stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks (log scale) */}
        {xticks.map(({ n, t, sup }) => (
          <g key={t}>
            <line x1={Xn(n)} y1={YB} x2={Xn(n)} y2={YB + 6} stroke="currentColor" strokeWidth="1" />
            <text x={Xn(n)} y={YB + 22} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {sup ? (
                <>
                  10<tspan dy="-5" fontSize="9">4</tspan>
                </>
              ) : (
                t
              )}
            </text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y={YB + 46} textAnchor="middle" fill="currentColor" fontSize="13">
          n (flips of the 90/10 coin)
        </text>

        {/* y ticks: 0, H = 0.469 (blue, special), 1 */}
        {[
          { v: 0, t: "0", c: "currentColor" as const, op: 0.55 },
          { v: 1, t: "1", c: "currentColor" as const, op: 0.55 },
        ].map(({ v, t, c, op }) => (
          <g key={t}>
            <line x1={X0 - 6} y1={Y(v)} x2={X0} y2={Y(v)} stroke="currentColor" strokeWidth="1" />
            <text x={X0 - 10} y={Y(v) + 4} textAnchor="end" fill={c} opacity={op} fontSize="12">
              {t}
            </text>
          </g>
        ))}
        {/* the special 0.469 tick, in entropy blue */}
        <line x1={X0 - 6} y1={Y(H)} x2={X0} y2={Y(H)} stroke={SUPPORT} strokeWidth="1.5" />
        <text x={X0 - 10} y={Y(H) + 4} textAnchor="end" fill={SUPPORT} fontWeight="600" fontSize="12">
          0.469
        </text>

        {/* y-axis title */}
        <text
          x={26}
          y={Y(0.62)}
          textAnchor="middle"
          fill="currentColor"
          fontSize="13"
          transform={`rotate(-90 26 ${Y(0.62)})`}
        >
          bits per flip
        </text>

        {/* entropy floor: blue dashed horizontal line at H = 0.469 */}
        <line
          x1={X0}
          y1={Y(H)}
          x2={X1 + 14}
          y2={Y(H)}
          stroke={SUPPORT}
          strokeWidth="2"
          strokeDasharray="6 4"
        />

        {/* the amber two-part upper envelope */}
        <path d={curvePath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* marked waypoints on the curve */}
        {[100, 1000, 10000].map((n) => (
          <circle key={n} cx={Xn(n)} cy={Y(env(n))} r="3.5" fill={ACCENT} />
        ))}
      </svg>

      {/* KaTeX labels (HTML overlay) */}

      {/* entropy line label */}
      <Label px={Xn(45)} py={Y(H) + 20} color={SUPPORT}>
        <M tex={String.raw`H = 0.469`} size={13} />
      </Label>

      {/* envelope label, up in the descending shoulder */}
      <Label px={Xn(320)} py={Y(1.02)} color={ACCENT} align="left">
        <span>
          two-part bound on&nbsp;
          <M tex={String.raw`\mathbb{E}[K]/n`} size={13} />
        </span>
      </Label>

      {/* the shrinking gap */}
      <Label px={Xn(210)} py={Y(0.585)} color={ACCENT} weight={500}>
        <M tex={String.raw`O(\log n / n)\ \text{gap}`} size={13} />
      </Label>

      {/* muted note under the axis */}
      <div
        style={{
          position: "absolute",
          left: `${(X0 / 640) * 100}%`,
          top: `${(378 / 400) * 100}%`,
          color: "currentColor",
          opacity: 0.55,
          fontSize: 12,
          lineHeight: 1.3,
        }}
      >
        curve = the computable upper envelope;&nbsp;
        <M tex={String.raw`\mathbb{E}[K]/n`} size={12} /> itself lies between it and{" "}
        <M tex={String.raw`H`} size={12} />
      </div>
    </div>
  );
}
