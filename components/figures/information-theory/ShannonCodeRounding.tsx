import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * ShannonCodeRounding — the Shannon code rounds each surprisal UP to the next
 * whole bit, and that rounding costs strictly less than one bit per symbol.
 *
 * Four column pairs over A, B, C, D on a shared vertical bits-axis (0–4). For
 * each symbol a blue bar of height = surprisal -log2 p(x) (1, 2, 2.737, 3.322)
 * sits inside an amber OUTLINE bar of height = ceiling code length (1, 2, 3, 4);
 * the strip between blue top and amber top is lightly amber-shaded — the
 * rounding gap. A and B round to themselves (gap 0); C and D pay 0.263 and
 * 0.678 bits. The tally beneath adds the four gaps: 0.107 bits above H, giving
 * L = 1.85, and since every gap is below one bit, L < H + 1.
 *
 * Source p = (.5, .25, .15, .1); H ≈ 1.743, L = 1.85 bits.
 *
 * One idea: rounding up costs less than one bit per symbol.
 */

const W = 560;
const HGT = 452;

// plot geometry — vertical bits-axis
const X0 = 58; // axis x (bits = 0 baseline of the bars is the axis foot)
const Y0 = 300; // y for bits = 0
const PPB = 58; // px per bit
const yOf = (bits: number) => Y0 - bits * PPB;
const PLOT_R = 522; // right extent of gridlines
const BW = 44; // bar width

type Sym = {
  c: string;
  p: string;
  s: number; // surprisal -log2 p
  sLabel: string;
  ceil: number; // ceiling code length
  gap: number;
  cx: number; // column centre
};

const SYMS: Sym[] = [
  { c: "A", p: ".5", s: 1, sLabel: "1", ceil: 1, gap: 0, cx: 118 },
  { c: "B", p: ".25", s: 2, sLabel: "2", ceil: 2, gap: 0, cx: 230 },
  { c: "C", p: ".15", s: 2.737, sLabel: "2.737", ceil: 3, gap: 0.263, cx: 342 },
  { c: "D", p: ".1", s: 3.322, sLabel: "3.322", ceil: 4, gap: 0.678, cx: 454 },
];

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
    anchor === "c" ? "translateX(-50%)" : anchor === "r" ? "translateX(-100%)" : undefined;
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

export default function ShannonCodeRounding() {
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
        {/* horizontal gridlines at each whole bit */}
        {[1, 2, 3, 4].map((b) => (
          <line
            key={`g${b}`}
            x1={X0}
            y1={yOf(b)}
            x2={PLOT_R}
            y2={yOf(b)}
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.1"
          />
        ))}

        {/* bits-axis: vertical line + ticks 0..4 */}
        <line x1={X0} y1={yOf(4)} x2={X0} y2={Y0} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        {[0, 1, 2, 3, 4].map((v) => (
          <g key={`t${v}`}>
            <line x1={X0 - 5} y1={yOf(v)} x2={X0} y2={yOf(v)} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <text x={X0 - 10} y={yOf(v) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
              {v}
            </text>
          </g>
        ))}
        <text x={X0 - 30} y={yOf(4) - 14} fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits
        </text>

        {/* baseline under the bars */}
        <line x1={X0} y1={Y0} x2={PLOT_R} y2={Y0} stroke="currentColor" strokeWidth="1.2" opacity="0.45" />

        {/* per-symbol column pairs */}
        {SYMS.map((d) => {
          const x = d.cx - BW / 2;
          const yS = yOf(d.s); // blue top
          const yC = yOf(d.ceil); // amber top
          return (
            <g key={d.c}>
              {/* blue solid bar = surprisal */}
              <rect x={x} y={yS} width={BW} height={Y0 - yS} fill={SUPPORT} opacity="0.85" />
              {/* rounding-gap strip (amber shaded) between blue top and amber top */}
              {d.gap > 0 && <rect x={x} y={yC} width={BW} height={yS - yC} fill={ACCENT} opacity="0.18" />}
              {/* amber outline bar = ceiling code length */}
              <rect
                x={x}
                y={yC}
                width={BW}
                height={Y0 - yC}
                fill="none"
                stroke={ACCENT}
                strokeWidth="1.6"
              />
              {/* column letter on the axis foot */}
              <text x={d.cx} y={Y0 + 20} textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">
                {d.c}
              </text>
              <text x={d.cx} y={Y0 + 36} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
                p = {d.p}
              </text>
            </g>
          );
        })}

        {/* leaders from the A/B "no gap" note down to the two bar tops */}
        <line x1={150} y1={132} x2={118} y2={yOf(1) - 3} stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <line x1={182} y1={132} x2={230} y2={yOf(2) - 3} stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>

      {/* ── legend ── */}
      <Lbl x={X0} y={0} style={{ display: "flex", gap: 22, alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 14, height: 14, background: SUPPORT, opacity: 0.85, display: "inline-block" }} />
          <span style={{ color: SUPPORT }}>
            surprisal <M tex={String.raw`-\log_2 p(x)`} color={SUPPORT} size={12} />
          </span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 14,
              height: 14,
              border: `1.6px solid ${ACCENT}`,
              boxSizing: "border-box",
              display: "inline-block",
            }}
          />
          <span style={{ color: ACCENT }}>
            code length <M tex={String.raw`\lceil -\log_2 p(x)\rceil`} color={ACCENT} size={12} />
          </span>
        </span>
      </Lbl>

      {/* ── surprisal values at each blue bar top ── */}
      {SYMS.map((d) => (
        <Lbl key={`sv${d.c}`} x={d.cx} y={yOf(d.s) - 20} anchor="c" style={{ color: SUPPORT, fontSize: 12, fontWeight: 600 }}>
          {d.sLabel}
        </Lbl>
      ))}

      {/* ── A/B: no gap note ── */}
      <Lbl
        x={166}
        y={96}
        anchor="c"
        style={{
          ...labelMuted,
          fontSize: 12,
          textAlign: "center",
          whiteSpace: "normal",
          width: 150,
        }}
      >
        no gap — surprisal already integer
      </Lbl>

      {/* ── C, D gap labels beside the shaded strip ── */}
      <Lbl x={342 + BW / 2 + 8} y={(yOf(2.737) + yOf(3)) / 2 - 8} style={{ color: ACCENT, fontSize: 12 }}>
        gap 0.263
      </Lbl>
      <Lbl x={454 + BW / 2 + 8} y={(yOf(3.322) + yOf(4)) / 2 - 8} style={{ color: ACCENT, fontSize: 12 }}>
        gap 0.678
      </Lbl>

      {/* ── tally + payoff ── */}
      <Lbl x={X0} y={366}>
        <M
          display
          tex={String.raw`L \;=\; H + \underbrace{\textcolor{${ACCENT}}{0.107}}_{\text{expected rounding}} \;=\; 1.85\ \text{bits}`}
        />
      </Lbl>
      <Lbl x={X0} y={424} style={{ ...labelMuted, fontSize: 12 }}>
        <M tex={String.raw`H \approx 1.743`} size={12} /> ; each gap <M tex={String.raw`< 1`} size={12} /> bit, so{" "}
        <M tex={String.raw`L < H + 1`} size={12} />
      </Lbl>
    </div>
  );
}
