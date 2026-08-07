import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * AdaptiveCoderStep — FigureSequence, 4 frames. One step of the add-one
 * count-based coder per frame on the stream `aaba` of the worked example.
 *
 * Shared layout, exactly one symbol advances per frame:
 *   Top     the stream "a a b a" (mono), current cell boxed amber, earlier
 *           cells filled muted, later cells outlined only.
 *   Left    "counts before this symbol" — two integer boxes F_a, F_b stacked.
 *   Center  "prediction" — q(a), q(b) as horizontal bars on a common 0..1
 *           track, exact fractions in KaTeX; the arriving symbol's bar amber,
 *           the alternative blue.
 *   Right   "charge" — q of the symbol taken, then -log2 q = value, and a
 *           running total as an accumulating amber bar on a fixed 0..5 bit axis.
 *   Bottom  "counts after the update" — the same two boxes, incremented one amber.
 *
 *   f1 "symbol 1: a"  (0,0)  q=1/2,1/2  charge 1.000  total 1.000  -> (1,0)
 *   f2 "symbol 2: a"  (1,0)  q=2/3,1/3  charge 0.585  total 1.585  -> (2,0)
 *   f3 "symbol 3: b"  (2,0)  q=3/4,1/4  charge 2.000  total 3.585  -> (2,1)
 *   f4 "symbol 4: a"  (2,1)  q=3/5,2/5  charge 0.737  total 4.322  -> (3,1)
 *
 * The point: in frame 3 the arriving b owns the SHORT bar, so it draws the
 * tallest charge of the four. Colors: amber = the symbol taken and the running
 * cost, blue = the alternative, currentColor = axes, labels and boxes.
 */

const W = 700;
const H = 334;

// ── stream row ────────────────────────────────────────────────────────────
const STREAM = ["a", "a", "b", "a"];
const CELL = 34;
const GAP = 12;
const STREAM_X0 = (W - (4 * CELL + 3 * GAP)) / 2;
const STREAM_Y = 38;
const cellX = (i: number) => STREAM_X0 + i * (CELL + GAP);

// ── panel row ─────────────────────────────────────────────────────────────
const PY = 92;
const PH = 150;
const LX = 18;
const LW = 130;
const CX = 162;
const CW = 302;
const RX = 478;
const RW = 204;

// ── count boxes ───────────────────────────────────────────────────────────
const BOX_W = 38;
const BOX_H = 30;
const LBOX_X = 82;
const LBOX_Y_A = 146;
const LBOX_Y_B = 190;

// ── prediction bars (common 0..1 track) ───────────────────────────────────
const TRACK_X0 = 224;
const TRACK_W = 180;
const BAR_H = 16;
const BAR_Y_A = 138;
const BAR_Y_B = 168;
const CAXIS_Y = 194;

// ── running-total bar (fixed 0..5 bit axis) ───────────────────────────────
const BIT_X0 = 496;
const BIT_W = 160;
const BIT_MAX = 5;
const BIT_Y = 200;
const BIT_H = 13;

// ── bottom strip ──────────────────────────────────────────────────────────
const STRIP_X = 18;
const STRIP_Y = 262;
const STRIP_W = W - 2 * STRIP_X;
const STRIP_H = 54;
const SBOX_Y = STRIP_Y + 12;
const SBOX_X_A = 268;
const SBOX_X_B = 358;

type Frame = {
  header: string;
  boxed: number;
  taken: "a" | "b";
  before: [number, number];
  after: [number, number];
  qa: number;
  qb: number;
  qaTex: string;
  qbTex: string;
  qTakenTex: string; // fraction of the symbol that arrives
  charge: string;
  total: number;
  totalTex: string;
};

const FRAMES: Frame[] = [
  {
    header: "symbol 1: a",
    boxed: 0,
    taken: "a",
    before: [0, 0],
    after: [1, 0],
    qa: 1 / 2,
    qb: 1 / 2,
    qaTex: String.raw`\tfrac12`,
    qbTex: String.raw`\tfrac12`,
    qTakenTex: String.raw`\tfrac12`,
    charge: "1.000",
    total: 1.0,
    totalTex: "1.000",
  },
  {
    header: "symbol 2: a",
    boxed: 1,
    taken: "a",
    before: [1, 0],
    after: [2, 0],
    qa: 2 / 3,
    qb: 1 / 3,
    qaTex: String.raw`\tfrac23`,
    qbTex: String.raw`\tfrac13`,
    qTakenTex: String.raw`\tfrac23`,
    charge: "0.585",
    total: 1.585,
    totalTex: "1.585",
  },
  {
    header: "symbol 3: b",
    boxed: 2,
    taken: "b",
    before: [2, 0],
    after: [2, 1],
    qa: 3 / 4,
    qb: 1 / 4,
    qaTex: String.raw`\tfrac34`,
    qbTex: String.raw`\tfrac14`,
    qTakenTex: String.raw`\tfrac14`,
    charge: "2.000",
    total: 3.585,
    totalTex: "3.585",
  },
  {
    header: "symbol 4: a",
    boxed: 3,
    taken: "a",
    before: [2, 1],
    after: [3, 1],
    qa: 3 / 5,
    qb: 2 / 5,
    qaTex: String.raw`\tfrac35`,
    qbTex: String.raw`\tfrac25`,
    qTakenTex: String.raw`\tfrac35`,
    charge: "0.737",
    total: 4.322,
    totalTex: "4.322",
  },
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

function Panel({ x, w }: { x: number; w: number }) {
  return (
    <rect
      x={x}
      y={PY}
      width={w}
      height={PH}
      rx="8"
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.26"
      strokeWidth="1.3"
    />
  );
}

function CountBox({
  x,
  y,
  value,
  hot,
}: {
  x: number;
  y: number;
  value: number;
  hot: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={BOX_W}
        height={BOX_H}
        rx="4"
        fill={hot ? ACCENT : "none"}
        fillOpacity={hot ? 0.16 : 1}
        stroke={hot ? ACCENT : "currentColor"}
        strokeOpacity={hot ? 1 : 0.4}
        strokeWidth={hot ? 2 : 1.3}
      />
      <text
        x={x + BOX_W / 2}
        y={y + BOX_H / 2 + 6}
        textAnchor="middle"
        fontFamily="ui-monospace, monospace"
        fontSize="16"
        fontWeight={hot ? 700 : 500}
        fill={hot ? ACCENT : "currentColor"}
        fillOpacity={hot ? 1 : 0.85}
      >
        {value}
      </text>
    </g>
  );
}

function ProbBar({ y, p, hot }: { y: number; p: number; hot: boolean }) {
  const color = hot ? ACCENT : SUPPORT;
  return (
    <g>
      {/* the common 0..1 track */}
      <rect
        x={TRACK_X0}
        y={y}
        width={TRACK_W}
        height={BAR_H}
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.26"
        strokeWidth="1"
      />
      <rect
        x={TRACK_X0}
        y={y}
        width={p * TRACK_W}
        height={BAR_H}
        rx="2"
        fill={color}
        fillOpacity={hot ? 0.85 : 0.7}
        stroke={color}
        strokeWidth="1.2"
      />
    </g>
  );
}

export default function AdaptiveCoderStep({ frame = 1 }: { frame?: number }) {
  const fr = FRAMES[Math.min(Math.max(frame, 1), FRAMES.length) - 1];
  const takenA = fr.taken === "a";
  const takenColor = ACCENT;

  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* ── stream row ── */}
        {STREAM.map((s, i) => {
          const isNow = i === fr.boxed;
          const isPast = i < fr.boxed;
          return (
            <g key={`c${i}`}>
              <rect
                x={cellX(i)}
                y={STREAM_Y}
                width={CELL}
                height={CELL}
                rx="4"
                fill={isNow ? ACCENT : isPast ? "currentColor" : "none"}
                fillOpacity={isNow ? 0.14 : isPast ? 0.13 : 1}
                stroke={isNow ? ACCENT : "currentColor"}
                strokeOpacity={isNow ? 1 : isPast ? 0.35 : 0.22}
                strokeWidth={isNow ? 2.2 : 1.3}
              />
              <text
                x={cellX(i) + CELL / 2}
                y={STREAM_Y + CELL / 2 + 7}
                textAnchor="middle"
                fontFamily="ui-monospace, monospace"
                fontSize="19"
                fontWeight={isNow ? 700 : 500}
                fill={isNow ? ACCENT : "currentColor"}
                fillOpacity={isNow ? 1 : isPast ? 0.62 : 0.34}
              >
                {s}
              </text>
            </g>
          );
        })}

        {/* ── panels ── */}
        <Panel x={LX} w={LW} />
        <Panel x={CX} w={CW} />
        <Panel x={RX} w={RW} />

        {/* ── left: counts before ── */}
        <CountBox x={LBOX_X} y={LBOX_Y_A} value={fr.before[0]} hot={false} />
        <CountBox x={LBOX_X} y={LBOX_Y_B} value={fr.before[1]} hot={false} />

        {/* ── center: prediction bars ── */}
        <ProbBar y={BAR_Y_A} p={fr.qa} hot={takenA} />
        <ProbBar y={BAR_Y_B} p={fr.qb} hot={!takenA} />
        {/* 0..1 axis under the two bars */}
        <line
          x1={TRACK_X0}
          y1={CAXIS_Y}
          x2={TRACK_X0 + TRACK_W}
          y2={CAXIS_Y}
          stroke="currentColor"
          strokeOpacity="0.5"
          strokeWidth="1.1"
        />
        {[0, 0.5, 1].map((t) => (
          <g key={`ct${t}`}>
            <line
              x1={TRACK_X0 + t * TRACK_W}
              y1={CAXIS_Y}
              x2={TRACK_X0 + t * TRACK_W}
              y2={CAXIS_Y + 5}
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="1.1"
            />
            <text
              x={TRACK_X0 + t * TRACK_W}
              y={CAXIS_Y + 18}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              fillOpacity="0.55"
            >
              {t}
            </text>
          </g>
        ))}

        {/* ── right: running-total bar on a fixed 0..5 bit axis ── */}
        <rect
          x={BIT_X0}
          y={BIT_Y}
          width={BIT_W}
          height={BIT_H}
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.26"
          strokeWidth="1"
        />
        {/* total before this symbol */}
        <rect
          x={BIT_X0}
          y={BIT_Y}
          width={((fr.total - Number(fr.charge)) / BIT_MAX) * BIT_W}
          height={BIT_H}
          rx="2"
          fill={ACCENT}
          fillOpacity="0.85"
          stroke={ACCENT}
          strokeWidth="1.2"
        />
        {/* this symbol's charge, added on */}
        <rect
          x={BIT_X0 + ((fr.total - Number(fr.charge)) / BIT_MAX) * BIT_W}
          y={BIT_Y}
          width={(Number(fr.charge) / BIT_MAX) * BIT_W}
          height={BIT_H}
          rx="2"
          fill={ACCENT}
          fillOpacity="0.32"
          stroke={ACCENT}
          strokeWidth="1.2"
        />
        {[0, 1, 2, 3, 4, 5].map((t) => (
          <g key={`bt${t}`}>
            <line
              x1={BIT_X0 + (t / BIT_MAX) * BIT_W}
              y1={BIT_Y + BIT_H}
              x2={BIT_X0 + (t / BIT_MAX) * BIT_W}
              y2={BIT_Y + BIT_H + 5}
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="1.1"
            />
            <text
              x={BIT_X0 + (t / BIT_MAX) * BIT_W}
              y={BIT_Y + BIT_H + 18}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              fillOpacity="0.55"
            >
              {t}
            </text>
          </g>
        ))}

        {/* ── bottom strip ── */}
        <rect
          x={STRIP_X}
          y={STRIP_Y}
          width={STRIP_W}
          height={STRIP_H}
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.26"
          strokeWidth="1.3"
          strokeDasharray="4 3"
        />
        <CountBox
          x={SBOX_X_A}
          y={SBOX_Y}
          value={fr.after[0]}
          hot={takenA}
        />
        <CountBox
          x={SBOX_X_B}
          y={SBOX_Y}
          value={fr.after[1]}
          hot={!takenA}
        />
      </svg>

      {/* ── header ── */}
      <Lbl x={W / 2} y={16} anchor="c" style={{ fontSize: 16, fontWeight: 600 }}>
        {fr.header}
      </Lbl>

      {/* ── panel titles ── */}
      <Lbl x={LX + LW / 2} y={PY + 17} anchor="c" style={{ fontSize: 11.5, opacity: 0.6, textAlign: "center", whiteSpace: "normal", width: LW - 16 }}>
        counts before
        <br />
        this symbol
      </Lbl>
      <Lbl x={CX + CW / 2} y={PY + 17} anchor="c" style={{ fontSize: 11.5, opacity: 0.6 }}>
        prediction
      </Lbl>
      <Lbl x={RX + RW / 2} y={PY + 17} anchor="c" style={{ fontSize: 11.5, opacity: 0.6 }}>
        charge
      </Lbl>

      {/* ── left: F_a / F_b labels ── */}
      <Lbl x={LBOX_X - 10} y={LBOX_Y_A + BOX_H / 2} anchor="r">
        <M tex={String.raw`F_a`} size={14} />
      </Lbl>
      <Lbl x={LBOX_X - 10} y={LBOX_Y_B + BOX_H / 2} anchor="r">
        <M tex={String.raw`F_b`} size={14} />
      </Lbl>

      {/* ── center: q labels and exact fractions ── */}
      <Lbl x={TRACK_X0 - 12} y={BAR_Y_A + BAR_H / 2} anchor="r">
        <M tex={String.raw`\textcolor{${takenA ? ACCENT : SUPPORT}}{q(a)}`} size={14} />
      </Lbl>
      <Lbl x={TRACK_X0 - 12} y={BAR_Y_B + BAR_H / 2} anchor="r">
        <M tex={String.raw`\textcolor{${takenA ? SUPPORT : ACCENT}}{q(b)}`} size={14} />
      </Lbl>
      <Lbl x={TRACK_X0 + TRACK_W + 12} y={BAR_Y_A + BAR_H / 2}>
        <M tex={String.raw`\textcolor{${takenA ? ACCENT : SUPPORT}}{${fr.qaTex}}`} size={15} />
      </Lbl>
      <Lbl x={TRACK_X0 + TRACK_W + 12} y={BAR_Y_B + BAR_H / 2}>
        <M tex={String.raw`\textcolor{${takenA ? SUPPORT : ACCENT}}{${fr.qbTex}}`} size={15} />
      </Lbl>

      {/* ── right: the charge ── */}
      <Lbl x={RX + RW / 2} y={PY + 44} anchor="c">
        <M
          tex={String.raw`q(\textcolor{${takenColor}}{${fr.taken}}) = \textcolor{${takenColor}}{${fr.qTakenTex}}`}
          size={14}
        />
      </Lbl>
      <Lbl x={RX + RW / 2} y={PY + 74} anchor="c">
        <M
          tex={String.raw`-\log_2 ${fr.qTakenTex} = \textcolor{${ACCENT}}{${fr.charge}}\ \text{bits}`}
          size={14}
        />
      </Lbl>

      {/* ── right: running total ── */}
      <Lbl x={BIT_X0} y={PY + 100} style={{ fontSize: 11.5, opacity: 0.6 }}>
        running total
      </Lbl>
      <Lbl x={BIT_X0 + BIT_W} y={PY + 100} anchor="r" style={{ fontSize: 12.5 }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{${fr.totalTex}}\ \text{bits}`} size={13} />
      </Lbl>

      {/* ── bottom strip labels ── */}
      <Lbl x={STRIP_X + 18} y={STRIP_Y + STRIP_H / 2} style={{ fontSize: 12.5, opacity: 0.7 }}>
        counts after the update
      </Lbl>
      <Lbl x={SBOX_X_A - 10} y={SBOX_Y + BOX_H / 2} anchor="r">
        <M tex={String.raw`F_a`} size={14} />
      </Lbl>
      <Lbl x={SBOX_X_B - 10} y={SBOX_Y + BOX_H / 2} anchor="r">
        <M tex={String.raw`F_b`} size={14} />
      </Lbl>
      <Lbl
        x={W - STRIP_X - 18}
        y={STRIP_Y + STRIP_H / 2}
        anchor="r"
        style={{ fontSize: 11.5, opacity: 0.55, fontStyle: "italic" }}
      >
        the decoder makes the same update
      </Lbl>
    </div>
  );
}
