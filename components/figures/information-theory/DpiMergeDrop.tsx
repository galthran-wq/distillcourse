import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * DpiMergeDrop — the worked data-processing drop of the DPI lesson, in one
 * picture. The four-symbol source X ∈ {a,b,c,d} with binary label Y (Y=1 iff
 * X ∈ {c,d}) is quantized by T = f(X), f(b)=f(c)=m, collapsing the two middle
 * columns into one symbol.
 *
 *   joint p(x,y):  y=0 [1/2, 1/4,  0 ,  0 ]   b,c tinted (the merged pair)
 *                  y=1 [ 0 ,  0 , 1/8, 1/8]
 *   merged (T,Y):  y=0 [1/2, 1/4,  0 ]        m tinted; p(Y=1|m)=1/3
 *                  y=1 [ 0 , 1/8, 1/8]
 *
 * Then a tally on a shared bits scale 0–0.811:
 *   I(X;Y) = 0.811  (full amber)
 *   I(T;Y) = 0.467  (amber) + 0.344 lost (muted hatch to the 0.811 ceiling)
 *
 * Color roles: amber = information about Y (the subject, only in the bars);
 * blue = the merged symbol m (processing); currentColor = table structure;
 * the loss segment is muted hatch, not a new hue.
 *
 * One idea: merging a pure-Y=0 column (b) with a pure-Y=1 column (c) is
 * exactly where the bits about Y are destroyed.
 */

const BLUE_TINT = "#4c8dd630";
const CELL = 46;
const ROWLBL = 44;

function Cell({ tex, tint }: { tex: string; tint?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: CELL,
        height: 40,
        border: "1px solid color-mix(in srgb, currentColor 30%, transparent)",
        background: tint ? BLUE_TINT : "transparent",
        fontSize: 14,
      }}
    >
      <M tex={tex} />
    </div>
  );
}

function ColHead({ tex, tint }: { tex: string; tint?: boolean }) {
  return (
    <div
      style={{
        width: CELL,
        textAlign: "center",
        paddingBottom: 3,
        color: tint ? SUPPORT : undefined,
        fontWeight: 600,
      }}
    >
      <M tex={tex} size={13} color={tint ? SUPPORT : undefined} />
    </div>
  );
}

function RowHead({ tex }: { tex: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        width: ROWLBL,
        height: 40,
        paddingRight: 8,
      }}
    >
      <M tex={tex} size={12} />
    </div>
  );
}

const F = (n: number, d: number) => String.raw`\tfrac{${n}}{${d}}`;

/** Down-pointing curly brace under two columns; tip at center. */
function Brace({ w }: { w: number }) {
  const d = 13;
  const m = w / 2;
  const path = [
    `M 0 0`,
    `Q 0 ${d * 0.62} ${w * 0.16} ${d * 0.62}`,
    `L ${m - 6} ${d * 0.62}`,
    `Q ${m} ${d * 0.62} ${m} ${d}`,
    `Q ${m} ${d * 0.62} ${m + 6} ${d * 0.62}`,
    `L ${w - w * 0.16} ${d * 0.62}`,
    `Q ${w} ${d * 0.62} ${w} 0`,
  ].join(" ");
  return (
    <svg width={w} height={d + 2} viewBox={`0 0 ${w} ${d + 2}`} aria-hidden="true">
      <path d={path} fill="none" stroke={SUPPORT} strokeWidth="1.4" />
    </svg>
  );
}

// ── bits tally geometry ──
const BW = 560;
const BX0 = 92; // bar start (0 bits)
const BARW = 372; // 0.811 bits
const BX1 = BX0 + BARW;
const CEIL = 0.811;
const ITY = 0.467;
const SEAM = BX0 + (ITY / CEIL) * BARW; // amber → loss seam on bottom bar
const BAR_H = 30;
const ROW1_Y = 30;
const ROW2_Y = ROW1_Y + BAR_H + 26;

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

export default function DpiMergeDrop() {
  const tallyH = ROW2_Y + BAR_H + 44;
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 600,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
      }}
    >
      {/* ── tables: joint 2×4 → merged 2×3 ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
        {/* joint p(x,y) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 8, alignSelf: "flex-start", paddingLeft: ROWLBL }}>
            <M tex="p(x,y)" size={13} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `${ROWLBL}px repeat(4, ${CELL}px)` }}>
            <div />
            <ColHead tex="a" />
            <ColHead tex="b" tint />
            <ColHead tex="c" tint />
            <ColHead tex="d" />

            <RowHead tex="y{=}0" />
            <Cell tex={F(1, 2)} />
            <Cell tex={F(1, 4)} tint />
            <Cell tex="0" tint />
            <Cell tex="0" />

            <RowHead tex="y{=}1" />
            <Cell tex="0" />
            <Cell tex="0" tint />
            <Cell tex={F(1, 8)} tint />
            <Cell tex={F(1, 8)} />
          </div>
          {/* brace under b,c */}
          <div style={{ display: "flex", alignSelf: "flex-start" }}>
            <div style={{ width: ROWLBL + CELL }} />
            <Brace w={CELL * 2} />
          </div>
          <div style={{ alignSelf: "flex-start", paddingLeft: ROWLBL + CELL - 8, marginTop: 2 }}>
            <span style={{ fontSize: 12, color: SUPPORT }}>
              merge <M tex={String.raw`f(b){=}f(c){=}m`} size={12} color={SUPPORT} />
            </span>
          </div>
        </div>

        {/* merge arrow */}
        <div style={{ alignSelf: "center", color: SUPPORT, fontSize: 22, paddingTop: 18 }}>⟶</div>

        {/* merged (T,Y) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ marginBottom: 8, alignSelf: "flex-start", paddingLeft: ROWLBL }}>
            <M tex="p(t,y)" size={13} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `${ROWLBL}px repeat(3, ${CELL}px)` }}>
            <div />
            <ColHead tex="a" />
            <ColHead tex="m" tint />
            <ColHead tex="d" />

            <RowHead tex="y{=}0" />
            <Cell tex={F(1, 2)} />
            <Cell tex={F(1, 4)} tint />
            <Cell tex="0" />

            <RowHead tex="y{=}1" />
            <Cell tex="0" />
            <Cell tex={F(1, 8)} tint />
            <Cell tex={F(1, 8)} />
          </div>
          {/* annotation under the m column */}
          <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 8 }}>
            <div style={{ width: ROWLBL + CELL }} />
            <span style={{ fontSize: 12, color: SUPPORT }}>
              <M tex={String.raw`p(Y{=}1\mid m)=\tfrac13`} size={12} color={SUPPORT} />
            </span>
          </div>
        </div>
      </div>

      {/* ── bits tally ── */}
      <div style={{ position: "relative", width: BW, height: tallyH, fontSize: 13 }}>
        <svg width={BW} height={tallyH} viewBox={`0 0 ${BW} ${tallyH}`} aria-hidden="true">
          <defs>
            <pattern id="dpiLostHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" fill="none" />
              <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.32" />
            </pattern>
          </defs>

          {/* ceiling line at 0.811 spanning both rows */}
          <line
            x1={BX1}
            y1={ROW1_Y - 8}
            x2={BX1}
            y2={ROW2_Y + BAR_H + 8}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="3 3"
            strokeOpacity="0.5"
          />

          {/* row 1: I(X;Y) = 0.811, full amber */}
          <rect x={BX0} y={ROW1_Y} width={BARW} height={BAR_H} fill={ACCENT} opacity="0.9" />
          <rect x={BX0} y={ROW1_Y} width={BARW} height={BAR_H} fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />

          {/* row 2: I(T;Y) = 0.467 amber + 0.344 lost (muted hatch) */}
          <rect x={BX0} y={ROW2_Y} width={SEAM - BX0} height={BAR_H} fill={ACCENT} opacity="0.9" />
          <rect x={SEAM} y={ROW2_Y} width={BX1 - SEAM} height={BAR_H} fill="url(#dpiLostHatch)" />
          <rect x={BX0} y={ROW2_Y} width={BARW} height={BAR_H} fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
          <line x1={SEAM} y1={ROW2_Y} x2={SEAM} y2={ROW2_Y + BAR_H} stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />

          {/* axis ticks 0 and 0.811 */}
          <line x1={BX0} y1={ROW2_Y + BAR_H + 6} x2={BX0} y2={ROW2_Y + BAR_H + 11} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
          <line x1={BX1} y1={ROW2_Y + BAR_H + 6} x2={BX1} y2={ROW2_Y + BAR_H + 11} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        </svg>

        {/* left row labels */}
        <Lbl x={BX0 - 10} y={ROW1_Y + BAR_H / 2 - 9} anchor="r">
          <M tex="I(X;Y)" size={13} />
        </Lbl>
        <Lbl x={BX0 - 10} y={ROW2_Y + BAR_H / 2 - 9} anchor="r">
          <M tex="I(T;Y)" size={13} />
        </Lbl>

        {/* row 1 value inside/after the amber bar */}
        <Lbl x={BX0 + (SEAM - BX0) / 2} y={ROW1_Y + BAR_H / 2 - 9} anchor="c" style={{ color: "#fff", fontWeight: 600 }}>
          <M tex={String.raw`0.811\ \text{bits}`} size={12.5} color="#fff" />
        </Lbl>

        {/* row 2 amber value */}
        <Lbl x={BX0 + (SEAM - BX0) / 2} y={ROW2_Y + BAR_H / 2 - 9} anchor="c" style={{ color: "#fff", fontWeight: 600 }}>
          <M tex={String.raw`0.467`} size={12.5} color="#fff" />
        </Lbl>
        {/* row 2 lost segment label */}
        <Lbl x={(SEAM + BX1) / 2} y={ROW2_Y + BAR_H / 2 - 9} anchor="c" style={labelMuted}>
          <M tex={String.raw`\text{lost: }0.344\text{ bits}`} size={11.5} />
        </Lbl>

        {/* ceiling caption */}
        <Lbl x={BX1} y={ROW1_Y - 24} anchor="c" style={{ ...labelMuted, fontSize: 11.5 }}>
          ceiling: <M tex={String.raw`I(X;Y)=0.811`} size={11.5} />
        </Lbl>

        {/* axis endpoints */}
        <Lbl x={BX0} y={ROW2_Y + BAR_H + 13} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>0</Lbl>
        <Lbl x={BX1} y={ROW2_Y + BAR_H + 13} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>
          0.811 bits
        </Lbl>
      </div>

      {/* compact color legend: role bound to the word naming it */}
      <div style={{ display: "flex", gap: 24, fontSize: 12, alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 14, height: 14, background: ACCENT, opacity: 0.9, display: "inline-block" }} />
          <span>bits about <M tex="Y" size={12} /></span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 14, height: 14, background: BLUE_TINT, border: `1px solid ${SUPPORT}`, display: "inline-block" }} />
          <span style={{ color: SUPPORT }}>merged symbol <M tex="m" size={12} color={SUPPORT} /></span>
        </span>
      </div>
    </div>
  );
}
