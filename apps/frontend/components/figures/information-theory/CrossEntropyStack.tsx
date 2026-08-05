import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * CrossEntropyStack — the lesson's headline identity dissected in place
 * (playbook rule 7). Top: the equation H(p,q) = H(p) + D(p‖q) in large KaTeX,
 * each term tagged by a short label on a thin arrow:
 *   H(p,q)  — "average log-loss / coding cost"  (currentColor, the whole)
 *   H(p)    — "data's entropy — irreducible floor"  (blue, the floor)
 *   D(p‖q)  — "model's excess — ≥ 0, zero iff q = p"  (amber, the excess)
 * Below: one horizontal stacked bar on a bits-axis grounds the identity in the
 * running source p = (.5,.25,.15,.1) under a uniform model q:
 *   blue  0 .. 1.743  H(p) = 1.743   (the floor, identical under any model)
 *   amber 1.743 .. 2  D = 0.257      (the excess this model pays)
 * A bracket over the whole bar reads H(p,q) = 2.000 bits.
 *
 * One idea: the loss splits into a floor the model cannot touch plus a
 * mismatch the model can remove. Inspiration: Cover & Thomas §5.4.
 */

const W = 700;
const HGT = 292;

// ── bits-axis / bar geometry ──
const X0 = 150; // bits = 0
const PPB = 230; // px per bit
const xOf = (v: number) => X0 + v * PPB;
const HVAL = 1.7427; // H(p)
const LVAL = 2.0; // H(p,q)
const AXMAX = 2.1;
const XH = xOf(HVAL); // blue/amber seam
const XEND = xOf(LVAL); // bar end

const BRACKET_LABEL_Y = 110;
const BRACKET_Y = 150;
const BAR_Y = 157;
const BAR_H = 40;
const BAR_BOT = BAR_Y + BAR_H;
const SEG_LABEL_Y = BAR_BOT + 6;
const AXIS_Y = 234;
const PAYOFF_Y = 268;

// ── equation term centers (visually centered near W/2) ──
const EQ_MID_Y = 92;
const EQ_TOP = 76; // arrow target height (just above the term boxes)
const xCost = 258; // H(p,q)
const xEqSign = 308; // =
const xFloor = 349; // H(p)
const xPlus = 390; // +
const xExc = 441; // D(p‖q)

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

/** thin arrow with a small two-stroke head at (x2,y2). */
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = "currentColor",
  op = 0.65,
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

export default function CrossEntropyStack() {
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
        {/* ── arrows from each tag onto its exact term ── */}
        <Arrow x1={215} y1={46} x2={xCost} y2={EQ_TOP} />
        <Arrow x1={355} y1={46} x2={xFloor} y2={EQ_TOP} color={SUPPORT} op={0.85} />
        <Arrow x1={498} y1={46} x2={xExc} y2={EQ_TOP} color={ACCENT} op={0.9} />

        {/* ── bracket over the whole bar: the total H(p,q) ── */}
        <path
          d={`M ${X0} ${BRACKET_Y + 6} L ${X0} ${BRACKET_Y} L ${XEND} ${BRACKET_Y} L ${XEND} ${BRACKET_Y + 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <path
          d={`M ${(X0 + XEND) / 2} ${BRACKET_Y} L ${(X0 + XEND) / 2} ${BRACKET_Y - 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />

        {/* ── the stacked bar: blue floor + amber excess ── */}
        <rect x={X0} y={BAR_Y} width={XH - X0} height={BAR_H} fill={SUPPORT} opacity="0.85" />
        <rect x={XH} y={BAR_Y} width={XEND - XH} height={BAR_H} fill={ACCENT} opacity="0.92" />
        {/* hairline outline of the whole bar for definition */}
        <rect
          x={X0}
          y={BAR_Y}
          width={XEND - X0}
          height={BAR_H}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        {/* seam accent */}
        <line x1={XH} y1={BAR_Y} x2={XH} y2={BAR_BOT} stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />

        {/* ── bits axis ── */}
        <line x1={X0} y1={AXIS_Y} x2={xOf(AXMAX)} y2={AXIS_Y} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <g key={v}>
            <line x1={xOf(v)} y1={AXIS_Y} x2={xOf(v)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <text x={xOf(v)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {v}
            </text>
          </g>
        ))}
        <text x={xOf(AXMAX) + 10} y={AXIS_Y + 4} fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits
        </text>
      </svg>

      {/* ══ top tags ══ */}
      <Lbl x={175} y={6} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, fontSize: 12 }}>
        <div>average log-loss /</div>
        <div>coding cost</div>
      </Lbl>
      <Lbl x={360} y={6} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, fontSize: 12, color: SUPPORT }}>
        <div>data&rsquo;s entropy &mdash;</div>
        <div>irreducible floor</div>
      </Lbl>
      <Lbl x={533} y={6} anchor="c" style={{ textAlign: "center", lineHeight: 1.25, fontSize: 12, color: ACCENT }}>
        <div>model&rsquo;s excess &mdash; &ge; 0,</div>
        <div>zero iff q = p</div>
      </Lbl>

      {/* ══ the identity, terms color-bound to their roles ══ */}
      <Lbl x={xCost} y={EQ_MID_Y} anchor="c" vmid>
        <M tex={String.raw`H(p,q)`} size={21} />
      </Lbl>
      <Lbl x={xEqSign} y={EQ_MID_Y} anchor="c" vmid>
        <M tex={String.raw`=`} size={21} />
      </Lbl>
      <Lbl x={xFloor} y={EQ_MID_Y} anchor="c" vmid>
        <M tex={String.raw`\textcolor{${SUPPORT}}{H(p)}`} size={21} />
      </Lbl>
      <Lbl x={xPlus} y={EQ_MID_Y} anchor="c" vmid>
        <M tex={String.raw`+`} size={21} />
      </Lbl>
      <Lbl x={xExc} y={EQ_MID_Y} anchor="c" vmid>
        <M tex={String.raw`\textcolor{${ACCENT}}{D(p\,\|\,q)}`} size={21} />
      </Lbl>

      {/* ══ bracket label: the total ══ */}
      <Lbl x={(X0 + XEND) / 2} y={BRACKET_LABEL_Y} anchor="c" style={{ textAlign: "center", lineHeight: 1.3 }}>
        <div style={{ fontSize: 14 }}>
          <M tex={String.raw`H(p,q) = 2.000\ \text{bits}`} />
        </div>
        <div style={{ ...labelMuted, fontSize: 11.5 }}>
          uniform model on <M tex={String.raw`p = (.5,.25,.15,.1)`} size={11} />
        </div>
      </Lbl>

      {/* ══ segment value labels below the bar ══ */}
      <Lbl x={(X0 + XH) / 2} y={SEG_LABEL_Y} anchor="c" style={{ color: SUPPORT }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{H(p) = 1.743}`} />
      </Lbl>
      <Lbl x={(XH + XEND) / 2} y={SEG_LABEL_Y} anchor="c" style={{ color: ACCENT }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{D = 0.257}`} />
      </Lbl>

      {/* ══ payoff line ══ */}
      <Lbl x={(X0 + XEND) / 2} y={PAYOFF_Y} anchor="c" style={{ ...labelMuted, fontSize: 12.5, fontStyle: "italic", opacity: 0.8 }}>
        training can shrink only the{" "}
        <span style={{ color: ACCENT, opacity: 1, fontStyle: "normal", fontWeight: 600 }}>amber</span> part
      </Lbl>
    </div>
  );
}
