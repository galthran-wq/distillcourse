import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * OneHotCollapse — hardening a soft label to one-hot erases the entropy floor,
 * so cross-entropy becomes pure divergence (= negative log-likelihood).
 *
 * Two near-identical panels (playbook rule 8) joined by a bold "harden the
 * label" arrow. Each panel shows the label distribution p as blue bars, then a
 * horizontal stacked cost bar H(p,q) = H(p) [blue floor] + D(p||q) [amber
 * excess].
 *   Left ("soft label"): p = (0.7, 0.3); the blue floor H(p) = 0.881 is a real
 *     slab — a perfect model still pays it.
 *   Right ("one-hot label"): p = (1, 0); the blue floor has collapsed to zero
 *     width (the single changed piece, marked H(p) = 0), so the whole cost bar
 *     is amber: H(p,q) = D(p||q) = -log2 q(true).
 * Blue = truth/floor, amber = model's excess; the vanishing blue is the delta.
 *
 * One idea: for hard labels, cross-entropy IS the negative log-likelihood.
 */

// ── palette roles ──
const BLUE = SUPPORT; // truth / entropy floor
const AMBER = ACCENT; // model's excess / divergence

// ── per-panel geometry ──
const P_W = 244; // panel width

// probability-bar block
const PB_H = 132;
const PB_BASE = 100; // baseline y
const PB_FULL = 62; // px for p = 1
const PB_BARW = 40;
const PB_X1 = 62; // class 1 bar x
const PB_X2 = 132; // class 2 bar x

// cost-bar block
const CB_H = 116;
const CB_X0 = 20; // bits = 0
const CB_PPB = 116; // px per bit
const CB_BARY = 40;
const CB_BARH = 26;
const cx = (bits: number) => CB_X0 + bits * CB_PPB;

const H_P = 0.881; // H(0.7, 0.3)
const D_SOFT = 0.62; // illustrative divergence width, soft panel
const D_HARD = 1.06; // illustrative divergence width, one-hot panel

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

/** The label distribution p as two blue bars over two classes. */
function ProbBars({ oneHot }: { oneHot: boolean }) {
  const p1 = oneHot ? 1 : 0.7;
  const p2 = oneHot ? 0 : 0.3;
  const h1 = p1 * PB_FULL;
  const h2 = p2 * PB_FULL;
  return (
    <div style={{ position: "relative", width: P_W, height: PB_H }}>
      <svg width={P_W} height={PB_H} viewBox={`0 0 ${P_W} ${PB_H}`} aria-hidden="true">
        {/* baseline */}
        <line
          x1={PB_X1 - 16}
          y1={PB_BASE}
          x2={PB_X2 + PB_BARW + 16}
          y2={PB_BASE}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.4"
        />
        {/* class 1 bar (always present) */}
        <rect x={PB_X1} y={PB_BASE - h1} width={PB_BARW} height={h1} rx="2" fill={BLUE} opacity="0.9" />
        {/* class 2: real bar (soft) or dashed empty slot (one-hot) */}
        {oneHot ? (
          <rect
            x={PB_X2}
            y={PB_BASE - PB_FULL}
            width={PB_BARW}
            height={PB_FULL}
            rx="2"
            fill="none"
            stroke={BLUE}
            strokeWidth="1.3"
            strokeDasharray="4 3"
            opacity="0.45"
          />
        ) : (
          <rect x={PB_X2} y={PB_BASE - h2} width={PB_BARW} height={h2} rx="2" fill={BLUE} opacity="0.9" />
        )}
        {/* p-value labels above each bar */}
        <text x={PB_X1 + PB_BARW / 2} y={PB_BASE - h1 - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill={BLUE}>
          {oneHot ? "1" : "0.7"}
        </text>
        <text
          x={PB_X2 + PB_BARW / 2}
          y={oneHot ? PB_BASE - 8 : PB_BASE - h2 - 8}
          textAnchor="middle"
          fontSize="13"
          fontWeight="600"
          fill={BLUE}
          opacity={oneHot ? 0.5 : 1}
        >
          {oneHot ? "0" : "0.3"}
        </text>
        {/* class labels */}
        <text x={PB_X1 + PB_BARW / 2} y={PB_BASE + 16} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
          class 1
        </text>
        <text x={PB_X2 + PB_BARW / 2} y={PB_BASE + 16} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
          class 2
        </text>
      </svg>
      {/* which distribution these bars are */}
      <Lbl x={PB_X1 - 16} y={8} anchor="l" style={{ ...labelMuted, fontSize: 12 }}>
        label&nbsp;
        <M tex={String.raw`\textcolor{${BLUE}}{p} = (${oneHot ? "1, 0" : "0.7, 0.3"})`} size={12} />
      </Lbl>
    </div>
  );
}

/** The cost bar: blue floor H(p) + amber excess D(p||q). */
function CostBar({ oneHot }: { oneHot: boolean }) {
  const blueW = oneHot ? 0 : H_P * CB_PPB;
  const amberW = (oneHot ? D_HARD : D_SOFT) * CB_PPB;
  const blueEnd = CB_X0 + blueW;
  const amberEnd = blueEnd + amberW;
  return (
    <div style={{ position: "relative", width: P_W, height: CB_H }}>
      <svg width={P_W} height={CB_H} viewBox={`0 0 ${P_W} ${CB_H}`} aria-hidden="true">
        {/* blue floor segment (collapsed to zero on the right) */}
        {!oneHot && (
          <rect x={CB_X0} y={CB_BARY} width={blueW} height={CB_BARH} fill={BLUE} opacity="0.9" />
        )}
        {/* amber excess segment */}
        <rect x={blueEnd} y={CB_BARY} width={amberW} height={CB_BARH} fill={AMBER} opacity="0.92" />
        {/* whole-bar hairline outline */}
        <rect
          x={CB_X0}
          y={CB_BARY}
          width={amberEnd - CB_X0}
          height={CB_BARH}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.3"
        />
        {oneHot && (
          /* the vanished floor: a highlighted zero-width blue tick at origin */
          <line
            x1={CB_X0}
            y1={CB_BARY - 8}
            x2={CB_X0}
            y2={CB_BARY + CB_BARH + 8}
            stroke={BLUE}
            strokeWidth="3"
          />
        )}
      </svg>

      {/* ── segment / bar labels ── */}
      {!oneHot ? (
        <>
          <Lbl x={(CB_X0 + blueEnd) / 2} y={16} style={{ color: BLUE }}>
            <M tex={String.raw`\textcolor{${BLUE}}{H(p) = 0.881}`} size={12} />
          </Lbl>
          <Lbl x={(blueEnd + amberEnd) / 2} y={16} style={{ color: AMBER }}>
            <M tex={String.raw`\textcolor{${AMBER}}{D(p\,\|\,q)}`} size={12} />
          </Lbl>
          <Lbl x={CB_X0} y={CB_BARY + CB_BARH + 12} anchor="l" style={{ ...labelMuted, fontSize: 11.5 }}>
            floor <b style={{ color: BLUE, opacity: 1 }}>&gt; 0</b>: perfect model still pays 0.881 bits
          </Lbl>
        </>
      ) : (
        <>
          <Lbl x={CB_X0} y={16} anchor="c" style={{ color: BLUE, fontSize: 12 }}>
            <M tex={String.raw`\textcolor{${BLUE}}{H(p) = 0}`} size={12} />
          </Lbl>
          <Lbl x={P_W / 2} y={CB_BARY + CB_BARH + 12} anchor="c" style={{ color: AMBER }}>
            <M tex={String.raw`\textcolor{${AMBER}}{H(p,q) = D(p\,\|\,q) = -\log_2 q(\text{true})}`} size={11.5} />
          </Lbl>
          <Lbl x={P_W / 2} y={CB_BARY + CB_BARH + 34} anchor="c" style={{ ...labelMuted, fontSize: 11.5 }}>
            no floor: loss is pure divergence
          </Lbl>
        </>
      )}
    </div>
  );
}

function Panel({ oneHot }: { oneHot: boolean }) {
  return (
    <div style={{ width: P_W, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: oneHot ? AMBER : "currentColor" }}>
        {oneHot ? "one-hot label" : "soft label"}
      </div>
      <ProbBars oneHot={oneHot} />
      <CostBar oneHot={oneHot} />
    </div>
  );
}

/** Bold arrow joining the two panels. */
function HardenArrow() {
  return (
    <div
      style={{
        width: 96,
        alignSelf: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, textAlign: "center", lineHeight: 1.15 }}>
        harden
        <br />
        the label
      </div>
      <svg width="96" height="26" viewBox="0 0 96 26" aria-hidden="true">
        <defs>
          <marker id="ohc-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0 0 L9 4.5 L0 9 Z" fill="currentColor" />
          </marker>
        </defs>
        <line
          x1="6"
          y1="13"
          x2="82"
          y2="13"
          stroke="currentColor"
          strokeWidth="2.5"
          markerEnd="url(#ohc-arrow)"
        />
      </svg>
    </div>
  );
}

export default function OneHotCollapse() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: 620 }}>
      {/* shared identity: which term vanishes */}
      <div style={{ textAlign: "center", fontSize: 15, marginBottom: 10 }}>
        <M
          tex={String.raw`\underbrace{H(p,q)}_{\text{cross-entropy}} \;=\; \textcolor{${BLUE}}{H(p)} \;+\; \textcolor{${AMBER}}{D(p\,\|\,q)}`}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "stretch", gap: 4 }}>
        <Panel oneHot={false} />
        <HardenArrow />
        <Panel oneHot={true} />
      </div>
    </div>
  );
}
