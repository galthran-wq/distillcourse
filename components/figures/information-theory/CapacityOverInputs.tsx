import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * CapacityOverInputs — mutual information as a function of the input bias for a
 * fixed channel BSC(0.1).
 *
 * A single amber curve I(π) = H(0.9π + 0.1(1−π)) − H(0.1): an inverted U, zero
 * at both endpoints, peak 0.531 bits at the uniform input π = 0.5 (amber dot).
 * A dashed currentColor guide at the peak height marks the capacity C = 0.531.
 * A blue dot at π = 0.9 marks the worked example's biased input, I = 0.211.
 *
 * One idea: capacity is the peak of this curve — a maximum over the input
 * distribution, the one thing the sender controls. Static twin of the
 * ChannelCapacityDial demo's curve view.
 */

// binary entropy in bits
const Hb = (q: number) =>
  q <= 0 || q >= 1 ? 0 : -q * Math.log2(q) - (1 - q) * Math.log2(1 - q);
const HP = Hb(0.1); // ≈ 0.469
const Imi = (pi: number) => Hb(0.1 + 0.8 * pi) - HP;

// plot geometry
const W = 540;
const HGT = 372;
const PX0 = 74; // left axis (π = 0)
const PX1 = 486; // right edge (π = 1)
const PY0 = 300; // bottom (I = 0)
const PY1 = 44; // top (I = 0.6)
const IMAX = 0.6;
const xOf = (pi: number) => PX0 + pi * (PX1 - PX0);
const yOf = (v: number) => PY0 - (v / IMAX) * (PY0 - PY1);

// key points
const PEAK_PI = 0.5;
const PEAK_I = Imi(PEAK_PI); // 0.531
const BIAS_PI = 0.9;
const BIAS_I = Imi(BIAS_PI); // 0.211

// smooth curve path
const CURVE = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const pi = i / 120;
    pts.push(`${xOf(pi).toFixed(1)} ${yOf(Imi(pi)).toFixed(1)}`);
  }
  return "M " + pts.join(" L ");
})();

const X_TICKS = [0, 0.5, 1];
const Y_TICKS = [0, 0.2, 0.4, 0.6];

export default function CapacityOverInputs() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: HGT,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* axes */}
        <line x1={PX0} y1={PY1 - 6} x2={PX0} y2={PY0} stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
        <line x1={PX0} y1={PY0} x2={PX1 + 8} y2={PY0} stroke="currentColor" strokeWidth="1.2" opacity="0.7" />

        {/* y ticks + gridless labels */}
        {Y_TICKS.map((v) => (
          <g key={`y${v}`}>
            <line x1={PX0 - 5} y1={yOf(v)} x2={PX0} y2={yOf(v)} stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
            <text x={PX0 - 10} y={yOf(v) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* x ticks */}
        {X_TICKS.map((v) => (
          <g key={`x${v}`}>
            <line x1={xOf(v)} y1={PY0} x2={xOf(v)} y2={PY0 + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
            <text x={xOf(v)} y={PY0 + 19} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* faint vertical droplines anchoring the two marked inputs to the axis */}
        <line x1={xOf(PEAK_PI)} y1={yOf(PEAK_I)} x2={xOf(PEAK_PI)} y2={PY0} stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.28" />
        <line x1={xOf(BIAS_PI)} y1={yOf(BIAS_I)} x2={xOf(BIAS_PI)} y2={PY0} stroke={SUPPORT} strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />

        {/* dashed capacity guide at the peak height, from y-axis to the maximum */}
        <line
          x1={PX0}
          y1={yOf(PEAK_I)}
          x2={xOf(PEAK_PI)}
          y2={yOf(PEAK_I)}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeDasharray="3 3"
          opacity="0.5"
        />

        {/* the I(π) curve — the subject */}
        <path d={CURVE} fill="none" stroke={ACCENT} strokeWidth="2.4" strokeLinejoin="round" />

        {/* biased-input example dot (blue) */}
        <circle cx={xOf(BIAS_PI)} cy={yOf(BIAS_I)} r="4" fill={SUPPORT} />

        {/* maximum dot (amber) */}
        <circle cx={xOf(PEAK_PI)} cy={yOf(PEAK_I)} r="4" fill={ACCENT} />
      </svg>

      {/* y-axis title */}
      <div style={{ position: "absolute", left: PX0 - 12, top: 8, whiteSpace: "nowrap", fontSize: 12 }}>
        <M tex={String.raw`I(X;Y)`} size={13} /> <span style={{ opacity: 0.55, fontStyle: "italic" }}>bits</span>
      </div>

      {/* x-axis title */}
      <div
        style={{
          position: "absolute",
          left: (PX0 + PX1) / 2,
          top: PY0 + 28,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontSize: 12,
        }}
      >
        <M tex={String.raw`\pi = P(X=1)`} size={13} />
      </div>

      {/* capacity guide label, left end of the dashed line */}
      <div
        style={{
          position: "absolute",
          left: PX0 + 8,
          top: yOf(PEAK_I) - 24,
          whiteSpace: "nowrap",
        }}
      >
        <M tex={String.raw`C = 0.531`} size={13} />
      </div>

      {/* maximum-point label (amber) */}
      <div
        style={{
          position: "absolute",
          left: xOf(PEAK_PI) + 12,
          top: yOf(PEAK_I) - 4,
          whiteSpace: "nowrap",
          color: ACCENT,
          fontWeight: 600,
        }}
      >
        <M tex={String.raw`\textcolor{${ACCENT}}{\pi = 0.5}`} size={13} />
      </div>

      {/* biased-input label (blue) */}
      <div
        style={{
          position: "absolute",
          left: xOf(BIAS_PI) + 11,
          top: yOf(BIAS_I) - 8,
          whiteSpace: "nowrap",
          color: SUPPORT,
          fontWeight: 600,
        }}
      >
        <M tex={String.raw`\textcolor{${SUPPORT}}{I = 0.211}`} size={13} />
      </div>
    </div>
  );
}
