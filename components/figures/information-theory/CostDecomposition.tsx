import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * CostDecomposition — the wrong-code identity L = H(p) + D(p||q) + slack,
 * dissected as two stacked bars over one shared bits-axis.
 *
 * Running source p = (.5, .25, .15, .1), H(p) ≈ 1.743. Both codes are complete
 * (Kraft equality), so slack = log2(1/c) = 0 and L = H(p) + D(p||q).
 *   Top ("balanced code", lengths 2,2,2,2): L = 2.00 = 1.743 + 0.257. The amber
 *     mismatch D = 0.257 is a visible slab — betting uniform on a skewed source.
 *   Bottom ("matched code", lengths 1,2,3,3): L = 1.75 = 1.743 + 0.007. The
 *     amber mismatch is a hair-thin sliver, called out with a leader.
 * Blue is the entropy floor (identical in both bars); amber is the mismatch.
 *
 * One idea: cost = floor + mismatch. Forward-binds to kl-divergence.
 */

const W = 640;
const HGT = 236;
const X0 = 130; // bits = 0
const PPB = 185; // px per bit
const xOf = (v: number) => X0 + v * PPB;

const H = 1.743;
const BAR_H = 30;
const BAR1_Y = 100; // balanced code
const BAR2_Y = 142; // matched code
const AXIS_Y = 190;

const HX = xOf(H); // shared blue/amber boundary
const L1 = 2.0; // balanced
const L2 = 1.75; // matched

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

/** blue floor segment + amber mismatch segment for one code. */
function Bar({ y, l }: { y: number; l: number }) {
  // The mismatch can be a hair thin (matched code, 0.007 bit ≈ 1.3px); render a
  // small perceptible nub so the D-callout leader has an amber target.
  const amberW = Math.max(xOf(l) - HX, 3.5);
  return (
    <g>
      {/* blue: the entropy floor, 0..H */}
      <rect x={X0} y={y} width={HX - X0} height={BAR_H} fill={SUPPORT} opacity="0.85" />
      {/* amber: the mismatch, H..L */}
      <rect x={HX} y={y} width={amberW} height={BAR_H} fill={ACCENT} opacity="0.92" />
      {/* hairline outline of the whole bar for definition */}
      <rect
        x={X0}
        y={y}
        width={xOf(l) - X0}
        height={BAR_H}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.3"
      />
    </g>
  );
}

export default function CostDecomposition() {
  return (
    <div style={{ position: "relative", width: W, height: HGT, fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* shared entropy floor: subtle blue guide through both blue/amber seams */}
        <line
          x1={HX}
          y1={BAR1_Y - 10}
          x2={HX}
          y2={BAR2_Y + BAR_H + 6}
          stroke={SUPPORT}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.5"
        />

        <Bar y={BAR1_Y} l={L1} />
        <Bar y={BAR2_Y} l={L2} />

        {/* leader from the hair-thin bottom sliver down to its D = 0.007 label */}
        <path
          d={`M ${(HX + xOf(L2)) / 2} ${BAR2_Y + BAR_H} L ${xOf(1.62)} ${AXIS_Y + 22}`}
          stroke={ACCENT}
          strokeWidth="1.1"
          fill="none"
          opacity="0.8"
        />

        {/* axis */}
        <line x1={X0} y1={AXIS_Y} x2={xOf(2.12)} y2={AXIS_Y} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        {[0, 0.5, 1, 1.5, 2].map((v) => (
          <g key={v}>
            <line x1={xOf(v)} y1={AXIS_Y} x2={xOf(v)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <text x={xOf(v)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {v}
            </text>
          </g>
        ))}
        <text x={xOf(2.12) + 10} y={AXIS_Y + 4} fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits
        </text>
      </svg>

      {/* ── identity, color-bound terms ── */}
      <Lbl x={W / 2} y={0} anchor="c" style={{ fontSize: 15 }}>
        <M
          tex={String.raw`L \;=\; \textcolor{${SUPPORT}}{H(p)} \;+\; \textcolor{${ACCENT}}{D(p\,\|\,q)} \;+\; \log_2\tfrac{1}{c}`}
        />
      </Lbl>
      <Lbl x={W / 2} y={32} anchor="c" style={{ ...labelMuted, fontSize: 12 }}>
        both codes complete: slack <M tex={String.raw`= \log_2\tfrac{1}{c} = 0`} size={11} />
      </Lbl>

      {/* ── segment labels above the top bar ── */}
      <Lbl x={(X0 + HX) / 2} y={62} anchor="c" style={{ color: SUPPORT }}>
        <M tex={String.raw`\textcolor{${SUPPORT}}{H(p) = 1.743}`} />
      </Lbl>
      <Lbl x={(HX + xOf(L1)) / 2} y={62} anchor="c" style={{ color: ACCENT }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{D(p\,\|\,q) = 0.257}`} />
      </Lbl>
      <Lbl x={(HX + xOf(L1)) / 2} y={82} anchor="c" style={{ color: ACCENT, fontSize: 12, fontStyle: "italic" }}>
        extra bits from betting wrong
      </Lbl>

      {/* ── left row labels ── */}
      <Lbl x={X0 - 12} y={BAR1_Y + 3} anchor="r" style={{ textAlign: "right", lineHeight: 1.25 }}>
        <div style={{ fontWeight: 600 }}>balanced code</div>
        <div style={{ ...labelMuted, fontSize: 12 }}>
          <M tex={String.raw`(2,2,2,2)`} size={11} />
        </div>
      </Lbl>
      <Lbl x={X0 - 12} y={BAR2_Y + 3} anchor="r" style={{ textAlign: "right", lineHeight: 1.25 }}>
        <div style={{ fontWeight: 600, color: ACCENT }}>matched code</div>
        <div style={{ ...labelMuted, fontSize: 12 }}>
          <M tex={String.raw`(1,2,3,3)`} size={11} />
        </div>
      </Lbl>

      {/* ── right bar-end L labels ── */}
      <Lbl x={xOf(L1) + 10} y={BAR1_Y + 6} style={{ whiteSpace: "nowrap" }}>
        <M tex={String.raw`L = 2.00`} />
      </Lbl>
      <Lbl x={xOf(L2) + 10} y={BAR2_Y + 6} style={{ whiteSpace: "nowrap", color: ACCENT }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{L = 1.75}`} />
      </Lbl>

      {/* ── D = 0.007 callout for the bottom sliver ── */}
      <Lbl x={xOf(1.62)} y={AXIS_Y + 22} anchor="c" style={{ color: ACCENT, fontSize: 12 }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{D = 0.007}`} size={12} />
      </Lbl>
    </div>
  );
}
