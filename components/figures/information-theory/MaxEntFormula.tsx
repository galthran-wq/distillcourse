import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * MaxEntFormula — the maximum-entropy solution dissected in place (playbook
 * rule 7), previewing the shape of the general answer just before the theorem.
 *
 *   p*(x) = e^{-Σ_r λ_r f_r(x)} / Z(λ)
 *
 * Short tags on thin arrows onto the exact symbols:
 *   f_r(x)  (blue)         — "the constrained quantity"
 *   λ_r     (amber)        — "one multiplier per constraint, tuned so ⟨f_r⟩ = α_r"
 *   Z(λ)    (currentColor) — "the normalization — the partition function",
 *                            with the side note ⟨f_r⟩ = −∂ ln Z / ∂λ_r
 *
 * One idea: every piece is either a constraint (blue), its multiplier (amber),
 * or bookkeeping (the partition function). Amber = the tunable subject.
 */

const W = 680;
const HGT = 360;

const EQ_MID_Y = 178; // vertical center of the big equation

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
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  op?: number;
}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 6;
  const a1 = ang + Math.PI - 0.45;
  const a2 = ang + Math.PI + 0.45;
  return (
    <g stroke={color} strokeWidth="1.1" opacity={op} fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path d={`M ${x2} ${y2} L ${x2 + ah * Math.cos(a1)} ${y2 + ah * Math.sin(a1)}`} />
      <path d={`M ${x2} ${y2} L ${x2 + ah * Math.cos(a2)} ${y2 + ah * Math.sin(a2)}`} />
    </g>
  );
}

// ── arrow targets onto the exact symbols (tuned against the render) ──
const LAMBDA_T = { x: 422, y: 152 }; // λ_r in the exponent
const F_T = { x: 460, y: 144 }; // f_r(x) in the exponent
const Z_T = { x: 418, y: 200 }; // Z(λ) in the denominator

const EQ_TEX = String.raw`p^{\ast}(x)\;=\;\dfrac{e^{\,-\sum_r \textcolor{${ACCENT}}{\lambda_r}\,\textcolor{${SUPPORT}}{f_r(x)}}}{Z(\lambda)}`;

export default function MaxEntFormula() {
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
        {/* λ_r tag → the multiplier (amber) */}
        <Arrow x1={215} y1={80} x2={LAMBDA_T.x} y2={LAMBDA_T.y} color={ACCENT} op={0.9} />
        {/* f_r(x) tag → the constraint function (blue) */}
        <Arrow x1={562} y1={82} x2={F_T.x} y2={F_T.y} color={SUPPORT} op={0.9} />
        {/* Z(λ) tag → the normalization (currentColor) */}
        <Arrow x1={352} y1={256} x2={Z_T.x} y2={Z_T.y} op={0.6} />
      </svg>

      {/* ══ top tags ══ */}
      <Lbl x={210} y={16} anchor="c" style={{ textAlign: "center", lineHeight: 1.3, color: ACCENT, maxWidth: 300 }}>
        <div style={{ fontWeight: 600 }}>
          <M tex={String.raw`\textcolor{${ACCENT}}{\lambda_r}`} size={14} /> — one multiplier per constraint
        </div>
        <div style={{ fontSize: 12 }}>
          tuned so <M tex={String.raw`\langle f_r \rangle = \alpha_r`} size={12} />
        </div>
      </Lbl>

      <Lbl x={548} y={28} anchor="c" style={{ textAlign: "center", lineHeight: 1.3, color: SUPPORT, maxWidth: 240 }}>
        <div style={{ fontWeight: 600 }}>
          <M tex={String.raw`\textcolor{${SUPPORT}}{f_r(x)}`} size={14} /> — the
        </div>
        <div>constrained quantity</div>
      </Lbl>

      {/* ══ the equation, roles color-bound inside the TeX ══ */}
      <Lbl x={W / 2} y={EQ_MID_Y} anchor="c" vmid style={{ whiteSpace: "nowrap" }}>
        <M tex={EQ_TEX} size={30} />
      </Lbl>

      {/* ══ bottom tag: the partition function ══ */}
      <Lbl x={W / 2} y={268} anchor="c" style={{ textAlign: "center", lineHeight: 1.4, maxWidth: 560 }}>
        <div style={{ fontSize: 14 }}>
          <M tex={String.raw`Z(\lambda) = \sum_x e^{\,-\sum_r \lambda_r f_r(x)}`} size={14} />
        </div>
        <div style={{ ...labelMuted, fontSize: 12.5 }}>
          the normalization — the <b style={{ fontWeight: 600, opacity: 1 }}>partition function</b>
        </div>
        <div style={{ ...labelMuted, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
          side note: <M tex={String.raw`\langle f_r \rangle = -\,\partial \ln Z / \partial \lambda_r`} size={12} />
        </div>
      </Lbl>
    </div>
  );
}
