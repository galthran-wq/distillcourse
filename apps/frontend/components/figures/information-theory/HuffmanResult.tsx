import { M } from "../M";
import { ACCENT, SUPPORT, MUTED_OPACITY } from "../palette";

/**
 * HuffmanResult — the finished Huffman code for the running source
 * (A:.5, B:.25, C:.15, D:.1) shown two ways, then measured against entropy.
 *
 * Left: the completed Huffman tree. Root weight 1.0 splits into leaf A and
 * node .50; .50 into leaf B and node .25; .25 into leaves C and D. Branch
 * bits (amber) follow the merge order — the A-side branch is 1, the merged
 * side is 0 — so the leaves read off codewords 1, 01, 001, 000. Right: the
 * per-symbol cost table with the tally L = 1.75 bits. Below: the code's cost
 * against the entropy floor, H(X) ≈ 1.743 ≤ L = 1.75, the 0.007-bit gap being
 * the price of rounding lengths to whole bits.
 *
 * amber = the code and its cost L · blue = the entropy floor H · currentColor
 * = structure. One idea: the finished code and what it costs against entropy.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

type Pt = { x: number; y: number };

const N: Record<string, Pt> = {
  root: { x: 50, y: 42 },
  A: { x: 128, y: 20 },
  n50: { x: 128, y: 74 },
  B: { x: 206, y: 52 },
  n25: { x: 206, y: 106 },
  C: { x: 284, y: 84 },
  D: { x: 284, y: 138 },
};

/** parent, child, is the child a leaf, up-branch (=1) or down-branch (=0) */
const EDGES: { from: string; to: string; leaf: boolean; up: boolean }[] = [
  { from: "root", to: "A", leaf: true, up: true },
  { from: "root", to: "n50", leaf: false, up: false },
  { from: "n50", to: "B", leaf: true, up: true },
  { from: "n50", to: "n25", leaf: false, up: false },
  { from: "n25", to: "C", leaf: true, up: true },
  { from: "n25", to: "D", leaf: true, up: false },
];

/** internal-node merge weights */
const WEIGHTS: { id: string; w: string }[] = [
  { id: "root", w: "1.0" },
  { id: "n50", w: ".50" },
  { id: "n25", w: ".25" },
];

const LEAVES: { id: string; code: string }[] = [
  { id: "A", code: "1" },
  { id: "B", code: "01" },
  { id: "C", code: "001" },
  { id: "D", code: "000" },
];

function TreePanel() {
  return (
    <svg viewBox="0 0 400 172" width="352" aria-hidden="true">
      {/* branches */}
      {EDGES.map((e) => {
        const p = N[e.from];
        const c = N[e.to];
        return (
          <line
            key={`e${e.to}`}
            x1={p.x}
            y1={p.y}
            x2={c.x}
            y2={c.y}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeOpacity="0.7"
          />
        );
      })}
      {/* branch bits (amber): up = 1, down = 0 */}
      {EDGES.map((e) => {
        const p = N[e.from];
        const c = N[e.to];
        const mx = p.x + 0.5 * (c.x - p.x);
        const my = p.y + 0.5 * (c.y - p.y);
        const lx = e.up ? mx - 3 : mx - 9;
        const ly = e.up ? my - 6 : my + 13;
        return (
          <text
            key={`b${e.to}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="700"
            fill={ACCENT}
            fontFamily={MONO}
          >
            {e.up ? "1" : "0"}
          </text>
        );
      })}
      {/* internal nodes: dot + merge weight (structure) */}
      {WEIGHTS.map((n) => {
        const pt = N[n.id];
        return (
          <g key={n.id}>
            <circle cx={pt.x} cy={pt.y} r="3.4" fill="currentColor" />
            <text
              x={pt.x - 7}
              y={pt.y - 6}
              textAnchor="end"
              fontSize="10.5"
              fill="currentColor"
              opacity={MUTED_OPACITY}
              fontFamily="system-ui, sans-serif"
            >
              {n.w}
            </text>
          </g>
        );
      })}
      {/* leaves: dot + letter (structure) + codeword (amber, mono) */}
      {LEAVES.map((l) => {
        const n = N[l.id];
        return (
          <g key={l.id}>
            <circle cx={n.x} cy={n.y} r="3.4" fill="currentColor" />
            <text
              x={n.x + 11}
              y={n.y - 2}
              textAnchor="start"
              fontSize="13"
              fontWeight="600"
              fill="currentColor"
              fontFamily="system-ui, sans-serif"
            >
              {l.id}
            </text>
            <text
              x={n.x + 11}
              y={n.y + 13}
              textAnchor="start"
              fontSize="12"
              fontWeight="700"
              fill={ACCENT}
              fontFamily={MONO}
            >
              {l.code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const ROWS: { s: string; p: string; code: string; len: string; pl: string }[] = [
  { s: "A", p: ".5", code: "1", len: "1", pl: ".50" },
  { s: "B", p: ".25", code: "01", len: "2", pl: ".50" },
  { s: "C", p: ".15", code: "001", len: "3", pl: ".45" },
  { s: "D", p: ".1", code: "000", len: "3", pl: ".30" },
];

const th: React.CSSProperties = {
  padding: "3px 12px",
  textAlign: "right",
  fontWeight: 600,
  borderBottom: "1.4px solid currentColor",
};
const td: React.CSSProperties = { padding: "3px 12px", textAlign: "right" };

function CostTable() {
  return (
    <table style={{ borderCollapse: "collapse", fontSize: 13.5, fontFamily: "system-ui, sans-serif" }}>
      <thead>
        <tr>
          <th style={{ ...th, textAlign: "left" }}>symbol</th>
          <th style={th}>
            <M tex="p" size={13} />
          </th>
          <th style={th}>codeword</th>
          <th style={th}>
            <M tex={String.raw`\ell`} size={13} />
          </th>
          <th style={th}>
            <M tex={String.raw`p\cdot\ell`} size={13} />
          </th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map((r) => (
          <tr key={r.s}>
            <td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{r.s}</td>
            <td style={td}>{r.p}</td>
            <td style={{ ...td, fontFamily: MONO, color: ACCENT, fontWeight: 700 }}>{r.code}</td>
            <td style={td}>{r.len}</td>
            <td style={td}>{r.pl}</td>
          </tr>
        ))}
        <tr>
          <td
            colSpan={4}
            style={{
              padding: "6px 12px 3px",
              textAlign: "right",
              borderTop: "1.4px solid currentColor",
              color: ACCENT,
              fontWeight: 700,
            }}
          >
            <M tex={String.raw`\textcolor{${ACCENT}}{L=1.75\ \text{bits}}`} size={13.5} />
          </td>
          <td style={{ padding: "6px 12px 3px", borderTop: "1.4px solid currentColor" }} />
        </tr>
      </tbody>
    </table>
  );
}

export default function HuffmanResult() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 780 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 28,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>the finished Huffman tree</div>
          <TreePanel />
        </div>
        <div style={{ paddingTop: 4 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>what the code costs</div>
          <CostTable />
        </div>
      </div>

      {/* the cost against the entropy floor */}
      <div style={{ marginTop: 22, textAlign: "center" }}>
        <M
          display
          tex={String.raw`\textcolor{${SUPPORT}}{H(X)} \approx 1.743 \;\;\underbrace{\le}_{\substack{\text{gap } 0.007\text{ bits:}\\[1pt]\text{the integer-rounding cost}}}\;\; \textcolor{${ACCENT}}{L = 1.75}`}
        />
      </div>
    </div>
  );
}
