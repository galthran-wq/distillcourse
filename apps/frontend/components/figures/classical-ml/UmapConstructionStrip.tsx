import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * UmapConstructionStrip — UMAP's construction as a four-stage pipeline
 * (FIGURE PLAN "draw: UMAP's construction strip" for the `tsne` lesson):
 * kNN graph → per-point (ρ, σ) calibration → fuzzy union of the directed
 * edges → cross-entropy layout, closing on the boxed map kernel and the
 * a = b = 1 identity that recovers t-SNE's Student-t.
 *
 * One idea: every stage is a t-SNE move restated on an explicit graph, and
 * the last box is where the two methods turn out to be the same object.
 *
 * Stages 1 and 3 share one scatter, redrawn: the same ten points, first with
 * directed edges out of the focal point, then unioned into undirected edges
 * whose opacity IS the fused weight — so the fuzzy-union formula has a
 * picture beside it rather than only a name.
 *
 * Color roles (two hues + currentColor):
 *   amber = the graph's edges — the focal point, its k-NN edges, the fused
 *           weights, and the attraction term they drive
 *   blue  = the per-point calibration ρ_i, σ_i, and the repulsion term on
 *           the pairs that are NOT edges
 * Arrows point right only; the terminal callout hangs off the last stage.
 */

const NEUTRAL = "rgba(128,128,128,0.55)";
const ARROW = "rgba(128,128,128,0.62)";
const FILL = "color-mix(in srgb, currentColor 4%, transparent)";

const am = (t: string) => String.raw`\textcolor{${ACCENT}}{${t}}`;
const bl = (t: string) => String.raw`\textcolor{${SUPPORT}}{${t}}`;
const RHO = bl(String.raw`\rho_i`);
const SIG = bl(String.raw`\sigma_i`);

// ── column geometry: stage boxes interleaved with arrow gutters ────────────
const COLS = [146, 20, 236, 20, 164, 20, 178];
const TOTAL = COLS.reduce((a, b) => a + b, 0); // 784 — fits the 800px body
const CALLOUT_W = 250;

// ── the scatter shared by stages 1 and 3 ──────────────────────────────────
type P = { x: number; y: number };
const F: P = { x: 42, y: 44 }; // focal point x_i
const A: P = { x: 26, y: 30 };
const B: P = { x: 58, y: 36 };
const C: P = { x: 36, y: 64 };
const D: P = { x: 12, y: 56 };
const E: P = { x: 70, y: 18 };
const G: P = { x: 86, y: 50 };
const H: P = { x: 102, y: 32 };
const I: P = { x: 94, y: 72 };
const J: P = { x: 62, y: 70 };
const PTS: P[] = [F, A, B, C, D, E, G, H, I, J];

/** Segment from a to b, trimmed by padA/padB so it clears the dots. */
function seg(a: P, b: P, padA: number, padB: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: a.x + ux * padA,
    y1: a.y + uy * padA,
    x2: b.x - ux * padB,
    y2: b.y - uy * padB,
  };
}

/** Two-stroke arrowhead at b, pointing along a→b, standing off by pad. */
function headPath(a: P, b: P, pad: number, size = 4) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tx = b.x - ux * pad;
  const ty = b.y - uy * pad;
  const wing = (s: number) =>
    `${tx - ux * size + -uy * size * s * 0.62} ${ty - uy * size + ux * size * s * 0.62}`;
  return `M ${wing(1)} L ${tx} ${ty} L ${wing(-1)}`;
}

/** Fused (undirected) edges of stage 3; opacity is the fused weight v_ij. */
const UNION: [P, P, number][] = [
  [F, B, 0.95],
  [F, A, 0.85],
  [F, C, 0.8],
  [A, D, 0.6],
  [D, C, 0.5],
  [C, J, 0.55],
  [J, B, 0.42],
  [B, E, 0.5],
  [E, H, 0.58],
  [H, G, 0.68],
  [G, I, 0.52],
  [I, J, 0.3],
  [G, B, 0.26],
  [A, B, 0.22],
];

function Dot({ p, focal = false }: { p: P; focal?: boolean }) {
  return (
    <circle
      cx={p.x}
      cy={p.y}
      r={focal ? 3.6 : 2.7}
      fill={focal ? ACCENT : "currentColor"}
      opacity={focal ? 1 : 0.62}
    />
  );
}

function Scatter({ mode }: { mode: "knn" | "union" }) {
  return (
    <svg viewBox="4 10 106 72" width="130" aria-hidden="true" style={{ display: "block" }}>
      {mode === "knn"
        ? [A, B, C].map((q, i) => {
            const s = seg(F, q, 4.6, 4.6);
            return (
              <g key={`e${i}`}>
                <line {...s} stroke={ACCENT} strokeWidth="1.5" opacity="0.9" />
                <path
                  d={headPath(F, q, 4.6)}
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })
        : UNION.map(([a, b, w], i) => {
            const s = seg(a, b, 3.4, 3.4);
            return (
              <line
                key={`u${i}`}
                {...s}
                stroke={ACCENT}
                strokeWidth={0.8 + w * 1.8}
                // floor the opacity: pure w leaves the weakest edges invisible
                // on the dark theme, and width carries the weight anyway
                opacity={0.3 + w * 0.68}
                strokeLinecap="round"
              />
            );
          })}
      {PTS.map((p, i) => (
        <Dot key={`p${i}`} p={p} focal={p === F} />
      ))}
      {mode === "knn" ? (
        <text x={F.x + 5} y={F.y + 11} fontSize="9" fill={ACCENT} fontStyle="italic">
          x
          <tspan dy="2.2" fontSize="6.5">
            i
          </tspan>
        </text>
      ) : null}
    </svg>
  );
}

// ── frame pieces ──────────────────────────────────────────────────────────
function Arrow() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="20" height="10" viewBox="0 0 20 10" aria-hidden="true">
        <line x1="0" y1="5" x2="17" y2="5" stroke={ARROW} strokeWidth="1.4" />
        <path
          d="M12.5 1.8 L17 5 L12.5 8.2"
          fill="none"
          stroke={ARROW}
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 17,
        height: 17,
        flexShrink: 0,
        borderRadius: "50%",
        border: `1.2px solid ${NEUTRAL}`,
        fontSize: 10.5,
        fontWeight: 600,
        opacity: 0.85,
        lineHeight: 1,
      }}
    >
      {n}
    </span>
  );
}

function Head({ n, text }: { n: number; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingBottom: 7,
      }}
    >
      <Badge n={n} />
      <span
        style={{
          fontSize: 9.5,
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          opacity: 0.55,
          lineHeight: 1.3,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: "11px 5px",
        border: `1.4px solid ${NEUTRAL}`,
        borderRadius: 8,
        background: FILL,
      }}
    >
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, opacity: 0.55, lineHeight: 1.35, textAlign: "center" }}>
      {children}
    </div>
  );
}

function Swatch({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span
        style={{ width: 11, height: 11, borderRadius: 3, background: color, display: "inline-block", flexShrink: 0 }}
      />
      <span style={{ fontSize: 11.5, opacity: 0.78 }}>{children}</span>
    </span>
  );
}

export default function UmapConstructionStrip() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "currentColor",
        width: TOTAL,
        maxWidth: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS.map((w) => `${w}px`).join(" "),
          alignItems: "stretch",
        }}
      >
        <Head n={1} text="kNN graph" />
        <div />
        <Head n={2} text="local calibration" />
        <div />
        <Head n={3} text="fuzzy union" />
        <div />
        <Head n={4} text="cross-entropy layout" />

        {/* ── 1. the explicit graph ── */}
        <Stage>
          <Scatter mode="knn" />
          <Note>
            directed edges, every point to its <M tex="k = 3" size={10.5} /> nearest
          </Note>
        </Stage>
        <Arrow />

        {/* ── 2. a local metric per point ── */}
        <Stage>
          <M tex={String.raw`${RHO} = \min_j d(x_i, x_j)`} size={12.5} />
          <Note>distance to the nearest neighbor</Note>
          <M
            tex={String.raw`\sum_j \exp\!\bigl(-\max(0,\, d(x_i,x_j) - ${RHO})\big/ ${SIG}\bigr)`}
            size={10.5}
          />
          <M tex={String.raw`= \underbrace{\log_2 k}_{\text{target}}`} size={12} />
          <Note>
            the effective-neighbor target &mdash; perplexity&rsquo;s role, restated
          </Note>
        </Stage>
        <Arrow />

        {/* ── 3. symmetrize by probabilistic OR ── */}
        <Stage>
          <Scatter mode="union" />
          <M tex={String.raw`${am("v_{ij}")} = v_{j|i} + v_{i|j} - v_{j|i}\,v_{i|j}`} size={11} />
          <Note>
            P(at least one direction) &mdash; drawn as edge opacity
          </Note>
        </Stage>
        <Arrow />

        {/* ── 4. the loss the layout descends ── */}
        <Stage>
          <M
            tex={String.raw`\sum_{ij} \Bigl[ \underbrace{v_{ij} \log \dfrac{v_{ij}}{w_{ij}}}_{${am(String.raw`\text{attraction on edges}`)}}`}
            size={11}
          />
          <M
            tex={String.raw`+\; \underbrace{(1 - v_{ij}) \log \dfrac{1 - v_{ij}}{1 - w_{ij}}}_{${bl(String.raw`\text{repulsion on non-edges}`)}} \Bigr]`}
            size={11}
          />
          <Note>
            no global <M tex="Z" size={10} /> &mdash; sample an edge, step
          </Note>
        </Stage>
      </div>

      {/* ── bottom band: the legend fills the space the strip leaves, the
             terminal callout hangs under stage 4 ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            paddingBottom: 6,
            paddingLeft: 2,
          }}
        >
          <Swatch color={ACCENT}>the graph&rsquo;s edges &mdash; and the attraction they pull with</Swatch>
          <Swatch color={SUPPORT}>
            the per-point calibration <M tex={String.raw`${RHO}, ${SIG}`} size={11.5} /> &mdash; and the
            repulsion on non-edges
          </Swatch>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: CALLOUT_W }}>
          {/* the tie descends from the centre of stage 4, not of the callout */}
          <svg width={CALLOUT_W} height="26" viewBox={`0 0 ${CALLOUT_W} 26`} aria-hidden="true">
            <line x1={CALLOUT_W - 89} y1="0" x2={CALLOUT_W - 89} y2="22" stroke={ARROW} strokeWidth="1.4" />
            <path
              d={`M ${CALLOUT_W - 92.2} 17.5 L ${CALLOUT_W - 89} 22 L ${CALLOUT_W - 85.8} 17.5`}
              fill="none"
              stroke={ARROW}
              strokeWidth="1.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <text
              x={CALLOUT_W - 97}
              y="15"
              textAnchor="end"
              fontSize="10"
              fontStyle="italic"
              fill="currentColor"
              opacity="0.5"
            >
              the map kernel
            </text>
          </svg>
          <div
            style={{
              boxSizing: "border-box",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "10px 8px",
              border: `1.6px solid ${NEUTRAL}`,
              borderRadius: 8,
              background: FILL,
            }}
          >
            <M tex={String.raw`w_{ij} = \bigl(1 + a\lVert y_i - y_j \rVert^{2b}\bigr)^{-1}`} size={12.5} />
            <div style={{ fontSize: 11.5, lineHeight: 1.35, textAlign: "center" }}>
              <M tex="a = b = 1" size={11.5} />
              <span style={{ opacity: 0.75 }}> &rArr; </span>
              <b>t-SNE&rsquo;s kernel</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
