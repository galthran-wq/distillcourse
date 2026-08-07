import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * The tokenizer trap (voita rule 8): two near-identical panels joined by a
 * bold arrow, with exactly one thing different — how the SAME 20 bytes of
 * text are cut into tokens. Model A cuts 20 one-byte tokens and reports the
 * lower loss per token (amber); model B cuts 5 four-byte tokens and writes
 * the smaller file (blue). Ordering by nats/token and ordering by bits/byte
 * disagree, so the unit decides the winner.
 */

const TEXT = "the cat sat on a mat"; // 20 bytes
const CW = 15; // byte-cell width
const CH = 24; // byte-cell height
const SVG_W = TEXT.length * CW + 2;

function Strip({ tokenSize }: { tokenSize: number }) {
  const bytes = TEXT.split("");
  const groups = Array.from(
    { length: bytes.length / tokenSize },
    (_, g) => g * tokenSize,
  );
  return (
    <svg viewBox={`0 0 ${SVG_W} ${CH + 4}`} width={SVG_W} aria-hidden="true">
      {/* the same 20 byte cells in both panels */}
      {bytes.map((ch, i) => (
        <rect
          key={`b${i}`}
          x={1 + i * CW}
          y={1}
          width={CW}
          height={CH}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.16"
          strokeWidth="1"
        />
      ))}
      {bytes.map((ch, i) =>
        ch === " " ? (
          <circle
            key={`s${i}`}
            cx={1 + i * CW + CW / 2}
            cy={13}
            r="1.4"
            fill="currentColor"
            opacity="0.3"
          />
        ) : (
          <text
            key={`t${i}`}
            x={1 + i * CW + CW / 2}
            y={17}
            textAnchor="middle"
            fontSize="11"
            fontFamily="ui-monospace, monospace"
            fill="currentColor"
            opacity="0.85"
          >
            {ch}
          </text>
        ),
      )}
      {/* the ONE difference: where the token boundaries fall */}
      {groups.map((start) => (
        <rect
          key={`g${start}`}
          x={1 + start * CW + 1}
          y={1}
          width={tokenSize * CW - 2}
          height={CH}
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.95"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

const tallyBox: React.CSSProperties = {
  display: "inline-block",
  border: `1.6px solid ${SUPPORT}`,
  borderRadius: 6,
  padding: "5px 12px",
  color: SUPPORT,
  fontWeight: 600,
};

export default function TokenizerRankingFlip() {
  const nats = (v: string) =>
    String.raw`\textcolor{${ACCENT}}{\mathbf{${v}}}\ \textcolor{${ACCENT}}{\text{nats/token}}`;
  const bpb = (v: string) => String.raw`${v}\ \text{bits/byte}`;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 760,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 120px auto",
          justifyContent: "start",
          alignItems: "center",
          columnGap: 12,
          rowGap: 7,
        }}
      >
        {/* titles */}
        <div style={{ fontWeight: 600 }}>model A — byte tokenizer</div>
        <div />
        <div style={{ fontWeight: 600 }}>model B — subword tokenizer</div>

        {/* the same text, cut two ways */}
        <Strip tokenSize={1} />
        <div />
        <Strip tokenSize={4} />

        <div style={labelMuted}>20 tokens × 1 byte = 20 bytes</div>
        <div />
        <div style={labelMuted}>5 tokens × 4 bytes = 20 bytes</div>

        <div>
          <M tex={nats("0.90")} size={14} />
        </div>
        <div />
        <div>
          <M tex={nats("3.20")} size={14} />
        </div>

        {/* the payoff, stated as a tally in each panel */}
        <div style={{ marginTop: 3 }}>
          <span style={tallyBox}>
            <M tex={bpb("1.30")} size={14} color={SUPPORT} />
          </span>
        </div>
        <div style={{ marginTop: 3, textAlign: "center" }}>
          <svg viewBox="0 0 110 20" width="110" aria-hidden="true">
            <path
              d="M4 10 H 90"
              stroke="currentColor"
              strokeWidth="3.2"
              fill="none"
            />
            <path
              d="M88 2 L 104 10 L 88 18 Z"
              fill="currentColor"
              stroke="none"
            />
          </svg>
        </div>
        <div style={{ marginTop: 3 }}>
          <span style={tallyBox}>
            <M tex={bpb("1.15")} size={14} color={SUPPORT} />
          </span>
        </div>

        {/* arrow label */}
        <div
          style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            color: SUPPORT,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          same text, same file, ordering reversed
        </div>
      </div>

      {/* bottom tally: the unit decides the winner */}
      <div
        style={{
          height: 1,
          background: "currentColor",
          opacity: 0.25,
          margin: "16px 0 0",
        }}
      />
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          columnGap: 14,
          rowGap: 6,
          justifyContent: "center",
          alignItems: "baseline",
        }}
      >
        <div style={{ color: ACCENT }}>by nats/token:</div>
        <div style={{ color: ACCENT, fontWeight: 600 }}>A wins</div>
        <div style={{ color: ACCENT }}>
          <M tex={String.raw`(0.90 < 3.20)`} size={13} color={ACCENT} />
        </div>

        <div style={{ color: SUPPORT, fontWeight: 700 }}>by bits/byte:</div>
        <div style={{ color: SUPPORT, fontWeight: 700 }}>B wins</div>
        <div style={{ color: SUPPORT, fontWeight: 700 }}>
          <M tex={String.raw`(1.15 < 1.30)`} size={13} color={SUPPORT} />
        </div>
      </div>
    </div>
  );
}
