import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * PolyFitTally — FigureSequence, 4 frames. One fixed scatter of n=10 points
 * around a gentle parabola; each frame overlays a different polynomial
 * candidate and prices it in a two-bar description-length tally:
 *   L(H)   (amber) = model bits — cost of the candidate's coefficients
 *   L(D|H) (blue)  = fit bits   — cost of the residuals given the candidate
 * Only the candidate curve, the blue residual sticks, and the tally change.
 *
 *   frame 1  degree 0 — a constant     L(H) 8,  L(D|H) 70, total 78
 *   frame 2  degree 2 — matches trend  L(H) 24, L(D|H) 26, total 50 (MDL min)
 *   frame 3  degree 9 — interpolation  L(H) 80, L(D|H) 0,  total 80
 *   frame 4  totals compared: three total bars 78 / 50 / 80, deg-2 = MDL choice
 *
 * Color roles: amber = candidate / model bits; blue = fit / residual bits;
 * currentColor = data points and axes. One idea: as the candidate grows
 * richer, fit bits fall while model bits climb, and the smallest total sits
 * in the middle. Inspiration: Grünwald, MDL tutorial fig. 1.1 (§1.2),
 * polynomial-regression example (recreated, not copied).
 */

const W = 760;
const HGT = 380;

// ── left x–y plot ────────────────────────────────────────────────────────
const PX0 = 68; // x = 0
const PSX = 33; // px per x-unit (x 0..10 → 68..398)
const PY_BOT = 322; // y = 1
const PSY = 67; // px per y-unit (y 1..5 → 322..54)
const plotX = (x: number) => PX0 + x * PSX;
const plotY = (y: number) => PY_BOT - (y - 1) * PSY;

// 10 data points scattered around y = 0.08x² − 0.6x + 3, x = 0.5 … 9.5
const DATA: [number, number][] = [
  [0.5, 2.97],
  [1.5, 1.98],
  [2.5, 2.35],
  [3.5, 1.68],
  [4.5, 2.22],
  [5.5, 1.84],
  [6.5, 2.7],
  [7.5, 2.75],
  [8.5, 3.88],
  [9.5, 4.3],
];
const MEAN = 2.667; // data mean → the degree-0 constant
const parabola = (x: number) => 0.08 * x * x - 0.6 * x + 3;

// polyline path sampling a function across the plotted x-range
function funcPath(f: (x: number) => number, x0 = 0.2, x1 = 9.8, step = 0.2) {
  let d = `M ${plotX(x0).toFixed(1)} ${plotY(f(x0)).toFixed(1)}`;
  for (let x = x0 + step; x <= x1 + 1e-9; x += step) {
    d += ` L ${plotX(x).toFixed(1)} ${plotY(f(x)).toFixed(1)}`;
  }
  return d;
}

// Catmull-Rom smooth curve THROUGH the data points (the degree-9 interpolant),
// tension k>1 exaggerates the between-point wiggle (Runge-like oscillation).
function interpPath(k = 1.5) {
  const p: [number, number][] = DATA.map(([x, y]) => [plotX(x), plotY(y)]);
  let d = `M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p[i + 1];
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * k;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * k;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * k;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * k;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// ── right two-bar tally ──────────────────────────────────────────────────
const BAR_X0 = 486; // bits = 0
const PPB = 2.32; // px per bit (0..90 → 486..695)
const bitX = (b: number) => BAR_X0 + b * PPB;
const BAR_H = 34;
const TOP_BAR_Y = 118; // L(H)   amber
const BOT_BAR_Y = 164; // L(D|H) blue
const AXIS_Y = 222;

type Frame = {
  header: string;
  degree: string;
  LH: number;
  LDH: number;
  total: number;
  bold?: boolean;
  curve: "const" | "parabola" | "interp";
  residuals: boolean;
};

const FRAMES: Frame[] = [
  { header: "degree 0 — a constant", degree: "k = 0", LH: 8, LDH: 70, total: 78, curve: "const", residuals: true },
  { header: "degree 2 — matches the trend", degree: "k = 2", LH: 24, LDH: 26, total: 50, bold: true, curve: "parabola", residuals: true },
  { header: "degree 9 — interpolation", degree: "k = 9", LH: 80, LDH: 0, total: 80, curve: "interp", residuals: false },
  { header: "the totals compared", degree: "", LH: 0, LDH: 0, total: 0, curve: "parabola", residuals: false },
];

// frame-4 comparison bars
const TOTALS = [
  { label: "degree 0", total: 78, choice: false },
  { label: "degree 2", total: 50, choice: true },
  { label: "degree 9", total: 80, choice: false },
];

function Lbl({
  x,
  y,
  children,
  anchor = "l",
  style,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "l" | "c" | "r";
  style?: CSSProperties;
}) {
  const transform =
    anchor === "c" ? "translate(-50%, -50%)" : anchor === "r" ? "translate(-100%, -50%)" : "translateY(-50%)";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform,
        whiteSpace: "nowrap",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function PolyFitTally({ frame = 1 }: { frame?: number }) {
  const fr = FRAMES[Math.min(Math.max(frame, 1), FRAMES.length) - 1];
  const isCompare = frame === 4;
  const plotOpacity = isCompare ? 0.32 : 1;

  const curveY = (x: number) => (fr.curve === "const" ? MEAN : parabola(x));
  const curvePath =
    fr.curve === "const"
      ? `M ${plotX(0.2).toFixed(1)} ${plotY(MEAN).toFixed(1)} L ${plotX(9.8).toFixed(1)} ${plotY(MEAN).toFixed(1)}`
      : fr.curve === "interp"
        ? interpPath()
        : funcPath(parabola);

  return (
    <div style={{ position: "relative", width: W, height: HGT, fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* ── LEFT: x–y plot ── */}
        <g opacity={plotOpacity}>
          {/* axes (no gridlines) */}
          <line x1={plotX(0)} y1={PY_BOT} x2={plotX(10)} y2={PY_BOT} stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
          <line x1={plotX(0)} y1={PY_BOT} x2={plotX(0)} y2={plotY(5.2)} stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
          <text x={plotX(10) - 2} y={PY_BOT + 20} textAnchor="end" fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
            x
          </text>
          <text x={plotX(0) - 10} y={plotY(5.2) + 4} textAnchor="end" fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
            y
          </text>

          {/* candidate curve (amber) — drawn under the dots */}
          <path d={curvePath} fill="none" stroke={ACCENT} strokeWidth="2.4" opacity={isCompare ? 0.7 : 0.95} strokeLinejoin="round" strokeLinecap="round" />

          {/* residual sticks (blue), point → curve */}
          {fr.residuals &&
            DATA.map(([x, y], i) => (
              <line
                key={`r${i}`}
                x1={plotX(x)}
                y1={plotY(y)}
                x2={plotX(x)}
                y2={plotY(curveY(x))}
                stroke={SUPPORT}
                strokeWidth="1.6"
                opacity="0.85"
              />
            ))}

          {/* data points (currentColor) */}
          {DATA.map(([x, y], i) => (
            <circle key={`d${i}`} cx={plotX(x)} cy={plotY(y)} r="4" fill="currentColor" />
          ))}
        </g>

        {/* ── RIGHT ── */}
        {!isCompare ? (
          <>
            {/* two-bar tally */}
            <rect x={BAR_X0} y={TOP_BAR_Y} width={Math.max(fr.LH * PPB, 0)} height={BAR_H} fill={ACCENT} opacity="0.9" rx="2" />
            <rect x={BAR_X0} y={BOT_BAR_Y} width={Math.max(fr.LDH * PPB, 0)} height={BAR_H} fill={SUPPORT} opacity="0.9" rx="2" />

            {/* shared bits axis 0..90 */}
            <line x1={BAR_X0} y1={AXIS_Y} x2={bitX(90)} y2={AXIS_Y} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            {[0, 30, 60, 90].map((b) => (
              <g key={b}>
                <line x1={bitX(b)} y1={AXIS_Y} x2={bitX(b)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <text x={bitX(b)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
                  {b}
                </text>
              </g>
            ))}
            <text x={bitX(90)} y={AXIS_Y + 18} textAnchor="start" fontSize="11" fill="currentColor" opacity="0.55" fontStyle="italic" dx="8">
              bits
            </text>
          </>
        ) : (
          <>
            {/* frame 4: three total bars */}
            {TOTALS.map((t, i) => {
              const y = 96 + i * 46;
              return (
                <g key={t.label}>
                  <rect
                    x={BAR_X0}
                    y={y}
                    width={t.total * PPB}
                    height={30}
                    fill={t.choice ? ACCENT : "currentColor"}
                    opacity={t.choice ? 0.92 : 0.32}
                    rx="2"
                  />
                  <text x={bitX(t.total) + 8} y={y + 20} textAnchor="start" fontSize="13" fontWeight={t.choice ? 700 : 500} fill={t.choice ? ACCENT : "currentColor"} opacity={t.choice ? 1 : 0.7}>
                    {t.total} bits
                  </text>
                </g>
              );
            })}
            {/* shared bits axis */}
            <line x1={BAR_X0} y1={238} x2={bitX(90)} y2={238} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            {[0, 30, 60, 90].map((b) => (
              <g key={b}>
                <line x1={bitX(b)} y1={238} x2={bitX(b)} y2={243} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                <text x={bitX(b)} y={256} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
                  {b}
                </text>
              </g>
            ))}
            <text x={bitX(90)} y={256} textAnchor="start" fontSize="11" fill="currentColor" opacity="0.55" fontStyle="italic" dx="8">
              bits
            </text>
          </>
        )}
      </svg>

      {/* ── header ── */}
      <Lbl x={W / 2} y={20} anchor="c" style={{ fontSize: 15, fontWeight: 600 }}>
        {fr.header}
      </Lbl>

      {/* ── legend under the header (roles) ── */}
      {!isCompare && (
        <Lbl x={plotX(0)} y={44} style={{ fontSize: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 14, height: 4, background: ACCENT, display: "inline-block" }} />
              <span style={{ opacity: 0.8 }}>candidate</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 3, height: 12, background: SUPPORT, display: "inline-block" }} />
              <span style={{ opacity: 0.8 }}>residual</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              <span style={{ opacity: 0.8 }}>data</span>
            </span>
          </span>
        </Lbl>
      )}

      {!isCompare ? (
        <>
          {/* bar labels (left of the bars) */}
          <Lbl x={BAR_X0 - 12} y={TOP_BAR_Y + BAR_H / 2} anchor="r" style={{ color: ACCENT, textAlign: "right", lineHeight: 1.15 }}>
            <div>
              <M tex={String.raw`\textcolor{${ACCENT}}{L(H)}`} size={13} />
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.7 }}>model bits</div>
          </Lbl>
          <Lbl x={BAR_X0 - 12} y={BOT_BAR_Y + BAR_H / 2} anchor="r" style={{ color: SUPPORT, textAlign: "right", lineHeight: 1.15 }}>
            <div>
              <M tex={String.raw`\textcolor{${SUPPORT}}{L(D \mid H)}`} size={13} />
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.7 }}>fit bits</div>
          </Lbl>

          {/* bar value readouts (right of the bar end) */}
          <Lbl x={bitX(fr.LH) + 8} y={TOP_BAR_Y + BAR_H / 2} style={{ color: ACCENT, fontWeight: 600, fontSize: 13 }}>
            {"≈ "}
            {fr.LH}
          </Lbl>
          <Lbl x={bitX(fr.LDH) + 8} y={BOT_BAR_Y + BAR_H / 2} style={{ color: SUPPORT, fontWeight: 600, fontSize: 13 }}>
            {"≈ "}
            {fr.LDH}
          </Lbl>

          {/* total beneath the axis */}
          <Lbl x={BAR_X0 - 12} y={AXIS_Y + 42} style={{ fontSize: fr.bold ? 15 : 14, fontWeight: fr.bold ? 700 : 500 }}>
            total {"≈ "}
            {fr.total} bits
          </Lbl>
        </>
      ) : (
        <>
          {/* frame-4 bar row labels */}
          {TOTALS.map((t, i) => {
            const y = 96 + i * 46 + 15;
            return (
              <Lbl key={t.label} x={BAR_X0 - 12} y={y} anchor="r" style={{ color: t.choice ? ACCENT : "currentColor", opacity: t.choice ? 1 : 0.75, fontWeight: t.choice ? 600 : 500 }}>
                {t.label}
              </Lbl>
            );
          })}
          {/* MDL-choice tag on the degree-2 bar */}
          <Lbl x={bitX(50) + 70} y={96 + 46 + 15} style={{ color: ACCENT, fontStyle: "italic", fontSize: 12, fontWeight: 600 }}>
            ← MDL choice
          </Lbl>
          <Lbl x={W / 2 + 40} y={AXIS_Y + 68} anchor="c" style={{ fontSize: 12.5, opacity: 0.7, fontStyle: "italic" }}>
            smallest total wins: the middle candidate
          </Lbl>
        </>
      )}
    </div>
  );
}
