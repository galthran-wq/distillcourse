import { M } from "../M";
import { ACCENT, SUPPORT, OK } from "../palette";

/**
 * LogSumApart — why maximum likelihood stalls on a mixture (gmm-em lesson).
 * Two near-identical panels of the same dissection: for one Gaussian the
 * logarithm reaches the exponential and the score is linear in mu; for a
 * mixture the inner sum blocks it, and the gradient's weights are the
 * responsibilities.
 *
 * Color roles: amber = the sum that blocks the logarithm (the subject),
 * blue = the parameter-dependent weight, green = the closed form that only
 * the single-Gaussian panel gets.
 */

const A = ACCENT;
const B = SUPPORT;
const G = OK;
const RULE = "rgba(130,130,130,0.35)";

const NOTE: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 12.5,
  lineHeight: 1.45,
  textAlign: "center",
};

/**
 * The shared skeleton of both panels: two formulas joined by a labeled arrow,
 * each dropping to its own note. One grid so the arrow sits on the formulas'
 * line and the notes hang under the terms they explain.
 */
function Panel({
  title,
  left,
  arrow,
  right,
  leftNote,
  rightNote,
  footer,
}: {
  title: string;
  left: React.ReactNode;
  arrow: React.ReactNode;
  right: React.ReactNode;
  leftNote?: React.ReactNode;
  rightNote?: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${RULE}`,
        borderRadius: 8,
        padding: "12px 18px 14px",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          columnGap: 18,
          alignItems: "center",
          justifyItems: "center",
          justifyContent: "center",
          marginTop: 6,
        }}
      >
        {/* row 1: the reason for the step, over the arrow only */}
        <div />
        <div style={{ ...NOTE, opacity: 0.62, maxWidth: 120 }}>{arrow}</div>
        <div />

        {/* row 2: the two formulas, joined */}
        <div style={{ whiteSpace: "nowrap" }}>{left}</div>
        <svg viewBox="0 0 52 14" style={{ width: 52, display: "block" }}>
          <line
            x1="2"
            y1="7"
            x2="42"
            y2="7"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M42 2.5 L50 7 L42 11.5 Z" fill="currentColor" />
        </svg>
        <div style={{ whiteSpace: "nowrap" }}>{right}</div>

        {/* row 3: each formula's note, under it */}
        <div style={{ maxWidth: 250, alignSelf: "start", marginTop: 4 }}>
          {leftNote}
        </div>
        <div />
        <div style={{ maxWidth: 250, alignSelf: "start", marginTop: 4 }}>
          {rightNote}
        </div>
      </div>
      <div style={{ ...NOTE, marginTop: 12 }}>{footer}</div>
    </div>
  );
}

export default function LogSumApart() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <Panel
        title="one Gaussian (module 2)"
        left={
          <M
            size={15}
            tex={String.raw`\ell = \sum_{n} \ln \mathcal{N}(x_n \mid \mu, \Sigma)`}
          />
        }
        arrow={
          <>
            <M tex={String.raw`\ln`} size={12.5} /> reaches the exponential
          </>
        }
        right={
          <M
            size={15}
            tex={String.raw`\ln \mathcal{N} = -\tfrac{1}{2} (x_n-\mu)^{\top} \Sigma^{-1} (x_n-\mu) + \text{const}`}
          />
        }
        rightNote={
          <div style={{ ...NOTE, opacity: 0.6 }}>
            a quadratic in <M tex={String.raw`\mu`} size={12.5} />
          </div>
        }
        footer={
          <span style={{ color: G }}>
            derivative linear in{" "}
            <M tex={String.raw`\mu`} size={12.5} color={G} />: closed form{" "}
            <M
              tex={String.raw`\textcolor{${G}}{\hat{\mu} = \tfrac{1}{N}\sum_n x_n}`}
              size={13}
            />
          </span>
        }
      />

      <Panel
        title="a mixture"
        left={
          <M
            size={15}
            tex={String.raw`\ell = \sum_{n} \ln \Bigl( \underbrace{\textcolor{${A}}{\textstyle\sum_{k} \pi_k \mathcal{N}(x_n \mid \mu_k, \Sigma_k)}}_{\textcolor{${A}}{\text{this sum}}} \,\Bigr)`}
          />
        }
        arrow="differentiate"
        right={
          <M
            size={15}
            tex={String.raw`\frac{\partial \ell}{\partial \mu_k} = \sum_{n} \underbrace{\textcolor{${B}}{\gamma_{nk}}}_{\textcolor{${B}}{\text{weight}}} \Sigma_k^{-1}(x_n - \mu_k)`}
          />
        }
        leftNote={
          <div style={{ ...NOTE, color: A }}>
            the sum blocks the logarithm — nothing cancels the exponentials
          </div>
        }
        rightNote={
          <div style={{ ...NOTE, color: B }}>
            the weight depends on every parameter — no closed form
          </div>
        }
        footer={
          <span style={{ opacity: 0.62 }}>
            setting it to zero gives a fixed point, not a formula
          </span>
        }
      />
    </div>
  );
}
