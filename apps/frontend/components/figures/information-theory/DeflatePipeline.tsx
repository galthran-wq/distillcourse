import { ACCENT, SUPPORT } from "../palette";

/**
 * DeflatePipeline — DEFLATE drawn as this module's parts wired in series.
 *
 * Left to right, one data-flow chain:
 *   input bytes (a byte strip)
 *     -> "LZ77 matcher, 32 KB window" (amber: the parser stage)
 *       -> two token strips, "literals + lengths, 286 symbols" and
 *          "distances, 30 symbols" (amber: the matcher's own output)
 *         -> two "Huffman coder" boxes (blue: the entropy stage), one per
 *            stream
 *           -> "one bitstream" (a bit strip, currentColor)
 *
 * Under each stage, a bracket names the lesson that built it:
 * dictionary-coding under the matcher, huffman-by-hand + kraft-inequality
 * under the coders, and a wider bracket under the whole right half for this
 * lesson — how the two codes share one bitstream. A tally from the measured
 * 112 KB block closes the figure, its numbers colored by the stage that
 * produced them.
 *
 * Color roles: amber = the matcher and the two streams it emits; blue = the
 * entropy stage and its table cost; currentColor = the bytes in, the bits
 * out, and every structural rule.
 *
 * One idea: the format is the module's parts in series.
 */

const W = 700;
const H = 360;

// ── the spine (input, matcher, bitstream all sit on one centerline) ─────────
const MID = 114;

const INPUT = { x0: 4, x1: 88, cy: MID, h: 26 };
const BYTES = ["74", "68", "65", "20"]; // "the " — the bytes going in

const MATCH = { x0: 110, x1: 238, y0: 82, y1: 146 };
const MATCH_CX = (MATCH.x0 + MATCH.x1) / 2;

// ── the two lanes ──────────────────────────────────────────────────────────
const LANE_A = 60; // literals + lengths
const LANE_B = 168; // distances

const STRIP = { x0: 262, x1: 390, h: 22 };
const STRIP_CX = (STRIP.x0 + STRIP.x1) / 2;
const TOKENS = 12;
const TOK_W = 9;
const TOK_GAP =
  (STRIP.x1 - STRIP.x0 - TOKENS * TOK_W) / (TOKENS - 1); // ≈ 1.8

const HUFF = { x0: 411, x1: 545, h: 40 };
const HUFF_CX = (HUFF.x0 + HUFF.x1) / 2;

const BITS = { x0: 580, x1: 696, cy: MID, h: 26 };
const BITS_CX = (BITS.x0 + BITS.x1) / 2;

// ── ownership brackets ─────────────────────────────────────────────────────
const TIER1_Y = 222;
const TIER2_Y = 272;

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "system-ui, sans-serif";

function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = "currentColor",
  opacity = 1,
  width = 1.5,
  head = 6,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  opacity?: number;
  width?: number;
  head?: number;
}) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - head * Math.cos(ang);
  const by = y2 - head * Math.sin(ang);
  const perp = ang + Math.PI / 2;
  const hx = head * 0.6 * Math.cos(perp);
  const hy = head * 0.6 * Math.sin(perp);
  return (
    <g stroke={color} fill={color} opacity={opacity}>
      <line x1={x1} y1={y1} x2={bx} y2={by} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${bx + hx},${by + hy} ${bx - hx},${by - hy}`} stroke="none" />
    </g>
  );
}

/** Bracket whose ticks point up at the region it names. */
function Bracket({ x0, x1, y, tick = 6 }: { x0: number; x1: number; y: number; tick?: number }) {
  return (
    <path
      d={`M${x0} ${y - tick} L${x0} ${y} L${x1} ${y} L${x1} ${y - tick}`}
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.28"
      strokeWidth="1.1"
    />
  );
}

function TokenStrip({ cy }: { cy: number }) {
  return (
    <g>
      {Array.from({ length: TOKENS }, (_, i) => (
        <rect
          key={i}
          x={STRIP.x0 + i * (TOK_W + TOK_GAP)}
          y={cy - STRIP.h / 2}
          width={TOK_W}
          height={STRIP.h}
          rx="2.5"
          fill={ACCENT}
          fillOpacity="0.55"
          stroke={ACCENT}
          strokeOpacity="0.9"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

function HuffBox({ cy }: { cy: number }) {
  return (
    <g>
      <rect
        x={HUFF.x0}
        y={cy - HUFF.h / 2}
        width={HUFF.x1 - HUFF.x0}
        height={HUFF.h}
        rx="8"
        fill={SUPPORT}
        fillOpacity="0.1"
        stroke={SUPPORT}
        strokeWidth="1.8"
      />
      <text x={HUFF_CX} y={cy + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={SUPPORT}>
        Huffman coder
      </text>
    </g>
  );
}

export default function DeflatePipeline() {
  return (
    <div style={{ fontFamily: SANS, width: "100%", maxWidth: W }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" fontFamily={SANS} aria-hidden="true">
        {/* ── input bytes ── */}
        <text x={(INPUT.x0 + INPUT.x1) / 2} y={92} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="currentColor">
          input bytes
        </text>
        {BYTES.map((b, i) => {
          const w = (INPUT.x1 - INPUT.x0) / BYTES.length;
          return (
            <g key={b + i}>
              <rect
                x={INPUT.x0 + i * w}
                y={INPUT.cy - INPUT.h / 2}
                width={w}
                height={INPUT.h}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeWidth="1.1"
              />
              <text
                x={INPUT.x0 + i * w + w / 2}
                y={INPUT.cy + 3.5}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize="10"
                fill="currentColor"
                fillOpacity="0.7"
              >
                {b}
              </text>
            </g>
          );
        })}

        <Arrow x1={INPUT.x1 + 4} y1={MID} x2={MATCH.x0 - 2} y2={MID} opacity={0.75} />

        {/* ── stage 1: the LZ77 matcher (the subject) ── */}
        <rect
          x={MATCH.x0}
          y={MATCH.y0}
          width={MATCH.x1 - MATCH.x0}
          height={MATCH.y1 - MATCH.y0}
          rx="9"
          fill={ACCENT}
          fillOpacity="0.12"
          stroke={ACCENT}
          strokeWidth="2"
        />
        <text x={MATCH_CX} y={108} textAnchor="middle" fontSize="13.5" fontWeight="600" fill={ACCENT}>
          LZ77 matcher
        </text>
        <text x={MATCH_CX} y={126} textAnchor="middle" fontSize="11.5" fill={ACCENT} fillOpacity="0.85">
          32 KB window
        </text>

        {/* ── matcher splits into two streams ── */}
        <Arrow x1={MATCH.x1 + 2} y1={100} x2={STRIP.x0 - 3} y2={LANE_A + 4} color={ACCENT} opacity={0.9} />
        <Arrow x1={MATCH.x1 + 2} y1={128} x2={STRIP.x0 - 3} y2={LANE_B - 4} color={ACCENT} opacity={0.9} />

        {/* ── stage 2: the two symbol streams ── */}
        <TokenStrip cy={LANE_A} />
        <text x={STRIP_CX} y={28} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={ACCENT}>
          literals + lengths
        </text>
        <text x={STRIP_CX} y={42} textAnchor="middle" fontSize="11.5" fill="currentColor" fillOpacity="0.55">
          286 symbols
        </text>

        <TokenStrip cy={LANE_B} />
        <text x={STRIP_CX} y={197} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={ACCENT}>
          distances
        </text>
        <text x={STRIP_CX} y={211} textAnchor="middle" fontSize="11.5" fill="currentColor" fillOpacity="0.55">
          30 symbols
        </text>

        {/* ── streams into their own coders ── */}
        <Arrow x1={STRIP.x1 + 4} y1={LANE_A} x2={HUFF.x0 - 2} y2={LANE_A} color={ACCENT} opacity={0.9} />
        <Arrow x1={STRIP.x1 + 4} y1={LANE_B} x2={HUFF.x0 - 2} y2={LANE_B} color={ACCENT} opacity={0.9} />

        {/* ── stage 3: two Huffman coders ── */}
        <HuffBox cy={LANE_A} />
        <HuffBox cy={LANE_B} />

        {/* ── they merge into one bitstream ── */}
        <Arrow x1={HUFF.x1 + 3} y1={LANE_A} x2={BITS.x0 - 3} y2={BITS.cy - 10} color={SUPPORT} opacity={0.9} />
        <Arrow x1={HUFF.x1 + 3} y1={LANE_B} x2={BITS.x0 - 3} y2={BITS.cy + 10} color={SUPPORT} opacity={0.9} />

        <text x={BITS_CX} y={92} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="currentColor">
          one bitstream
        </text>
        <rect
          x={BITS.x0}
          y={BITS.cy - BITS.h / 2}
          width={BITS.x1 - BITS.x0}
          height={BITS.h}
          rx="6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.55"
          strokeWidth="1.6"
        />
        <text
          x={BITS_CX}
          y={BITS.cy + 3.5}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="10"
          fill="currentColor"
          fillOpacity="0.8"
          letterSpacing="0.4"
        >
          01101101 00101011
        </text>

        {/* ── who built each stage ── */}
        <Bracket x0={MATCH.x0} x1={MATCH.x1} y={TIER1_Y} />
        <text x={MATCH_CX} y={TIER1_Y + 16} textAnchor="middle" fontFamily={MONO} fontSize="11" fill="currentColor" fillOpacity="0.55">
          dictionary-coding
        </text>

        <Bracket x0={HUFF.x0} x1={HUFF.x1} y={TIER1_Y} />
        <text x={HUFF_CX} y={TIER1_Y + 16} textAnchor="middle" fontFamily={MONO} fontSize="11" fill="currentColor" fillOpacity="0.55">
          huffman-by-hand
        </text>
        <text x={HUFF_CX} y={TIER1_Y + 30} textAnchor="middle" fontFamily={MONO} fontSize="11" fill="currentColor" fillOpacity="0.55">
          + kraft-inequality
        </text>

        <Bracket x0={STRIP.x0} x1={BITS.x1} y={TIER2_Y} tick={7} />
        <text x={(STRIP.x0 + BITS.x1) / 2} y={TIER2_Y + 17} textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity="0.75">
          <tspan fontWeight="600">this lesson:</tspan> how they share one bitstream
        </text>

        {/* ── the tally, colored by the stage that produced each number ── */}
        <line x1={4} y1={304} x2={W - 4} y2={304} stroke="currentColor" strokeOpacity="0.13" strokeWidth="1" />
        <text x={W / 2} y={320} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.5">
          measured: 112,425 bytes of RFC 8878 text, one DEFLATE block
        </text>
        <text x={W / 2} y={342} textAnchor="middle" fontSize="12" fill="currentColor">
          <tspan fill={ACCENT}>5,374 literals at 7.1 bits</tspan>
          <tspan fillOpacity="0.4">{"  ·  "}</tspan>
          <tspan fill={ACCENT}>8,776 matches at 18.9 bits</tspan>
          <tspan fillOpacity="0.4">{"  ·  "}</tspan>
          <tspan fill={SUPPORT}>644 bits of table</tspan>
          <tspan fontWeight="600">{" = 25,586 bytes"}</tspan>
        </text>
      </svg>
    </div>
  );
}
