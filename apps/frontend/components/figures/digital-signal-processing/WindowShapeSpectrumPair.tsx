import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const N = 64, FLOOR = -110, X_MIN = -12, X_MAX = 12;
type Spec = { name: string; short: string; color: string; dash?: string; null: number; peak: string; falloff: string; formula: string[]; kind: number };
const specs: Spec[] = [
  { name: "Rectangular", short: "R", color: ACCENT, null: 1, peak: "−13.25 dB", falloff: "≈ 6 dB/oct", formula: [String.raw`w_R[n]=1`], kind: 0 },
  { name: "Periodic Hann", short: "H", color: SUPPORT, null: 2, peak: "−31.47 dB", falloff: "≈ 18 dB/oct", formula: [String.raw`w_H[n]=0.5-0.5\cos(2\pi n/N)`], kind: 1 },
  { name: "Periodic Hamming", short: "M", color: OK, dash: "7 3", null: 2, peak: "−42.45 dB", falloff: "≈ 6 dB/oct", formula: [String.raw`w_M[n]=0.54-0.46\cos(2\pi n/N)`], kind: 2 },
  { name: "4-term Blackman–Harris", short: "B", color: "currentColor", dash: "2.5 3", null: 4, peak: "−92.01 dB", falloff: "not used to rank", formula: [String.raw`w_B[n]=0.35875-0.48829\cos(2\pi n/N)`, String.raw`\quad+0.14128\cos(4\pi n/N)-0.01168\cos(6\pi n/N)`], kind: 3 },
];
const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";

function weight(kind: number, n: number) {
  const a = 2 * Math.PI * n / N;
  if (kind === 0) return 1;
  if (kind === 1) return .5 - .5 * Math.cos(a);
  if (kind === 2) return .54 - .46 * Math.cos(a);
  return .35875 - .48829 * Math.cos(a) + .14128 * Math.cos(2 * a) - .01168 * Math.cos(3 * a);
}
function response(kind: number, bins: number) {
  let re = 0, im = 0, sum = 0;
  for (let n = 0; n < N; n++) { const w = weight(kind, n), a = -2 * Math.PI * bins * n / N; re += w * Math.cos(a); im += w * Math.sin(a); sum += w; }
  return Math.max(FLOOR, 20 * Math.log10(Math.hypot(re, im) / sum));
}
const tx = (n: number) => 24 + 190 * n / (N - 1), ty = (v: number) => 78 - 54 * v;
const sx = (b: number) => 38 + 394 * (b - X_MIN) / (X_MAX - X_MIN), sy = (db: number) => 12 + 104 * (0 - db) / (0 - FLOOR);
const timePath = (kind: number) => Array.from({ length: N }, (_, n) => `${n ? "L" : "M"}${tx(n).toFixed(2)},${ty(weight(kind, n)).toFixed(2)}`).join(" ");
const spectrumPath = (kind: number) => Array.from({ length: 1201 }, (_, i) => { const b = X_MIN + (X_MAX - X_MIN) * i / 1200; return `${i ? "L" : "M"}${sx(b).toFixed(2)},${sy(response(kind, b)).toFixed(2)}`; }).join(" ");

function TimePlot({ spec }: { spec: Spec }) {
  return <div><div style={{ ...labelMuted, fontSize: 9.5, fontWeight: 750, marginBottom: 2, textTransform: "uppercase" }}>time shape · half-open record</div>
    <svg viewBox="0 0 230 98" style={{ display: "block", width: "100%" }} aria-hidden="true">
      <line x1="24" x2="214" y1="78" y2="78" stroke="currentColor" opacity=".28"/><line x1="24" x2="24" y1="20" y2="80" stroke="currentColor" opacity=".28"/>
      <line x1="24" x2="214" y1="24" y2="24" stroke="currentColor" opacity=".1"/><path d={timePath(spec.kind)} fill="none" stroke={spec.color} strokeDasharray={spec.dash} strokeWidth="2.4"/>
      <circle cx={tx(0)} cy={ty(weight(spec.kind, 0))} r="3" fill={spec.color}/><circle cx={tx(63)} cy={ty(weight(spec.kind, 63))} r="3" fill={spec.color}/>
      <text x="18" y="28" textAnchor="end" fill="currentColor" fontSize="9">1</text><text x="18" y="82" textAnchor="end" fill="currentColor" fontSize="9">0</text>
      <text x="24" y="94" textAnchor="middle" fill="currentColor" fontSize="9">0</text><text x="214" y="94" textAnchor="middle" fill="currentColor" fontSize="9">63</text><text x="119" y="94" textAnchor="middle" fill="currentColor" fontSize="9">sample n</text>
    </svg></div>;
}

function SpectrumPlot({ spec }: { spec: Spec }) {
  const left = sx(-spec.null), right = sx(spec.null);
  return <div style={{ minWidth: 0 }}><div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "3px 12px", justifyContent: "space-between", marginBottom: 2 }}>
      <span style={{ ...labelMuted, fontSize: 9.5, fontWeight: 750, textTransform: "uppercase" }}>normalized dense direct-DTFT</span>
      <span style={{ fontSize: 9.5 }}><b>peak sidelobe</b> {spec.peak} · <b>far falloff</b> {spec.falloff}</span>
    </div>
    <div className="wssp-scroll" style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}>
    <svg viewBox="0 0 450 142" style={{ display: "block", width: "100%", minWidth: 520 }} aria-hidden="true">
      {[0, -55, -110].map((db) => <g key={db}><line x1="38" x2="432" y1={sy(db)} y2={sy(db)} stroke="currentColor" opacity=".12"/><text x="33" y={sy(db) + 3} textAnchor="end" fill="currentColor" fontSize="9">{db}</text></g>)}
      {[-spec.null, spec.null].map((b) => <line key={b} x1={sx(b)} x2={sx(b)} y1="10" y2="120" stroke={spec.color} strokeDasharray="3 3" opacity=".6"/>)}
      <path d={spectrumPath(spec.kind)} fill="none" stroke={spec.color} strokeDasharray={spec.dash} strokeWidth="2"/>
      <line x1={left} x2={right} y1="126" y2="126" stroke={spec.color}/><line x1={left} x2={left} y1="122" y2="130" stroke={spec.color}/><line x1={right} x2={right} y1="122" y2="130" stroke={spec.color}/>
      <text x={(left + right) / 2} y="138" textAnchor="middle" fill={spec.color} fontSize="9.5" fontWeight="700">first nulls ±{spec.null} · width {2 * spec.null} bins</text>
      <text x="38" y="138" textAnchor="middle" fill="currentColor" fontSize="9">−12</text><text x="432" y="138" textAnchor="middle" fill="currentColor" fontSize="9">12</text><text x="432" y="9" textAnchor="end" fill="currentColor" fontSize="9">dB · current-record bins</text>
    </svg></div></div>;
}

function WindowRow({ spec }: { spec: Spec }) {
  return <section style={{ borderTop: border, padding: "10px 0 11px" }}>
    <header style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "4px 14px", marginBottom: 7 }}>
      <strong style={{ color: spec.color, fontSize: 13.5, minWidth: 158 }}>{spec.name}</strong>
      <div style={{ display: "grid", fontSize: 12, gap: 1 }}>{spec.formula.map((formula) => <M key={formula} color={spec.color} tex={formula} size={11.5}/>)}</div>
    </header>
    <div className="wssp-pair" style={{ alignItems: "start", display: "grid", gap: 14, gridTemplateColumns: "220px minmax(0, 1fr)" }}><TimePlot spec={spec}/><SpectrumPlot spec={spec}/></div>
  </section>;
}

export default function WindowShapeSpectrumPair() {
  return <div role="img" aria-label="Four periodic 64-sample windows shown as aligned time shapes and normalized dense direct-DTFT spectra. Rectangular has first nulls at plus or minus one bin and a minus 13.25 decibel peak sidelobe; Hann and Hamming have first nulls at plus or minus two bins, with Hamming at minus 42.45 decibels; four-term Blackman-Harris has first nulls at plus or minus four bins and a minus 92.01 decibel peak sidelobe." style={{ color: "currentColor", fontFamily: "system-ui, sans-serif", lineHeight: 1.25, maxWidth: 780, minWidth: 0, width: "100%" }}>
    <style>{`@media(max-width:620px){.wssp-pair{grid-template-columns:minmax(0,1fr)!important;gap:5px!important}.wssp-pair>div:first-child{max-width:260px}.wssp-scroll{scrollbar-gutter:stable}}`}</style>
    <header style={{ marginBottom: 9 }}><div style={{ ...labelMuted, fontSize: 10, fontWeight: 800, letterSpacing: ".055em", textTransform: "uppercase" }}>periodic coefficients · N=64 · one common −110…0 dB scale</div>
      <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "2px 8px", marginTop: 3 }}><strong style={{ fontSize: 15 }}>Endpoint behavior redistributes one spectral kernel</strong><M tex={String.raw`20\log_{10}\!\left(|W(e^{j\omega})|/|W(1)|\right)`} size={12}/></div>
    </header>
    {specs.map((spec) => <WindowRow key={spec.short} spec={spec}/>)}
    <footer style={{ ...labelMuted, fontSize: 10, marginTop: 2 }}>Dashed vertical guides mark exact first nulls. Peak sidelobe and far falloff are separate measurements; neither is inferred from main-lobe width alone.</footer>
  </div>;
}
