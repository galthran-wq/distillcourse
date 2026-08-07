import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const N = 64;
const Q_MIN = 9.2;
const Q_MAX = 11.3;

type Complex = { re: number; im: number };

function pairMagnitude(q: number, phaseDegrees: number): number {
  let re = 0;
  let im = 0;
  const phaseOffset = (phaseDegrees * Math.PI) / 180;
  for (let n = 0; n < N; n += 1) {
    const first = (2 * Math.PI * 10 * n) / N;
    const second = (2 * Math.PI * 10.5 * n) / N + phaseOffset;
    const sample: Complex = {
      re: Math.cos(first) + Math.cos(second),
      im: Math.sin(first) + Math.sin(second),
    };
    const angle = (2 * Math.PI * q * n) / N;
    re += sample.re * Math.cos(angle) + sample.im * Math.sin(angle);
    im += sample.im * Math.cos(angle) - sample.re * Math.sin(angle);
  }
  return Math.hypot(re, im) / N;
}

const xOf = (q: number) => 36 + ((q - Q_MIN) / (Q_MAX - Q_MIN)) * 286;
const yOf = (db: number) => 25 + ((0 - Math.max(-42, db)) / 42) * 145;

function spectrumPath(phaseDegrees: number): string {
  const values = Array.from({ length: 421 }, (_, index) => {
    const q = Q_MIN + (index / 420) * (Q_MAX - Q_MIN);
    return { q, magnitude: pairMagnitude(q, phaseDegrees) };
  });
  const maximum = Math.max(...values.map((value) => value.magnitude));
  return values.map((value, index) => {
    const db = 20 * Math.log10(Math.max(1e-12, value.magnitude / maximum));
    return `${index === 0 ? "M" : "L"}${xOf(value.q).toFixed(2)} ${yOf(db).toFixed(2)}`;
  }).join(" ");
}

type PanelData = {
  phaseDegrees: 0 | 90;
  peaks: number[];
  detail: string;
  verdict: string;
};

const PANELS: PanelData[] = [
  {
    phaseDegrees: 0,
    peaks: [10.25],
    detail: "one measured maximum · 10.250000",
    verdict: "one merged maximum",
  },
  {
    phaseDegrees: 90,
    peaks: [9.582764, 10.917236],
    detail: "two measured maxima · each displaced 0.417236 bin",
    verdict: "two bumps, wrong locations",
  },
];

function SpectrumPanel({ panel }: { panel: PanelData }) {
  const markerY = panel.peaks.map((q) => {
    const local = pairMagnitude(q, panel.phaseDegrees);
    const max = Math.max(...panel.peaks.map((peak) => pairMagnitude(peak, panel.phaseDegrees)));
    return yOf(20 * Math.log10(local / max));
  });

  return (
    <section style={{ background: "var(--panel)", border, borderRadius: 9, minWidth: 0, padding: "10px 10px 9px" }}>
      <header style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "3px 10px", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 12.5 }}>{panel.phaseDegrees === 0 ? "in phase" : "quadrature"}</strong>
        <M tex={String.raw`\phi=${panel.phaseDegrees === 0 ? "0" : "\pi/2"}`} size={12.5} />
      </header>
      <div style={{ ...labelMuted, fontSize: 12, marginTop: 1 }}><M tex={String.raw`N=64,\quad q_1=10,\quad q_2=10.5`} size={12} /></div>

      <svg
        aria-label={panel.phaseDegrees === 0
          ? "For two equal tones at original-bin coordinates 10 and 10.5 with zero relative phase, the 64-sample rectangular-window spectrum has one measured maximum at 10.25."
          : "For the same two tones with ninety degrees relative phase, the spectrum has measured maxima at 9.582764 and 10.917236, both 0.417236 original bins away from the assigned true tone."}
        role="img"
        style={{ display: "block", height: "auto", marginTop: 4, width: "100%" }}
        viewBox="0 0 350 215"
      >
        <defs>
          <clipPath id={`pfr-clip-${panel.phaseDegrees}`}>
            <rect x="36" y="20" width="286" height="150" />
          </clipPath>
        </defs>

        {[0, -20, -40].map((db) => (
          <g key={db}>
            <line x1="36" y1={yOf(db)} x2="322" y2={yOf(db)} stroke="currentColor" strokeDasharray="3 4" strokeOpacity="0.12" />
            <text x="31" y={yOf(db) + 3.5} fill="currentColor" fontSize="12" opacity="0.58" textAnchor="end">{db}</text>
          </g>
        ))}

        {[10, 10.5].map((q) => (
          <g key={q}>
            <line x1={xOf(q)} y1="20" x2={xOf(q)} y2="170" stroke={SUPPORT} strokeDasharray="4 4" strokeOpacity="0.85" strokeWidth="1.5" />
            <text x={xOf(q)} y="191" fill={SUPPORT} fontSize="12" fontWeight="750" textAnchor="middle">{q.toFixed(3)}</text>
          </g>
        ))}

        <g clipPath={`url(#pfr-clip-${panel.phaseDegrees})`}>
          <path d={spectrumPath(panel.phaseDegrees)} fill="none" stroke="currentColor" strokeWidth="2.2" />
        </g>

        <line x1="36" y1="170" x2="327" y2="170" stroke="currentColor" strokeOpacity="0.5" />
        <line x1="36" y1="175" x2="36" y2="19" stroke="currentColor" strokeOpacity="0.5" />
        <text x="8" y="13" fill="currentColor" fontSize="12" opacity="0.6">relative magnitude (dB)</text>
        <text x="321" y="208" fill="currentColor" fontSize="12" opacity="0.6" textAnchor="end">original-bin coordinate</text>

        {panel.peaks.map((q, index) => (
          <g key={q}>
            <circle cx={xOf(q)} cy={markerY[index]} fill={ACCENT} r="4.5" stroke="var(--panel)" strokeWidth="1.5" />
            <line x1={xOf(q)} y1={markerY[index] + 6} x2={xOf(q)} y2="170" stroke={ACCENT} strokeDasharray="2 3" strokeOpacity="0.68" />
            <text
              x={xOf(q)}
              y={panel.phaseDegrees === 0 ? markerY[index] + 18 : markerY[index] + 18}
              fill={ACCENT}
              fontSize="12"
              fontWeight="800"
              textAnchor="middle"
            >
              {q.toFixed(6)}
            </text>
          </g>
        ))}
      </svg>

      <div style={{ borderTop: border, color: panel.phaseDegrees === 0 ? "currentColor" : ACCENT, fontSize: 10.5, fontWeight: 800, paddingTop: 6, textAlign: "center" }}>
        {panel.verdict}
      </div>
      <div style={{ ...labelMuted, fontSize: 10, marginTop: 2, textAlign: "center" }}>{panel.detail}</div>
    </section>
  );
}

export default function PhaseFalseResolution() {
  return (
    <figure
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.35,
        margin: 0,
        maxWidth: 790,
        minWidth: 0,
        width: "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 560px) {
          .pfr-panels { grid-template-columns: minmax(0, 1fr) !important; }
          .pfr-header { align-items: flex-start !important; flex-direction: column !important; }
        }
      `}</style>

      <header className="pfr-header" style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "space-between", marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>same equal tones · only relative phase changes</strong>
        <M tex={String.raw`x_\phi[n]=e^{j2\pi(10/64)n}+e^{j(2\pi(10.5/64)n+\phi)}`} size={12.5} />
      </header>

      <div className="pfr-panels" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {PANELS.map((panel) => <SpectrumPanel key={panel.phaseDegrees} panel={panel} />)}
      </div>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", fontSize: 10.5, gap: "4px 14px", justifyContent: "center", marginTop: 8 }}>
        <span style={{ color: SUPPORT, fontWeight: 750 }}>blue dashed guides · true tones at 10 and 10.5</span>
        <span style={{ color: ACCENT, fontWeight: 750 }}>amber dots · measured maxima</span>
      </div>

      <figcaption style={{ borderTop: border, fontSize: 11, fontWeight: 700, marginTop: 8, paddingTop: 8, textAlign: "center" }}>
        Peak count changes from one to two, yet the tone frequencies do not: two visible bumps are not stable component locations.
      </figcaption>
    </figure>
  );
}
