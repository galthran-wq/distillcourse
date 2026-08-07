import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * The Occam factor as a collapse of one parameter axis (after MacKay §28.1 —
 * redrawn, not copied).
 *
 * One idea: the bits a parameter costs are the logarithm of how far the data
 * narrowed it.
 *
 * Top panel, before the data: a flat amber prior band of width sigma_w spans
 * the whole axis. Bottom panel, after the data: the same axis carries a narrow
 * blue posterior bump of width sigma_{w|D} ~ 1/sqrt(n); the rest is greyed.
 * A bracket to the right names the ratio as the Occam factor and its negative
 * logarithm as (1/2) log2 n + O(1) bits.
 *
 * Colors: amber = prior / model role, blue = posterior / fit role,
 * currentColor = axes and text.
 *
 * Component tier: inline SVG for graphics, HTML overlay + KaTeX (<M>) for the
 * math-bearing labels.
 */

// ---------------------------------------------------------------- viewBox
const W = 680;
const H = 340;

// ---- shared parameter axis (both panels share x-coordinates) ----
const PX0 = 48;
const PX1 = 372;
const CX = (PX0 + PX1) / 2; // 210
const AXIS1 = 118; // prior baseline
const AXIS2 = 288; // posterior baseline

const BAND_TOP = 92; // flat prior band
const ARROW1_Y = 74;
const ARROW2_Y = 238;

const SIG = 20; // posterior half-width in px  (sigma_{w|D})
const PEAK = 46; // posterior bump height in px

// ---- posterior density, drawn across the whole axis ----
function bumpPath() {
  const pts: string[] = [`M${PX0},${AXIS2}`];
  const NS = 220;
  for (let i = 0; i <= NS; i++) {
    const x = PX0 + ((PX1 - PX0) * i) / NS;
    const y = AXIS2 - PEAK * Math.exp(-0.5 * ((x - CX) / SIG) ** 2);
    pts.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
  }
  pts.push(`L${PX1},${AXIS2}`);
  return pts.join(" ");
}
const BUMP = bumpPath();

// -------------------------------------------------- double-headed arrow
function DoubleArrow({ x1, x2, y, color }: { x1: number; x2: number; y: number; color: string }) {
  const h = 5; // arrowhead half-height
  const l = 7; // arrowhead length
  return (
    <g>
      <line x1={x1 + l} y1={y} x2={x2 - l} y2={y} stroke={color} strokeWidth="1.6" />
      <path d={`M${x1},${y} l${l},${-h} l0,${2 * h} Z`} fill={color} />
      <path d={`M${x2},${y} l${-l},${-h} l0,${2 * h} Z`} fill={color} />
    </g>
  );
}

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
        lineHeight: 1.35,
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

export default function OccamFactorSplit() {
  return (
    <div style={{ position: "relative", maxWidth: 680, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <svg viewBox={`0 0 ${W} ${H}`} fontFamily="system-ui, sans-serif" fontSize="13" style={{ width: "100%", height: "auto" }}>
        {/* ============ top panel: flat prior band over the whole axis ============ */}
        <path
          d={`M${PX0},${AXIS1} V${BAND_TOP} H${PX1} V${AXIS1}`}
          fill={ACCENT}
          fillOpacity="0.18"
          stroke={ACCENT}
          strokeWidth="1.8"
        />
        <DoubleArrow x1={PX0} x2={PX1} y={ARROW1_Y} color={ACCENT} />

        {/* axis 1 */}
        <line x1={PX0 - 14} y1={AXIS1} x2={PX1 + 14} y2={AXIS1} stroke="currentColor" strokeWidth="1.5" />
        <text x={PX1 + 22} y={AXIS1 + 4} fontSize="13" fontStyle="italic" fill="currentColor" opacity="0.6">
          w
        </text>

        {/* ============ transition ============ */}
        <line x1={PX0 + 12} y1={152} x2={PX0 + 66} y2={152} stroke="currentColor" strokeWidth="1.8" />
        <path d={`M${PX0 + 74},152 l-9,-5 l0,10 Z`} fill="currentColor" />

        {/* ============ guides: where the surviving sliver sits ============ */}
        {[CX - SIG, CX + SIG].map((x) => (
          <line
            key={x}
            x1={x}
            y1={BAND_TOP}
            x2={x}
            y2={AXIS2}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.3"
          />
        ))}

        {/* ============ bottom panel: narrow posterior on the same axis ============ */}
        {/* the prior band's footprint, now greyed out: the data killed all of it
            except the sliver between the guides */}
        <rect
          x={PX0}
          y={AXIS2 - (AXIS1 - BAND_TOP)}
          width={PX1 - PX0}
          height={AXIS1 - BAND_TOP}
          fill="currentColor"
          fillOpacity="0.07"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="1"
          strokeDasharray="3 4"
        />

        <path d={BUMP} fill={SUPPORT} fillOpacity="0.28" stroke={SUPPORT} strokeWidth="2" strokeLinejoin="round" />

        <DoubleArrow x1={CX - SIG} x2={CX + SIG} y={ARROW2_Y} color={SUPPORT} />
        {/* leader from the arrow to its label, which sits clear of the bump */}
        <line x1={CX + SIG + 1} y1={ARROW2_Y} x2={CX + SIG + 20} y2={ARROW2_Y - 12} stroke={SUPPORT} strokeWidth="1" opacity="0.65" />

        {/* axis 2: full where the posterior lives, greyed elsewhere */}
        <line x1={PX0 - 14} y1={AXIS2} x2={CX - SIG} y2={AXIS2} stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <line x1={CX - SIG} y1={AXIS2} x2={CX + SIG} y2={AXIS2} stroke="currentColor" strokeWidth="1.5" />
        <line x1={CX + SIG} y1={AXIS2} x2={PX1 + 14} y2={AXIS2} stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <text x={PX1 + 22} y={AXIS2 + 4} fontSize="13" fontStyle="italic" fill="currentColor" opacity="0.6">
          w
        </text>

        {/* ============ bracket joining the two panels ============ */}
        <path
          d={`M${PX1 + 42},62 h9 v106 h9 h-9 v106 h-9`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.6"
          strokeLinejoin="round"
        />
      </svg>

      {/* -------- panel titles -------- */}
      <Label px={PX0} py={26} align="left" color={ACCENT} size={13.5}>
        before the data
      </Label>
      <Label px={PX0} py={190} align="left" color={SUPPORT} size={13.5}>
        after the data
      </Label>

      {/* -------- prior width -------- */}
      <Label px={CX} py={50} color={ACCENT} size={13}>
        <M tex={String.raw`\textcolor{${ACCENT}}{\sigma_w}`} size={13.5} />
        <span style={{ fontWeight: 500 }}>&nbsp;— values allowed a priori</span>
      </Label>

      {/* -------- transition -------- */}
      <Label px={PX0 + 84} py={152} align="left" color="currentColor" size={13}>
        <M tex={String.raw`D`} size={13.5} /> arrives
      </Label>

      {/* -------- posterior width -------- */}
      <Label px={CX + SIG + 22} py={ARROW2_Y - 15} align="left" color={SUPPORT} size={13}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{\sigma_{w|D}} \propto 1/\sqrt{n}`} size={13.5} />
      </Label>
      <Label px={PX0 + 4} py={314} align="left" color="currentColor" weight={500} size={12.5} opacity={0.6}>
        everything else: ruled out by the data
      </Label>

      {/* -------- the bracket's payoff -------- */}
      <Label px={PX1 + 74} py={168} align="left" color="currentColor" size={13} width={222}>
        <div>
          <b>Occam factor</b>{" "}
          <M tex={String.raw`=\ \dfrac{\textcolor{${SUPPORT}}{\sigma_{w|D}}}{\textcolor{${ACCENT}}{\sigma_w}}`} size={13.5} />
        </div>
        <div style={{ marginTop: 12 }}>
          <M tex={String.raw`-\log_2 \dfrac{\textcolor{${SUPPORT}}{\sigma_{w|D}}}{\textcolor{${ACCENT}}{\sigma_w}}`} size={13.5} />
        </div>
        <div style={{ marginTop: 4 }}>
          <M tex={String.raw`=\ \tfrac12 \log_2 n + O(1)\ \text{bits}`} size={13.5} />
        </div>
        <div style={{ marginTop: 6, fontWeight: 500, opacity: 0.62, fontSize: 12.5 }}>the price of the parameter</div>
      </Label>
    </div>
  );
}
