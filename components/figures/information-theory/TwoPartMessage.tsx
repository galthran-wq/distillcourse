import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * TwoPartMessage — the literal two-part bitstream, two candidate messages for
 * the SAME string x_3 (carried from the opening figure), laid out on one shared
 * bits axis (0–25):
 *
 *   candidate 1 — literal code:  one currentColor bar of 24 bits verbatim
 *                                → total 24.0 bits
 *   candidate 2 — Bernoulli count code:
 *        amber  L(H)   = model  : k = 6            (5 bits)
 *        blue   L(D|H) = data given model : index among C(24,6)  (17.0 bits)
 *                                → total 22.0 bits   ← shorter
 *
 * Colors bind to the two-part split: amber = model bits, blue =
 * data-given-model bits, currentColor = the literal bar / axis / text.
 *
 * One idea: model selection is choosing the shorter total message.
 */

const W = 630;
const HGT = 246;

const X0 = 50; // bits = 0
const PPB = 20; // px per bit
const xOf = (v: number) => X0 + v * PPB;

const KBITS = 5; // model bits: k in [0,24] -> ceil(log2 25) = 5
const DBITS = 17; // data|model bits: log2 C(24,6) = 17.04 -> 17
const XK = xOf(KBITS); // amber/blue seam
const XD = xOf(KBITS + DBITS); // candidate-2 bar end (= 22)
const XLIT = xOf(24); // candidate-1 bar end (= 24)

const BAR_H = 38;
const ROW1_LBL = 8;
const BAR_Y1 = 30;
const BAR1_BOT = BAR_Y1 + BAR_H;
const ROW2_LBL = 86;
const BAR_Y2 = 108;
const BAR2_BOT = BAR_Y2 + BAR_H;
const AXIS_Y = 190;
const GLOSS_Y = 222;

const TICKS = [0, 5, 10, 15, 20, 24];

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

export default function TwoPartMessage() {
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
        {/* shared-scale guides: faint verticals at each tick, spanning both rows */}
        {TICKS.map((v) => (
          <line
            key={`g${v}`}
            x1={xOf(v)}
            y1={BAR_Y1}
            x2={xOf(v)}
            y2={AXIS_Y}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.08"
          />
        ))}

        {/* ── candidate 1: one literal currentColor bar (0..24) ── */}
        <rect x={X0} y={BAR_Y1} width={XLIT - X0} height={BAR_H} fill="currentColor" opacity="0.13" />
        <rect
          x={X0}
          y={BAR_Y1}
          width={XLIT - X0}
          height={BAR_H}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.5"
        />

        {/* ── candidate 2: amber model bits (0..5) + blue data|model bits (5..22) ── */}
        <rect x={X0} y={BAR_Y2} width={XK - X0} height={BAR_H} fill={ACCENT} opacity="0.92" />
        <rect x={XK} y={BAR_Y2} width={XD - XK} height={BAR_H} fill={SUPPORT} opacity="0.85" />
        {/* whole-bar hairline + seam */}
        <rect
          x={X0}
          y={BAR_Y2}
          width={XD - X0}
          height={BAR_H}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        <line x1={XK} y1={BAR_Y2} x2={XK} y2={BAR2_BOT} stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />

        {/* leaders from each candidate-2 segment down to its label */}
        <line x1={(X0 + XK) / 2} y1={BAR2_BOT} x2={(X0 + XK) / 2} y2={BAR2_BOT + 8} stroke={ACCENT} strokeWidth="1" strokeOpacity="0.8" />
        <line x1={(XK + XD) / 2} y1={BAR2_BOT} x2={(XK + XD) / 2} y2={BAR2_BOT + 8} stroke={SUPPORT} strokeWidth="1" strokeOpacity="0.8" />

        {/* ── shared bits axis ── */}
        <line x1={xOf(0)} y1={AXIS_Y} x2={xOf(25)} y2={AXIS_Y} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        {TICKS.map((v) => (
          <g key={`t${v}`}>
            <line x1={xOf(v)} y1={AXIS_Y} x2={xOf(v)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <text x={xOf(v)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {v}
            </text>
          </g>
        ))}
        <text x={xOf(25) + 8} y={AXIS_Y + 4} fontSize="11" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits
        </text>
      </svg>

      {/* ── candidate 1 row label + inside label + total ── */}
      <Lbl x={X0} y={ROW1_LBL} style={{ fontWeight: 600 }}>
        candidate 1 — literal code
      </Lbl>
      <Lbl x={(X0 + XLIT) / 2} y={BAR_Y1 + 11} anchor="c" style={{ fontSize: 12.5, opacity: 0.85 }}>
        data: the 24 bits verbatim
      </Lbl>
      <Lbl x={XLIT + 12} y={BAR_Y1 + 11} style={{ fontWeight: 600 }}>
        24.0 bits
      </Lbl>

      {/* ── candidate 2 row label + total + shorter tag ── */}
      <Lbl x={X0} y={ROW2_LBL} style={{ fontWeight: 600 }}>
        candidate 2 — Bernoulli count code
      </Lbl>
      <Lbl x={XD + 12} y={BAR_Y2 + 11} style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontWeight: 600 }}>22.0 bits</span>
        <span
          style={{
            fontSize: 10.5,
            color: ACCENT,
            border: `1px solid ${ACCENT}`,
            borderRadius: 4,
            padding: "1px 5px",
            fontWeight: 600,
          }}
        >
          shorter
        </span>
      </Lbl>

      {/* ── candidate 2 segment labels, below the bar, color-bound ── */}
      <Lbl x={(X0 + XK) / 2} y={BAR2_BOT + 10} anchor="c" style={{ color: ACCENT, fontSize: 12 }}>
        model: <M tex={String.raw`\textcolor{${ACCENT}}{k = 6}`} size={12} /> (5 bits)
      </Lbl>
      <Lbl x={(XK + XD) / 2} y={BAR2_BOT + 10} anchor="c" style={{ color: SUPPORT, fontSize: 12 }}>
        data given model: index among <M tex={String.raw`\textcolor{${SUPPORT}}{\binom{24}{6}}`} size={12} /> (17.0 bits)
      </Lbl>

      {/* ── gloss line ── */}
      <Lbl x={W / 2} y={GLOSS_Y} anchor="c" style={{ ...labelMuted, opacity: 1, fontSize: 12.5 }}>
        same string <M tex="x_3" size={12} />, two messages; MDL sends the shorter one
      </Lbl>
    </div>
  );
}
