import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * IncompressibleCount — a counting argument, drawn to scale.
 *
 * A large frame is the space of all 2^1000 length-1000 strings. In a corner,
 * a visibly tiny amber sub-region is the set of strings compressible by ≥ 20
 * bits: fewer than 2^980 of them, at most a 2^-20 ≈ 10^-6 fraction. The vast
 * muted remainder is incompressible to within 20 bits (K(x) ≥ 980) — the
 * typical case. Below the frame, the counting gloss that forces the tininess:
 * there are fewer than 2^980 programs shorter than 980 bits, one output each.
 *
 * One idea: there are not enough short programs to go around.
 * After Cover & Thomas, Elements of Information Theory §14.5 (redrawn).
 */

const W = 640;
const HGT = 400;

// outer frame = space of all 2^1000 strings
const FX = 30;
const FY = 48;
const FW = 580;
const FH = 268;

// compressible set (amber) — a visibly tiny sliver in the top-right corner
const TX = 556;
const TY = 62;
const TW = 40;
const TH = 26;

// leader from the amber sliver down-left to its label block
const LEAD_FROM = { x: TX, y: TY + TH / 2 };
const LEAD_TO = { x: 372, y: 150 };

export default function IncompressibleCount() {
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
        {/* outer frame: all 2^1000 strings, faint muted fill = the majority */}
        <rect
          x={FX}
          y={FY}
          width={FW}
          height={FH}
          rx="10"
          fill="currentColor"
          fillOpacity="0.05"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* compressible set: the tiny amber minority */}
        <rect
          x={TX}
          y={TY}
          width={TW}
          height={TH}
          rx="4"
          fill={ACCENT}
          fillOpacity="0.85"
          stroke={ACCENT}
          strokeWidth="1.4"
        />

        {/* leader: from the amber sliver to the annotation block */}
        <line
          x1={LEAD_FROM.x}
          y1={LEAD_FROM.y}
          x2={LEAD_TO.x}
          y2={LEAD_TO.y}
          stroke={ACCENT}
          strokeWidth="1.2"
          opacity="0.85"
        />
        <circle cx={LEAD_TO.x} cy={LEAD_TO.y} r="2.4" fill={ACCENT} />
      </svg>

      {/* corner label: size of the whole space */}
      <div style={{ position: "absolute", left: 44, top: 58 }}>
        <M tex={String.raw`2^{1000}\text{ strings}`} size={13.5} />
      </div>

      {/* the majority: incompressible, the typical case */}
      <div
        style={{
          position: "absolute",
          left: 92,
          top: 236,
          width: 300,
          lineHeight: 1.4,
        }}
      >
        <div style={{ opacity: 0.62, fontStyle: "italic", fontSize: 12.5 }}>
          incompressible to within 20 bits
        </div>
        <div style={{ marginTop: 3 }}>
          <M tex={String.raw`K(x) \ge 980`} size={13.5} />
          <span style={{ opacity: 0.62, fontStyle: "italic", fontSize: 12.5 }}>
            &nbsp;— the typical case
          </span>
        </div>
      </div>

      {/* the amber minority: label block reached by the leader */}
      <div
        style={{
          position: "absolute",
          left: 382,
          top: 120,
          width: 224,
          lineHeight: 1.4,
        }}
      >
        <div style={{ color: ACCENT, fontWeight: 600, fontSize: 12.5 }}>
          compressible by&nbsp;
          <M tex={String.raw`\textcolor{${ACCENT}}{\ge 20}`} size={12.5} />
          &nbsp;bits
        </div>
        <div style={{ marginTop: 3, fontSize: 12 }}>
          <M tex={String.raw`< 2^{980}`} size={12.5} /> strings — at most a{" "}
          <M tex={String.raw`2^{-20} \approx 10^{-6}`} size={12.5} /> fraction
        </div>
      </div>

      {/* counting gloss below the frame: why the sliver must be tiny */}
      <div
        style={{
          position: "absolute",
          left: FX,
          top: FY + FH + 26,
          width: FW,
          textAlign: "center",
        }}
      >
        <M
          tex={String.raw`\text{programs shorter than }980\text{ bits:}\ \ 1 + 2 + \cdots + 2^{979} < 2^{980}\text{, one output each}`}
          size={13}
        />
      </div>
    </div>
  );
}
