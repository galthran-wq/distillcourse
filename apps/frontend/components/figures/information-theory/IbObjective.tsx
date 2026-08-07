import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * IbObjective — the information-bottleneck objective dissected in place
 * (playbook rule 7: short labels above the equation with thin arrows onto the
 * exact symbols).
 *
 *   L = I(X;T) - beta I(T;Y)
 *
 * Three tags on thin arrows:
 *   I(X;T)  (blue)         — "rate: bits T keeps about X — minimize"
 *   beta    (currentColor) — "price of a relevant bit"
 *   I(T;Y)  (amber)        — "relevance: bits T keeps about the target Y — maximize"
 *
 * Below: the chain  Y -> X -> [encoder p(t|x)] -> T  with the X->T stage tagged
 * "the only object chosen" and a faint crossed-out dashed arc from Y to the
 * encoder — "the encoder never sees Y".
 *
 * One idea: compress X (pay rate), keep Y (earn relevance); beta sets the
 * exchange rate. Amber = relevance term and target Y; blue = rate term;
 * currentColor = structure. Inspiration: Tishby, Pereira & Bialek 1999.
 */

const W = 720;
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

// ── the objective, roles color-bound inside the TeX ──
const EQ_TEX = String.raw`\mathcal{L}\;=\;\textcolor{${SUPPORT}}{I(X;T)}\;-\;\beta\,\textcolor{${ACCENT}}{I(T;Y)}`;

// arrow targets onto the exact symbols (tuned against the render)
const RATE_T = { x: 292, y: 128 }; // I(X;T)
const BETA_T = { x: 425, y: 128 }; // beta
const REL_T = { x: 545, y: 128 }; // I(T;Y)

// ── chain geometry ──
const PIPE_Y = 322;
const Y_NODE = { x: 118, y: PIPE_Y };
const X_NODE = { x: 216, y: PIPE_Y };
const BOX = { x: 374, y: PIPE_Y, w: 156, h: 46 };
const T_NODE = { x: 566, y: PIPE_Y };

export default function IbObjective() {
  const boxL = BOX.x - BOX.w / 2;
  const boxR = BOX.x + BOX.w / 2;
  const boxTop = BOX.y - BOX.h / 2;
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
        {/* "rate ... minimize" → I(X;T) */}
        <Arrow x1={250} y1={86} x2={RATE_T.x} y2={RATE_T.y} color={SUPPORT} op={0.9} />
        {/* "price of a relevant bit" → beta */}
        <Arrow x1={425} y1={86} x2={BETA_T.x} y2={BETA_T.y} op={0.6} />
        {/* "relevance ... maximize" → I(T;Y) */}
        <Arrow x1={590} y1={86} x2={REL_T.x} y2={REL_T.y} color={ACCENT} op={0.9} />

        {/* ── chain: Y → X → [encoder] → T, straight data-flow arrows ── */}
        <rect
          x={boxL}
          y={boxTop}
          width={BOX.w}
          height={BOX.h}
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.3"
        />
        <Arrow x1={Y_NODE.x + 16} y1={PIPE_Y} x2={X_NODE.x - 16} y2={PIPE_Y} op={0.75} width={1.4} head={7} />
        <Arrow x1={X_NODE.x + 16} y1={PIPE_Y} x2={boxL - 8} y2={PIPE_Y} op={0.75} width={1.4} head={7} />
        <Arrow x1={boxR + 8} y1={PIPE_Y} x2={T_NODE.x - 16} y2={PIPE_Y} op={0.75} width={1.4} head={7} />

        {/* ── the "only object chosen" span bracket under X … T ── */}
        <g stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.1" fill="none">
          <path
            d={`M ${X_NODE.x} ${PIPE_Y + 26} L ${X_NODE.x} ${PIPE_Y + 34} L ${T_NODE.x} ${PIPE_Y + 34} L ${T_NODE.x} ${PIPE_Y + 26}`}
          />
        </g>

        {/* ── faint crossed-out arc: Y never reaches the encoder ── */}
        <path
          d={`M ${Y_NODE.x + 2} ${PIPE_Y - 14} Q 250 ${boxTop - 44} ${BOX.x - 30} ${boxTop - 2}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.2"
          strokeDasharray="4 4"
          opacity="0.45"
        />
        {/* cross-out ✕ on the arc's midpoint */}
        <g stroke={ACCENT} strokeWidth="1.6" opacity="0.85">
          <line x1={241 - 7} y1={279 - 7} x2={241 + 7} y2={279 + 7} />
          <line x1={241 - 7} y1={279 + 7} x2={241 + 7} y2={279 - 7} />
        </g>
      </svg>

      {/* ══ top tags ══ */}
      <Lbl x={200} y={34} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, color: SUPPORT, maxWidth: 210, fontWeight: 600 }}>
        <div>rate: bits <M tex={String.raw`\textcolor{${SUPPORT}}{T}`} size={12} /> keeps about <M tex={String.raw`\textcolor{${SUPPORT}}{X}`} size={12} /></div>
        <div>— minimize</div>
      </Lbl>

      <Lbl x={430} y={38} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, maxWidth: 130, fontWeight: 600 }}>
        <div>price of a</div>
        <div>relevant bit</div>
      </Lbl>

      <Lbl x={605} y={30} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, color: ACCENT, maxWidth: 210, fontWeight: 600 }}>
        <div>relevance: bits <M tex={String.raw`\textcolor{${ACCENT}}{T}`} size={12} /> keeps</div>
        <div>about the target <M tex={String.raw`\textcolor{${ACCENT}}{Y}`} size={12} /> — maximize</div>
      </Lbl>

      {/* ══ the equation ══ */}
      <Lbl x={W / 2} y={148} anchor="c" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={EQ_TEX} size={30} />
      </Lbl>

      {/* ══ chain node labels ══ */}
      <Lbl x={Y_NODE.x} y={PIPE_Y} anchor="c" vmid>
        <M tex={String.raw`\textcolor{${ACCENT}}{Y}`} size={22} />
      </Lbl>
      <Lbl x={X_NODE.x} y={PIPE_Y} anchor="c" vmid>
        <M tex={String.raw`X`} size={22} />
      </Lbl>
      <Lbl x={BOX.x} y={PIPE_Y} anchor="c" vmid style={{ textAlign: "center", whiteSpace: "nowrap" }}>
        <M tex={String.raw`\text{encoder } p(t \mid x)`} size={15} />
      </Lbl>
      <Lbl x={T_NODE.x} y={PIPE_Y} anchor="c" vmid>
        <M tex={String.raw`T`} size={22} />
      </Lbl>

      {/* ══ "only object chosen" bracket label ══ */}
      <Lbl x={(X_NODE.x + T_NODE.x) / 2} y={PIPE_Y + 40} anchor="c" style={{ ...labelMuted, fontSize: 12.5, textAlign: "center" }}>
        the only object chosen
      </Lbl>

      {/* ══ crossed-arc label ══ */}
      <Lbl x={241} y={PIPE_Y - 96} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, maxWidth: 210 }}>
        <div style={{ ...labelMuted, fontSize: 12 }}>
          the encoder never sees <M tex={String.raw`\textcolor{${ACCENT}}{Y}`} size={12} />
        </div>
      </Lbl>
    </div>
  );
}
