import { M } from "../M";
import { ACCENT, labelMuted } from "../palette";

/**
 * The grouping property, drawn as Shannon's fig. 6 recreated in house style:
 * the same three leaf probabilities (1/2, 1/3, 1/6) reached in one stage and
 * in two. Amber marks the second stage and its weight 1/2 — the subject;
 * everything shared between the panels stays currentColor so the eye reads
 * the leaves as identical. One idea: the same leaves, reached two ways, cost
 * the same total.
 * Inspiration: Shannon 1948, "A Mathematical Theory of Communication", fig. 6
 * (recreated, not copied).
 */

type Pt = { x: number; y: number };

const VB_W = 250;
const VB_H = 170;

const ROOT: Pt = { x: 26, y: 84 };
const LEAF_X = 176;
const LEAF_Y = [30, 84, 138];

const LEAVES: Pt[] = LEAF_Y.map((y) => ({ x: LEAF_X, y }));
const MID: Pt = { x: 104, y: (LEAF_Y[1] + LEAF_Y[2]) / 2 };

const LEAF_TEX = [
  String.raw`\tfrac{1}{2}`,
  String.raw`\tfrac{1}{3}`,
  String.raw`\tfrac{1}{6}`,
];

function Edge({ from, to, amber = false }: { from: Pt; to: Pt; amber?: boolean }) {
  return (
    <line
      x1={from.x}
      y1={from.y}
      x2={to.x}
      y2={to.y}
      stroke={amber ? ACCENT : "currentColor"}
      strokeWidth={amber ? 1.8 : 1.4}
      strokeOpacity={amber ? 1 : 0.75}
    />
  );
}

function Dot({ at, r = 3.2 }: { at: Pt; r?: number }) {
  return <circle cx={at.x} cy={at.y} r={r} fill="currentColor" />;
}

/** Branch label floated over the SVG so it can be real KaTeX. */
function BranchLabel({
  at,
  tex,
  amber,
}: {
  at: Pt;
  tex: string;
  amber?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: at.x,
        top: at.y,
        transform: "translate(-50%, -50%)",
        background: "var(--paper, transparent)",
        padding: "0 3px",
        lineHeight: 1,
      }}
    >
      <M tex={amber ? String.raw`\textcolor{${ACCENT}}{${tex}}` : tex} size={13} />
    </div>
  );
}

function LeafLabel({ at, tex }: { at: Pt; tex: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: at.x + 11,
        top: at.y,
        transform: "translateY(-50%)",
        lineHeight: 1,
      }}
    >
      <M tex={tex} size={15} />
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
      <div style={{ position: "relative", width: VB_W, height: VB_H }}>
        {children}
      </div>
    </div>
  );
}

export default function GroupingTree() {
  const half = String.raw`\tfrac{1}{2}`;
  const amberHalf = String.raw`\textcolor{${ACCENT}}{\tfrac{1}{2}}`;
  const amberH2 = String.raw`\textcolor{${ACCENT}}{H\!\left(\tfrac{2}{3}, \tfrac{1}{3}\right)}`;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 780 }}>
      <div
        style={{
          display: "flex",
          gap: 4,
          alignItems: "flex-start",
          flexWrap: "nowrap",
        }}
      >
        {/* ── LEFT: one stage — three branches straight to the three leaves ── */}
        <Panel title="one stage">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width={VB_W} aria-hidden="true">
            {LEAVES.map((l, i) => (
              <Edge key={`e${i}`} from={ROOT} to={l} />
            ))}
            <Dot at={ROOT} />
            {LEAVES.map((l, i) => (
              <Dot key={`d${i}`} at={l} />
            ))}
          </svg>
          {LEAVES.map((l, i) => (
            <LeafLabel key={`ll${i}`} at={l} tex={LEAF_TEX[i]} />
          ))}
        </Panel>

        {/* bold arrow joining the two panels */}
        <div
          style={{
            flexShrink: 0,
            alignSelf: "center",
            textAlign: "center",
            width: 76,
            paddingTop: 10,
          }}
        >
          <svg viewBox="0 0 76 24" width="76" aria-hidden="true">
            <line
              x1="8"
              y1="12"
              x2="62"
              y2="12"
              stroke="currentColor"
              strokeWidth="2.8"
            />
            <path
              d="M56 5 L67 12 L56 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
            />
          </svg>
          <div style={{ ...labelMuted, fontSize: 12, marginTop: 2 }}>regroup</div>
        </div>

        {/* ── RIGHT: two stages — same leaves via an intermediate node ─────── */}
        <Panel title="two stages">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width={VB_W} aria-hidden="true">
            <Edge from={ROOT} to={LEAVES[0]} amber />
            <Edge from={ROOT} to={MID} amber />
            <Edge from={MID} to={LEAVES[1]} amber />
            <Edge from={MID} to={LEAVES[2]} amber />
            <Dot at={ROOT} />
            <circle cx={MID.x} cy={MID.y} r="3.6" fill={ACCENT} />
            {LEAVES.map((l, i) => (
              <Dot key={`d${i}`} at={l} />
            ))}
          </svg>
          <BranchLabel
            at={{ x: (ROOT.x + LEAVES[0].x) / 2, y: (ROOT.y + LEAVES[0].y) / 2 - 9 }}
            tex={half}
            amber
          />
          <BranchLabel
            at={{ x: (ROOT.x + MID.x) / 2, y: (ROOT.y + MID.y) / 2 + 11 }}
            tex={half}
            amber
          />
          <BranchLabel
            at={{ x: (MID.x + LEAVES[1].x) / 2, y: (MID.y + LEAVES[1].y) / 2 - 10 }}
            tex={String.raw`\tfrac{2}{3}`}
            amber
          />
          <BranchLabel
            at={{ x: (MID.x + LEAVES[2].x) / 2, y: (MID.y + LEAVES[2].y) / 2 + 10 }}
            tex={String.raw`\tfrac{1}{3}`}
            amber
          />
          {LEAVES.map((l, i) => (
            <LeafLabel key={`ll${i}`} at={l} tex={LEAF_TEX[i]} />
          ))}
        </Panel>
      </div>

      {/* ── the identity, spanning the full width ────────────────────────── */}
      <div style={{ textAlign: "center", marginTop: 6 }}>
        <M
          display
          tex={String.raw`H\!\left(\tfrac{1}{2}, \tfrac{1}{3}, \tfrac{1}{6}\right) \;=\; H\!\left(\tfrac{1}{2}, \tfrac{1}{2}\right) \;+\; ${amberHalf}\, ${amberH2}`}
        />
        <div style={{ marginTop: -4 }}>
          <M
            tex={String.raw`1.459 \;=\; 1 \;+\; ${amberHalf}\,\textcolor{${ACCENT}}{(0.918)}`}
            size={14}
          />
        </div>
        <div style={{ ...labelMuted, marginTop: 8 }}>
          charged at half weight: the second question is only asked half the time
        </div>
      </div>
    </div>
  );
}
