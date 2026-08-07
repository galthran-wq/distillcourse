import { M } from "../M";
import { ACCENT, SUPPORT, OK } from "../palette";

/**
 * BiasVarianceProofSteps — the bias–variance decomposition in four algebraic
 * moves, dramatizing the exact insert-and-cancel argument of the lesson's
 * <Proof> block (mirrors CS4780 Lecture 12).
 *
 * FigureSequence, 4 frames. Shared layout: a "step N" badge + move title
 * top-left, one centered KaTeX block, a muted gloss line, and a persistent
 * three-color legend. Color roles are fixed across all frames so the eye
 * tracks each object to its landing term:
 *   amber  = bias gap  (f − f̄)              → bias²
 *   blue   = retraining gap (f̄ − f̂), i.e. f̂ → variance
 *   green  = noise ε                          → σ²
 *
 *   step 1  substitute y = f + ε; establish the three raw objects
 *   step 2  add and subtract f̄; regroup into bias gap + retraining gap + noise
 *   step 3  expand the square; strike both cross terms with their one-line reason
 *   step 4  E[ε²] = σ²; name the survivors and box the identity
 *
 * Recreated in house style after K. Weinberger, CS4780 Lecture 12 — not copied.
 */

const BIAS = ACCENT; // amber
const VARI = SUPPORT; // blue
const NOISE = OK; // green

const cb = (t: string) => String.raw`\textcolor{${BIAS}}{${t}}`;
const cv = (t: string) => String.raw`\textcolor{${VARI}}{${t}}`;
const cn = (t: string) => String.raw`\textcolor{${NOISE}}{${t}}`;
const struck = (t: string) =>
  String.raw`\htmlStyle{opacity:0.38}{\cancel{${t}}}`;

// --- per-frame equations --------------------------------------------------

const F1 = String.raw`\begin{aligned}
\operatorname{Err}(x_0)
  &= \mathbb{E}_{D,\varepsilon}\!\left[\big(y - ${cv(String.raw`\hat f`)}\big)^2\right] \\[2pt]
  &= \mathbb{E}\!\left[\Big(
        \underbrace{${cb("f")}}_{\text{target}}
        \;+\; \underbrace{${cn(String.raw`\varepsilon`)}}_{\text{noise}}
        \;-\; \underbrace{${cv(String.raw`\hat f`)}}_{\text{one fit}}
     \Big)^2\right]
\end{aligned}`;

const F2 = String.raw`\begin{aligned}
y - ${cv(String.raw`\hat f`)}
  &= ${cb("f")} + ${cn(String.raw`\varepsilon`)} - ${cv(String.raw`\hat f`)} \\[2pt]
  &= ${cb("f")}\;\underbrace{-\,\bar f + \bar f}_{\text{insert }0}\;
      + ${cn(String.raw`\varepsilon`)} - ${cv(String.raw`\hat f`)} \\[2pt]
  &= \underbrace{${cb(String.raw`(f - \bar f)`)}}_{\text{bias gap}}
   + \underbrace{${cv(String.raw`(\bar f - \hat f)`)}}_{\text{retraining gap}}
   + \underbrace{${cn(String.raw`\varepsilon`)}}_{\text{noise}}
\end{aligned}`;

const F2_NOTE = String.raw`f = f(x_0),\quad \hat f = \hat f_D(x_0),\quad
  \bar f = \bar f(x_0) = \mathbb{E}_D\!\left[\hat f_D(x_0)\right]`;

const F3 = String.raw`\begin{aligned}
\mathbb{E}\!\left[(y-${cv(String.raw`\hat f`)})^2\right]
  ={}& ${cb(String.raw`(f-\bar f)^2`)}
     + ${cv(String.raw`\mathbb{E}_D\!\left[(\bar f - \hat f)^2\right]`)}
     + ${cn(String.raw`\mathbb{E}[\varepsilon^2]`)} \\[3pt]
  &+ ${struck(String.raw`2(f-\bar f)\,\mathbb{E}_D[\bar f - \hat f]`)}
   + ${struck(String.raw`2\,\mathbb{E}[(f-\hat f)\varepsilon]`)}
\end{aligned}`;

const F3_R1 = String.raw`\mathbb{E}_D[\bar f - \hat f] = 0`;
const F3_R2 = String.raw`\mathbb{E}[(f-\hat f)\,\varepsilon] = 0`;

const F4 = String.raw`\begin{aligned}
\operatorname{Err}(x_0) = {}&
   \underbrace{${cn(String.raw`\sigma^2`)}}_{\text{noise}} \\[2pt]
 &+ \underbrace{${cb(String.raw`\big(f(x_0)-\bar f(x_0)\big)^2`)}}_{\text{bias}^2} \\[2pt]
 &+ \underbrace{${cv(String.raw`\mathbb{E}_D\!\left[(\hat f_D(x_0)-\bar f(x_0))^2\right]`)}}_{\text{variance}}
\end{aligned}`;

const F4_BOX = String.raw`\operatorname{Err}(x_0) =
   ${cn(String.raw`\sigma^2`)} + ${cb(String.raw`\text{bias}^2`)}
   + ${cv(String.raw`\text{variance}`)}`;

// --- shared chrome --------------------------------------------------------

const TITLES: Record<number, string> = {
  1: "Substitute the noisy label",
  2: "Insert the mean prediction",
  3: "Expand — both cross terms vanish",
  4: "Name the survivors",
};

const GLOSS: Record<number, string> = {
  1: "one noisy label y = f(x₀) + ε; each color marks where its object lands — f → bias², f̂ → variance, ε → noise",
  2: "add and subtract the mean prediction f̄ = E_D[f̂], then regroup into three pieces",
  3: "expand (a + b + c)²; both cross terms are zero — the whole argument",
  4: "E[ε²] = σ²; the three survivors, named — the identity interviewers ask for",
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
        border: `1.8px solid ${BIAS}`,
        borderRadius: 8,
        padding: "9px 18px",
      }}
    >
      {children}
    </span>
  );
}

function ReasonRow({ eq, reason }: { eq: string; reason: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <span style={{ opacity: 0.5, fontSize: 15 }}>↳</span>
      <M tex={eq} size={15} />
      <span
        style={{ fontStyle: "italic", opacity: 0.6, fontSize: 12.5 }}
      >
        {reason}
      </span>
    </div>
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
  maxWidth: 540,
};

// --- per-frame body -------------------------------------------------------

function Body({ frame }: { frame: number }) {
  if (frame === 1) {
    return <M tex={F1} display size={18} />;
  }
  if (frame === 2) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <M tex={F2} display size={18} />
        <M tex={F2_NOTE} size={13.5} />
      </div>
    );
  }
  if (frame === 3) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <M tex={F3} display size={16.5} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingLeft: 4,
          }}
        >
          <ReasonRow eq={F3_R1} reason="f̄ is defined as the mean of f̂ over D" />
          <ReasonRow
            eq={F3_R2}
            reason="ε is independent of D and E[ε] = 0"
          />
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
        <M tex={F4_BOX} display size={20} />
      </AmberBox>
    </div>
  );
}

export default function BiasVarianceProofSteps({
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
          gap: 20,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid currentColor",
          borderTopColor: "rgba(128,128,128,0.25)",
        }}
      >
        <Chip color={BIAS} label={<>bias²</>} />
        <Chip color={VARI} label={<>variance</>} />
        <Chip color={NOISE} label={<>noise</>} />
      </div>
    </div>
  );
}
