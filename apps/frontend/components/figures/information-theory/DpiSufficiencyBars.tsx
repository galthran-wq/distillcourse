import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, OK, labelMuted } from "../palette";

/**
 * DpiSufficiencyBars — the data-processing inequality's equality case as two
 * bar comparisons on one shared bits axis (0 … I(X;Y) = 0.811), playbook
 * rule 8 (twin panels on a shared scale).
 *
 *   Top    T  = merge b,c (lossy):  amber I(T;Y)  = 0.467 falls short of the
 *          dashed ceiling; the gap (0.344 bits) is hatched = information lost.
 *   Bottom T' = merge c,d (sufficient statistic): amber I(T';Y) = 0.811
 *          reaches the ceiling exactly — a green check accents the equality.
 *
 * A vertical dashed currentColor line at 0.811 marks the ceiling I(X;Y) across
 * both rows. Colors: amber = information about Y, green = the equality/accept
 * state, currentColor = ceiling + structure.
 *
 * One idea: equality in the DPI means nothing about Y was lost — and which
 * merge achieves it depends on where the Y-relevant distinction sits.
 */

const WHITE = "#fff";

const W = 560;
const HGT = 206;

const X0 = 66; // bits = 0
const CEIL = 0.811; // I(X;Y)
const BARW = 428; // pixels for the full ceiling
const X1 = X0 + BARW; // ceiling x
const bx = (bits: number) => X0 + (bits / CEIL) * BARW;

const I_T = 0.467; // I(T;Y), lossy merge
const XT = bx(I_T); // amber/hatch seam, top row

const BAR_H = 40;
const R1_Y = 44;
const R1_BOT = R1_Y + BAR_H;
const R2_Y = 120;
const R2_BOT = R2_Y + BAR_H;

const LINE_TOP = 38;
const LINE_BOT = R2_BOT + 6;
const AXIS_Y = 178;

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

/** One bar track: faint full-width outline (0 … ceiling) for the reference span. */
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
      strokeOpacity="0.3"
    />
  );
}

export default function DpiSufficiencyBars() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      <div style={{ position: "relative", width: W, height: HGT }}>
        <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
          <defs>
            <pattern
              id="dpiHatch"
              width="6"
              height="6"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* ── row 1: amber up to 0.467, hatched gap to the ceiling ── */}
          <Track y={R1_Y} />
          <rect x={X0} y={R1_Y} width={XT - X0} height={BAR_H} fill={ACCENT} opacity="0.9" />
          <rect x={XT} y={R1_Y} width={X1 - XT} height={BAR_H} fill="url(#dpiHatch)" />
          <line x1={XT} y1={R1_Y} x2={XT} y2={R1_BOT} stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />

          {/* ── row 2: amber reaches the ceiling exactly ── */}
          <Track y={R2_Y} />
          <rect x={X0} y={R2_Y} width={BARW} height={BAR_H} fill={ACCENT} opacity="0.9" />

          {/* green check accent on the equality, at the right end of the full bar */}
          <g>
            <circle cx={X1 - 20} cy={R2_Y + BAR_H / 2} r="10" fill={OK} />
            <path
              d={`M ${X1 - 25} ${R2_Y + BAR_H / 2} l 3.5 4 l 6.5 -8`}
              fill="none"
              stroke={WHITE}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ── the shared ceiling: dashed currentColor line across both rows ── */}
          <line
            x1={X1}
            y1={LINE_TOP}
            x2={X1}
            y2={LINE_BOT}
            stroke="currentColor"
            strokeWidth="1.3"
            strokeDasharray="4 3"
            strokeOpacity="0.7"
          />

          {/* ── bits axis ── */}
          <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
          {[0, I_T, CEIL].map((b) => (
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

        {/* ── ceiling label at the top of the dashed line ── */}
        <Lbl x={X1} y={6} anchor="c" style={{ color: "inherit", fontWeight: 600 }}>
          <M tex={String.raw`I(X;Y) = 0.811`} size={13} />
        </Lbl>

        {/* ── row 1 title + on-bar / gap labels ── */}
        <Lbl x={X0} y={R1_Y - 20} style={{ fontWeight: 600 }}>
          <b>T</b>: merge <b>b,c</b>{" "}
          <span style={{ ...labelMuted, opacity: 0.7 }}>(lossy)</span>
        </Lbl>
        <Lbl x={(X0 + XT) / 2} y={R1_Y + 11} anchor="c">
          <M tex={String.raw`\textcolor{${WHITE}}{I(T;Y) = 0.467}`} size={13} />
        </Lbl>
        <Lbl
          x={(XT + X1) / 2}
          y={R1_Y + 12}
          anchor="c"
          style={{ ...labelMuted, opacity: 0.75, fontStyle: "italic" }}
        >
          0.344 lost
        </Lbl>

        {/* ── row 2 title + on-bar label ── */}
        <Lbl x={X0} y={R2_Y - 20} style={{ fontWeight: 600 }}>
          <b>T&prime;</b>: merge <b>c,d</b>{" "}
          <span style={{ color: OK }}>(sufficient statistic)</span>
        </Lbl>
        <Lbl x={(X0 + (X1 - 34)) / 2} y={R2_Y + 11} anchor="c">
          <M
            tex={String.raw`\textcolor{${WHITE}}{I(T';Y) = 0.811} = \textcolor{${WHITE}}{I(X;Y)}`}
            size={13}
          />
        </Lbl>

        {/* ── axis tick numbers ── */}
        <Lbl x={X0} y={AXIS_Y + 8} anchor="c" style={{ ...labelMuted }}>
          0
        </Lbl>
        <Lbl x={XT} y={AXIS_Y + 8} anchor="c" style={{ ...labelMuted }}>
          0.467
        </Lbl>
        <Lbl x={X1} y={AXIS_Y + 8} anchor="c" style={{ ...labelMuted }}>
          0.811 bits
        </Lbl>
      </div>

      <div style={{ ...labelMuted, marginTop: 6, maxWidth: W }}>
        equality in the DPI means nothing about <b>Y</b> was lost — which merge reaches the
        ceiling depends on where the <b>Y</b>-relevant distinction sits
      </div>
    </div>
  );
}
