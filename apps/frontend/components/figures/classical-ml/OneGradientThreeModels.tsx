import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * OneGradientThreeModels — the module's keeper figure (FIGURE PLAN item 4, glm).
 *
 * One idea: every canonical GLM has the SAME gradient, ∇ℓ = Σ (y_i − μ_i) x_i —
 * prediction error times features. The formula is dissected in place with two
 * underbraces (playbook rule 7), then the identical shape recurs literally in
 * three rows: least squares' (y − ŷ)x, logistic's (y − p)x, Poisson's
 * (y − e^{wᵀx})x. Only what μ_i is changes; the gradient does not.
 *
 * Color roles (two hues + currentColor): amber = the prediction error term,
 * blue = the features. Model names are neutral chips so no third role competes.
 */

const A = ACCENT; // prediction error (y − μ)
const B = SUPPORT; // features x

/** \big( rather than \left( so all three rows carry identically sized parens. */
const ERR = (inner: string) => String.raw`\textcolor{${A}}{\big(y_i - ${inner}\big)}`;
const X = String.raw`\textcolor{${B}}{x_i}`;
const RULE = "1px solid color-mix(in srgb, currentColor 22%, transparent)";

type Row = { name: string; mean: string; error: string; reads: string };

const ROWS: Row[] = [
  {
    name: "least squares",
    mean: String.raw`w^{\top} x_i`,
    error: String.raw`\hat y_i`,
    reads: "residual",
  },
  {
    name: "logistic",
    mean: String.raw`\sigma(w^{\top} x_i)`,
    error: String.raw`p_i`,
    reads: "label − probability",
  },
  {
    name: "Poisson",
    mean: String.raw`e^{\,w^{\top} x_i}`,
    error: String.raw`e^{\,w^{\top} x_i}`,
    reads: "count − rate",
  },
];

const COLS = "138px 132px 168px auto";

function Chip({ name }: { name: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 11px",
        border: "1.3px solid currentColor",
        borderRadius: 999,
        opacity: 0.7,
        fontSize: 12.5,
        fontWeight: 600,
        whiteSpace: "nowrap",
        lineHeight: 1.5,
      }}
    >
      {name}
    </span>
  );
}

// No textTransform: uppercasing turns the header's μ into a Latin-looking M.
const HEAD: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: 0.4,
  opacity: 0.45,
  fontWeight: 600,
};

export default function OneGradientThreeModels() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 656,
        margin: "0 auto",
      }}
    >
      {/* the one gradient, dissected in place */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <M
          display
          size={21}
          tex={String.raw`\nabla_{w}\,\ell(w) \;=\; \sum_i \underbrace{\textcolor{${A}}{\big(y_i - \mu_i\big)}}_{\textcolor{${A}}{\text{prediction error}}}\,\underbrace{\textcolor{${B}}{x_i}}_{\textcolor{${B}}{\text{features}}}`}
        />
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: 12.5,
          opacity: 0.6,
          marginBottom: 16,
        }}
      >
        derived once, for every canonical GLM — only{" "}
        <M tex={String.raw`\mu_i = \mathbb{E}[y_i \mid x_i]`} size={12.5} /> changes
      </div>

      {/* the three instantiations: same shape, three times */}
      <div style={{ borderTop: RULE, borderBottom: RULE }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            alignItems: "center",
            columnGap: 14,
            padding: "7px 0 6px",
          }}
        >
          <div style={HEAD}>model</div>
          <div style={HEAD}>mean μ</div>
          <div style={HEAD}>gradient</div>
          <div style={HEAD}>the error reads as</div>
        </div>

        {ROWS.map((r) => (
          <div
            key={r.name}
            style={{
              display: "grid",
              gridTemplateColumns: COLS,
              alignItems: "center",
              columnGap: 14,
              padding: "10px 0",
              borderTop: RULE,
            }}
          >
            <div>
              <Chip name={r.name} />
            </div>
            <div>
              <M size={14.5} tex={String.raw`\mu_i = ${r.mean}`} />
            </div>
            <div>
              <M size={15} tex={String.raw`\sum_i ${ERR(r.error)}\,${X}`} />
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.62 }}>{r.reads}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 16,
          fontSize: 12.5,
          opacity: 0.62,
          lineHeight: 1.45,
        }}
      >
        Three likelihoods, one update rule: the fitting code is the same code.
      </div>
    </div>
  );
}
