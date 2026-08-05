import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * CpcPipeline — the Contrastive Predictive Coding system in one left-to-right
 * strip, showing where the InfoNCE bound sits inside a real model. Simplified
 * from van den Oord, Li & Vinyals (2018) fig. 1 (recreated in house style,
 * never copied).
 *
 * Tiers stack bottom-up (data -> representation -> computation), then the
 * prediction fans out to the right; every pipeline arrow points up or right.
 *   data           a waveform sliced by ticks into windows x_{t-2}..x_{t+2}
 *   representation  each window -> shared box "encoder g_enc" -> latent row
 *                   z_{t-2} .. z_{t+2}
 *   computation     the past latents z_{<=t} -> box "autoregressive g_ar" ->
 *                   context node c_t (amber)
 *   prediction      from c_t a fan of thin scoring arrows to the positive
 *                   z_{t+1} (amber, the signal's own future) and to two
 *                   detached blue negatives (other positions / other clips);
 *                   the fan reconverges into the amber-outlined "InfoNCE L_N"
 *                   box — the only loss.
 *
 * Color roles: amber = context c_t, the positive path, and the loss box (the
 * subject); blue = the negatives; currentColor = signal, encoder, latents,
 * g_ar. Legend words carry each hue so the binding is literal.
 *
 * One idea: the whole pipeline trains against a single contrastive lineup on
 * its own future, and that lineup's cross-entropy is the entire objective.
 */

const W = 760;
const H = 500;

// ── horizontal slots (windows == latents) ──────────────────────────────────
const CX = [100, 195, 290, 385, 480]; // z_{t-2} .. z_{t+2}
const SPAN0 = 55;
const SPAN1 = 525; // waveform / tick strip x-range
const TICKS = [55, 150, 245, 340, 435, 530];

// ── vertical tiers ─────────────────────────────────────────────────────────
const WAVE_Y = 448; // waveform centerline
const WAVE_AMP = 13;
const WAVE_TOP = WAVE_Y - WAVE_AMP - 6; // ~429
const ENC_TOP = 388;
const ENC_BOT = 420;
const NODE_W = 46;
const NODE_H = 28;
const LAT_Y = 350; // latent-row centerline
const LAT_TOP = LAT_Y - NODE_H / 2; // 336
const LAT_BOT = LAT_Y + NODE_H / 2; // 364

const GAR = { x0: 74, x1: 322, y0: 258, y1: 292 };
const CT = { cx: 292, cy: 220, w: 48, h: 30 }; // context node

// prediction targets
const POS = { cx: CX[3], cy: LAT_Y }; // z_{t+1} node in the row
const NEG = [
  { cx: 508, cy: 196 },
  { cx: 508, cy: 262 },
];
const LOSS = { x0: 608, x1: 742, y0: 236, y1: 320 };
const LOSS_CX = (LOSS.x0 + LOSS.x1) / 2;
const LOSS_CY = (LOSS.y0 + LOSS.y1) / 2;

const LABELS = ["z_{t-2}", "z_{t-1}", "z_t", "z_{t+1}", "z_{t+2}"];
const XLABELS = ["x_{t-2}", "x_{t-1}", "x_t", "x_{t+1}", "x_{t+2}"];

// deterministic waveform samples
function wavePoints() {
  const pts: string[] = [];
  for (let x = SPAN0; x <= SPAN1; x += 4) {
    const y =
      WAVE_Y +
      WAVE_AMP *
        (0.72 * Math.sin(x * 0.09) +
          0.42 * Math.sin(x * 0.19 + 1.1) +
          0.28 * Math.sin(x * 0.041 + 0.4));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = "currentColor",
  opacity = 1,
  width = 1.5,
  head = 6,
  dash,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  opacity?: number;
  width?: number;
  head?: number;
  dash?: string;
}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - head * Math.cos(ang);
  const by = y2 - head * Math.sin(ang);
  const perp = ang + Math.PI / 2;
  const hx = (head * 0.62) * Math.cos(perp);
  const hy = (head * 0.62) * Math.sin(perp);
  return (
    <g stroke={color} fill={color} opacity={opacity}>
      <line
        x1={x1}
        y1={y1}
        x2={bx}
        y2={by}
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
      <polygon
        points={`${x2},${y2} ${bx + hx},${by + hy} ${bx - hx},${by - hy}`}
        stroke="none"
      />
    </g>
  );
}

function Lbl({
  x,
  y,
  children,
  anchor = "c",
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
        lineHeight: 1.25,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function CpcPipeline() {
  const AMBER_TEXT = "#1c1710";
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
        {/* ── tier guide labels (far left, rotated) ── */}
        {[
          { t: "data", y: WAVE_Y },
          { t: "representation", y: (LAT_Y + ENC_TOP) / 2 },
          { t: "computation", y: CT.cy },
        ].map((g) => (
          <text
            key={g.t}
            x={16}
            y={g.y}
            transform={`rotate(-90 16 ${g.y})`}
            textAnchor="middle"
            fontSize="10.5"
            fill="currentColor"
            fillOpacity="0.4"
            letterSpacing="0.5"
          >
            {g.t}
          </text>
        ))}

        {/* ── waveform (data) ── */}
        <polyline
          points={wavePoints()}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeOpacity="0.85"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {TICKS.map((tx) => (
          <line
            key={`tk${tx}`}
            x1={tx}
            y1={WAVE_Y - WAVE_AMP - 8}
            x2={tx}
            y2={WAVE_Y + WAVE_AMP + 8}
            stroke="currentColor"
            strokeWidth="1.1"
            strokeOpacity="0.5"
          />
        ))}

        {/* ── window -> encoder (up) ── */}
        {CX.map((cx) => (
          <Arrow
            key={`we${cx}`}
            x1={cx}
            y1={WAVE_TOP}
            x2={cx}
            y2={ENC_BOT + 1}
            opacity={0.5}
            width={1.3}
            head={5}
          />
        ))}

        {/* ── shared encoder box ── */}
        <rect
          x={SPAN0 + 9}
          y={ENC_TOP}
          width={SPAN1 - SPAN0 - 18}
          height={ENC_BOT - ENC_TOP}
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />

        {/* ── encoder -> latents (up) ── */}
        {CX.map((cx) => (
          <Arrow
            key={`el${cx}`}
            x1={cx}
            y1={ENC_TOP}
            x2={cx}
            y2={LAT_BOT + 1}
            opacity={0.5}
            width={1.3}
            head={5}
          />
        ))}

        {/* ── latent nodes ── */}
        {CX.map((cx, i) => {
          const positive = i === 3;
          return (
            <rect
              key={`z${cx}`}
              x={cx - NODE_W / 2}
              y={LAT_TOP}
              width={NODE_W}
              height={NODE_H}
              rx="6"
              fill={positive ? ACCENT : "none"}
              fillOpacity={positive ? 0.9 : 1}
              stroke={positive ? ACCENT : "currentColor"}
              strokeOpacity={positive ? 1 : 0.55}
              strokeWidth={positive ? 1.8 : 1.4}
            />
          );
        })}

        {/* ── past latents -> g_ar (up) ── */}
        {[0, 1, 2].map((i) => (
          <Arrow
            key={`lg${i}`}
            x1={CX[i]}
            y1={LAT_TOP}
            x2={CX[i]}
            y2={GAR.y1 + 1}
            opacity={0.55}
            width={1.4}
            head={5}
          />
        ))}

        {/* ── g_ar box ── */}
        <rect
          x={GAR.x0}
          y={GAR.y0}
          width={GAR.x1 - GAR.x0}
          height={GAR.y1 - GAR.y0}
          rx="8"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />

        {/* ── g_ar -> c_t (up) ── */}
        <Arrow
          x1={CT.cx}
          y1={GAR.y0}
          x2={CT.cx}
          y2={CT.cy + CT.h / 2 + 1}
          color={ACCENT}
          width={1.6}
          head={6}
        />

        {/* ── context node c_t ── */}
        <rect
          x={CT.cx - CT.w / 2}
          y={CT.cy - CT.h / 2}
          width={CT.w}
          height={CT.h}
          rx="7"
          fill={ACCENT}
          fillOpacity="0.92"
          stroke={ACCENT}
          strokeWidth="1.6"
        />

        {/* ── prediction fan: c_t -> candidates (thin scoring arrows) ── */}
        <Arrow
          x1={CT.cx + CT.w / 2 - 4}
          y1={CT.cy + 4}
          x2={POS.cx - NODE_W / 2 - 3}
          y2={POS.cy - NODE_H / 2 - 1}
          color={ACCENT}
          width={1.5}
          head={6}
        />
        {NEG.map((n, i) => (
          <Arrow
            key={`cn${i}`}
            x1={CT.cx + CT.w / 2 - 2}
            y1={CT.cy}
            x2={n.cx - 15}
            y2={n.cy}
            color={SUPPORT}
            width={1.4}
            head={6}
          />
        ))}

        {/* ── detached negative nodes ── */}
        {NEG.map((n, i) => (
          <rect
            key={`ng${i}`}
            x={n.cx - NODE_W / 2}
            y={n.cy - NODE_H / 2}
            width={NODE_W}
            height={NODE_H}
            rx="6"
            fill={SUPPORT}
            fillOpacity="0.16"
            stroke={SUPPORT}
            strokeOpacity="0.9"
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
        ))}

        {/* ── candidates -> InfoNCE box (fan reconverges) ── */}
        <Arrow
          x1={POS.cx + NODE_W / 2 + 2}
          y1={POS.cy - 8}
          x2={LOSS.x0 - 2}
          y2={LOSS_CY + 8}
          color={ACCENT}
          width={1.5}
          head={6}
        />
        {NEG.map((n, i) => (
          <Arrow
            key={`nl${i}`}
            x1={n.cx + NODE_W / 2 + 2}
            y1={n.cy}
            x2={LOSS.x0 - 2}
            y2={LOSS_CY - 8 + i * 20}
            color={SUPPORT}
            width={1.4}
            head={6}
          />
        ))}

        {/* ── InfoNCE loss box ── */}
        <rect
          x={LOSS.x0}
          y={LOSS.y0}
          width={LOSS.x1 - LOSS.x0}
          height={LOSS.y1 - LOSS.y0}
          rx="9"
          fill={ACCENT}
          fillOpacity="0.08"
          stroke={ACCENT}
          strokeWidth="2"
        />
      </svg>

      {/* ═══════════ overlaid text / math ═══════════ */}

      {/* prediction tier label (top-right) */}
      <Lbl x={LOSS_CX} y={150} anchor="c" style={{ fontSize: 10.5, opacity: 0.4, letterSpacing: 0.5 }}>
        prediction
      </Lbl>

      {/* window labels under the waveform */}
      {CX.map((cx, i) => (
        <Lbl key={`xl${i}`} x={cx} y={WAVE_Y + WAVE_AMP + 24} anchor="c" style={{ opacity: 0.7 }}>
          <M tex={XLABELS[i]} size={12} />
        </Lbl>
      ))}

      {/* encoder label */}
      <Lbl x={(SPAN0 + SPAN1) / 2} y={(ENC_TOP + ENC_BOT) / 2} anchor="c">
        <span style={{ opacity: 0.8 }}>encoder&nbsp;</span>
        <M tex={String.raw`g_{\text{enc}}`} size={14} />
        <span style={{ opacity: 0.45, fontSize: 11, marginLeft: 8 }}>shared</span>
      </Lbl>

      {/* latent node labels */}
      {CX.map((cx, i) => (
        <Lbl key={`zl${i}`} x={cx} y={LAT_Y} anchor="c">
          <M tex={LABELS[i]} size={13} color={i === 3 ? AMBER_TEXT : undefined} />
        </Lbl>
      ))}

      {/* g_ar label */}
      <Lbl x={(GAR.x0 + GAR.x1) / 2} y={(GAR.y0 + GAR.y1) / 2} anchor="c">
        <span style={{ opacity: 0.8 }}>autoregressive&nbsp;</span>
        <M tex={String.raw`g_{\text{ar}}`} size={14} />
      </Lbl>

      {/* c_t node label + tag */}
      <Lbl x={CT.cx} y={CT.cy} anchor="c">
        <M tex={String.raw`c_t`} size={14} color={AMBER_TEXT} />
      </Lbl>
      <Lbl x={CT.cx} y={CT.cy - CT.h / 2 - 12} anchor="c" style={{ color: ACCENT, fontSize: 11.5, fontWeight: 600 }}>
        context
      </Lbl>

      {/* positive tag */}
      <Lbl x={452} y={312} anchor="c" style={{ color: ACCENT, fontSize: 11.5, textAlign: "center", whiteSpace: "normal", width: 150 }}>
        <b>positive</b>: the signal&#39;s own future
      </Lbl>

      {/* negative node labels */}
      {NEG.map((n, i) => (
        <Lbl key={`ngl${i}`} x={n.cx} y={n.cy} anchor="c">
          <M tex={String.raw`z^{-}_{${i + 1}}`} size={12} color={SUPPORT} />
        </Lbl>
      ))}
      <Lbl x={NEG[0].cx + 2} y={NEG[0].cy - NODE_H / 2 - 22} anchor="c" style={{ color: SUPPORT, fontSize: 11.5, textAlign: "center", whiteSpace: "normal", width: 170 }}>
        <b>negatives</b>: other positions / other clips
      </Lbl>

      {/* InfoNCE loss box label + tag */}
      <Lbl x={LOSS_CX} y={LOSS_CY - 8} anchor="c" style={{ color: ACCENT, fontWeight: 600, fontSize: 13 }}>
        InfoNCE
      </Lbl>
      <Lbl x={LOSS_CX} y={LOSS_CY + 16} anchor="c">
        <M tex={String.raw`\mathcal{L}_N`} size={16} color={ACCENT} />
      </Lbl>
      <Lbl x={LOSS_CX} y={LOSS.y1 + 16} anchor="c" style={{ color: ACCENT, opacity: 0.85, fontSize: 11.5, fontStyle: "italic" }}>
        the only loss
      </Lbl>
    </div>
  );
}
