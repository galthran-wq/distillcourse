import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * TypicalSetMap — where the probability lives in sequence space.
 *
 * A large frame is the space of all 2^n length-n sequences (n = 100). A small
 * amber region (~1/8 of the area) is the typical set T_ε^(n): only ≈2^{nH}
 * sequences, yet it carries almost all the probability. The muted surround is
 * atypical — almost never drawn. Two marked points sit OUTSIDE the amber
 * region: all-heads (the single most probable sequence, still atypical) and
 * all-tails (surprisal 332 bits). An annotation notes that indexing the
 * typical set costs only log2(2^{nH}) = nH bits.
 *
 * One idea: almost all probability sits in ~2^{nH} near-equiprobable sequences.
 * After MacKay, Information Theory, Inference, and Learning Algorithms, ch. 4
 * (redrawn, not copied).
 */

const W = 640;
const HGT = 420;

// outer frame = space of all 2^n sequences
const FX = 30;
const FY = 55;
const FW = 580;
const FH = 330;

// typical set (amber) — small minority, ~1/8 of the frame area
const TX = 235;
const TY = 180;
const TW = 185;
const TH = 140;

// marked points
const HEADS = { x: 540, y: 152 }; // all heads, near top-right corner
const TAILS = { x: 115, y: 335 }; // all tails, near bottom-left corner

export default function TypicalSetMap() {
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
        {/* outer frame: all length-n sequences */}
        <rect
          x={FX}
          y={FY}
          width={FW}
          height={FH}
          rx="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* typical set: small amber region carrying ~all the probability */}
        <rect
          x={TX}
          y={TY}
          width={TW}
          height={TH}
          rx="8"
          fill={ACCENT}
          fillOpacity="0.15"
          stroke={ACCENT}
          strokeWidth="1.6"
        />

        {/* all-heads point + leader up to its label */}
        <circle cx={HEADS.x} cy={HEADS.y} r="4" fill="currentColor" />
        <line
          x1={HEADS.x}
          y1={HEADS.y - 4}
          x2={HEADS.x - 6}
          y2={HEADS.y - 22}
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.7"
        />

        {/* all-tails point + leader down to its label */}
        <circle cx={TAILS.x} cy={TAILS.y} r="4" fill="currentColor" />
        <line
          x1={TAILS.x}
          y1={TAILS.y + 4}
          x2={TAILS.x}
          y2={TAILS.y + 16}
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.7"
        />

        {/* annotation arrow: from the indexing note left into the amber region */}
        <line
          x1={438}
          y1={250}
          x2={TX + TW + 3}
          y2={250}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.8"
        />
        <path
          d={`M ${TX + TW} 250 l 8 -3.4 l 0 6.8 Z`}
          fill="currentColor"
          opacity="0.8"
        />
      </svg>

      {/* corner label: size of the whole space */}
      <div style={{ position: "absolute", left: 44, top: 64 }}>
        <M tex={String.raw`2^{n}\text{ sequences}\ \ (\text{here }2^{100})`} size={13} />
      </div>

      {/* atypical surround label (muted) */}
      <div
        style={{
          position: "absolute",
          left: 48,
          top: 240,
          opacity: 0.55,
          fontStyle: "italic",
          fontSize: 12.5,
        }}
      >
        atypical: almost never drawn
      </div>

      {/* typical-set label, inside the amber region */}
      <div
        style={{
          position: "absolute",
          left: TX,
          top: TY,
          width: TW,
          height: TH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          padding: "0 8px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <div style={{ color: ACCENT, fontWeight: 600, fontSize: 12.5 }}>
          typical set&nbsp;
          <M tex={String.raw`\textcolor{${ACCENT}}{T_{\varepsilon}^{(n)}}`} size={12.5} />
        </div>
        <M tex={String.raw`\approx 2^{nH} \approx 2^{47}\ \text{seqs}`} size={12.5} />
        <div style={{ opacity: 0.62, fontSize: 11.5, lineHeight: 1.25 }}>
          carries ≈ all the probability
        </div>
      </div>

      {/* all-heads leader label (top-right, right-aligned) */}
      <div
        style={{
          position: "absolute",
          left: 408,
          top: 90,
          width: 190,
          textAlign: "right",
          fontSize: 11.5,
          lineHeight: 1.3,
        }}
      >
        all heads — the single most
        <br />
        probable sequence, still atypical
      </div>

      {/* all-tails leader label (bottom-left) */}
      <div
        style={{
          position: "absolute",
          left: 52,
          top: 352,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        all tails: surprisal 332 bits
      </div>

      {/* indexing annotation (right of amber) */}
      <div
        style={{
          position: "absolute",
          left: 444,
          top: 222,
          width: 160,
          fontSize: 11.5,
          lineHeight: 1.35,
        }}
      >
        indexing these needs only
        <br />
        <M tex={String.raw`\log_2 2^{nH} = nH\ \text{bits}`} size={12} />
      </div>
    </div>
  );
}
