import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * CorrelationBlindSpot — the linear shadow vs the whole dependence.
 *
 * Left: a scatter of the joint (X uniform on {-1,0,1}, Y = X^2) — three amber
 * points at (-1,1), (0,0), (1,1), each carrying probability 1/3, lying on a
 * faint currentColor parabola y = x^2. The rose flat dashed line at y = 2/3 is
 * everything the best linear fit sees: slope 0. Right: a two-row tally —
 * corr(X,Y) = 0 (rose, "sees nothing") vs I(X;Y) = 0.918 bits (amber, "sees
 * the coupling").
 *
 * Color roles: amber = the actual dependence (the points) and the MI value;
 * warning rose = the misleading corr = 0 verdict and the slope-0 fit; currentColor
 * = axes and the parabola guide.
 *
 * One idea: correlation is a linear shadow of the dependence; mutual information
 * reads the whole joint.
 */

const WARN = "#d1495b"; // warning rose: what correlation (mis)sees

// data window
const X_MIN = -1.4;
const X_MAX = 1.4;
const Y_MIN = -0.3;
const Y_MAX = 1.3;

// plot pixel box inside the svg
const L = 46;
const R = 226;
const T = 18;
const B = 168;

const sx = (dx: number) => L + ((dx - X_MIN) / (X_MAX - X_MIN)) * (R - L);
const sy = (dy: number) => T + ((Y_MAX - dy) / (Y_MAX - Y_MIN)) * (B - T);

const FIT_Y = 2 / 3; // best linear fit height (slope 0)

const DOTS: [number, number][] = [
  [-1, 1],
  [0, 0],
  [1, 1],
];

// parabola y = x^2, clipped to the visible y range
const paraPts: string[] = [];
for (let dx = -1.14; dx <= 1.141; dx += 0.05) {
  paraPts.push(`${sx(dx).toFixed(1)} ${sy(dx * dx).toFixed(1)}`);
}
const paraPath = `M ${paraPts.join(" L ")}`;

function TallyRow({
  color,
  tex,
  gloss,
}: {
  color: string;
  tex: string;
  gloss: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <M tex={tex} />
      <span style={{ color, opacity: 0.8, fontStyle: "italic", fontSize: 12.5 }}>
        {gloss}
      </span>
    </div>
  );
}

export default function CorrelationBlindSpot() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 30,
        flexWrap: "wrap",
        maxWidth: 620,
      }}
    >
      {/* left: scatter */}
      <svg viewBox="0 0 250 200" width="270" aria-hidden="true">
        {/* axes */}
        <line
          x1={L}
          y1={sy(0)}
          x2={R + 10}
          y2={sy(0)}
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.5"
        />
        <line
          x1={sx(0)}
          y1={B + 4}
          x2={sx(0)}
          y2={T - 6}
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.5"
        />
        {/* axis arrowheads */}
        <path
          d={`M ${R + 10} ${sy(0)} l -5 -2.6 l 0 5.2 Z`}
          fill="currentColor"
          opacity="0.5"
        />
        <path
          d={`M ${sx(0)} ${T - 6} l -2.6 5 l 5.2 0 Z`}
          fill="currentColor"
          opacity="0.5"
        />
        <text
          x={R + 8}
          y={sy(0) + 16}
          fontSize="12"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.55"
          textAnchor="end"
        >
          X
        </text>
        <text
          x={sx(0) + 9}
          y={T + 1}
          fontSize="12"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.55"
        >
          Y
        </text>

        {/* x ticks at -1, 1 ; y tick at 1 */}
        {[-1, 1].map((v) => (
          <g key={`xt${v}`}>
            <line
              x1={sx(v)}
              y1={sy(0)}
              x2={sx(v)}
              y2={sy(0) + 4}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.5"
            />
            <text
              x={sx(v)}
              y={sy(0) + 16}
              fontSize="10.5"
              fill="currentColor"
              opacity="0.55"
              textAnchor="middle"
            >
              {v}
            </text>
          </g>
        ))}
        <line
          x1={sx(0) - 4}
          y1={sy(1)}
          x2={sx(0)}
          y2={sy(1)}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <text
          x={sx(0) - 7}
          y={sy(1) + 3.5}
          fontSize="10.5"
          fill="currentColor"
          opacity="0.55"
          textAnchor="end"
        >
          1
        </text>

        {/* parabola guide: the true coupling y = x^2 */}
        <path
          d={paraPath}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.45"
        />

        {/* best linear fit: flat, slope 0 — all correlation sees */}
        <line
          x1={sx(X_MIN)}
          y1={sy(FIT_Y)}
          x2={sx(X_MAX)}
          y2={sy(FIT_Y)}
          stroke={WARN}
          strokeWidth="1.6"
          strokeDasharray="5 4"
        />
        <text
          x={sx(0)}
          y={sy(FIT_Y) - 8}
          fontSize="10.5"
          fill={WARN}
          textAnchor="middle"
        >
          best linear fit: slope 0
        </text>

        {/* the joint: three amber points, each with probability 1/3 */}
        {DOTS.map(([dx, dy]) => (
          <circle
            key={`${dx},${dy}`}
            cx={sx(dx)}
            cy={sy(dy)}
            r="5.5"
            fill={ACCENT}
          />
        ))}
        {/* probability labels */}
        <text
          x={sx(-1) - 9}
          y={sy(1) - 8}
          fontSize="11"
          fill={ACCENT}
          textAnchor="middle"
        >
          1/3
        </text>
        <text
          x={sx(1) + 9}
          y={sy(1) - 8}
          fontSize="11"
          fill={ACCENT}
          textAnchor="middle"
        >
          1/3
        </text>
        <text
          x={sx(0) + 15}
          y={sy(0) + 4}
          fontSize="11"
          fill={ACCENT}
          textAnchor="middle"
        >
          1/3
        </text>
      </svg>

      {/* right: the tally */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <TallyRow
          color={WARN}
          tex={String.raw`\textcolor{${WARN}}{\operatorname{corr}(X,Y) = 0}`}
          gloss="sees nothing"
        />
        <TallyRow
          color={ACCENT}
          tex={String.raw`\textcolor{${ACCENT}}{I(X;Y) = 0.918\ \text{bits}}`}
          gloss="sees the coupling"
        />
      </div>
    </div>
  );
}
