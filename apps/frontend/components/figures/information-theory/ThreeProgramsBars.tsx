import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * ThreeProgramsBars — Kolmogorov complexity as shortest-program length.
 *
 * Three million-bit strings, each beside the shortest program that prints it
 * and a horizontal bar for that program's length on a shared axis:
 *   - all-zeros  "000000…0"   ← `repeat 1000000: print "0"`   ≈ 30 bits
 *   - periodic   "010101…01"  ← `repeat 500000: print "01"`   ≈ 30 bits
 *   - fair coin  "110100…1"   ← `print "1101000110…"`         ≈ 1,000,000 bits
 * The two structured strings collapse to thin amber slivers (the subject — a
 * short program); the incompressible string needs a full-width blue bar
 * because its shortest program just carries the data inline.
 *
 * One idea: regularity is exactly what a short program exploits.
 * Inspiration: Shen et al. (Kolmogorov Complexity overview) / Grünwald §1.2.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const TRACK_W = 300; // shared axis extent (0 … 10^6 bits)
const SLIVER_W = 5; // ≈30-bit programs render as a sliver at the origin
const BAR_H = 22;

type Row = {
  sample: string; // mono string sample
  program: string; // mono program text
  short: boolean; // amber short program vs blue inline-data program
  barW: number;
  barColor: string;
  lenLabel: string; // ≈ 30 / ≈ 1,000,000
  note?: string;
};

const ROWS: Row[] = [
  {
    sample: "000000…0",
    program: 'repeat 1000000: print "0"',
    short: true,
    barW: SLIVER_W,
    barColor: ACCENT,
    lenLabel: "≈ 30",
  },
  {
    sample: "010101…01",
    program: 'repeat 500000: print "01"',
    short: true,
    barW: SLIVER_W,
    barColor: ACCENT,
    lenLabel: "≈ 30",
  },
  {
    sample: "110100…1",
    program: 'print "1101000110…"',
    short: false,
    barW: TRACK_W,
    barColor: SUPPORT,
    lenLabel: "≈ 1,000,000",
    note: "data carried inline",
  },
];

export default function ThreeProgramsBars() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        color: "currentColor",
        maxWidth: 780,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `auto auto ${TRACK_W}px`,
          columnGap: 30,
          rowGap: 20,
          alignItems: "center",
          justifyContent: "start",
        }}
      >
        {/* column headers */}
        <div style={{ ...H, justifySelf: "start" }}>string</div>
        <div style={H}>shortest program</div>
        <div style={H}>description length</div>

        {ROWS.map((r) => (
          <RowCells key={r.sample} r={r} />
        ))}

        {/* shared axis: empty under the two text columns, ticks under bars */}
        <div />
        <div />
        <Axis />
      </div>

      {/* payoff line */}
      <div style={{ marginTop: 22, textAlign: "center" }}>
        <M
          tex={String.raw`\text{structure} \Rightarrow \textcolor{${ACCENT}}{\text{short program}}; \qquad \text{no structure} \Rightarrow \textcolor{${SUPPORT}}{\text{the data is its own shortest description}}`}
          size={14}
        />
      </div>
    </div>
  );
}

const H: React.CSSProperties = {
  fontSize: 11.5,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  opacity: 0.5,
  fontWeight: 600,
};

function RowCells({ r }: { r: Row }) {
  return (
    <>
      {/* string sample + million-bit label */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 0.5 }}>
          {r.sample}
        </span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>
          <M tex={String.raw`10^6`} size={11} /> bits
        </span>
      </div>

      {/* program (amber for the short programs) + inline-data note */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 13.5,
            color: r.short ? ACCENT : "currentColor",
            fontWeight: r.short ? 600 : 400,
            whiteSpace: "nowrap",
          }}
        >
          {r.program}
        </span>
        {r.note && (
          <span
            style={{
              fontSize: 11,
              opacity: 0.5,
              fontStyle: "italic",
            }}
          >
            {r.note}
          </span>
        )}
      </div>

      {/* description-length bar on the shared track */}
      <div
        style={{
          position: "relative",
          width: TRACK_W,
          height: BAR_H,
        }}
      >
        {/* faint full-track baseline: shows how little the slivers fill */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 3,
            background: "currentColor",
            opacity: 0.07,
          }}
        />
        {/* the bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: r.barW,
            height: BAR_H,
            borderRadius: 3,
            background: r.barColor,
            opacity: 0.9,
          }}
        />
        {/* length label */}
        {r.short ? (
          <span
            style={{
              position: "absolute",
              left: r.barW + 8,
              top: 0,
              height: BAR_H,
              display: "flex",
              alignItems: "center",
              color: r.barColor,
              fontWeight: 600,
              fontSize: 12.5,
              whiteSpace: "nowrap",
            }}
          >
            {r.lenLabel}
          </span>
        ) : (
          <span
            style={{
              position: "absolute",
              right: 10,
              top: 0,
              height: BAR_H,
              display: "flex",
              alignItems: "center",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: 12.5,
              whiteSpace: "nowrap",
            }}
          >
            {r.lenLabel}
          </span>
        )}
      </div>
    </>
  );
}

function Axis() {
  const y = 7;
  return (
    <svg
      width={TRACK_W}
      height={42}
      viewBox={`0 0 ${TRACK_W} 42`}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <line
        x1={0.5}
        y1={y}
        x2={TRACK_W - 0.5}
        y2={y}
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.6"
      />
      {[
        { x: 0.5, label: "0", anchor: "start" as const },
        { x: TRACK_W - 0.5, label: "1,000,000", anchor: "end" as const },
      ].map((t) => (
        <g key={t.label}>
          <line
            x1={t.x}
            y1={y}
            x2={t.x}
            y2={y + 5}
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.6"
          />
          <text
            x={t.x}
            y={y + 18}
            textAnchor={t.anchor}
            fontSize="11"
            fill="currentColor"
            opacity="0.65"
          >
            {t.label}
          </text>
        </g>
      ))}
      <text
        x={TRACK_W / 2}
        y={y + 33}
        textAnchor="middle"
        fontSize="11.5"
        fill="currentColor"
        opacity="0.6"
        fontStyle="italic"
      >
        shortest known description (bits)
      </text>
    </svg>
  );
}
