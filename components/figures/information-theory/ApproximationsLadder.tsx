import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * ApproximationsLadder — Shannon's F_N ladder for the 27-symbol alphabet as a
 * horizontal bar chart on one shared bits axis (0 … 5). One idea: each rung of
 * conditioning buys bits.
 *
 *   F_0    = 4.76  nothing — 27 equiprobable symbols   (= log2 27)
 *   F_1    = 4.03  letter frequencies
 *   F_2    = 3.32  1 preceding letter (digrams)
 *   F_3    = 3.10  2 preceding letters (trigrams)
 *   F_word = 2.14  word frequencies (Zipf)
 *   F_100  ≈ 0.6–1.3  guessing game (Shannon 1951 §6) — a shaded blue band
 *
 * Amber bars are the subject (the descending measured rungs); the blue band is
 * the second role — the guessing-game asymptote, previewed here from the later
 * section. Numbers from Shannon 1951 §2 and §6.
 */

const W = 620;
const H = 292;

const X0 = 222; // bits = 0 (bar origin; labels sit to its left)
const BARW = 320; // pixels for the full 5-bit axis
const AXMAX = 5;
const bx = (bits: number) => X0 + (bits / AXMAX) * BARW;
const X5 = bx(AXMAX);

const BAR_H = 24;
const ROWS = [
  { y: 30, sym: String.raw`F_0`, desc: "nothing — 27 equiprobable symbols", val: 4.76 },
  { y: 68, sym: String.raw`F_1`, desc: "letter frequencies", val: 4.03 },
  { y: 106, sym: String.raw`F_2`, desc: "1 preceding letter", val: 3.32 },
  { y: 144, sym: String.raw`F_3`, desc: "2 preceding letters", val: 3.1 },
  { y: 182, sym: String.raw`F_{\text{word}}`, desc: "word frequencies (Zipf)", val: 2.14 },
];
const BAND_Y = 220;
const BAND_LO = 0.6;
const BAND_HI = 1.3;
const AXIS_Y = BAND_Y + BAR_H + 22;

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

/** Faint full-width reference track (0 … 5 bits) behind each row. */
function Track({ y }: { y: number }) {
  return (
    <rect
      x={X0}
      y={y}
      width={BARW}
      height={BAR_H}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.22"
    />
  );
}

export default function ApproximationsLadder() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      <div style={{ position: "relative", width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <pattern
              id="ladderBand"
              width="6"
              height="6"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke={SUPPORT} strokeWidth="1.2" strokeOpacity="0.7" />
            </pattern>
          </defs>

          {/* ── amber measured rungs ── */}
          {ROWS.map((r) => (
            <g key={r.sym}>
              <Track y={r.y} />
              <rect x={X0} y={r.y} width={bx(r.val) - X0} height={BAR_H} fill={ACCENT} opacity="0.9" />
            </g>
          ))}

          {/* ── F_100 guessing-game band (blue, translucent + hatched) ── */}
          <Track y={BAND_Y} />
          <rect
            x={bx(BAND_LO)}
            y={BAND_Y}
            width={bx(BAND_HI) - bx(BAND_LO)}
            height={BAR_H}
            fill={SUPPORT}
            opacity="0.18"
          />
          <rect
            x={bx(BAND_LO)}
            y={BAND_Y}
            width={bx(BAND_HI) - bx(BAND_LO)}
            height={BAR_H}
            fill="url(#ladderBand)"
          />
          <rect
            x={bx(BAND_LO)}
            y={BAND_Y}
            width={bx(BAND_HI) - bx(BAND_LO)}
            height={BAR_H}
            fill="none"
            stroke={SUPPORT}
            strokeWidth="1.2"
            strokeOpacity="0.85"
          />

          {/* ── bits axis, ticks 0 … 5 ── */}
          <line x1={X0} y1={AXIS_Y} x2={X5} y2={AXIS_Y} stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
          {[0, 1, 2, 3, 4, 5].map((b) => (
            <line
              key={b}
              x1={bx(b)}
              y1={AXIS_Y}
              x2={bx(b)}
              y2={AXIS_Y + 5}
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
          ))}
        </svg>

        {/* ── left labels: symbol (color-bound to its bar) + muted description ── */}
        {ROWS.map((r) => (
          <Lbl key={r.sym} x={8} y={r.y + BAR_H / 2} middle>
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <M tex={String.raw`\textcolor{${ACCENT}}{${r.sym}}`} size={15} />
              <span style={{ ...labelMuted, fontSize: 11 }}>{r.desc}</span>
            </div>
          </Lbl>
        ))}
        <Lbl x={8} y={BAND_Y + BAR_H / 2} middle>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <M tex={String.raw`\textcolor{${SUPPORT}}{F_{100}}`} size={15} />
            <span style={{ ...labelMuted, fontSize: 11 }}>guessing game (Shannon 1951)</span>
          </div>
        </Lbl>

        {/* ── values at each bar's right end ── */}
        {ROWS.map((r) => (
          <Lbl key={r.sym} x={bx(r.val) + 8} y={r.y + BAR_H / 2} middle style={{ color: ACCENT, fontWeight: 600 }}>
            {r.val.toFixed(2)}
            <span style={{ ...labelMuted, fontWeight: 400, color: "inherit", marginLeft: 3 }}>bits</span>
          </Lbl>
        ))}
        <Lbl
          x={bx(BAND_HI) + 8}
          y={BAND_Y + BAR_H / 2}
          middle
          style={{ color: SUPPORT, fontWeight: 600 }}
        >
          0.6&ndash;1.3
          <span style={{ ...labelMuted, fontWeight: 400, color: "inherit", marginLeft: 3 }}>bits</span>
        </Lbl>

        {/* ── axis tick numbers ── */}
        {[0, 1, 2, 3, 4].map((b) => (
          <Lbl key={b} x={bx(b)} y={AXIS_Y + 8} anchor="c" style={{ ...labelMuted }}>
            {b}
          </Lbl>
        ))}
        <Lbl x={bx(5)} y={AXIS_Y + 8} anchor="c" style={{ ...labelMuted }}>
          5 bits
        </Lbl>
      </div>

      <div style={{ ...labelMuted, marginTop: 6, maxWidth: W }}>
        every added rung of statistical structure lowers the per-letter entropy — from{" "}
        <b style={{ color: ACCENT, opacity: 0.9 }}>4.76 bits</b> of raw alphabet down toward the{" "}
        <b style={{ color: SUPPORT }}>guessing-game</b> estimate
      </div>
    </div>
  );
}
