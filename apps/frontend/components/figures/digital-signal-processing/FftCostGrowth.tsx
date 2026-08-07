import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";

const anchors = [
  { n: 8, direct: 64, fft: 12, ratio: "5.33×" },
  { n: 16, direct: 256, fft: 32, ratio: "8×" },
  { n: 64, direct: 4096, fft: 192, ratio: "21.33×" },
  { n: 256, direct: 65536, fft: 1024, ratio: "64×" },
  { n: 1024, direct: 1048576, fft: 5120, ratio: "204.8×" },
] as const;

const chartNs = [8, 16, 32, 64, 128, 256, 512, 1024];
const xOf = (n: number) => 72 + ((Math.log2(n) - 3) / 7) * 468;
const yOf = (value: number) => 225 - ((Math.log10(value) - 1) / 5.1) * 174;
const pathFor = (value: (n: number) => number) =>
  chartNs.map((n, index) => `${index === 0 ? "M" : "L"}${xOf(n).toFixed(1)},${yOf(value(n)).toFixed(1)}`).join(" ");

const directPath = pathFor((n) => n * n);
const fftPath = pathFor((n) => (n / 2) * Math.log2(n));

const numberLabel = (value: number) =>
  ({ 64: "64", 256: "256", 4096: "4,096", 65536: "65,536", 1048576: "1,048,576", 12: "12", 32: "32", 192: "192", 1024: "1,024", 5120: "5,120" })[value] ?? String(value);

function GrowthChart() {
  const yTicks = [10, 100, 1000, 10000, 100000, 1000000];
  const yLabels = ["10", "100", "1k", "10k", "100k", "1M"];
  return (
    <svg
      aria-label="Log-scale chart of direct complex-product slots and radix-two twiddle slots for powers of two from eight through one thousand twenty-four"
      role="img"
      style={{ display: "block", height: "auto", width: "100%" }}
      viewBox="0 0 620 275"
    >
      {yTicks.map((tick, index) => (
        <g key={tick}>
          <line x1="72" y1={yOf(tick)} x2="548" y2={yOf(tick)} stroke="currentColor" strokeDasharray="3 5" strokeOpacity="0.12" />
          <text x="63" y={yOf(tick) + 4} fill="currentColor" fontSize="11" opacity="0.58" textAnchor="end">{yLabels[index]}</text>
        </g>
      ))}
      <line x1="72" y1="225" x2="552" y2="225" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
      <line x1="72" y1="225" x2="72" y2="45" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
      {anchors.map(({ n }) => (
        <g key={n}>
          <line x1={xOf(n)} y1="225" x2={xOf(n)} y2="231" stroke="currentColor" strokeOpacity="0.55" />
          <text x={xOf(n)} y="247" fill="currentColor" fontSize="11" opacity="0.65" textAnchor="middle">{n}</text>
        </g>
      ))}
      <text x="310" y="269" fill="currentColor" fontSize="12" opacity="0.7" textAnchor="middle">transform length N · powers of two</text>
      <text x="18" y="137" fill="currentColor" fontSize="12" fontWeight="650" textAnchor="middle" transform="rotate(-90 18 137)">complex-product slots</text>

      <path d={directPath} fill="none" stroke={ACCENT} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <path d={fftPath} fill="none" stroke={SUPPORT} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {anchors.map(({ n, direct, fft }) => (
        <g key={`points-${n}`}>
          <circle cx={xOf(n)} cy={yOf(direct)} fill="var(--paper)" r="4" stroke={ACCENT} strokeWidth="2.4" />
          <circle cx={xOf(n)} cy={yOf(fft)} fill="var(--paper)" r="4" stroke={SUPPORT} strokeWidth="2.4" />
        </g>
      ))}
      <text x="551" y={yOf(1048576) + 4} fill={ACCENT} fontSize="12" fontWeight="750">direct</text>
      <text x="551" y={yOf(5120) + 4} fill={SUPPORT} fontSize="12" fontWeight="750">radix-2</text>
    </svg>
  );
}

function FormulaKey() {
  return (
    <div style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", marginBottom: 5 }}>
      <div style={{ border, borderLeft: `4px solid ${ACCENT}`, borderRadius: 7, padding: "9px 12px" }}>
        <div style={{ color: ACCENT, fontSize: 12, fontWeight: 800, letterSpacing: ".02em", textTransform: "uppercase" }}>direct products</div>
        <M display tex={String.raw`\textcolor{${ACCENT}}{P_{\mathrm{direct}}(N)=N^2}`} />
      </div>
      <div style={{ border, borderLeft: `4px solid ${SUPPORT}`, borderRadius: 7, padding: "9px 12px" }}>
        <div style={{ color: SUPPORT, fontSize: 12, fontWeight: 800, letterSpacing: ".02em", textTransform: "uppercase" }}>radix-2 twiddle slots</div>
        <M display tex={String.raw`\textcolor{${SUPPORT}}{P_{\mathrm{FFT}}(N)=\frac{N}{2}\log_2 N}`} />
        <div style={{ ...labelMuted, fontSize: 10.5, marginTop: -4 }}>trivial twiddles still count as slots</div>
      </div>
    </div>
  );
}

function AnchorLedger() {
  return (
    <div style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(auto-fit, minmax(104px, 1fr))" }}>
      {anchors.map(({ n, direct, fft, ratio }) => (
        <div key={n} style={{ background: "var(--panel)", border, borderRadius: 7, minWidth: 0, padding: "7px 8px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 5 }}>N = {n}</div>
          <div style={{ color: ACCENT, fontSize: 10.5 }}><strong>{numberLabel(direct)}</strong> direct</div>
          <div style={{ color: SUPPORT, fontSize: 10.5 }}><strong>{numberLabel(fft)}</strong> twiddle</div>
          <div style={{ ...labelMuted, fontSize: 10, marginTop: 4 }}>direct ÷ FFT = {ratio}</div>
        </div>
      ))}
    </div>
  );
}

function RuntimeStrip() {
  return (
    <div style={{ alignItems: "center", border, borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", padding: "9px 12px" }}>
      <div style={{ minWidth: 210 }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>Measured crossover: run on this device</div>
        <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 3 }}>Counts predict growth, not a universal elapsed-time boundary.</div>
      </div>
      <svg aria-label="Uncalibrated timing traces with an unknown crossover" role="img" viewBox="0 0 190 54" style={{ flex: "1 1 190px", height: 54, maxWidth: 250 }}>
        <line x1="8" y1="46" x2="184" y2="46" stroke="currentColor" strokeOpacity="0.35" />
        <path d="M12 40 C55 39 96 31 178 9" fill="none" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.26" strokeWidth="1.5" />
        <path d="M12 16 C58 18 100 29 178 39" fill="none" stroke="currentColor" strokeDasharray="2 5" strokeOpacity="0.26" strokeWidth="1.5" />
        <circle cx="96" cy="27" r="10" fill="var(--panel)" stroke="currentColor" strokeOpacity="0.4" />
        <text x="96" y="31" fill="currentColor" fontSize="13" fontWeight="800" opacity="0.65" textAnchor="middle">?</text>
        <text x="181" y="53" fill="currentColor" fontSize="8.5" opacity="0.55" textAnchor="end">implementation + machine</text>
      </svg>
    </div>
  );
}

export default function FftCostGrowth() {
  return (
    <div style={{ color: "currentColor", fontFamily: "system-ui, sans-serif", margin: "0 auto", maxWidth: 680 }}>
      <FormulaKey />
      <GrowthChart />
      <AnchorLedger />
      <div style={{ alignItems: "center", border, borderRadius: 7, display: "flex", flexWrap: "wrap", gap: "5px 14px", margin: "8px 0", padding: "8px 11px" }}>
        <strong style={{ fontSize: 11.5 }}>N=8 additions · counted separately, not plotted</strong>
        <span style={{ color: ACCENT, fontSize: 11 }}>direct: 56</span>
        <span style={{ color: SUPPORT, fontSize: 11 }}>radix-2: 24</span>
      </div>
      <RuntimeStrip />
    </div>
  );
}
