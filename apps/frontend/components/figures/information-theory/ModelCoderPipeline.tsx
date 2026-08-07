import { ACCENT, SUPPORT } from "../palette";
import { M } from "../M";

/**
 * ModelCoderPipeline — the DEFLATE architecture with the statistical stage
 * swapped for a transformer. Deliberately mirrors DeflatePipeline's visual
 * grammar (same spine, same ownership brackets, same closing tally) so the
 * reader recognises the architecture and sees only what changed.
 *
 * Left to right, one data-flow chain on a single centerline:
 *   input bytes (a byte strip, currentColor)
 *     -> "tokenizer, 32K vocabulary" (blue: a fixed code)
 *       -> tokens (a shorter strip of wider cells, blue)
 *         -> "transformer, fixed 2048-byte context" (amber: the subject)
 *           -> next-token probabilities (a small bar chart, amber)
 *             -> "arithmetic coder" (blue: the second fixed code)
 *               -> one bitstream per 2048-byte chunk (a bit strip)
 *
 * Under each box, a bracket names the lesson that built it; a wider bracket
 * under the whole chain claims the wiring for this lesson. The tally closes
 * with the cost formula, each term in the colour of the stage that pays it.
 *
 * Color roles: amber = the model; blue = the two fixed codes (tokenizer and
 * arithmetic coder); currentColor = the bytes in, the bits out, the arrows
 * and every structural rule.
 *
 * One idea: the same two-stage architecture as DEFLATE, statistical model
 * replaced.
 */

const W = 700;
const H = 262;

// ── the spine ──────────────────────────────────────────────────────────────
const MID = 120;

const INPUT = { x0: 8, x1: 80, h: 26 };
const BYTES = ["54", "68", "65", "20", "63", "61"]; // "The ca" — bytes going in

const TOKZ = { x0: 94, x1: 192 };
const TOKZ_CX = (TOKZ.x0 + TOKZ.x1) / 2;

const TOKS = { x0: 206, x1: 257, h: 26 };
const TOKS_CX = (TOKS.x0 + TOKS.x1) / 2;
const N_TOK = 3;
const TOK_W = 15;
const TOK_GAP = (TOKS.x1 - TOKS.x0 - N_TOK * TOK_W) / (N_TOK - 1);

const MODEL = { x0: 271, x1: 387 };
const MODEL_CX = (MODEL.x0 + MODEL.x1) / 2;

const BARS = { x0: 401, x1: 457, base: 138, top: 100 };
const BARS_CX = (BARS.x0 + BARS.x1) / 2;
const PROBS = [0.34, 0.23, 0.15, 0.1, 0.06, 0.03];
const BAR_W = 7;
const BAR_GAP = (BARS.x1 - BARS.x0 - PROBS.length * BAR_W) / (PROBS.length - 1);

const CODER = { x0: 469, x1: 585 };
const CODER_CX = (CODER.x0 + CODER.x1) / 2;

const BITS = { x0: 595, x1: 685, h: 26 };
const BITS_CX = (BITS.x0 + BITS.x1) / 2;

const BOX = { y0: 90, y1: 150 };

// ── ownership brackets ─────────────────────────────────────────────────────
const TIER1_Y = 180;
const TIER2_Y = 234;

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "system-ui, sans-serif";

function Arrow({
  x1,
  x2,
  y = MID,
  head = 6,
}: {
  x1: number;
  x2: number;
  y?: number;
  head?: number;
}) {
  const bx = x2 - head;
  return (
    <g stroke="currentColor" fill="currentColor" opacity={0.7}>
      <line x1={x1} y1={y} x2={bx} y2={y} strokeWidth="1.5" strokeLinecap="round" />
      <polygon
        points={`${x2},${y} ${bx},${y - head * 0.6} ${bx},${y + head * 0.6}`}
        stroke="none"
      />
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

/** A stage box: rounded rect + centered lines, all in one role colour. */
function Stage({
  x0,
  x1,
  color,
  lines,
}: {
  x0: number;
  x1: number;
  color: string;
  lines: { text: string; y: number; size: number; weight?: number; opacity?: number }[];
}) {
  return (
    <g>
      <rect
        x={x0}
        y={BOX.y0}
        width={x1 - x0}
        height={BOX.y1 - BOX.y0}
        rx="9"
        fill={color}
        fillOpacity={color === ACCENT ? 0.12 : 0.1}
        stroke={color}
        strokeWidth={color === ACCENT ? 2 : 1.8}
      />
      {lines.map((l) => (
        <text
          key={l.text}
          x={(x0 + x1) / 2}
          y={l.y}
          textAnchor="middle"
          fontSize={l.size}
          fontWeight={l.weight}
          fill={color}
          fillOpacity={l.opacity ?? 1}
        >
          {l.text}
        </text>
      ))}
    </g>
  );
}

export default function ModelCoderPipeline() {
  return (
    <div style={{ fontFamily: SANS, width: "100%", maxWidth: W }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" fontFamily={SANS} aria-hidden="true">
        {/* ── input bytes ── */}
        <text x={(INPUT.x0 + INPUT.x1) / 2} y={62} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="currentColor">
          input bytes
        </text>
        <text x={(INPUT.x0 + INPUT.x1) / 2} y={76} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.55">
          2048 per chunk
        </text>
        {BYTES.map((b, i) => {
          const w = (INPUT.x1 - INPUT.x0) / BYTES.length;
          return (
            <g key={b + i}>
              <rect
                x={INPUT.x0 + i * w}
                y={MID - INPUT.h / 2}
                width={w}
                height={INPUT.h}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.45"
                strokeWidth="1.1"
              />
              <text
                x={INPUT.x0 + i * w + w / 2}
                y={MID + 3}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize="8"
                fill="currentColor"
                fillOpacity="0.7"
              >
                {b}
              </text>
            </g>
          );
        })}

        <Arrow x1={INPUT.x1 + 4} x2={TOKZ.x0 - 2} />

        {/* ── stage 1: the tokenizer (a fixed code) ── */}
        <Stage
          x0={TOKZ.x0}
          x1={TOKZ.x1}
          color={SUPPORT}
          lines={[
            { text: "tokenizer", y: 114, size: 13, weight: 600 },
            { text: "32K vocabulary", y: 132, size: 11.5, opacity: 0.85 },
          ]}
        />

        <Arrow x1={TOKZ.x1 + 2} x2={TOKS.x0 - 4} />

        {/* ── tokens: fewer, wider cells ── */}
        <text x={TOKS_CX} y={62} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={SUPPORT}>
          tokens
        </text>
        <text x={TOKS_CX} y={76} textAnchor="middle" fontSize="11" fill="currentColor" fillOpacity="0.55">
          fewer, wider
        </text>
        {Array.from({ length: N_TOK }, (_, i) => (
          <rect
            key={i}
            x={TOKS.x0 + i * (TOK_W + TOK_GAP)}
            y={MID - TOKS.h / 2}
            width={TOK_W}
            height={TOKS.h}
            rx="2.5"
            fill={SUPPORT}
            fillOpacity="0.5"
            stroke={SUPPORT}
            strokeOpacity="0.9"
            strokeWidth="1"
          />
        ))}

        <Arrow x1={TOKS.x1 + 4} x2={MODEL.x0 - 2} />

        {/* ── stage 2: the transformer (the subject) ── */}
        <Stage
          x0={MODEL.x0}
          x1={MODEL.x1}
          color={ACCENT}
          lines={[
            { text: "transformer", y: 110, size: 13.5, weight: 600 },
            { text: "fixed 2048-byte", y: 127, size: 11.5, opacity: 0.85 },
            { text: "context", y: 141, size: 11.5, opacity: 0.85 },
          ]}
        />

        <Arrow x1={MODEL.x1 + 2} x2={BARS.x0 - 4} />

        {/* ── next-token probabilities ── */}
        <text x={BARS_CX} y={62} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={ACCENT}>
          next-token
        </text>
        <text x={BARS_CX} y={76} textAnchor="middle" fontSize="11" fill={ACCENT} fillOpacity="0.8">
          probabilities
        </text>
        {PROBS.map((p, i) => {
          const h = (p / PROBS[0]) * (BARS.base - BARS.top);
          return (
            <rect
              key={i}
              x={BARS.x0 + i * (BAR_W + BAR_GAP)}
              y={BARS.base - h}
              width={BAR_W}
              height={h}
              rx="1.5"
              fill={ACCENT}
              fillOpacity="0.75"
            />
          );
        })}
        <line
          x1={BARS.x0 - 3}
          y1={BARS.base}
          x2={BARS.x1 + 3}
          y2={BARS.base}
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="1"
        />

        <Arrow x1={BARS.x1 + 6} x2={CODER.x0 - 2} />

        {/* ── stage 3: the arithmetic coder (the second fixed code) ── */}
        <Stage
          x0={CODER.x0}
          x1={CODER.x1}
          color={SUPPORT}
          lines={[
            { text: "arithmetic", y: 114, size: 13, weight: 600 },
            { text: "coder", y: 132, size: 13, weight: 600 },
          ]}
        />

        <Arrow x1={CODER.x1 + 2} x2={BITS.x0 - 4} />

        {/* ── out: one bitstream per chunk ── */}
        <text x={BITS_CX} y={62} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="currentColor">
          one bitstream
        </text>
        <text x={BITS_CX} y={76} textAnchor="middle" fontSize="10" fill="currentColor" fillOpacity="0.55">
          per 2048-byte chunk
        </text>
        <rect
          x={BITS.x0}
          y={MID - BITS.h / 2}
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
          y={MID + 3.5}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="9.5"
          fill="currentColor"
          fillOpacity="0.8"
          letterSpacing="0.3"
        >
          011011010010
        </text>

        {/* ── who built each stage ── */}
        <Bracket x0={TOKZ.x0} x1={TOKZ.x1} y={TIER1_Y} />
        <text x={TOKZ_CX} y={TIER1_Y + 16} textAnchor="middle" fontFamily={MONO} fontSize="11" fill="currentColor" fillOpacity="0.55">
          dictionary-coding
        </text>
        <text x={TOKZ_CX} y={TIER1_Y + 30} textAnchor="middle" fontSize="10.5" fill="currentColor" fillOpacity="0.5">
          a code, learned once
        </text>

        <Bracket x0={MODEL.x0} x1={MODEL.x1} y={TIER1_Y} />
        <text x={MODEL_CX} y={TIER1_Y + 16} textAnchor="middle" fontFamily={MONO} fontSize="11" fill="currentColor" fillOpacity="0.55">
          cross-entropy-loss
        </text>
        <text x={MODEL_CX} y={TIER1_Y + 30} textAnchor="middle" fontFamily={MONO} fontSize="11" fill="currentColor" fillOpacity="0.55">
          + compression-is-prediction
        </text>

        <Bracket x0={CODER.x0} x1={CODER.x1} y={TIER1_Y} />
        <text x={CODER_CX} y={TIER1_Y + 16} textAnchor="middle" fontFamily={MONO} fontSize="11" fill="currentColor" fillOpacity="0.55">
          arithmetic-coding
        </text>

        <Bracket x0={TOKZ.x0} x1={BITS.x1} y={TIER2_Y} tick={7} />
        <text x={(TOKZ.x0 + BITS.x1) / 2} y={TIER2_Y + 17} textAnchor="middle" fontSize="12" fill="currentColor" fillOpacity="0.75">
          <tspan fontWeight="600">this lesson:</tspan> the units that make the stages add up
        </text>
      </svg>

      {/* ── the tally: each term in the colour of the stage that pays it ── */}
      <div style={{ height: 1, background: "currentColor", opacity: 0.13, marginTop: 6 }} />
      <div style={{ paddingTop: 12, textAlign: "center" }}>
        <M
          tex={`\\text{cost} \\;=\\; \\textcolor{${ACCENT}}{\\sum_{t} -\\log_2 q(\\text{token}_t)} \\;+\\; \\textcolor{${SUPPORT}}{2 \\text{ bits per chunk}}`}
          size={15}
        />
      </div>
    </div>
  );
}
