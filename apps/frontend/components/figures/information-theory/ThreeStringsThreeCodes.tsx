import { ACCENT, SUPPORT } from "../palette";

/**
 * ThreeStringsThreeCodes — a two-part description scheme judged on three
 * 24-bit strings, all on one shared "bits" axis (0..27).
 *
 * The scheme: first state the number of ones k (5 bits, ceil(log2 25)), then
 * an index into the C(24,k) strings with that count (log2 C(24,k) bits). The
 * count is the MODEL part (amber); the index is the DATA part (blue). A dashed
 * currentColor guide at 24 bits marks the literal fallback: just send the
 * string verbatim.
 *
 *   x1 = all zeros        k=0  → 5 + 0    = 5.0   (structure is total)
 *   x2 = fair-coin-like   k=12 → 5 + 21.4 = 26.4  (scheme loses; use 24 literal)
 *   x3 = biased string    k=6  → 5 + 17.0 = 22.0  (statistics alone beat 24)
 *
 * One idea: statistical regularity shortens a two-part description; its
 * absence makes the literal string the best description.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

// shared axis geometry
const TRACK_X = 196; // x pixel of 0 bits
const SCALE = 13; // px per bit
const bx = (b: number) => TRACK_X + b * SCALE;

const AXIS_Y = 200;
const GUIDE_X = bx(24);

const STR = {
  x1: "000000000000000000000000",
  x2: "101101001110100001011010",
  x3: "010000100001000010010001",
};

export default function ThreeStringsThreeCodes() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <svg
        viewBox="0 0 600 250"
        role="img"
        style={{
          width: "100%",
          height: "auto",
          color: "currentColor",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* column hint + guide label */}
        <text x={8} y={11} fontSize="10.5" fill="currentColor" opacity="0.5">
          24-bit string
        </text>
        <text
          x={GUIDE_X}
          y={11}
          textAnchor="middle"
          fontSize="10.5"
          fill="currentColor"
          opacity="0.7"
        >
          literal: 24 bits
        </text>

        {/* dashed literal-fallback guide, crossing every row */}
        <line
          x1={GUIDE_X}
          y1={16}
          x2={GUIDE_X}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.5"
        />

        {/* ── Row 1: all zeros — k=0, cost 5.0 ── */}
        <text
          x={8}
          y={30}
          fontFamily={MONO}
          fontSize="12"
          fill="currentColor"
          dominantBaseline="middle"
        >
          {STR.x1}
        </text>
        <rect
          x={bx(0)}
          y={20}
          width={bx(5) - bx(0)}
          height={20}
          rx={2}
          fill={ACCENT}
          opacity="0.9"
        />
        <text
          x={bx(5) + 8}
          y={30}
          dominantBaseline="middle"
          fontSize="12.5"
          fontWeight="600"
          fill="currentColor"
        >
          5.0
        </text>
        <text
          x={(bx(0) + bx(5)) / 2}
          y={53}
          textAnchor="middle"
          fontSize="11"
          fill={ACCENT}
        >
          count k=0 (5)
        </text>

        {/* ── Row 2: fair-coin-like — k=12, scheme 26.4 loses to literal 24 ── */}
        <text
          x={8}
          y={92}
          fontFamily={MONO}
          fontSize="12"
          fill="currentColor"
          dominantBaseline="middle"
        >
          {STR.x2}
        </text>
        {/* scheme bar (rejected): hollow outline, amber 5 + blue 21.4 = 26.4 */}
        <rect
          x={bx(0)}
          y={74}
          width={bx(5) - bx(0)}
          height={16}
          rx={2}
          fill={ACCENT}
          fillOpacity="0.12"
          stroke={ACCENT}
          strokeWidth="1.3"
        />
        <rect
          x={bx(5)}
          y={74}
          width={bx(26.4) - bx(5)}
          height={16}
          rx={2}
          fill={SUPPORT}
          fillOpacity="0.12"
          stroke={SUPPORT}
          strokeWidth="1.3"
        />
        <text
          x={(bx(0) + bx(5)) / 2}
          y={82}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill={ACCENT}
          opacity="0.9"
        >
          5
        </text>
        <text
          x={(bx(5) + bx(26.4)) / 2}
          y={82}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill={SUPPORT}
          opacity="0.9"
        >
          21.4
        </text>
        <text
          x={bx(26.4) + 6}
          y={82}
          dominantBaseline="middle"
          fontSize="11"
          fill="currentColor"
          opacity="0.5"
        >
          26.4
        </text>
        {/* literal bar (chosen): solid to 24 */}
        <rect
          x={bx(0)}
          y={94}
          width={bx(24) - bx(0)}
          height={16}
          rx={2}
          fill="currentColor"
          opacity="0.85"
        />
        <text
          x={bx(24) + 8}
          y={102}
          dominantBaseline="middle"
          fontSize="12.5"
          fontWeight="600"
          fill="currentColor"
        >
          24
        </text>
        <text
          x={bx(0)}
          y={125}
          fontSize="11"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.6"
        >
          scheme loses — send the literal 24 bits instead
        </text>

        {/* ── Row 3: biased string — k=6, cost 22.0 beats the literal ── */}
        <text
          x={8}
          y={156}
          fontFamily={MONO}
          fontSize="12"
          fill="currentColor"
          dominantBaseline="middle"
        >
          {STR.x3}
        </text>
        <rect
          x={bx(0)}
          y={146}
          width={bx(5) - bx(0)}
          height={20}
          rx={2}
          fill={ACCENT}
          opacity="0.9"
        />
        <rect
          x={bx(5)}
          y={146}
          width={bx(22) - bx(5)}
          height={20}
          rx={2}
          fill={SUPPORT}
          opacity="0.85"
        />
        <text
          x={bx(22) + 8}
          y={156}
          dominantBaseline="middle"
          fontSize="12.5"
          fontWeight="600"
          fill="currentColor"
        >
          22.0
        </text>
        <text
          x={(bx(0) + bx(5)) / 2}
          y={179}
          textAnchor="middle"
          fontSize="11"
          fill={ACCENT}
        >
          count k=6 (5)
        </text>
        <text
          x={(bx(5) + bx(22)) / 2}
          y={179}
          textAnchor="middle"
          fontSize="11"
          fill={SUPPORT}
        >
          index among C(24,6) (17.0)
        </text>

        {/* ── shared axis ── */}
        <line
          x1={bx(0)}
          y1={AXIS_Y}
          x2={bx(27)}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
        {[0, 5, 10, 15, 20, 24].map((t) => (
          <g key={t}>
            <line
              x1={bx(t)}
              y1={AXIS_Y}
              x2={bx(t)}
              y2={AXIS_Y + 5}
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <text
              x={bx(t)}
              y={AXIS_Y + 17}
              textAnchor="middle"
              fontSize="10.5"
              fill="currentColor"
              opacity="0.6"
            >
              {t}
            </text>
          </g>
        ))}
        <text
          x={(bx(0) + bx(27)) / 2}
          y={AXIS_Y + 34}
          textAnchor="middle"
          fontSize="11"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.6"
        >
          description length (bits)
        </text>
      </svg>
    </div>
  );
}
