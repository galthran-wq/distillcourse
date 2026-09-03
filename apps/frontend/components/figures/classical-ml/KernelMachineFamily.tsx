import { M } from "../M";
import { ACCENT, labelMuted } from "../palette";

/**
 * The kernel-machine family resolved: kernel ridge, SVR, and GP regression
 * share one prediction form and differ in objective, sparsity, and what they
 * report. Amber marks the GP's distinguishing column: the full posterior.
 */

const cell: React.CSSProperties = {
  padding: "7px 12px",
  borderTop: "1px solid rgba(128,128,128,0.35)",
};
const head: React.CSSProperties = {
  padding: "4px 12px",
  fontSize: 12,
  opacity: 0.55,
};

export default function KernelMachineFamily() {
  const rows: [string, React.ReactNode, string, string, React.ReactNode][] = [
    [
      "kernel ridge",
      <M key="krr" tex={String.raw`\textstyle\sum_i (y_i - f(x_i))^2 + \lambda \lVert f \rVert^2`} size={13} />,
      "all n points",
      "O(n³) solve",
      <span key="u">none — a point prediction</span>,
    ],
    [
      "SVR",
      <M key="svr" tex={String.raw`\textstyle\sum_i \max(0, |y_i - f(x_i)| - \varepsilon) + \lambda \lVert f \rVert^2`} size={13} />,
      "support vectors only",
      "QP; sparse predictor",
      <span key="u">none — a point prediction</span>,
    ],
    [
      "GP regression",
      <M key="gp" tex={String.raw`\text{Gaussian likelihood} \times \text{GP prior}`} size={13} />,
      "all n points",
      "O(n³) Cholesky",
      <span key="u" style={{ color: ACCENT }}>
        full posterior: mean, variance, and the evidence
      </span>,
    ],
  ];
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13.5, maxWidth: 700 }}>
      <div style={{ marginBottom: 6 }}>
        one prediction form:{" "}
        <M tex={String.raw`f(x) = \textstyle\sum_{i=1}^n \alpha_i\, k(x_i, x)`} size={14} />
        <span style={{ ...labelMuted, fontSize: 12.5 }}> &nbsp;— the objective decides &alpha;</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.6fr 1fr 1fr 1.4fr" }}>
        {["method", "objective", "solution uses", "cost / shape", "uncertainty"].map((h) => (
          <div key={h} style={head}>
            {h}
          </div>
        ))}
        {rows.flatMap(([name, obj, uses, cost, unc]) => [
          <div key={name} style={{ ...cell, fontWeight: 600 }}>{name}</div>,
          <div key={name + "o"} style={cell}>{obj}</div>,
          <div key={name + "u"} style={cell}>{uses}</div>,
          <div key={name + "c"} style={cell}>{cost}</div>,
          <div key={name + "n"} style={cell}>{unc}</div>,
        ])}
      </div>
      <div style={{ ...labelMuted, marginTop: 6, fontSize: 12.5 }}>
        same kernel, same O(n&sup3;) order for the dense two — what the GP buys for the
        price is the distribution
      </div>
    </div>
  );
}
