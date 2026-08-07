import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * BitsPerByteConversion — the nats-per-token → bits-per-byte conversion
 * dissected in place (playbook rule 7: short labels above the equation, thin
 * leader lines onto the exact symbols they name).
 *
 *   bits per byte = L_tok / ln 2 · 1 / tau
 *
 * Three tags, three owners:
 *   L_tok  (amber)        — "cross-entropy the model reports, nats per token"
 *   ln 2   (currentColor) — "base change: nats to bits"
 *   tau    (blue)         — "bytes per token, a property of the TOKENIZER"
 *
 * Below, the same equation with the worked instance plugged into the same
 * three slots (the slots are aligned vertically between the two rows), then
 * one muted line of the arithmetic read off.
 *
 * One idea: two of the three factors belong to different parts of the system —
 * amber is the model's contribution, blue the tokenizer's, currentColor the
 * constant that only changes units.
 */

const W = 720;
const HGT = 338;

/** x where the fraction group starts; both rows share it so slots align. */
const SPLIT = 412;
/** the left-hand side ("bits per byte =") is right-anchored here, leaving a
 *  clear channel for the ln-2 leader to descend through. */
const LHS_END = SPLIT - 52;
/** x where the second factor (1/tau) starts, shared by both rows too. */
const SPLIT2 = 492;

const ROW1 = 172; // vertical centre of the main equation
const ROW2 = 254; // vertical centre of the worked instance

function Lbl({
  x,
  y,
  children,
  anchor = "l",
  vmid = false,
  style,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "l" | "c" | "r";
  vmid?: boolean;
  style?: CSSProperties;
}) {
  const tx = anchor === "c" ? "-50%" : anchor === "r" ? "-100%" : "0";
  const ty = vmid ? "-50%" : "0";
  const transform = tx !== "0" || ty !== "0" ? `translate(${tx}, ${ty})` : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.3,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** thin line with a small two-stroke head — rule 6, "this label names that symbol". */
function Leader({
  x1,
  y1,
  x2,
  y2,
  color = "currentColor",
  op = 0.75,
  width = 1.1,
  head = 6,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  op?: number;
  width?: number;
  head?: number;
}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a1 = ang + Math.PI - 0.45;
  const a2 = ang + Math.PI + 0.45;
  return (
    <g stroke={color} strokeWidth={width} opacity={op} fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M ${x2} ${y2} L ${x2 + head * Math.cos(a1)} ${y2 + head * Math.sin(a1)}`} />
      <path d={`M ${x2} ${y2} L ${x2 + head * Math.cos(a2)} ${y2 + head * Math.sin(a2)}`} />
    </g>
  );
}

// ── the two rows, roles colour-bound inside the TeX ──
const LHS1 = String.raw`\text{bits per byte}\;=`;
const FRAC1 = String.raw`\frac{\textcolor{${ACCENT}}{L_{\text{tok}}}}{\ln 2}`;
const TAIL1 = String.raw`\cdot\;\frac{1}{\textcolor{${SUPPORT}}{\tau}}`;
const LHS2 = String.raw`0.75\;=`;
const FRAC2 = String.raw`\frac{\textcolor{${ACCENT}}{2.08}}{0.6931}`;
const TAIL2 = String.raw`\cdot\;\frac{1}{\textcolor{${SUPPORT}}{4.0}}`;

// leader targets, tuned against the render
const NUM_T = { x: 438, y: 141 }; // L_tok, the numerator
const DEN_T = { x: 404, y: 184 }; // ln 2, the denominator
const TAU_T = { x: 532, y: 188 }; // tau, denominator of 1/tau

export default function BitsPerByteConversion() {
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
        {/* ── the three leaders ── */}
        {/* "cross-entropy the model reports" → L_tok */}
        <Leader x1={408} y1={80} x2={NUM_T.x} y2={NUM_T.y} color={ACCENT} op={0.9} />
        {/* "base change: nats to bits" → ln 2, descending the open channel */}
        <Leader x1={322} y1={106} x2={DEN_T.x} y2={DEN_T.y} op={0.55} />
        {/* "bytes per token … the TOKENIZER" → tau */}
        <Leader x1={574} y1={90} x2={TAU_T.x} y2={TAU_T.y} color={SUPPORT} op={0.9} />
      </svg>

      {/* ══ the three tags ══ */}
      <Lbl
        x={235}
        y={88}
        anchor="c"
        style={{ ...labelMuted, textAlign: "center", whiteSpace: "nowrap" }}
      >
        base change: nats to bits
      </Lbl>

      <Lbl
        x={385}
        y={24}
        anchor="c"
        style={{
          textAlign: "center",
          whiteSpace: "nowrap",
          color: ACCENT,
          fontWeight: 600,
        }}
      >
        <div>cross-entropy the model</div>
        <div>reports, nats per token</div>
      </Lbl>

      <Lbl
        x={618}
        y={24}
        anchor="c"
        style={{
          textAlign: "center",
          whiteSpace: "nowrap",
          color: SUPPORT,
          fontWeight: 600,
        }}
      >
        <div>bytes per token, a</div>
        <div>
          property of the <span style={{ letterSpacing: 0.3 }}>TOKENIZER</span>,
        </div>
        <div>not the model</div>
      </Lbl>

      {/* ══ row 1: the equation ══ */}
      <Lbl x={LHS_END} y={ROW1} anchor="r" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={LHS1} size={28} />
      </Lbl>
      <Lbl x={SPLIT} y={ROW1} anchor="l" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={FRAC1} size={28} />
      </Lbl>
      <Lbl x={SPLIT2} y={ROW1} anchor="l" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={TAIL1} size={28} />
      </Lbl>

      {/* ══ row 2: the same slots, the worked instance ══ */}
      <Lbl x={LHS_END} y={ROW2} anchor="r" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={LHS2} size={24} />
      </Lbl>
      <Lbl x={SPLIT} y={ROW2} anchor="l" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={FRAC2} size={24} />
      </Lbl>
      <Lbl x={SPLIT2} y={ROW2} anchor="l" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={TAIL2} size={24} />
      </Lbl>

      {/* ══ the arithmetic read off ══ */}
      <Lbl
        x={400}
        y={306}
        anchor="c"
        style={{ ...labelMuted, textAlign: "center", whiteSpace: "nowrap", fontSize: 12.5 }}
      >
        = 3.00 bits/token = 0.75 bits/byte = 9.4% of raw size
      </Lbl>
    </div>
  );
}
