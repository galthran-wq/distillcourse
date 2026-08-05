import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * InfonceToyTally — the worked InfoNCE toy in one panel. LEFT: the 2×2 joint
 * p(x,y) = [3/8, 1/8 ; 1/8, 3/8] and, beneath it, the pointwise density ratio
 * r(x,y) = p(y|x)/p(y) = [1.5, 0.5 ; 0.5, 1.5] — high-ratio (agreeing) cells
 * amber, low-ratio (disagreeing) cells blue. RIGHT: a three-row tally on a
 * shared bits axis (0…0.2). Each amber bar is the value the InfoNCE bound
 * certifies at that batch size:
 *   N = 2   0.094 bits   (L_2  = 0.906)
 *   N = 4   0.142 bits   (L_4  = 1.858)
 *   N = 16  0.177 bits   (L_16 = 3.823)
 * A dashed currentColor line marks the true I(X;Y) = 0.189 bits.
 *
 * One idea: the bound holds at every N and tightens toward the true mutual
 * information as N grows. Color roles — amber = certified bits and the
 * high-ratio cells (subject); blue = low-ratio cells; currentColor =
 * tables / axis. Inspiration: van den Oord et al., CPC / InfoNCE (2018),
 * worked on a 2×2 source (recreated, not copied).
 */

const F = (n: number, d: number) => String.raw`\tfrac{${n}}{${d}}`;

// ── left: 2×2 tables ─────────────────────────────────────────────────────
function Cell({
  tex,
  color,
}: {
  tex: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 54,
        height: 42,
        border: "1px solid currentColor",
        borderColor: "color-mix(in srgb, currentColor 32%, transparent)",
        fontSize: 15,
        color: color ?? "inherit",
      }}
    >
      <M tex={color ? String.raw`\textcolor{${color}}{${tex}}` : tex} />
    </div>
  );
}

function ColHead({ tex }: { tex: string }) {
  return (
    <div style={{ width: 54, textAlign: "center", fontWeight: 600, fontSize: 12, paddingBottom: 3 }}>
      <M tex={tex} size={12} />
    </div>
  );
}

function RowHead({ tex }: { tex: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        height: 42,
        paddingRight: 8,
        fontWeight: 600,
        fontSize: 12,
      }}
    >
      <M tex={tex} size={12} />
    </div>
  );
}

function Table({
  headingTex,
  cells,
  colors,
}: {
  headingTex: string;
  cells: string[][];
  colors: (string | undefined)[][];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <M tex={headingTex} size={14} />
      </div>
      {/* y axis label over the two columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          alignItems: "center",
        }}
      >
        <div />
        <div style={{ ...labelMuted, fontSize: 11, fontStyle: "italic", textAlign: "center", gridColumn: "2 / 4", paddingBottom: 2 }}>
          y
        </div>

        <div />
        <ColHead tex="0" />
        <ColHead tex="1" />

        <RowHead tex="0" />
        <Cell tex={cells[0][0]} color={colors[0][0]} />
        <Cell tex={cells[0][1]} color={colors[0][1]} />

        <RowHead tex="1" />
        <Cell tex={cells[1][0]} color={colors[1][0]} />
        <Cell tex={cells[1][1]} color={colors[1][1]} />
      </div>
      {/* x axis label to the left, printed under the heading via a footer */}
    </div>
  );
}

// ── right: three-row tally ───────────────────────────────────────────────
const Wr = 462;
const Hr = 224;
const X0 = 70; // bits = 0
const PPB = 1150; // px per bit
const bitX = (b: number) => X0 + b * PPB;
const AXIS_Y = 190;
const BAR_H = 24;
const ROWS = [
  { label: "2", bits: 0.094, L: "L_{2} = 0.906" },
  { label: "4", bits: 0.142, L: "L_{4} = 1.858" },
  { label: "16", bits: 0.177, L: "L_{16} = 3.823" },
];
const rowY = (i: number) => 52 + i * 45; // bar center
const TRUE_I = 0.189;
const TRUE_X = bitX(TRUE_I);

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
        fontSize: 12.5,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Tally() {
  return (
    <div style={{ position: "relative", width: Wr, height: Hr }}>
      <svg width={Wr} height={Hr} viewBox={`0 0 ${Wr} ${Hr}`} aria-hidden="true">
        {/* certified amber bars */}
        {ROWS.map((r, i) => (
          <rect
            key={r.label}
            x={X0}
            y={rowY(i) - BAR_H / 2}
            width={r.bits * PPB}
            height={BAR_H}
            fill={ACCENT}
            opacity="0.9"
            rx="2"
          />
        ))}

        {/* shared bits axis 0 .. 0.2 */}
        <line x1={X0} y1={AXIS_Y} x2={bitX(0.2)} y2={AXIS_Y} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        {[0, 0.05, 0.1, 0.15, 0.2].map((b) => (
          <g key={b}>
            <line x1={bitX(b)} y1={AXIS_Y} x2={bitX(b)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          </g>
        ))}

        {/* true I(X;Y): dashed currentColor line spanning the three rows */}
        <line
          x1={TRUE_X}
          y1={rowY(0) - BAR_H / 2 - 12}
          x2={TRUE_X}
          y2={rowY(2) + BAR_H / 2 + 8}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="4 3"
          opacity="0.75"
        />
      </svg>

      {/* row labels (left of bars) */}
      {ROWS.map((r, i) => (
        <Lbl key={r.label} x={X0 - 10} y={rowY(i)} anchor="r" style={{ fontWeight: 600 }}>
          <M tex={String.raw`N = ${r.label}`} size={12.5} />
        </Lbl>
      ))}

      {/* certified value at each bar end (amber) */}
      {ROWS.map((r, i) => (
        <Lbl key={r.label} x={bitX(r.bits) + 7} y={rowY(i)} style={{ color: ACCENT, fontWeight: 600, fontSize: 12 }}>
          {r.bits.toFixed(3)}
        </Lbl>
      ))}

      {/* muted L_N readout at the row's right */}
      {ROWS.map((r, i) => (
        <Lbl key={r.label} x={Wr - 6} y={rowY(i)} anchor="r" style={{ ...labelMuted, fontSize: 12 }}>
          <M tex={r.L} size={12} />
        </Lbl>
      ))}

      {/* true-I label at the top of the dashed line */}
      <Lbl x={TRUE_X} y={16} anchor="c" style={{ fontSize: 12 }}>
        <M tex={String.raw`\text{true } I(X;Y) = 0.189`} size={12} />
      </Lbl>

      {/* axis tick numbers + unit */}
      {[0, 0.05, 0.1, 0.15, 0.2].map((b) => (
        <Lbl key={b} x={bitX(b)} y={AXIS_Y + 16} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>
          {b}
        </Lbl>
      ))}
      <Lbl x={bitX(0.2) + 12} y={AXIS_Y + 16} style={{ ...labelMuted, fontSize: 11, fontStyle: "italic" }}>
        bits
      </Lbl>
    </div>
  );
}

export default function InfonceToyTally() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 780,
        display: "flex",
        gap: 34,
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap",
      }}
    >
      {/* LEFT: joint over ratio */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div>
          <Table
            headingTex="p(x,y)"
            cells={[
              [F(3, 8), F(1, 8)],
              [F(1, 8), F(3, 8)],
            ]}
            colors={[
              [undefined, undefined],
              [undefined, undefined],
            ]}
          />
          <div style={{ ...labelMuted, fontSize: 11, fontStyle: "italic", marginTop: 3, paddingLeft: 30 }}>
            rows x, columns y
          </div>
        </div>

        <Table
          headingTex={String.raw`r(x,y) = \dfrac{p(y \mid x)}{p(y)}`}
          cells={[
            ["1.5", "0.5"],
            ["0.5", "1.5"],
          ]}
          colors={[
            [ACCENT, SUPPORT],
            [SUPPORT, ACCENT],
          ]}
        />
      </div>

      {/* RIGHT: certified-bits tally */}
      <Tally />
    </div>
  );
}
