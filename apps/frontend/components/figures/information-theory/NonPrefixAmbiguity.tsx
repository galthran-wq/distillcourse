import { ACCENT } from "../palette";

/**
 * A non-prefix code and the ambiguity it causes. Left: the code tree with
 * outcome B parked on the INTERNAL node "01" (amber), so its codeword 01 is
 * a prefix of the leaf codeword 011. Right: the received stream 011 with its
 * two valid parses — "C" alone, or "B then A". One idea: an outcome on an
 * internal node makes a concatenated stream ambiguous.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Leaf/outcome node: circle + letter, codeword in mono underneath (or beside). */
function Node({
  x,
  y,
  letter,
  accent = false,
}: {
  x: number;
  y: number;
  letter: string;
  accent?: boolean;
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={12}
        fill="none"
        stroke={accent ? ACCENT : "currentColor"}
        strokeWidth={accent ? 1.8 : 1.3}
      />
      <text
        x={x}
        y={y + 4.5}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill={accent ? ACCENT : "currentColor"}
      >
        {letter}
      </text>
    </g>
  );
}

function Bit({ x, y, bit }: { x: number; y: number; bit: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize="11" fontFamily={MONO} fill="currentColor" opacity="0.7">
      {bit}
    </text>
  );
}

export default function NonPrefixAmbiguity() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "16px 40px",
        maxWidth: 640,
      }}
    >
      {/* left: the broken code tree */}
      <svg viewBox="0 0 212 208" width="222" role="img" aria-label="Code tree with B on an internal node">
        {/* edges (trimmed to node boundaries) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none">
          <path d="M96.7 23.7 L58.3 66.3" />
          <path d="M104 23 L154.7 62.1" />
          <path d="M57.9 74.1 L82.5 109.3" />
          <path d="M82.5 130.7 L62.5 159.3" />
          <path d="M97.5 130.7 L117.5 159.3" />
        </g>
        {/* branch bits */}
        <Bit x={66} y={42} bit="0" />
        <Bit x={140} y={40} bit="1" />
        <Bit x={81} y={93} bit="1" />
        <Bit x={61} y={143} bit="0" />
        <Bit x={118} y={143} bit="1" />
        {/* internal nodes: root and "0" */}
        <circle cx={100} cy={20} r={3.5} fill="currentColor" opacity="0.7" />
        <circle cx={55} cy={70} r={3.5} fill="currentColor" opacity="0.7" />
        {/* outcomes */}
        <Node x={165} y={70} letter="A" />
        <Node x={90} y={120} letter="B" accent />
        <Node x={55} y={170} letter="D" />
        <Node x={125} y={170} letter="C" />
        {/* codewords, mono */}
        <text x={165} y={97} textAnchor="middle" fontSize="12.5" fontFamily={MONO} fill="currentColor">
          1
        </text>
        <text x={72} y={124} textAnchor="end" fontSize="12.5" fontFamily={MONO} fill={ACCENT}>
          01
        </text>
        <text x={55} y={197} textAnchor="middle" fontSize="12.5" fontFamily={MONO} fill="currentColor">
          010
        </text>
        <text x={125} y={197} textAnchor="middle" fontSize="12.5" fontFamily={MONO} fill="currentColor">
          011
        </text>
        {/* amber flag on B */}
        <text x={110} y={117} fontSize="11" fill={ACCENT}>
          outcome on an
        </text>
        <text x={110} y={130} fontSize="11" fill={ACCENT}>
          internal node
        </text>
      </svg>

      {/* right: the received stream and its two parses */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
        <svg viewBox="0 0 156 154" width="156" role="img" aria-label="Stream 011 with two parses">
          {/* parse 1: C spans all three digits */}
          <text x={82} y={34} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">
            C
          </text>
          <path d="M20 54 v-8 h124 v8" fill="none" stroke="currentColor" strokeWidth="1.2" />
          {/* the three digit cells */}
          {[
            { x: 20, d: "0" },
            { x: 64, d: "1" },
            { x: 108, d: "1" },
          ].map(({ x, d }) => (
            <g key={x}>
              <rect x={x} y={64} width={36} height={44} rx={4} fill="none" stroke="currentColor" strokeWidth="1.2" />
              <text x={x + 18} y={93} textAnchor="middle" fontSize="20" fontFamily={MONO} fill="currentColor">
                {d}
              </text>
            </g>
          ))}
          {/* parse 2: B (01, amber) then A (1) */}
          <path d="M20 118 v8 h80 v-8" fill="none" stroke={ACCENT} strokeWidth="1.4" />
          <text x={60} y={145} textAnchor="middle" fontSize="13" fontWeight="600" fill={ACCENT}>
            B
          </text>
          <path d="M108 118 v8 h36 v-8" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <text x={126} y={145} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">
            A
          </text>
        </svg>
        <div style={{ fontSize: 12.5, color: ACCENT, maxWidth: 160 }}>
          two valid parses —<br />
          the stream is ambiguous
        </div>
      </div>
    </div>
  );
}
