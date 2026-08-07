import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const FS = 1024;
const F_MIN = 140;
const F_MAX = 210;
const Y_MAX = 1.12;

type Complex = { re: number; im: number };
type Series = "170" | "180" | "sum";

function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function toneDft(nSamples: number, frequency: number, tone: number, amplitude: number): Complex {
  let re = 0;
  let im = 0;
  for (let n = 0; n < nSamples; n += 1) {
    const sample = amplitude * Math.cos((2 * Math.PI * tone * n) / FS);
    const phase = (-2 * Math.PI * frequency * n) / FS;
    re += sample * Math.cos(phase);
    im += sample * Math.sin(phase);
  }
  return { re, im };
}

function magnitude(nSamples: number, frequency: number, series: Series): number {
  const first = toneDft(nSamples, frequency, 170, 1);
  const second = toneDft(nSamples, frequency, 180, 0.8);
  const value = series === "170" ? first : series === "180" ? second : add(first, second);
  return (2 * Math.hypot(value.re, value.im)) / nSamples;
}

const xOf = (frequency: number) => 28 + ((frequency - F_MIN) / (F_MAX - F_MIN)) * 270;
const yOf = (value: number) => 128 - (Math.min(value, Y_MAX) / Y_MAX) * 108;

function curvePath(nSamples: number, series: Series): string {
  const points = Array.from({ length: 281 }, (_, index) => {
    const frequency = F_MIN + index * 0.25;
    return `${xOf(frequency).toFixed(2)},${yOf(magnitude(nSamples, frequency, series)).toFixed(2)}`;
  });
  return `M${points.join("L")}`;
}

function sampledFrequencies(transformLength: number): number[] {
  const spacing = FS / transformLength;
  const start = Math.ceil(F_MIN / spacing);
  const end = Math.floor(F_MAX / spacing);
  return Array.from({ length: end - start + 1 }, (_, index) => (start + index) * spacing);
}

function SpectrumPlot({
  nSamples,
  transformLength,
  markPeaks,
}: {
  nSamples: number;
  transformLength: number;
  markPeaks?: boolean;
}) {
  const samples = sampledFrequencies(transformLength);
  const dense = transformLength === 1024;
  return (
    <svg
      aria-label={`${nSamples} acquired samples evaluated with an ${transformLength}-point DFT from 140 to 210 hertz`}
      role="img"
      style={{ display: "block", height: "auto", width: "100%" }}
      viewBox="0 0 320 164"
    >
      <defs>
        <clipPath id={`pdr-clip-${nSamples}-${transformLength}`}>
          <rect x="28" y="16" width="270" height="112" />
        </clipPath>
      </defs>

      {[0.5, 1].map((level) => (
        <g key={level}>
          <line x1="28" y1={yOf(level)} x2="298" y2={yOf(level)} stroke="currentColor" strokeDasharray="3 4" strokeOpacity="0.11" />
          <text x="24" y={yOf(level) + 3} fill="currentColor" fontSize="8.5" opacity="0.52" textAnchor="end">{level}</text>
        </g>
      ))}

      <g clipPath={`url(#pdr-clip-${nSamples}-${transformLength})`}>
        <path d={curvePath(nSamples, "170")} fill="none" stroke={ACCENT} strokeOpacity="0.68" strokeWidth="1.35" />
        <path d={curvePath(nSamples, "180")} fill="none" stroke={SUPPORT} strokeOpacity="0.68" strokeWidth="1.35" />
        <path d={curvePath(nSamples, "sum")} fill="none" stroke="currentColor" strokeWidth="2" />

        {samples.map((frequency) => {
          const y = yOf(magnitude(nSamples, frequency, "sum"));
          return (
            <g key={frequency}>
              <line
                x1={xOf(frequency)}
                y1="128"
                x2={xOf(frequency)}
                y2={y}
                stroke="currentColor"
                strokeOpacity={dense ? 0.24 : 0.52}
                strokeWidth={dense ? 0.65 : 1.1}
              />
              {!dense && <circle cx={xOf(frequency)} cy={y} fill="currentColor" r="2.1" />}
            </g>
          );
        })}
      </g>

      <line x1="28" y1="128" x2="302" y2="128" stroke="currentColor" strokeOpacity="0.5" />
      {[140, 170, 180, 210].map((frequency) => (
        <g key={frequency}>
          <line x1={xOf(frequency)} y1="128" x2={xOf(frequency)} y2="133" stroke="currentColor" strokeOpacity="0.5" />
          <text
            x={xOf(frequency)}
            y="145"
            fill={frequency === 170 ? ACCENT : frequency === 180 ? SUPPORT : "currentColor"}
            fontSize="9.5"
            fontWeight={frequency === 170 || frequency === 180 ? 750 : 550}
            textAnchor="middle"
          >
            {frequency}
          </text>
        </g>
      ))}
      <text x="298" y="158" fill="currentColor" fontSize="8.8" opacity="0.58" textAnchor="end">frequency (Hz)</text>
      <text x="29" y="12" fill="currentColor" fontSize="8.8" opacity="0.58">one-sided magnitude</text>

      {markPeaks && (
        <g>
          {[170, 180].map((frequency, index) => {
            const value = magnitude(nSamples, frequency, "sum");
            const color = index === 0 ? ACCENT : SUPPORT;
            return (
              <g key={`peak-${frequency}`}>
                <circle cx={xOf(frequency)} cy={yOf(value)} fill="var(--panel)" r="3.5" stroke={color} strokeWidth="2" />
                <line x1={xOf(frequency)} y1={yOf(value) - 5} x2={xOf(frequency)} y2={yOf(value) - 14} stroke={color} strokeWidth="1" />
              </g>
            );
          })}
          <text x="242" y="25" fill="currentColor" fontSize="9" fontWeight="750" textAnchor="middle">two peaks</text>
        </g>
      )}
    </svg>
  );
}

type Panel = {
  number: number;
  title: string;
  detail: string;
  nSamples: number;
  transformLength: number;
  badge: string;
  badgeColor?: string;
  markPeaks?: boolean;
};

function PanelCard({ panel }: { panel: Panel }) {
  return (
    <section
      style={{
        background: "var(--panel)",
        border,
        borderRadius: 9,
        display: "grid",
        gridTemplateRows: "auto auto 1fr auto",
        minWidth: 0,
        padding: "9px 9px 8px",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 7 }}>
        <span
          style={{
            alignItems: "center",
            border: `1.4px solid ${panel.badgeColor ?? "currentColor"}`,
            borderRadius: "50%",
            color: panel.badgeColor ?? "currentColor",
            display: "inline-flex",
            flex: "0 0 21px",
            fontSize: 10.5,
            fontWeight: 800,
            height: 21,
            justifyContent: "center",
          }}
        >
          {panel.number}
        </span>
        <strong style={{ fontSize: 11.5 }}>{panel.title}</strong>
      </div>
      <div style={{ ...labelMuted, fontSize: 9.5, margin: "4px 0 1px 28px" }}>{panel.detail}</div>
      <SpectrumPlot nSamples={panel.nSamples} transformLength={panel.transformLength} markPeaks={panel.markPeaks} />
      <div
        style={{
          borderTop: border,
          color: panel.badgeColor ?? "currentColor",
          fontSize: 10.5,
          fontWeight: 750,
          paddingTop: 5,
          textAlign: "center",
        }}
      >
        {panel.badge}
      </div>
    </section>
  );
}

const panels: Panel[] = [
  {
    number: 1,
    title: "coarse DFT samples",
    detail: "64 acquired · L=64",
    nSamples: 64,
    transformLength: 64,
    badge: "Δf = 16 Hz",
  },
  {
    number: 2,
    title: "same data, denser samples",
    detail: "same 64 acquired + 960 exact zeros · L=1024",
    nSamples: 64,
    transformLength: 1024,
    badge: "same broad curve · Δf = 1 Hz",
    badgeColor: ACCENT,
  },
  {
    number: 3,
    title: "longer acquired record",
    detail: "256 acquired + 768 exact zeros · L=1024",
    nSamples: 256,
    transformLength: 1024,
    badge: "narrower response · two peaks",
    badgeColor: SUPPORT,
    markPeaks: true,
  },
];

const ledgerRows = [
  { label: "acquired N", values: ["64", "64", "256"], changed: [false, false, true] },
  { label: "transform L", values: ["64", "1024", "1024"], changed: [false, true, false] },
  { label: "aperture", values: ["62.5 ms", "62.5 ms", "250 ms"], changed: [false, false, true] },
  { label: "grid Δf", values: ["16 Hz", "1 Hz", "1 Hz"], changed: [false, true, false] },
  { label: "main-lobe width", values: ["32 Hz", "32 Hz", "8 Hz"], changed: [false, false, true] },
];

function ChangeLedger() {
  return (
    <section style={{ border, borderRadius: 9, marginTop: 9, overflow: "hidden" }}>
      <div
        className="pdr-ledger-head"
        style={{
          ...labelMuted,
          background: "var(--panel)",
          display: "grid",
          fontSize: 9.5,
          fontWeight: 750,
          gap: 0,
          gridTemplateColumns: "1.25fr repeat(3, 1fr)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        <span style={{ padding: "6px 8px" }}>what changed?</span>
        <span style={{ padding: "6px", textAlign: "center" }}>1 · N64/L64</span>
        <span style={{ padding: "6px", textAlign: "center" }}>2 · N64/L1024</span>
        <span style={{ padding: "6px", textAlign: "center" }}>3 · N256/L1024</span>
      </div>
      {ledgerRows.map((row) => (
        <div
          className="pdr-ledger-row"
          key={row.label}
          style={{
            borderTop: border,
            display: "grid",
            fontSize: 10.5,
            gridTemplateColumns: "1.25fr repeat(3, 1fr)",
          }}
        >
          <strong style={{ background: "var(--panel)", padding: "5px 8px" }}>{row.label}</strong>
          {row.values.map((value, index) => (
            <span
              key={`${row.label}-${index}`}
              style={{
                background: row.changed[index]
                  ? `color-mix(in srgb, ${index === 1 ? ACCENT : SUPPORT} 12%, transparent)`
                  : "transparent",
                color: row.changed[index] ? (index === 1 ? ACCENT : SUPPORT) : "currentColor",
                fontWeight: row.changed[index] ? 800 : 550,
                padding: "5px 6px",
                textAlign: "center",
              }}
            >
              {value}
            </span>
          ))}
        </div>
      ))}
    </section>
  );
}

export default function PaddingDurationResolution() {
  return (
    <div
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.3,
        margin: 0,
        maxWidth: 790,
        width: "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 460px) {
          .pdr-panels { grid-template-columns: minmax(0, 1fr) !important; gap: 8px !important; }
          .pdr-ledger-head { grid-template-columns: 1.15fr repeat(3, 1fr) !important; font-size: 8px !important; }
          .pdr-ledger-row { grid-template-columns: 1.15fr repeat(3, 1fr) !important; font-size: 9.5px !important; }
          .pdr-summary { align-items: flex-start !important; flex-direction: column !important; }
        }
      `}</style>

      <header style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "space-between", marginBottom: 7 }}>
        <strong style={{ fontSize: 13 }}>same underlying two-tone signal</strong>
        <M tex={String.raw`x[n]=\textcolor{${ACCENT}}{\cos(2\pi170n/1024)}+0.8\textcolor{${SUPPORT}}{\cos(2\pi180n/1024)}`} size={12.5} />
      </header>

      <div className="pdr-panels" style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {panels.map((panel) => <PanelCard key={panel.number} panel={panel} />)}
      </div>

      <ChangeLedger />

      <div
        className="pdr-summary"
        style={{
          alignItems: "center",
          borderTop: border,
          display: "flex",
          fontSize: 10.5,
          gap: "4px 14px",
          justifyContent: "center",
          marginTop: 9,
          paddingTop: 8,
        }}
      >
        <span><b style={{ color: ACCENT }}>zero padding:</b> denser samples of the same 64-sample curve</span>
        <span><b style={{ color: SUPPORT }}>more acquired data:</b> four-times narrower rectangular-window response</span>
      </div>
      <div style={{ ...labelMuted, fontSize: 10, marginTop: 4, textAlign: "center" }}>
        Main-lobe widths describe each tone kernel; interference in the two-tone sum can shift local maxima.
      </div>
    </div>
  );
}
