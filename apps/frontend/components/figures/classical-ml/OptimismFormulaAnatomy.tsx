import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * OptimismFormulaAnatomy — the optimism identity read term by term
 * (cross-validation-bootstrap lesson): expected in-sample error equals
 * expected training error plus twice the average covariance of each fitted
 * value with its own response.
 *
 * Color roles: blue = the measured quantity (training error), amber = the
 * concealed covariance term, the figure's subject.
 */

const A = ACCENT;
const B = SUPPORT;

const NOTE: React.CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.45,
  maxWidth: 190,
};

export default function OptimismFormulaAnatomy() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 620,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <M
          display
          size={18}
          tex={String.raw`\mathbb{E}_y\!\left[\operatorname{Err}_{\text{in}}\right] \;=\; \textcolor{${B}}{\mathbb{E}_y\!\left[\overline{\operatorname{err}}\right]} \;+\; \textcolor{${A}}{\frac{2}{n}\sum_{i=1}^{n} \operatorname{Cov}(\hat{y}_i,\, y_i)}`}
        />
      </div>

      {/* one annotation per term, in reading order */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          marginTop: 10,
        }}
      >
        <div style={{ ...NOTE, opacity: 0.62 }}>
          what honesty requires: fresh responses at the same inputs
        </div>
        <div style={{ ...NOTE, color: B, textAlign: "center" }}>
          what you measured
        </div>
        <div style={{ ...NOTE, color: A, textAlign: "right" }}>
          how much each <M tex={String.raw`\textcolor{${A}}{y_i}`} size={12.5} /> steered its own
          prediction
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 16,
          fontSize: 12.5,
          opacity: 0.62,
          lineHeight: 1.5,
        }}
      >
        <div>
          unbiased linear smoother with <M tex={String.raw`d = \operatorname{tr}(S)`} size={12.5} />{" "}
          effective df:
        </div>
        <div style={{ marginTop: 2 }}>
          <M
            tex={String.raw`\textcolor{${B}}{\mathbb{E}[\overline{\operatorname{err}}] = (1 - d/n)\,\sigma_\varepsilon^2}, \qquad \mathbb{E}[\operatorname{Err}_{\text{in}}] = (1 + d/n)\,\sigma_\varepsilon^2`}
            size={12.5}
          />
        </div>
      </div>
    </div>
  );
}
