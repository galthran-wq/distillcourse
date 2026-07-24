import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * NeuralCodecLoop — the learned compression pipeline, the rate–distortion
 * objective made trainable. Simplified from Ballé, Laparra & Simoncelli (2017)
 * fig. 1 (recreated in house style, not copied).
 *
 * Left-to-right data flow:
 *   image x -> [encoder network] -> latent y -> [quantize ⌊·⌉] -> ŷ ->
 *   [entropy code] -> bitstream (amber, R = E[-log2 p(ŷ)]) -> [decoder
 *   network] -> reconstruction x̂. A dashed blue comparison arc runs from x̂
 *   back to x, annotated D = E[d(x, x̂)].
 *
 * Below: the trainable objective min R + λD (R amber, D blue) beside a small
 * λ dial — a mini R–D curve with three operating points, "λ small: few bits"
 * (low rate, high distortion) and "λ large: high fidelity" (high rate, low
 * distortion), λ sweeping the curve.
 *
 * Color roles: amber = the rate term and its pipeline stage (entropy coder +
 * bitstream); blue = the distortion term and its comparison arc; currentColor
 * = encoder/quantizer/decoder boxes and the data flow.
 *
 * One idea: the rate–distortion trade-off written as a single trainable loss,
 * λ selecting the operating point on the curve.
 */

const W = 700;
const H = 356;

const CY = 128; // pipeline vertical center
const BOX_H = 46;
const BOX_TOP = CY - BOX_H / 2; // 105
const THUMB = 40;
const THUMB_TOP = CY - THUMB / 2; // 108

// node geometry: [center, halfWidth]
const XTHUMB = 40;
const ENC = { c: 132, w: 86 };
const QNT = { c: 246, w: 88 };
const ENT = { c: 360, w: 92 };
const BITS = { x0: 414, x1: 488 }; // bitstream glyph span
const DEC = { c: 540, w: 86 };
const XHAT = 632;

const boxL = (b: { c: number; w: number }) => b.c - b.w / 2;
const boxR = (b: { c: number; w: number }) => b.c + b.w / 2;

// mini R–D curve (the λ dial), right of the objective
const AX0 = 470; // rate axis origin x
const AX1 = 682;
const AYB = 326; // distortion axis origin y (bottom)
const AYT = 212; // top
// convex, decreasing frontier
const CURVE = `M488 232 C 528 302, 592 314, 664 317`;
// three operating points, placed on the frontier
const P_LO = { x: 512, y: 256 }; // λ small: few bits (low R, high D)
const P_MID = { x: 566, y: 288 }; // current operating point
const P_HI = { x: 640, y: 314 }; // λ large: high fidelity (high R, low D)

function Lbl({
  x,
  y,
  children,
  anchor = "c",
  style,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "l" | "c" | "r";
  style?: CSSProperties;
}) {
  const transform =
    anchor === "c"
      ? "translate(-50%, -50%)"
      : anchor === "r"
        ? "translate(-100%, -50%)"
        : "translateY(-50%)";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.25,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Box({
  b,
  amber = false,
}: {
  b: { c: number; w: number };
  amber?: boolean;
}) {
  return (
    <rect
      x={boxL(b)}
      y={BOX_TOP}
      width={b.w}
      height={BOX_H}
      rx="8"
      fill={amber ? "rgba(226,144,58,0.10)" : "none"}
      stroke={amber ? ACCENT : "currentColor"}
      strokeOpacity={amber ? 1 : 0.5}
      strokeWidth="1.4"
    />
  );
}

function Thumb({ cx, recon = false }: { cx: number; recon?: boolean }) {
  const op = recon ? 0.5 : 0.85;
  return (
    <g opacity={recon ? 0.9 : 1}>
      <rect
        x={cx - THUMB / 2}
        y={THUMB_TOP}
        width={THUMB}
        height={THUMB}
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.6"
        strokeWidth="1.4"
        strokeDasharray={recon ? "3 2" : undefined}
      />
      {/* sun */}
      <circle cx={cx + 9} cy={THUMB_TOP + 12} r="4.5" fill="currentColor" opacity={op * 0.6} />
      {/* mountains */}
      <path
        d={`M${cx - 18} ${THUMB_TOP + 36} L${cx - 6} ${THUMB_TOP + 18} L${cx + 3} ${THUMB_TOP + 28} L${cx + 9} ${THUMB_TOP + 20} L${cx + 18} ${THUMB_TOP + 36} Z`}
        fill="currentColor"
        opacity={op}
      />
    </g>
  );
}

function Flow({ x1, x2 }: { x1: number; x2: number }) {
  return (
    <line
      x1={x1}
      y1={CY}
      x2={x2}
      y2={CY}
      stroke="currentColor"
      strokeOpacity="0.65"
      strokeWidth="1.5"
      markerEnd="url(#ncl-flow)"
    />
  );
}

export default function NeuralCodecLoop() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        maxWidth: "100%",
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <marker id="ncl-flow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" fillOpacity="0.65" />
          </marker>
          <marker id="ncl-arc" markerWidth="10" markerHeight="10" refX="7" refY="4.5" orient="auto">
            <path d="M0 0 L9 4.5 L0 9 Z" fill={SUPPORT} />
          </marker>
          <marker id="ncl-axis" markerWidth="9" markerHeight="9" refX="6" refY="4" orient="auto">
            <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" fillOpacity="0.55" />
          </marker>
          <marker id="ncl-sweepa" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0 0 L7 4 L0 8 Z" fill={ACCENT} fillOpacity="0.8" />
          </marker>
        </defs>

        {/* ── comparison arc: x̂ back to x (blue, dashed) ── */}
        <path
          d={`M${XHAT} ${THUMB_TOP - 2} C ${XHAT} 40, ${XTHUMB} 40, ${XTHUMB} ${THUMB_TOP - 2}`}
          fill="none"
          stroke={SUPPORT}
          strokeWidth="1.6"
          strokeDasharray="5 4"
          strokeOpacity="0.9"
          markerEnd="url(#ncl-arc)"
        />

        {/* ── thumbnails ── */}
        <Thumb cx={XTHUMB} />
        <Thumb cx={XHAT} recon />

        {/* ── boxes ── */}
        <Box b={ENC} />
        <Box b={QNT} />
        <Box b={ENT} amber />
        <Box b={DEC} />

        {/* ── flow arrows ── */}
        <Flow x1={XTHUMB + THUMB / 2} x2={boxL(ENC) - 3} />
        <Flow x1={boxR(ENC)} x2={boxL(QNT) - 3} />
        <Flow x1={boxR(QNT)} x2={boxL(ENT) - 3} />
        <Flow x1={boxR(ENT)} x2={BITS.x0 - 2} />
        <Flow x1={BITS.x1 + 2} x2={boxL(DEC) - 3} />
        <Flow x1={boxR(DEC)} x2={XHAT - THUMB / 2 - 3} />

        {/* ── bitstream glyph (amber) ── */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            x={BITS.x0 + 2 + i * 9}
            y={CY - 8 + (i % 2 === 0 ? 0 : 4)}
            width={5}
            height={i % 2 === 0 ? 16 : 12}
            rx="1"
            fill={ACCENT}
            opacity="0.9"
          />
        ))}

        {/* connector: quantizer box down to its training note */}
        <line
          x1={QNT.c}
          y1={BOX_TOP + BOX_H}
          x2={QNT.c}
          y2={BOX_TOP + BOX_H + 12}
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="1"
          strokeDasharray="2 2"
        />

        {/* ── mini R–D curve axes ── */}
        <line x1={AX0} y1={AYB} x2={AX1 + 6} y2={AYB} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.3" markerEnd="url(#ncl-axis)" />
        <line x1={AX0} y1={AYB} x2={AX0} y2={AYT - 6} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.3" markerEnd="url(#ncl-axis)" />

        {/* the R–D frontier */}
        <path d={CURVE} fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.7" />

        {/* leader lines from labels to the extreme points */}
        <line x1={P_LO.x} y1={P_LO.y} x2={555} y2={236} stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />
        <line x1={P_HI.x} y1={P_HI.y} x2={618} y2={266} stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />

        {/* current point + the dial sweeping the frontier (tangent double-arrow) */}
        <line
          x1={P_MID.x - 24}
          y1={P_MID.y - 8}
          x2={P_MID.x + 26}
          y2={P_MID.y + 9}
          stroke={ACCENT}
          strokeOpacity="0.7"
          strokeWidth="1.3"
          markerStart="url(#ncl-sweepa)"
          markerEnd="url(#ncl-sweepa)"
        />

        {/* three operating points */}
        <circle cx={P_LO.x} cy={P_LO.y} r="4" fill="currentColor" opacity="0.8" />
        <circle cx={P_HI.x} cy={P_HI.y} r="4" fill="currentColor" opacity="0.8" />
        <circle cx={P_MID.x} cy={P_MID.y} r="5.5" fill="var(--paper, #fff)" stroke={ACCENT} strokeWidth="2.2" />
      </svg>

      {/* ── comparison-arc label (blue) ── */}
      <Lbl x={(XTHUMB + XHAT) / 2} y={30} style={{ color: SUPPORT, fontWeight: 600 }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{D} = \mathbb{E}\!\left[\,d(x,\hat x)\right]`} size={13} />
      </Lbl>

      {/* ── thumbnail labels ── */}
      <Lbl x={XTHUMB} y={THUMB_TOP + THUMB + 12} style={{ opacity: 0.85 }}>
        <M tex="x" size={14} />
      </Lbl>
      <Lbl x={XHAT} y={THUMB_TOP + THUMB + 12} style={{ opacity: 0.85 }}>
        <M tex={String.raw`\hat x`} size={14} />
      </Lbl>

      {/* ── box labels ── */}
      <Lbl x={ENC.c} y={CY} style={{ textAlign: "center", fontWeight: 500 }}>
        encoder
        <br />
        network
      </Lbl>
      <Lbl x={QNT.c} y={CY} style={{ textAlign: "center", fontWeight: 500 }}>
        quantize
        <br />
        <M tex={String.raw`\lfloor \cdot \rceil`} size={13} />
      </Lbl>
      <Lbl x={ENT.c} y={CY} style={{ textAlign: "center", fontWeight: 500, color: ACCENT }}>
        entropy
        <br />
        code
      </Lbl>
      <Lbl x={DEC.c} y={CY} style={{ textAlign: "center", fontWeight: 500 }}>
        decoder
        <br />
        network
      </Lbl>

      {/* ── signal labels on the arrows ── */}
      <Lbl x={(boxR(ENC) + boxL(QNT)) / 2} y={CY - 16} style={{ opacity: 0.7 }}>
        <M tex="y" size={12} />
      </Lbl>
      <Lbl x={(boxR(QNT) + boxL(ENT)) / 2} y={CY - 16} style={{ opacity: 0.7 }}>
        <M tex={String.raw`\hat y`} size={12} />
      </Lbl>

      {/* ── rate annotation under the bitstream (amber) ── */}
      <Lbl x={(BITS.x0 + BITS.x1) / 2} y={CY + 34} style={{ color: ACCENT, fontWeight: 600 }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{R} = \mathbb{E}\!\left[-\log_2 p(\hat y)\right]`} size={13} />
      </Lbl>

      {/* ── quantizer training note (muted) ── */}
      <Lbl
        x={QNT.c}
        y={CY + 44}
        style={{ width: 168, textAlign: "center", fontSize: 11, opacity: 0.55, fontStyle: "italic" }}
      >
        training: rounding → +uniform noise (differentiable)
      </Lbl>

      {/* ── training objective (left of the dial) ── */}
      <Lbl x={210} y={252} style={{ fontSize: 12, opacity: 0.55 }}>
        trainable objective
      </Lbl>
      <Lbl x={210} y={286}>
        <M
          tex={String.raw`\min_{\text{enc},\,\text{dec}}\;\; \textcolor{${ACCENT}}{R} \;+\; \lambda\,\textcolor{${SUPPORT}}{D}`}
          size={19}
        />
      </Lbl>

      {/* ── R–D curve axis labels ── */}
      <Lbl x={AX1 + 4} y={AYB + 16} anchor="r" style={{ color: ACCENT, fontSize: 11.5 }}>
        <M tex={String.raw`\text{rate }\textcolor{${ACCENT}}{R}`} size={11.5} />
      </Lbl>
      <Lbl x={AX0 - 4} y={AYT - 2} anchor="r" style={{ color: SUPPORT, fontSize: 11.5 }}>
        <M tex={String.raw`\text{distortion }\textcolor{${SUPPORT}}{D}`} size={11.5} />
      </Lbl>

      {/* ── operating-point labels (into open space, via leaders) ── */}
      <Lbl x={558} y={228} anchor="l" style={{ fontSize: 11, opacity: 0.75, textAlign: "left" }}>
        <span style={{ fontStyle: "italic" }}>λ</span> small:
        <br />
        few bits
      </Lbl>
      <Lbl x={622} y={262} anchor="l" style={{ fontSize: 11, opacity: 0.75, textAlign: "left" }}>
        <span style={{ fontStyle: "italic" }}>λ</span> large:
        <br />
        high fidelity
      </Lbl>
    </div>
  );
}
