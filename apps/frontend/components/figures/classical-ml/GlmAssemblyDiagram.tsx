import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * GlmAssemblyDiagram — the GLM pipeline once, then filled in three times
 * (FIGURE PLAN item 3 of the `glm` brief). The top row is the abstract
 * assembly line: x → linear predictor η = wᵀx → response function → mean μ →
 * exponential-family noise → y. The three rows below are the same columns
 * instantiated: linear (identity, Gaussian), logistic (sigmoid, Bernoulli),
 * Poisson (exp, Poisson), so the abstraction-to-instance mapping is literally
 * vertical alignment.
 *
 * One idea: pick the response family and everything downstream is forced —
 * the response function is the inverse of that family's natural parameter,
 * never a modelling choice.
 *
 * Arrows point right only (voita architecture rule); the instance rows carry
 * no arrows of their own, they inherit the pipeline's reading direction.
 *
 * Color roles (two hues + currentColor):
 *   amber = the mean path — response function and μ = E[y|x]
 *   blue  = the family — exponential-family noise and the outcome y
 *   currentColor (muted) = what never changes: the features x and η = wᵀx
 * Inspiration: CS229 ch. 3's three GLM assumptions — redrawn, not traced.
 */

const NEUTRAL = "rgba(128,128,128,0.55)";
const NEUTRAL_SOFT = "rgba(128,128,128,0.32)";
const ARROW = "rgba(128,128,128,0.6)";

const am = (t: string) => String.raw`\textcolor{${ACCENT}}{${t}}`;
const bl = (t: string) => String.raw`\textcolor{${SUPPORT}}{${t}}`;
const MU = am(String.raw`\mu`);
const Y = bl("y");

// ── column geometry: content columns interleaved with arrow columns ────────
const COLS = [70, 12, 36, 24, 80, 24, 126, 24, 90, 24, 136, 24, 112];
const TOTAL = COLS.reduce((a, b) => a + b, 0); // 784 — fits the 800px verifier body

function Arrow() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="24" height="10" viewBox="0 0 24 10" aria-hidden="true">
        <line x1="1" y1="5" x2="20" y2="5" stroke={ARROW} strokeWidth="1.4" />
        <path
          d="M15 1.6 L20 5 L15 8.4"
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

function Head({ text, badge, color }: { text: string; badge?: number; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 4,
        paddingBottom: 6,
      }}
    >
      <div style={{ height: 17, display: "flex", alignItems: "center" }}>
        {badge !== undefined ? <Badge n={badge} /> : null}
      </div>
      <div
        style={{
          fontSize: 9.5,
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          textAlign: "center",
          lineHeight: 1.35,
          color: color ?? "currentColor",
          opacity: color ? 0.95 : 0.5,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/** A box on the abstract pipeline row. */
function Stage({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        minHeight: 56,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        padding: "7px 5px",
        border: `1.5px solid ${color ?? NEUTRAL}`,
        borderRadius: 8,
        background: color ? `color-mix(in srgb, ${color} 6%, transparent)` : "transparent",
      }}
    >
      {children}
    </div>
  );
}

/** A cell on one of the three instance rows. */
function Cell({ children, first }: { children: React.ReactNode; first: boolean }) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        minHeight: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        padding: "6px 4px",
        borderTop: first ? "none" : `1px solid ${NEUTRAL_SOFT}`,
      }}
    >
      {children}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 10, opacity: 0.5, lineHeight: 1.2 }}>{children}</span>;
}

type Model = {
  name: string;
  response: string;
  mu: string;
  range: string;
  family: string;
  natural: string;
  support: string;
};

const MODELS: Model[] = [
  {
    name: "linear",
    response: "identity",
    mu: String.raw`${MU} = \eta`,
    range: String.raw`${MU} \in \mathbb{R}`,
    family: String.raw`\mathcal{N}(${MU},\, \sigma^2)`,
    natural: String.raw`\eta = ${MU}`,
    support: String.raw`${Y} \in \mathbb{R}`,
  },
  {
    name: "logistic",
    response: "sigmoid",
    mu: String.raw`${MU} = \tfrac{1}{1+e^{-\eta}}`,
    range: String.raw`${MU} \in (0,1)`,
    family: String.raw`\mathrm{Bern}(${MU})`,
    natural: String.raw`\eta = \log\tfrac{${MU}}{1-${MU}}`,
    support: String.raw`${Y} \in \{0,1\}`,
  },
  {
    name: "Poisson",
    response: "exp",
    mu: String.raw`${MU} = e^{\eta}`,
    range: String.raw`${MU} > 0`,
    family: String.raw`\mathrm{Pois}(${MU})`,
    natural: String.raw`\eta = \log ${MU}`,
    support: String.raw`${Y} \in \{0,1,2,\dots\}`,
  },
];

export default function GlmAssemblyDiagram() {
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
        {/* ── header: stage names, with the three GLM assumptions badged ── */}
        <Head text="model" />
        <div />
        <Head text="data" />
        <div />
        <Head text="linear predictor" badge={2} />
        <div />
        <Head text="response function" color={ACCENT} />
        <div />
        <Head text="mean" badge={3} color={ACCENT} />
        <div />
        <Head text="noise" badge={1} color={SUPPORT} />
        <div />
        <Head text="outcome" color={SUPPORT} />

        {/* ── the abstract assembly line ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
          <span style={{ fontSize: 12, fontStyle: "italic", opacity: 0.55 }}>any GLM</span>
        </div>
        <div />
        <Stage>
          <M tex="x" size={14} />
        </Stage>
        <Arrow />
        <Stage>
          <M tex={String.raw`\eta = w^{\top} x`} size={13} />
        </Stage>
        <Arrow />
        <Stage color={ACCENT}>
          <M tex={String.raw`${MU} = g^{-1}(\eta)`} size={13} />
        </Stage>
        <Arrow />
        <Stage color={ACCENT}>
          <M tex={String.raw`${MU} = \mathbb{E}[\,${Y} \mid x\,]`} size={11.5} />
        </Stage>
        <Arrow />
        <Stage color={SUPPORT}>
          <M tex={String.raw`${Y} \mid x \sim \mathrm{ExpFam}(\eta)`} size={11.5} />
          <M tex={String.raw`h(${Y})\,e^{\eta ${Y} - A(\eta)}`} size={10.5} />
        </Stage>
        <Arrow />
        <Stage color={SUPPORT}>
          <M tex={Y} size={14} />
        </Stage>

        {/* ── the same columns, filled in three times ── */}
        {MODELS.map((m, i) => (
          <Row key={m.name} m={m} first={i === 0} />
        ))}
      </div>

      {/* ── legend: every hue named, every badge spelled out ── */}
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${NEUTRAL_SOFT}` }}>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
          <Swatch color={ACCENT}>
            the mean path: response function and <M tex={MU} size={11.5} />
          </Swatch>
          <Swatch color={SUPPORT}>
            the family: exponential-family noise and its outcome <M tex={Y} size={11.5} />
          </Swatch>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 9, alignItems: "center" }}>
          <span style={{ fontSize: 11, opacity: 0.5 }}>the three GLM assumptions:</span>
          <Assume n={1}>
            <M tex={String.raw`${Y} \mid x \sim \mathrm{ExpFam}(\eta)`} size={11.5} />
          </Assume>
          <Assume n={2}>
            <M tex={String.raw`\eta = w^{\top} x`} size={11.5} />
          </Assume>
          <Assume n={3}>
            <M tex={String.raw`\text{predict } ${MU}`} size={11.5} />
          </Assume>
        </div>
        <div style={{ fontSize: 11.5, fontStyle: "italic", opacity: 0.62, marginTop: 10, lineHeight: 1.45 }}>
          identity, sigmoid and exp are not chosen: each inverts its family&rsquo;s natural
          parameter <M tex={String.raw`\eta(${MU})`} size={11} />.
        </div>
      </div>
    </div>
  );
}

function Row({ m, first }: { m: Model; first: boolean }) {
  return (
    <>
      <Cell first={first}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</span>
        <Sub>regression</Sub>
      </Cell>
      <div style={{ borderTop: first ? "none" : `1px solid ${NEUTRAL_SOFT}` }} />
      <Cell first={first}>
        <span style={{ opacity: 0.38 }}>
          <M tex="x" size={12} />
        </span>
      </Cell>
      <div style={{ borderTop: first ? "none" : `1px solid ${NEUTRAL_SOFT}` }} />
      <Cell first={first}>
        <span style={{ opacity: 0.38 }}>
          <M tex={String.raw`w^{\top} x`} size={12} />
        </span>
      </Cell>
      <div style={{ borderTop: first ? "none" : `1px solid ${NEUTRAL_SOFT}` }} />
      <Cell first={first}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: ACCENT }}>{m.response}</span>
        <M tex={m.mu} size={12} />
      </Cell>
      <div style={{ borderTop: first ? "none" : `1px solid ${NEUTRAL_SOFT}` }} />
      <Cell first={first}>
        <M tex={m.range} size={12} />
      </Cell>
      <div style={{ borderTop: first ? "none" : `1px solid ${NEUTRAL_SOFT}` }} />
      <Cell first={first}>
        <M tex={m.family} size={12.5} />
        <M tex={m.natural} size={11.5} />
      </Cell>
      <div style={{ borderTop: first ? "none" : `1px solid ${NEUTRAL_SOFT}` }} />
      <Cell first={first}>
        <M tex={m.support} size={11.5} />
      </Cell>
    </>
  );
}

function Swatch({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color, display: "inline-block" }} />
      <span style={{ fontSize: 11.5, opacity: 0.78 }}>{children}</span>
    </span>
  );
}

function Assume({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <Badge n={n} />
      {children}
    </span>
  );
}
