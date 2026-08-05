import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * EntropyWall — the source coding theorem on the 90/10 coin, as a hard wall.
 *
 * A bits-per-symbol number line (0.4 … 1.1). At H ≈ 0.469 a thick blue
 * vertical wall is "the floor": the region to its left is hatched and
 * unreachable for any lossless code. To the right lies the band [H, H+1)
 * where single-symbol (n = 1) codes must land — Huffman/Shannon at cost
 * 1.000. Block codes push the per-symbol cost onto the wall from the right:
 * n = 2 → 0.645, n = 4 → 0.493, n = 6 → 0.470, converging to H.
 *
 * One idea: H is a hard wall — approached from the right, never crossed.
 */

const W = 640;
const HGT = 208;

const X0 = 60; // pixel for value 0.4
const PPB = 740; // px per bit
const xOf = (v: number) => X0 + (v - 0.4) * PPB;

const AXIS_Y = 150;
const BAND_TOP = 94;
const H_X = 0.469;
const WALL_X = xOf(H_X);

const TICKS = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1];

// block-code costs converging onto the wall from the right
const BLOCKS = [
  { n: 2, v: 0.645 },
  { n: 4, v: 0.493 },
  { n: 6, v: 0.47 },
];
const N1_X = xOf(1.0); // Huffman/Shannon single-symbol code lands at 1.000

export default function EntropyWall() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: HGT,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        <defs>
          <pattern
            id="ew-hatch"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.3" />
          </pattern>
          <linearGradient id="ew-band" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={ACCENT} stopOpacity="0.14" />
            <stop offset="0.8" stopColor={ACCENT} stopOpacity="0.14" />
            <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* allowed band [H, H+1): amber strip fading off-axis to the right */}
        <rect x={WALL_X} y={BAND_TOP} width={W - WALL_X} height={AXIS_Y - BAND_TOP} fill="url(#ew-band)" />
        <line
          x1={WALL_X}
          y1={BAND_TOP}
          x2={W - 6}
          y2={BAND_TOP}
          stroke={ACCENT}
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.55"
        />

        {/* forbidden region left of the wall: hatched + muted */}
        <rect x={X0} y={BAND_TOP} width={WALL_X - X0} height={AXIS_Y - BAND_TOP} fill="url(#ew-hatch)" />
        <rect x={X0} y={BAND_TOP} width={WALL_X - X0} height={AXIS_Y - BAND_TOP} fill="currentColor" opacity="0.05" />

        {/* axis with continuation arrow */}
        <line x1={X0} y1={AXIS_Y} x2={600} y2={AXIS_Y} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <path d="M600 150 l -7 -3 l 0 6 Z" fill="currentColor" opacity="0.6" />
        {TICKS.map((v) => (
          <g key={v}>
            <line x1={xOf(v)} y1={AXIS_Y} x2={xOf(v)} y2={AXIS_Y + 5} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <text x={xOf(v)} y={AXIS_Y + 18} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={598} y={AXIS_Y - 8} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.5" fontStyle="italic">
          bits/symbol
        </text>

        {/* THE WALL — thick blue vertical segment */}
        <line x1={WALL_X} y1={42} x2={WALL_X} y2={162} stroke={SUPPORT} strokeWidth="5" strokeLinecap="round" />
        {/* connector from wall label down to the wall top */}
        <line x1={WALL_X} y1={42} x2={148} y2={34} stroke={SUPPORT} strokeWidth="1" opacity="0.6" />

        {/* forbidden-region leader from top-left label into the hatch */}
        <line x1={72} y1={34} x2={85} y2={92} stroke="currentColor" strokeWidth="1" opacity="0.4" />

        {/* curved arrow: block codes push the cost onto the wall from the right */}
        <path
          d="M250 88 C 208 64 150 96 128 130"
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.6"
          opacity="0.9"
        />
        <path d="M128 132 l -1 -11 l 9 6 Z" fill={ACCENT} opacity="0.9" />

        {/* n = 1 marker (Huffman/Shannon) at cost 1.000 */}
        <circle cx={N1_X} cy={AXIS_Y} r="5" fill={ACCENT} />

        {/* block-code markers converging onto the wall */}
        {BLOCKS.map((b) => (
          <circle key={b.n} cx={xOf(b.v)} cy={AXIS_Y} r="5" fill={ACCENT} />
        ))}

        {/* leaders from clustered block markers down to their labels */}
        <line x1={xOf(0.47)} y1={AXIS_Y + 4} x2={92} y2={AXIS_Y + 30} stroke={ACCENT} strokeWidth="1" opacity="0.7" />
        <line x1={xOf(0.493)} y1={AXIS_Y + 4} x2={158} y2={AXIS_Y + 30} stroke={ACCENT} strokeWidth="1" opacity="0.7" />

        {/* block-marker labels (below axis) */}
        <text x={92} y={AXIS_Y + 42} textAnchor="middle" fontSize="12" fill={ACCENT} fontWeight="600">
          n = 6
        </text>
        <text x={158} y={AXIS_Y + 42} textAnchor="middle" fontSize="12" fill={ACCENT} fontWeight="600">
          n = 4
        </text>
        <text x={xOf(0.645)} y={AXIS_Y + 26} textAnchor="middle" fontSize="12" fill={ACCENT} fontWeight="600">
          n = 2
        </text>
        <text x={N1_X} y={AXIS_Y + 42} textAnchor="middle" fontSize="12" fill={ACCENT} fontWeight="600">
          Huffman / Shannon, n = 1
        </text>

        {/* curved-arrow caption */}
        <text x={214} y={60} textAnchor="middle" fontSize="12" fill={ACCENT} fontWeight="600">
          block codes → H
        </text>

        {/* forbidden-region caption (top-left) */}
        <text x={8} y={16} fontSize="11" fill="currentColor" opacity="0.55">
          unreachable for
        </text>
        <text x={8} y={30} fontSize="11" fill="currentColor" opacity="0.55">
          lossless codes
        </text>

        {/* band caption */}
        <text x={392} y={118} textAnchor="middle" fontSize="12" fill={ACCENT} opacity="0.95" fontStyle="italic">
          symbol codes land here
        </text>
        <text x={392} y={134} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.5" fontStyle="italic">
          the band [H, H+1)
        </text>
      </svg>

      {/* wall label (KaTeX) — blue, above the wall */}
      <div
        style={{
          position: "absolute",
          left: 148,
          top: 6,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          textAlign: "center",
          color: SUPPORT,
          fontWeight: 600,
          lineHeight: 1.15,
        }}
      >
        <M tex={String.raw`\textcolor{${SUPPORT}}{H(X) \approx 0.469}`} />
        <div style={{ fontSize: 12 }}>the floor</div>
      </div>
    </div>
  );
}
