import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * The information plane for the 4-symbol toy of the information-bottleneck
 * lesson. Static twin of the InformationPlane demo (Tishby et al. 1999 §3.4 —
 * described in prose there, never drawn; built here from the toy's numbers).
 *
 * One idea: every encoder p(t|x) is a point in the (I(X;T), I(T;Y)) plane,
 * pinned under two data-processing bounds — the relevance ceiling
 * I(T;Y) ≤ I(X;Y) = 0.594 and the rate diagonal I(T;Y) ≤ I(X;T). Sweeping the
 * trade-off parameter β over stochastic encoders traces the concave upper-left
 * boundary; the hard clusterings sit on or below it.
 *
 * Color roles: amber = the β-swept frontier and the encoders that lie on/near
 * it (the subject); blue = the dominated hard encoders; dashed currentColor =
 * the two DPI bounds; currentColor = axes and glosses.
 */

// coordinate frame (viewBox 640 x 380)
const X = (i: number) => 90 + (i / 2.2) * 490; // I(X;T)=0 -> 90, 2.2 -> 580
const Y = (j: number) => 300 - (j / 0.7) * 240; // I(T;Y)=0 -> 300, 0.7 -> 60

const CEIL = 0.594; // I(X;Y): relevance ceiling
const HX = 2; // H(X) for 4 uniform symbols: right end of the frontier

// β-swept frontier: concave, from (0,0) to (H(X), I(X;Y)), flattening into the
// ceiling. Normalized exponential passing at/above the ab|cd point (1, 0.456).
const K = 1.3;
const NORM = 1 - Math.exp(-K * HX);
const frontier = (i: number) => (CEIL * (1 - Math.exp(-K * i))) / NORM;

const NS = 200;
const frontierPath = Array.from({ length: NS + 1 }, (_, s) => {
  const i = (s / NS) * HX;
  return `${s ? "L" : "M"}${X(i).toFixed(1)},${Y(frontier(i)).toFixed(1)}`;
}).join(" ");

// faint achievable wash: on/below the frontier, closed down to the x-axis
const achievablePath =
  frontierPath + ` L${X(HX).toFixed(1)},${Y(0).toFixed(1)} L${X(0).toFixed(1)},${Y(0).toFixed(1)} Z`;

const amberPts = [
  { i: 0, j: 0, label: "collapse" },
  { i: 1, j: 0.456, label: "ab | cd" },
  { i: 2, j: 0.594, label: "T = X" },
];
const bluePts = [
  { i: 1, j: 0.046, label: "ac | bd" },
  { i: 1, j: 0, label: "ad | bc" },
  { i: 0.811, j: 0.311, label: "a | bcd" },
];

// overlay label: HTML node anchored at svg-pixel (px, py) in the 640x380 frame
function Label({
  px,
  py,
  children,
  color,
  weight = 600,
  size = 13,
  align = "center",
  opacity = 1,
}: {
  px: number;
  py: number;
  children: React.ReactNode;
  color: string;
  weight?: number;
  size?: number;
  align?: "center" | "left" | "right";
  opacity?: number;
}) {
  const transform =
    align === "center"
      ? "translate(-50%, -50%)"
      : align === "right"
        ? "translate(-100%, -50%)"
        : "translateY(-50%)";
  return (
    <div
      style={{
        position: "absolute",
        left: `${(px / 640) * 100}%`,
        top: `${(py / 380) * 100}%`,
        transform,
        color,
        opacity,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.2,
        textAlign: align === "right" ? "right" : align === "center" ? "center" : "left",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
}

export default function IbPlane() {
  return (
    <div style={{ position: "relative", maxWidth: 640, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <svg viewBox="0 0 640 380" fontFamily="system-ui, sans-serif" fontSize="14" style={{ width: "100%", height: "auto" }}>
        {/* faint achievable wash under the frontier */}
        <path d={achievablePath} fill={ACCENT} opacity="0.06" stroke="none" />

        {/* axes */}
        <line x1={X(0)} y1={Y(0)} x2={X(2.2) + 6} y2={Y(0)} stroke="currentColor" strokeWidth="1.5" />
        <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(0.7) - 10} stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks: 0, 0.5, 1, 1.5, 2 */}
        {[0, 0.5, 1, 1.5, 2].map((i) => (
          <g key={`x${i}`}>
            <line x1={X(i)} y1={Y(0)} x2={X(i)} y2={Y(0) + 6} stroke="currentColor" strokeWidth="1" />
            <text x={X(i)} y={Y(0) + 22} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {i}
            </text>
          </g>
        ))}

        {/* y ticks: 0, 0.25, 0.5 */}
        {[0, 0.25, 0.5].map((j) => (
          <g key={`y${j}`}>
            <line x1={X(0) - 6} y1={Y(j)} x2={X(0)} y2={Y(j)} stroke="currentColor" strokeWidth="1" />
            <text x={X(0) - 10} y={Y(j) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {j}
            </text>
          </g>
        ))}

        {/* DPI bound 1: the relevance ceiling I(T;Y) <= I(X;Y) = 0.594 */}
        <line
          x1={X(0)}
          y1={Y(CEIL)}
          x2={X(2.2)}
          y2={Y(CEIL)}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="6 4"
          opacity="0.7"
        />

        {/* DPI bound 2: the rate diagonal I(T;Y) <= I(X;T), clipped at the ceiling */}
        <line
          x1={X(0)}
          y1={Y(0)}
          x2={X(CEIL)}
          y2={Y(CEIL)}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="6 4"
          opacity="0.7"
        />

        {/* the β-swept frontier */}
        <path d={frontierPath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />

        {/* leader from the frontier label up to the curve */}
        <line x1={X(1.62)} y1={Y(0.40)} x2={X(1.5)} y2={Y(frontier(1.5))} stroke={ACCENT} strokeWidth="1" opacity="0.5" />

        {/* dominated hard encoders (blue) */}
        {bluePts.map((p) => (
          <circle key={p.label} cx={X(p.i)} cy={Y(p.j)} r="4.5" fill={SUPPORT} />
        ))}

        {/* on/near-frontier encoders (amber) */}
        {amberPts.map((p) => (
          <circle key={p.label} cx={X(p.i)} cy={Y(p.j)} r="5" fill={ACCENT} />
        ))}
      </svg>

      {/* axis titles */}
      <Label px={X(1.1)} py={Y(0) + 46} color="currentColor" weight={500}>
        I(X;&nbsp;T)&nbsp;&mdash;&nbsp;bits kept about X (rate)
      </Label>
      <div
        style={{
          position: "absolute",
          left: "-1.5%",
          top: `${(Y(0.35) / 380) * 100}%`,
          transform: "translate(-50%, -50%) rotate(-90deg)",
          color: "currentColor",
          fontWeight: 500,
          fontSize: 13,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        I(T;&nbsp;Y) &mdash; bits kept about Y
      </div>

      {/* DPI bound 1: ceiling label, above the dashed line in open space */}
      <Label px={X(0.97)} py={Y(CEIL) - 30} color="currentColor" weight={600} size={12.5}>
        <M tex={String.raw`I(X;Y) = 0.594`} size={12.5} />
        <br />
        <span style={{ fontWeight: 500, opacity: 0.85 }}>DPI relevance ceiling</span>
      </Label>

      {/* DPI bound 2: diagonal label, rotated to lie along the dashed line */}
      <div
        style={{
          position: "absolute",
          left: `${(X(0.30) / 640) * 100}%`,
          top: `${(Y(0.455) / 380) * 100}%`,
          transform: "translate(-50%, -50%) rotate(-57deg)",
          color: "currentColor",
          fontWeight: 600,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <M tex={String.raw`I(T;Y) \le I(X;T)`} size={12.5} />
      </div>

      {/* frontier label + slope note (amber) */}
      <Label px={X(1.66)} py={Y(0.375)} color={ACCENT} align="left" size={12.5}>
        β-swept frontier
        <br />
        <span style={{ fontWeight: 500, opacity: 0.85 }}>(stochastic encoders)</span>
      </Label>
      <Label px={X(0.44)} py={Y(0.185)} color={ACCENT} align="left" size={12} opacity={0.9}>
        slope <M tex={String.raw`1/\beta`} size={12} />
      </Label>

      {/* amber point labels */}
      <Label px={X(0.075)} py={Y(0.05)} color={ACCENT} align="left" size={12.5}>
        collapse
      </Label>
      <Label px={X(1)} py={Y(0.456) - 15} color={ACCENT} align="center" size={12.5}>
        ab | cd
      </Label>
      <Label px={X(2) - 8} py={Y(0.594) - 15} color={ACCENT} align="right" size={12.5}>
        T = X
      </Label>

      {/* blue (dominated) point labels */}
      <Label px={X(0.811) - 14} py={Y(0.311)} color={SUPPORT} align="right" size={12.5}>
        a | bcd
      </Label>
      <Label px={X(1) + 12} py={Y(0.046) - 8} color={SUPPORT} align="left" size={12.5}>
        ac | bd
      </Label>
      <Label px={X(1) + 12} py={Y(0) + 16} color={SUPPORT} align="left" size={12.5}>
        ad | bc
      </Label>
    </div>
  );
}
