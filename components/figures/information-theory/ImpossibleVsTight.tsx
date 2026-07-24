import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * Kraft inequality as a budget on a binary tree, shown as two near-identical
 * panels (playbook comparison, rule 8). Left: lengths 1,2,2,2 overspend the
 * budget (sum 1.25 > 1) — the length-1 codeword's claim (blue) swallows both
 * depth-2 nodes below it, leaving only two free nodes for three length-2
 * codewords (amber), so the third has no home. Right: lengths 1,2,3,3 tile
 * the tree exactly (sum 1). One idea: overspending forces two codewords into
 * one subtree.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const WHITE = "#fff";

type Pt = { x: number; y: number };

/** Small filled circle for an internal (non-codeword) node. */
function Dot({ p }: { p: Pt }) {
  return <circle cx={p.x} cy={p.y} r="2.6" fill="currentColor" opacity="0.6" />;
}

/** Tree edge; optional bit label placed near the parent end. */
function Edge({ a, b, bit }: { a: Pt; b: Pt; bit?: string }) {
  const t = 0.42;
  const mx = a.x + t * (b.x - a.x);
  const my = a.y + t * (b.y - a.y);
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.55" />
      {bit && (
        <text
          x={mx + (b.x > a.x ? 6 : -6)}
          y={my + 1}
          textAnchor={b.x > a.x ? "start" : "end"}
          fontSize="10"
          fill="currentColor"
          opacity="0.45"
          fontFamily={MONO}
        >
          {bit}
        </text>
      )}
    </g>
  );
}

/** A claimed-subtree cone from a codeword node down to a baseline segment. */
function Cone({ apex, x0, x1, y, color }: { apex: Pt; x0: number; x1: number; y: number; color: string }) {
  return (
    <polygon
      points={`${apex.x},${apex.y + 3} ${x0},${y} ${x1},${y}`}
      fill={color}
      opacity="0.15"
      stroke={color}
      strokeWidth="1"
      strokeOpacity="0.35"
    />
  );
}

/** Rounded-rect codeword pill. */
function Pill({ p, text, color, dashed = false }: { p: Pt; text: string; color: string; dashed?: boolean }) {
  const w = Math.max(22, text.length * 8.5 + 12);
  const h = 19;
  return (
    <g>
      <rect
        x={p.x - w / 2}
        y={p.y - h / 2}
        width={w}
        height={h}
        rx={9}
        fill={dashed ? "none" : color}
        stroke={color}
        strokeWidth={dashed ? 1.4 : 0}
        strokeDasharray={dashed ? "3 3" : undefined}
      />
      <text
        x={p.x}
        y={p.y + 4}
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill={dashed ? color : WHITE}
        fontFamily={MONO}
      >
        {text}
      </text>
    </g>
  );
}

/** Muted marker for a leaf node already swallowed by another claim. */
function Ghost({ p, label }: { p: Pt; label: string }) {
  return (
    <g opacity="0.5">
      <circle cx={p.x} cy={p.y} r="2.6" fill="currentColor" />
      <text x={p.x} y={p.y + 17} textAnchor="middle" fontSize="10" fill="currentColor" fontFamily={MONO}>
        {label}
      </text>
    </g>
  );
}

function LeftPanel() {
  const root: Pt = { x: 150, y: 28 };
  const n0: Pt = { x: 95, y: 90 };
  const n1: Pt = { x: 225, y: 90 };
  const L00: Pt = { x: 60, y: 152 };
  const L01: Pt = { x: 130, y: 152 };
  const L10: Pt = { x: 190, y: 152 };
  const L11: Pt = { x: 260, y: 152 };
  const homeless: Pt = { x: 58, y: 192 };
  return (
    <svg viewBox="0 0 300 214" width="300" aria-hidden="true">
      {/* blue claim of the length-1 codeword swallows the whole left subtree */}
      <Cone apex={n0} x0={42} x1={150} y={162} color={SUPPORT} />
      {/* edges */}
      <Edge a={root} b={n0} bit="0" />
      <Edge a={root} b={n1} bit="1" />
      <Edge a={n0} b={L00} />
      <Edge a={n0} b={L01} />
      <Edge a={n1} b={L10} bit="0" />
      <Edge a={n1} b={L11} bit="1" />
      {/* internal node + swallowed leaves */}
      <Dot p={n1} />
      <Ghost p={L00} label="00" />
      <Ghost p={L01} label="01" />
      {/* codeword pills */}
      <Pill p={n0} text="0" color={SUPPORT} />
      <Pill p={L10} text="10" color={ACCENT} />
      <Pill p={L11} text="11" color={ACCENT} />
      {/* the third length-2 codeword: nowhere to go */}
      <Pill p={homeless} text="?" color={ACCENT} dashed />
      {/* struck-through placement arrow toward the already-claimed node 01 */}
      <g stroke={ACCENT} strokeWidth="1.4" fill="none">
        <path d="M74 184 L120 160" strokeOpacity="0.85" />
        <path d="M114 158 L122 156 L120 164" strokeOpacity="0.85" />
        {/* strike */}
        <line x1="90" y1="164" x2="104" y2="178" strokeWidth="1.8" />
        <line x1="104" y1="164" x2="90" y2="178" strokeWidth="1.8" />
      </g>
      <text x="150" y="200" textAnchor="middle" fontSize="11.5" fontWeight="600" fill={ACCENT}>
        no free node
      </text>
    </svg>
  );
}

function RightPanel() {
  const root: Pt = { x: 155, y: 26 };
  const n0: Pt = { x: 75, y: 82 };
  const n1: Pt = { x: 235, y: 82 };
  const n10: Pt = { x: 185, y: 138 };
  const n11: Pt = { x: 285, y: 138 };
  const n110: Pt = { x: 265, y: 186 };
  const n111: Pt = { x: 305, y: 186 };
  const base = 206;
  const seg: [number, number, string][] = [
    [28, 150, SUPPORT],
    [150, 235, ACCENT],
    [235, 278, ACCENT],
    [278, 320, ACCENT],
  ];
  return (
    <svg viewBox="0 0 330 230" width="330" aria-hidden="true">
      {/* claims tile the baseline exactly, no gaps or overlaps */}
      <Cone apex={n0} x0={28} x1={150} y={base} color={SUPPORT} />
      <Cone apex={n10} x0={150} x1={235} y={base} color={ACCENT} />
      <Cone apex={n110} x0={235} x1={278} y={base} color={ACCENT} />
      <Cone apex={n111} x0={278} x1={320} y={base} color={ACCENT} />
      {/* contiguous claim band on the baseline: the tiling made explicit */}
      {seg.map(([x0, x1, c], i) => (
        <rect key={i} x={x0} y={base - 6} width={x1 - x0} height={6} fill={c} opacity="0.55" />
      ))}
      {[150, 235, 278].map((x) => (
        <line key={x} x1={x} y1={base - 6} x2={x} y2={base} stroke="#fff" strokeWidth="1" />
      ))}
      <line x1="28" y1={base} x2="320" y2={base} stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
      {/* edges */}
      <Edge a={root} b={n0} bit="0" />
      <Edge a={root} b={n1} bit="1" />
      <Edge a={n1} b={n10} bit="0" />
      <Edge a={n1} b={n11} bit="1" />
      <Edge a={n11} b={n110} bit="0" />
      <Edge a={n11} b={n111} bit="1" />
      {/* internal nodes */}
      <Dot p={n1} />
      <Dot p={n11} />
      {/* codeword pills */}
      <Pill p={n0} text="0" color={SUPPORT} />
      <Pill p={n10} text="10" color={ACCENT} />
      <Pill p={n110} text="110" color={ACCENT} />
      <Pill p={n111} text="111" color={ACCENT} />
      <text x="174" y="224" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="currentColor" opacity="0.7">
        claims tile the tree exactly
      </text>
    </svg>
  );
}

function Sum({ tex }: { tex: string }) {
  return (
    <div style={{ marginTop: 6 }}>
      <M tex={tex} size={13} />
    </div>
  );
}

export default function ImpossibleVsTight() {
  const A = (x: string) => String.raw`\textcolor{${ACCENT}}{${x}}`;
  const leftSum = String.raw`\tfrac12 + \tfrac14 + \tfrac14 + \tfrac14 = ${A(String.raw`\mathbf{1.25}`)} ${A(">")} 1`;
  const rightSum = String.raw`\tfrac12 + \tfrac14 + \tfrac18 + \tfrac18 = \mathbf{1.00}`;
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 760 }}>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            lengths 1, 2, 2, 2 — sum <span style={{ color: ACCENT }}>1.25</span>
          </div>
          <LeftPanel />
          <Sum tex={leftSum} />
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>lengths 1, 2, 3, 3 — sum 1</div>
          <RightPanel />
          <Sum tex={rightSum} />
        </div>
      </div>
      <div style={{ ...labelMuted, marginTop: 12 }}>
        overspending the budget forces two codewords into one subtree
      </div>
    </div>
  );
}
