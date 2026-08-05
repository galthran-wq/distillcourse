import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * EntropySplitBar — the static twin of the MutualInfoDial demo's stacked-bar
 * view. One bar of total length H(X) = 1 bit (the weather "sky" variable) is
 * split by observing Y into two segments:
 *   amber  I(X;Y)  = 0.311  — the information REMOVED by observing Y (subject)
 *   blue   H(X|Y)  = 0.689  — the conditional entropy LEFT OVER
 * A bracket above spans the whole bar (H(X) = 1 bit, currentColor = the total);
 * the identity H(X) = I(X;Y) + H(X|Y) sits below with each term colored to its
 * segment. Numbers carried from the joint-and-conditional-entropy lesson.
 *
 * One idea: observing Y carves I(X;Y) bits out of H(X).
 */

const W = 560;
const HGT = 214;
const X0 = 66; // bar start (bits = 0)
const BARW = 428; // 1 bit
const X1 = X0 + BARW; // bar end
const I = 0.311; // mutual information
const XB = X0 + I * BARW; // amber/blue seam

const BRACKET_Y = 40;
const BAR_Y = 56;
const BAR_H = 46;
const BAR_BOT = BAR_Y + BAR_H;

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

export default function EntropySplitBar() {
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
        {/* ── bracket over the whole bar: the total H(X) ── */}
        <path
          d={`M ${X0} ${BRACKET_Y + 6} L ${X0} ${BRACKET_Y} L ${X1} ${BRACKET_Y} L ${X1} ${BRACKET_Y + 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <path
          d={`M ${(X0 + X1) / 2} ${BRACKET_Y} L ${(X0 + X1) / 2} ${BRACKET_Y - 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />

        {/* ── the bar: amber (removed) + blue (left over) ── */}
        <rect x={X0} y={BAR_Y} width={XB - X0} height={BAR_H} fill={ACCENT} opacity="0.9" />
        <rect x={XB} y={BAR_Y} width={X1 - XB} height={BAR_H} fill={SUPPORT} opacity="0.85" />
        {/* hairline outline of the whole bar for definition */}
        <rect
          x={X0}
          y={BAR_Y}
          width={BARW}
          height={BAR_H}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        {/* seam accent */}
        <line
          x1={XB}
          y1={BAR_Y}
          x2={XB}
          y2={BAR_BOT}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
      </svg>

      {/* ── bracket label: the total, currentColor ── */}
      <Lbl x={(X0 + X1) / 2} y={6} anchor="c" style={{ fontSize: 14 }}>
        <M tex={String.raw`H(X) = 1\ \text{bit}`} />
      </Lbl>

      {/* ── segment value labels, below the bar, color-bound ── */}
      <Lbl x={(X0 + XB) / 2} y={BAR_BOT + 10} anchor="c" style={{ color: ACCENT }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{I(X;Y) = 0.311}`} />
      </Lbl>
      <Lbl x={(X0 + XB) / 2} y={BAR_BOT + 32} anchor="c" style={{ color: ACCENT, fontSize: 12, fontStyle: "italic" }}>
        removed by observing Y
      </Lbl>

      <Lbl x={(XB + X1) / 2} y={BAR_BOT + 10} anchor="c" style={{ color: SUPPORT }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{H(X\mid Y) = 0.689}`} />
      </Lbl>
      <Lbl x={(XB + X1) / 2} y={BAR_BOT + 32} anchor="c" style={{ ...labelMuted, color: SUPPORT, opacity: 1, fontSize: 12, fontStyle: "italic" }}>
        left over
      </Lbl>

      {/* ── the identity, terms colored to their segments ── */}
      <Lbl x={W / 2} y={HGT - 34} anchor="c" style={{ fontSize: 15 }}>
        <M
          tex={String.raw`H(X) \;=\; \textcolor{${ACCENT}}{I(X;Y)} \;+\; \textcolor{${SUPPORT}}{H(X\mid Y)}`}
        />
      </Lbl>
    </div>
  );
}
