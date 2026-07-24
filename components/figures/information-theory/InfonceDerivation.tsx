import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * InfonceDerivation — the InfoNCE bound in four algebraic moves.
 *
 * FigureSequence, 4 frames. Shared layout: a "step N" badge top-left, one
 * centered KaTeX equation block, one muted gloss line beneath. Only the
 * equation and the gloss change per frame; the badge increments.
 *
 *   step 1  Bayes posterior over which candidate came from the joint
 *   step 2  divide by the marginal product — only density ratios survive
 *   step 3  the optimal critic is the ratio, f* ∝ p(y|x)/p(y)
 *   step 4  substitute to read off  I(X;Y) ≥ log2 N − L_N
 *
 * Color roles: amber = the density ratio and the final bound (the subject);
 * currentColor = everything else. After van den Oord, Li & Vinyals 2018
 * (CPC), Appendix A.1 eqs. 6–11 — recreated in house style, not copied.
 */

const A = ACCENT;

// amber wrap for the ratio r(x,y) = p(y|x)/p(y) and the final bound
const amber = (tex: string) => String.raw`\textcolor{${A}}{${tex}}`;

// a marginal product, struck through and muted (frame 2)
const struck = (prod: string) =>
  String.raw`\htmlStyle{opacity:0.4}{\cancel{${prod}}}`;

// --- per-frame equations --------------------------------------------------

// frame 1: the Bayes posterior, marginal products plain (currentColor)
const F1 = String.raw`p(\text{pos}=i \mid x, y_{1:N})
  = \frac{p(y_i\mid x)\,\prod_{j\ne i} p(y_j)}
         {\sum_k p(y_k\mid x)\,\prod_{j\ne k} p(y_j)}`;

// frame 2: same fraction, products struck, then the simplified ratio form
const F2 = String.raw`p(\text{pos}=i \mid \cdot)
  = \frac{p(y_i\mid x)\,${struck(String.raw`\prod_{j\ne i} p(y_j)`)}}
         {\sum_k p(y_k\mid x)\,${struck(String.raw`\prod_{j\ne k} p(y_j)`)}}
  = \frac{${amber(String.raw`r(x,y_i)`)}}
         {\sum_k ${amber(String.raw`r(x,y_k)`)}}`;

// frame 2 side note: the definition of the ratio, in amber
const F2_NOTE = String.raw`${amber(String.raw`r(x,y)`)} = \dfrac{p(y\mid x)}{p(y)}`;

// frame 3: the optimal critic is the ratio (boxed, amber)
const F3 = amber(String.raw`f^{*}(x,y) \;\propto\; \dfrac{p(y\mid x)}{p(y)}`);

// frame 4: the loss lower-bound, then rearranged into the MI bound (boxed)
const F4_TOP = String.raw`L_N \;\gtrsim\; \log_2 N - I(X;Y)`;
const F4_BOUND = amber(String.raw`I(X;Y) \;\ge\; \log_2 N - L_N`);

// --- shared chrome --------------------------------------------------------

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
        border: `1.8px solid ${A}`,
        borderRadius: 8,
        padding: "9px 18px",
      }}
    >
      {children}
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
  maxWidth: 520,
};

// --- per-frame body + gloss -----------------------------------------------

function Body({ frame }: { frame: number }) {
  if (frame === 1) {
    return <M tex={F1} display size={19} />;
  }
  if (frame === 2) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <M tex={F2} display size={17} />
        <M tex={F2_NOTE} size={15} />
      </div>
    );
  }
  if (frame === 3) {
    return (
      <AmberBox>
        <M tex={F3} display size={22} />
      </AmberBox>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <M tex={F4_TOP} display size={19} />
      <AmberBox>
        <M tex={F4_BOUND} display size={21} />
      </AmberBox>
    </div>
  );
}

const GLOSS: Record<number, string> = {
  1: "Bayes over which candidate came from the joint; marginal products in currentColor",
  2: "divide by ∏ⱼ p(yⱼ): only density ratios survive",
  3: "the optimal critic is the ratio — no density is ever modeled",
  4: "substitute f*, use E[r] = 1 over negatives and I = E[log₂ r] over positives",
};

export default function InfonceDerivation({ frame = 1 }: { frame?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 600,
        minHeight: 300,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        boxSizing: "border-box",
        padding: "4px 8px",
      }}
    >
      <div>
        <Badge n={frame} />
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
    </div>
  );
}
