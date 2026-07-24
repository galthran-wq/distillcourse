import { ACCENT, SUPPORT } from "../palette";

/**
 * AdjustedRateUCurves — schematic recreation of Delétang et al. 2023
 * (arXiv:2309.10668) §3.3. Three curves over model size (log-scale params):
 *
 *   - raw rate (compressed/raw, model bits UNcharged): monotone decreasing,
 *     flattening at the right — bigger Transformers always lower it.
 *     Drawn muted-currentColor, dashed.
 *   - adjusted rate for a SMALL dataset (blue): U-shaped, minimum ~10^6,
 *     rising steeply past 1 at the right edge.
 *   - adjusted rate for a LARGE dataset (amber, the subject): U-shaped,
 *     sitting lower, minimum ~10^8, rising gently.
 *
 * Filled circles mark the two minima; a light arrow connects them
 * ("optimal model size grows with the dataset"). A dashed guide at rate 1.0
 * marks "no compression".
 *
 * One idea: charging the model its own parameter bits turns a monotone curve
 * into a U whose minimum migrates to larger models as the dataset grows.
 * Schematic only — no data points copied from the paper (noted for the
 * lesson's References). Component tier, pure inline SVG.
 */

// ---- coordinate frame ----------------------------------------------------
const X0 = 95;
const X1 = 560;
const Y_TOP = 60;
const Y_BOT = 390;
const R_MAX = 1.2;

// L = log10(params) in [5, 9]
const X = (L: number) => X0 + ((L - 5) / 4) * (X1 - X0);
const Y = (r: number) => Y_BOT - (r / R_MAX) * (Y_BOT - Y_TOP);

// ---- schematic anchors (L, rate) -----------------------------------------
type Pt = [number, number];
const RAW: Pt[] = [
  [5, 0.95],
  [6, 0.6],
  [7, 0.42],
  [8, 0.33],
  [9, 0.29],
];
const SMALL: Pt[] = [
  [5, 0.97],
  [6, 0.66],
  [7, 0.7],
  [8, 0.9],
  [9, 1.18],
];
const LARGE: Pt[] = [
  [5, 0.96],
  [6, 0.61],
  [7, 0.44],
  [8, 0.4],
  [9, 0.5],
];

const SMALL_MIN: Pt = [6, 0.66];
const LARGE_MIN: Pt = [8, 0.4];

// ---- Catmull-Rom smoothing through the anchors ---------------------------
function smoothPath(anchors: Pt[], samples = 26): string {
  const p = anchors.map(([L, r]) => [X(L), Y(r)] as [number, number]);
  const n = p.length;
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = p[Math.max(0, i - 1)];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[Math.min(n - 1, i + 2)];
    for (let s = 1; s <= samples; s++) {
      const t = s / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      d += `L${x.toFixed(1)},${y.toFixed(1)}`;
    }
  }
  return d;
}

const rawPath = smoothPath(RAW);
const smallPath = smoothPath(SMALL);
const largePath = smoothPath(LARGE);

const Y_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2];
const X_TICKS = [5, 6, 7, 8, 9];

// end-of-curve label rows (right of the plot)
const smallEndY = Y(SMALL[4][1]);
const largeEndY = Y(LARGE[4][1]);
const rawEndY = Y(RAW[4][1]);

export default function AdjustedRateUCurves() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      <svg viewBox="0 0 780 470" fontFamily="system-ui, sans-serif" fontSize="13">
        {/* ---- axes ---- */}
        <line x1={X0} y1={Y_BOT} x2={X1} y2={Y_BOT} stroke="currentColor" strokeWidth="1.5" />
        <line x1={X0} y1={Y_BOT} x2={X0} y2={Y_TOP} stroke="currentColor" strokeWidth="1.5" />

        {/* y ticks */}
        {Y_TICKS.map((r) => (
          <g key={`y${r}`}>
            <line x1={X0 - 6} y1={Y(r)} x2={X0} y2={Y(r)} stroke="currentColor" strokeWidth="1" />
            <text x={X0 - 10} y={Y(r) + 4} textAnchor="end" fill="currentColor" opacity="0.55" fontSize="11.5">
              {r.toFixed(1)}
            </text>
          </g>
        ))}
        {/* y axis title (rotated) */}
        <text
          transform={`rotate(-90 26 ${(Y_TOP + Y_BOT) / 2})`}
          x={26}
          y={(Y_TOP + Y_BOT) / 2}
          textAnchor="middle"
          fill="currentColor"
          opacity="0.7"
          fontSize="12.5"
        >
          compression rate (compressed / raw)
        </text>

        {/* x ticks: powers of ten */}
        {X_TICKS.map((L) => (
          <g key={`x${L}`}>
            <line x1={X(L)} y1={Y_BOT} x2={X(L)} y2={Y_BOT + 6} stroke="currentColor" strokeWidth="1" />
            <text x={X(L)} y={Y_BOT + 20} textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
              10
              <tspan dy="-5" fontSize="9">
                {L}
              </tspan>
            </text>
          </g>
        ))}
        <text x={(X0 + X1) / 2} y={Y_BOT + 44} textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="12.5">
          model size (parameters, log scale)
        </text>

        {/* ---- "no compression" guide at rate 1.0 ---- */}
        <line
          x1={X0}
          y1={Y(1.0)}
          x2={X1}
          y2={Y(1.0)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="5 4"
          opacity="0.4"
        />
        <text x={X1 - 6} y={Y(1.0) - 6} textAnchor="end" fill="currentColor" opacity="0.5" fontSize="11.5" fontStyle="italic">
          rate = 1.0 · no compression
        </text>

        {/* ---- raw rate curve (muted, dashed) ---- */}
        <path
          d={rawPath}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="2"
          strokeDasharray="6 5"
          strokeLinecap="round"
        />

        {/* ---- small-dataset adjusted curve (blue) ---- */}
        <path d={smallPath} fill="none" stroke={SUPPORT} strokeWidth="2.3" strokeLinecap="round" />

        {/* ---- large-dataset adjusted curve (amber, subject) ---- */}
        <path d={largePath} fill="none" stroke={ACCENT} strokeWidth="2.8" strokeLinecap="round" />

        {/* ---- minima + connecting arrow ---- */}
        <defs>
          <marker id="arc-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" opacity="0.55" />
          </marker>
        </defs>
        <path
          d={`M${X(SMALL_MIN[0]) + 8},${Y(SMALL_MIN[1]) + 6} Q${(X(SMALL_MIN[0]) + X(LARGE_MIN[0])) / 2},${
            Y(SMALL_MIN[1]) + 46
          } ${X(LARGE_MIN[0]) - 8},${Y(LARGE_MIN[1]) - 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.55"
          markerEnd="url(#arc-arrow)"
        />
        <circle cx={X(SMALL_MIN[0])} cy={Y(SMALL_MIN[1])} r="4.5" fill={SUPPORT} />
        <circle cx={X(LARGE_MIN[0])} cy={Y(LARGE_MIN[1])} r="4.5" fill={ACCENT} />

        {/* arrow annotation (two lines, tucked in the blue–amber gap) */}
        <text
          x={345}
          y={212}
          textAnchor="middle"
          fill="currentColor"
          opacity="0.65"
          fontSize="11.5"
          fontStyle="italic"
        >
          optimal model size
          <tspan x={345} dy="15">
            grows with the dataset
          </tspan>
        </text>

        {/* ---- curve end labels (right of plot) ---- */}
        <text x={X1 + 8} y={smallEndY + 4} textAnchor="start" fill={SUPPORT} fontWeight="600" fontSize="12">
          adjusted,
          <tspan x={X1 + 8} dy="15">
            small dataset
          </tspan>
        </text>
        <text x={X1 + 8} y={largeEndY + 4} textAnchor="start" fill={ACCENT} fontWeight="600" fontSize="12">
          adjusted,
          <tspan x={X1 + 8} dy="15">
            large dataset
          </tspan>
        </text>
        <text x={X1 + 8} y={rawEndY + 4} textAnchor="start" fill="currentColor" opacity="0.6" fontSize="12">
          raw rate
          <tspan x={X1 + 8} dy="15">
            (model bits uncharged)
          </tspan>
        </text>
      </svg>
    </div>
  );
}
