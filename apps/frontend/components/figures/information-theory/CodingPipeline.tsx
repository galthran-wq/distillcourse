import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * CodingPipeline — the channel-coding chain in one row.
 *
 * message W -> encoder -> codeword X^n (a strip of n blue cells) -> channel
 * p(y|x), used n times -> received Y^n (the same strip, a couple of cells
 * flipped to amber = the noise) -> decoder -> estimate W-hat. A brace under
 * the codeword marks the n channel uses; the rate line R = log2 M / n counts
 * message bits per channel use.
 *
 * Color roles: blue (SUPPORT) = the message-bearing codeword cells; amber
 * (ACCENT) = the noise corruptions (flipped positions in Y^n); currentColor =
 * boxes, arrows, and labels.
 *
 * One idea: a code spreads one message over many channel uses, so the decoder
 * can average the noise away.
 *
 * Recreated after MacKay, Information Theory, Inference and Learning
 * Algorithms §9.1 (big-picture diagram; idea only, redrawn in house style).
 */

const N = 7; // codeword length shown
const CELL_W = 15;
const CELL_H = 22;
const STRIP_W = N * CELL_W;

type Cell = { bit?: string; amber?: boolean };

const CODEWORD: Cell[] = [
  { bit: "1" },
  {},
  { bit: "1" },
  {},
  { bit: "0" },
  {},
  { bit: "1" },
];

const RECEIVED: Cell[] = [
  { bit: "1" },
  {},
  { bit: "0", amber: true }, // flipped 1 -> 0
  {},
  { bit: "0" },
  { amber: true }, // flipped (blank)
  { bit: "1" },
];

function Arrow() {
  return (
    <svg
      width="24"
      height="10"
      viewBox="0 0 24 10"
      aria-hidden="true"
      style={{ flex: "none", opacity: 0.7 }}
    >
      <line x1="0" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M24 5 l-7 -3.4 l0 6.8 Z" fill="currentColor" />
    </svg>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        border: "1.4px solid currentColor",
        borderRadius: 8,
        padding: "7px 11px",
        lineHeight: 1.25,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

function Strip({
  cells,
  topLabel,
  brace,
}: {
  cells: Cell[];
  topLabel: React.ReactNode;
  brace?: boolean;
}) {
  return (
    <div style={{ flex: "none", position: "relative" }}>
      {/* label above the strip */}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: 0,
          width: STRIP_W,
          textAlign: "center",
          marginBottom: 5,
          whiteSpace: "nowrap",
        }}
      >
        {topLabel}
      </div>

      <svg
        width={STRIP_W}
        height={CELL_H}
        viewBox={`0 0 ${STRIP_W} ${CELL_H}`}
        aria-hidden="true"
        style={{ display: "block" }}
      >
        {cells.map((c, i) => {
          const stroke = c.amber ? ACCENT : SUPPORT;
          const fill = c.amber ? "rgba(226,144,58,0.22)" : "rgba(76,141,214,0.15)";
          return (
            <g key={i}>
              <rect
                x={i * CELL_W}
                y={0}
                width={CELL_W}
                height={CELL_H}
                rx="2"
                fill={fill}
                stroke={stroke}
                strokeWidth="1.3"
              />
              {c.bit !== undefined && (
                <text
                  x={i * CELL_W + CELL_W / 2}
                  y={CELL_H / 2 + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                  fill={stroke}
                >
                  {c.bit}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* brace + "n channel uses" below the codeword strip */}
      {brace && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: STRIP_W,
            marginTop: 4,
          }}
        >
          <svg
            width={STRIP_W}
            height="9"
            viewBox={`0 0 ${STRIP_W} 9`}
            aria-hidden="true"
            style={{ display: "block", opacity: 0.6 }}
          >
            <path
              d={`M1 0 L1 5 L${STRIP_W / 2 - 5} 5 L${STRIP_W / 2} 9 L${STRIP_W / 2 + 5} 5 L${STRIP_W - 1} 5 L${STRIP_W - 1} 0`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              opacity: 0.6,
              marginTop: 2,
              whiteSpace: "nowrap",
            }}
          >
            <M tex="n" size={11} /> channel uses
          </div>
        </div>
      )}
    </div>
  );
}

export default function CodingPipeline() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        maxWidth: 780,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          padding: "24px 0 30px",
        }}
      >
        <Box>
          <span style={{ fontSize: 11, opacity: 0.6 }}>message</span>
          <M tex={String.raw`W \in \{1,\dots,2^{nR}\}`} size={13} />
        </Box>

        <Arrow />

        <Box>
          <span>encoder</span>
        </Box>

        <Arrow />

        <Strip
          cells={CODEWORD}
          topLabel={
            <M
              tex={String.raw`\textcolor{${SUPPORT}}{X^n(W)}`}
              size={13}
            />
          }
          brace
        />

        <Arrow />

        <Box>
          <span style={{ fontWeight: 600 }}>channel</span>
          <M tex={String.raw`p(y \mid x)`} size={12.5} />
          <span style={{ fontSize: 11, opacity: 0.6 }}>used n times</span>
        </Box>

        <Arrow />

        <Strip
          cells={RECEIVED}
          topLabel={<M tex={String.raw`Y^n`} size={13} />}
        />

        <Arrow />

        <Box>
          <span>decoder</span>
        </Box>

        <Arrow />

        <Box>
          <M tex={String.raw`\hat W`} size={14} />
        </Box>
      </div>

      {/* the rate, as real typesetting */}
      <div>
        <M
          tex={String.raw`R = \tfrac{\log_2 M}{n}\ \text{bits per use}`}
          size={16}
        />
      </div>
    </div>
  );
}
