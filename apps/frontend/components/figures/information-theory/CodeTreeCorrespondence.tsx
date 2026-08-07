import { ACCENT, SUPPORT, MUTED_OPACITY } from "../palette";

/**
 * The same binary tree read two ways: left as a yes/no question strategy
 * ("Is it A?" → "Is it B?" → "Is it C?"), right as a prefix code with 1/0
 * on the branches and codewords at the leaves. A bracket under the right
 * panel marks depth = codeword length. After Cover & Thomas §5.1 (redrawn).
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

type Pt = { x: number; y: number };

const N: Record<string, Pt> = {
  q1: { x: 60, y: 50 },
  A: { x: 135, y: 22 },
  q2: { x: 135, y: 78 },
  B: { x: 210, y: 50 },
  q3: { x: 210, y: 106 },
  C: { x: 285, y: 78 },
  D: { x: 285, y: 134 },
};

/** parent, child, is the child a leaf, yes-branch (up) or no-branch (down) */
const EDGES: { from: string; to: string; leaf: boolean; yes: boolean }[] = [
  { from: "q1", to: "A", leaf: true, yes: true },
  { from: "q1", to: "q2", leaf: false, yes: false },
  { from: "q2", to: "B", leaf: true, yes: true },
  { from: "q2", to: "q3", leaf: false, yes: false },
  { from: "q3", to: "C", leaf: true, yes: true },
  { from: "q3", to: "D", leaf: false, yes: false },
];

const QUESTIONS: Record<string, string> = {
  q1: "Is it A?",
  q2: "Is it B?",
  q3: "Is it C?",
};

const LEAVES: { id: string; p: string; code: string }[] = [
  { id: "A", p: ".5", code: "1" },
  { id: "B", p: ".25", code: "01" },
  { id: "C", p: ".15", code: "001" },
  { id: "D", p: ".1", code: "000" },
];

function TreePanel({ mode }: { mode: "questions" | "code" }) {
  const height = mode === "code" ? 202 : 160;
  return (
    <svg viewBox={`0 0 320 ${height}`} width="300" aria-hidden="true">
      {/* branches */}
      {EDGES.map((e) => {
        const p = N[e.from];
        const c = N[e.to];
        const isLeafEnd = e.leaf || (mode === "code" && (e.to === "D" ? true : false));
        const endX = e.leaf || e.to === "D" ? c.x - 3 : c.x;
        return (
          <line
            key={e.to}
            x1={p.x}
            y1={p.y}
            x2={isLeafEnd ? endX : c.x}
            y2={c.y}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeOpacity="0.75"
          />
        );
      })}
      {/* branch labels: yes/no words (blue) or bits (amber) */}
      {EDGES.map((e) => {
        const p = N[e.from];
        const c = N[e.to];
        const t = 0.45;
        const mx = p.x + t * (c.x - p.x);
        const my = p.y + t * (c.y - p.y);
        const lx = mx;
        const ly = e.yes ? my - 7 : my + 15;
        return mode === "questions" ? (
          <text
            key={`l${e.to}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="600"
            fill={SUPPORT}
            fontFamily="system-ui, sans-serif"
          >
            {e.yes ? "yes" : "no"}
          </text>
        ) : (
          <text
            key={`l${e.to}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            fontSize="12.5"
            fontWeight="700"
            fill={ACCENT}
            fontFamily={MONO}
          >
            {e.yes ? "1" : "0"}
          </text>
        );
      })}
      {/* internal nodes: dot + question (left panel only) */}
      {(["q1", "q2", "q3"] as const).map((q) => (
        <g key={q}>
          <circle cx={N[q].x} cy={N[q].y} r="3.2" fill="currentColor" />
          {mode === "questions" && (
            <text
              x={N[q].x - 8}
              y={N[q].y + 16}
              textAnchor="end"
              fontSize="11.5"
              fill="currentColor"
              fontFamily="system-ui, sans-serif"
            >
              {QUESTIONS[q]}
            </text>
          )}
        </g>
      ))}
      {/* leaves: letter + probability (left) or codeword (right) */}
      {LEAVES.map((l) => {
        const n = N[l.id];
        return (
          <g key={l.id} fontFamily="system-ui, sans-serif">
            <text
              x={n.x + 12}
              y={n.y + 4.5}
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill="currentColor"
            >
              {l.id}
            </text>
            {mode === "questions" ? (
              <text
                x={n.x + 12}
                y={n.y + 20}
                textAnchor="middle"
                fontSize="10.5"
                fill="currentColor"
                opacity={MUTED_OPACITY}
              >
                {l.p}
              </text>
            ) : (
              <text
                x={n.x + 12}
                y={n.y + 20}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={ACCENT}
                fontFamily={MONO}
              >
                {l.code}
              </text>
            )}
          </g>
        );
      })}
      {/* depth bracket (right panel only): root column → leaf-D column */}
      {mode === "code" && (
        <g fontFamily="system-ui, sans-serif">
          <path
            d="M60 162 L60 168 L285 168 L285 162"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
          <text x={172} y={188} textAnchor="middle" fontSize="11.5" fill="currentColor">
            <tspan fill={SUPPORT} fontWeight="600">
              3 questions
            </tspan>
            <tspan> = </tspan>
            <tspan fill={ACCENT} fontWeight="600">
              3 bits
            </tspan>
            <tspan>: depth = codeword length</tspan>
          </text>
        </g>
      )}
    </svg>
  );
}

export default function CodeTreeCorrespondence() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 760,
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>question strategy</div>
        <TreePanel mode="questions" />
      </div>
      {/* bold double-headed arrow: the two panels are the same object */}
      <div style={{ marginTop: 84, flexShrink: 0, textAlign: "center" }}>
        <svg viewBox="0 0 96 42" width="96" aria-hidden="true">
          <text
            x="48"
            y="12"
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="currentColor"
            fontFamily="system-ui, sans-serif"
          >
            same object
          </text>
          <line x1="10" y1="30" x2="86" y2="30" stroke="currentColor" strokeWidth="2.6" />
          <path d="M18 23 L9 30 L18 37" fill="none" stroke="currentColor" strokeWidth="2.6" />
          <path d="M78 23 L87 30 L78 37" fill="none" stroke="currentColor" strokeWidth="2.6" />
        </svg>
      </div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>prefix code</div>
        <TreePanel mode="code" />
      </div>
    </div>
  );
}
