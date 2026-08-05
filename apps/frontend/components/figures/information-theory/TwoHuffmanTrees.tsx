import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * Two Huffman trees for the SAME source (1/3, 1/3, 1/4, 1/12), drawn as the
 * house comparison layout: near-identical panels joined by a bold amber
 * "same cost" arrow. The tie between the two 1/3 weights (blue) can be broken
 * two ways — merge the original thirds (balanced, lengths 2,2,2,2) or merge b
 * with the made third (skewed, lengths 1,2,3,3). Both yield L = 2.00 bits.
 * One idea: tie-breaking changes the tree, never the cost.
 */

type Pt = { x: number; y: number };
type Leaf = { id: string; at: Pt; prob: string; blue?: boolean };

const VB_W = 280;
const VB_H = 220;

// ── LEFT: balanced, all four leaves at depth 2 ──────────────────────────────
const L_NODES: Record<string, Pt> = {
  root: { x: 140, y: 20 },
  iL: { x: 78, y: 72 },
  iR: { x: 202, y: 72 },
};
const L_EDGES: [Pt, Pt][] = [
  [L_NODES.root, L_NODES.iL],
  [L_NODES.root, L_NODES.iR],
];
const L_LEAVES: Leaf[] = [
  { id: "a", at: { x: 44, y: 124 }, prob: String.raw`\tfrac{1}{3}`, blue: true },
  { id: "b", at: { x: 112, y: 124 }, prob: String.raw`\tfrac{1}{3}`, blue: true },
  { id: "c", at: { x: 168, y: 124 }, prob: String.raw`\tfrac{1}{4}` },
  { id: "d", at: { x: 236, y: 124 }, prob: String.raw`\tfrac{1}{12}` },
];
const L_LEAF_EDGES: [Pt, Pt][] = [
  [L_NODES.iL, L_LEAVES[0].at],
  [L_NODES.iL, L_LEAVES[1].at],
  [L_NODES.iR, L_LEAVES[2].at],
  [L_NODES.iR, L_LEAVES[3].at],
];

// ── RIGHT: skewed, a at depth 1, b at depth 2, c & d at depth 3 ─────────────
const R_NODES: Record<string, Pt> = {
  root: { x: 52, y: 20 },
  n1: { x: 140, y: 72 },
  n2: { x: 225, y: 124 },
};
const R_LEAVES: Leaf[] = [
  { id: "a", at: { x: 26, y: 72 }, prob: String.raw`\tfrac{1}{3}`, blue: true },
  { id: "b", at: { x: 110, y: 124 }, prob: String.raw`\tfrac{1}{3}`, blue: true },
  { id: "c", at: { x: 196, y: 176 }, prob: String.raw`\tfrac{1}{4}` },
  { id: "d", at: { x: 258, y: 176 }, prob: String.raw`\tfrac{1}{12}` },
];
const R_EDGES: [Pt, Pt][] = [
  [R_NODES.root, R_LEAVES[0].at],
  [R_NODES.root, R_NODES.n1],
  [R_NODES.n1, R_LEAVES[1].at],
  [R_NODES.n1, R_NODES.n2],
  [R_NODES.n2, R_LEAVES[2].at],
  [R_NODES.n2, R_LEAVES[3].at],
];

function Edge({ from, to }: { from: Pt; to: Pt }) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeOpacity="0.75"
    />
  );
}

function Dot({ at, r = 3 }: { at: Pt; r?: number }) {
  return <circle cx={at.x} cy={at.y} r={r} fill="currentColor" />;
}

function LeafLabel({ leaf }: { leaf: Leaf }) {
  return (
    <div
      style={{
        position: "absolute",
        left: leaf.at.x,
        top: leaf.at.y + 7,
        transform: "translateX(-50%)",
        textAlign: "center",
        width: 56,
        lineHeight: 1.15,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14 }}>{leaf.id}</div>
      <M
        tex={leaf.blue ? String.raw`\textcolor{${SUPPORT}}{${leaf.prob}}` : leaf.prob}
        size={13}
      />
    </div>
  );
}

function Panel({
  title,
  edges,
  nodes,
  leaves,
  lengths,
  tally,
}: {
  title: string;
  edges: [Pt, Pt][];
  nodes: Pt[];
  leaves: Leaf[];
  lengths: string;
  tally: string;
}) {
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ position: "relative", width: VB_W, height: VB_H }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width={VB_W} aria-hidden="true">
          {edges.map((e, i) => (
            <Edge key={`e${i}`} from={e[0]} to={e[1]} />
          ))}
          {nodes.map((n, i) => (
            <Dot key={`n${i}`} at={n} />
          ))}
          {leaves.map((l) => (
            <Dot key={`l${l.id}`} at={l.at} />
          ))}
        </svg>
        {leaves.map((l) => (
          <LeafLabel key={`ll${l.id}`} leaf={l} />
        ))}
      </div>
      <div style={{ ...labelMuted, marginTop: 2 }}>
        lengths <M tex={lengths} size={12} />
      </div>
      <div style={{ marginTop: 6 }}>
        <M tex={tally} size={13} />
      </div>
    </div>
  );
}

export default function TwoHuffmanTrees() {
  const bold2 = String.raw`\textcolor{${ACCENT}}{\mathbf{2.00}}`;
  const leftTally = String.raw`L = ${bold2}\ \text{bits}`;
  const rightTally = String.raw`L = \tfrac{1}{3} + \tfrac{2}{3} + \tfrac{3}{4} + \tfrac{1}{4} = ${bold2}\ \text{bits}`;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 780 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "nowrap" }}>
        <Panel
          title="merge the two original thirds"
          edges={L_EDGES.concat(L_LEAF_EDGES)}
          nodes={[L_NODES.root, L_NODES.iL, L_NODES.iR]}
          leaves={L_LEAVES}
          lengths={String.raw`(2, 2, 2, 2)`}
          tally={leftTally}
        />

        {/* bold amber double-headed arrow: the two trees cost the same */}
        <div style={{ flexShrink: 0, alignSelf: "center", textAlign: "center", width: 92 }}>
          <div style={{ color: ACCENT, fontWeight: 700, fontSize: 12, marginBottom: 2 }}>
            same cost
          </div>
          <svg viewBox="0 0 92 24" width="92" aria-hidden="true">
            <line x1="10" y1="12" x2="82" y2="12" stroke={ACCENT} strokeWidth="2.8" />
            <path d="M18 5 L9 12 L18 19" fill="none" stroke={ACCENT} strokeWidth="2.8" />
            <path d="M74 5 L83 12 L74 19" fill="none" stroke={ACCENT} strokeWidth="2.8" />
          </svg>
        </div>

        <Panel
          title="merge b with the made third"
          edges={R_EDGES}
          nodes={[R_NODES.root, R_NODES.n1, R_NODES.n2]}
          leaves={R_LEAVES}
          lengths={String.raw`(1, 2, 3, 3)`}
          tally={rightTally}
        />
      </div>

      <div style={{ ...labelMuted, marginTop: 12 }}>
        different shapes, <b>identical expected length</b>
      </div>
    </div>
  );
}
