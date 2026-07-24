import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * HammingVenn — the (7,4) Hamming code as three overlapping parity circles.
 * The transmitted codeword is 1000101 (s1..s4 = 1,0,0,0 data-ish bits placed in
 * the intersections; t5,t6,t7 = 1,0,1 in the single-circle regions). Bit s2 is
 * flipped 0->1 (amber). It lives in circle1 ∩ circle2, so both those parity
 * checks turn odd and fail (amber outlines); circle3 does not contain s2, so its
 * check stays even and holds (blue). The two failing circles minus the holding
 * one intersect in exactly one bit — s2, the error. Recreation of the idea in
 * MacKay ch. 1 / Cover & Thomas §7.11 — redrawn, not copied.
 */

// --- Venn geometry: symmetric equilateral, two circles on top, one below ---
const CX = 250;
const CY = 172;
const D = 66; // centroid -> circle-center distance
const R = 108; // circle radius

// circle centers (A = check 1 top-left, B = check 2 top-right, C = check 3)
const A = { x: CX - 0.5 * D, y: CY - 0.866 * D }; // (217, 115)
const B = { x: CX + 0.5 * D, y: CY - 0.866 * D }; // (283, 115)
const C = { x: CX, y: CY + D }; //                   (250, 238)

type BitProps = {
  x: number;
  y: number;
  sym: string; // "s" or "t"
  sub: string; // subscript digit
  val: string; // "0" / "1"
  color?: string;
  bold?: boolean;
};

function Bit({ x, y, sym, sub, val, color = "currentColor", bold }: BitProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
      fontSize="16"
      fill={color}
      fontWeight={bold ? 700 : 500}
    >
      <tspan fontStyle="italic">{sym}</tspan>
      <tspan fontStyle="italic" fontSize="11" dy="4">
        {sub}
      </tspan>
      <tspan dy="-4">{` = ${val}`}</tspan>
    </text>
  );
}

export default function HammingVenn() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 560 }}>
      <svg viewBox="0 0 500 430" width="100%" aria-hidden="true" style={{ color: "currentColor" }}>
        {/* subtle region tints: amber over the two failing checks, blue over the holding one */}
        <circle cx={A.x} cy={A.y} r={R} fill={ACCENT} fillOpacity="0.06" />
        <circle cx={B.x} cy={B.y} r={R} fill={ACCENT} fillOpacity="0.06" />
        <circle cx={C.x} cy={C.y} r={R} fill={SUPPORT} fillOpacity="0.06" />

        {/* circle outlines: failing checks amber, holding check blue */}
        <circle cx={A.x} cy={A.y} r={R} fill="none" stroke={ACCENT} strokeWidth="2.2" />
        <circle cx={B.x} cy={B.y} r={R} fill="none" stroke={ACCENT} strokeWidth="2.2" />
        <circle cx={C.x} cy={C.y} r={R} fill="none" stroke={SUPPORT} strokeWidth="2.2" />

        {/* highlight ring around the identified error bit s2 */}
        <circle cx={CX} cy={98} r={26} fill="none" stroke={ACCENT} strokeWidth="1.6" strokeDasharray="4 3" />

        {/* --- the seven bits, one per Venn region --- */}
        {/* center: all three circles */}
        <Bit x={CX} y={168} sym="s" sub="3" val="0" />
        {/* pairwise intersections */}
        <Bit x={198} y={200} sym="s" sub="1" val="1" />
        <Bit x={302} y={200} sym="s" sub="4" val="0" />
        {/* single-circle regions */}
        <Bit x={150} y={162} sym="t" sub="5" val="1" />
        <Bit x={350} y={162} sym="t" sub="6" val="0" />
        <Bit x={CX} y={318} sym="t" sub="7" val="1" />

        {/* s2 — the flipped bit, in circle1 ∩ circle2 */}
        <text
          x={CX}
          y={96}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontSize="16"
          fontWeight={700}
          fill={ACCENT}
        >
          <tspan fontStyle="italic">s</tspan>
          <tspan fontStyle="italic" fontSize="11" dy="4">
            2
          </tspan>
        </text>
        <text
          x={CX}
          y={112}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontSize="12"
          fontWeight={700}
          fill={ACCENT}
        >
          0 → 1
        </text>

        {/* --- circle names + parity status tags --- */}
        {/* check 1 (top-left, fails) */}
        <text x={38} y={44} textAnchor="start" fontSize="14" fontWeight="700" fill={ACCENT}>
          check 1
        </text>
        <text x={38} y={61} textAnchor="start" fontSize="11.5" fill={ACCENT} opacity="0.9">
          odd → fails
        </text>
        <line x1={104} y1={52} x2={128} y2={58} stroke={ACCENT} strokeWidth="1" strokeOpacity="0.55" />

        {/* check 2 (top-right, fails) */}
        <text x={462} y={44} textAnchor="end" fontSize="14" fontWeight="700" fill={ACCENT}>
          check 2
        </text>
        <text x={462} y={61} textAnchor="end" fontSize="11.5" fill={ACCENT} opacity="0.9">
          odd → fails
        </text>
        <line x1={396} y1={52} x2={372} y2={58} stroke={ACCENT} strokeWidth="1" strokeOpacity="0.55" />

        {/* check 3 (bottom, holds) */}
        <text x={CX} y={396} textAnchor="middle" fontSize="14" fontWeight="700" fill={SUPPORT}>
          check 3
        </text>
        <text x={CX} y={413} textAnchor="middle" fontSize="11.5" fill={SUPPORT} opacity="0.9">
          even → holds
        </text>
        <line x1={CX} y1={382} x2={CX} y2={348} stroke={SUPPORT} strokeWidth="1" strokeOpacity="0.55" />
      </svg>

      {/* payoff: the pattern of failing/holding checks localizes exactly one bit */}
      <div style={{ marginTop: 12, fontSize: 15, lineHeight: 1.5, paddingLeft: 2 }}>
        <span style={{ color: ACCENT, fontWeight: 700 }}>fails</span>
        <span style={{ opacity: 0.7 }}> ∩ </span>
        <span style={{ color: ACCENT, fontWeight: 700 }}>fails</span>
        <span style={{ opacity: 0.7 }}> ∖ </span>
        <span style={{ color: SUPPORT, fontWeight: 700 }}>holds</span>
        <span style={{ opacity: 0.7 }}> = </span>
        <M tex={String.raw`\textcolor{${ACCENT}}{s_2}`} size={15} />
      </div>
      <div style={{ ...labelMuted, marginTop: 6, paddingLeft: 2 }}>
        two failing checks and one holding check intersect in exactly one bit — the error.
      </div>
    </div>
  );
}
