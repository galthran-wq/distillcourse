import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * CompressionCeilingLadder — description lengths of one fixed 10^6-character
 * English text under three real (computable) compressors, stacked as
 * descending horizontal bars on a shared 0–8 Mbit axis, above a dashed amber
 * outline marking the uncomputable Kolmogorov floor K(x) + c.
 *
 *   raw ASCII                       8.0 Mbit   (currentColor rung)
 *   gzip                          ≈ 2.6 Mbit   (currentColor rung)
 *   language model + arith. coder ≈ 1.0 Mbit   (blue — best computable rung)
 *   K(x) + c                      ≈ 0.9 Mbit   (amber dashed floor outline)
 *
 * Amber = the uncomputable floor (the subject); currentColor = the computable
 * rungs; blue = the strongest computable entry (LM). A double-headed arrow on
 * the right reads the ladder as descending program families.
 *
 * One idea: every real compressor is an upper bound sliding down toward one
 * uncomputable limit. Inspiration: Delétang et al. §2 "Universal Coding".
 */

const W = 760;
const H = 250;

const X0 = 188; // bits = 0 (bar origin; row labels sit to its left)
const AXW = 300; // pixels for the full 8-Mbit axis
const AXMAX = 8e6;
const bx = (bits: number) => X0 + (bits / AXMAX) * AXW;

const BAR_H = 26;
const ROW0 = 30;
const ROW_STEP = 44;
const rowY = (i: number) => ROW0 + i * ROW_STEP;

const FLOOR_ROW = 3;
const FLOOR_V = 0.9e6;
const FLOOR_X = bx(FLOOR_V);

const AXIS_Y = rowY(FLOOR_ROW) + BAR_H + 22;

const ARROW_X = 578; // vertical double-headed arrow (right of value labels)
const ARR_TOP = rowY(0) + 1;
const ARR_BOT = rowY(2) + BAR_H - 1;

type Rung = { label: string; v: number; text: string; blue?: boolean };
const RUNGS: Rung[] = [
  { label: "raw ASCII", v: 8.0e6, text: "8.0 Mbit" },
  { label: "gzip", v: 2.6e6, text: "≈ 2.6 Mbit" },
  { label: "language model + arithmetic coder", v: 1.0e6, text: "≈ 1.0 Mbit", blue: true },
];

const TICKS = [0, 2e6, 4e6, 6e6, 8e6];
const tickText = (v: number) => (v === 0 ? "0" : `${v / 1e6}M`);

function Lbl({
  x,
  y,
  children,
  anchor = "l",
  middle = false,
  style,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "l" | "c" | "r";
  middle?: boolean;
  style?: CSSProperties;
}) {
  const tx = anchor === "c" ? "translateX(-50%)" : anchor === "r" ? "translateX(-100%)" : "";
  const ty = middle ? "translateY(-50%)" : "";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `${tx} ${ty}`.trim() || undefined,
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

export default function CompressionCeilingLadder() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {/* faint reference track (0 … 8 Mbit) behind each rung */}
          {RUNGS.map((r, i) => (
            <rect
              key={`t${r.label}`}
              x={X0}
              y={rowY(i)}
              width={AXW}
              height={BAR_H}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.09"
            />
          ))}

          {/* the computable rungs */}
          {RUNGS.map((r, i) => (
            <rect
              key={r.label}
              x={X0}
              y={rowY(i)}
              width={bx(r.v) - X0}
              height={BAR_H}
              rx="3"
              fill={r.blue ? SUPPORT : "currentColor"}
              opacity={r.blue ? 0.85 : 0.32}
            />
          ))}

          {/* amber floor projected up under every rung (faint dashed guide) */}
          <line
            x1={FLOOR_X}
            y1={rowY(0) - 6}
            x2={FLOOR_X}
            y2={rowY(FLOOR_ROW) + BAR_H}
            stroke={ACCENT}
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.55"
          />

          {/* the uncomputable floor: dashed amber bar outline, right edge = K(x)+c */}
          <rect
            x={X0}
            y={rowY(FLOOR_ROW)}
            width={FLOOR_X - X0}
            height={BAR_H}
            rx="3"
            fill={ACCENT}
            fillOpacity="0.08"
            stroke={ACCENT}
            strokeWidth="1.6"
            strokeDasharray="5 4"
          />

          {/* bits axis, ticks 0 … 8 Mbit */}
          <line
            x1={X0}
            y1={AXIS_Y}
            x2={bx(AXMAX)}
            y2={AXIS_Y}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
          {TICKS.map((v) => (
            <line
              key={v}
              x1={bx(v)}
              y1={AXIS_Y}
              x2={bx(v)}
              y2={AXIS_Y + 5}
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
          ))}

          {/* right-side vertical double-headed arrow spanning the computable rungs */}
          <line
            x1={ARROW_X}
            y1={ARR_TOP + 5}
            x2={ARROW_X}
            y2={ARR_BOT - 5}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeOpacity="0.6"
          />
          <path
            d={`M ${ARROW_X} ${ARR_TOP} l -4 7 l 8 0 z`}
            fill="currentColor"
            opacity="0.6"
          />
          <path
            d={`M ${ARROW_X} ${ARR_BOT} l -4 -7 l 8 0 z`}
            fill="currentColor"
            opacity="0.6"
          />
        </svg>

        {/* left rung labels (color-bound to their bar) */}
        {RUNGS.map((r, i) => (
          <div
            key={r.label}
            style={{
              position: "absolute",
              left: 0,
              top: rowY(i),
              width: X0 - 14,
              height: BAR_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              textAlign: "right",
              lineHeight: 1.12,
              fontSize: 12.5,
              color: r.blue ? SUPPORT : undefined,
              fontWeight: r.blue ? 600 : 400,
            }}
          >
            {r.label}
          </div>
        ))}

        {/* values at each rung's right end */}
        {RUNGS.map((r, i) => (
          <Lbl
            key={r.label}
            x={bx(r.v) + 8}
            y={rowY(i) + BAR_H / 2}
            middle
            style={{ color: r.blue ? SUPPORT : "currentColor", fontWeight: 600, fontSize: 12.5 }}
          >
            {r.text}
          </Lbl>
        ))}

        {/* floor label (amber): K(x)+c — uncomputable floor under every rung */}
        <Lbl x={FLOOR_X + 12} y={rowY(FLOOR_ROW) + BAR_H / 2} middle style={{ color: ACCENT }}>
          <M tex={String.raw`\textcolor{${ACCENT}}{K(x) + c}`} size={14} />
          <span style={{ marginLeft: 6, fontSize: 12.5 }}>
            — uncomputable floor under every rung
          </span>
        </Lbl>

        {/* axis tick numbers */}
        {TICKS.map((v) => (
          <Lbl key={v} x={bx(v)} y={AXIS_Y + 8} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>
            {tickText(v)}
          </Lbl>
        ))}
        <Lbl
          x={(X0 + bx(AXMAX)) / 2}
          y={AXIS_Y + 24}
          anchor="c"
          style={{ ...labelMuted, fontStyle: "italic", fontSize: 11.5 }}
        >
          description length (bits)
        </Lbl>

        {/* double-headed-arrow annotation */}
        <div
          style={{
            position: "absolute",
            left: ARROW_X + 12,
            top: (ARR_TOP + ARR_BOT) / 2,
            transform: "translateY(-50%)",
            width: W - ARROW_X - 20,
            ...labelMuted,
            fontSize: 12,
            lineHeight: 1.3,
          }}
        >
          each rung = one <b style={{ fontWeight: 600 }}>computable program family</b>; descending ={" "}
          <b style={{ fontWeight: 600 }}>better modeling</b>
        </div>
      </div>

      {/* footer: the prediction-side mirror of the floor */}
      <div style={{ ...labelMuted, marginTop: 4, maxWidth: W, fontSize: 12 }}>
        prediction-side mirror of the floor: Solomonoff&apos;s mixture{" "}
        <M tex="M" size={12} />
      </div>
    </div>
  );
}
