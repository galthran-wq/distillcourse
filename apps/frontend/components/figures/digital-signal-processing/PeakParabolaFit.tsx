import type { ReactNode } from "react";

import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const soft = (color: string) =>
  `color-mix(in srgb, ${color} 10%, var(--panel))`;
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const xOf = (x: number) => 45 + ((x + 1.25) / 2.5) * 285;
const yOf = (db: number) => 200 - ((db + 14) / 16) * 166;
const fittedDb = (x: number) => -9 * (x - 1 / 6) ** 2 + 0.25;

function curvePath() {
  return Array.from({ length: 101 }, (_, index) => {
    const x = -1.2 + index * 0.024;
    return `${index === 0 ? "M" : "L"}${xOf(x).toFixed(2)} ${yOf(fittedDb(x)).toFixed(2)}`;
  }).join(" ");
}

function FormulaCard({
  color,
  label,
  children,
}: {
  color: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        background: soft(color),
        border: `1px solid color-mix(in srgb, ${color} 46%, transparent)`,
        borderRadius: 9,
        minWidth: 0,
        padding: "10px 11px",
      }}
    >
      <div
        style={{
          color,
          fontSize: 10.5,
          fontWeight: 800,
          letterSpacing: "0.055em",
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}>
        {children}
      </div>
    </section>
  );
}

function PeakPlot() {
  const samples = [
    { x: -1, db: -12, color: SUPPORT, label: "left · −12 dB" },
    { x: 0, db: 0, color: SUPPORT, label: "center · 0 dB" },
    { x: 1, db: -6, color: SUPPORT, label: "right · −6 dB" },
  ];
  const vertexX = xOf(1 / 6);
  const vertexY = yOf(0.25);

  return (
    <svg
      aria-label="Three adjacent log-magnitude samples at minus twelve, zero, and minus six decibels lie on a concave fitted parabola with a vertex one sixth of a grid bin to the right of the center sample."
      role="img"
      style={{ display: "block", height: "auto", width: "100%" }}
      viewBox="0 0 360 250"
    >
      <defs>
        <marker id="ppf-arrow" markerHeight="6" markerWidth="6" orient="auto" refX="5.4" refY="3">
          <path d="M0 0L6 3L0 6Z" fill={ACCENT} />
        </marker>
      </defs>

      {[-12, -6, 0].map((db) => (
        <g key={db}>
          <line x1="45" y1={yOf(db)} x2="330" y2={yOf(db)} stroke="currentColor" strokeDasharray="3 4" strokeOpacity="0.13" />
          <text x="38" y={yOf(db) + 4} fill="currentColor" fontSize="12" opacity="0.58" textAnchor="end">{db}</text>
        </g>
      ))}
      <line x1="45" y1="200" x2="337" y2="200" stroke="currentColor" strokeOpacity="0.52" />
      <line x1="45" y1="205" x2="45" y2="24" stroke="currentColor" strokeOpacity="0.52" />
      <path d="M331 196L338 200L331 204" fill="none" stroke="currentColor" strokeOpacity="0.52" />
      <path d="M41 30L45 23L49 30" fill="none" stroke="currentColor" strokeOpacity="0.52" />

      <path d={curvePath()} fill="none" stroke="currentColor" strokeWidth="2.2" />
      <line x1={vertexX} y1={vertexY} x2={vertexX} y2="200" stroke={ACCENT} strokeDasharray="4 4" strokeOpacity="0.75" />
      <line x1={xOf(0)} y1="219" x2={vertexX} y2="219" markerEnd="url(#ppf-arrow)" stroke={ACCENT} strokeWidth="1.5" />

      {samples.map((sample) => (
        <g key={sample.x}>
          <line x1={xOf(sample.x)} y1="200" x2={xOf(sample.x)} y2="205" stroke="currentColor" strokeOpacity="0.52" />
          <circle cx={xOf(sample.x)} cy={yOf(sample.db)} fill="var(--panel)" r="5" stroke={sample.color} strokeWidth="2.4" />
          <text
            x={sample.x === -1 ? xOf(sample.x) + 3 : sample.x === 1 ? xOf(sample.x) - 3 : xOf(sample.x)}
            y={sample.x === -1 ? yOf(sample.db) - 10 : sample.x === 1 ? yOf(sample.db) + 19 : yOf(sample.db) + 22}
            fill={sample.color}
            fontSize="12"
            fontWeight="750"
            textAnchor={sample.x === -1 ? "start" : sample.x === 1 ? "end" : "middle"}
          >
            {sample.label}
          </text>
        </g>
      ))}

      <circle cx={vertexX} cy={vertexY} fill={ACCENT} r="4.5" />
      <text x="350" y={vertexY - 5} fill={ACCENT} fontSize="12" fontWeight="750" textAnchor="end">fitted vertex · 0.25 dB</text>
      <text x={(xOf(0) + vertexX) / 2} y="238" fill={ACCENT} fontSize="12" fontWeight="750" textAnchor="middle">one-sixth bin</text>
      <text x="329" y="217" fill="currentColor" fontSize="12" opacity="0.6" textAnchor="end">offset from selected bin</text>
      <text x="5" y="17" fill="currentColor" fontSize="12" opacity="0.6">log magnitude (dB)</text>
    </svg>
  );
}

export default function PeakParabolaFit() {
  return (
    <figure
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.35,
        margin: 0,
        maxWidth: 780,
        minWidth: 0,
        width: "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 560px) {
          .ppf-layout { grid-template-columns: minmax(0, 1fr) !important; }
          .ppf-formulas { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>

      <div className="ppf-layout" style={{ alignItems: "center", display: "grid", gap: 14, gridTemplateColumns: "minmax(300px, 1.15fr) minmax(260px, 0.85fr)" }}>
        <div style={{ minWidth: 0 }}>
          <PeakPlot />
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", fontSize: 10.5, gap: "3px 12px", justifyContent: "center", marginTop: 2 }}>
            <span style={{ color: SUPPORT, fontWeight: 750 }}>outlined dots · measured samples</span>
            <span style={{ color: ACCENT, fontWeight: 750 }}>solid dot · fitted vertex</span>
          </div>
        </div>

        <div className="ppf-formulas" style={{ display: "grid", gap: 9, minWidth: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ ...labelMuted, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.045em", textTransform: "uppercase" }}>three adjacent samples</div>
            <div style={{ marginTop: 4 }}>
              <M tex={String.raw`(${role(SUPPORT, String.raw`\alpha`)},${role(SUPPORT, String.raw`\beta`)},${role(SUPPORT, String.raw`\gamma`)})=(-12,0,-6)\ \mathrm{dB}`} size={13} />
            </div>
          </div>

          <FormulaCard color={ACCENT} label="vertex offset">
            <M display tex={String.raw`p=\frac12\frac{\alpha-\gamma}{\alpha-2\beta+\gamma}=\frac16`} size={13.5} />
          </FormulaCard>

          <FormulaCard color={SUPPORT} label="fitted height">
            <M display tex={String.raw`\widehat b=\beta-\frac14(\alpha-\gamma)p=0.25\ \mathrm{dB}`} size={13.5} />
          </FormulaCard>

          <section style={{ border, borderRadius: 9, minWidth: 0, padding: "9px 10px", textAlign: "center" }}>
            <div style={{ ...labelMuted, fontSize: 10.5, marginBottom: 5 }}>map the fractional grid coordinate to hertz</div>
            <div style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}>
              <M tex={String.raw`\widehat f=(k^*+${role(ACCENT, "p")})\frac{f_s}{L}`} size={14} />
            </div>
          </section>
        </div>
      </div>

      <figcaption style={{ ...labelMuted, borderTop: border, fontSize: 10.5, marginTop: 10, paddingTop: 8, textAlign: "center" }}>
        The vertex is an estimate only when all three samples belong to one concave, isolated peak.
      </figcaption>
    </figure>
  );
}
