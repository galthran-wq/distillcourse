import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * TrainingShrinksKl — FigureSequence, 4 frames. Gradient steps on log-loss
 * drive the model q toward the truth p; only the divergence shrinks, the
 * entropy floor stays fixed.
 *
 * Left: bar chart over symbols A,B,C,D. Solid blue bars are the fixed truth
 * p = (.5,.25,.15,.1) (values printed once); amber outlined bars overlay the
 * current model q. Right: one vertical stacked cost bar on a bits-axis 0..2.1
 * — the blue segment is always exactly H(p)=1.743 (pixel-identical in every
 * frame), the amber segment on top is the current D(p‖q); a readout
 * "H(p,q) = …" tracks the bar top.
 *   frame 1  q uniform (.25,.25,.25,.25)  D = 0.257  H(p,q)=2.000
 *   frame 2  q = (.35,.25,.20,.20)         D = 0.095  H(p,q)=1.838
 *   frame 3  q = (.45,.25,.17,.13)         D = 0.011  H(p,q)=1.753
 *   frame 4  q = p = (.5,.25,.15,.1)        D = 0      H(p,q)=1.743  (floor)
 *
 * Only the amber q-bars and amber cost segment change; blue stays fixed.
 * Color roles: blue = truth / entropy floor; amber = model / excess (KL).
 * One idea: training shrinks only the divergence, down to the fixed floor.
 * Inspiration: gradient descent on log-loss (research FIGURE PLAN item 2).
 */

const W = 740;
const HGT = 360;

// ── left probability chart ──────────────────────────────────────────────
const BASE = 290; // bar baseline (prob = 0)
const PH = 360; // px per unit probability
const BAR_W = 36;
const barX = (i: number) => 62 + i * 56;
const cx = (i: number) => barX(i) + BAR_W / 2;
const SYMBOLS = ["A", "B", "C", "D"];
const P = [0.5, 0.25, 0.15, 0.1];

// ── right cost bar ──────────────────────────────────────────────────────
const BASE2 = 290; // bits = 0
const BPP = 100; // px per bit
const yBit = (b: number) => BASE2 - b * BPP;
const H_P = 1.743;
const SEAM_Y = yBit(H_P); // fixed blue/amber boundary — pixel-identical
const CB_X = 490;
const CB_W = 46;
const CB_CX = CB_X + CB_W / 2;
const AX = 468; // bits axis, left of the bar
const RLBL_X = CB_X + CB_W + 12; // right-side labels start here

type Frame = {
  header: string;
  q: number[];
  D: number;
  Hpq: string;
  converged?: boolean;
};

const FRAMES: Frame[] = [
  { header: "step 0: uniform model", q: [0.25, 0.25, 0.25, 0.25], D: 0.257, Hpq: "2.000" },
  { header: "step 1", q: [0.35, 0.25, 0.2, 0.2], D: 0.095, Hpq: "1.838" },
  { header: "step 2", q: [0.45, 0.25, 0.17, 0.13], D: 0.011, Hpq: "1.753" },
  { header: "converged: q = p", q: [0.5, 0.25, 0.15, 0.1], D: 0, Hpq: "1.743", converged: true },
];

const fmt = (v: number) => (v === 0.5 ? ".5" : v.toString().replace(/^0/, ""));

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
    anchor === "c" ? "translate(-50%, -50%)" : anchor === "r" ? "translate(-100%, -50%)" : "translateY(-50%)";
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

export default function TrainingShrinksKl({ frame = 1 }: { frame?: number }) {
  const fr = FRAMES[Math.min(Math.max(frame, 1), FRAMES.length) - 1];
  const amberTopY = SEAM_Y - fr.D * BPP; // top of the stacked cost bar
  const amberH = fr.D * BPP;
  const amberMidY = SEAM_Y - amberH / 2;

  return (
    <div style={{ position: "relative", width: W, height: HGT, fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* ── left: probability bars ── */}
        {/* baseline */}
        <line x1={barX(0) - 12} y1={BASE} x2={barX(3) + BAR_W + 12} y2={BASE} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />

        {SYMBOLS.map((s, i) => {
          const pTop = BASE - P[i] * PH;
          const qTop = BASE - fr.q[i] * PH;
          return (
            <g key={s}>
              {/* blue solid: truth p (fixed) */}
              <rect x={barX(i)} y={pTop} width={BAR_W} height={BASE - pTop} fill={SUPPORT} opacity="0.85" />
              {/* amber outline: model q (current) */}
              <rect
                x={barX(i) - 2}
                y={qTop}
                width={BAR_W + 4}
                height={BASE - qTop}
                fill="none"
                stroke={ACCENT}
                strokeWidth="2"
              />
              {/* symbol label */}
              <text x={cx(i)} y={BASE + 18} textAnchor="middle" fontSize="13" fill="currentColor" opacity="0.75">
                {s}
              </text>
              {/* p value printed once, above the blue bar */}
              <text x={cx(i)} y={pTop - 7} textAnchor="middle" fontSize="11" fontWeight="600" fill={SUPPORT}>
                {fmt(P[i])}
              </text>
            </g>
          );
        })}

        {/* ── right: stacked cost bar ── */}
        {/* bits axis */}
        <line x1={AX} y1={yBit(0)} x2={AX} y2={yBit(2.1)} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        {[0, 0.5, 1, 1.5, 2].map((b) => (
          <g key={b}>
            <line x1={AX - 5} y1={yBit(b)} x2={AX} y2={yBit(b)} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <text x={AX - 9} y={yBit(b) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
              {b}
            </text>
          </g>
        ))}
        <text x={AX - 9} y={yBit(2.1) - 6} textAnchor="end" fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits
        </text>

        {/* fixed floor guide across the seam */}
        <line
          x1={AX}
          y1={SEAM_Y}
          x2={CB_X + CB_W + 20}
          y2={SEAM_Y}
          stroke={SUPPORT}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.5"
        />

        {/* blue floor segment: 0 .. H(p) — pixel-identical every frame */}
        <rect x={CB_X} y={SEAM_Y} width={CB_W} height={BASE2 - SEAM_Y} fill={SUPPORT} opacity="0.85" />
        {/* amber excess segment: H(p) .. H(p,q) = current D */}
        {amberH > 0 && <rect x={CB_X} y={amberTopY} width={CB_W} height={amberH} fill={ACCENT} opacity="0.92" />}
        {/* outline of the whole bar for definition */}
        <rect
          x={CB_X}
          y={amberTopY}
          width={CB_W}
          height={BASE2 - amberTopY}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
      </svg>

      {/* ── header ── */}
      <Lbl x={W / 2} y={16} anchor="c" style={{ fontSize: 15, fontWeight: 600 }}>
        {fr.header}
      </Lbl>

      {/* ── legend ── */}
      <Lbl x={60} y={54}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 15, height: 11, background: SUPPORT, opacity: 0.85, display: "inline-block" }} />
          <M tex={String.raw`\textcolor{${SUPPORT}}{\text{truth }p}`} size={12} />
        </span>
      </Lbl>
      <Lbl x={162} y={54}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 15, height: 11, border: `2px solid ${ACCENT}`, display: "inline-block", boxSizing: "border-box" }} />
          <M tex={String.raw`\textcolor{${ACCENT}}{\text{model }q}`} size={12} />
        </span>
      </Lbl>

      {/* ── cost-bar readout, fixed above the bar, clear of the axis ── */}
      <Lbl x={CB_CX} y={50} anchor="c" style={{ fontSize: 14, fontWeight: 600 }}>
        <M tex={String.raw`H(p,q) = ${fr.Hpq}\ \text{bits}`} size={13} />
      </Lbl>

      {/* ── blue segment label: the fixed floor ── */}
      <Lbl x={RLBL_X} y={(SEAM_Y + BASE2) / 2} style={{ color: SUPPORT }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{H(p) = 1.743}`} size={13} />
      </Lbl>

      {/* ── amber segment label: the current divergence ── */}
      {fr.converged ? (
        <>
          <Lbl x={RLBL_X} y={SEAM_Y + 8} style={{ color: ACCENT }}>
            <M tex={String.raw`\textcolor{${ACCENT}}{D(p\,\|\,q) = 0}`} size={13} />
          </Lbl>
          <Lbl x={W - 12} y={SEAM_Y - 16} anchor="r" style={{ color: ACCENT, fontSize: 12, fontStyle: "italic" }}>
            floor reached — Gibbs&rsquo; equality case
          </Lbl>
        </>
      ) : (
        <Lbl x={RLBL_X} y={amberMidY} style={{ color: ACCENT }}>
          <M tex={String.raw`\textcolor{${ACCENT}}{D(p\,\|\,q) = ${fr.D.toFixed(3)}}`} size={13} />
        </Lbl>
      )}

      {/* ── caption-ish subtitle under left chart ── */}
      <Lbl x={cx(0) - 6} y={BASE + 40} style={{ ...labelMuted, fontSize: 12 }}>
        each step pulls <M tex={String.raw`\textcolor{${ACCENT}}{q}`} size={11} /> toward{" "}
        <M tex={String.raw`\textcolor{${SUPPORT}}{p}`} size={11} />
      </Lbl>
    </div>
  );
}
