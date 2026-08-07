import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

function SampleStrip({ mobile = false }: { mobile?: boolean }) {
  const w = mobile ? 310 : 650;
  const xs = mobile ? [25, 77, 129, 181, 233, 285] : [45, 155, 265, 375, 485, 595];
  const ys = mobile ? [31, 16, 38, 20, 30, 13] : [34, 16, 42, 21, 33, 13];
  const base = mobile ? 48 : 52;
  return (
    <svg viewBox={`0 0 ${w} 66`} role="img" aria-label="One shared discrete sample sequence feeds both reconstruction branches." style={{ display: "block", width: "100%" }}>
      <line x1="12" y1={base} x2={w - 12} y2={base} stroke="currentColor" strokeOpacity=".4" />
      {xs.map((x, i) => <g key={x}><line x1={x} y1={base} x2={x} y2={ys[i]} stroke="currentColor" strokeWidth="1.5" /><circle cx={x} cy={ys[i]} r="3.4" fill="currentColor" /></g>)}
      <text x={w / 2} y="64" textAnchor="middle" fill="currentColor" opacity=".58" fontSize="10">same x[n] · spacing Tₛ</text>
    </svg>
  );
}

function IdealSpectrum() {
  return (
    <svg viewBox="0 0 310 118" role="img" aria-label="Ideal gain-T-s brick-wall response retains the strictly interior baseband and removes neighboring images." style={{ display: "block", width: "100%" }}>
      <line x1="24" y1="89" x2="294" y2="89" stroke="currentColor" strokeOpacity=".45" />
      <line x1="24" y1="13" x2="24" y2="89" stroke="currentColor" strokeOpacity=".45" />
      <path d="M24 89 L24 31 L112 31 L112 89" fill="none" stroke={SUPPORT} strokeWidth="2.5" />
      <path d="M42 89 L58 66 L74 89 M166 89 L185 61 L204 89 M228 89 L247 61 L266 89" fill="none" stroke="currentColor" strokeDasharray="4 4" strokeOpacity=".3" />
      <path d="M177 60 l16 16 M193 60 l-16 16 M239 60 l16 16 M255 60 l-16 16" stroke="currentColor" strokeWidth="2" />
      <text x="31" y="25" fill={SUPPORT} fontSize="10" fontWeight="650">gain Tₛ</text>
      <text x="63" y="105" textAnchor="middle" fill="currentColor" fontSize="9.5">interior baseband</text>
      <text x="112" y="116" textAnchor="middle" fill="currentColor" opacity=".6" fontSize="10">fₛ/2</text>
      <text x="230" y="49" textAnchor="middle" fill="currentColor" fontSize="10">images removed</text>
    </svg>
  );
}

function HoldSpectrum() {
  const x = (r: number) => 24 + (r / 1.5) * 254;
  const y = (r: number) => 88 - r * 58;
  const sinc = (r: number) => r === 0 ? 1 : Math.abs(Math.sin(Math.PI * r) / (Math.PI * r));
  const path = Array.from({ length: 181 }, (_, i) => {
    const r = i / 120;
    return `${i ? "L" : "M"}${x(r).toFixed(2)},${y(sinc(r)).toFixed(2)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 310 126" role="img" aria-label="The zero-order-hold magnitude has relative gain one at zero, two over pi at half the sample rate, a first null at the sample rate, and residual image lobes around that null." style={{ display: "block", width: "100%" }}>
      <line x1="24" y1="88" x2="294" y2="88" stroke="currentColor" strokeOpacity=".45" />
      <line x1="24" y1="18" x2="24" y2="88" stroke="currentColor" strokeOpacity=".45" />
      <path d={path} fill="none" stroke={ACCENT} strokeWidth="2.5" />
      <line x1={x(.5)} y1={y(2 / Math.PI)} x2={x(.5)} y2="88" stroke="currentColor" strokeDasharray="3 3" strokeOpacity=".45" />
      <circle cx={x(.5)} cy={y(2 / Math.PI)} r="3.2" fill={ACCENT} />
      <circle cx={x(1)} cy={y(0)} r="3.2" fill="var(--paper, white)" stroke={ACCENT} strokeWidth="2" />
      <text x="30" y="27" fill={ACCENT} fontSize="10" fontWeight="650">|H₀|/Tₛ</text>
      <text x={x(.5)} y={y(2 / Math.PI) - 7} textAnchor="middle" fill="currentColor" fontSize="9.5">2/π · −3.922 dB</text>
      <text x={x(.5)} y="104" textAnchor="middle" fill="currentColor" opacity=".62" fontSize="10">fₛ/2</text>
      <text x={x(1)} y="104" textAnchor="middle" fill="currentColor" opacity=".62" fontSize="10">fₛ · null</text>
      <text x={x(1.27)} y="48" textAnchor="middle" fill={ACCENT} fontSize="9.5">residual image lobe</text>
      <path d={`M${x(.72)} 114 L${x(.72)} 106 L${x(.84)} 106`} fill="none" stroke="currentColor" strokeDasharray="3 3" opacity=".55" />
      <text x={x(.72)} y="123" textAnchor="middle" fill="currentColor" opacity=".6" fontSize="9">finite analog LPF transition</text>
    </svg>
  );
}

function StageArrow() {
  return <span aria-hidden="true" style={{ opacity: .5 }}>→</span>;
}

export default function IdealVsHoldReconstruction() {
  const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
  const card = { border, borderRadius: 7, minWidth: 0, padding: 10 };
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: 760 }}>
      <style>{`
        .ivh-mobile-samples { display: none; }
        @media (max-width: 620px) {
          .ivh-grid { grid-template-columns: 1fr !important; }
          .ivh-desktop-samples { display: none; }
          .ivh-mobile-samples { display: block; }
          .ivh-ledger { grid-template-columns: minmax(88px,.65fr) 1fr 1fr !important; font-size: 10.5px !important; }
        }
      `}</style>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "space-between" }}>
        <b>One sample sequence, two reconstruction chains</b>
        <span style={labelMuted}><M tex={String.raw`x[n],\quad T_s=1/f_s`} size={11.5} /></span>
      </div>
      <div className="ivh-desktop-samples"><SampleStrip /></div>
      <div className="ivh-mobile-samples"><SampleStrip mobile /></div>
      <div className="ivh-grid" style={{ display: "grid", gap: 9, gridTemplateColumns: "1fr 1fr" }}>
        <section style={{ ...card, borderTop: `3px solid ${SUPPORT}` }}>
          <div style={{ color: SUPPORT, fontWeight: 750 }}>IDEAL · impulse reconstruction</div>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6, margin: "7px 0" }}>
            <span>impulse DAC</span><StageArrow /><span>gain-<M tex={String.raw`T_s`} size={12} /> brick wall</span><StageArrow /><span style={{ color: SUPPORT }}>smooth output</span>
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <M tex={String.raw`x_s(t)=\sum_n x[n]\,\delta(t-nT_s)`} size={11.5} />
            <M tex={String.raw`H_r(j\Omega)=\begin{cases}T_s,&|\Omega|<\pi/T_s\\0,&|\Omega|>\pi/T_s\end{cases}`} size={11} />
            <M tex={String.raw`h_r(t)=\operatorname{sinc}(t/T_s),\quad \operatorname{sinc}(u)=\frac{\sin(\pi u)}{\pi u}`} size={10.8} />
          </div>
          <IdealSpectrum />
          <div style={{ ...labelMuted, textAlign: "center" }}>mathematical selector · support strictly inside cutoff · no Nyquist endpoint claim</div>
        </section>
        <section style={{ ...card, borderTop: `3px dashed ${ACCENT}` }}>
          <div style={{ color: ACCENT, fontWeight: 750 }}>PRACTICAL · zero-order hold</div>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 6, margin: "7px 0" }}>
            <span>ZOH / staircase</span><StageArrow /><span>analog reconstruction / anti-image LPF</span><StageArrow /><span style={{ color: ACCENT }}>filtered output</span>
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <M tex={String.raw`h_0(t)=1\ \text{for}\ 0\le t<T_s,\quad 0\ \text{otherwise}`} size={11} />
            <M tex={String.raw`H_0(j\Omega)=T_s e^{-j\Omega T_s/2}\,\frac{\sin(\Omega T_s/2)}{\Omega T_s/2}`} size={11} />
            <span><M tex={String.raw`e^{-j\Omega T_s/2}`} color={ACCENT} size={11} /> = <b><M tex={String.raw`T_s/2`} size={11} /> delay</b></span>
          </div>
          <HoldSpectrum />
          <div style={{ ...labelMuted, textAlign: "center" }}>finite ripple · transition width · attenuation · delay</div>
        </section>
      </div>
      <div className="ivh-ledger" style={{ borderTop: border, display: "grid", fontSize: 11, gap: "4px 8px", gridTemplateColumns: ".75fr 1fr 1fr", marginTop: 9, paddingTop: 8 }}>
        <b>checkpoint</b><b style={{ color: SUPPORT }}>ideal</b><b style={{ color: ACCENT }}>hold + analog LPF</b>
        <span>DC scale</span><span><M tex={String.raw`T_s`} size={10.5} /> cancels <M tex={String.raw`1/T_s`} size={10.5} /></span><span><M tex={String.raw`|H_0(j0)|=T_s`} size={10.5} /></span>
        <span>Nyquist</span><span>cutoff at <M tex={String.raw`|\Omega|=\pi/T_s`} size={10.5} /></span><span><M tex={String.raw`|H_0|/T_s=2/\pi`} size={10.5} /></span>
        <span>images</span><span>removed by ideal selection</span><span>lobes remain around <M tex={String.raw`f_s`} size={10.5} />; LPF suppresses them</span>
      </div>
      <div style={{ ...labelMuted, borderTop: border, marginTop: 7, paddingTop: 7, textAlign: "center" }}>
        Output reconstruction filtering suppresses DAC images; it does not undo analog aliasing that occurred before sampling.
      </div>
    </div>
  );
}
