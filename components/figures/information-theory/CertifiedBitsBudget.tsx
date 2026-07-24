import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * CertifiedBitsBudget — the InfoNCE bound dissected in place:
 *   I(X;Y) ≥ log2 N − L_N
 * Three labels sit above the formula with thin, color-matched arrows onto the
 * exact symbols:
 *   amber  I(X;Y)   — certified information, a floor not an estimate (subject)
 *   plain  log2 N   — the budget: bits to name 1 of N, what chance pays
 *   blue   L_N      — what the classifier pays
 * Below, one horizontal bar grounds the bound in the toy's N = 4 numbers: total
 * length log2 4 = 2 bits, split into an amber "certified" sliver (0.142) on the
 * left and the blue bill L_4 = 1.858 on the right; a dashed tick just right of
 * the amber segment marks the true I = 0.189, so the floor sits at or below it.
 *
 * One idea: certified bits = budget − bill, and it lands at or below the true I.
 */

const W = 600;
const HGT = 372;

// ── formula term anchors (centers) ──
const FY_TOP = 123; // top of formula glyphs (measured); arrow tips land here
const FY_MID = 150; // vertical center of the formula row
const xI = 138; // I(X;Y) center (measured)
const xLog = 350; // log2 N center (measured)
const xL = 508; // L_N center (measured)

// ── bar ──
const X0 = 96;
const PPB = 200; // px per bit
const xOf = (v: number) => X0 + v * PPB;
const CERT = 0.142;
const LOSS = 1.858;
const TRUE_I = 0.189;
const BAR_Y = 258;
const BAR_H = 40;
const BAR_BOT = BAR_Y + BAR_H;
const X_END = xOf(2); // 2 bits
const X_SEAM = xOf(CERT); // amber/blue seam
const X_TICK = xOf(TRUE_I);

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
    anchor === "c" ? "translateX(-50%)" : anchor === "r" ? "translateX(-100%)" : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** thin "this label names that symbol" arrow, color-matched to its label. */
function arrow(x1: number, y1: number, x2: number, y2: number) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = 5.5;
  const a1 = ang + Math.PI - 0.42;
  const a2 = ang + Math.PI + 0.42;
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1.1" />
      <path
        d={`M ${x2} ${y2} L ${x2 + h * Math.cos(a1)} ${y2 + h * Math.sin(a1)} M ${x2} ${y2} L ${x2 + h * Math.cos(a2)} ${y2 + h * Math.sin(a2)}`}
        strokeWidth="1.1"
        fill="none"
      />
    </>
  );
}

export default function CertifiedBitsBudget() {
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
        {/* ── thin label→symbol arrows onto exact glyphs (measured) ── */}
        <g stroke={ACCENT} opacity="0.85">
          {arrow(150, 90, xI, FY_TOP)}
        </g>
        <g stroke="currentColor" opacity="0.6">
          {arrow(326, 92, xLog, FY_TOP)}
        </g>
        <g stroke={SUPPORT} opacity="0.85">
          {arrow(476, 94, xL, FY_TOP)}
        </g>

        {/* ── grounding bar ── */}
        {/* bracket over the whole bar: the budget, log2 4 = 2 bits */}
        <path
          d={`M ${X0} ${BAR_Y - 10} L ${X0} ${BAR_Y - 16} L ${X_END} ${BAR_Y - 16} L ${X_END} ${BAR_Y - 10}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <path
          d={`M ${(X0 + X_END) / 2} ${BAR_Y - 16} L ${(X0 + X_END) / 2} ${BAR_Y - 22}`}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />

        {/* amber: certified sliver */}
        <rect x={X0} y={BAR_Y} width={X_SEAM - X0} height={BAR_H} fill={ACCENT} opacity="0.9" />
        {/* blue: the bill L_4 */}
        <rect x={X_SEAM} y={BAR_Y} width={X_END - X_SEAM} height={BAR_H} fill={SUPPORT} opacity="0.85" />
        {/* whole-bar hairline outline */}
        <rect
          x={X0}
          y={BAR_Y}
          width={X_END - X0}
          height={BAR_H}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.3"
        />

        {/* dashed true-I tick, just right of the amber seam */}
        <line
          x1={X_TICK}
          y1={BAR_Y - 8}
          x2={X_TICK}
          y2={BAR_BOT + 8}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeDasharray="4 3"
          opacity="0.75"
        />

        {/* leader from amber sliver down to its label */}
        <path
          d={`M ${(X0 + X_SEAM) / 2} ${BAR_BOT} L ${X0 + 4} ${BAR_BOT + 26}`}
          stroke={ACCENT}
          strokeWidth="1.1"
          fill="none"
          opacity="0.85"
        />
      </svg>

      {/* ── three labels above the formula ── */}
      <Lbl x={150} y={54} anchor="c" style={{ color: ACCENT, width: 150, textAlign: "center", lineHeight: 1.3 }}>
        certified information<br />
        <span style={{ opacity: 0.75, fontStyle: "italic", fontSize: 12 }}>a floor, not an estimate</span>
      </Lbl>
      <Lbl x={xLog} y={44} anchor="c" style={{ width: 210, textAlign: "center", lineHeight: 1.3 }}>
        the budget: bits to name 1 of N
        <br />
        <span style={{ ...labelMuted, opacity: 0.65, fontStyle: "italic", fontSize: 12 }}>what chance pays</span>
      </Lbl>
      <Lbl x={470} y={62} anchor="c" style={{ color: SUPPORT, width: 118, textAlign: "center", lineHeight: 1.3 }}>
        what the classifier pays
      </Lbl>

      {/* ── the bound, terms colored to their roles ── */}
      <Lbl x={W / 2} y={FY_MID} anchor="c" style={{ transform: "translate(-50%, -50%)", whiteSpace: "nowrap" }}>
        <M
          size={27}
          tex={String.raw`\textcolor{${ACCENT}}{I(X;Y)} \;\geq\; \log_2 N \;-\; \textcolor{${SUPPORT}}{L_N}`}
        />
      </Lbl>

      {/* ── bar bracket label: the budget ── */}
      <Lbl x={(X0 + X_END) / 2} y={BAR_Y - 46} anchor="c">
        <M tex={String.raw`\log_2 4 = 2\ \text{bits}`} size={13} />
      </Lbl>

      {/* ── blue bill label, centered below the blue segment (high contrast) ── */}
      <Lbl x={(X_SEAM + X_END) / 2} y={BAR_BOT + 10} anchor="c" style={{ color: SUPPORT }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{L_4 = 1.858}`} size={14} />
      </Lbl>

      {/* ── amber certified label, below-left with leader ── */}
      <Lbl x={X0 + 4} y={BAR_BOT + 26} anchor="l" style={{ color: ACCENT }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{\text{certified: } 0.142}`} size={13} />
      </Lbl>

      {/* ── true-I tick label ── */}
      <Lbl x={X_TICK} y={BAR_Y - 34} anchor="c" style={{ whiteSpace: "nowrap" }}>
        <M tex={String.raw`\text{true } I = 0.189`} size={12} />
      </Lbl>
    </div>
  );
}
