import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * PredictThenCode — FigureSequence, 5 frames. The predict-then-code pipeline
 * (arithmetic coding) on the stream AAB. Each symbol keeps a slice of the unit
 * interval proportional to its conditional probability, so the width becomes
 * q(AAB) and the bit cost adds the surprisals.
 *
 * Shared layout, one delta per frame:
 *   Top          the stream "A A B" (mono), current symbol boxed amber.
 *   Left-middle  two-bar model panel for that step's distribution (KaTeX
 *                q(·|context) labels, amber bar = the symbol taken).
 *   Center       unit number line 0..1 (ticks 0,.25,.5,.75,1); current
 *                interval as a thick amber band, endpoints + width beneath.
 *   Bottom-right running counter  -log2(width) = … bits.
 *
 *   f1 "before any symbol"        band [0,1)        width 1      0.00 bits
 *   f2 "symbol 1: A"   A boxed     band [0,0.8)      width 0.8    0.32
 *   f3 "symbol 2: A"   A boxed     band [0,0.64)     width 0.64   0.64
 *   f4 "symbol 3: B"   B boxed     band [0.512,0.64) width 0.128  2.97
 *   f5 "emit a dyadic interval"    + blue sub-band [9/16,10/16), codeword 1001,
 *                                  tally  4 bits <= 2.97 + 2
 *
 * Color roles: amber = the live interval + current symbol; blue = the emitted
 * dyadic interval (frame 5 only); currentColor = axis and text.
 * Inspiration: MacKay ITILA ch. 6 arithmetic-coding interval diagram (recreated).
 */

const W = 660;
const HGT = 462;

// ── number line ───────────────────────────────────────────────────────────
const NL_X0 = 70;
const NL_X1 = 610;
const NL_Y = 350; // axis
const xOf = (v: number) => NL_X0 + v * (NL_X1 - NL_X0);
const TICKS = [0, 0.25, 0.5, 0.75, 1];

// amber band sits just above the axis; ticks hang below it
const BAND_TOP = 330;
const BAND_H = 18;
const BAND_BOT = BAND_TOP + BAND_H; // 348, flush above axis

// ── model panel ───────────────────────────────────────────────────────────
const PX = 36;
const PY = 92;
const PW = 228;
const PH = 150;
const PCX = PX + PW / 2; // 150
const BAR_BASE = 214; // prob = 0
const BAR_MAXH = 104; // prob = 1
const A_BAR = { x: 96, w: 36 };
const B_BAR = { x: 168, w: 36 };

// ── stream row ────────────────────────────────────────────────────────────
const CELL = 32;
const GAP = 12;
const STREAM_TOTAL = 3 * CELL + 2 * GAP; // 120
const STREAM_X0 = (W - STREAM_TOTAL) / 2; // 270
const STREAM_Y = 34;
const cellX = (i: number) => STREAM_X0 + i * (CELL + GAP);
const STREAM = ["A", "A", "B"];

type Frame = {
  header: string;
  boxed: number | null;
  taken: "A" | "B" | null;
  context: string;
  qA: string;
  qB: string;
  lo: number;
  hi: number;
  intervalTex: string;
  widthTex: string;
  costPrefix: string;
  costTex: string;
  blue?: boolean;
};

const FRAMES: Frame[] = [
  {
    header: "before any symbol",
    boxed: null,
    taken: null,
    context: "—",
    qA: "",
    qB: "",
    lo: 0,
    hi: 1,
    intervalTex: String.raw`[0,\, 1)`,
    widthTex: String.raw`\text{width} = 1`,
    costPrefix: "cost so far:",
    costTex: String.raw`-\log_2(\text{width}) = 0.00\ \text{bits}`,
  },
  {
    header: "symbol 1: A",
    boxed: 0,
    taken: "A",
    context: "(none)",
    qA: String.raw`q(A) = 0.8`,
    qB: String.raw`q(B) = 0.2`,
    lo: 0,
    hi: 0.8,
    intervalTex: String.raw`[0,\, 0.8)`,
    widthTex: String.raw`\text{width} = 0.8`,
    costPrefix: "cost so far:",
    costTex: String.raw`-\log_2(\text{width}) = 0.32\ \text{bits}`,
  },
  {
    header: "symbol 2: A",
    boxed: 1,
    taken: "A",
    context: "A",
    qA: String.raw`q(A \mid A) = 0.8`,
    qB: String.raw`q(B \mid A) = 0.2`,
    lo: 0,
    hi: 0.64,
    intervalTex: String.raw`[0,\, 0.64)`,
    widthTex: String.raw`\text{width} = 0.64`,
    costPrefix: "cost so far:",
    costTex: String.raw`-\log_2(\text{width}) = 0.64\ \text{bits}`,
  },
  {
    header: "symbol 3: B",
    boxed: 2,
    taken: "B",
    context: "AA",
    qA: String.raw`q(A \mid AA) = 0.8`,
    qB: String.raw`q(B \mid AA) = 0.2`,
    lo: 0.512,
    hi: 0.64,
    intervalTex: String.raw`[0.512,\, 0.64)`,
    widthTex: String.raw`\text{width} = 0.128 = 2^{-2.97}`,
    costPrefix: "cost so far:",
    costTex: String.raw`-\log_2(\text{width}) = 2.97\ \text{bits}`,
  },
  {
    header: "emit a dyadic interval inside",
    boxed: 2,
    taken: "B",
    context: "AA",
    qA: String.raw`q(A \mid AA) = 0.8`,
    qB: String.raw`q(B \mid AA) = 0.2`,
    lo: 0.512,
    hi: 0.64,
    intervalTex: String.raw`[0.512,\, 0.64)`,
    widthTex: String.raw`\text{width} = 0.128 = 2^{-2.97}`,
    costPrefix: "emitted:",
    costTex: String.raw`4\ \text{bits}\ \le\ 2.97 + 2`,
    blue: true,
  },
];

// frame-5 blue dyadic interval
const BLUE_LO = 0.5625;
const BLUE_HI = 0.625;

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

function Bar({
  bar,
  prob,
  amber,
}: {
  bar: { x: number; w: number };
  prob: number;
  amber: boolean;
}) {
  const h = prob * BAR_MAXH;
  const top = BAR_BASE - h;
  return (
    <rect
      x={bar.x}
      y={top}
      width={bar.w}
      height={h}
      fill={amber ? ACCENT : "currentColor"}
      fillOpacity={amber ? 0.85 : 0.16}
      stroke={amber ? ACCENT : "currentColor"}
      strokeOpacity={amber ? 1 : 0.4}
      strokeWidth="1.2"
    />
  );
}

export default function PredictThenCode({ frame = 1 }: { frame?: number }) {
  const fr = FRAMES[Math.min(Math.max(frame, 1), FRAMES.length) - 1];
  const bandX = xOf(fr.lo);
  const bandW = xOf(fr.hi) - xOf(fr.lo);
  const bandCX = (xOf(fr.lo) + xOf(fr.hi)) / 2;
  const hasBars = fr.taken !== null;

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
        {/* ── stream row ── */}
        {STREAM.map((s, i) => {
          const boxed = fr.boxed === i;
          return (
            <g key={`c${i}`}>
              <rect
                x={cellX(i)}
                y={STREAM_Y}
                width={CELL}
                height={CELL}
                rx="4"
                fill={boxed ? ACCENT : "none"}
                fillOpacity={boxed ? 0.12 : 1}
                stroke={boxed ? ACCENT : "currentColor"}
                strokeOpacity={boxed ? 1 : 0.28}
                strokeWidth={boxed ? 2.2 : 1.4}
              />
              <text
                x={cellX(i) + CELL / 2}
                y={STREAM_Y + CELL / 2 + 6}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize="18"
                fontWeight="600"
                fill={boxed ? ACCENT : "currentColor"}
                fillOpacity={boxed ? 1 : 0.75}
              >
                {s}
              </text>
            </g>
          );
        })}

        {/* ── model panel box ── */}
        <rect
          x={PX}
          y={PY}
          width={PW}
          height={PH}
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1.3"
        />
        {hasBars && (
          <>
            {/* baseline of the bar chart */}
            <line
              x1={A_BAR.x - 14}
              y1={BAR_BASE}
              x2={B_BAR.x + B_BAR.w + 14}
              y2={BAR_BASE}
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="1.1"
            />
            <Bar bar={A_BAR} prob={0.8} amber={fr.taken === "A"} />
            <Bar bar={B_BAR} prob={0.2} amber={fr.taken === "B"} />
            <text
              x={A_BAR.x + A_BAR.w / 2}
              y={BAR_BASE + 18}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize="14"
              fill="currentColor"
              fillOpacity="0.7"
            >
              A
            </text>
            <text
              x={B_BAR.x + B_BAR.w / 2}
              y={BAR_BASE + 18}
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
              fontSize="14"
              fill="currentColor"
              fillOpacity="0.7"
            >
              B
            </text>
          </>
        )}

        {/* ── number line ── */}
        <line
          x1={NL_X0}
          y1={NL_Y}
          x2={NL_X1}
          y2={NL_Y}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.7"
        />
        {TICKS.map((t) => (
          <g key={`t${t}`}>
            <line
              x1={xOf(t)}
              y1={NL_Y}
              x2={xOf(t)}
              y2={NL_Y + 8}
              stroke="currentColor"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            <text
              x={xOf(t)}
              y={NL_Y + 24}
              textAnchor="middle"
              fontSize="11.5"
              fill="currentColor"
              fillOpacity="0.6"
            >
              {t}
            </text>
          </g>
        ))}

        {/* discarded region: the full unit interval as a muted outline */}
        <rect
          x={xOf(0)}
          y={BAND_TOP}
          width={xOf(1) - xOf(0)}
          height={BAND_H}
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        {/* live amber interval */}
        <rect
          x={bandX}
          y={BAND_TOP}
          width={bandW}
          height={BAND_H}
          rx="2"
          fill={ACCENT}
          fillOpacity="0.85"
          stroke={ACCENT}
          strokeWidth="1.4"
        />
        {/* frame 5: emitted blue dyadic sub-interval, nested inside */}
        {fr.blue && (
          <rect
            x={xOf(BLUE_LO)}
            y={BAND_TOP + 4}
            width={xOf(BLUE_HI) - xOf(BLUE_LO)}
            height={BAND_H - 8}
            rx="1.5"
            fill={SUPPORT}
            fillOpacity="0.95"
          />
        )}
      </svg>

      {/* ── header ── */}
      <Lbl x={W / 2} y={14} anchor="c" style={{ fontSize: 16, fontWeight: 600 }}>
        {fr.header}
      </Lbl>

      {/* ── panel title: the running context ── */}
      <Lbl x={PCX} y={PY + 16} anchor="c" style={{ fontSize: 12, opacity: 0.6 }}>
        model prediction
      </Lbl>
      <Lbl x={PCX} y={PY + 34} anchor="c" style={{ fontSize: 11.5, opacity: 0.55 }}>
        context:&nbsp;
        <span style={{ fontFamily: "ui-monospace, monospace" }}>{fr.context}</span>
      </Lbl>

      {/* ── empty-panel note (frame 1) ── */}
      {!hasBars && (
        <Lbl x={PCX} y={BAR_BASE - 30} anchor="c" style={{ fontSize: 12.5, opacity: 0.45, fontStyle: "italic" }}>
          no symbols yet
        </Lbl>
      )}

      {/* ── q labels beneath the panel ── */}
      {hasBars && (
        <>
          <Lbl x={PCX} y={PY + PH + 18} anchor="c">
            <M
              tex={fr.taken === "A" ? String.raw`\textcolor{${ACCENT}}{${fr.qA}}` : fr.qA}
              size={13}
            />
          </Lbl>
          <Lbl x={PCX} y={PY + PH + 40} anchor="c">
            <M
              tex={fr.taken === "B" ? String.raw`\textcolor{${ACCENT}}{${fr.qB}}` : fr.qB}
              size={13}
            />
          </Lbl>
        </>
      )}

      {/* ── interval + width beneath the band, centered under it ── */}
      <Lbl x={bandCX} y={NL_Y + 46} anchor="c" style={{ color: ACCENT }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{${fr.intervalTex}}`} size={14} />
      </Lbl>
      <Lbl x={bandCX} y={NL_Y + 68} anchor="c">
        <M tex={fr.widthTex} size={13} />
      </Lbl>

      {/* ── frame 5: blue dyadic-interval label above the band ── */}
      {fr.blue && (
        <Lbl
          x={(xOf(BLUE_LO) + xOf(BLUE_HI)) / 2}
          y={BAND_TOP - 16}
          anchor="c"
          style={{ color: SUPPORT, fontSize: 12.5, fontWeight: 600 }}
        >
          <M tex={String.raw`\textcolor{${SUPPORT}}{\left[\tfrac{9}{16},\, \tfrac{10}{16}\right)}`} size={12.5} />
          <span style={{ opacity: 0.85 }}>&nbsp;— codeword&nbsp;</span>
          <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>1001</span>
        </Lbl>
      )}

      {/* ── running counter, bottom-right ── */}
      <Lbl x={W - 18} y={NL_Y + 92} anchor="r" style={{ fontSize: 13.5 }}>
        <span style={{ opacity: 0.6 }}>{fr.costPrefix}&nbsp;</span>
        <M tex={fr.blue ? String.raw`\textcolor{${SUPPORT}}{${fr.costTex}}` : fr.costTex} size={14} />
      </Lbl>
    </div>
  );
}
