import { Fragment } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, OK, labelMuted } from "../palette";

/**
 * CodeAsBet — a codeword-length table IS a probability model.
 *
 * Three row-aligned columns over the four symbols A, B, C, D of the running
 * source p = (.5, .25, .15, .1) with the matched code A↦1, B↦01, C↦001,
 * D↦000. Left: the code table (symbol | codeword | ℓ). Middle: the implied
 * bet q(x) = 2^{-ℓ(x)} as amber bars (.5, .25, .125, .125). Right: the true
 * source p(x) as blue bars (.5, .25, .15, .1). Rows A and B match (green
 * check); rows C and D mismatch (bars emphasized, the direction flagged).
 *
 * One idea: choosing lengths is choosing a distribution, ℓ(x) = -log₂ q(x).
 * Framing after Cover & Thomas §5.4.
 */

type Row = {
  sym: string;
  word: string;
  len: number;
  q: number;
  p: number;
  qlab: string; // KaTeX
  plab: string; // plain
  match: boolean;
  note?: string; // KaTeX for mismatch flag
};

const ROWS: Row[] = [
  { sym: "A", word: "1", len: 1, q: 0.5, p: 0.5, qlab: String.raw`2^{-1} = .5`, plab: ".5", match: true },
  { sym: "B", word: "01", len: 2, q: 0.25, p: 0.25, qlab: String.raw`2^{-2} = .25`, plab: ".25", match: true },
  { sym: "C", word: "001", len: 3, q: 0.125, p: 0.15, qlab: String.raw`2^{-3} = .125`, plab: ".15", match: false, note: String.raw`\text{bet } .125 < \text{true } .15` },
  { sym: "D", word: "000", len: 3, q: 0.125, p: 0.1, qlab: String.raw`2^{-3} = .125`, plab: ".1", match: false, note: String.raw`\text{bet } .125 > \text{true } .1` },
];

const HEADER_H = 46;
const ROW_H = 42;

// table cell widths
const SYM_W = 52;
const WORD_W = 66;
const LEN_W = 22;

// bar geometry
const TRACK = 156;
const SCALE = 290; // frac .5 -> 145px
const BAR_H = 17;

const RGB: Record<string, string> = { [ACCENT]: "226,144,58", [SUPPORT]: "76,141,214" };

const headCell: React.CSSProperties = {
  ...labelMuted,
  fontSize: 12,
  fontStyle: "italic",
  textAlign: "center",
};

const row: React.CSSProperties = {
  height: ROW_H,
  display: "flex",
  alignItems: "center",
};

const header: React.CSSProperties = {
  height: HEADER_H,
  display: "flex",
  alignItems: "flex-end",
  paddingBottom: 6,
};

function Bar({ frac, color, emph }: { frac: number; color: string; emph: boolean }) {
  return (
    <div style={{ width: TRACK, display: "flex", alignItems: "center" }}>
      <div
        style={{
          width: frac * SCALE,
          height: BAR_H,
          borderRadius: 3,
          background: `rgba(${RGB[color]}, ${emph ? 0.9 : 0.72})`,
          border: `${emph ? 2 : 1}px solid ${color}`,
        }}
      />
    </div>
  );
}

export default function CodeAsBet() {
  const A = (x: string) => String.raw`\textcolor{${ACCENT}}{${x}}`;
  const B = (x: string) => String.raw`\textcolor{${SUPPORT}}{${x}}`;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 900 }}>
      <div style={{ display: "flex", gap: 30, alignItems: "flex-start", flexWrap: "nowrap" }}>
        {/* ── column 1: the code table ── */}
        <div>
          <div style={{ ...header, alignItems: "flex-end" }}>
            <span style={{ ...headCell, width: SYM_W }}>symbol</span>
            <span style={{ ...headCell, width: WORD_W }}>codeword</span>
            <span style={{ ...headCell, width: LEN_W }}>
              <M tex={String.raw`\ell`} size={13} />
            </span>
          </div>
          {ROWS.map((r) => (
            <div key={r.sym} style={row}>
              <span style={{ width: SYM_W, textAlign: "center", fontWeight: 600 }}>{r.sym}</span>
              <span style={{ width: WORD_W, textAlign: "center", fontFamily: "ui-monospace, monospace" }}>
                {r.word}
              </span>
              <span style={{ width: LEN_W, textAlign: "center" }}>{r.len}</span>
            </div>
          ))}
        </div>

        {/* ── column 2: the implied bet q(x) ── */}
        <div>
          <div style={header}>
            <M tex={String.raw`\text{the bet}\ \ ${A(String.raw`q(x)`)} = 2^{-\ell(x)}`} size={13} />
          </div>
          {ROWS.map((r) => (
            <div key={r.sym} style={row}>
              <Bar frac={r.q} color={ACCENT} emph={!r.match} />
              <span style={{ marginLeft: 8, color: ACCENT, whiteSpace: "nowrap" }}>
                <M tex={A(r.qlab)} size={12} />
              </span>
            </div>
          ))}
        </div>

        {/* ── column 3: the true source p(x) ── */}
        <div>
          <div style={header}>
            <M tex={String.raw`\text{the source}\ \ ${B(String.raw`p(x)`)}`} size={13} />
          </div>
          {ROWS.map((r) => (
            <div key={r.sym} style={row}>
              <Bar frac={r.p} color={SUPPORT} emph={!r.match} />
              <span style={{ marginLeft: 8, color: SUPPORT, whiteSpace: "nowrap" }}>{r.plab}</span>
            </div>
          ))}
        </div>

        {/* ── column 4: match / mismatch annotation ── */}
        <div>
          <div style={header} />
          {ROWS.map((r) => (
            <div key={r.sym} style={{ ...row, whiteSpace: "nowrap" }}>
              {r.match ? (
                <span style={{ color: OK, fontSize: 13 }}>
                  <span style={{ fontWeight: 700 }}>✓</span>{" "}
                  <span style={{ opacity: 0.85 }}>bet matches</span>
                </span>
              ) : (
                <span style={{ opacity: 0.8, fontSize: 12.5 }}>
                  <M tex={r.note!} size={12} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* payoff line */}
      <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px solid currentColor", opacity: 1 }}>
        <M
          tex={String.raw`\text{choosing lengths is choosing a distribution:}\quad \ell(x) = -\log_2 ${A(String.raw`q(x)`)}`}
          size={14}
        />
      </div>
    </div>
  );
}
