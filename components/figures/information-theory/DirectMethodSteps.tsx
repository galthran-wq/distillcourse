import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * DirectMethodSteps — the "direct method" for spike-train mutual information,
 * built in three moves from one conditional table.
 *
 * FigureSequence, 3 frames. A fixed 2x2 table p(r|s) sits at the top left
 * (rows s0,s1; columns r=0,r=1; the two 1/8 "noise" entries in amber). To its
 * right, up to three equation slots fill in one per frame (inactive slots are
 * absent, not grayed):
 *   frame 1  H(R) = H(1/2) = 1 bit        — pool both rows (blue pooled bar)
 *   frame 2  H(R|S) = 0.544 bits          — average per-row entropies (amber)
 *   frame 3  I(S;R) = H(R) - H(R|S)
 *                   = 1 - 0.544 = 0.456 bits (boxed, amber)  — subtract
 *
 * Color roles: amber = the quantity each frame settles and the noise entries;
 * blue = the pooled H(R) bar; currentColor = the carried table and lines.
 * Recreated in house style (after Borst & Theunissen, Box 2), not copied.
 */

const A = ACCENT;
const BLUE = SUPPORT;
const LINE = "color-mix(in srgb, currentColor 30%, transparent)";
const HILITE = `color-mix(in srgb, ${ACCENT} 14%, transparent)`;

const CELL = 66;
const ROWH = 40;
const HEADW = 56;

// --- 2x2 conditional table -----------------------------------------------
function Cell({ value, amber }: { value: string; amber?: boolean }) {
  return (
    <div
      style={{
        width: CELL,
        height: ROWH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `1px solid ${LINE}`,
        boxSizing: "border-box",
      }}
    >
      <M tex={value} color={amber ? A : undefined} size={16} />
    </div>
  );
}

function RowHead({ tex }: { tex: string }) {
  return (
    <div
      style={{
        width: HEADW,
        height: ROWH,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 9,
        opacity: 0.7,
        boxSizing: "border-box",
      }}
    >
      <M tex={tex} size={13} />
    </div>
  );
}

function RowEntropy() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
      <span style={{ color: A, opacity: 0.7, fontSize: 13 }}>&#8594;</span>
      <M tex={String.raw`H\!\left(\tfrac18\right) = 0.544`} color={A} size={14} />
    </div>
  );
}

function Table({ frame }: { frame: number }) {
  const highlight = frame >= 2;
  const rowStyle = (on: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    borderRadius: 6,
    background: on && highlight ? HILITE : "transparent",
  });
  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* column headers */}
      <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
        <div style={{ width: HEADW }} />
        <div style={{ width: CELL, textAlign: "center", opacity: 0.7 }}>
          <M tex={String.raw`r = 0`} size={13} />
        </div>
        <div style={{ width: CELL, textAlign: "center", opacity: 0.7 }}>
          <M tex={String.raw`r = 1`} size={13} />
        </div>
      </div>

      {/* row s0 */}
      <div style={rowStyle(true)}>
        <RowHead tex={String.raw`s = 0`} />
        <Cell value={String.raw`\tfrac78`} />
        <Cell value={String.raw`\tfrac18`} amber />
        {highlight && <RowEntropy />}
      </div>

      {/* row s1 */}
      <div style={rowStyle(true)}>
        <RowHead tex={String.raw`s = 1`} />
        <Cell value={String.raw`\tfrac18`} amber />
        <Cell value={String.raw`\tfrac78`} />
        {highlight && <RowEntropy />}
      </div>

      {/* caption for the table */}
      <div style={{ opacity: 0.5, fontSize: 12, fontStyle: "italic", marginTop: 6, paddingLeft: HEADW }}>
        <M tex={String.raw`p(r\mid s)`} size={13} /> &nbsp;one spike, two stimuli
      </div>
    </div>
  );
}

// --- frame-1 brace collapsing to the pooled p(r) bar ---------------------
function PoolBrace() {
  const brace = "M 56 4 q 0 8 8 8 h 50 q 8 0 8 8 q 0 -8 8 -8 h 50 q 8 0 8 -8";
  return (
    <svg
      viewBox="0 0 200 78"
      width="200"
      style={{ fontFamily: "system-ui, sans-serif", marginTop: 8 }}
      aria-hidden="true"
    >
      {/* brace under the two response columns */}
      <path d={brace} fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.7" />
      {/* drop arrow from the tooth to the bar */}
      <line x1="122" y1="20" x2="122" y2="30" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <path d="M 122 33 L 118.5 27 L 125.5 27 Z" fill="currentColor" opacity="0.6" />
      {/* pooled p(r) bar: two equal halves -> uniform -> 1 bit */}
      <rect x="80" y="35" width="42" height="18" fill={BLUE} opacity="0.85" />
      <rect x="122" y="35" width="42" height="18" fill={BLUE} opacity="0.85" />
      <line x1="122" y1="35" x2="122" y2="53" stroke="#fff" strokeWidth="1.4" opacity="0.85" />
      <text x="101" y="44.5" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#fff">
        1/2
      </text>
      <text x="143" y="44.5" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#fff">
        1/2
      </text>
      <text x="101" y="66" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
        r = 0
      </text>
      <text x="143" y="66" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
        r = 1
      </text>
    </svg>
  );
}

// --- equation slots -------------------------------------------------------
const glossStyle: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 12.5,
  fontStyle: "italic",
  opacity: 0.6,
  marginTop: 5,
  maxWidth: 300,
  lineHeight: 1.35,
};

function Slot({
  eq,
  gloss,
  isNew,
  boxed,
}: {
  eq: string;
  gloss: string;
  isNew: boolean;
  boxed?: boolean;
}) {
  const math = <M tex={eq} color={isNew ? A : undefined} size={17} />;
  return (
    <div>
      {boxed ? (
        <span
          style={{
            display: "inline-block",
            border: `1.8px solid ${A}`,
            borderRadius: 6,
            padding: "7px 13px",
            whiteSpace: "nowrap",
          }}
        >
          {math}
        </span>
      ) : (
        math
      )}
      <div style={glossStyle}>{gloss}</div>
    </div>
  );
}

export default function DirectMethodSteps({ frame = 1 }: { frame?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 44,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
      }}
    >
      {/* left: table + frame-1 pooled bar */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <Table frame={frame} />
        <PoolBrace />
      </div>

      {/* right: equation slots, one per frame */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingTop: 6 }}>
        {frame >= 1 && (
          <Slot
            eq={String.raw`H(R) = H\!\left(\tfrac12\right) = 1 \text{ bit}`}
            isNew={frame === 1}
            gloss="pool both rows: the total response variety"
          />
        )}
        {frame >= 2 && (
          <Slot
            eq={String.raw`H(R\mid S) = 0.544 \text{ bits}`}
            isNew={frame === 2}
            gloss="average the per-stimulus rows: the leftover noise"
          />
        )}
        {frame >= 3 && (
          <Slot
            eq={String.raw`I(S;R) = H(R) - H(R\mid S) = 1 - 0.544 = 0.456 \text{ bits}`}
            isNew={frame === 3}
            boxed
            gloss="subtract: what the spike reveals"
          />
        )}
      </div>
    </div>
  );
}
