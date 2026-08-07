import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * GlmAssemblyLine — the GLM construction as a one-in / three-out assembly line
 * (FIGURE PLAN item 3). Three neutral assumption boxes (exponential-family
 * response, predict the conditional mean, linear natural parameter) fan into a
 * single central selector — "choose the response family" — and three straight
 * data-flow arrows exit to three stamped output badges, each a named model with
 * its mean function and canonical link.
 *
 * One idea: one recipe, three models. Fix the three assumptions once; the only
 * free choice is the response family, and each choice STAMPS OUT a named model
 * as a consequence — the link is derived, not chosen.
 *
 * Color roles (three hues + currentColor):
 *   amber  = the mean function h(x) — the subject the reader should track
 *   blue   = the canonical link tag (identity / logit / log)
 *   currentColor = the three assumption boxes and the neutral machinery
 * Inspiration: CS229 ch. 3 GLM construction — redrawn, not traced.
 */

// ── geometry (px) so the SVG fans line up with the flex columns ────────────
const ROW_H = 66;
const GAP = 20;
const H = 3 * ROW_H + 2 * GAP; // 238
const CY = [ROW_H / 2, ROW_H / 2 + (ROW_H + GAP), ROW_H / 2 + 2 * (ROW_H + GAP)]; // 33,119,205
const MID = CY[1]; // 119

const NEUTRAL = "rgba(128,128,128,0.55)";
const NEUTRAL_SOFT = "rgba(128,128,128,0.4)";
const ARROW = "rgba(128,128,128,0.6)";

const ca = (t: string) => String.raw`\textcolor{${ACCENT}}{${t}}`;

// ── numbered assumption box ────────────────────────────────────────────────
function Badge({ n }: { n: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        flexShrink: 0,
        borderRadius: "50%",
        border: `1.5px solid ${NEUTRAL}`,
        fontSize: 12,
        fontWeight: 600,
        opacity: 0.85,
      }}
    >
      {n}
    </span>
  );
}

function Assumption({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div
      style={{
        height: ROW_H,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 14px",
        border: `1.5px solid ${NEUTRAL}`,
        borderRadius: 8,
        whiteSpace: "nowrap",
      }}
    >
      <Badge n={n} />
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        {children}
      </span>
    </div>
  );
}

// ── stamped output badge ───────────────────────────────────────────────────
function Output({
  family,
  model,
  hx,
  link,
}: {
  family: string;
  model: string;
  hx: string;
  link: string;
}) {
  return (
    <div
      style={{
        height: ROW_H,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 5,
        padding: "0 16px",
        border: `1.5px solid ${NEUTRAL}`,
        borderRadius: 8,
        background: `color-mix(in srgb, ${ACCENT} 5%, transparent)`,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, fontSize: 13 }}>
        <span style={{ fontWeight: 600 }}>{family}</span>
        <span style={{ opacity: 0.5 }}>&rarr;</span>
        <span>{model}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <M tex={ca(hx)} size={13.5} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: SUPPORT,
            border: `1px solid ${SUPPORT}`,
            background: `color-mix(in srgb, ${SUPPORT} 10%, transparent)`,
            borderRadius: 20,
            padding: "1px 9px",
            whiteSpace: "nowrap",
          }}
        >
          {link}
        </span>
      </div>
    </div>
  );
}

// ── arrowhead helper ───────────────────────────────────────────────────────
function head(x: number, y: number) {
  return `M${x - 7} ${y - 4} L${x} ${y} L${x - 7} ${y + 4}`;
}

export default function GlmAssemblyLine() {
  const FAN_W = 74;
  const EXIT_W = 52;
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        color: "currentColor",
        maxWidth: 900,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* left: three assumption boxes */}
        <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
          <Assumption n={1}>
            <M tex={String.raw`y \mid x \;\sim\; \mathrm{ExpFam}(\eta)`} size={13.5} />
          </Assumption>
          <Assumption n={2}>
            <span style={{ opacity: 0.7 }}>predict</span>
            <M tex={String.raw`h(x)=\mathbb{E}[\,y \mid x\,]`} size={13.5} />
          </Assumption>
          <Assumption n={3}>
            <M tex={String.raw`\eta = \theta^{\top} x`} size={13.5} />
          </Assumption>
        </div>

        {/* fan-in: three relates-to lines converging into the selector */}
        <svg width={FAN_W} height={H} viewBox={`0 0 ${FAN_W} ${H}`} aria-hidden="true">
          {CY.map((y) => (
            <path
              key={y}
              d={`M0 ${y} C ${FAN_W * 0.55} ${y}, ${FAN_W * 0.5} ${MID}, ${FAN_W - 3} ${MID}`}
              fill="none"
              stroke={ARROW}
              strokeWidth="1.5"
            />
          ))}
          <path d={head(FAN_W - 2, MID)} fill="none" stroke={ARROW} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>

        {/* central selector */}
        <div
          style={{
            height: 210,
            width: 132,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "0 12px",
            textAlign: "center",
            border: `1.8px solid ${NEUTRAL}`,
            borderRadius: 10,
            background: "rgba(128,128,128,0.06)",
          }}
        >
          <span style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5 }}>
            selector
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>
            choose the response family
          </span>
          <span style={{ fontSize: 11.5, fontStyle: "italic", opacity: 0.6 }}>
            the link follows
          </span>
        </div>

        {/* exit: three straight data-flow arrows */}
        <svg width={EXIT_W} height={H} viewBox={`0 0 ${EXIT_W} ${H}`} aria-hidden="true">
          {CY.map((y) => (
            <g key={y}>
              <line x1="0" y1={y} x2={EXIT_W - 2} y2={y} stroke={ARROW} strokeWidth="1.5" />
              <path d={head(EXIT_W - 2, y)} fill="none" stroke={ARROW} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ))}
        </svg>

        {/* right: three stamped output badges */}
        <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
          <Output family="Gaussian" model="linear regression" hx={String.raw`h(x)=\theta^{\top} x`} link="identity link" />
          <Output family="Bernoulli" model="logistic regression" hx={String.raw`h(x)=\sigma(\theta^{\top} x)`} link="logit link" />
          <Output family="Poisson" model="Poisson regression" hx={String.raw`h(x)=e^{\theta^{\top} x}`} link="log link" />
        </div>
      </div>

      {/* legend: name every hue */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 28,
          marginTop: 18,
          paddingTop: 12,
          borderTop: `1px solid ${NEUTRAL_SOFT}`,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: ACCENT, display: "inline-block" }} />
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            mean function <M tex={String.raw`h(x)`} size={11.5} />
          </span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: SUPPORT, display: "inline-block" }} />
          <span style={{ fontSize: 12, opacity: 0.75 }}>canonical link</span>
        </span>
      </div>
    </div>
  );
}
