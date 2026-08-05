import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * StreamCostStack — the per-symbol accounting identity
 *   bits/char = H_rate + divergence rate + O(1/n)
 * rendered as ONE horizontal stacked bar on a bits-per-character axis (0–1.5).
 *
 * Running char-level example (carried from cross-entropy-loss ex. 7):
 *   blue   H_rate      ≈ 1.0  — the source's floor (English's entropy rate)
 *   amber  divergence  ≈ 0.2  — the model's own mismatch
 *   whole bar          = 1.2  — the model's cross-entropy = compressed bits/char
 *
 * One idea: file size = floor + mismatch. Training shrinks only the amber part;
 * no compressor touches the blue. Blue = entropy-rate floor, amber = KL excess.
 */

const W = 620;
const HGT = 244;
const X0 = 62; // bits/char = 0
const PPB = 330; // px per bit
const xOf = (v: number) => X0 + v * PPB;

const HRATE = 1.0; // blue floor
const TOTAL = 1.2; // whole bar (cross-entropy)

const BRACKET_Y = 66;
const BAR_Y = 80;
const BAR_H = 44;
const BAR_BOT = BAR_Y + BAR_H;
const AXIS_Y = BAR_BOT + 10;

const XH = xOf(HRATE); // blue/amber seam
const XT = xOf(TOTAL); // bar end

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

export default function StreamCostStack() {
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
        {/* ── bracket over the whole colored bar: the cross-entropy total ── */}
        <path
          d={`M ${X0} ${BRACKET_Y + 6} L ${X0} ${BRACKET_Y} L ${XT} ${BRACKET_Y} L ${XT} ${BRACKET_Y + 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        <path
          d={`M ${(X0 + XT) / 2} ${BRACKET_Y} L ${(X0 + XT) / 2} ${BRACKET_Y - 6}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />

        {/* ── the bar: blue floor (0..H_rate) + amber mismatch (H_rate..total) ── */}
        <rect x={X0} y={BAR_Y} width={XH - X0} height={BAR_H} fill={SUPPORT} opacity="0.85" />
        <rect x={XH} y={BAR_Y} width={XT - XH} height={BAR_H} fill={ACCENT} opacity="0.92" />
        {/* hairline outline of the whole bar for definition */}
        <rect
          x={X0}
          y={BAR_Y}
          width={XT - X0}
          height={BAR_H}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        {/* seam accent at the entropy-rate floor */}
        <line x1={XH} y1={BAR_Y} x2={XH} y2={BAR_BOT} stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />

        {/* ── axis: bits per character, 0 to 1.5 ── */}
        <line x1={X0} y1={AXIS_Y} x2={xOf(1.5)} y2={AXIS_Y} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        {[0, 0.5, 1, 1.5].map((v) => (
          <g key={v}>
            <line x1={xOf(v)} y1={AXIS_Y} x2={xOf(v)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <text x={xOf(v)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={xOf(1.5) + 8} y={AXIS_Y + 4} fontSize="11" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits/char
        </text>

        {/* leader from the amber segment down to its label block */}
        <path
          d={`M ${(XH + XT) / 2} ${BAR_BOT} L ${(XH + XT) / 2} ${AXIS_Y + 26} L ${xOf(1.32)} ${AXIS_Y + 26}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.1"
          strokeOpacity="0.8"
        />
      </svg>

      {/* ── the identity, terms color-bound to the segments (above the bar) ── */}
      <Lbl x={(X0 + XT) / 2} y={6} anchor="c" style={{ fontSize: 16 }}>
        <M
          tex={String.raw`\text{bits/char} \;=\; \textcolor{${SUPPORT}}{H_{\text{rate}}} \;+\; \textcolor{${ACCENT}}{D_{\text{rate}}}`}
        />
      </Lbl>

      {/* ── bracket label: the cross-entropy total = compressed size ── */}
      <Lbl x={(X0 + XT) / 2} y={40} anchor="c" style={{ fontSize: 12, textAlign: "center" }}>
        <span style={{ fontWeight: 600 }}>model&rsquo;s cross-entropy: 1.2 bits/char</span>
        <span style={{ ...labelMuted, fontSize: 12, marginLeft: 6 }}>= compressed size per character</span>
      </Lbl>

      {/* ── blue segment label, under the blue floor ── */}
      <Lbl x={(X0 + XH) / 2} y={AXIS_Y + 30} anchor="c" style={{ textAlign: "center", lineHeight: 1.3 }}>
        <div style={{ color: SUPPORT }}>
          <M tex={String.raw`\textcolor{${SUPPORT}}{H_{\text{rate}} \approx 1.0}`} />
        </div>
        <div style={{ ...labelMuted, fontSize: 12, fontStyle: "italic" }}>
          the source&rsquo;s floor (entropy of English)
        </div>
      </Lbl>

      {/* ── amber segment label, right of the leader ── */}
      <Lbl x={xOf(1.32)} y={AXIS_Y + 20} anchor="l" style={{ lineHeight: 1.3 }}>
        <div style={{ color: ACCENT }}>
          <M tex={String.raw`\textcolor{${ACCENT}}{\text{divergence} \approx 0.2}`} />
        </div>
        <div style={{ ...labelMuted, fontSize: 12, fontStyle: "italic" }}>the model&rsquo;s mismatch</div>
      </Lbl>

      {/* ── payoff line ── */}
      <Lbl x={(X0 + XT) / 2} y={HGT - 18} anchor="c" style={{ ...labelMuted, opacity: 1, fontSize: 12.5 }}>
        training shrinks only the <span style={{ color: ACCENT, fontWeight: 600 }}>amber</span> part; no compressor
        touches the <span style={{ color: SUPPORT, fontWeight: 600 }}>blue</span>
      </Lbl>
    </div>
  );
}
