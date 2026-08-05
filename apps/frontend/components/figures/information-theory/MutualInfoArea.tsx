import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * MutualInfoArea — the completed area diagram for the mutual-information
 * lesson, extending the previous lesson's area-bars.svg by naming the overlap.
 * Three horizontal bars on one shared bits axis (weather numbers): H(X,Y) = 1.5
 * spans the whole axis; H(X) = 1 sits left; H(Y) = 0.811 sits right. Their
 * 0.311-bit overlap (amber) is the mutual information I(X;Y); the crescents
 * outside it (blue) are the conditional entropies. Below, three KaTeX readings
 * evaluate the same overlap three ways. Recreation of the idea in Cover &
 * Thomas fig. 2.2 and MacKay fig. 8.1 — redrawn, not copied.
 */

// bits axis: x = X0 + v * PXPB, from 0 to 1.5 bits
const X0 = 110;
const PXPB = 280;
const bx = (v: number) => X0 + v * PXPB;

// breakpoints on the axis
const B0 = bx(0); //      110  — left end (0 bits)
const BC = bx(0.689); //  303  — start of overlap / end of H(X|Y)
const B1 = bx(1.0); //    390  — end of H(X) / end of overlap
const BR = bx(1.5); //    530  — right end (1.5 bits)

// bar rows
const H = 26;
const Y_XY = 44; // H(X,Y)
const Y_X = 84; // H(X)
const Y_Y = 124; // H(Y)

const READINGS = [
  String.raw`\textcolor{${ACCENT}}{I(X;Y)} \;=\; H(X) - \textcolor{${SUPPORT}}{H(X\mid Y)} \;=\; 1 - 0.689 \;=\; 0.311`,
  String.raw`\textcolor{${ACCENT}}{I(X;Y)} \;=\; H(Y) - \textcolor{${SUPPORT}}{H(Y\mid X)} \;=\; 0.811 - 0.5 \;=\; 0.311`,
  String.raw`\textcolor{${ACCENT}}{I(X;Y)} \;=\; H(X) + H(Y) - H(X,Y) \;=\; 1 + 0.811 - 1.5 \;=\; 0.311`,
];

export default function MutualInfoArea() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 620 }}>
      <svg viewBox="0 0 596 208" width="100%" aria-hidden="true" style={{ color: "currentColor" }}>
        {/* shared bits axis (tick endpoints) */}
        <line x1={B0} y1={30} x2={BR} y2={30} stroke="currentColor" strokeOpacity="0.4" />
        {[0, 0.5, 1.0, 1.5].map((v) => (
          <g key={v}>
            <line x1={bx(v)} y1={27} x2={bx(v)} y2={33} stroke="currentColor" strokeOpacity="0.4" />
            <text x={bx(v)} y={20} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
              {v}
            </text>
          </g>
        ))}
        <text x={BR + 20} y={20} fontSize="11" fill="currentColor" opacity="0.55" fontStyle="italic">
          bits
        </text>

        {/* dashed guides at the overlap edges */}
        <line x1={BC} y1={36} x2={BC} y2={186} stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.4" />
        <line x1={B1} y1={36} x2={B1} y2={186} stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.4" />

        {/* amber overlap column: connect the two marginal bars into one region */}
        <rect x={BC} y={Y_X} width={B1 - BC} height={Y_Y + H - Y_X} fill={ACCENT} fillOpacity="0.16" />

        {/* --- H(X,Y): the whole interval, neutral outline (the total) --- */}
        <rect x={B0} y={Y_XY} width={BR - B0} height={H} rx="4" fill="none" stroke="currentColor" strokeOpacity="0.65" strokeWidth="1.5" />
        <text x={B0 - 10} y={Y_XY + 18} textAnchor="end" fontSize="13" fontWeight="600" fill="currentColor">
          H(X,Y)
        </text>
        <text x={BR - 8} y={Y_XY + 18} textAnchor="end" fontSize="12" fill="currentColor" opacity="0.55">
          1.5
        </text>

        {/* --- H(X): left-aligned; blue crescent + amber overlap --- */}
        <rect x={B0} y={Y_X} width={BC - B0} height={H} rx="4" fill={SUPPORT} fillOpacity="0.32" stroke={SUPPORT} strokeOpacity="0.9" />
        <rect x={BC} y={Y_X} width={B1 - BC} height={H} rx="0" fill={ACCENT} fillOpacity="0.9" />
        <text x={B0 - 10} y={Y_X + 18} textAnchor="end" fontSize="13" fontWeight="600" fill={ACCENT}>
          H(X)
        </text>
        <text x={B1 + 6} y={Y_X + 18} textAnchor="start" fontSize="12" fill="currentColor" opacity="0.55">
          1.0
        </text>

        {/* --- H(Y): right-aligned; amber overlap + blue crescent --- */}
        <rect x={BC} y={Y_Y} width={B1 - BC} height={H} rx="0" fill={ACCENT} fillOpacity="0.9" />
        <rect x={B1} y={Y_Y} width={BR - B1} height={H} rx="4" fill={SUPPORT} fillOpacity="0.32" stroke={SUPPORT} strokeOpacity="0.9" />
        <text x={B0 - 10} y={Y_Y + 18} textAnchor="end" fontSize="13" fontWeight="600" fill={SUPPORT}>
          H(Y)
        </text>
        <text x={BR - 8} y={Y_Y + 18} textAnchor="end" fontSize="12" fill="currentColor" opacity="0.55">
          0.811
        </text>

        {/* --- leader lines from each labelled region down to the label row --- */}
        <line x1={(B0 + BC) / 2} y1={Y_X + H} x2={(B0 + BC) / 2} y2={190} stroke={SUPPORT} strokeOpacity="0.5" />
        <line x1={(BC + B1) / 2} y1={Y_Y + H} x2={(BC + B1) / 2} y2={190} stroke={ACCENT} strokeOpacity="0.6" />
        <line x1={(B1 + BR) / 2} y1={Y_Y + H} x2={(B1 + BR) / 2} y2={190} stroke={SUPPORT} strokeOpacity="0.5" />

        {/* --- segment labels --- */}
        <text x={(B0 + BC) / 2} y={202} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={SUPPORT}>
          H(X|Y) = 0.689
        </text>
        <text x={(BC + B1) / 2} y={202} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={ACCENT}>
          I(X;Y) = 0.311
        </text>
        <text x={(B1 + BR) / 2} y={202} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={SUPPORT}>
          H(Y|X) = 0.5
        </text>
      </svg>

      {/* three readings of the same overlap */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14, paddingLeft: 4 }}>
        {READINGS.map((tex, i) => (
          <M key={i} tex={tex} size={14.5} />
        ))}
      </div>

      <div style={{ ...labelMuted, marginTop: 10, paddingLeft: 4 }}>
        one overlap, read three ways: the amber region is <M tex={String.raw`\textcolor{${ACCENT}}{I(X;Y)}`} size={12} />.
      </div>
    </div>
  );
}
