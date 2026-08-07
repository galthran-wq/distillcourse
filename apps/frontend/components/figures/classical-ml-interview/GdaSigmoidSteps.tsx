import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * GdaSigmoidSteps — the GDA/LDA "why the posterior is a sigmoid of an affine
 * score" derivation in three moves, staging exactly the <Theorem>/<Proof> that
 * shows p(y=1|x) = σ(wᵀx + b) with w = Σ⁻¹(μ₁−μ₀) and
 * b = −½(μ₁+μ₀)ᵀΣ⁻¹(μ₁−μ₀) + ln[φ/(1−φ)].
 *
 * FigureSequence, 3 frames. Shared layout: a "step N" badge + move title
 * top-left, one centered KaTeX development, a muted gloss line, and a
 * persistent two-color legend. Color roles are fixed across all frames so the
 * eye tracks each object to its landing coefficient:
 *   amber = terms linear in x            → the direction w = Σ⁻¹(μ₁−μ₀)
 *   blue  = constant terms + prior odds  → the bias b
 * The shared-Σ condition (the pivot that kills the quadratics) is flagged amber.
 *
 *   step 1  write the log-odds: prior odds + Gaussian density ratio, expanded
 *           into two quadratic forms (normalizers already cancelled — same Σ)
 *   step 2  expand each square into its three terms; the ±½ xᵀΣ⁻¹x pair is
 *           identical under the shared Σ and cancels — the whole reason it is
 *           linear
 *   step 3  collect the survivors into the boxed affine a(x) = wᵀx + b; name w
 *           (amber) and b (blue), then plug in the running numerical example
 */

const W = ACCENT; // amber — linear-in-x terms → the direction w
const B = SUPPORT; // blue — constant terms + prior → the bias b

const cw = (t: string) => String.raw`\textcolor{${W}}{${t}}`;
const cb = (t: string) => String.raw`\textcolor{${B}}{${t}}`;
const struck = (t: string) =>
  String.raw`\htmlStyle{opacity:0.34}{\cancel{${t}}}`;

// --- per-frame equations --------------------------------------------------

const F1_TOP = String.raw`a(x) \;=\;
  \overbrace{${cb(String.raw`\ln\dfrac{\varphi}{1-\varphi}`)}}^{\text{prior odds}}
  \;+\;
  \overbrace{\ln\dfrac{\mathcal{N}(x;\mu_1,\Sigma)}{\mathcal{N}(x;\mu_0,\Sigma)}}^{\text{density ratio}}`;

const F1_EXP = String.raw`a(x) \;=\;
  ${cb(String.raw`\ln\dfrac{\varphi}{1-\varphi}`)}
  \;-\;\tfrac12(x-\mu_1)^\top\Sigma^{-1}(x-\mu_1)
  \;+\;\tfrac12(x-\mu_0)^\top\Sigma^{-1}(x-\mu_0)`;

const F2 = String.raw`\begin{aligned}
-\tfrac12(x-\mu_1)^\top\Sigma^{-1}(x-\mu_1)
  &= -\tfrac12\,${struck(String.raw`x^\top\Sigma^{-1}x`)}
     \;+\; ${cw(String.raw`\mu_1^\top\Sigma^{-1}x`)}
     \;-\; ${cb(String.raw`\tfrac12\,\mu_1^\top\Sigma^{-1}\mu_1`)} \\[5pt]
+\tfrac12(x-\mu_0)^\top\Sigma^{-1}(x-\mu_0)
  &= +\tfrac12\,${struck(String.raw`x^\top\Sigma^{-1}x`)}
     \;-\; ${cw(String.raw`\mu_0^\top\Sigma^{-1}x`)}
     \;+\; ${cb(String.raw`\tfrac12\,\mu_0^\top\Sigma^{-1}\mu_0`)}
\end{aligned}`;

const F3_BOX = String.raw`a(x) \;=\;
  \underbrace{(\mu_1-\mu_0)^\top\Sigma^{-1}x}_{\textcolor{${W}}{\;w^\top x\;}}
  \;\;
  \underbrace{-\,\tfrac12(\mu_1+\mu_0)^\top\Sigma^{-1}(\mu_1-\mu_0)+\ln\dfrac{\varphi}{1-\varphi}}_{\textcolor{${B}}{\;b\;}}`;

const F3_DEF = String.raw`${cw(String.raw`w=\Sigma^{-1}(\mu_1-\mu_0)`)}
  \qquad
  ${cb(String.raw`b=-\tfrac12(\mu_1+\mu_0)^\top\Sigma^{-1}(\mu_1-\mu_0)+\ln\tfrac{\varphi}{1-\varphi}`)}`;

const F3_GIVEN = String.raw`\mu_0=(1,1),\ \ \mu_1=(3,2),\ \
  \Sigma^{-1}=\tfrac43\!\begin{pmatrix}1&-\tfrac12\\[-2pt]-\tfrac12&1\end{pmatrix},\ \ \varphi=\tfrac12`;

const F3_PLUG = String.raw`\;\Longrightarrow\;
  ${cw(String.raw`w=(2,\,0)^\top`)},\quad ${cb("b=-4")},\quad a(x)=2x_1-4`;

// --- shared chrome --------------------------------------------------------

const TITLES: Record<number, string> = {
  1: "Write the log-odds",
  2: "Cancel the quadratics — shared Σ",
  3: "Box the affine result",
};

const GLOSS: Record<number, string> = {
  1: "the log-odds splits into a prior-odds term and a Gaussian density ratio; that ratio is two quadratic forms once the shared-Σ normalizers drop out",
  2: "expand each square into three terms; the ±½ xᵀΣ⁻¹x pair is identical under the shared Σ and cancels — this is what makes the score linear",
  3: "survivors collect into an affine wᵀx + b; the running example gives w = (2, 0)ᵀ, b = −4",
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

function ResultBox({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        border: "1.8px solid currentColor",
        borderColor: "rgba(128,128,128,0.55)",
        borderRadius: 8,
        padding: "10px 18px",
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
  maxWidth: 580,
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
          gap: 18,
        }}
      >
        <M tex={F1_TOP} display size={17} />
        <span style={{ opacity: 0.4, fontSize: 16 }}>↓</span>
        <M tex={F1_EXP} display size={15.5} />
        <div
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 12.5,
            fontStyle: "italic",
            opacity: 0.55,
          }}
        >
          normalizers already cancelled: same Σ in numerator and denominator
        </div>
      </div>
    );
  }
  if (frame === 2) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <M tex={F2} display size={16} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "2px 10px",
              border: `1.4px solid ${W}`,
              color: W,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            shared Σ
          </span>
          <span style={{ fontSize: 12.5, fontStyle: "italic", opacity: 0.65 }}>
            the two ±½ xᵀΣ⁻¹x terms are identical ⇒ they cancel
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
        gap: 16,
      }}
    >
      <ResultBox>
        <M tex={F3_BOX} display size={16} />
      </ResultBox>
      <M tex={F3_DEF} size={13.5} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          marginTop: 2,
          paddingTop: 10,
          borderTop: "1px dashed rgba(128,128,128,0.35)",
        }}
      >
        <M tex={F3_GIVEN} size={12.5} />
        <M tex={F3_PLUG} size={13.5} />
      </div>
    </div>
  );
}

export default function GdaSigmoidSteps({ frame = 1 }: { frame?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 660,
        minHeight: 372,
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
          padding: "16px 0",
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
          gap: 24,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid currentColor",
          borderTopColor: "rgba(128,128,128,0.25)",
        }}
      >
        <Chip color={W} label={<>w = Σ⁻¹(μ₁−μ₀), linear in x</>} />
        <Chip color={B} label={<>b, constants + prior odds</>} />
      </div>
    </div>
  );
}
