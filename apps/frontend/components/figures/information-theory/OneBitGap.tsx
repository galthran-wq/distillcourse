import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * OneBitGap — the +1 bit of the noiseless-coding bound is charged PER SYMBOL,
 * so its weight depends entirely on the size of H.
 *
 * Two stacked number lines sharing one bits-axis (ticks 0–3). Each carries a
 * band of width exactly one bit — the window [H, H+1) that every prefix code
 * lands inside. Blue marks the entropy H; amber marks the achieved cost L.
 *   Top ("running source" .5,.25,.15,.1): H ≈ 1.743, L = 1.75. A magnifier
 *     shows the two marks are a hair apart — gap 0.007 bits.
 *   Bottom ("90/10 coin"): H ≈ 0.469, the cheapest two-symbol code costs
 *     L = 1, so the overhead is 0.531 bits — 113% of the information itself.
 * The two +1-wide windows are drawn the same physical width to make the point.
 *
 * One idea: the +1 is per symbol, and on a low-entropy source it dominates.
 */

const W = 640;
const HGT = 392;
const X0 = 70; // bits = 0
const PPB = 145; // px per bit
const xOf = (v: number) => X0 + v * PPB;
const BAND = "currentColor";

// ── top panel: the running source ───────────────────────────────────────────
const H1 = 1.7427;
const L1 = 1.75;
const AX1 = 158;
const BT1 = 112; // band top
const H1x = xOf(H1);
const L1x = xOf(L1);
const HP1x = xOf(H1 + 1);

// ── bottom panel: the 90/10 coin ────────────────────────────────────────────
const H2 = 0.469;
const L2 = 1;
const AX2 = 348;
const BT2 = 302;
const H2x = xOf(H2);
const L2x = xOf(L2);
const HP2x = xOf(H2 + 1);

/** A vertical marker from the axis up to the band top. */
function Marker({
  x,
  y0,
  y1,
  color,
  dashed = false,
}: {
  x: number;
  y0: number;
  y1: number;
  color: string;
  dashed?: boolean;
}) {
  return (
    <>
      <line
        x1={x}
        y1={y0}
        x2={x}
        y2={y1}
        stroke={color}
        strokeWidth="1.8"
        strokeDasharray={dashed ? "4 3" : undefined}
        opacity={dashed ? 0.7 : 1}
      />
      {!dashed && <circle cx={x} cy={y0} r="3" fill={color} />}
    </>
  );
}

/** Shared axis: baseline, ticks 0–3, numbers, "bits". */
function Axis({ y }: { y: number }) {
  return (
    <g>
      <line x1={X0} y1={y} x2={xOf(3)} y2={y} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      {[0, 1, 2, 3].map((v) => (
        <g key={v}>
          <line x1={xOf(v)} y1={y} x2={xOf(v)} y2={y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          <text x={xOf(v)} y={y + 19} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
            {v}
          </text>
        </g>
      ))}
      <text x={xOf(3) + 12} y={y + 4} fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
        bits
      </text>
    </g>
  );
}

/** A "+1 bit" span bracket sitting just above a band. */
function WindowBracket({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <g stroke={BAND} strokeWidth="1.1" opacity="0.55" fill="none">
      <line x1={x0} y1={y} x2={x1} y2={y} />
      <line x1={x0} y1={y} x2={x0} y2={y + 5} />
      <line x1={x1} y1={y} x2={x1} y2={y + 5} />
    </g>
  );
}

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
  const transform = anchor === "c" ? "translateX(-50%)" : anchor === "r" ? "translateX(-100%)" : undefined;
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

export default function OneBitGap() {
  return (
    <div style={{ position: "relative", width: W, height: HGT, fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* ══ TOP PANEL ══ */}
        {/* the +1-wide window band [H, H+1) */}
        <rect x={H1x} y={BT1} width={HP1x - H1x} height={AX1 - BT1} fill={BAND} opacity="0.07" />
        <Axis y={AX1} />
        <WindowBracket x0={H1x} x1={HP1x} y={BT1 - 8} />
        {/* markers: entropy (blue), Huffman cost (amber) — a hair apart — and H+1 (dashed) */}
        <Marker x={H1x} y0={AX1} y1={BT1} color={SUPPORT} />
        <Marker x={L1x} y0={AX1} y1={BT1} color={ACCENT} />
        <Marker x={HP1x} y0={AX1} y1={BT1} color={BAND} dashed />

        {/* magnifier over the near-coincident H and L */}
        {/* target ring on the axis marks */}
        <circle cx={(H1x + L1x) / 2} cy={135} r="6" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.6" />
        {/* cone from the lens down to the target */}
        <line x1={306} y1={92} x2={318} y2={121} stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <line x1={341} y1={92} x2={330} y2={121} stroke="currentColor" strokeWidth="1" opacity="0.45" />
        {/* lens (no marker passes behind it, so no fill needed) */}
        <circle cx={323} cy={58} r="38" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
        {/* zoomed-apart marks inside the lens */}
        <line x1={311} y1={44} x2={311} y2={72} stroke={SUPPORT} strokeWidth="2" />
        <line x1={335} y1={44} x2={335} y2={72} stroke={ACCENT} strokeWidth="2" />
        {/* leaders from the H / L labels to the lens marks */}
        <line x1={250} y1={52} x2={309} y2={50} stroke={SUPPORT} strokeWidth="1" opacity="0.6" />
        <line x1={396} y1={52} x2={337} y2={50} stroke={ACCENT} strokeWidth="1" opacity="0.6" />

        {/* ══ BOTTOM PANEL ══ */}
        <rect x={H2x} y={BT2} width={HP2x - H2x} height={AX2 - BT2} fill={BAND} opacity="0.07" />
        <Axis y={AX2} />
        <WindowBracket x0={H2x} x1={HP2x} y={BT2 - 8} />
        <Marker x={H2x} y0={AX2} y1={BT2} color={SUPPORT} />
        <Marker x={L2x} y0={AX2} y1={BT2} color={ACCENT} />
        <Marker x={HP2x} y0={AX2} y1={BT2} color={BAND} dashed />
        {/* overhead span between H and L */}
        <g stroke={ACCENT} strokeWidth="1.3" fill="none">
          <line x1={H2x} y1={330} x2={L2x} y2={330} />
          <line x1={H2x} y1={326} x2={H2x} y2={334} />
          <line x1={L2x} y1={326} x2={L2x} y2={334} />
        </g>
        {/* leader from the overhead span to its label on the right */}
        <line
          x1={(H2x + L2x) / 2}
          y1={330}
          x2={318}
          y2={324}
          stroke={ACCENT}
          strokeWidth="1"
          opacity="0.55"
        />
      </svg>

      {/* ── TOP overlays ── */}
      <Lbl x={0} y={4} style={{ fontWeight: 600 }}>
        the running source (.5, .25, .15, .1)
      </Lbl>
      <Lbl x={250} y={44} anchor="r" style={{ color: SUPPORT }}>
        <M tex={String.raw`H \approx 1.743`} color={SUPPORT} />
      </Lbl>
      <Lbl x={400} y={44} style={{ color: ACCENT }}>
        <M tex={String.raw`L_{\text{Huffman}} = 1.75`} color={ACCENT} />
      </Lbl>
      <Lbl x={323} y={70} anchor="c" style={{ fontSize: 11, fontWeight: 600 }}>
        gap 0.007
      </Lbl>
      <Lbl x={395} y={88} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>
        +1 bit
      </Lbl>
      <Lbl x={430} y={128} style={{ ...labelMuted, fontSize: 12 }}>
        Huffman always lands here
      </Lbl>
      <Lbl x={HP1x} y={AX1 + 26} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>
        <M tex={String.raw`H{+}1 \approx 2.743`} />
      </Lbl>

      {/* ── BOTTOM overlays ── */}
      <Lbl x={0} y={214} style={{ fontWeight: 600 }}>
        a 90/10 coin
      </Lbl>
      <Lbl x={H2x} y={264} anchor="c" style={{ color: SUPPORT }}>
        <M tex={String.raw`H \approx 0.469`} color={SUPPORT} />
      </Lbl>
      <Lbl x={L2x} y={264} anchor="c" style={{ color: ACCENT }}>
        <M tex={String.raw`L = 1`} color={ACCENT} />
      </Lbl>
      <Lbl x={HP2x} y={264} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>
        <M tex={String.raw`H{+}1 \approx 1.469`} />
      </Lbl>
      <Lbl x={(H2x + HP2x) / 2} y={BT2 - 22} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>
        +1 bit
      </Lbl>
      <Lbl x={322} y={314} style={{ color: ACCENT, fontSize: 12, maxWidth: 210, whiteSpace: "normal" }}>
        overhead 0.531 bits — 113% of the information
      </Lbl>

      {/* one idea */}
      <Lbl x={0} y={HGT - 14} style={{ ...labelMuted }}>
        the +1 bit is charged per symbol: a rounding error beside a large H, but on a low-entropy source it dominates
      </Lbl>
    </div>
  );
}
