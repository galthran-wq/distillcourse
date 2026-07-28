import { Fragment } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * NbLinearScore — the smoothed spam Naive-Bayes model rendered as a literal
 * dot product (FIGURE PLAN item 6: NB as a linear classifier).
 *
 * One idea: the log-odds is Σ_j (count_j × weight_j) + b, with each weight the
 * log-ratio of the word's class probabilities. The count vector of the test
 * message "win money voucher now" sits directly above the per-word weights;
 * multiplying column-wise (the product row) and summing gives score 0.56, and
 * σ(0.56) = 0.64 reproduces the smoothed posterior exactly.
 *
 * Color roles: amber = positive weight (spam evidence), blue = negative weight
 * (ham evidence). Active columns (count = 1) are tinted so count × weight reads
 * vertically. Inspiration: CS4780 lecture 5 linearity of NB — redrawn.
 */

const A = ACCENT; // spam evidence (positive weight)
const B = SUPPORT; // ham evidence (negative weight)

type Col = { word: string; count: number; w: number };

const VOCAB: Col[] = [
  { word: "win", count: 1, w: 0.56 },
  { word: "money", count: 1, w: 0.27 },
  { word: "prize", count: 0, w: 0.97 },
  { word: "now", count: 1, w: -0.13 },
  { word: "meeting", count: 0, w: -1.23 },
  { word: "report", count: 0, w: -0.83 },
  { word: "voucher", count: 1, w: -0.13 },
];

const signed = (x: number) => (x >= 0 ? `+${x.toFixed(2)}` : `−${Math.abs(x).toFixed(2)}`);
const wColor = (w: number) => (w >= 0 ? A : B);

const TINT = "rgba(130,130,130,0.11)";
const HAIRLINE = "1px solid rgba(128,128,128,0.32)";

const RADIUS = 6;
// row index: 0 header · 1 count · 2 weight · 3 product
function cellStyle(row: number, active: boolean): React.CSSProperties {
  return {
    padding: "5px 10px",
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
    background: active ? TINT : "transparent",
    borderTopLeftRadius: row === 0 ? RADIUS : 0,
    borderTopRightRadius: row === 0 ? RADIUS : 0,
    borderBottomLeftRadius: row === 3 ? RADIUS : 0,
    borderBottomRightRadius: row === 3 ? RADIUS : 0,
  };
}

const rowLabel: React.CSSProperties = {
  padding: "5px 14px 5px 0",
  textAlign: "right",
  whiteSpace: "nowrap",
  fontSize: 12.5,
  opacity: 0.62,
};

const biasDivider: React.CSSProperties = { borderLeft: HAIRLINE, marginLeft: 4 };

export default function NbLinearScore() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 720, color: "currentColor" }}>
      {/* header: log-odds as a dot product */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <M
          display
          tex={String.raw`\log\frac{p(\text{spam}\mid x)}{p(\text{ham}\mid x)}\;=\;\sum_{j}x_j\,w_j\;+\;b,\qquad w_j=\log\frac{\phi_{j\mid\text{spam}}}{\phi_{j\mid\text{ham}}}`}
          size={14}
        />
      </div>

      {/* the aligned grid: word · count · weight · product, + bias column */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `auto repeat(${VOCAB.length}, minmax(52px, 1fr)) auto`,
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
        }}
      >
        {/* row 0 — word headers */}
        <div style={rowLabel} />
        {VOCAB.map((c) => (
          <div key={`h-${c.word}`} style={{ ...cellStyle(0, c.count === 1), fontWeight: 600, fontSize: 12.5 }}>
            {c.word}
          </div>
        ))}
        <div style={{ ...cellStyle(0, true), ...biasDivider, fontWeight: 600, fontSize: 12.5, opacity: 0.75 }}>bias</div>

        {/* row 1 — count vector */}
        <div style={rowLabel}>
          count <M tex="x_j" size={12.5} />
        </div>
        {VOCAB.map((c) => (
          <div
            key={`c-${c.word}`}
            style={{
              ...cellStyle(1, c.count === 1),
              fontWeight: c.count === 1 ? 700 : 400,
              opacity: c.count === 1 ? 1 : 0.3,
            }}
          >
            {c.count}
          </div>
        ))}
        <div style={{ ...cellStyle(1, true), ...biasDivider, fontWeight: 700 }}>1</div>

        {/* row 2 — weight vector w_j = log-ratio */}
        <div style={rowLabel}>
          weight <M tex="w_j" size={12.5} />
        </div>
        {VOCAB.map((c) => (
          <div key={`w-${c.word}`} style={{ ...cellStyle(2, c.count === 1), color: wColor(c.w), fontWeight: 600 }}>
            {signed(c.w)}
          </div>
        ))}
        <div style={{ ...cellStyle(2, true), ...biasDivider, fontWeight: 600 }}>
          <M tex={String.raw`b=0`} size={13} />
        </div>

        {/* row 3 — column products x_j · w_j */}
        <div style={{ ...rowLabel, opacity: 0.62 }}>
          <M tex={String.raw`x_j\,w_j`} size={12.5} />
        </div>
        {VOCAB.map((c) => {
          const active = c.count === 1;
          return (
            <div
              key={`p-${c.word}`}
              style={{
                ...cellStyle(3, active),
                color: active ? wColor(c.w) : "currentColor",
                opacity: active ? 1 : 0.28,
                fontWeight: active ? 600 : 400,
              }}
            >
              {active ? signed(c.w) : "0"}
            </div>
          );
        })}
        <div style={{ ...cellStyle(3, true), ...biasDivider, opacity: 0.55 }}>0</div>
      </div>

      {/* drop: the surviving products gather into the score */}
      <div style={{ textAlign: "center", opacity: 0.5, fontSize: 18, lineHeight: 1, margin: "10px 0 4px" }}>↓</div>

      {/* sum line — pairwise products collapse to the log-odds score */}
      <div style={{ textAlign: "center" }}>
        <M
          display
          tex={String.raw`\text{score}=\textcolor{${A}}{0.56}+\textcolor{${A}}{0.27}\;\textcolor{${B}}{-\,0.13}\;\textcolor{${B}}{-\,0.13}\;+\underbrace{0\,}_{b}\;=\;0.56`}
          size={14.5}
        />
      </div>

      {/* squash to a probability */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          gap: 12,
          marginTop: 8,
          flexWrap: "wrap",
        }}
      >
        <M tex={String.raw`\sigma(0.56)=0.64`} size={15} />
        <span style={{ fontSize: 12.5, opacity: 0.6 }}>matches the smoothed posterior</span>
      </div>

      {/* legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 22,
          marginTop: 14,
          fontSize: 12,
          opacity: 0.8,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: A, display: "inline-block" }} />
          positive weight — spam evidence
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: 3, background: B, display: "inline-block" }} />
          negative weight — ham evidence
        </span>
      </div>
    </div>
  );
}
