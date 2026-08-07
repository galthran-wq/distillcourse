import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * The rate-distortion plane for the fair-bit source (X ~ Bernoulli(1/2)).
 *
 * One idea: the convex curve R(D) = 1 - H(D) is the frontier. Every (D, R)
 * pair on or above it is achievable by SOME code (amber-tinted region);
 * everything below is impossible. A naive rate-1/2 scheme ("send every other
 * bit", blue) sits strictly ABOVE the frontier: at the same rate R = 1/2 it
 * pays D = 0.25 where the optimal code pays only D = 0.11.
 *
 * Color roles: amber = the R(D) curve and its points (the subject); blue = the
 * crude scheme; currentColor = axes and glosses.
 *
 * Static twin of the RateDistortionCurve demo. Recreates the coding region of
 * Cover & Thomas ch. 10 / Balle fig. 2 (redrawn, not copied).
 *
 * Component tier: inline SVG for the plot, HTML overlay + KaTeX (<M>) for the
 * labels that carry real math.
 */

// coordinate frame (viewBox 640 x 380)
const X = (d: number) => 90 + (d / 0.5) * 490; // D=0 -> 90, D=0.5 -> 580
const Y = (r: number) => 300 - r * 240; // R=0 -> 300, R=1 -> 60

function H(p: number): number {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}
const R = (d: number) => 1 - H(d); // the frontier

// sample the frontier curve from D=0 to D=0.5
const NS = 200;
const dSamples = Array.from({ length: NS + 1 }, (_, i) => (i / NS) * 0.5);
const curvePath = dSamples
  .map((d, i) => `${i ? "L" : "M"}${X(d).toFixed(1)},${Y(R(d)).toFixed(1)}`)
  .join(" ");

// achievable region: on/above the curve, closed along the top-right of the box
const achievablePath =
  curvePath + ` L${X(0.5).toFixed(1)},${Y(1).toFixed(1)} L${X(0).toFixed(1)},${Y(1).toFixed(1)} Z`;

// impossible region: under the curve, down to the axis and back
const impossiblePath = curvePath + ` L${X(0.5).toFixed(1)},${Y(0).toFixed(1)} L${X(0).toFixed(1)},${Y(0).toFixed(1)} Z`;

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

export default function RdPlane() {
  return (
    <div style={{ position: "relative", maxWidth: 640, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <svg viewBox="0 0 640 380" fontFamily="system-ui, sans-serif" fontSize="14" style={{ width: "100%", height: "auto" }}>
        {/* impossible region: faint currentColor wash under the curve */}
        <path d={impossiblePath} fill="currentColor" opacity="0.05" stroke="none" />
        {/* achievable region: amber tint on/above the curve */}
        <path d={achievablePath} fill={ACCENT} opacity="0.09" stroke="none" />

        {/* axes */}
        <line x1={X(0)} y1={Y(0)} x2={X(0.5) + 20} y2={Y(0)} stroke="currentColor" strokeWidth="1.5" />
        <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1) - 12} stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks: 0, 0.25, 0.5 */}
        {[
          { d: 0, t: "0" },
          { d: 0.25, t: "0.25" },
          { d: 0.5, t: "0.5" },
        ].map(({ d, t }) => (
          <g key={t}>
            <line x1={X(d)} y1={Y(0)} x2={X(d)} y2={Y(0) + 6} stroke="currentColor" strokeWidth="1" />
            <text x={X(d)} y={Y(0) + 22} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}

        {/* y ticks: 0, 0.5, 1 */}
        {[
          { v: 0, t: "0" },
          { v: 0.5, t: "0.5" },
          { v: 1, t: "1" },
        ].map(({ v, t }) => (
          <g key={t}>
            <line x1={X(0) - 6} y1={Y(v)} x2={X(0)} y2={Y(v)} stroke="currentColor" strokeWidth="1" />
            <text x={X(0) - 10} y={Y(v) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}

        {/* dashed horizontal guide at R = 0.5, blue dot -> curve point */}
        <line
          x1={X(0.11)}
          y1={Y(0.5)}
          x2={X(0.25)}
          y2={Y(0.5)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.6"
        />

        {/* the frontier R(D) = 1 - H(D) */}
        <path d={curvePath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />

        {/* leader connecting the frontier equation down to the curve */}
        <line x1={X(0.30)} y1={Y(0.305)} x2={X(0.30)} y2={Y(0.14)} stroke={ACCENT} strokeWidth="1" opacity="0.55" />

        {/* marked points */}
        <circle cx={X(0)} cy={Y(1)} r="5" fill={ACCENT} />
        <circle cx={X(0.5)} cy={Y(0)} r="5" fill={ACCENT} />
        <circle cx={X(0.25)} cy={Y(0.5)} r="6" fill={SUPPORT} />
        <circle cx={X(0.11)} cy={Y(0.5)} r="4" fill={ACCENT} />
      </svg>

      {/* axis titles */}
      <Label px={X(0.25)} py={Y(0) + 46} color="currentColor" weight={500}>
        D&nbsp;&mdash;&nbsp;Hamming distortion
      </Label>
      <div
        style={{
          position: "absolute",
          left: "-2%",
          top: `${(Y(0.5) / 380) * 100}%`,
          transform: "translate(-50%, -50%) rotate(-90deg)",
          color: "currentColor",
          fontWeight: 500,
          fontSize: 13,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        R &mdash; bits per symbol
      </div>

      {/* region glosses */}
      <Label px={X(0.33)} py={Y(0.74)} color="currentColor" weight={500} size={13} opacity={0.7}>
        achievable: some code reaches this (D, R)
      </Label>
      <Label px={X(0.05)} py={Y(0.3)} color="currentColor" weight={500} size={13} align="left" opacity={0.45}>
        impossible
      </Label>

      {/* the frontier equation, near the curve */}
      <Label px={X(0.30)} py={Y(0.36)} color={ACCENT}>
        <M tex={String.raw`R(D) = 1 - H(D)`} size={13} />
      </Label>

      {/* corner points (amber) */}
      <Label px={X(0.015)} py={Y(1) - 4} color={ACCENT} align="left">
        <M tex={String.raw`R(0) = H(X) = 1`} size={13} />
        <span style={{ fontWeight: 500 }}>: lossless corner</span>
      </Label>
      <Label px={X(0.45)} py={Y(0.08)} color={ACCENT} align="center">
        guessing is free
      </Label>

      {/* the crude rate-1/2 scheme (blue) */}
      <Label px={X(0.28)} py={Y(0.5)} color={SUPPORT} align="left">
        send every other bit
      </Label>

      {/* the optimum at the same rate (amber, small point) */}
      <Label px={X(0.095)} py={Y(0.5)} color={ACCENT} align="right" size={12}>
        optimum at the
        <br />
        same rate
      </Label>

      {/* same-rate comparison along the dashed guide */}
      <Label px={X(0.185)} py={Y(0.5) + 22} color="currentColor" weight={500} size={11} align="center" opacity={0.75}>
        same rate, 25% vs 11% errors
      </Label>
    </div>
  );
}
