import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * InterpreterOverhead — the invariance theorem for Kolmogorov complexity.
 *
 * Two rows share one horizontal length axis (bits), left-aligned at a common
 * origin. Row 1 (language B): the shortest B-program p* for x, of length
 * K_B(x), producing x. Row 2 (language A): the SAME amber program p* run
 * behind a fixed blue interpreter block (c_AB bits, written once) — so it too
 * produces x, at a total length K_B(x) + c_AB, which upper-bounds K_A(x).
 *
 * One idea: switching languages = prepending one fixed interpreter, so the two
 * complexities differ by at most a constant that does not depend on x.
 * amber = the program reused unchanged; blue = the fixed interpreter block.
 * (Research FIGURE PLAN item 2; inspiration Shen et al. ch.1 / Cover §14.2.)
 */

const W = 564;
const HGT = 240;

const X0 = 120; // shared origin (length = 0)
const AMBER_W = 196; // represents K_B(x)
const BLUE_W = 150; // represents c_AB
const BOX_H = 40;

const Y1 = 46; // row 1 box top (language B)
const Y2 = 124; // row 2 box top (language A)
const CY1 = Y1 + BOX_H / 2;
const CY2 = Y2 + BOX_H / 2;

const AMBER_END1 = X0 + AMBER_W; // row 1 program end
const BLUE_END2 = X0 + BLUE_W; // row 2 interpreter end / amber start
const AMBER_END2 = BLUE_END2 + AMBER_W; // row 2 program end

const ARROW_GAP = 8;
const ARROW_LEN = 30;
const X_ROW1 = AMBER_END1 + ARROW_GAP + ARROW_LEN + 10;
const X_ROW2 = AMBER_END2 + ARROW_GAP + ARROW_LEN + 10;

const AXIS_Y = 18;
const BR_Y = Y2 + BOX_H + 6; // bracket top, under row 2

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

/** thin flow arrow: box edge -> output string x */
function Arrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.7" />
      <path
        d={`M ${x2 - 5} ${y - 3} L ${x2} ${y} L ${x2 - 5} ${y + 3}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeOpacity="0.7"
      />
    </>
  );
}

/** the reused program box (amber) — identical in both rows */
function amberBoxLabel(boxX: number, topY: number) {
  return (
    <Lbl
      x={boxX + AMBER_W / 2}
      y={topY}
      anchor="c"
      style={{ width: AMBER_W - 14, whiteSpace: "normal", textAlign: "center", lineHeight: 1.2 }}
    >
      <div style={{ marginBottom: 1 }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{p^{*}}`} size={16} />
      </div>
      <div style={{ ...labelMuted, fontSize: 10.5, fontStyle: "italic" }}>
        shortest B-program for <M tex="x" size={10.5} />
      </div>
    </Lbl>
  );
}

export default function InterpreterOverhead() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: HGT,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        maxWidth: "100%",
      }}
    >
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* ── shared length axis (top) + common origin guide ── */}
        <line x1={X0} y1={AXIS_Y} x2={AMBER_END2} y2={AXIS_Y} stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path
          d={`M ${AMBER_END2 - 5} ${AXIS_Y - 3} L ${AMBER_END2} ${AXIS_Y} L ${AMBER_END2 - 5} ${AXIS_Y + 3}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.4"
        />
        <line
          x1={X0}
          y1={AXIS_Y}
          x2={X0}
          y2={Y2 + BOX_H + 2}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.22"
          strokeDasharray="3 3"
        />

        {/* ── row 1: language B — the amber program alone ── */}
        <rect x={X0} y={Y1} width={AMBER_W} height={BOX_H} rx="6" fill={ACCENT} opacity="0.16" />
        <rect x={X0} y={Y1} width={AMBER_W} height={BOX_H} rx="6" fill="none" stroke={ACCENT} strokeWidth="1.5" />
        <Arrow x1={AMBER_END1 + ARROW_GAP} x2={X_ROW1 - 10} y={CY1} />

        {/* ── row 2: language A — fixed interpreter, then the SAME amber program ── */}
        <rect x={X0} y={Y2} width={BLUE_W} height={BOX_H} rx="6" fill={SUPPORT} opacity="0.16" />
        <rect x={X0} y={Y2} width={BLUE_W} height={BOX_H} rx="6" fill="none" stroke={SUPPORT} strokeWidth="1.5" />
        <rect x={BLUE_END2} y={Y2} width={AMBER_W} height={BOX_H} rx="6" fill={ACCENT} opacity="0.16" />
        <rect x={BLUE_END2} y={Y2} width={AMBER_W} height={BOX_H} rx="6" fill="none" stroke={ACCENT} strokeWidth="1.5" />
        <Arrow x1={AMBER_END2 + ARROW_GAP} x2={X_ROW2 - 10} y={CY2} />

        {/* ── bracket spanning the whole row-2 program (interpreter + program) ── */}
        <path
          d={`M ${X0} ${BR_Y} L ${X0} ${BR_Y + 6} L ${AMBER_END2} ${BR_Y + 6} L ${AMBER_END2} ${BR_Y}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <path
          d={`M ${(X0 + AMBER_END2) / 2} ${BR_Y + 6} L ${(X0 + AMBER_END2) / 2} ${BR_Y + 12}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
      </svg>

      {/* ── axis caption ── */}
      <Lbl x={X0} y={AXIS_Y - 20} anchor="l" style={{ ...labelMuted, fontSize: 11, fontStyle: "italic" }}>
        program length (bits) →
      </Lbl>

      {/* ── row labels ── */}
      <Lbl x={X0 - 12} y={CY1} anchor="r" style={{ transform: "translate(-100%,-50%)", fontWeight: 600, opacity: 0.85 }}>
        language B
      </Lbl>
      <Lbl x={X0 - 12} y={CY2} anchor="r" style={{ transform: "translate(-100%,-50%)", fontWeight: 600, opacity: 0.85 }}>
        language A
      </Lbl>

      {/* ── box contents ── */}
      {amberBoxLabel(X0, Y1 + 4)}
      {amberBoxLabel(BLUE_END2, Y2 + 4)}
      <Lbl
        x={X0 + BLUE_W / 2}
        y={Y2 + 4}
        anchor="c"
        style={{ width: BLUE_W - 14, whiteSpace: "normal", textAlign: "center", lineHeight: 1.2 }}
      >
        <div style={{ color: SUPPORT, fontSize: 11.5, fontWeight: 600 }}>interpreter for B</div>
        <div style={{ ...labelMuted, fontSize: 10 }}>
          <M tex={String.raw`\textcolor{${SUPPORT}}{c_{AB}}`} size={10.5} /> bits, written once
        </div>
      </Lbl>

      {/* ── row-1 length annotation, under its box ── */}
      <Lbl x={(X0 + AMBER_END1) / 2} y={Y1 + BOX_H + 6} anchor="c" style={{ ...labelMuted, fontSize: 12 }}>
        <M tex={String.raw`\ell = \textcolor{${ACCENT}}{K_B(x)}`} size={12} />
      </Lbl>

      {/* ── output strings ── */}
      <Lbl x={X_ROW1} y={CY1} style={{ transform: "translateY(-50%)", fontFamily: "ui-monospace, monospace", fontSize: 15, fontWeight: 600 }}>
        x
      </Lbl>
      <Lbl x={X_ROW2} y={CY2} style={{ transform: "translateY(-50%)", fontFamily: "ui-monospace, monospace", fontSize: 15, fontWeight: 600 }}>
        x
      </Lbl>

      {/* ── bracket label: the invariance inequality ── */}
      <Lbl x={(X0 + AMBER_END2) / 2} y={BR_Y + 16} anchor="c" style={{ fontSize: 13 }}>
        <M
          tex={String.raw`K_A(x) \;\le\; \textcolor{${ACCENT}}{K_B(x)} + \textcolor{${SUPPORT}}{c_{AB}}`}
        />
      </Lbl>

      {/* ── payoff ── */}
      <Lbl x={W / 2} y={HGT - 20} anchor="c" style={{ ...labelMuted, fontSize: 12.5, textAlign: "center" }}>
        the language costs at most one interpreter — a constant independent of <M tex="x" size={12.5} />
      </Lbl>
    </div>
  );
}
