import { M } from "../M";
import { ACCENT, labelMuted } from "../palette";

/**
 * IbBetaExtremes — where β puts the solution on the frontier, for the toy
 * source X ∈ {a,b,c,d}. Three small encoder diagrams, one per β regime:
 *
 *   β < 2.19          collapse       all inputs → one cluster t   → (0, 0)
 *   2.19 < β < 7.25   aligned merge  a,b→t₁ and c,d→t₂            → (1, 0.456)
 *   β > 7.25          copy T = X     four inputs → four clusters  → (2, 0.594)
 *
 * The crossover prices β ≈ 2.19 and β ≈ 7.25 are the inverse slopes between
 * consecutive points; a shared frontier mini-axis underneath places the three
 * operating points and the direction β grows.
 *
 * Color roles: amber = the β-optimal encoder structure of each regime (the
 * subject) and its point on the frontier; currentColor = the input symbols and
 * the frame. One idea: β dials where on the frontier the solution sits.
 */

const NODE_TINT = "#e2903a22";
const INPUT_Y = [18, 52, 86, 120];
const NODE_CX = 120;
const NODE_R = 9;

type Node = { cx: number; cy: number; label?: string };

/** Straight amber assignment arrow from an input dot to a cluster node edge. */
function Arrow({ x1, y1, cx, cy }: { x1: number; y1: number; cx: number; cy: number }) {
  const dx = cx - x1;
  const dy = cy - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const ex = cx - ux * NODE_R; // arrow tip at circle boundary
  const ey = cy - uy * NODE_R;
  const bx = ex - ux * 7; // arrowhead base
  const by = ey - uy * 7;
  const px = -uy;
  const py = ux;
  const w = 3.2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={ACCENT} strokeWidth="1.5" />
      <polygon
        points={`${ex},${ey} ${bx + px * w},${by + py * w} ${bx - px * w},${by - py * w}`}
        fill={ACCENT}
      />
    </g>
  );
}

function EncoderDiagram({ nodes, edges }: { nodes: Node[]; edges: [number, number][] }) {
  return (
    <svg viewBox="0 0 150 138" width="150" aria-hidden="true">
      {/* assignment arrows (drawn first, under the nodes) */}
      {edges.map(([i, n], k) => (
        <Arrow key={k} x1={22} y1={INPUT_Y[i]} cx={nodes[n].cx} cy={nodes[n].cy} />
      ))}

      {/* input symbols a,b,c,d — currentColor */}
      {INPUT_Y.map((y, i) => (
        <g key={`in${i}`}>
          <circle cx={22} cy={y} r={3.5} fill="currentColor" />
          <text x={9} y={y + 4} fontSize="12" fontStyle="italic" textAnchor="middle" fill="currentColor">
            {["a", "b", "c", "d"][i]}
          </text>
        </g>
      ))}

      {/* cluster nodes — amber */}
      {nodes.map((nd, i) => (
        <g key={`nd${i}`}>
          <circle cx={nd.cx} cy={nd.cy} r={NODE_R} fill={NODE_TINT} stroke={ACCENT} strokeWidth="1.6" />
          {nd.label && (
            <text
              x={nd.cx + 13}
              y={nd.cy + 4}
              fontSize="12"
              fontStyle="italic"
              fill={ACCENT}
              fontWeight="600"
            >
              {nd.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function Regime({
  header,
  nodes,
  edges,
  coords,
  tag,
}: {
  header: string;
  nodes: Node[];
  edges: [number, number][];
  coords: string;
  tag: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "1 1 0" }}>
      <div style={{ fontWeight: 600, fontSize: 13.5 }}>
        <M tex={header} size={13.5} />
      </div>
      <EncoderDiagram nodes={nodes} edges={edges} />
      <div style={{ fontSize: 13 }}>
        <M tex={coords} size={13} />
      </div>
      <div style={{ color: ACCENT, fontSize: 12.5, fontWeight: 600 }}>{tag}</div>
    </div>
  );
}

// ── frontier mini-axis geometry ──
const FW = 560;
const REL0_Y = 78; // relevance 0
const RELMAX_Y = 30; // relevance 0.594
const PX = [95, 280, 465]; // rate 0, 1, 2 (aligned under the three columns)
const rel = (v: number) => REL0_Y - (v / 0.594) * (REL0_Y - RELMAX_Y);
const PY = [rel(0), rel(0.456), rel(0.594)];
const COORD = ["(0,\\, 0)", "(1,\\, 0.456)", "(2,\\, 0.594)"];
const LABELS = ["(0, 0)", "(1, 0.456)", "(2, 0.594)"];

export default function IbBetaExtremes() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: FW,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
      }}
    >
      {/* three encoder diagrams, one per β regime */}
      <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
        <Regime
          header={String.raw`\beta < 2.19`}
          nodes={[{ cx: NODE_CX, cy: 69, label: "t" }]}
          edges={[
            [0, 0],
            [1, 0],
            [2, 0],
            [3, 0],
          ]}
          coords={COORD[0]}
          tag="collapse"
        />
        <Regime
          header={String.raw`2.19 < \beta < 7.25`}
          nodes={[
            { cx: NODE_CX, cy: 35, label: "t₁" },
            { cx: NODE_CX, cy: 103, label: "t₂" },
          ]}
          edges={[
            [0, 0],
            [1, 0],
            [2, 1],
            [3, 1],
          ]}
          coords={COORD[1]}
          tag="the aligned merge"
        />
        <Regime
          header={String.raw`\beta > 7.25`}
          nodes={INPUT_Y.map((y) => ({ cx: NODE_CX, cy: y }))}
          edges={[
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
          ]}
          coords={COORD[2]}
          tag={<M tex={String.raw`\text{copy: } T = X`} size={12.5} color={ACCENT} />}
        />
      </div>

      {/* shared frontier mini-axis: the three operating points, β growing right */}
      <svg viewBox={`0 0 ${FW} 124`} width="100%" aria-hidden="true">
        {/* rate axis (relevance = 0 line) */}
        <line x1={70} y1={REL0_Y} x2={490} y2={REL0_Y} stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" />

        {/* concave amber frontier through the three points */}
        <path
          d={`M ${PX[0]} ${PY[0]} Q 185 ${PY[1] - 4} ${PX[1]} ${PY[1]} Q 372 ${PY[2]} ${PX[2]} ${PY[2]}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.8"
          opacity="0.85"
        />

        {/* the three operating points + coordinate labels */}
        {PX.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={PY[i]} r={4} fill={ACCENT} />
            <text x={x} y={PY[i] - 11} fontSize="11.5" textAnchor="middle" fill="currentColor">
              {LABELS[i]}
            </text>
          </g>
        ))}

        {/* β-grows arrow along the axis */}
        <line x1={95} y1={106} x2={430} y2={106} stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.55" />
        <polygon points={"440,106 431,102.5 431,109.5"} fill="currentColor" fillOpacity="0.55" />
        <text x={452} y={110} fontSize="12" textAnchor="start" fill="currentColor" opacity="0.55" fontStyle="italic">
          β grows
        </text>
      </svg>

      {/* color-role legend: bind amber to the word naming it */}
      <div style={{ ...labelMuted, fontSize: 11.5, textAlign: "center" }}>
        <span style={{ color: ACCENT, fontWeight: 600 }}>amber</span> = the{" "}
        <M tex="\beta" size={11.5} />-optimal encoder for each regime, and its point on the frontier
      </div>
    </div>
  );
}
