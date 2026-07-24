import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * RdObjective — the rate-distortion objective dissected in place (playbook
 * rule 7: short labels above the equation with thin arrows onto the exact
 * symbols).
 *
 *   R(D) = min_{p(x̂|x)} I(X; X̂)   s.t.   E[d(X, X̂)] ≤ D
 *
 * Three tags on thin arrows:
 *   p(x̂|x) under the min (currentColor) — "search over test channels"
 *   I(X; X̂)            (amber)          — "rate = mutual information"
 *   E[d(X,X̂)] ≤ D       (blue)           — "fidelity budget"
 *
 * Below: a small data-flow pipeline  X → [test channel p(x̂|x)] → X̂  with the
 * note "X̂ is processed from X: the DPI applies".
 *
 * One idea: compression = minimize information subject to a distortion budget.
 * Amber = the minimized information (the subject); blue = the distortion
 * constraint; currentColor = structure. Inspiration: Shannon 1948 §28.
 */

const W = 700;
const HGT = 400;

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
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** thin arrow with a small two-stroke head at (x2,y2) — rule 6 "names that symbol". */
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = "currentColor",
  op = 0.7,
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

// ── arrow targets onto the exact symbols (tuned against the render) ──
const MIN_T = { x: 236, y: 168 }; // p(x̂|x) subscript under the min
const MI_T = { x: 330, y: 140 }; // I(X; X̂)
const CON_T = { x: 582, y: 140 }; // E[d(X,X̂)] ≤ D

const EQ_TEX = String.raw`R(D)\;=\;\min_{p(\hat x \mid x)}\;\textcolor{${ACCENT}}{I(X;\hat X)}\quad\text{s.t.}\quad\textcolor{${SUPPORT}}{\mathbb{E}[d(X,\hat X)] \le D}`;

// pipeline geometry
const PIPE_Y = 300;
const X_NODE = { x: 168, y: PIPE_Y };
const BOX = { x: 350, y: PIPE_Y, w: 168, h: 44 };
const XH_NODE = { x: 552, y: PIPE_Y };

export default function RdObjective() {
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
        {/* ── label arrows onto the three terms ── */}
        {/* "search over test channels" → the min subscript */}
        <Arrow x1={150} y1={70} x2={MIN_T.x} y2={MIN_T.y} op={0.6} />
        {/* "rate = mutual information" → I(X; X̂) */}
        <Arrow x1={330} y1={64} x2={MI_T.x} y2={MI_T.y} color={ACCENT} op={0.9} />
        {/* "fidelity budget" → the distortion constraint */}
        <Arrow x1={592} y1={70} x2={CON_T.x} y2={CON_T.y} color={SUPPORT} op={0.9} />

        {/* ── pipeline: X → [test channel] → X̂, straight data-flow arrows ── */}
        <rect
          x={BOX.x - BOX.w / 2}
          y={BOX.y - BOX.h / 2}
          width={BOX.w}
          height={BOX.h}
          rx="6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.3"
        />
        <Arrow
          x1={X_NODE.x + 16}
          y1={PIPE_Y}
          x2={BOX.x - BOX.w / 2 - 8}
          y2={PIPE_Y}
          op={0.75}
          width={1.4}
          head={7}
        />
        <Arrow
          x1={BOX.x + BOX.w / 2 + 8}
          y1={PIPE_Y}
          x2={XH_NODE.x - 16}
          y2={PIPE_Y}
          op={0.75}
          width={1.4}
          head={7}
        />
      </svg>

      {/* ══ top tags ══ */}
      <Lbl x={150} y={38} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, maxWidth: 190 }}>
        <div style={{ fontWeight: 600 }}>search over</div>
        <div style={{ fontWeight: 600 }}>test channels</div>
      </Lbl>

      <Lbl x={330} y={30} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, color: ACCENT, maxWidth: 240 }}>
        <div style={{ fontWeight: 600 }}>rate = mutual information</div>
      </Lbl>

      <Lbl x={592} y={38} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, color: SUPPORT, maxWidth: 170 }}>
        <div style={{ fontWeight: 600 }}>fidelity budget</div>
      </Lbl>

      {/* ══ the equation, roles color-bound inside the TeX ══ */}
      <Lbl x={W / 2} y={150} anchor="c" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={EQ_TEX} size={27} />
      </Lbl>

      {/* ══ divider caption between the algebra and the picture ══ */}
      <Lbl x={W / 2} y={228} anchor="c" style={{ ...labelMuted, fontSize: 12.5, fontStyle: "italic", textAlign: "center" }}>
        the test channel is the object we optimize over:
      </Lbl>

      {/* ══ pipeline node labels ══ */}
      <Lbl x={X_NODE.x} y={PIPE_Y} anchor="c" vmid>
        <M tex={String.raw`X`} size={22} />
      </Lbl>
      <Lbl x={BOX.x} y={PIPE_Y} anchor="c" vmid style={{ textAlign: "center", whiteSpace: "nowrap" }}>
        <M tex={String.raw`\text{test channel } p(\hat x \mid x)`} size={15} />
      </Lbl>
      <Lbl x={XH_NODE.x} y={PIPE_Y} anchor="c" vmid>
        <M tex={String.raw`\hat X`} size={22} />
      </Lbl>

      {/* ══ pipeline note ══ */}
      <Lbl x={W / 2} y={352} anchor="c" style={{ textAlign: "center", lineHeight: 1.4, maxWidth: 560 }}>
        <div style={{ ...labelMuted, fontSize: 12.5 }}>
          <M tex={String.raw`\hat X`} size={12} /> is processed from{" "}
          <M tex={String.raw`X`} size={12} /> — the{" "}
          <b style={{ fontWeight: 600, opacity: 1 }}>DPI applies</b>
        </div>
      </Lbl>
    </div>
  );
}
