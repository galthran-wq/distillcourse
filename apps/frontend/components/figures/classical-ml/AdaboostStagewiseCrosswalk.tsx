import { Fragment } from "react";

import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * AdaboostStagewiseCrosswalk — the equivalence, line by line (adaboost lesson).
 *
 * One idea: AdaBoost's three moving parts are not three design decisions but
 * three pieces of ONE greedy stagewise minimization of the exponential loss.
 * The proof is a crosswalk: each row puts the 1997 algorithm's rule beside the
 * 2000 stagewise quantity it equals, joined on the center line by an "="
 * badge, so the eye reads the identity across rather than down.
 *
 * Color roles (two hues + currentColor): amber = the algorithm's lead symbol,
 * blue = the stagewise objective's lead symbol. Labels stay currentColor so no
 * third role competes with the two columns.
 */

const A = ACCENT; // the algorithm (1997)
const B = SUPPORT; // stagewise exponential loss (2000)

const RULE = "1px solid color-mix(in srgb, currentColor 20%, transparent)";

type Row = {
  left: string;
  leftLabel: string;
  right: string;
  /** Node, not string: symbols inside a label are KaTeX, like the equations. */
  rightLabel: React.ReactNode;
};

/** Label-sized inline math, so `i` and `α` match the glyphs above them. */
function m(tex: string) {
  return <M tex={tex} size={12} />;
}

const ROWS: Row[] = [
  {
    left: String.raw`\textcolor{${A}}{w_i^{(t)}} \;\propto\; \prod_{s<t} e^{-\alpha_s y_i h_s(x_i)}`,
    leftLabel: "step 3: multiplicative reweighting",
    right: String.raw`\textcolor{${B}}{e^{-y_i F_{t-1}(x_i)}}`,
    rightLabel: <>the frozen model&apos;s loss at point {m("i")}</>,
  },
  {
    left: String.raw`\textcolor{${A}}{\arg\min_h} \; \sum_i w_i\, \mathbf{1}\{h(x_i) \ne y_i\}`,
    leftLabel: "step 1: weak learner's target",
    right: String.raw`\textcolor{${B}}{\arg\min_h} \; \sum_i w_i\, e^{-\alpha y_i h(x_i)}`,
    rightLabel: <>stage argmin at fixed {m(String.raw`\alpha > 0`)}</>,
  },
  {
    // \dfrac both times: inline-style fractions shrink ε_t below the legible floor.
    left: String.raw`\textcolor{${A}}{\alpha_t} \;=\; \dfrac{1}{2}\ln\dfrac{1-\varepsilon_t}{\varepsilon_t}`,
    leftLabel: "step 2: the vote weight",
    right: String.raw`\textcolor{${B}}{\arg\min_\alpha} \; \bigl[\, e^{-\alpha}(1-\varepsilon) + e^{\alpha}\varepsilon \,\bigr]`,
    rightLabel: <>stage argmin over {m(String.raw`\alpha`)}</>,
  },
];

const COLS = "1fr 30px 1fr";

const HEAD: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 0.35,
  fontWeight: 600,
};

const EQ_CELL: React.CSSProperties = { padding: "13px 0 3px" };

/** A rule spanning the whole grid: a per-cell border would break at the gaps. */
const SPAN_RULE: React.CSSProperties = { gridColumn: "1 / -1", borderTop: RULE };

const LABEL: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.58,
  lineHeight: 1.35,
  paddingBottom: 12,
};

function EqBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        borderRadius: "50%",
        border: "1.4px solid currentColor",
        fontSize: 14,
        fontWeight: 700,
        opacity: 0.75,
        lineHeight: 1,
      }}
    >
      =
    </span>
  );
}

export default function AdaboostStagewiseCrosswalk() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      {/* column headers: the two accounts of the same procedure */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          columnGap: 12,
          alignItems: "end",
          paddingBottom: 7,
        }}
      >
        <div style={{ ...HEAD, color: A, textAlign: "right" }}>the algorithm (1997)</div>
        <div />
        <div style={{ ...HEAD, color: B }}>stagewise exponential loss (2000)</div>
      </div>

      {/* One grid, two sub-rows per pair: the badge lands on the equation line
          itself rather than drifting down between equation and label. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: COLS,
          columnGap: 12,
          alignItems: "center",
          borderBottom: RULE,
        }}
      >
        {ROWS.map((r) => (
          <Fragment key={r.leftLabel}>
            <div style={SPAN_RULE} />
            {/* the pair hugs the center line, so each row reads across, not down */}
            <div style={{ ...EQ_CELL, textAlign: "right" }}>
              <M size={16} tex={r.left} />
            </div>
            <div style={{ ...EQ_CELL, textAlign: "center" }}>
              <EqBadge />
            </div>
            <div style={EQ_CELL}>
              <M size={16} tex={r.right} />
            </div>

            <div style={{ ...LABEL, textAlign: "right" }}>{r.leftLabel}</div>
            <div />
            <div style={LABEL}>{r.rightLabel}</div>
          </Fragment>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 14,
          fontSize: 13,
          opacity: 0.7,
          lineHeight: 1.45,
        }}
      >
        three design decisions = one greedy minimization
      </div>
    </div>
  );
}
