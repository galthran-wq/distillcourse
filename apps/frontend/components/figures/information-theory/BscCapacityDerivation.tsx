import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * BscCapacityDerivation — the binary symmetric channel capacity in three moves.
 *
 * FigureSequence, 3 frames. A fixed BSC(p) transition diagram sits at the top;
 * below it three equation slots fill in one per frame (inactive slots are
 * absent, not grayed):
 *   frame 1  H(Y|X) = H(p)      — fix the noise term
 *   frame 2  H(Y) <= 1          — cap the output term (1-bit ceiling)
 *   frame 3  I(X;Y) = H(Y) - H(Y|X) <= 1 - H(p) = C  — subtract to capacity
 *
 * Color roles: amber = the quantity each frame settles (the new line, and the
 * crossing "noise" arrows of the diagram); currentColor = carried-over lines
 * and the diagram; blue = the H(Y) fill bar in frame 2. Recreated in house
 * style (after Cover & Thomas, channel-capacity chapter), not copied.
 */

const A = ACCENT;
const BLUE = SUPPORT;

// --- BSC diagram geometry -------------------------------------------------
const NODE_R = 15;
const L0 = { x: 62, y: 32 };
const L1 = { x: 62, y: 100 };
const R0 = { x: 232, y: 32 };
const R1 = { x: 232, y: 100 };

type Pt = { x: number; y: number };

/** Trim a segment between two node centers to the circle boundaries. */
function edge(a: Pt, b: Pt, r: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: a.x + ux * r,
    y1: a.y + uy * r,
    x2: b.x - ux * r,
    y2: b.y - uy * r,
  };
}

function DiagArrow({ from, to, color }: { from: Pt; to: Pt; color: string }) {
  const { x1, y1, x2, y2 } = edge(from, to, NODE_R);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hl = 7;
  const hw = 3;
  const bx = x2 - hl * Math.cos(ang);
  const by = y2 - hl * Math.sin(ang);
  const px = -Math.sin(ang);
  const py = Math.cos(ang);
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth="1.3" opacity="0.75" />
      <path
        d={`M ${x2} ${y2} L ${bx + px * hw} ${by + py * hw} L ${bx - px * hw} ${by - py * hw} Z`}
        fill={color}
        opacity="0.75"
      />
    </g>
  );
}

function BitNode({ c, label }: { c: Pt; label: string }) {
  return (
    <g>
      <circle cx={c.x} cy={c.y} r={NODE_R} fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
      <text
        x={c.x}
        y={c.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fill="currentColor"
      >
        {label}
      </text>
    </g>
  );
}

function BscDiagram({ showRowEntropy }: { showRowEntropy: boolean }) {
  return (
    <svg
      viewBox="0 0 300 138"
      width="300"
      style={{ fontFamily: "system-ui, sans-serif" }}
      aria-hidden="true"
    >
      {/* straight (correct-transmission) arrows: currentColor */}
      <DiagArrow from={L0} to={R0} color="currentColor" />
      <DiagArrow from={L1} to={R1} color="currentColor" />
      {/* crossing (noise) arrows: amber */}
      <DiagArrow from={L0} to={R1} color={A} />
      <DiagArrow from={L1} to={R0} color={A} />

      {/* transition labels */}
      <text x="147" y="21" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.65">
        1&#8722;p
      </text>
      <text x="147" y="122" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.65">
        1&#8722;p
      </text>
      <text x="116" y="47" textAnchor="middle" fontSize="12" fill={A} fontWeight="600">
        p
      </text>
      <text x="116" y="90" textAnchor="middle" fontSize="12" fill={A} fontWeight="600">
        p
      </text>

      {/* nodes */}
      <BitNode c={L0} label="0" />
      <BitNode c={L1} label="1" />
      <BitNode c={R0} label="0" />
      <BitNode c={R1} label="1" />

      {/* frame-1 row-entropy annotation: each row's output has entropy H(p) */}
      {showRowEntropy && (
        <g fill={A}>
          <text x="254" y="32" textAnchor="start" dominantBaseline="central" fontSize="12.5" fontStyle="italic">
            H(p)
          </text>
          <text x="254" y="100" textAnchor="start" dominantBaseline="central" fontSize="12.5" fontStyle="italic">
            H(p)
          </text>
        </g>
      )}
    </svg>
  );
}

// --- output-entropy ceiling bar (frame 2) --------------------------------
function CeilingBar() {
  return (
    <svg viewBox="0 0 132 88" width="132" style={{ fontFamily: "system-ui, sans-serif" }} aria-hidden="true">
      {/* baseline */}
      <line x1="10" y1="62" x2="40" y2="62" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* fill to the 1-bit ceiling (equality at the uniform input) */}
      <rect x="13" y="10" width="22" height="52" fill={BLUE} opacity="0.8" />
      {/* dashed ceiling at 1 bit */}
      <line x1="8" y1="10" x2="44" y2="10" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
      <text x="48" y="14" textAnchor="start" fontSize="11" fill="currentColor" opacity="0.6">
        1 bit
      </text>
      <text x="24" y="80" textAnchor="middle" fontSize="12.5" fill={BLUE} fontWeight="600">
        H(Y)
      </text>
    </svg>
  );
}

// --- equation slots -------------------------------------------------------
const SLOT1 = String.raw`H(Y\mid X) = H(p)`;
const SLOT2 = String.raw`H(Y) \le 1`;
const SLOT3 = String.raw`I(X;Y) = H(Y) - H(Y\mid X) \le 1 - H(p) = C`;

const glossStyle: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 12.5,
  fontStyle: "italic",
  opacity: 0.6,
  marginTop: 5,
  maxWidth: 440,
  lineHeight: 1.35,
};

function Slot({
  eq,
  gloss,
  isNew,
  extra,
  below,
}: {
  eq: string;
  gloss: React.ReactNode;
  isNew: boolean;
  extra?: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <M tex={eq} color={isNew ? A : undefined} size={18} />
        {extra}
      </div>
      <div style={glossStyle}>{gloss}</div>
      {below && <div style={{ marginTop: 12 }}>{below}</div>}
    </div>
  );
}

export default function BscCapacityDerivation({ frame = 1 }: { frame?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 560,
      }}
    >
      <BscDiagram showRowEntropy={frame === 1} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 22,
          alignSelf: "stretch",
          paddingLeft: 8,
        }}
      >
        {frame >= 1 && (
          <Slot
            eq={SLOT1}
            isNew={frame === 1}
            gloss="every row has the same entropy — no input can change the noise"
          />
        )}
        {frame >= 2 && (
          <Slot
            eq={SLOT2}
            isNew={frame === 2}
            gloss="output is binary; equality exactly at the uniform input, where P(Y = 1) = 1/2"
            extra={<CeilingBar />}
          />
        )}
        {frame >= 3 && (
          <Slot
            eq={SLOT3}
            isNew={frame === 3}
            gloss="subtract; the bound is attained, so it is the capacity"
            below={
              <span
                style={{
                  display: "inline-block",
                  border: `1.8px solid ${A}`,
                  borderRadius: 6,
                  padding: "7px 14px",
                  whiteSpace: "nowrap",
                }}
              >
                <M tex={String.raw`C = 1 - H(p)`} color={A} size={18} />
              </span>
            }
          />
        )}
      </div>
    </div>
  );
}
