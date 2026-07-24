import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, labelMuted } from "../palette";

/**
 * CodingEfficiencyBars — coding efficiency as two capacity bars on one shared
 * bits axis (playbook rule 8: twin panels on a common scale). The SAME neuron,
 * so the SAME capacity C: a single outlined bar of length C with a dashed
 * "capacity C" ceiling. Inside each bar the transmitted information I(S;R) is
 * shaded amber; the unused remainder is left blank.
 *
 *   Top    matched / naturalistic ensemble:  amber nearly fills C,  eta ~= 90%.
 *   Bottom mismatched / noise ensemble:       amber fills a sliver,  eta ~= 20%.
 *
 * Between them a note fixes the invariant: same neuron, different ensemble.
 * Colors: amber = information transmitted (the used fraction I(S;R)/C = eta);
 * currentColor = the capacity outline + ceiling + axis.
 *
 * One idea: coding efficiency is a property of the stimulus ensemble, not of
 * the neuron alone. Schematic recreation of Borst & Theunissen's frog-auditory
 * efficiency contrast (Table 2 / efficiency discussion) — not the toy numbers.
 */

const WHITE = "#fff";

const W = 580;
const HGT = 212;

const X0 = 40; // bits = 0
const BARW = 420; // pixels for the full capacity C
const X1 = X0 + BARW; // ceiling x (= C)
const bx = (frac: number) => X0 + frac * BARW; // frac in [0, 1] of capacity

const ETA_TOP = 0.9; // matched / naturalistic ensemble
const ETA_BOT = 0.2; // mismatched / noise ensemble

const BAR_H = 40;
const R1_Y = 44;
const R1_BOT = R1_Y + BAR_H;
const R2_Y = 130;
const R2_BOT = R2_Y + BAR_H;

const LINE_TOP = 34;
const LINE_BOT = R2_BOT + 6;
const AXIS_Y = 188;

const ETA_X = X1 + 16; // eta result column, right of the ceiling

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

/** One capacity bar: amber transmitted fraction, blank remainder, full outline C. */
function Bar({ y, eta }: { y: number; eta: number }) {
  const seam = bx(eta);
  return (
    <>
      {/* transmitted information I(S;R): amber used fraction */}
      <rect x={X0} y={y} width={seam - X0} height={BAR_H} fill={ACCENT} opacity="0.9" />
      {/* seam between used and unused */}
      <line x1={seam} y1={y} x2={seam} y2={y + BAR_H} stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
      {/* full capacity outline (0 … C) drawn on top so the remainder reads as blank */}
      <rect x={X0} y={y} width={BARW} height={BAR_H} fill="none" stroke="currentColor" strokeWidth="1.3" />
    </>
  );
}

export default function CodingEfficiencyBars() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      <div style={{ position: "relative", width: W, height: HGT }}>
        <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
          {/* ── the shared ceiling C: one dashed currentColor line across both rows ── */}
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

          {/* ── row 1: matched / naturalistic — amber nearly to the ceiling ── */}
          <Bar y={R1_Y} eta={ETA_TOP} />

          {/* ── row 2: mismatched / noise — amber sliver ── */}
          <Bar y={R2_Y} eta={ETA_BOT} />

          {/* ── shared bits axis: 0 … C ── */}
          <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
          {[0, ETA_BOT, ETA_TOP, 1].map((f) => (
            <line
              key={f}
              x1={bx(f)}
              y1={AXIS_Y}
              x2={bx(f)}
              y2={AXIS_Y + (f === 0 || f === 1 ? 5 : 3)}
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity={f === 0 || f === 1 ? 0.45 : 0.3}
            />
          ))}
        </svg>

        {/* ── ceiling label ── */}
        <Lbl x={X1} y={4} anchor="c" style={{ fontWeight: 600 }}>
          <M tex={String.raw`\text{capacity } C`} size={13} />
        </Lbl>

        {/* ── row 1: title, on-bar I(S;R), eta result ── */}
        <Lbl x={X0} y={R1_Y - 20} style={{ fontWeight: 600 }}>
          matched <span style={{ ...labelMuted, opacity: 0.7 }}>/ naturalistic ensemble</span>
        </Lbl>
        <Lbl x={(X0 + bx(ETA_TOP)) / 2} y={R1_Y + 11} anchor="c">
          <M tex={String.raw`\textcolor{${WHITE}}{I(S;R)}`} size={13} />
        </Lbl>
        <Lbl x={ETA_X} y={R1_Y + 11} style={{ color: ACCENT, fontWeight: 600 }}>
          <M tex={String.raw`\eta \approx 90\%`} size={13} />
        </Lbl>

        {/* ── mid note: the invariant ── */}
        <Lbl x={X0 + BARW / 2} y={(R1_BOT + R2_Y) / 2 - 8} anchor="c" style={{ ...labelMuted, fontStyle: "italic" }}>
          same neuron, different stimulus ensemble
        </Lbl>

        {/* ── row 2: title, on-bar I(S;R), unused remainder, eta result ── */}
        <Lbl x={X0} y={R2_Y - 20} style={{ fontWeight: 600 }}>
          mismatched <span style={{ ...labelMuted, opacity: 0.7 }}>/ noise ensemble</span>
        </Lbl>
        <Lbl x={(X0 + bx(ETA_BOT)) / 2} y={R2_Y + 11} anchor="c">
          <M tex={String.raw`\textcolor{${WHITE}}{I(S;R)}`} size={12} />
        </Lbl>
        <Lbl
          x={(bx(ETA_BOT) + X1) / 2}
          y={R2_Y + 12}
          anchor="c"
          style={{ ...labelMuted, opacity: 0.7, fontStyle: "italic" }}
        >
          unused capacity
        </Lbl>
        <Lbl x={ETA_X} y={R2_Y + 11} style={{ color: ACCENT, fontWeight: 600 }}>
          <M tex={String.raw`\eta \approx 20\%`} size={13} />
        </Lbl>

        {/* ── axis tick numbers ── */}
        <Lbl x={X0} y={AXIS_Y + 8} anchor="c" style={{ ...labelMuted }}>
          0
        </Lbl>
        <Lbl x={X1} y={AXIS_Y + 8} anchor="c" style={{ ...labelMuted }}>
          C bits
        </Lbl>
      </div>

      <div style={{ ...labelMuted, marginTop: 6, maxWidth: W }}>
        efficiency <M tex={String.raw`\eta = I(S;R)/C`} size={12} /> is a property of the stimulus
        ensemble, not of the neuron alone — the same cell uses most of its channel on natural
        sounds and little of it on noise
      </div>
    </div>
  );
}
