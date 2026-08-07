import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * RegularVsSingular — why (k/2) log2 n does not apply to a neural network.
 *
 * Two panels of the same size, same axes, same four contour levels, same
 * stroke weights: only the SHAPE of the log-likelihood's maximum changes.
 *   left  "regular":  concentric ellipses around one amber dot θ̂, the
 *                     innermost one measured (width ∝ 1/√n) — an isolated
 *                     quadratic peak, Fisher matrix invertible, price
 *                     (k/2) log2 n.
 *   right "singular": the same contours stretched along an amber curve of
 *                     maxima — the best fit is a set, the Fisher matrix is
 *                     degenerate, and the price is λ log2 n with λ ≤ k/2.
 *
 * Color roles: amber = the optimum (a point on the left, a curve on the
 * right); blue = the log-likelihood contours; currentColor = axes, the
 * measurement arrow and all text.
 *
 * One idea: the parameter price was derived from an isolated peak, and a
 * neural network does not have one.
 */

// ---------------------------------------------------------------- geometry
const VB_W = 288;
const VB_H = 212;
const AX_X = 30; // y axis
const AX_Y = 190; // x axis
const PLOT_R = 268; // right edge of the plotting area
const PLOT_T = 12; // top edge

/** Four levels, identical in both panels: same count, same weights. */
const LEVEL_OPACITY = [0.95, 0.75, 0.58, 0.44];
const STROKE = 1.5;

// left panel: concentric ellipses ------------------------------------------
const CX = 118;
const CY = 98;
const ROT = -25;
const RADII: Array<[number, number]> = [
  [19, 11],
  [38, 22],
  [57, 35],
  [76, 48],
];
/** horizontal half-extent of the innermost, tilted ellipse (the measured width) */
const INNER_HALF_W = Math.hypot(
  RADII[0][0] * Math.cos((ROT * Math.PI) / 180),
  RADII[0][1] * Math.sin((ROT * Math.PI) / 180),
);

// right panel: contours offset from a curve of maxima ----------------------
const P0: [number, number] = [-100, 250];
const P1: [number, number] = [143, 30];
const P2: [number, number] = [390, 20];

const bez = (t: number): [number, number] => [
  (1 - t) ** 2 * P0[0] + 2 * t * (1 - t) * P1[0] + t ** 2 * P2[0],
  (1 - t) ** 2 * P0[1] + 2 * t * (1 - t) * P1[1] + t ** 2 * P2[1],
];
const normal = (t: number): [number, number] => {
  const dx = 2 * ((1 - t) * (P1[0] - P0[0]) + t * (P2[0] - P1[0]));
  const dy = 2 * ((1 - t) * (P1[1] - P0[1]) + t * (P2[1] - P1[1]));
  const len = Math.hypot(dx, dy);
  return [-dy / len, dx / len]; // unit normal, pointing down-right
};

const NS = 72;
/** the offset curve at signed distance d from the ridge, sampled and clipped */
const offsetPath = (d: number) =>
  Array.from({ length: NS + 1 }, (_, i) => {
    const t = 0.08 + (i / NS) * 0.86;
    const [x, y] = bez(t);
    const [nx, ny] = normal(t);
    return `${i ? "L" : "M"}${(x + d * nx).toFixed(1)},${(y + d * ny).toFixed(1)}`;
  }).join(" ");

const RIDGE = `M${P0[0]},${P0[1]} Q${P1[0]},${P1[1]} ${P2[0]},${P2[1]}`;
const LEVELS = [10, 20, 31, 43];

// ------------------------------------------------------------------ pieces
function Label({
  px,
  py,
  children,
  color = "currentColor",
  align = "center",
  size = 12,
  weight = 600,
  opacity = 1,
  halo = false,
}: {
  px: number;
  py: number;
  children: React.ReactNode;
  color?: string;
  align?: "left" | "center" | "right";
  size?: number;
  weight?: number;
  opacity?: number;
  halo?: boolean;
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
        left: `${(px / VB_W) * 100}%`,
        top: `${(py / VB_H) * 100}%`,
        transform,
        color,
        opacity,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.25,
        textAlign: align,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        textShadow: halo
          ? "0 0 4px var(--paper), 0 0 4px var(--paper), 0 0 2px var(--paper)"
          : undefined,
      }}
    >
      {children}
    </div>
  );
}

function Axes({ id }: { id: string }) {
  return (
    <>
      <clipPath id={`${id}-clip`}>
        <rect x={AX_X} y={PLOT_T} width={PLOT_R - AX_X} height={AX_Y - PLOT_T} />
      </clipPath>
      <line
        x1={AX_X}
        y1={PLOT_T}
        x2={AX_X}
        y2={AX_Y}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.6"
      />
      <line
        x1={AX_X}
        y1={AX_Y}
        x2={PLOT_R}
        y2={AX_Y}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.6"
      />
    </>
  );
}

function RegularPlot() {
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: "100%", height: "auto" }} aria-hidden="true">
        <defs>
          <marker id="rvs-tip" markerWidth="8" markerHeight="8" refX="6.4" refY="4" orient="auto">
            <path
              d="M1.4 1.4 L6.6 4 L1.4 6.6"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.75"
              strokeWidth="1.3"
            />
          </marker>
          {/* mirrored twin: orient="auto" would aim the start marker along the
              path, i.e. inwards — a double-headed arrow needs it flipped */}
          <marker id="rvs-tip-start" markerWidth="8" markerHeight="8" refX="1.6" refY="4" orient="auto">
            <path
              d="M6.6 1.4 L1.4 4 L6.6 6.6"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.75"
              strokeWidth="1.3"
            />
          </marker>
        </defs>
        <Axes id="rvs-reg" />

        <g clipPath="url(#rvs-reg-clip)">
          {RADII.map(([rx, ry], i) => (
            <ellipse
              key={rx}
              cx={CX}
              cy={CY}
              rx={rx}
              ry={ry}
              transform={`rotate(${ROT} ${CX} ${CY})`}
              fill="none"
              stroke={SUPPORT}
              strokeWidth={STROKE}
              strokeOpacity={LEVEL_OPACITY[i]}
            />
          ))}
        </g>

        {/* the measured width of the innermost contour */}
        <line
          x1={CX - INNER_HALF_W}
          y1={CY}
          x2={CX + INNER_HALF_W}
          y2={CY}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeOpacity="0.8"
          markerStart="url(#rvs-tip-start)"
          markerEnd="url(#rvs-tip)"
        />
        <line
          x1={CX + INNER_HALF_W + 4}
          y1={CY}
          x2={192}
          y2={CY}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.32"
          strokeDasharray="2 3"
        />

        {/* the single maximum */}
        <line x1={CX + 8} y1={CY - 7} x2={146} y2={72} stroke={ACCENT} strokeWidth="0.9" strokeOpacity="0.45" />
        <circle cx={CX} cy={CY} r="5" fill={ACCENT} />
      </svg>

      <Label px={150} py={66} color={ACCENT} align="left" size={13} halo>
        <M tex={String.raw`\hat\theta`} size={13} />
      </Label>
      <Label px={196} py={CY} align="left" size={11.5} weight={500} opacity={0.85} halo>
        width
        <br />
        <M tex={String.raw`\propto 1/\sqrt{n}`} size={11.5} />
      </Label>
      <Label px={PLOT_R - 6} py={AX_Y + 15} align="right" size={12} weight={500} opacity={0.6}>
        <M tex={String.raw`\theta_1`} size={12} />
      </Label>
      <Label px={AX_X - 12} py={PLOT_T + 8} align="right" size={12} weight={500} opacity={0.6}>
        <M tex={String.raw`\theta_2`} size={12} />
      </Label>
    </div>
  );
}

function SingularPlot() {
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: "100%", height: "auto" }} aria-hidden="true">
        <Axes id="rvs-sing" />

        <g clipPath="url(#rvs-sing-clip)">
          {LEVELS.map((d, i) => (
            <g key={d} stroke={SUPPORT} strokeWidth={STROKE} strokeOpacity={LEVEL_OPACITY[i]} fill="none">
              <path d={offsetPath(d)} />
              <path d={offsetPath(-d)} />
            </g>
          ))}
          {/* the curve of maxima: every point on it fits equally well */}
          <path d={RIDGE} fill="none" stroke={ACCENT} strokeWidth="2.6" strokeLinecap="round" />
        </g>
      </svg>

      <Label px={PLOT_R - 6} py={AX_Y + 15} align="right" size={12} weight={500} opacity={0.6}>
        <M tex={String.raw`\theta_1`} size={12} />
      </Label>
      <Label px={AX_X - 12} py={PLOT_T + 8} align="right" size={12} weight={500} opacity={0.6}>
        <M tex={String.raw`\theta_2`} size={12} />
      </Label>
    </div>
  );
}

function Panel({
  title,
  plot,
  gloss,
  price,
}: {
  title: string;
  plot: React.ReactNode;
  gloss: React.ReactNode;
  price: React.ReactNode;
}) {
  return (
    <div style={{ flex: "1 1 300px", maxWidth: 320, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontWeight: 700, fontSize: 15, textAlign: "center" }}>{title}</div>
      {plot}
      <div
        style={{
          color: ACCENT,
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
          minHeight: 30,
          lineHeight: 1.3,
          padding: "0 6px",
        }}
      >
        {gloss}
      </div>
      <div
        style={{
          border: "1px solid",
          borderColor: "color-mix(in srgb, currentColor 32%, transparent)",
          borderRadius: 5,
          padding: "8px 10px",
          fontSize: 12,
          textAlign: "center",
          lineHeight: 1.6,
          minHeight: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span>{price}</span>
      </div>
    </div>
  );
}

export default function RegularVsSingular() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        maxWidth: 700,
        margin: "0 auto",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        gap: 22,
        flexWrap: "wrap",
      }}
    >
      <Panel
        title="regular"
        plot={<RegularPlot />}
        gloss={
          <>
            one best-fitting parameter:
            <br />a point
          </>
        }
        price={
          <>
            Fisher matrix <b>invertible</b>
            <br />
            <span style={{ opacity: 0.5 }}>→</span> price{" "}
            <span style={{ whiteSpace: "nowrap" }}>
              <M tex={String.raw`\tfrac{k}{2}\log_2 n`} size={12.5} />
            </span>
          </>
        }
      />
      <Panel
        title="singular"
        plot={<SingularPlot />}
        gloss={
          <>
            a set of best-fitting parameters,
            <br />
            not a point
          </>
        }
        price={
          <>
            Fisher matrix <b>degenerate</b>
            <br />
            <span style={{ opacity: 0.5 }}>→</span> price{" "}
            <span style={{ whiteSpace: "nowrap" }}>
              <M tex={String.raw`\lambda\log_2 n`} size={12.5} />
            </span>
            ,{" "}
            <span style={{ whiteSpace: "nowrap" }}>
              <M tex={String.raw`\lambda \le k/2`} size={12.5} />
            </span>
          </>
        }
      />
    </div>
  );
}
