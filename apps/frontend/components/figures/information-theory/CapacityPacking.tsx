import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * CapacityPacking — capacity as a packing number.
 *
 * Single figure. The large rounded rectangle (currentColor) is the set of
 * typical output sequences, ≈2^{nH(Y)}. Inside it, a tidy hexagonal packing of
 * 14 equal circles (blue outline): each is the noise cloud of one codeword,
 * ≈2^{nH(Y|X)} outputs, centered on an amber dot = the codeword x^n(w). The
 * clouds are disjoint, so the number that fits is the ratio of the two counts,
 * 2^{nI(X;Y)} — and 2^{nC} at the capacity-achieving input.
 *
 * Color roles: amber = codewords (and the capacity count they buy), blue = the
 * outputs a codeword plausibly produces, currentColor = the output space and
 * the payoff tally. Inspired by Shannon 1948 fig. 10 / MacKay ITILA ch. 10 —
 * recreated in house style, not copied.
 */

const W = 660;
const H = 458;

// outer frame = the typical output space
const FX = 30;
const FY = 30;
const FW = 600;
const FH = 310;

// hexagonal lattice: tangent circles of lattice radius R, drawn 1.5px smaller
// so neighbouring outlines read as separate clouds.
const R = 38;
const RD = 36.5;
const CX = 330;
const ROW1_Y = 132;
const ROW_DY = R * Math.sqrt(3); // 65.8
const ROW2_Y = ROW1_Y + ROW_DY;
const ROW3_Y = ROW1_Y + 2 * ROW_DY;

const ODD_XS = [-2, -1, 0, 1, 2].map((k) => CX + k * 2 * R); // 178 … 482
const EVEN_XS = [-1.5, -0.5, 0.5, 1.5].map((k) => CX + k * 2 * R); // 216 … 444

const CLOUDS: Array<[number, number]> = [
  ...ODD_XS.map((x) => [x, ROW1_Y] as [number, number]),
  ...EVEN_XS.map((x) => [x, ROW2_Y] as [number, number]),
  ...ODD_XS.map((x) => [x, ROW3_Y] as [number, number]),
];

// the annotated representative cloud: top-left of the packing
const REP = { x: ODD_XS[0], y: ROW1_Y };

const AMBER = (s: string) => String.raw`\textcolor{${ACCENT}}{${s}}`;

export default function CapacityPacking() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* the typical output space */}
        <rect
          x={FX}
          y={FY}
          width={FW}
          height={FH}
          rx="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* the packing: one noise cloud per codeword */}
        {CLOUDS.map(([x, y], i) => (
          <g key={`c${i}`}>
            <circle
              cx={x}
              cy={y}
              r={RD}
              fill="none"
              stroke={SUPPORT}
              strokeWidth="1.5"
            />
            <circle cx={x} cy={y} r="4" fill={ACCENT} />
          </g>
        ))}

        {/* radius arrow on the representative cloud, pointing at its boundary */}
        <line
          x1={REP.x}
          y1={REP.y - 4}
          x2={REP.x}
          y2={REP.y - RD + 6}
          stroke={SUPPORT}
          strokeWidth="1.4"
        />
        <path
          d={`M ${REP.x - 4} ${REP.y - RD + 10} L ${REP.x} ${REP.y - RD + 3} L ${REP.x + 4} ${REP.y - RD + 10}`}
          fill="none"
          stroke={SUPPORT}
          strokeWidth="1.4"
        />
        {/* thin leader: the label above names that radius */}
        <line
          x1={REP.x}
          y1={REP.y - RD - 3}
          x2={REP.x}
          y2={REP.y - RD - 26}
          stroke={SUPPORT}
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.75"
        />
      </svg>

      {/* outer-frame label, top right */}
      <div style={{ position: "absolute", right: W - (FX + FW) + 18, top: 46 }}>
        <span style={{ opacity: 0.7 }}>typical outputs&nbsp;</span>
        <M tex={String.raw`\approx 2^{nH(Y)}`} size={13} />
      </div>

      {/* representative-cloud label, directly above its radius arrow */}
      <div
        style={{
          position: "absolute",
          left: REP.x,
          top: 46,
          transform: "translateX(-50%)",
          width: 214,
          textAlign: "center",
          lineHeight: 1.35,
          color: SUPPORT,
        }}
      >
        <div style={{ fontSize: 11.5, fontWeight: 600 }}>
          noise cloud of one codeword
        </div>
        <M tex={String.raw`\approx 2^{nH(Y\mid X)}`} size={12} color={SUPPORT} />
      </div>

      {/* color-matched legend, directly under the graphic */}
      <div
        style={{
          position: "absolute",
          left: FX,
          top: FY + FH + 16,
          width: FW,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 30,
          fontSize: 12.5,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <svg width="18" height="18" aria-hidden="true">
            <circle cx="9" cy="9" r="4" fill={ACCENT} />
          </svg>
          <span style={{ opacity: 0.75 }}>a codeword&nbsp;</span>
          <M tex={AMBER(String.raw`x^n(w)`)} size={12.5} />
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <svg width="18" height="18" aria-hidden="true">
            <circle
              cx="9"
              cy="9"
              r="7"
              fill="none"
              stroke={SUPPORT}
              strokeWidth="1.5"
            />
          </svg>
          <span style={{ opacity: 0.75 }}>the outputs it plausibly produces</span>
        </span>
      </div>

      {/* payoff tally */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: FY + FH + 52,
          width: W,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            border: "1.6px solid currentColor",
            borderRadius: 9,
            padding: "9px 20px",
          }}
        >
          <span style={{ opacity: 0.75, fontSize: 12.5 }}>
            number of clouds that fit&nbsp;
          </span>
          <M
            tex={String.raw`=\;\frac{2^{nH(Y)}}{2^{nH(Y\mid X)}} \;=\; 2^{nI(X;Y)}`}
            size={14}
          />
          <span style={{ opacity: 0.75, fontSize: 12.5 }}>, and&nbsp;</span>
          <M tex={AMBER("2^{nC}")} size={14} />
          <span style={{ opacity: 0.75, fontSize: 12.5 }}>
            &nbsp;at the best input
          </span>
        </span>
      </div>
    </div>
  );
}
