import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * KlGapBars — static twin of the KLMismatch demo. The running source
 * p = (.5, .25, .15, .1) as blue bars (upper) vs. the uniform model
 * q = (.25, .25, .25, .25) as amber bars (lower), aligned over symbols A–D.
 * Beneath: one stacked cost bar on a bits-axis splitting the cross-entropy of
 * the uniform model into the entropy floor H(p) = 1.743 (blue) plus the
 * divergence D(p||q) = 0.257 (amber), summing to H(p,q) = 2.000 bits.
 *
 * Blue = the true distribution p and the entropy floor; amber = the model q
 * and the divergence. One idea: the gap between the model's cost and the
 * entropy floor is exactly D(p||q).
 */

const W = 680;
const HGT = 476;

// ── bar charts ──
const CX = [150, 290, 430, 570]; // shared A,B,C,D column centers
const BW = 54; // bar width
const K = 150; // px per probability unit
const P = [0.5, 0.25, 0.15, 0.1];
const Q = [0.25, 0.25, 0.25, 0.25];
const UB = 130; // upper chart baseline (p)
const LB = 250; // lower chart baseline (q)
const CHART_X0 = 110;
const CHART_X1 = 610;

// ── cost bar ──
const X0 = 110; // bits = 0
const PPB = 210; // px per bit
const xOf = (v: number) => X0 + v * PPB;
const HP = 1.743;
const HPQ = 2.0;
const CB_Y = 340;
const CB_H = 34;
const CB_BOT = CB_Y + CB_H;
const XH = xOf(HP); // blue/amber seam
const XE = xOf(HPQ); // bar end
const AXIS_Y = 410;
const BR_Y = 320; // bracket

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

export default function KlGapBars() {
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
        {/* ── upper chart: true p (blue) ── */}
        <line x1={CHART_X0} y1={UB} x2={CHART_X1} y2={UB} stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
        {P.map((p, i) => {
          const h = K * p;
          return (
            <g key={`p${i}`}>
              <rect x={CX[i] - BW / 2} y={UB - h} width={BW} height={h} fill={SUPPORT} opacity="0.85" />
              <text x={CX[i]} y={UB - h - 6} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.85">
                {p.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* ── lower chart: model q (amber) ── */}
        <line x1={CHART_X0} y1={LB} x2={CHART_X1} y2={LB} stroke="currentColor" strokeWidth="1" strokeOpacity="0.3" />
        {Q.map((q, i) => {
          const h = K * q;
          return (
            <g key={`q${i}`}>
              <rect x={CX[i] - BW / 2} y={LB - h} width={BW} height={h} fill={ACCENT} opacity="0.9" />
              <text x={CX[i]} y={LB - h - 6} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.85">
                {q.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* symbol labels A,B,C,D under the lower chart */}
        {["A", "B", "C", "D"].map((s, i) => (
          <text key={s} x={CX[i]} y={LB + 18} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor" opacity="0.75">
            {s}
          </text>
        ))}

        {/* ── stacked cost bar ── */}
        {/* bracket over the whole bar: the total H(p,q) */}
        <path
          d={`M ${X0} ${BR_Y + 6} L ${X0} ${BR_Y} L ${XE} ${BR_Y} L ${XE} ${BR_Y + 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        {/* up-tick at the right end pointing to the H(p,q) annotation */}
        <path d={`M ${XE} ${BR_Y} L ${XE} ${BR_Y - 8}`} fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />

        {/* blue: entropy floor 0..H(p) */}
        <rect x={X0} y={CB_Y} width={XH - X0} height={CB_H} fill={SUPPORT} opacity="0.85" />
        {/* amber: divergence H(p)..H(p,q) */}
        <rect x={XH} y={CB_Y} width={XE - XH} height={CB_H} fill={ACCENT} opacity="0.92" />
        {/* whole-bar hairline outline */}
        <rect x={X0} y={CB_Y} width={XE - X0} height={CB_H} fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
        {/* seam accent */}
        <line x1={XH} y1={CB_Y} x2={XH} y2={CB_BOT} stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />

        {/* axis */}
        <line x1={X0} y1={AXIS_Y} x2={xOf(2.1) + 6} y2={AXIS_Y} stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <g key={v}>
            <line x1={xOf(v)} y1={AXIS_Y} x2={xOf(v)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
            <text x={xOf(v)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {v}
            </text>
          </g>
        ))}
        <text x={xOf(2.1) + 12} y={AXIS_Y + 4} fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits
        </text>
      </svg>

      {/* ── row labels for the two charts ── */}
      <Lbl x={16} y={UB - K * 0.5 / 2 - 8} style={{ color: SUPPORT, fontWeight: 600 }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{\text{true } p}`} />
      </Lbl>
      <Lbl x={16} y={LB - K * 0.25 / 2 - 8} style={{ color: ACCENT, fontWeight: 600 }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{\text{model } q}`} />
      </Lbl>

      {/* ── H(p,q) annotation at the right end of the bar ── */}
      <Lbl x={XE} y={BR_Y - 30} anchor="r" style={{ fontSize: 14, fontWeight: 600 }}>
        <M tex={String.raw`H(p,q) = 2.000\ \text{bits}`} />
      </Lbl>

      {/* ── segment value labels below the bar ── */}
      <Lbl x={(X0 + XH) / 2} y={CB_BOT + 6} anchor="c" style={{ color: SUPPORT }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{H(p) = 1.743}`} />
      </Lbl>
      <Lbl x={(XH + XE) / 2} y={CB_BOT + 6} anchor="c" style={{ color: ACCENT }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{D(p\,\|\,q) = 0.257}`} />
      </Lbl>

      {/* ── payoff line ── */}
      <Lbl x={W / 2} y={AXIS_Y + 36} anchor="c" style={{ fontSize: 15 }}>
        <span style={{ fontWeight: 600 }}>cross-entropy</span>
        <span style={{ opacity: 0.7 }}> = </span>
        <span style={{ color: SUPPORT, fontWeight: 600 }}>entropy floor</span>
        <span style={{ opacity: 0.7 }}> + </span>
        <span style={{ color: ACCENT, fontWeight: 600 }}>divergence</span>
      </Lbl>
    </div>
  );
}
