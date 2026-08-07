import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * UniformGradientCard — the canonical-link payoff (FIGURE PLAN item 6, glm).
 *
 * One idea: one gradient, three models. The GLM gradient is always
 * ∇_θ ℓ = Σ_i (y_i − ŷ_i) x_i — error times input. Only the prediction ŷ_i
 * changes between linear, logistic, and Poisson regression. The underbrace
 * under the amber ŷ_i drops to a three-row table: a blue model badge, its
 * amber substitution for ŷ_i (θᵀx, σ(θᵀx), e^{θᵀx}), and the muted link name.
 *
 * Color roles: amber = the prediction ŷ (the one thing that varies); blue =
 * the model identity (badges); muted = the canonical link name.
 */

const A = ACCENT; // the prediction ŷ — the only term that changes
const B = SUPPORT; // model identity

type Model = { name: string; expr: string; link: string };

const MODELS: Model[] = [
  { name: "linear", expr: String.raw`\theta^{\top} x_i`, link: "identity" },
  { name: "logistic", expr: String.raw`\sigma(\theta^{\top} x_i)`, link: "logit" },
  { name: "Poisson", expr: String.raw`e^{\theta^{\top} x_i}`, link: "log" },
];

function Badge({ name }: { name: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 11px",
        border: `1.4px solid ${B}`,
        borderRadius: 999,
        color: B,
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

const YHAT = String.raw`\textcolor{${A}}{\hat y_i}`;

export default function UniformGradientCard() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 620,
        margin: "0 auto",
        color: "currentColor",
      }}
    >
      {/* the one gradient — error × input, with ŷ underbraced */}
      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <M
          display
          size={20}
          tex={String.raw`\nabla_{\theta}\,\ell \;=\; \sum_i \big(y_i - \underbrace{${YHAT}}_{}\big)\,x_i`}
        />
      </div>

      {/* the drop from the underbrace into the table */}
      <div
        style={{
          textAlign: "center",
          color: A,
          fontSize: 19,
          lineHeight: 1,
          margin: "0 0 12px",
        }}
        aria-hidden="true"
      >
        ↓
      </div>

      {/* three-row table: badge · amber substitution for ŷ · muted link */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          columnGap: 22,
          rowGap: 12,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* header */}
        <div />
        <div style={{ fontSize: 11.5, opacity: 0.5, textAlign: "center", letterSpacing: 0.3 }}>
          prediction <M tex={YHAT} size={12} />
        </div>
        <div style={{ fontSize: 11.5, opacity: 0.5, textAlign: "center", letterSpacing: 0.3 }}>
          link
        </div>

        {MODELS.map((m) => (
          <Row key={m.name} m={m} />
        ))}
      </div>

      {/* one-idea footer */}
      <div
        style={{
          textAlign: "center",
          marginTop: 18,
          fontSize: 12.5,
          opacity: 0.62,
          lineHeight: 1.4,
        }}
      >
        One formula, three models — only the prediction{" "}
        <M tex={YHAT} size={12.5} /> changes.
      </div>
    </div>
  );
}

function Row({ m }: { m: Model }) {
  return (
    <>
      <div style={{ textAlign: "right" }}>
        <Badge name={m.name} />
      </div>
      <div style={{ textAlign: "center" }}>
        <M size={15.5} tex={String.raw`\hat y_i = \textcolor{${ACCENT}}{${m.expr}}`} />
      </div>
      <div style={{ textAlign: "center", opacity: 0.5, fontSize: 12.5, whiteSpace: "nowrap" }}>
        {m.link}
      </div>
    </>
  );
}
