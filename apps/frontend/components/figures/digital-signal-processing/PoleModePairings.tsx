import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

type Case = {
  number: number;
  title: string;
  poleLabel: string;
  mode: string;
  samples: readonly number[];
  poles: readonly (readonly [number, number])[];
  classification: string;
  inside: boolean;
  angle?: number;
};

const cases: readonly Case[] = [
  {
    number: 1,
    title: "real decaying mode",
    poleLabel: String.raw`p=0.70`,
    mode: String.raw`0.70^n`,
    samples: [1, 0.7, 0.49, 0.343, 0.2401, 0.16807, 0.117649, 0.0823543, 0.05764801, 0.04035361],
    poles: [[0.7, 0]],
    classification: "inside · decays",
    inside: true,
  },
  {
    number: 2,
    title: "conjugate damped mode",
    poleLabel: String.raw`\rho=0.97`,
    mode: String.raw`0.97^n\cos(0.36\pi n)`,
    samples: [1, 0.41300591, -0.59975223, -0.8839997, -0.16588733, 0.69473042, 0.72993893, -0.05073366, -0.72870615, -0.55418459, 0.22787659, 0.70966104, 0.37177933],
    poles: [[0.4130059128, 0.8776822409], [0.4130059128, -0.8776822409]],
    classification: "inside · oscillates and decays",
    inside: true,
    angle: 0.36 * Math.PI,
  },
  {
    number: 3,
    title: "conjugate growing mode",
    poleLabel: String.raw`\rho=1.02`,
    mode: String.raw`1.02^n\cos(0.36\pi n)`,
    samples: [1, 0.43429488, -0.66317592, -1.0278682, -0.20282756, 0.89322013, 0.98686365, -0.07212657, -1.08938134, -0.87118499, 0.37668999, 1.23356993, 0.67955794],
    poles: [[0.4342948774, 0.9229235935], [0.4342948774, -0.9229235935]],
    classification: "outside · oscillates and grows",
    inside: false,
    angle: 0.36 * Math.PI,
  },
];

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";

function PolePlane({ item }: { item: Case }) {
  const cx = 95;
  const cy = 58;
  const scale = 40;
  const angleEnd = item.angle === undefined
    ? undefined
    : [cx + 22 * Math.cos(item.angle), cy - 22 * Math.sin(item.angle)];

  return (
    <svg
      aria-label={`Pole plane for ${item.title}`}
      role="img"
      style={{ display: "block", height: "auto", width: "100%" }}
      viewBox="0 0 190 112"
    >
      <line x1="47" y1={cy} x2="143" y2={cy} stroke="currentColor" strokeOpacity="0.42" />
      <line x1={cx} y1="10" x2={cx} y2="106" stroke="currentColor" strokeOpacity="0.42" />
      <circle cx={cx} cy={cy} r={scale} fill="none" stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.42" />
      <text x="137" y="70" fill="currentColor" fontSize="8.5" opacity="0.58">real</text>
      <text x="99" y="14" fill="currentColor" fontSize="8.5" opacity="0.58">imag.</text>
      <text x="53" y="22" fill="currentColor" fontSize="8.2" opacity="0.58">unit circle</text>

      {item.poles.slice(0, 1).map(([x, y]) => (
        <line
          key="radius"
          x1={cx}
          y1={cy}
          x2={cx + x * scale}
          y2={cy - y * scale}
          stroke={ACCENT}
          strokeWidth="1.6"
        />
      ))}
      {angleEnd && (
        <path
          d={`M ${cx + 22} ${cy} A 22 22 0 0 0 ${angleEnd[0]} ${angleEnd[1]}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.7"
          strokeWidth="1"
        />
      )}
      {item.angle !== undefined && (
        <text x="116" y="43" fill="currentColor" fontSize="8.2" opacity="0.72">angle</text>
      )}
      {item.poles.map(([x, y], index) => (
        <g key={`${x}-${y}`}>
          <circle cx={cx + x * scale} cy={cy - y * scale} r="4.2" fill={ACCENT} />
          <circle cx={cx + x * scale} cy={cy - y * scale} r="6.1" fill="none" stroke={ACCENT} strokeOpacity="0.35" />
          {index === 0 && (
            <text
              x={cx + x * scale + 7}
              y={cy - y * scale - 5}
              fill={ACCENT}
              fontSize="8.2"
              fontWeight="700"
            >
              pole
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function StemPlot({ item }: { item: Case }) {
  const left = 13;
  const right = 181;
  const top = 8;
  const bottom = 94;
  const zero = (top + bottom) / 2;
  const amplitudeScale = (bottom - top) / 2 / 1.3;
  const x = (index: number) => left + (index / (item.samples.length - 1)) * (right - left);
  const y = (value: number) => zero - value * amplitudeScale;

  return (
    <svg
      aria-label={`Discrete samples of ${item.title} on the common amplitude scale minus 1.3 to 1.3`}
      role="img"
      style={{ display: "block", height: "auto", width: "100%" }}
      viewBox="0 0 190 110"
    >
      <line x1={left} y1={zero} x2={right} y2={zero} stroke="currentColor" strokeOpacity="0.38" />
      <line x1={left} y1={top} x2={left} y2={bottom} stroke="currentColor" strokeOpacity="0.38" />
      <text x="1" y="11" fill="currentColor" fontSize="8" opacity="0.55">1.3</text>
      <text x="0" y="96" fill="currentColor" fontSize="8" opacity="0.55">−1.3</text>
      <text x={left} y="106" fill="currentColor" fontSize="8" opacity="0.55">0</text>
      <text x={right - 7} y="106" fill="currentColor" fontSize="8" opacity="0.55">{item.samples.length - 1}</text>
      <text x="78" y="106" fill="currentColor" fontSize="8" opacity="0.55">integer n</text>
      {item.samples.map((sample, index) => (
        <g key={index}>
          <line x1={x(index)} y1={zero} x2={x(index)} y2={y(sample)} stroke={SUPPORT} strokeWidth="1.45" />
          <circle cx={x(index)} cy={y(sample)} r="2.5" fill={SUPPORT} />
        </g>
      ))}
    </svg>
  );
}

function ModeCard({ item }: { item: Case }) {
  return (
    <section
      className="pmp-card"
      style={{
        background: "var(--panel)",
        border,
        borderRadius: 10,
        minWidth: 0,
        padding: "10px 9px 9px",
      }}
    >
      <div style={{ alignItems: "center", display: "flex", gap: 7, minHeight: 34 }}>
        <span
          style={{
            alignItems: "center",
            border: `1.5px solid ${ACCENT}`,
            borderRadius: "50%",
            color: ACCENT,
            display: "inline-flex",
            flex: "0 0 23px",
            fontSize: 11,
            fontWeight: 750,
            height: 23,
            justifyContent: "center",
            width: 23,
          }}
        >
          {item.number}
        </span>
        <strong style={{ fontSize: 11.5, lineHeight: 1.2 }}>{item.title}</strong>
      </div>

      <PolePlane item={item} />
      <div className="pmp-math" style={{ display: "flex", flexWrap: "wrap", gap: "3px 9px", justifyContent: "center", minHeight: 38, textAlign: "center" }}>
        <M tex={String.raw`\textcolor{${ACCENT}}{${item.poleLabel}}`} size={11.5} />
        {item.angle !== undefined && <M tex={String.raw`\omega_0=0.36\pi\ \mathrm{rad/sample}`} size={10.5} />}
      </div>

      <div style={{ borderTop: border, paddingTop: 6 }}>
        <div className="pmp-math" style={{ color: SUPPORT, minHeight: 27, textAlign: "center" }}>
          <M tex={String.raw`y_h[n]=\textcolor{${SUPPORT}}{${item.mode}}`} size={10.5} />
        </div>
        <StemPlot item={item} />
      </div>

      <div
        className="pmp-classification"
        style={{
          border: `1px solid ${item.inside ? OK : "color-mix(in srgb, currentColor 30%, transparent)"}`,
          borderRadius: 999,
          color: item.inside ? OK : undefined,
          fontSize: 9.5,
          fontWeight: 750,
          letterSpacing: "0.025em",
          padding: "4px 6px",
          textAlign: "center",
        }}
      >
        {item.classification}
      </div>
    </section>
  );
}

export default function PoleModePairings() {
  return (
    <figure
      style={{
        fontFamily: "system-ui, sans-serif",
        margin: 0,
        maxWidth: 672,
      }}
    >
      <style>{`
        @media (max-width: 420px) {
          .pmp-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .pmp-card { padding: 12px !important; }
          .pmp-card strong { font-size: 13px !important; }
          .pmp-card svg text { font-size: 10px !important; }
          .pmp-math > span { font-size: 13px !important; }
          .pmp-classification { font-size: 12px !important; }
          .pmp-caption { font-size: 12px !important; line-height: 1.45; }
        }
      `}</style>
      <div
        style={{
          alignItems: "center",
          borderBottom: border,
          display: "flex",
          flexWrap: "wrap",
          gap: "5px 18px",
          justifyContent: "center",
          marginBottom: 9,
          paddingBottom: 9,
        }}
      >
        <span style={{ color: ACCENT, fontSize: 11.5, fontWeight: 750 }}>
          radius = envelope
        </span>
        <M tex={String.raw`r=\rho e^{\pm j\omega_0}`} size={12.5} />
        <span style={{ fontSize: 11.5, fontWeight: 750 }}>
          angle = oscillation
        </span>
      </div>

      <div className="pmp-grid" style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 205px), 1fr))" }}>
        {cases.map((item) => <ModeCard item={item} key={item.number} />)}
      </div>

      <figcaption className="pmp-caption" style={{ ...labelMuted, fontSize: 10.5, marginTop: 8, textAlign: "center" }}>
        All stem plots share amplitude scale <M tex={String.raw`[-1.3,1.3]`} size={10.5} />. Cards 2 and 3 hold angle fixed and change only radius.
      </figcaption>
    </figure>
  );
}
