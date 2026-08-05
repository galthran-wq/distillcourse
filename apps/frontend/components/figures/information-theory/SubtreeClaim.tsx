import { M } from "../M";
import { ACCENT, MUTED_OPACITY } from "../palette";

/**
 * Why a codeword of length ℓ costs 2^{-ℓ} of the tree. A binary tree drawn to
 * depth 4; the node reached by the path "10" (depth 2) and its whole subtree
 * are shaded amber. A tally on the right counts the subtree at each depth —
 * 2 of 8, then 4 of 16, … — all reducing to the constant fraction 1/4 = 2^{-2}.
 * One idea: a codeword owns the same fraction 2^{-ℓ} of the tree at every depth
 * below it. After Cover & Thomas §5.2 (redrawn).
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const DEPTH = 4;
const XOFF = 40;
const W = 545;
const Y0 = 34;
const DY = 58;
const DANGLE = 26; // length of the stubs hanging below the leaves

const nx = (d: number, i: number) => XOFF + ((i + 0.5) * W) / 2 ** d;
const ny = (d: number) => Y0 + d * DY;

// A node at depth d, index i belongs to the "10" subtree iff its d-bit path
// starts with "10", i.e. i >> (d - 2) === 0b10.
const inSubtree = (d: number, i: number) => d >= 2 && i >> (d - 2) === 0b10;

// The path root → "10" node (bits 1 then 0) that names the codeword.
const onPath = (d: number, i: number) =>
  (d === 1 && i === 1) || (d === 2 && i === 2);

type Edge = { d: number; pi: number; ci: number; bit: "0" | "1" };
const EDGES: Edge[] = [];
for (let d = 0; d < DEPTH; d++) {
  for (let i = 0; i < 2 ** d; i++) {
    EDGES.push({ d, pi: i, ci: 2 * i, bit: "0" });
    EDGES.push({ d, pi: i, ci: 2 * i + 1, bit: "1" });
  }
}

const EDGE_SIZE: Record<number, number> = { 1: 12, 2: 11, 3: 9.5, 4: 8 };
const EDGE_OP: Record<number, number> = { 1: 0.8, 2: 0.72, 3: 0.55, 4: 0.36 };

function Tree() {
  const A = { x: nx(2, 2), y: ny(2) }; // the "10" node
  // Funnel polygon hugging the subtree outline (apex above the "10" pill,
  // down the left descendants, across the dangling stubs, up the right).
  const i4x = nx(3, 4);
  const i5x = nx(3, 5);
  const i8x = nx(4, 8);
  const i11x = nx(4, 11);
  const yBase = ny(4) + DANGLE + 4;
  const region = [
    [A.x, A.y + 2],
    [i4x - 14, ny(3)],
    [i8x - 12, ny(4)],
    [i8x - 10, yBase],
    [i11x + 10, yBase],
    [i11x + 12, ny(4)],
    [i5x + 14, ny(3)],
  ]
    .map((p) => p.join(","))
    .join(" ");

  return (
    <svg viewBox="0 0 600 350" width="600" aria-hidden="true">
      {/* amber claim region */}
      <polygon
        points={region}
        fill={ACCENT}
        fillOpacity="0.1"
        stroke={ACCENT}
        strokeWidth="1.3"
        strokeDasharray="5 4"
        strokeLinejoin="round"
      />

      {/* depth guide labels (far left) */}
      {Array.from({ length: DEPTH + 1 }, (_, d) => (
        <text
          key={`dg${d}`}
          x={8}
          y={ny(d) + 4}
          fontSize="10"
          fill="currentColor"
          opacity={MUTED_OPACITY}
          fontFamily="system-ui, sans-serif"
        >
          {d}
        </text>
      ))}
      <text
        x={8}
        y={Y0 - 16}
        fontSize="9.5"
        fill="currentColor"
        opacity={MUTED_OPACITY}
        fontFamily="system-ui, sans-serif"
      >
        depth
      </text>

      {/* edges */}
      {EDGES.map((e) => {
        const p = { x: nx(e.d, e.pi), y: ny(e.d) };
        const c = { x: nx(e.d + 1, e.ci), y: ny(e.d + 1) };
        const path = onPath(e.d + 1, e.ci);
        const sub = inSubtree(e.d + 1, e.ci);
        const amber = path || sub;
        return (
          <line
            key={`e${e.d}-${e.ci}`}
            x1={p.x}
            y1={p.y}
            x2={c.x}
            y2={c.y}
            stroke={amber ? ACCENT : "currentColor"}
            strokeWidth={path ? 2.2 : 1.2}
            strokeOpacity={amber ? 0.95 : 0.5}
          />
        );
      })}

      {/* dangling stubs below the leaves (tree continues to depth D) */}
      {Array.from({ length: 2 ** DEPTH }, (_, i) => {
        const x = nx(DEPTH, i);
        const sub = inSubtree(DEPTH, i);
        return (
          <line
            key={`st${i}`}
            x1={x}
            y1={ny(DEPTH)}
            x2={x}
            y2={ny(DEPTH) + DANGLE}
            stroke={sub ? ACCENT : "currentColor"}
            strokeWidth="1.1"
            strokeOpacity={sub ? 0.9 : 0.4}
            strokeDasharray="2 3"
          />
        );
      })}

      {/* bit labels on every edge */}
      {EDGES.map((e) => {
        const p = { x: nx(e.d, e.pi), y: ny(e.d) };
        const c = { x: nx(e.d + 1, e.ci), y: ny(e.d + 1) };
        const path = onPath(e.d + 1, e.ci);
        const t = path ? 0.5 : 0.6;
        const lx = p.x + t * (c.x - p.x) + (e.bit === "0" ? -4.5 : 4.5);
        const ly = p.y + t * (c.y - p.y) + 3;
        return (
          <text
            key={`b${e.d}-${e.ci}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            fontSize={path ? 13 : EDGE_SIZE[e.d + 1]}
            fontWeight={path ? 700 : 600}
            fill={path ? ACCENT : "currentColor"}
            opacity={path ? 1 : EDGE_OP[e.d + 1]}
            fontFamily={MONO}
          >
            {e.bit}
          </text>
        );
      })}

      {/* nodes: faint dots; amber dots for subtree members */}
      {Array.from({ length: DEPTH + 1 }, (_, d) =>
        Array.from({ length: 2 ** d }, (_, i) => {
          if (d === 2 && i === 2) return null; // the pill draws this one
          const sub = inSubtree(d, i);
          return (
            <circle
              key={`n${d}-${i}`}
              cx={nx(d, i)}
              cy={ny(d)}
              r={sub ? 2.8 : 2.2}
              fill={sub ? ACCENT : "currentColor"}
              opacity={sub ? 0.95 : 0.45}
            />
          );
        }),
      )}

      {/* the "10" node as an amber pill */}
      <g>
        <rect
          x={nx(2, 2) - 16}
          y={ny(2) - 11}
          width="32"
          height="22"
          rx="11"
          fill={ACCENT}
        />
        <text
          x={nx(2, 2)}
          y={ny(2) + 4.5}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="#fff"
          fontFamily={MONO}
        >
          10
        </text>
      </g>

      {/* region caption */}
      <text
        x={nx(2, 2)}
        y={ny(4) + DANGLE + 24}
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="600"
        fill={ACCENT}
        fontFamily="system-ui, sans-serif"
      >
        all strings starting 10
      </text>
    </svg>
  );
}

function TallyLine({ tex }: { tex: string }) {
  return (
    <div style={{ padding: "3px 0" }}>
      <M tex={tex} size={14} />
    </div>
  );
}

const FRAC = String.raw`\textcolor{${ACCENT}}{\tfrac14}`;

export default function SubtreeClaim() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 940,
        display: "flex",
        alignItems: "flex-start",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 560px", minWidth: 480 }}>
        <Tree />
      </div>

      {/* tally column */}
      <div style={{ flex: "0 1 300px", minWidth: 250, paddingTop: 18 }}>
        <div
          style={{
            fontWeight: 600,
            marginBottom: 6,
            opacity: 0.85,
          }}
        >
          nodes in the subtree at each depth
        </div>
        <TallyLine tex={String.raw`\text{depth } 3:\enspace 2 \text{ of } 8 \;=\; ${FRAC}`} />
        <TallyLine tex={String.raw`\text{depth } 4:\enspace 4 \text{ of } 16 \;=\; ${FRAC}`} />
        <div style={{ padding: "2px 0 2px 6px", opacity: MUTED_OPACITY }}>
          <M tex={String.raw`\vdots`} size={14} />
        </div>
        <TallyLine
          tex={String.raw`\text{depth } D:\enspace 2^{D-2} \text{ of } 2^{D} \;=\; ${FRAC}`}
        />

        <div
          style={{
            marginTop: 16,
            padding: "10px 12px",
            border: `1.3px solid ${ACCENT}`,
            borderRadius: 8,
            background: `${ACCENT}14`,
            lineHeight: 1.5,
          }}
        >
          the codeword{" "}
          <span style={{ fontFamily: MONO, fontWeight: 700, color: ACCENT }}>
            10
          </span>{" "}
          claims <M tex={String.raw`\textcolor{${ACCENT}}{2^{-2}} = ${FRAC}`} size={14} /> of
          the tree at <b>every</b> depth
        </div>
      </div>
    </div>
  );
}
