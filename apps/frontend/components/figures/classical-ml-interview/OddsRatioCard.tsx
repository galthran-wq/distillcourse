import { Fragment } from "react";
import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * OddsRatioCard — the three-predictor Default-model coefficients (ISLP
 * Table 4.3, values as used in the lesson) translated into odds ratios.
 *
 * One idea: e^{ŵⱼ} converts a log-odds effect into an odds multiplier.
 * Layout: a coefficient card — header formula, a four-column table
 * (feature | ŵⱼ | e^{ŵⱼ} | reading), and a footer warning that odds
 * effects are not probability effects (∂p/∂xⱼ = wⱼ p(1−p)).
 * Color: amber = the odds-ratio column, bound to e^{ŵⱼ} in the column
 * header and in the footer formula. Everything else currentColor.
 */

const or = (t: string) => String.raw`\textcolor{${ACCENT}}{${t}}`;

const ROWS: { feature: string; unit: string; w: string; ratio: string; reading: string }[] = [
  {
    feature: "balance",
    unit: "per $100",
    w: "+0.57",
    ratio: String.raw`\times\, 1.77`,
    reading: "each $100 of balance multiplies the odds of default by 1.77",
  },
  {
    feature: "income",
    unit: "per $1{,}000",
    w: "+0.003",
    ratio: String.raw`\times\, 1.00`,
    reading: "no practical effect on the odds",
  },
  {
    feature: "student",
    unit: "= yes",
    w: "-0.65",
    ratio: String.raw`\times\, 0.52`,
    reading: "halves the odds at fixed balance and income",
  },
];

const hairline = "1px solid rgba(128,128,128,0.35)";

const headCell: React.CSSProperties = {
  fontSize: 12.5,
  opacity: 0.6,
  paddingBottom: 8,
  borderBottom: hairline,
};

const cell: React.CSSProperties = {
  padding: "9px 0 2px",
};

export default function OddsRatioCard() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 640,
        border: hairline,
        borderRadius: 8,
        padding: "16px 20px 14px",
        boxSizing: "border-box",
      }}
    >
      {/* header: the fitted model */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>Default data</span>
        <M
          tex={String.raw`p(\text{default} \mid \text{balance},\ \text{income},\ \text{student}) = \sigma(\hat w^\top x)`}
          size={13.5}
        />
      </div>

      {/* table */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto 1fr",
          columnGap: 26,
          alignItems: "baseline",
        }}
      >
        <div style={headCell}>feature</div>
        <div style={{ ...headCell, textAlign: "right" }}>
          <M tex={String.raw`\hat w_j`} size={13} />
        </div>
        <div style={{ ...headCell, textAlign: "right" }}>
          <span style={{ marginRight: 4 }}>odds ratio</span>
          <M tex={or(String.raw`e^{\hat w_j}`)} size={13} />
        </div>
        <div style={headCell}>reading</div>

        {ROWS.map((r) => (
          <Fragment key={r.feature}>
            <div style={cell}>
              {r.feature}{" "}
              <span style={{ opacity: 0.55, fontSize: 12 }}>
                <M tex={String.raw`\text{${r.unit.replace("$", "\\$")}}`} size={12} />
              </span>
            </div>
            <div style={{ ...cell, textAlign: "right" }}>
              <M tex={r.w} size={13.5} />
            </div>
            <div style={{ ...cell, textAlign: "right" }}>
              <M tex={or(r.ratio)} size={13.5} />
            </div>
            <div style={{ ...cell, fontSize: 12.5, opacity: 0.6 }}>
              {r.reading}
            </div>
          </Fragment>
        ))}
      </div>

      {/* footer: odds effect, not probability effect */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: hairline,
          fontSize: 12.5,
          opacity: 0.75,
          lineHeight: 1.55,
        }}
      >
        <M tex={or(String.raw`e^{\hat w_j}`)} size={12.5} /> is an odds{" "}
        <b>multiplier</b>, not a probability effect: the change in{" "}
        <M tex="p" size={12.5} /> per unit of <M tex="x_j" size={12.5} /> is{" "}
        <M tex={String.raw`\partial p / \partial x_j = w_j\, p(1-p)`} size={12.5} />,
        largest at <M tex={String.raw`p = \tfrac12`} size={12.5} /> and vanishing in
        the tails.
      </div>
    </div>
  );
}
