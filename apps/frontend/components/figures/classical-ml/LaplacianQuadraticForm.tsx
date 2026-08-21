import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * Formula dissection of the Laplacian quadratic form on the lesson's
 * five-vertex worked example (spectral-clustering): each edge pays its weight
 * times the squared disagreement of f across it, with one edge's term
 * followed from the drawing into the sum.
 */

const W = (sub: string) => String.raw`\textcolor{${ACCENT}}{w_{${sub}}}`;
const F = (sub: string) => String.raw`\textcolor{${SUPPORT}}{f_{${sub}}}`;

// vertex positions for the triangle {1,2,3} and the separate pair {4,5}
const P: Record<number, [number, number]> = {
  1: [38, 84],
  2: [110, 30],
  3: [110, 138],
  4: [200, 46],
  5: [200, 122],
};
const FVALS: Record<number, number> = { 1: 1, 2: 2, 3: 0, 4: 1, 5: 1 };

function edge(a: number, b: number, w: number, accent = false) {
  const [x1, y1] = P[a];
  const [x2, y2] = P[b];
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g key={`${a}${b}`}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={accent ? ACCENT : "currentColor"}
        strokeWidth={accent ? 3 : 1.4}
        opacity={accent ? 0.95 : 0.45}
      />
      <text
        x={mx + (a === 1 && b === 2 ? -10 : a === 1 && b === 3 ? -10 : 10)}
        y={my + (a === 1 && b === 2 ? -6 : a === 1 && b === 3 ? 14 : 4)}
        fontSize="12"
        fontWeight="600"
        fill={accent ? ACCENT : "currentColor"}
        opacity={accent ? 1 : 0.55}
      >
        {w}
      </text>
    </g>
  );
}

function vertex(i: number) {
  const [x, y] = P[i];
  const fLeft = i === 1;
  return (
    <g key={i}>
      <circle cx={x} cy={y} r={11} fill="none" stroke="currentColor" strokeOpacity={0.6} strokeWidth={1.4} />
      <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="currentColor">
        {i}
      </text>
      <text
        x={fLeft ? x - 16 : x + 16}
        y={y + 4}
        textAnchor={fLeft ? "end" : "start"}
        fontSize="11.5"
        fontWeight="600"
        fill={SUPPORT}
      >
        {`f=${FVALS[i]}`}
      </text>
    </g>
  );
}

export default function LaplacianQuadraticForm() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 720 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          columnGap: 36,
          alignItems: "center",
          justifyContent: "start",
        }}
      >
        {/* the graph, one edge in focus */}
        <svg viewBox="0 0 256 168" width="238" aria-hidden="true">
          {edge(1, 2, 3)}
          {edge(1, 3, 1)}
          {edge(2, 3, 2, true)}
          {edge(4, 5, 2)}
          {[1, 2, 3, 4, 5].map(vertex)}
        </svg>

        {/* the identity with roles bound, then the focused edge's term */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <M
            display
            tex={String.raw`f^{\top} L f \;=\; \tfrac{1}{2}\sum_{i,j}\;\underbrace{${W("ij")}}_{\text{\footnotesize edge weight}}\;\underbrace{(${F("i")} - ${F("j")})^{2}}_{\text{\footnotesize disagreement across the edge}}`}
          />
          <div style={{ marginTop: 8 }}>
            <span style={{ ...labelMuted, marginRight: 10 }}>the highlighted edge&rsquo;s term:</span>
            <M tex={String.raw`${W("23")}\,(${F("2")} - ${F("3")})^{2} = \textcolor{${ACCENT}}{2}\,(\textcolor{${SUPPORT}}{2} - \textcolor{${SUPPORT}}{0})^{2} = 8`} />
          </div>
          <div>
            <span style={{ ...labelMuted, marginRight: 10 }}>all four edges:</span>
            <M tex={String.raw`3\cdot 1 + 1\cdot 1 + 8 + 2\cdot 0 = 12 = f^{\top}Lf`} />
          </div>
        </div>
      </div>

      <div style={{ ...labelMuted, marginTop: 10 }}>
        <M tex={String.raw`f^{\top} L f`} size={12} /> is small exactly when <M tex={String.raw`\textcolor{${SUPPORT}}{f}`} size={12} /> is
        nearly constant across every heavy edge: smooth on the graph.
      </div>
    </div>
  );
}
