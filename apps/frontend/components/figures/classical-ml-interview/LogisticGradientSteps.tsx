import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * LogisticGradientSteps — the logistic-regression gradient derivation in four
 * moves,
 * staging exactly the <Theorem title="gradient of the log-likelihood">/<Proof>
 * block of the logistic-regression lesson (after CS229 §2.1's staged
 * derivation — recreated in house style, not copied).
 *
 * FigureSequence, 4 frames. Shared layout: a "step N" badge + move title
 * top-left, one centered KaTeX block, a muted gloss line, and a persistent
 * two-color legend. Color roles are fixed across all frames:
 *   blue  = p = σ(wᵀx), the Bernoulli probability
 *   amber = the sigmoid identity σ′(z) = p(1−p) — the pivotal substitution —
 *           and the boxed result it makes possible
 *
 *   step 1  the Bernoulli likelihood of one example
 *   step 2  its logarithm — the quantity about to be differentiated
 *   step 3  the three chain-rule factors; the middle one IS the sigmoid identity
 *   step 4  the cancellation collapses to the boxed (y − p)x; LMS parallel noted
 */

const P = SUPPORT; // blue — the probability p
const KEY = ACCENT; // amber — the sigmoid identity and the result

const cp = (t: string) => String.raw`\textcolor{${P}}{${t}}`;
const ck = (t: string) => String.raw`\textcolor{${KEY}}{${t}}`;

// --- per-frame equations --------------------------------------------------

const F1 = String.raw`\mathcal{L}_i(w) \;=\;
  \underbrace{${cp("p")}^{\,y}\,\bigl(1-${cp("p")}\bigr)^{1-y}}_{\text{likelihood of one label}}`;

const F1_NOTE = String.raw`${cp("p")} = \sigma(w^\top x)\in(0,1), \qquad y\in\{0,1\}`;

const F2 = String.raw`\log \mathcal{L}_i \;=\;
  \underbrace{\,y\log ${cp("p")} \;+\; (1-y)\log\bigl(1-${cp("p")}\bigr)\,}_{\text{differentiate w.r.t. } w}`;

const F3 = String.raw`\frac{\partial \log\mathcal{L}_i}{\partial w} \;=\;
  \underbrace{\left(\dfrac{y}{${cp("p")}}-\dfrac{1-y}{1-${cp("p")}}\right)}_{\partial/\partial p}
  \;\cdot\; \underbrace{${ck(String.raw`\sigma'(z)`)}}_{\partial p/\partial z}
  \;\cdot\; \underbrace{x}_{\partial z/\partial w}`;

const F3_KEY = String.raw`${ck(String.raw`\sigma'(z) = p\,(1-p)`)}`;

const F4 = String.raw`\left(\dfrac{y}{${cp("p")}}-\dfrac{1-y}{1-${cp("p")}}\right)${ck("p(1-p)")}
  \;=\; \underbrace{y(1-${cp("p")}) - (1-y)${cp("p")}}_{=\; y - p}
  \;=\; y - ${cp("p")}`;

const F4_BOX = String.raw`\nabla \ell(w) \;=\; ${ck(String.raw`(y - p)\,x`)}`;

const F4_LMS = String.raw`w \leftarrow w + \eta\,\bigl(y_i - ${cp("p_i")}\bigr)\,x_i`;

// --- shared chrome --------------------------------------------------------

const TITLES: Record<number, string> = {
  1: "Bernoulli likelihood of one example",
  2: "Take the logarithm",
  3: "Chain rule — three factors",
  4: "Cancel and box the result",
};

const GLOSS: Record<number, string> = {
  1: "one label is a Bernoulli draw with success probability p = σ(wᵀx)",
  2: "the log turns the product into a sum — the negative cross-entropy of one example",
  3: "chain rule through p then z; the middle factor is exactly the sigmoid identity",
  4: "p(1−p) cancels both denominators — prediction error times input",
};

function Badge({ n }: { n: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 11px",
        border: "1.3px solid currentColor",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.02em",
        opacity: 0.55,
        whiteSpace: "nowrap",
      }}
    >
      step {n}
    </span>
  );
}

function AmberBox({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        border: `1.8px solid ${KEY}`,
        borderRadius: 8,
        padding: "9px 18px",
      }}
    >
      {children}
    </span>
  );
}

function Chip({ color, label }: { color: string; label: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 11,
          height: 11,
          borderRadius: 3,
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
    </span>
  );
}

const glossStyle: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 12.5,
  fontStyle: "italic",
  opacity: 0.6,
  lineHeight: 1.4,
  textAlign: "center",
  maxWidth: 560,
};

// --- per-frame body -------------------------------------------------------

function Body({ frame }: { frame: number }) {
  if (frame === 1) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <M tex={F1} display size={19} />
        <M tex={F1_NOTE} size={14} />
      </div>
    );
  }
  if (frame === 2) {
    return <M tex={F2} display size={18} />;
  }
  if (frame === 3) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <M tex={F3} display size={17} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 600, color: KEY }}>
            the key move
          </span>
          <AmberBox>
            <M tex={F3_KEY} size={18} />
          </AmberBox>
          <span style={{ fontSize: 12.5, fontStyle: "italic", opacity: 0.6 }}>
            sigmoid identity, z = wᵀx
          </span>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
      }}
    >
      <M tex={F4} display size={17} />
      <AmberBox>
        <M tex={F4_BOX} display size={21} />
      </AmberBox>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span style={{ opacity: 0.5, fontSize: 15 }}>↳</span>
        <M tex={F4_LMS} size={15} />
        <span style={{ fontStyle: "italic", opacity: 0.6, fontSize: 12.5 }}>
          the LMS update, same form — only the hypothesis changed
        </span>
      </div>
    </div>
  );
}

export default function LogisticGradientSteps({
  frame = 1,
}: {
  frame?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 640,
        minHeight: 360,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        boxSizing: "border-box",
        padding: "4px 8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Badge n={frame} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{TITLES[frame]}</span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px 0",
        }}
      >
        <Body frame={frame} />
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={glossStyle}>{GLOSS[frame]}</div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 22,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid currentColor",
          borderTopColor: "rgba(128,128,128,0.25)",
        }}
      >
        <Chip color={P} label={<>p = σ(wᵀx)</>} />
        <Chip color={KEY} label={<>sigmoid identity σ′ = p(1−p)</>} />
      </div>
    </div>
  );
}
