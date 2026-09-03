import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * The weight-space -> function-space crosswalk: Bayesian linear regression's
 * predictive formulas rearranged until the feature map appears only inside
 * inner products, then the kernel substitution. Amber = the inner products /
 * kernel objects; blue = the size of the matrix each form inverts.
 */

const box: React.CSSProperties = {
  border: "1px solid currentColor",
  borderRadius: 6,
  padding: "10px 14px",
  opacity: 1,
};

export default function GpInheritance() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 700,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={box}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          weight space — Bayesian linear regression on features{" "}
          <M tex={String.raw`\varphi(x)`} size={13} />
        </div>
        <M
          display
          tex={String.raw`f_* \mid y \sim \mathcal{N}\!\Big( \tfrac{1}{\sigma^2}\,\varphi_*^\top A^{-1} \Phi^\top y,\;\; \varphi_*^\top A^{-1} \varphi_* \Big), \qquad A = \tfrac{1}{\tau^2} I + \tfrac{1}{\sigma^2}\,\Phi^\top \Phi`}
        />
        <div style={{ ...labelMuted, marginTop: 2 }}>
          inverts <M tex={String.raw`\textcolor{${SUPPORT}}{A: N \times N}`} size={13} /> — the
          feature space&rsquo;s size
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: ACCENT, fontSize: 18 }}>&darr;</span>
        <span style={labelMuted}>
          push <M tex={String.raw`A^{-1}`} size={13} /> through <M tex={String.raw`\Phi`} size={13} /> (Woodbury) — pure algebra, same distribution
        </span>
      </div>

      <div style={{ ...box, borderColor: ACCENT }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          <M tex={String.raw`\varphi`} size={13} /> now appears only inside inner products
        </div>
        <M
          display
          tex={String.raw`\textcolor{${ACCENT}}{\tau^2 \varphi(x)^\top \varphi(x')} \;=\; \textcolor{${ACCENT}}{k(x, x')} \qquad\Rightarrow\qquad K_{ij} = k(x_i, x_j), \quad (\mathbf{k}_*)_i = k(x_i, x_*), \quad k_{**} = k(x_*, x_*)`}
        />
        <div style={{ ...labelMuted, marginTop: 2 }}>
          the kernel substitution — module 4&rsquo;s trick, applied verbatim
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: ACCENT, fontSize: 18 }}>&darr;</span>
        <span style={labelMuted}>replace every inner product; <M tex={String.raw`\varphi`} size={13} /> disappears from the formulas</span>
      </div>

      <div style={box}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>function space — Gaussian process regression</div>
        <M
          display
          tex={String.raw`f_* \mid y \sim \mathcal{N}\!\Big( \textcolor{${ACCENT}}{\mathbf{k}_*^\top} (\textcolor{${ACCENT}}{K} + \sigma^2 I)^{-1} y,\;\; \textcolor{${ACCENT}}{k_{**}} - \textcolor{${ACCENT}}{\mathbf{k}_*^\top} (\textcolor{${ACCENT}}{K} + \sigma^2 I)^{-1} \textcolor{${ACCENT}}{\mathbf{k}_*} \Big)`}
        />
        <div style={{ ...labelMuted, marginTop: 2 }}>
          inverts <M tex={String.raw`\textcolor{${SUPPORT}}{K + \sigma^2 I: n \times n}`} size={13} /> — the
          dataset&rsquo;s size; <M tex={String.raw`N`} size={13} /> may be infinite
        </div>
      </div>
    </div>
  );
}
