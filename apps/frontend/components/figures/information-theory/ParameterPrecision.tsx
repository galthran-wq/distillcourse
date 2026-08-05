import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * The MDL precision trade on one parameter axis (after Grünwald §2.4.2, the
 * Fisher-information rounding argument — redrawn, not copied). Worked on the
 * lesson's running example: theta-hat = 0.9 estimated from n = 20 Bernoulli
 * transitions, Fisher information I = 11.1.
 *
 * One idea: encode a parameter exactly as finely as the data can distinguish —
 * spacing 1/sqrt(n) — which prices it at (1/2) log2 n bits.
 *
 * Top: the same theta-hat on two grids. A coarse grid (1/8, 3 bits) rounds
 * 0.9 to 0.875 and pays a real fit penalty; a fine grid (1/64, 6 bits) lands
 * essentially on-grid but buys precision the data cannot see. Bottom: the cost
 * plot — blue fit penalty falls, amber description cost rises 45 degrees, and
 * their currentColor sum is a U whose minimum sits at d* ~ 1/sqrt(n).
 *
 * Colors: amber = description / model role; blue = fit role; currentColor =
 * the total and the axes.
 *
 * Component tier: inline SVG for graphics, HTML overlay + KaTeX (<M>) for the
 * math-bearing labels.
 */

// ---------------------------------------------------------------- viewBox
const W = 640;
const H = 662;

// ---- shared theta-axis (both rows share x-coordinates) ----
const TX = (t: number) => 72 + t * 500; // theta 0 -> 72, 1 -> 572
const AXIS1 = 120; // coarse-grid baseline
const AXIS2 = 232; // fine-grid baseline
const THETA_HAT = 0.9;
const NEAREST_COARSE = 0.875; // nearest multiple of 1/8 to 0.9

// ---- cost plot (equal aspect so the description line is truly 45 deg) ----
const S = 30; // px per bit, both axes
const PX0 = 182;
const PY0 = 570;
const PX = (x: number) => PX0 + x * S;
const PY = (y: number) => PY0 - y * S;
const YMAX = 8.5;

// fit penalty  n I d^2 / (8 ln2), with d = 2^-x  =>  falls in x
const N_OBS = 20;
const FISHER = 11.1;
const NI = N_OBS * FISHER; // 222
const FITC = NI / (8 * Math.LN2); // ~40.0
const FIT = (x: number) => FITC * Math.pow(2, -2 * x);
const SUM = (x: number) => FIT(x) + x; // fit + description

// U minimum: 2^(2x) = n I / 4  =>  x* = (1/2) log2(nI/4) = (1/2)log2 n + const
const X_STAR = 0.5 * Math.log2(NI / 4);
const Y_STAR = SUM(X_STAR);

// sample a monotone-in-window curve, clipped to the plot box
function curve(f: (x: number) => number, xa: number, xb: number) {
  const pts: string[] = [];
  const NS = 300;
  let started = false;
  for (let i = 0; i <= NS; i++) {
    const x = xa + ((xb - xa) * i) / NS;
    const y = f(x);
    if (y > YMAX || y < 0) {
      started = false;
      continue;
    }
    pts.push(`${started ? "L" : "M"}${PX(x).toFixed(1)},${PY(y).toFixed(1)}`);
    started = true;
  }
  return pts.join(" ");
}

const fitPath = curve(FIT, 0, 8);
const sumPath = curve(SUM, 0, 8);

// -------------------------------------------------- HTML overlay label
function Label({
  px,
  py,
  children,
  color = "currentColor",
  weight = 600,
  align = "center",
  size = 13,
  opacity = 1,
  width,
}: {
  px: number;
  py: number;
  children: React.ReactNode;
  color?: string;
  weight?: number;
  align?: "center" | "left" | "right";
  size?: number;
  opacity?: number;
  width?: number;
}) {
  const tx =
    align === "center"
      ? "translate(-50%, -50%)"
      : align === "right"
        ? "translate(-100%, -50%)"
        : "translateY(-50%)";
  return (
    <div
      style={{
        position: "absolute",
        left: `${(px / W) * 100}%`,
        top: `${(py / H) * 100}%`,
        transform: tx,
        color,
        opacity,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.3,
        textAlign: align === "right" ? "right" : align === "center" ? "center" : "left",
        whiteSpace: width ? "normal" : "nowrap",
        width: width ? `${width}px` : undefined,
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );
}

export default function ParameterPrecision() {
  const coarseTicks = Array.from({ length: 9 }, (_, i) => i / 8); // 0..1 step 1/8
  const fineTicks = Array.from({ length: 65 }, (_, i) => i / 64); // 0..1 step 1/64

  return (
    <div style={{ position: "relative", maxWidth: 640, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <svg viewBox={`0 0 ${W} ${H}`} fontFamily="system-ui, sans-serif" fontSize="13" style={{ width: "100%", height: "auto" }}>
        {/* ===================== top: two grids, one theta-hat ===================== */}

        {/* faint guide tying the same estimate across both grids */}
        <line x1={TX(THETA_HAT)} y1={AXIS1} x2={TX(THETA_HAT)} y2={AXIS2} stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.35" />

        {/* --- row 1: coarse grid 1/8 --- */}
        <line x1={TX(0)} y1={AXIS1} x2={TX(1)} y2={AXIS1} stroke="currentColor" strokeWidth="1.5" />
        {coarseTicks.map((t) => (
          <line key={`c${t}`} x1={TX(t)} y1={AXIS1 - 9} x2={TX(t)} y2={AXIS1} stroke={SUPPORT} strokeWidth="2" />
        ))}
        {/* rounding arrow: theta-hat -> nearest tick */}
        <line x1={TX(THETA_HAT)} y1={AXIS1} x2={TX(NEAREST_COARSE) + 4} y2={AXIS1} stroke={ACCENT} strokeWidth="1.6" />
        <path d={`M${TX(NEAREST_COARSE)},${AXIS1} l7,-4 l0,8 Z`} fill={ACCENT} />
        <circle cx={TX(THETA_HAT)} cy={AXIS1} r="4.5" fill={ACCENT} />

        {/* --- row 2: fine grid 1/64 --- */}
        <line x1={TX(0)} y1={AXIS2} x2={TX(1)} y2={AXIS2} stroke="currentColor" strokeWidth="1.5" />
        {fineTicks.map((t) => (
          <line key={`f${t}`} x1={TX(t)} y1={AXIS2 - 7} x2={TX(t)} y2={AXIS2} stroke={SUPPORT} strokeWidth="0.7" opacity="0.8" />
        ))}
        <circle cx={TX(THETA_HAT)} cy={AXIS2} r="4.5" fill={ACCENT} />

        {/* theta endpoints (shared) */}
        <text x={TX(0)} y={AXIS2 + 20} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">0</text>
        <text x={TX(1)} y={AXIS2 + 20} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">1</text>
        <text x={TX(1) + 16} y={AXIS2 + 4} textAnchor="start" fill="currentColor" opacity="0.55" fontSize="13" fontStyle="italic">θ</text>

        {/* ===================== bottom: cost plot ===================== */}

        {/* axes */}
        <line x1={PX(0)} y1={PY(0)} x2={PX(8.6)} y2={PY(0)} stroke="currentColor" strokeWidth="1.5" />
        <line x1={PX(0)} y1={PY(0)} x2={PX(0)} y2={PY(8.6)} stroke="currentColor" strokeWidth="1.5" />

        {/* x ticks 1..8 */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((x) => (
          <g key={`xt${x}`}>
            <line x1={PX(x)} y1={PY(0)} x2={PX(x)} y2={PY(0) + 5} stroke="currentColor" strokeWidth="1" />
            <text x={PX(x)} y={PY(0) + 18} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="11">{x}</text>
          </g>
        ))}
        {/* y ticks 0,2,4,6,8 */}
        {[0, 2, 4, 6, 8].map((y) => (
          <g key={`yt${y}`}>
            <line x1={PX(0) - 5} y1={PY(y)} x2={PX(0)} y2={PY(y)} stroke="currentColor" strokeWidth="1" />
            <text x={PX(0) - 9} y={PY(y) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="11">{y}</text>
          </g>
        ))}

        {/* description cost: amber 45-degree line y = x */}
        <line x1={PX(0)} y1={PY(0)} x2={PX(8)} y2={PY(8)} stroke={ACCENT} strokeWidth="2" />

        {/* fit penalty: blue falling curve */}
        <path d={fitPath} fill="none" stroke={SUPPORT} strokeWidth="2" strokeLinecap="round" />

        {/* the sum: bold currentColor U-curve */}
        <path d={sumPath} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />

        {/* minimum marker + guide down to the x-axis */}
        <line x1={PX(X_STAR)} y1={PY(Y_STAR)} x2={PX(X_STAR)} y2={PY(0)} stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
        <circle cx={PX(X_STAR)} cy={PY(Y_STAR)} r="5" fill="currentColor" />
        <line x1={PX(X_STAR)} y1={PY(0)} x2={PX(X_STAR)} y2={PY(0) + 5} stroke="currentColor" strokeWidth="1.5" />

        {/* leader from the min label to the min dot */}
        <line x1={PX(4.45)} y1={PY(2.75)} x2={PX(X_STAR) + 7} y2={PY(Y_STAR)} stroke="currentColor" strokeWidth="1" opacity="0.5" />

        {/* leader from fit label to the blue curve */}
        <line x1={PX(2.55)} y1={PY(6.75)} x2={PX(1.75)} y2={PY(FIT(1.75))} stroke={SUPPORT} strokeWidth="1" opacity="0.6" />

        {/* leader from description label to the amber line */}
        <line x1={PX(6.35)} y1={PY(4.15)} x2={PX(5.4)} y2={PY(5.4)} stroke={ACCENT} strokeWidth="1" opacity="0.6" />
      </svg>

      {/* -------- overlay: row titles -------- */}
      <Label px={TX(0)} py={AXIS1 - 30} align="left" color="currentColor">
        spacing <M tex={String.raw`1/8`} size={13} /> &mdash; <span style={{ color: ACCENT }}>3 bits</span>
      </Label>
      <Label px={TX(0)} py={AXIS2 - 30} align="left" color="currentColor">
        spacing <M tex={String.raw`1/64`} size={13} /> &mdash; <span style={{ color: ACCENT }}>6 bits</span>
      </Label>

      {/* -------- overlay: theta-hat label on the coarse dot -------- */}
      <Label px={TX(THETA_HAT) + 10} py={AXIS1 - 20} align="left" color={ACCENT}>
        <M tex={String.raw`\hat\theta = 0.9`} size={13} />
      </Label>

      {/* -------- overlay: per-row annotations -------- */}
      <Label px={TX(1) + 2} py={AXIS1 + 26} align="right" color="currentColor" weight={500} size={12.5}>
        <span style={{ opacity: 0.75 }}>
          ε = 0.025 → round to 0.875, <span style={{ color: SUPPORT, fontWeight: 600, opacity: 1 }}>fit +0.10 bits</span>
        </span>
      </Label>
      <Label px={TX(1) + 2} py={AXIS2 + 34} align="right" color="currentColor" weight={500} size={12.5}>
        <span style={{ opacity: 0.75 }}>
          <span style={{ color: SUPPORT, fontWeight: 600, opacity: 1 }}>fit +0.01 bits</span> — precision the data cannot see
        </span>
      </Label>

      {/* -------- overlay: plot axis titles -------- */}
      <Label px={PX(4)} py={PY(0) + 38} color="currentColor" weight={500} size={12.5}>
        bits per parameter,&nbsp;<M tex={String.raw`\log_2(1/d)`} size={12.5} />
      </Label>
      <div
        style={{
          position: "absolute",
          left: `${((PX(0) - 34) / W) * 100}%`,
          top: `${(PY(4.3) / H) * 100}%`,
          transform: "translate(-50%, -50%) rotate(-90deg)",
          color: "currentColor",
          fontWeight: 500,
          fontSize: 12.5,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        bits
      </div>

      {/* -------- overlay: curve labels -------- */}
      <Label px={PX(2.55)} py={PY(6.95)} color={SUPPORT} align="center" size={12.5}>
        <div style={{ fontWeight: 600 }}>fit penalty</div>
        <M tex={String.raw`\textcolor{${SUPPORT}}{\dfrac{n\,I\,d^{2}}{8\ln 2}}`} size={13} />
      </Label>
      <Label px={PX(6.4)} py={PY(3.85)} color={ACCENT} align="center" size={12.5}>
        <div style={{ fontWeight: 600 }}>description cost</div>
        <M tex={String.raw`\textcolor{${ACCENT}}{\log_2(1/d)}`} size={13} />
      </Label>

      {/* -------- overlay: minimum label (KaTeX) -------- */}
      <Label px={PX(5.35)} py={PY(2.15)} color="currentColor" align="center" size={13}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>minimum</div>
        <M tex={String.raw`d^{*}\propto 1/\sqrt{n}\ \Rightarrow\ \tfrac12\log_2 n`} size={13} />
      </Label>

      {/* -------- footer -------- */}
      <Label px={W / 2} py={H - 16} color="currentColor" align="center" size={13.5}>
        <M tex={String.raw`k\text{ parameters}\ \Rightarrow\ L(\theta)\approx \tfrac{k}{2}\log_2 n`} size={13.5} />
      </Label>
    </div>
  );
}
