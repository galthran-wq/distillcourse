import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * CeVsMseLoss — the two losses for a single positive example (y = 1) as
 * functions of the score z, with their slopes at z = −4 annotated.
 *
 * One idea: in the confidently-wrong region (z ≪ 0 while y = 1) cross-entropy
 * keeps slope ≈ −1 while squared error saturates toward 1 and its gradient
 * vanishes. Amber = cross-entropy −log p (the subject), blue = squared error
 * (1−p)²; the colors bind the curves, the dots at z = −4, the dashed tangent
 * segments, and the formulas in the headline and the on-plot labels.
 */

const W = 560;
const H = 330;
const PX0 = 52; // z = −6
const PX1 = 536; // z = +6
const PY0 = 284; // loss = 0
const PY1 = 34; // loss = 6
const LMAX = 6;

const xOf = (z: number) => PX0 + ((z + 6) / 12) * (PX1 - PX0);
const yOf = (L: number) => PY0 - (L / LMAX) * (PY0 - PY1);

const sig = (z: number) => 1 / (1 + Math.exp(-z));
const ce = (z: number) => Math.log(1 + Math.exp(-z)); // −log σ(z), stable form
const se = (z: number) => (1 - sig(z)) ** 2;

const path = (f: (z: number) => number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 240; i++) {
    const z = -6 + (12 * i) / 240;
    pts.push(`${xOf(z).toFixed(1)} ${yOf(Math.min(f(z), LMAX)).toFixed(1)}`);
  }
  return "M " + pts.join(" L ");
};

// the annotated point z = −4: p = σ(−4) = 0.018
const Z = -4;
const CE_AT = ce(Z); // 4.018
const SE_AT = se(Z); // 0.964
// slopes there: dL_CE/dz = p − 1 = −0.982; dL_SE/dz = −2p(1−p)² = −0.035

const X_TICKS = [-6, -4, -2, 0, 2, 4, 6];
const Y_TICKS = [0, 2, 4, 6];

export default function CeVsMseLoss() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      {/* headline: the two losses, colors bound to the curves */}
      <div style={{ marginBottom: 4, paddingLeft: PX0 }}>
        <M
          tex={String.raw`y = 1:\quad \textcolor{${ACCENT}}{L_{\mathrm{CE}} = -\log p}\qquad \textcolor{${SUPPORT}}{L_{\mathrm{SE}} = (1-p)^2}\qquad p = \sigma(z)`}
          size={14.5}
        />
      </div>

      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {/* confidently-wrong region: z ≤ −2 */}
          <rect
            x={PX0}
            y={PY1}
            width={xOf(-2) - PX0}
            height={PY0 - PY1}
            fill="currentColor"
            opacity="0.05"
          />

          {/* axes */}
          <line x1={PX0} y1={PY0} x2={PX1 + 8} y2={PY0} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          <line x1={PX0} y1={PY1 - 4} x2={PX0} y2={PY0} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />

          {/* ticks */}
          {X_TICKS.map((t) => (
            <g key={`x${t}`}>
              <line x1={xOf(t)} y1={PY0} x2={xOf(t)} y2={PY0 + 5} stroke="currentColor" strokeWidth="1" opacity="0.55" />
              <text x={xOf(t)} y={PY0 + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
                {t}
              </text>
            </g>
          ))}
          {Y_TICKS.map((t) => (
            <g key={`y${t}`}>
              <line x1={PX0 - 5} y1={yOf(t)} x2={PX0} y2={yOf(t)} stroke="currentColor" strokeWidth="1" opacity="0.55" />
              <text x={PX0 - 9} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55">
                {t}
              </text>
            </g>
          ))}
          <text x={12} y={PY1 - 10} fontSize="11.5" fill="currentColor" opacity="0.6">
            loss
          </text>

          {/* the two loss curves */}
          <path d={path(ce)} fill="none" stroke={ACCENT} strokeWidth="2.6" />
          <path d={path(se)} fill="none" stroke={SUPPORT} strokeWidth="2.6" />

          {/* dots at z = −4 */}
          <circle cx={xOf(Z)} cy={yOf(CE_AT)} r="4.5" fill={ACCENT} />
          <circle cx={xOf(Z)} cy={yOf(SE_AT)} r="4.5" fill={SUPPORT} />
        </svg>

        {/* region label (bottom-left, under both curves) */}
        <div
          style={{
            position: "absolute",
            left: PX0 + 8,
            top: 250,
            fontSize: 11.5,
            opacity: 0.6,
            lineHeight: 1.35,
          }}
        >
          confidently wrong:
          <br />
          <M tex={String.raw`z \ll 0`} size={11.5} /> while <M tex="y = 1" size={11.5} />
        </div>

        {/* CE slope annotation */}
        <div style={{ position: "absolute", left: 152, top: 84, whiteSpace: "nowrap" }}>
          <M tex={String.raw`\text{slope} \approx -0.98`} size={13.5} color={ACCENT} />
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>
            at <M tex={String.raw`z = -4,\ p = 0.018`} size={11} />
          </div>
        </div>

        {/* SE slope annotation */}
        <div style={{ position: "absolute", left: 172, top: 218, whiteSpace: "nowrap" }}>
          <M tex={String.raw`\text{slope} \approx -0.03`} size={13.5} color={SUPPORT} />
        </div>

        {/* curve labels */}
        <div style={{ position: "absolute", left: 232, top: 142, whiteSpace: "nowrap", color: ACCENT }}>
          cross-entropy <M tex={String.raw`-\log p`} size={13} color={ACCENT} />
        </div>
        <div style={{ position: "absolute", left: 340, top: 246, whiteSpace: "nowrap", color: SUPPORT }}>
          squared error <M tex={String.raw`(1-p)^2`} size={13} color={SUPPORT} />
        </div>

        {/* x-axis title */}
        <div
          style={{
            position: "absolute",
            left: (PX0 + PX1) / 2,
            top: PY0 + 22,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          <M tex={String.raw`z = w^\top x`} size={13} />
        </div>
      </div>
    </div>
  );
}
