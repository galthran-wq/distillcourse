import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * IbGibbsEncoder — Theorem 4 (Tishby–Pereira–Bialek) dissected in place
 * (playbook rule 7: short labels above the equation, thin arrows onto the
 * exact symbols).
 *
 *   p(t|x) = [ p(t) / Z(x,β) ] · exp( −β · D( p(y|x) ‖ p(y|t) ) )
 *
 * Four tags:
 *   p(t)      (currentColor)        — "cluster prior"
 *   Z(x,β)    (currentColor, muted) — "normalizer over t"
 *   β         (currentColor)        — "price of a relevant bit"
 *   D(·‖·)    (amber)               — "the emergent distortion: how
 *                                      differently x and cluster t predict Y"
 *
 * Below: a concrete two-row instance for symbol a of the toy source. a
 * predicts Y as (1,0); joining t_ab (fields near-certain, D=0.193 bits) is
 * cheap and preferred (amber, ✓), joining t_ad (a fair coin, D=1 bit) is
 * costly (blue). The exponential weights favor the cluster that predicts Y
 * the way a does.
 *
 * One idea: the distortion is a KL, derived not chosen. Amber = the emergent
 * KL distortion and the preferred assignment (the subject); blue = the costly
 * assignment; currentColor = structure. Reuses the kl-divergence framing.
 */

const W = 720;
const H1 = 214; // equation-dissection band

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
const PT_T = { x: 236, y: 108 }; // p(t) numerator
const Z_T = { x: 236, y: 150 }; // Z(x,β) denominator
const BETA_T = { x: 356, y: 118 }; // −β inside exp
const KL_T = { x: 560, y: 118 }; // the KL divergence term

// only the KL term carries a role color; the rest stays structural currentColor
const EQ_TEX = String.raw`p(t \mid x)\;=\;\frac{p(t)}{Z(x,\beta)}\,\exp\!\Bigl(-\beta\,\textcolor{${ACCENT}}{D\bigl(p(y \mid x)\,\big\|\,p(y \mid t)\bigr)}\Bigr)`;

// ── concrete instance geometry ──
const BAR_W = 118;
const BAR_H = 16;

/** stacked two-outcome probability bar: p = P(y = y0), rest = P(y = y1). */
function ProbBar({ p, color }: { p: number; color: string }) {
  const w0 = p * BAR_W;
  return (
    <svg width={BAR_W} height={BAR_H} viewBox={`0 0 ${BAR_W} ${BAR_H}`} aria-hidden="true">
      <rect x={0} y={0} width={w0} height={BAR_H} fill={color} opacity={0.85} />
      <rect x={w0} y={0} width={BAR_W - w0} height={BAR_H} fill={color} opacity={0.2} />
      <rect
        x={0.5}
        y={0.5}
        width={BAR_W - 1}
        height={BAR_H - 1}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.35}
      />
      <line x1={w0} y1={0} x2={w0} y2={BAR_H} stroke="currentColor" strokeOpacity={0.35} />
    </svg>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        border: `1px solid ${color}`,
        borderRadius: 4,
        padding: "1px 6px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function IbGibbsEncoder() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: W }}>
      {/* ══════ the theorem, dissected in place ══════ */}
      <div style={{ position: "relative", width: W, height: H1 }}>
        <svg width={W} height={H1} viewBox={`0 0 ${W} ${H1}`} aria-hidden="true">
          {/* "cluster prior" → p(t) numerator */}
          <Arrow x1={196} y1={56} x2={PT_T.x} y2={PT_T.y} op={0.6} />
          {/* "price of a relevant bit" → −β */}
          <Arrow x1={356} y1={56} x2={BETA_T.x} y2={BETA_T.y} op={0.7} />
          {/* "the emergent distortion…" → the KL term (amber) */}
          <Arrow x1={560} y1={56} x2={KL_T.x} y2={KL_T.y} color={ACCENT} op={0.9} />
          {/* "normalizer over t" → Z(x,β) denominator, from below */}
          <Arrow x1={196} y1={196} x2={Z_T.x} y2={Z_T.y} op={0.45} />
        </svg>

        {/* top tags */}
        <Lbl x={196} y={24} anchor="c" style={{ textAlign: "center", lineHeight: 1.2, maxWidth: 160 }}>
          <div style={{ fontWeight: 600 }}>cluster prior</div>
        </Lbl>
        <Lbl x={356} y={24} anchor="c" style={{ textAlign: "center", lineHeight: 1.2, maxWidth: 150 }}>
          <div style={{ fontWeight: 600 }}>price of a</div>
          <div style={{ fontWeight: 600 }}>relevant bit</div>
        </Lbl>
        <Lbl
          x={560}
          y={12}
          anchor="c"
          style={{ textAlign: "center", lineHeight: 1.2, color: ACCENT, maxWidth: 300 }}
        >
          <div style={{ fontWeight: 600 }}>the emergent distortion:</div>
          <div style={{ fontWeight: 600 }}>how differently x and cluster t predict Y</div>
        </Lbl>

        {/* the equation, KL role-color bound inside the TeX */}
        <Lbl x={W / 2} y={126} anchor="c" vmid style={{ whiteSpace: "nowrap" }}>
          <M tex={EQ_TEX} size={26} />
        </Lbl>

        {/* bottom tag */}
        <Lbl
          x={196}
          y={200}
          anchor="c"
          style={{ ...labelMuted, textAlign: "center", fontSize: 12.5, maxWidth: 160 }}
        >
          normalizer over <M tex={String.raw`t`} size={12} />
        </Lbl>
      </div>

      {/* ══════ concrete instance: which cluster should symbol a join? ══════ */}
      <div
        style={{
          marginTop: 6,
          borderTop: "1px solid",
          borderColor: "currentColor",
          borderTopColor: "rgba(128,128,128,0.3)",
          paddingTop: 14,
        }}
      >
        <div style={{ ...labelMuted, fontSize: 12.5, fontStyle: "italic", marginBottom: 12 }}>
          concrete: symbol <M tex={String.raw`a`} size={12} /> of the toy predicts{" "}
          <M tex={String.raw`Y`} size={12} /> with certainty — which cluster should it join?
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto auto auto",
            columnGap: 16,
            rowGap: 10,
            alignItems: "center",
            justifyContent: "start",
          }}
        >
          {/* reference: a itself */}
          <div style={{ whiteSpace: "nowrap" }}>
            <M tex={String.raw`a`} size={13} /> predicts <M tex={String.raw`Y`} size={13} />
          </div>
          <ProbBar p={1} color={"currentColor"} />
          <div style={{ whiteSpace: "nowrap" }}>
            <M tex={String.raw`p(y \mid a) = (1, 0)`} size={13} />
          </div>
          <div style={{ ...labelMuted, fontSize: 12 }}>reference</div>

          {/* preferred: join t_ab (amber, ✓) */}
          <div style={{ whiteSpace: "nowrap", color: ACCENT }}>
            join <M tex={String.raw`\textcolor{${ACCENT}}{t_{ab}}`} size={13} />
          </div>
          <ProbBar p={7 / 8} color={ACCENT} />
          <div style={{ whiteSpace: "nowrap", color: ACCENT }}>
            <M tex={String.raw`\textcolor{${ACCENT}}{D = \log_2\tfrac{8}{7} \approx 0.193\ \text{bits}}`} size={13} />
          </div>
          <Badge color={ACCENT}>✓ preferred</Badge>

          {/* costly: join t_ad (blue) */}
          <div style={{ whiteSpace: "nowrap", color: SUPPORT }}>
            join <M tex={String.raw`\textcolor{${SUPPORT}}{t_{ad}}`} size={13} />
          </div>
          <ProbBar p={1 / 2} color={SUPPORT} />
          <div style={{ whiteSpace: "nowrap", color: SUPPORT }}>
            <M tex={String.raw`\textcolor{${SUPPORT}}{D = 1\ \text{bit}}`} size={13} />
          </div>
          <Badge color={SUPPORT}>penalized</Badge>
        </div>

        {/* legend for the bar outcomes + the gloss */}
        <div style={{ ...labelMuted, fontSize: 11.5, marginTop: 8 }}>
          bars: left block <M tex={String.raw`P(y{=}y_0)`} size={11} />, right block{" "}
          <M tex={String.raw`P(y{=}y_1)`} size={11} /> — the closer a cluster's block pattern is to{" "}
          <M tex={String.raw`a`} size={11} />&rsquo;s, the smaller <M tex={String.raw`D`} size={11} />
        </div>
        <div style={{ fontSize: 13, marginTop: 10, lineHeight: 1.4, maxWidth: 640 }}>
          the exponential weights{" "}
          <M tex={String.raw`e^{-\beta \textcolor{${ACCENT}}{D}}`} size={13} /> favor the cluster
          that predicts <M tex={String.raw`Y`} size={13} /> the way{" "}
          <M tex={String.raw`a`} size={13} /> does.
        </div>
      </div>
    </div>
  );
}
