import { Fragment } from "react";
import { M } from "../M";
import { ACCENT, labelMuted } from "../palette";

/**
 * Two prefix codes for the same source distribution (.5, .25, .15, .1) side
 * by side: a balanced code where every codeword has length 2 (L = 2.00 bits)
 * and a matched code with lengths 1, 2, 3, 3 (L = 1.75 bits). Amber marks
 * the one thing that changes — the codeword lengths — and the winning L.
 */

const SYMBOLS = ["A", "B", "C", "D"];
const PROBS = [".5", ".25", ".15", ".1"];
const BALANCED = { words: ["11", "10", "01", "00"], lens: [2, 2, 2, 2] };
const MATCHED = { words: ["1", "01", "001", "000"], lens: [1, 2, 3, 3] };

const cell: React.CSSProperties = {
  padding: "3px 10px",
  textAlign: "center",
};

const headCell: React.CSSProperties = {
  ...cell,
  opacity: 0.55,
  fontSize: 12,
  fontStyle: "italic",
};

function Panel({
  title,
  words,
  lens,
  tally,
  amberLens,
}: {
  title: string;
  words: string[];
  lens: number[];
  tally: string;
  amberLens?: boolean;
}) {
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto auto",
          border: "1px solid currentColor",
          borderRadius: 6,
          padding: "4px 6px",
          justifyContent: "start",
          width: "fit-content",
        }}
      >
        <span style={headCell} />
        <span style={headCell}>p</span>
        <span style={headCell}>codeword</span>
        <span style={{ ...headCell, color: amberLens ? ACCENT : undefined, opacity: amberLens ? 0.9 : 0.55 }}>len</span>
        {SYMBOLS.map((s, i) => (
          <Fragment key={i}>
            <span style={{ ...cell, fontWeight: 600 }}>{s}</span>
            <span style={cell}>{PROBS[i]}</span>
            <span style={{ ...cell, fontFamily: "ui-monospace, monospace" }}>
              {words[i]}
            </span>
            <span
              style={{
                ...cell,
                color: amberLens ? ACCENT : undefined,
                fontWeight: amberLens ? 600 : undefined,
              }}
            >
              {lens[i]}
            </span>
          </Fragment>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        <M tex={tally} size={13} />
      </div>
    </div>
  );
}

export default function TwoCodesOneSource() {
  const balancedTally = String.raw`L = .5\!\cdot\!2 + .25\!\cdot\!2 + .15\!\cdot\!2 + .1\!\cdot\!2 = 2.00\ \text{bits}`;
  const A = (x: string) => String.raw`\textcolor{${ACCENT}}{${x}}`;
  const matchedTally = String.raw`L = .5\!\cdot\!${A("1")} + .25\!\cdot\!${A("2")} + .15\!\cdot\!${A("3")} + .1\!\cdot\!${A("3")} = ${A(String.raw`\mathbf{1.75}`)}\ \text{bits}`;
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 720 }}>
      <div style={{ display: "flex", gap: 44, flexWrap: "wrap", alignItems: "flex-start" }}>
        <Panel title="balanced code" words={BALANCED.words} lens={BALANCED.lens} tally={balancedTally} />
        <Panel title="matched code" words={MATCHED.words} lens={MATCHED.lens} tally={matchedTally} amberLens />
      </div>
      <div style={{ ...labelMuted, marginTop: 14 }}>
        matching lengths to probabilities saves <b>0.25 bits</b> per symbol
      </div>
    </div>
  );
}
