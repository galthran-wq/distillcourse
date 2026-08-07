import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * UkSeparation — one sequence, two verdicts. The sequence u = u(1)u(2)u(3)…
 * (all binary words of each length, in lex order) measured by two different
 * yardsticks, stacked as two panels sharing one left-hand label column.
 *
 *   description            two-line program in an amber box; K(u_1^{n(k)})
 *                          ≤ log2 k + c — five bits of data at k = 20
 *   finite-state           the first 34 bits parsed by LZ78 into 14 phrases,
 *   compression            none repeated; c = 2^{k+1}-2, output ≈ c log2 c ≥ n,
 *                          so the ratio sits at 1.10 and falls to ρ(u) = 1
 *
 * Color roles: amber = the description side (the subject of the top panel);
 * blue = the phrase side (parse blocks, bracket, ratio bar); currentColor =
 * text and axis. The 14 phrases alternate currentColor and blue purely so the
 * phrase boundaries read at a glance.
 *
 * One idea: describable and compressible are different properties — the gap
 * belongs to the compressor's bounded memory, not to the string.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const W = 760;
const COL1 = 132;
const GAP = 18;

const PHRASES = [
  "0",
  "1",
  "00",
  "01",
  "10",
  "11",
  "000",
  "001",
  "010",
  "011",
  "100",
  "101",
  "110",
  "111",
];

/* ---------- the ratio gauge (bottom-right) ---------- */

const GW = 200; // gauge width
const GH = 74; // gauge height
const GX0 = 6;
const GAXL = 158; // pixels for the 0 … 1.2 axis
const gx = (v: number) => GX0 + (v / 1.2) * GAXL;
const G_BAR_TOP = 28;
const G_BAR_H = 16;
const G_AXIS_Y = 50;

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
  const tx = anchor === "c" ? "translateX(-50%)" : anchor === "r" ? "translateX(-100%)" : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: tx,
        whiteSpace: "nowrap",
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function RatioGauge() {
  return (
    <div style={{ width: GW }}>
      <div style={{ ...labelMuted, fontSize: 11.5, marginBottom: 2 }}>compression ratio</div>
      <div style={{ position: "relative", width: GW, height: GH }}>
        <svg width={GW} height={GH} viewBox={`0 0 ${GW} ${GH}`} aria-hidden="true">
          {/* faint full-range track */}
          <rect
            x={GX0}
            y={G_BAR_TOP}
            width={GAXL}
            height={G_BAR_H}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.12"
          />
          {/* the attained ratio at k = 20 */}
          <rect
            x={GX0}
            y={G_BAR_TOP}
            width={gx(1.1) - GX0}
            height={G_BAR_H}
            rx="2"
            fill={SUPPORT}
            opacity="0.62"
          />
          {/* dashed guide at the limit ratio 1 */}
          <line
            x1={gx(1)}
            y1={19}
            x2={gx(1)}
            y2={G_AXIS_Y + 3}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="3.5 3"
            strokeOpacity="0.9"
          />
          {/* marker on the k = 20 value */}
          <path
            d={`M ${gx(1.1)} ${G_BAR_TOP - 2} l -4.5 -8 l 9 0 z`}
            fill={SUPPORT}
          />
          {/* axis 0 … 1.2 */}
          <line
            x1={GX0}
            y1={G_AXIS_Y}
            x2={gx(1.2)}
            y2={G_AXIS_Y}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
          {[0, 1.2].map((v) => (
            <line
              key={v}
              x1={gx(v)}
              y1={G_AXIS_Y}
              x2={gx(v)}
              y2={G_AXIS_Y + 5}
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
          ))}
        </svg>

        <Lbl x={gx(1) - 8} y={0} anchor="r">
          <M tex={String.raw`\rho(u) = 1`} size={12.5} />
        </Lbl>
        <Lbl x={gx(1.1) + 10} y={3} style={{ color: SUPPORT, fontWeight: 600, fontSize: 11.5 }}>
          k = 20
        </Lbl>
        <Lbl x={gx(0)} y={G_AXIS_Y + 7} anchor="c" style={{ ...labelMuted, fontSize: 10.5 }}>
          0
        </Lbl>
        <Lbl x={gx(1.2)} y={G_AXIS_Y + 7} anchor="c" style={{ ...labelMuted, fontSize: 10.5 }}>
          1.2
        </Lbl>
      </div>
    </div>
  );
}

/* ---------- panels ---------- */

function RowLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        textAlign: "right",
        color,
        fontWeight: 600,
        fontSize: 12.5,
        lineHeight: 1.25,
        paddingTop: 4,
      }}
    >
      {children}
    </div>
  );
}

export default function UkSeparation() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${COL1}px 1fr auto`,
          columnGap: GAP,
          alignItems: "start",
        }}
      >
        {/* ── TOP PANEL: description ────────────────────────────────── */}
        <RowLabel color={ACCENT}>description</RowLabel>

        <div
          style={{
            gridColumn: "2 / -1",
            display: "flex",
            alignItems: "center",
            gap: 22,
            flexWrap: "nowrap",
          }}
        >
          {/* the two-line program */}
          <div
            style={{
              border: `1.4px solid ${ACCENT}`,
              background: `${ACCENT}14`,
              borderRadius: 6,
              padding: "9px 13px",
              fontFamily: MONO,
              fontSize: 12.5,
              lineHeight: 1.55,
              color: ACCENT,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <div>for i = 1..k:</div>
            <div style={{ paddingLeft: 18 }}>print every i-bit word, in order</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}>
            <M
              tex={String.raw`\textcolor{${ACCENT}}{K(u_1^{n(k)})} \le \log_2 k + c`}
              size={14}
            />
            <div style={{ ...labelMuted, fontSize: 11.5 }}>
              k = 20: five bits of data, 39.8 Mbit of output
            </div>
          </div>
        </div>

        {/* divider */}
        <div
          style={{
            gridColumn: "1 / -1",
            borderTop: "1px solid currentColor",
            opacity: 0.14,
            margin: "16px 0",
          }}
        />

        {/* ── BOTTOM PANEL: finite-state compression ────────────────── */}
        <RowLabel color={SUPPORT}>
          finite-state
          <br />
          compression
        </RowLabel>

        <div>
          {/* the parsed prefix, phrases alternating so the boundaries read */}
          <div style={{ display: "inline-block" }}>
            <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: 0.2, whiteSpace: "nowrap" }}>
              {PHRASES.map((p, i) => (
                <span key={p}>
                  {i > 0 && <span style={{ opacity: 0.3 }}>|</span>}
                  <span style={{ color: i % 2 === 1 ? SUPPORT : undefined, fontWeight: 600 }}>{p}</span>
                </span>
              ))}
            </div>
            <div
              style={{
                height: 6,
                marginTop: 5,
                borderLeft: `1.2px solid ${SUPPORT}`,
                borderRight: `1.2px solid ${SUPPORT}`,
                borderBottom: `1.2px solid ${SUPPORT}`,
                opacity: 0.8,
              }}
            />
            <div
              style={{
                textAlign: "center",
                color: SUPPORT,
                fontSize: 11.5,
                marginTop: 4,
              }}
            >
              14 distinct phrases, none repeated
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <M
              tex={String.raw`\textcolor{${SUPPORT}}{c} = 2^{k+1}-2, \quad \text{output} \approx \textcolor{${SUPPORT}}{c}\log_2 \textcolor{${SUPPORT}}{c} \ge n`}
              size={13.5}
            />
          </div>
        </div>

        <RatioGauge />
      </div>

      {/* payoff */}
      <div style={{ marginTop: 20, fontSize: 13, lineHeight: 1.4 }}>
        <span style={{ color: ACCENT, fontWeight: 600 }}>tiny description</span>,{" "}
        <span style={{ color: SUPPORT, fontWeight: 600 }}>zero compression</span>: the gap is a
        property of the <b style={{ fontWeight: 600 }}>compressor&apos;s memory</b>, not of the
        string.
      </div>
    </div>
  );
}
