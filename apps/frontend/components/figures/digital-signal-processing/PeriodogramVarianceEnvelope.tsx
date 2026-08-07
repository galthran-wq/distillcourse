import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const shortCurves = [
  [0.16,0.141,1.217,1.308,1.621,1.349,2.877,1.47,1.005,0.108,0.402,2.551,4,0.145,3.313,4,3.64],
  [0.586,0.758,1.347,0.225,0.06,1.254,0.203,1.425,1.256,1.51,0.204,1.172,1.517,0.315,0.252,0.849,0.111],
  [0.527,2.319,0.145,2.417,0.323,1.265,0.38,3.147,0.329,0.562,0.211,0.909,2.593,1.206,0.377,1.466,0.111],
  [0.233,0.802,0.707,4,0.652,2.111,1.044,2.423,1.233,2.609,1.194,0.462,0.735,1.486,1.258,0.402,0.731],
  [0.03,0.085,0.649,0.19,0.227,0.215,0.734,2.373,0.112,0.247,0.819,1.292,0.375,0.608,1.813,1.537,0.369],
  [0.799,0.545,0.448,0.501,0.542,0.489,0.278,1.035,0.357,2.404,0.711,0.163,0.605,0.977,0.547,0.038,0.817],
  [0.721,3.785,0.748,0.344,0.263,0.203,1.329,1.881,0.654,3.121,1.54,1.196,2.342,3.263,2.369,0.736,0.283],
  [0.006,0.487,0.043,0.202,0.438,0.814,0.525,1.049,3.225,1.286,4,1.7,0.286,0.848,0.359,0.204,0.61],
];

const longCurves = [
  [0.595,0.25,0.797,1.274,1.33,0.147,0.117,4,2.162,1.303,0.75,0.439,4,0.041,0.402,4,0.486],
  [0.613,0.299,0.543,0.084,0.239,0.319,0.657,0.261,0.243,0.275,0.032,1.701,0.683,0.196,1.206,2.507,1.491],
  [0.334,0.167,0.541,1.681,2.029,1.714,0.459,0.311,1.218,2.729,0.93,1.512,0.744,0.145,2.535,2.048,0.003],
  [2.156,0.112,0.588,0.498,0.252,1.118,0.916,2.106,0.075,0.377,0.28,0.375,1.836,0.762,0.974,0.597,0.569],
  [1.831,0.887,2.91,3.314,0.059,2.192,0.922,0.723,0.581,1.049,1.222,0.73,1.912,1.094,0.363,0.715,0.581],
  [1.176,4,0.601,1.249,1.693,2.387,3.989,0.843,0.871,0.184,0.563,0.381,0.003,0.191,1.286,0.446,0.229],
  [0.181,0.604,0.668,1.094,1.804,1.452,1.305,0.12,0.043,1.483,0.064,0.677,0.11,0.532,3.199,0.731,0.968],
  [0.688,0.622,0.535,0.119,0.631,0.253,0.111,0.321,1.269,1.21,0.134,0.981,0.087,0.09,0.301,0.591,3.536],
];

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";

function SpectrumPanel({
  title, curves, mean, sd, cv,
}: { title: string; curves: number[][]; mean: number; sd: number; cv: number }) {
  const left = 34, right = 340, top = 24, bottom = 176;
  const path = (values: number[]) => values.map((v, i) => {
    const x = left + i * (right - left) / (values.length - 1);
    const y = bottom - Math.min(v, 4) / 4 * (bottom - top);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <section style={{ border, borderRadius: 9, minWidth: 0, overflow: "hidden", padding: "9px 9px 8px" }}>
      <strong style={{ fontSize: 13 }}>{title}</strong>
      <div style={{ ...labelMuted, fontSize: 12, marginTop: 2 }}>eight frozen traces from seed 0x5eedc0de · same PSD = 1</div>
      <div style={{ maxWidth: "100%", overflowX: "auto" }}>
        <svg viewBox="0 0 370 210" role="img" aria-label={`${title}: eight seeded raw periodograms fluctuate around the flat unit PSD`} style={{ display: "block", minWidth: 370, width: "100%" }}>
          {[0,1,2,3,4].map(v => <g key={v}><line x1={left} x2={right} y1={bottom-v/4*(bottom-top)} y2={bottom-v/4*(bottom-top)} stroke="currentColor" opacity=".09"/><text x={left-7} y={bottom-v/4*(bottom-top)+4} textAnchor="end" fill="currentColor" opacity=".55" fontSize="12">{v}</text></g>)}
          {curves.map((values, i) => <path key={i} d={path(values)} fill="none" stroke={i === 0 ? ACCENT : "currentColor"} strokeWidth={i === 0 ? 2.3 : 1.1} strokeOpacity={i === 0 ? 1 : .22} strokeDasharray={i === 0 ? undefined : i % 2 ? "3 3" : undefined}/>) }
          <line x1={left} x2={right} y1={bottom-(bottom-top)/4} y2={bottom-(bottom-top)/4} stroke={SUPPORT} strokeWidth="2.5"/>
          <line x1={left} x2={right} y1={bottom} y2={bottom} stroke="currentColor" opacity=".5"/>
          <text x={(left+right)/2} y="201" textAnchor="middle" fill="currentColor" fontSize="12">frequency f (cycles/sample)</text>
          <text x={right-3} y={bottom-(bottom-top)/4-7} textAnchor="end" fill={SUPPORT} fontSize="12" fontWeight="700">ensemble target S(f)=1</text>
          <text x={right-3} y="17" textAnchor="end" fill={ACCENT} fontSize="12" fontWeight="700">selected realization — solid</text>
        </svg>
      </div>
      <div style={{ borderTop: border, display: "grid", fontVariantNumeric: "tabular-nums", gap: 4, gridTemplateColumns: "repeat(3, minmax(0,1fr))", paddingTop: 7, textAlign: "center" }}>
        <span><b style={{ color: SUPPORT, fontSize: 12 }}>mean</b><br/><span style={{ fontSize: 12 }}>{mean.toFixed(6)}</span></span>
        <span><b style={{ fontSize: 12 }}>SD</b><br/><span style={{ fontSize: 12 }}>{sd.toFixed(6)}</span></span>
        <span><b style={{ color: ACCENT, fontSize: 12 }}>CV</b><br/><span style={{ fontSize: 12 }}>{cv.toFixed(6)}</span></span>
      </div>
    </section>
  );
}

export default function PeriodogramVarianceEnvelope() {
  return (
    <figure aria-label="Short and long white-noise periodograms have different frequency detail but retain a similarly broad distribution of power at one fixed frequency." style={{ color: "currentColor", containerType: "inline-size", fontFamily: "system-ui, sans-serif", lineHeight: 1.35, margin: 0, maxWidth: 790, minWidth: 0, width: "100%" }}>
      <style>{`@container(max-width:760px){.pve-grid{grid-template-columns:minmax(0,1fr)!important}.pve-formula{align-items:flex-start!important;flex-direction:column!important}}`}</style>
      <header style={{ marginBottom: 10 }}><strong style={{ fontSize: 16 }}>More samples do not tame one raw periodogram ordinate</strong><div style={{ ...labelMuted, marginTop: 3 }}>Circular complex white noise · 96 trials · probe f=0.25 cycles/sample · values clipped at 4 only in the display</div></header>
      <div className="pve-grid" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(2,minmax(0,1fr))" }}>
        <SpectrumPanel title="short record · N=256" curves={shortCurves} mean={0.931794} sd={0.785987} cv={0.843520}/>
        <SpectrumPanel title="long record · N=16,384" curves={longCurves} mean={0.871399} sd={0.924583} cv={1.061033}/>
      </div>
      <figcaption className="pve-formula" style={{ alignItems: "center", border, borderRadius: 8, display: "flex", gap: "5px 18px", justifyContent: "center", marginTop: 10, padding: "9px 12px", textAlign: "center" }}>
        <span style={{ color: SUPPORT, fontSize: 12, fontWeight: 750 }}>bias can shrink</span><M tex={String.raw`\operatorname{CV}\{\widehat S_N(f)\}=O(1)`} size={13}/><span style={{ color: ACCENT, fontSize: 12, fontWeight: 750 }}>variance persists</span>
      </figcaption>
    </figure>
  );
}
