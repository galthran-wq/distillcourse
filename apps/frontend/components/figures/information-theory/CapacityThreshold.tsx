import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * The channel-coding threshold as a picture: best achievable block error vs
 * rate R in the n -> infinity limit, for a channel of capacity C = 0.531.
 *
 * One idea: capacity is a cliff. Left of C every rate is achievable and the
 * best block error drops to 0 (blue, flat on the axis). Right of C no code
 * can do better than the Fano floor 1 - C/R (amber curve), and the whole
 * region beneath that floor is unreachable (amber hatch). At R = C a hard
 * amber wall separates the two regimes.
 *
 * Static twin of the ChannelCodingThreshold interactive Demo. Recreates the
 * coding-theorem region of Cover & Thomas ch. 7 (redrawn, not copied).
 *
 * Component tier: inline SVG for the plot, HTML overlay + KaTeX (<M>) for the
 * two labels that carry real math ("C = 0.531", "1 - C/R").
 */

const C = 0.531;

// coordinate frame (viewBox 640 x 380)
const X = (r: number) => 90 + r * 490; // R=0 -> 90, R=1 -> 580
const Y = (v: number) => 300 - v * 240; // err=0 -> 300, err=1 -> 60

// Fano floor: best achievable block error for R > C in the n -> infinity limit
const floor = (r: number) => 1 - C / r;

// sample the floor curve from C to 1
const NS = 120;
const floorSamples = Array.from({ length: NS + 1 }, (_, i) => C + (i / NS) * (1 - C));
const floorPath = floorSamples
  .map((r, i) => `${i ? "L" : "M"}${X(r).toFixed(1)},${Y(floor(r)).toFixed(1)}`)
  .join(" ");

// forbidden wedge: under the floor curve, down to the axis, back along it
const forbiddenPath =
  `M${X(C).toFixed(1)},${Y(0).toFixed(1)} ` +
  floorSamples.map((r) => `L${X(r).toFixed(1)},${Y(floor(r)).toFixed(1)}`).join(" ") +
  ` L${X(1).toFixed(1)},${Y(0).toFixed(1)} Z`;

// overlay label: place an HTML node at svg-pixel (px, py) inside the 640x380 frame
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
  align?: "center" | "left";
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${(px / 640) * 100}%`,
        top: `${(py / 380) * 100}%`,
        transform: align === "center" ? "translate(-50%, -50%)" : "translateY(-50%)",
        color,
        fontWeight: weight,
        fontSize: 13,
        lineHeight: 1.25,
        textAlign: align,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
}

export default function CapacityThreshold() {
  return (
    <div style={{ position: "relative", maxWidth: 640, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <svg viewBox="0 0 640 380" fontFamily="system-ui, sans-serif" fontSize="14" style={{ width: "100%", height: "auto" }}>
        <defs>
          <pattern id="ct-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke={ACCENT} strokeWidth="1" opacity="0.45" />
          </pattern>
        </defs>

        {/* faint blue wash on the achievable side (R < C) */}
        <rect x={X(0)} y={Y(1)} width={X(C) - X(0)} height={Y(0) - Y(1)} fill={SUPPORT} opacity="0.06" />

        {/* forbidden wedge under the Fano floor */}
        <path d={forbiddenPath} fill="url(#ct-hatch)" stroke="none" />

        {/* axes */}
        <line x1={X(0)} y1={Y(0)} x2={X(1) + 20} y2={Y(0)} stroke="currentColor" strokeWidth="1.5" />
        <line x1={X(0)} y1={Y(0)} x2={X(0)} y2={Y(1) - 12} stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks: 0, C, 1 */}
        {[
          { r: 0, t: "0" },
          { r: 1, t: "1" },
        ].map(({ r, t }) => (
          <g key={t}>
            <line x1={X(r)} y1={Y(0)} x2={X(r)} y2={Y(0) + 6} stroke="currentColor" strokeWidth="1" />
            <text x={X(r)} y={Y(0) + 22} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              {t}
            </text>
          </g>
        ))}
        {/* C tick (amber) */}
        <line x1={X(C)} y1={Y(0)} x2={X(C)} y2={Y(0) + 6} stroke={ACCENT} strokeWidth="1.5" />
        <text x={X(C)} y={Y(0) + 22} textAnchor="middle" fill={ACCENT} fontWeight="600" fontSize="12">
          C
        </text>

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

        {/* the amber wall at R = C */}
        <line
          x1={X(C)}
          y1={Y(0)}
          x2={X(C)}
          y2={Y(1)}
          stroke={ACCENT}
          strokeWidth="2"
          strokeDasharray="5 4"
        />

        {/* the Fano floor curve (amber) for R > C */}
        <path d={floorPath} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />

        {/* the achievable line: flat on the axis for R < C (blue, thick) */}
        <line x1={X(0)} y1={Y(0)} x2={X(C)} y2={Y(0)} stroke={SUPPORT} strokeWidth="4" strokeLinecap="round" />
        {/* the cliff point where the two regimes meet */}
        <circle cx={X(C)} cy={Y(0)} r="4" fill={ACCENT} />

        {/* leader from the label down into the hatched forbidden wedge */}
        <line x1={X(0.9)} y1={Y(0.62)} x2={X(0.9)} y2={Y(0.24)} stroke={ACCENT} strokeWidth="1.2" opacity="0.7" />
        <path d={`M${X(0.9)},${Y(0.2)} l-4,-8 l8,0 Z`} fill={ACCENT} opacity="0.7" />
      </svg>

      {/* axis titles */}
      <Label px={X(0.5)} py={Y(0) + 46} color="currentColor" weight={500}>
        rate R (bits per use)
      </Label>
      <div
        style={{
          position: "absolute",
          left: "-1%",
          top: `${(Y(0.5) / 380) * 100}%`,
          transform: "translate(-50%, -50%) rotate(-90deg)",
          color: "currentColor",
          fontWeight: 500,
          fontSize: 13,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        best achievable block error
      </div>

      {/* C = 0.531 at the wall */}
      <Label px={X(C)} py={Y(1) - 18} color={ACCENT}>
        <M tex={String.raw`C = 0.531`} size={13} />
      </Label>

      {/* achievable side */}
      <Label px={X(0.24)} py={Y(0) - 20} color={SUPPORT}>
        error &rarr; 0: achievable
      </Label>

      {/* forbidden floor */}
      <Label px={X(0.9)} py={Y(0.72)} color={ACCENT} align="center">
        <div>no code lands here</div>
        <div style={{ fontWeight: 500 }}>
          Fano floor&nbsp;
          <M tex={String.raw`1 - C/R`} size={13} />
        </div>
      </Label>
    </div>
  );
}
