import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * McMillanReach — prefix codes are a strict subclass of uniquely decodable
 * codes, yet both obey the SAME Kraft/McMillan length budget.
 *
 * A two-set Venn by containment: the outer set (currentColor) is all uniquely
 * decodable codes; the inner set (amber, light amber fill) is the prefix codes.
 * One concrete code sits in each region — inner {0, 10, 110, 1110}, outer ring
 * {0, 01, 011, 0111} (uniquely decodable but not prefix). Both realize the same
 * lengths (1, 2, 3, 4) and spend the same budget sum_i 2^-l_i = 15/16 <= 1.
 *
 * One idea: the budget bound is not special to prefix codes — nothing is lost
 * by restricting to them. (After Cover & Thomas, §5.1/§5.5; redrawn.)
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const W = 600;
const VH = 214;

// outer set (uniquely decodable)
const OX = 10;
const OY = 8;
const OW = 580;
const OH = 198;
// inner set (prefix), nested in the right portion
const IX = 292;
const IY = 46;
const IW = 286;
const IH = 140;

function CodeCard({
  left,
  code,
  accent,
  tag,
}: {
  left: number;
  code: string;
  accent?: boolean;
  tag: string;
}) {
  const color = accent ? ACCENT : "currentColor";
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 92,
        width: 258,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 12, color, opacity: accent ? 0.9 : 0.6, marginBottom: 4 }}>
        {tag}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 17, color, letterSpacing: "0.5px" }}>
        {code}
      </div>
      <div style={{ marginTop: 8, fontSize: 12.5, opacity: 0.85 }}>
        lengths <M tex={String.raw`(1,2,3,4)`} size={12.5} />
      </div>
      <div style={{ marginTop: 2, fontSize: 12.5, opacity: 0.85 }}>
        <M tex={String.raw`\sum_i 2^{-\ell_i} = \tfrac{15}{16} \le 1`} size={12.5} />
      </div>
    </div>
  );
}

export default function McMillanReach() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: W }}>
      {/* banner: the shared budget, across both sets */}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <M display tex={String.raw`\sum_i 2^{-\ell_i} \;\le\; 1`} />
        <div style={{ fontSize: 12.5, opacity: 0.6, marginTop: -2 }}>
          the same length budget (Kraft + McMillan)
        </div>
      </div>

      {/* nested Venn */}
      <div style={{ position: "relative", width: W, height: VH }}>
        <svg width={W} height={VH} viewBox={`0 0 ${W} ${VH}`} aria-hidden="true">
          {/* outer set: uniquely decodable codes */}
          <rect
            x={OX}
            y={OY}
            width={OW}
            height={OH}
            rx={16}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          {/* inner set: prefix codes (light amber fill, amber outline) */}
          <rect
            x={IX}
            y={IY}
            width={IW}
            height={IH}
            rx={14}
            fill={ACCENT}
            fillOpacity="0.09"
            stroke={ACCENT}
            strokeWidth="1.8"
          />
          {/* set labels, on the figure */}
          <text x={28} y={30} fontSize="13.5" fontWeight="600" fill="currentColor">
            uniquely decodable codes
          </text>
          <text x={IX + 16} y={IY + 24} fontSize="13.5" fontWeight="600" fill={ACCENT}>
            prefix codes
          </text>
        </svg>

        {/* code examples: one per region */}
        <CodeCard left={22} tag="the ring: not prefix" code="{ 0, 01, 011, 0111 }" />
        <CodeCard left={IX + 16} tag="e.g." code="{ 0, 10, 110, 1110 }" accent />
      </div>

      {/* payoff */}
      <div style={{ textAlign: "center", marginTop: 12, fontSize: 14 }}>
        same achievable lengths —{" "}
        <span style={{ color: ACCENT, fontWeight: 600 }}>prefix codes give up nothing</span>
      </div>
    </div>
  );
}
