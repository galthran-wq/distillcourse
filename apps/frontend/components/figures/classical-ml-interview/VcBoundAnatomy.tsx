import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * VcBoundAnatomy — a term-by-term dissection of the VC generalization bound
 * (LFD Theorem 2.5), tied back to the bias–variance U-curve.
 *
 * One idea: the abstract inequality
 *   E_out ≤ E_in + Ω(N, H, δ),  Ω = √( (8/N) ln(4 m_H(2N)/δ) )
 * is just "fit + penalty", and dialing model complexity trades the two off —
 * which is the bias–variance U-curve re-derived from a tail bound.
 *
 * Color roles are literal and bind label ↔ formula symbol ↔ inset curve:
 *   blue  = fit term   E_in        (driven down by training)
 *   amber = complexity term Ω       (grows with d_vc, shrinks like √(d_vc ln N / N))
 *   muted = confidence δ
 *   currentColor = the sum, the bound on E_out.
 *
 * Single component figure (no frames). Recreated in house style after
 * Abu-Mostafa et al., Learning From Data, Thm 2.5 — not copied.
 */

const FIT = SUPPORT; // blue
const CPLX = ACCENT; // amber

const W = 660;
const H = 484;

// ── the headline inequality ───────────────────────────────────────────────
const BOUND = String.raw`
E_{\text{out}}(g)\;\le\;
\textcolor{${FIT}}{E_{\text{in}}(g)}\;+\;
\underbrace{\textcolor{${CPLX}}{\sqrt{\dfrac{8}{N}\ln\dfrac{4\,m_{\mathcal H}(2N)}{\htmlStyle{opacity:0.55}{\delta}}}}}
_{\textstyle\textcolor{${CPLX}}{\Omega(N,\mathcal H,\delta)}}
`;

// ── U-curve inset geometry ────────────────────────────────────────────────
const IX0 = 205; // plot left  (d_vc = 0)
const IX1 = 495; // plot right (d_vc large)
const IY0 = 430; // plot bottom (value 0)
const IY1 = 345; // plot top
const VMAX = 1.18;

const ein = (t: number) => 0.86 * Math.exp(-2.7 * t) + 0.04; // blue, falling
const om = (t: number) => 0.07 + 0.9 * t * t; // amber, rising
const sum = (t: number) => ein(t) + om(t); // U-shaped

const xOf = (t: number) => IX0 + t * (IX1 - IX0);
const yOf = (v: number) => IY0 - (Math.min(v, VMAX) / VMAX) * (IY0 - IY1);

const curve = (f: (t: number) => number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    pts.push(`${xOf(t).toFixed(1)} ${yOf(f(t)).toFixed(1)}`);
  }
  return "M " + pts.join(" L ");
};

// argmin of the sum → d_vc*
let TSTAR = 0;
{
  let best = Infinity;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const s = sum(t);
    if (s < best) {
      best = s;
      TSTAR = t;
    }
  }
}

// ── small label with a thin leader line ───────────────────────────────────
function Label({
  x,
  y,
  width,
  align = "left",
  color,
  opacity = 1,
  children,
}: {
  x: number;
  y: number;
  width?: number;
  align?: "left" | "right" | "center";
  color?: string;
  opacity?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: align === "right" ? undefined : x,
        right: align === "right" ? W - x : undefined,
        top: y,
        width,
        textAlign: align,
        color,
        opacity,
        fontSize: 12.5,
        lineHeight: 1.3,
        whiteSpace: width ? "normal" : "nowrap",
      }}
    >
      {children}
    </div>
  );
}

export default function VcBoundAnatomy() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        boxSizing: "border-box",
      }}
    >
      {/* graphics layer: leaders, annotation arrows, inset plot */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden="true"
      >
        {/* leader lines — tuned to the rendered formula */}
        {/* fit term → E_in */}
        <path d="M 150 66 L 214 134" stroke={FIT} strokeWidth="1" fill="none" opacity="0.8" />
        {/* complexity term → root */}
        <path d="M 470 60 L 404 108" stroke={CPLX} strokeWidth="1" fill="none" opacity="0.8" />
        {/* confidence → δ */}
        <path d="M 542 160 L 500 162" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.45" strokeDasharray="2 2" />

        {/* ── inset plot ── */}
        {/* axes */}
        <line x1={IX0} y1={IY0} x2={IX1 + 6} y2={IY0} stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
        <line x1={IX0} y1={IY1 - 6} x2={IX0} y2={IY0} stroke="currentColor" strokeWidth="1.1" opacity="0.55" />

        {/* dashed vertical at the minimum */}
        <line
          x1={xOf(TSTAR)}
          y1={yOf(sum(TSTAR))}
          x2={xOf(TSTAR)}
          y2={IY0}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.55"
        />
        <circle cx={xOf(TSTAR)} cy={yOf(sum(TSTAR))} r="3" fill="currentColor" opacity="0.75" />

        {/* the three curves */}
        <path d={curve(sum)} fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.85" />
        <path d={curve(ein)} fill="none" stroke={FIT} strokeWidth="2.2" />
        <path d={curve(om)} fill="none" stroke={CPLX} strokeWidth="2.2" />
      </svg>

      {/* ── the headline inequality ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 96,
          textAlign: "center",
        }}
      >
        <M tex={BOUND} display size={21} />
      </div>

      {/* term labels with leaders */}
      <Label x={30} y={40} width={135} color={FIT}>
        <b>fit term</b> — driven down by training
      </Label>

      <Label x={470} y={22} width={175} color={CPLX}>
        <b>complexity term</b> — grows with <M tex="d_{\text{vc}}" size={12} color={CPLX} />, shrinks like{" "}
        <M tex={String.raw`\sqrt{d_{\text{vc}}\ln N / N}`} size={12} color={CPLX} />
      </Label>

      <Label x={548} y={152} opacity={0.55}>
        confidence
      </Label>

      {/* ── two annotation arrows beneath the formula ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 252,
          display: "flex",
          justifyContent: "center",
          gap: 30,
          fontSize: 12.5,
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>
          <span style={{ opacity: 0.55 }}>more flexible </span>
          <M tex={String.raw`\mathcal H`} size={12.5} />
          <span style={{ opacity: 0.55 }}>: </span>
          <M tex={String.raw`E_{\text{in}}\!\downarrow`} size={12.5} color={FIT} />
          <span style={{ opacity: 0.55 }}>, </span>
          <M tex={String.raw`\Omega\!\uparrow`} size={12.5} color={CPLX} />
        </span>
        <span style={{ whiteSpace: "nowrap" }}>
          <span style={{ opacity: 0.55 }}>more data: </span>
          <M tex={String.raw`\Omega\!\downarrow`} size={12.5} color={CPLX} />
        </span>
      </div>

      {/* ── inset labels ── */}
      {/* curve labels */}
      <Label x={IX0 + 6} y={IY1 - 20} color={FIT}>
        <M tex={String.raw`E_{\text{in}}`} size={12.5} color={FIT} />
      </Label>
      <Label x={IX1 - 42} y={IY1 - 20} color={CPLX}>
        <M tex={String.raw`\Omega`} size={12.5} color={CPLX} />
      </Label>
      <Label x={IX1 + 8} y={yOf(sum(1)) - 8}>
        bound on <M tex={String.raw`E_{\text{out}}`} size={12} />
      </Label>

      {/* d_vc* under the dashed line */}
      <Label x={xOf(TSTAR)} y={IY0 + 6} align="center">
        <M tex={String.raw`d_{\text{vc}}^{\,*}`} size={12.5} />
      </Label>

      {/* x-axis title */}
      <Label x={IX1 + 8} y={IY0 - 6} opacity={0.6}>
        <M tex={String.raw`d_{\text{vc}}` } size={12} /> <span style={{ fontSize: 11 }}>(complexity)</span>
      </Label>

      {/* one-line strip under the inset */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H - 22,
          textAlign: "center",
          fontStyle: "italic",
          fontSize: 12,
          opacity: 0.6,
        }}
      >
        the U-curve of bias–variance, re-derived from a tail bound
      </div>
    </div>
  );
}
