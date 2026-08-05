import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * IbToyMerges — FigureSequence, 4 frames. The toy IB source (X uniform on
 * {a,b,c,d}, binary label Y with p(1|a)=0, p(1|b)=1/4, p(1|c)=3/4, p(1|d)=1)
 * priced under the identity encoder and the three hard 2-cluster merges.
 *
 * Shared layout:
 *   left  — the 2×4 joint table p(x,y); beneath it a linking-bracket row
 *           (blue = the clustering / rate) and a conditional strip plotting
 *           p(1|x) as amber dots on a 0–1 axis (a at 0, b at 1/4, c at 3/4,
 *           d at 1), with blue arcs linking each merged pair to an amber ring
 *           at the fused conditional p(1|t).
 *   right — a two-bar tally on fixed scales: rate I(X;T) (blue, 0–2) and
 *           relevance I(T;Y) (amber, 0–0.594 with a dashed ceiling at 0.594
 *           labelled I(X;Y)).
 *
 * Frame 1 identity T=X: rate 2, relevance 0.594 (at the ceiling).
 * Frame 2 ab|cd: neighbours fused, rate 1, relevance 0.456.
 * Frame 3 ac|bd: distant conditionals fused, rate 1, relevance 0.046.
 * Frame 4 ad|bc: opposites average to 1/2, rate 1, relevance 0.
 * Exactly one pairing + tally value changes per frame.
 *
 * One idea: same rate, three relevances — merging similar conditionals keeps
 * the label information.
 */

const BLUE = SUPPORT;
const AMBER = ACCENT;

// ── joint table ──
const CELL = 46;
const ROWLBL = 40;
const COLW = 4 * CELL; // 184: the a,b,c,d columns region

const F = (n: number, d: number) => String.raw`\tfrac{${n}}{${d}}`;

const SYM = ["a", "b", "c", "d"];
const COND = [0, 0.25, 0.75, 1]; // p(1|x) for a,b,c,d
const CONDTEX = ["0", F(1, 4), F(3, 4), "1"];

// ── conditional strip geometry (within the COLW-wide region) ──
const SPAD = 16;
const SX = (v: number) => SPAD + v * (COLW - 2 * SPAD); // 0->16, 1->168
const AXIS_Y = 60;
const arcPeak = (span: number) => Math.min(40, 12 + span * 0.16);

// ── frame config ──
type Merge = { cols: [number, number]; level: number; avgTex: string };
type FrameCfg = {
  merges: Merge[];
  pairing?: string;
  rate: number;
  relevance: number;
  relTex: string;
  caption: string;
};

const FRAMES: FrameCfg[] = [
  {
    merges: [],
    rate: 2,
    relevance: 0.594,
    relTex: "0.594",
    caption: "before merging: all rate, all relevance",
  },
  {
    merges: [
      { cols: [0, 1], level: 0, avgTex: F(1, 8) },
      { cols: [2, 3], level: 0, avgTex: F(7, 8) },
    ],
    pairing: String.raw`t_1=\{a,b\},\ t_2=\{c,d\}`,
    rate: 1,
    relevance: 0.456,
    relTex: "0.456",
    caption: "aligned merge ab | cd — neighbours fused, relevance barely drops",
  },
  {
    merges: [
      { cols: [0, 2], level: 0, avgTex: F(3, 8) },
      { cols: [1, 3], level: 1, avgTex: F(5, 8) },
    ],
    pairing: String.raw`t_1=\{a,c\},\ t_2=\{b,d\}`,
    rate: 1,
    relevance: 0.046,
    relTex: "0.046",
    caption: "ac | bd — distant conditionals fused",
  },
  {
    merges: [
      { cols: [1, 2], level: 0, avgTex: F(1, 2) },
      { cols: [0, 3], level: 1, avgTex: F(1, 2) },
    ],
    pairing: String.raw`t_1=\{a,d\},\ t_2=\{b,c\}`,
    rate: 1,
    relevance: 0.0,
    relTex: "0.000",
    caption: "ad | bc — opposites average to a fair coin, relevance 0",
  },
];

function Cell({ tex }: { tex: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: CELL,
        height: 38,
        border: "1px solid color-mix(in srgb, currentColor 30%, transparent)",
        fontSize: 14,
      }}
    >
      <M tex={tex} />
    </div>
  );
}

function ColHead({ tex }: { tex: string }) {
  return (
    <div style={{ width: CELL, textAlign: "center", paddingBottom: 3, fontWeight: 600 }}>
      <M tex={tex} size={13} />
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
        width: ROWLBL,
        height: 38,
        paddingRight: 8,
      }}
    >
      <M tex={tex} size={12} />
    </div>
  );
}

// absolute-positioned KaTeX overlay label
function Lbl({
  x,
  y,
  anchor = "c",
  style,
  children,
}: {
  x: number;
  y: number;
  anchor?: "l" | "c" | "r";
  style?: CSSProperties;
  children: React.ReactNode;
}) {
  const transform =
    anchor === "c"
      ? "translate(-50%, -50%)"
      : anchor === "r"
        ? "translate(-100%, -50%)"
        : "translate(0, -50%)";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform,
        whiteSpace: "nowrap",
        fontFamily: "system-ui, sans-serif",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── linking-bracket row under the columns ──
const BR_BASE = 8;
const BR_STEP = 15;
const BR_H = BR_BASE + BR_STEP + 6; // 29

function Brackets({ merges }: { merges: Merge[] }) {
  const cx = (i: number) => i * CELL + CELL / 2;
  return (
    <svg width={COLW} height={BR_H} viewBox={`0 0 ${COLW} ${BR_H}`} aria-hidden="true">
      {merges.map((m, k) => {
        const [c0, c1] = m.cols;
        const xa = cx(c0);
        const xb = cx(c1);
        const yb = BR_BASE + m.level * BR_STEP;
        return (
          <path
            key={k}
            d={`M ${xa} 0 L ${xa} ${yb} L ${xb} ${yb} L ${xb} 0`}
            fill="none"
            stroke={BLUE}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}

// ── conditional strip ──
const STRIP_H = 118;

function Strip({ merges }: { merges: Merge[] }) {
  return (
    <div style={{ position: "relative", width: COLW, height: STRIP_H }}>
      <svg width={COLW} height={STRIP_H} viewBox={`0 0 ${COLW} ${STRIP_H}`} aria-hidden="true">
        {/* axis */}
        <line
          x1={SX(0) - 6}
          y1={AXIS_Y}
          x2={SX(1) + 6}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />
        {[0, 0.5, 1].map((v) => (
          <line
            key={v}
            x1={SX(v)}
            y1={AXIS_Y}
            x2={SX(v)}
            y2={AXIS_Y + 4}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        ))}

        {/* cluster arcs (blue) + fused-conditional rings (amber) */}
        {merges.map((m, k) => {
          const [c0, c1] = m.cols;
          const xa = SX(COND[c0]);
          const xb = SX(COND[c1]);
          const mid = (xa + xb) / 2;
          const peak = arcPeak(Math.abs(xb - xa));
          return (
            <g key={k}>
              <path
                d={`M ${xa} ${AXIS_Y} Q ${mid} ${AXIS_Y - peak} ${xb} ${AXIS_Y}`}
                fill="none"
                stroke={BLUE}
                strokeWidth="1.5"
                strokeOpacity="0.85"
              />
              <circle cx={mid} cy={AXIS_Y} r="5.5" fill="var(--paper, #fff)" stroke={AMBER} strokeWidth="2" />
            </g>
          );
        })}

        {/* source conditional dots (amber) */}
        {COND.map((v, i) => (
          <circle key={i} cx={SX(v)} cy={AXIS_Y} r="4" fill={AMBER} />
        ))}
      </svg>

      {/* dot symbol + value labels */}
      {COND.map((v, i) => (
        <div key={i}>
          <Lbl x={SX(v)} y={AXIS_Y + 16} style={{ fontWeight: 600, color: AMBER }}>
            <M tex={SYM[i]} size={13} color={AMBER} />
          </Lbl>
          <Lbl x={SX(v)} y={AXIS_Y + 33} style={labelMuted}>
            <M tex={CONDTEX[i]} size={11.5} />
          </Lbl>
        </div>
      ))}

      {/* fused-conditional value labels just above each ring (coincident
          rings — frame 4's two clusters both land on 1/2 — labelled once) */}
      {merges
        .map((m) => ({
          mid: (SX(COND[m.cols[0]]) + SX(COND[m.cols[1]])) / 2,
          avgTex: m.avgTex,
        }))
        .filter((r, i, arr) => arr.findIndex((o) => Math.round(o.mid) === Math.round(r.mid)) === i)
        .map((r, k) => (
          <Lbl key={k} x={r.mid} y={AXIS_Y - 14} style={{ color: AMBER }}>
            <M tex={r.avgTex} size={11.5} color={AMBER} />
          </Lbl>
        ))}

      {/* axis title */}
      <Lbl x={COLW / 2} y={STRIP_H - 9} style={labelMuted}>
        <M tex={String.raw`p(1\mid x)`} size={12} />
      </Lbl>
    </div>
  );
}

// ── right tally ──
const TRACK = 190; // px = full scale
const TRK_H = 22;

function Bar({
  name,
  color,
  frac,
  valueTex,
  ceiling,
  scaleTex,
}: {
  name: string;
  color: string;
  frac: number; // 0..1 of the track
  valueTex: string;
  ceiling?: string; // dashed ceiling label at the track's right end
  scaleTex: string; // max-scale end label
}) {
  const fill = Math.max(0, Math.min(1, frac)) * TRACK;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: 5, fontSize: 13 }}>
        <M tex={name} size={13} />
      </div>
      <div style={{ position: "relative", width: TRACK, height: TRK_H }}>
        {/* track outline */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1px solid color-mix(in srgb, currentColor 28%, transparent)",
          }}
        />
        {/* fill */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: TRK_H,
            width: fill,
            background: color,
            opacity: 0.9,
          }}
        />
        {/* ceiling */}
        {ceiling !== undefined && (
          <>
            <div
              style={{
                position: "absolute",
                left: TRACK,
                top: -9,
                height: TRK_H + 18,
                borderLeft: "1.4px dashed color-mix(in srgb, currentColor 55%, transparent)",
              }}
            />
            <Lbl x={TRACK} y={-20} anchor="c" style={{ ...labelMuted, fontSize: 11.5 }}>
              <M tex={ceiling} size={11.5} />
            </Lbl>
          </>
        )}
        {/* value on the fill */}
        <div
          style={{
            position: "absolute",
            left: fill > 44 ? fill - 8 : fill + 8,
            top: TRK_H / 2,
            transform: fill > 44 ? "translate(-100%, -50%)" : "translateY(-50%)",
            fontWeight: 600,
            color: fill > 44 ? "#fff" : "currentColor",
            fontSize: 12.5,
          }}
        >
          <M tex={valueTex} size={12} color={fill > 44 ? "#fff" : undefined} />
        </div>
      </div>
      {/* scale endpoints */}
      <div style={{ position: "relative", height: 16, marginTop: 2 }}>
        <Lbl x={0} y={7} anchor="l" style={{ ...labelMuted, fontSize: 11 }}>
          0
        </Lbl>
        <Lbl x={TRACK} y={7} anchor="c" style={{ ...labelMuted, fontSize: 11 }}>
          <M tex={scaleTex} size={11} />
        </Lbl>
      </div>
    </div>
  );
}

export default function IbToyMerges({ frame = 1 }: { frame?: number }) {
  const cfg = FRAMES[Math.max(0, Math.min(FRAMES.length - 1, frame - 1))];
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 40,
          flexWrap: "wrap",
        }}
      >
        {/* ── LEFT: table + brackets + strip ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: 6, paddingLeft: ROWLBL }}>
            <M tex="p(x,y)" size={13} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `${ROWLBL}px repeat(4, ${CELL}px)` }}>
            <div />
            {SYM.map((s) => (
              <ColHead key={s} tex={s} />
            ))}
            <RowHead tex="y{=}0" />
            <Cell tex={F(1, 4)} />
            <Cell tex={F(3, 16)} />
            <Cell tex={F(1, 16)} />
            <Cell tex="0" />
            <RowHead tex="y{=}1" />
            <Cell tex="0" />
            <Cell tex={F(1, 16)} />
            <Cell tex={F(3, 16)} />
            <Cell tex={F(1, 4)} />
          </div>

          {/* brackets aligned under the columns */}
          <div style={{ paddingLeft: ROWLBL, marginTop: 2 }}>
            <Brackets merges={cfg.merges} />
          </div>

          {/* pairing name (blue) */}
          <div style={{ paddingLeft: ROWLBL, minHeight: 22, textAlign: "center", width: COLW }}>
            {cfg.pairing ? (
              <span style={{ color: BLUE }}>
                <M tex={cfg.pairing} size={12.5} color={BLUE} />
              </span>
            ) : (
              <span style={{ ...labelMuted, fontSize: 12.5 }}>
                <M tex={String.raw`T=X\ \text{(no merge)}`} size={12.5} />
              </span>
            )}
          </div>

          {/* conditional strip */}
          <div style={{ paddingLeft: ROWLBL, marginTop: 2 }}>
            <Strip merges={cfg.merges} />
          </div>
        </div>

        {/* ── RIGHT: tally ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26, paddingTop: 26 }}>
          <Bar
            name="\text{rate }I(X;T)"
            color={BLUE}
            frac={cfg.rate / 2}
            valueTex={`${cfg.rate}\\ \\text{bit${cfg.rate === 1 ? "" : "s"}}`}
            scaleTex="2"
          />
          <Bar
            name="\text{relevance }I(T;Y)"
            color={AMBER}
            frac={cfg.relevance / 0.594}
            valueTex={cfg.relTex}
            ceiling="I(X;Y)=0.594"
            scaleTex="0.594"
          />
        </div>
      </div>

      {/* frame caption */}
      <div style={{ ...labelMuted, textAlign: "center", fontSize: 12.5 }}>{cfg.caption}</div>
    </div>
  );
}
