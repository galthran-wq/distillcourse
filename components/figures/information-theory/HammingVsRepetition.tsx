import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * HammingVsRepetition — two bit strips protecting the same 4 data bits on a
 * BSC(0.01), joined by a bold arrow (playbook rule 8: near-identical panels,
 * the changed phrase highlighted, the payoff stated as a tally).
 *
 *   left  "repetition ×3": 12 cells = 4 blue data + 8 amber copies,
 *          rate 1/3, block error ≈ 1.2×10⁻³
 *   right "Hamming (7,4)": 7 cells  = 4 blue data + 3 amber parity,
 *          rate 4/7, block error ≈ 2.0×10⁻³
 *
 * Cells share one physical size across panels, so the left strip is honestly
 * longer — the eye sees repetition spend more bits per use. Colors: blue =
 * data bits, amber = redundant bits, currentColor = labels/arrow.
 *
 * One idea: how redundancy is arranged matters more than how much is spent.
 * Inspiration: MacKay, ITILA ch. 1 (error-vs-rate comparison) — recreated.
 */

const CELL_W = 26;
const CELL_H = 30;
const GAP = 3;
const STEP = CELL_W + GAP;
const STRIP_Y = 6;
const BRACKET_Y = STRIP_Y + CELL_H + 9;
const SVG_H = BRACKET_Y + 26;

const cellX = (i: number) => i * STEP;

function Bracket({
  from,
  to,
  color,
  label,
}: {
  from: number;
  to: number;
  color: string;
  label: string;
}) {
  const x0 = cellX(from);
  const x1 = cellX(to - 1) + CELL_W;
  const mid = (x0 + x1) / 2;
  return (
    <g>
      <path
        d={`M${x0} ${BRACKET_Y} L${x0} ${BRACKET_Y + 5} L${x1} ${BRACKET_Y + 5} L${x1} ${BRACKET_Y}`}
        fill="none"
        stroke={color}
        strokeWidth="1.3"
        strokeOpacity="0.9"
      />
      <text
        x={mid}
        y={BRACKET_Y + 19}
        textAnchor="middle"
        fontSize="12"
        fontWeight="600"
        fill={color}
      >
        {label}
      </text>
    </g>
  );
}

function Strip({
  redundant,
  redundantLabel,
}: {
  redundant: number;
  redundantLabel: string;
}) {
  const n = 4 + redundant;
  const width = n * STEP - GAP;
  return (
    <svg
      width={width}
      height={SVG_H}
      viewBox={`0 0 ${width} ${SVG_H}`}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {Array.from({ length: n }, (_, i) => {
        const isData = i < 4;
        return (
          <rect
            key={i}
            x={cellX(i)}
            y={STRIP_Y}
            width={CELL_W}
            height={CELL_H}
            rx="3"
            fill={isData ? SUPPORT : ACCENT}
            fillOpacity={isData ? 0.9 : 0.88}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.28"
          />
        );
      })}
      <Bracket from={0} to={4} color={SUPPORT} label="4 data" />
      <Bracket from={4} to={n} color={ACCENT} label={redundantLabel} />
    </svg>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ opacity: 0.75, whiteSpace: "nowrap" }}>{children}</div>;
}

function Panel({
  title,
  redundant,
  redundantLabel,
  rate,
  blockErr,
}: {
  title: string;
  redundant: number;
  redundantLabel: string;
  rate: string;
  blockErr: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
      <Strip redundant={redundant} redundantLabel={redundantLabel} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          marginTop: 2,
        }}
      >
        <Label>
          rate <M tex={rate} size={13} />
        </Label>
        <Label>
          block error <M tex={blockErr} size={13} />
        </Label>
      </div>
    </div>
  );
}

export default function HammingVsRepetition() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 720,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          flexWrap: "wrap",
        }}
      >
        <Panel
          title="repetition ×3"
          redundant={8}
          redundantLabel="8 copies"
          rate={String.raw`\tfrac{1}{3}`}
          blockErr={String.raw`\approx 1.2 \times 10^{-3}`}
        />
        <div
          style={{
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1,
            alignSelf: "center",
            marginTop: 6,
          }}
        >
          →
        </div>
        <Panel
          title="Hamming (7,4)"
          redundant={3}
          redundantLabel="3 parity"
          rate={String.raw`\tfrac{4}{7}`}
          blockErr={String.raw`\approx 2.0 \times 10^{-3}`}
        />
      </div>

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          fontWeight: 700,
          fontSize: 15,
          lineHeight: 1.4,
        }}
      >
        same single-error correction, comparable failure rate, 71% more data
        per use
      </div>
    </div>
  );
}
