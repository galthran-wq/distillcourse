import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * Formula dissection for Bayesian linear regression's conjugacy proof: the
 * log-posterior collected by powers of w, the completed-square template it is
 * matched against, and the identification of the posterior covariance and
 * mean. Amber = the precision/covariance role (A), blue = the linear "pull"
 * role (b).
 */

const A = String.raw`\textcolor{${ACCENT}}{A}`;
const B = String.raw`\textcolor{${SUPPORT}}{b}`;

export default function BlrSquareCompletion() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 680,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontWeight: 600 }}>1. collect the exponent by powers of w</div>
      <M
        display
        tex={String.raw`\ln p(w \mid y) \;=\; -\tfrac12\, w^\top \underbrace{\textcolor{${ACCENT}}{\Big(\tfrac{1}{\tau^2} I + \tfrac{1}{\sigma^2} X^\top X\Big)}}_{\textcolor{${ACCENT}}{A}\;=\;\text{prior + data precision}}\, w \;+\; w^\top \underbrace{\textcolor{${SUPPORT}}{\tfrac{1}{\sigma^2} X^\top y}}_{\textcolor{${SUPPORT}}{b}\;=\;\text{the data's pull}} \;+\; \text{const}`}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
        <span style={{ color: ACCENT, fontSize: 18 }}>&darr;</span>
        <span style={labelMuted}>complete the square: the same quadratic, recentred</span>
      </div>

      <div style={{ fontWeight: 600, marginTop: 2 }}>2. match it to a Gaussian&rsquo;s exponent</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <M
          display
          tex={String.raw`-\tfrac12\, \big(w - ${A}^{-1}${B}\big)^{\!\top} ${A}\, \big(w - ${A}^{-1}${B}\big) \;+\; \text{const}`}
        />
        <span style={{ ...labelMuted, maxWidth: 220 }}>
          the exponent of <M tex={String.raw`\mathcal{N}\!\big(${A}^{-1}${B},\; ${A}^{-1}\big)`} size={13} />
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
        <span style={{ color: ACCENT, fontSize: 18 }}>&darr;</span>
        <span style={labelMuted}>read off mean and covariance</span>
      </div>

      <div style={{ fontWeight: 600, marginTop: 2 }}>3. the posterior, identified</div>
      <div style={{ display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
        <span
          style={{
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 6,
            padding: "8px 14px",
            display: "inline-block",
          }}
        >
          <M tex={String.raw`S_n \;=\; ${A}^{-1}`} />
        </span>
        <span
          style={{
            border: `1.5px solid ${SUPPORT}`,
            borderRadius: 6,
            padding: "8px 14px",
            display: "inline-block",
          }}
        >
          <M tex={String.raw`m_n \;=\; ${A}^{-1}${B} \;=\; \tfrac{1}{\sigma^2}\, S_n X^\top y`} />
        </span>
        <span style={{ ...labelMuted, maxWidth: 220 }}>
          precision decides the spread; the pull, filtered through it, decides the centre
        </span>
      </div>
    </div>
  );
}
