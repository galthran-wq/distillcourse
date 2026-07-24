import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * SelfExtractingArchive — the bound K(x) ≤ ℓ_C(x) + c_C.
 *
 * One row: the bundled program p_x drawn as an outer container holding a
 * fixed blue decoder block (D, c_C bits) followed by the amber compressed
 * payload (z = C(x), ℓ_C(x) bits); an arrow from the container to the
 * output x. A bracket under both inner boxes carries the length accounting
 * ℓ(p_x) = ℓ_C(x) + c_C ⇒ K_U(x) ≤ ℓ_C(x) + c_C.
 *
 * One idea: every compressed file, bundled with its decoder, is a program
 * that prints x — hence an upper bound on K. blue = the fixed decoder code
 * (same role as the interpreter in InterpreterOverhead); amber = the
 * per-file compressed payload (the subject).
 */

const W = 564;
const HGT = 182;

const OUT_X = 26; // outer container
const OUT_Y = 40;
const PAD = 10;
const BOX_H = 44;
const BLUE_W = 158;
const AMBER_W = 218;
const OUT_W = PAD + BLUE_W + 8 + AMBER_W + PAD;
const OUT_H = BOX_H + 2 * PAD;

const BLUE_X = OUT_X + PAD;
const AMBER_X = BLUE_X + BLUE_W + 8;
const BOX_Y = OUT_Y + PAD;
const CY = BOX_Y + BOX_H / 2;

const OUT_END = OUT_X + OUT_W;
const ARROW_GAP = 8;
const ARROW_LEN = 34;
const X_OUT = OUT_END + ARROW_GAP + ARROW_LEN + 10;

const BR_Y = OUT_Y + OUT_H + 8; // bracket under the two inner boxes

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

export default function SelfExtractingArchive() {
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
        {/* ── outer container: the single program p_x ── */}
        <rect
          x={OUT_X}
          y={OUT_Y}
          width={OUT_W}
          height={OUT_H}
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeOpacity="0.55"
        />

        {/* ── fixed decoder block (blue) ── */}
        <rect x={BLUE_X} y={BOX_Y} width={BLUE_W} height={BOX_H} rx="6" fill={SUPPORT} opacity="0.16" />
        <rect x={BLUE_X} y={BOX_Y} width={BLUE_W} height={BOX_H} rx="6" fill="none" stroke={SUPPORT} strokeWidth="1.5" />

        {/* ── compressed payload (amber) ── */}
        <rect x={AMBER_X} y={BOX_Y} width={AMBER_W} height={BOX_H} rx="6" fill={ACCENT} opacity="0.16" />
        <rect x={AMBER_X} y={BOX_Y} width={AMBER_W} height={BOX_H} rx="6" fill="none" stroke={ACCENT} strokeWidth="1.5" />

        {/* ── run arrow: program → output x ── */}
        <line
          x1={OUT_END + ARROW_GAP}
          y1={CY}
          x2={X_OUT - 10}
          y2={CY}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeOpacity="0.7"
        />
        <path
          d={`M ${X_OUT - 15} ${CY - 3} L ${X_OUT - 10} ${CY} L ${X_OUT - 15} ${CY + 3}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeOpacity="0.7"
        />

        {/* ── bracket spanning decoder + payload ── */}
        <path
          d={`M ${BLUE_X} ${BR_Y} L ${BLUE_X} ${BR_Y + 6} L ${AMBER_X + AMBER_W} ${BR_Y + 6} L ${AMBER_X + AMBER_W} ${BR_Y}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <path
          d={`M ${(BLUE_X + AMBER_X + AMBER_W) / 2} ${BR_Y + 6} L ${(BLUE_X + AMBER_X + AMBER_W) / 2} ${BR_Y + 12}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
      </svg>

      {/* ── container label ── */}
      <Lbl x={OUT_X} y={OUT_Y - 22} anchor="l" style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>
        one program <M tex="p_x" size={13} /> — a self-extracting archive
      </Lbl>

      {/* ── decoder block contents ── */}
      <Lbl
        x={BLUE_X + BLUE_W / 2}
        y={BOX_Y + 6}
        anchor="c"
        style={{ width: BLUE_W - 14, whiteSpace: "normal", textAlign: "center", lineHeight: 1.2 }}
      >
        <div style={{ color: SUPPORT, fontSize: 12, fontWeight: 600 }}>
          decoder <M tex={String.raw`\textcolor{${SUPPORT}}{D}`} size={12} />
        </div>
        <div style={{ ...labelMuted, fontSize: 10.5 }}>
          code, <M tex={String.raw`\textcolor{${SUPPORT}}{c_C}`} size={10.5} /> bits, fixed
        </div>
      </Lbl>

      {/* ── payload block contents ── */}
      <Lbl
        x={AMBER_X + AMBER_W / 2}
        y={BOX_Y + 6}
        anchor="c"
        style={{ width: AMBER_W - 14, whiteSpace: "normal", textAlign: "center", lineHeight: 1.2 }}
      >
        <div style={{ marginBottom: 1 }}>
          <M tex={String.raw`\textcolor{${ACCENT}}{z = C(x)}`} size={13.5} />
        </div>
        <div style={{ ...labelMuted, fontSize: 10.5 }}>
          compressed data, <M tex={String.raw`\textcolor{${ACCENT}}{\ell_C(x)}`} size={10.5} /> bits
        </div>
      </Lbl>

      {/* ── output ── */}
      <Lbl
        x={X_OUT}
        y={CY}
        style={{ transform: "translateY(-50%)", fontFamily: "ui-monospace, monospace", fontSize: 15, fontWeight: 600 }}
      >
        x
      </Lbl>
      <Lbl x={OUT_END + ARROW_GAP + ARROW_LEN / 2} y={CY - 22} anchor="c" style={{ ...labelMuted, fontSize: 10.5 }}>
        run
      </Lbl>

      {/* ── bracket label: the length accounting ── */}
      <Lbl x={(BLUE_X + AMBER_X + AMBER_W) / 2} y={BR_Y + 16} anchor="c" style={{ fontSize: 13 }}>
        <M
          tex={String.raw`\ell(p_x) = \textcolor{${ACCENT}}{\ell_C(x)} + \textcolor{${SUPPORT}}{c_C} \;\;\Rightarrow\;\; K_U(x) \le \textcolor{${ACCENT}}{\ell_C(x)} + \textcolor{${SUPPORT}}{c_C}`}
        />
      </Lbl>

      {/* ── payoff ── */}
      <Lbl x={W / 2} y={HGT - 18} anchor="c" style={{ ...labelMuted, fontSize: 12.5, textAlign: "center" }}>
        every compressed file, bundled with its decoder, is a program that prints <M tex="x" size={12.5} />
      </Lbl>
    </div>
  );
}
