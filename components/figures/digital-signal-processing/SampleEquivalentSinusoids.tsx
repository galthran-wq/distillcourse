import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const samples = [1, -0.309, -0.809, 0.809, 0.309, -1];

function Plot({ mobile = false }: { mobile?: boolean }) {
  const w = mobile ? 330 : 640;
  const h = mobile ? 188 : 238;
  const left = mobile ? 27 : 48;
  const right = mobile ? 10 : 18;
  const top = mobile ? 22 : 30;
  const bottom = mobile ? 31 : 36;
  const pw = w - left - right;
  const ph = h - top - bottom;
  const px = (tMs: number) => left + (tMs / 5) * pw;
  const py = (value: number) => top + (1 - (value + 1) / 2) * ph;
  const curve = (frequency: number) =>
    Array.from({ length: 181 }, (_, i) => {
      const tMs = (5 * i) / 180;
      return `${i ? "L" : "M"}${px(tMs).toFixed(2)},${py(Math.cos(2 * Math.PI * frequency * tMs / 1000)).toFixed(2)}`;
    }).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="The 300 and 700 hertz zero-phase cosine curves share all six sample dots on a one-millisecond grid." style={{ display: "block", width: "100%" }}>
      <line x1={left} y1={py(0)} x2={w - right} y2={py(0)} stroke="currentColor" strokeOpacity=".45" />
      <line x1={left} y1={top} x2={left} y2={h - bottom} stroke="currentColor" strokeOpacity=".45" />
      {[-1, 1].map((v) => <text key={v} x={left - 6} y={py(v) + 4} textAnchor="end" fill="currentColor" opacity=".55" fontSize={mobile ? 9 : 11}>{v}</text>)}
      {samples.map((_, n) => (
        <g key={n}>
          <line x1={px(n)} y1={top} x2={px(n)} y2={h - bottom} stroke="currentColor" strokeDasharray="3 4" strokeOpacity=".14" />
          <text x={px(n)} y={h - 10} textAnchor="middle" fill="currentColor" opacity=".6" fontSize={mobile ? 9 : 11}>{n}</text>
        </g>
      ))}
      <path d={curve(300)} fill="none" stroke={SUPPORT} strokeWidth={mobile ? 2 : 2.5} />
      <path d={curve(700)} fill="none" stroke={ACCENT} strokeWidth={mobile ? 1.8 : 2.3} strokeDasharray="7 5" />
      {samples.map((value, n) => <circle key={n} cx={px(n)} cy={py(value)} r={mobile ? 3.4 : 4.2} fill="currentColor" stroke="var(--paper, white)" strokeWidth="1.2" />)}
      <text x={left + 3} y={13} fill="currentColor" opacity=".6" fontSize={mobile ? 9 : 11}>
        <tspan fontStyle="italic">x</tspan><tspan baselineShift="sub" fontSize="75%">c</tspan><tspan>(t)</tspan>
      </text>
      <text x={w - right} y={py(0) - 7} textAnchor="end" fill="currentColor" opacity=".6" fontSize={mobile ? 9 : 11}>t (ms)</text>
    </svg>
  );
}

export default function SampleEquivalentSinusoids() {
  const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: 760 }}>
      <style>{`
        .ses-mobile { display: none; }
        @media (max-width: 450px) {
          .ses-desktop { display: none; }
          .ses-mobile { display: block; }
          .ses-map { grid-template-columns: 1fr !important; }
          .ses-ledger { font-size: 11px !important; }
        }
      `}</style>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "5px 15px", justifyContent: "space-between", marginBottom: 5 }}>
        <b>Two curves, one sample record</b>
        <span style={labelMuted}><M tex={String.raw`f_s=1000\ \text{samples/s},\quad T_s=1\ \text{ms}`} size={11.5} /></span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginBottom: 2 }}>
        <span style={{ color: SUPPORT, fontWeight: 650 }}>━ 300 Hz · solid</span>
        <span style={{ color: ACCENT, fontWeight: 650 }}>┅ 700 Hz · dashed</span>
        <span>● shared <M tex={String.raw`x[n]`} size={12} /></span>
      </div>
      <div className="ses-desktop"><Plot /></div>
      <div className="ses-mobile"><Plot mobile /></div>
      <div className="ses-ledger" style={{ background: "color-mix(in srgb, currentColor 4%, transparent)", border, borderRadius: 6, padding: "7px 9px", textAlign: "center" }}>
        <span style={{ fontWeight: 650 }}>shared sample ledger</span>{" "}
        <M tex={String.raw`[1,\,-0.309,\,-0.809,\,0.809,\,0.309,\,-1]`} size={11.5} />
      </div>
      <div style={{ borderTop: border, marginTop: 9, paddingTop: 8 }}>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "space-between" }}>
          <b>Signed discrete-frequency map</b>
          <M tex={String.raw`\omega=2\pi f/f_s\pmod{2\pi}`} size={11.5} />
        </div>
        <div className="ses-map" style={{ display: "grid", gap: 7, gridTemplateColumns: "1fr 1.35fr", marginTop: 6 }}>
          <div style={{ border: `1.5px solid ${SUPPORT}`, borderRadius: 6, color: SUPPORT, padding: "7px 9px", textAlign: "center" }}>
            <M tex={String.raw`+300\ \text{Hz}\ \longrightarrow\ +0.6\pi`} size={12} />
          </div>
          <div style={{ border: `1.5px dashed ${ACCENT}`, borderRadius: 6, color: ACCENT, padding: "7px 9px", textAlign: "center" }}>
            <M tex={String.raw`+700\ \text{Hz}\ \longrightarrow\ +1.4\pi\ \equiv\ -0.6\pi`} size={12} />
          </div>
        </div>
        <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "center", marginTop: 7, textAlign: "center" }}>
          <M tex={String.raw`\cos(1.4\pi n)=\cos(2\pi n-0.6\pi n)=\cos(0.6\pi n)`} size={11.5} />
          <span style={{ ...labelMuted, fontWeight: 650 }}>zero-phase real cosines · conjugate pair · complex directions remain opposite</span>
        </div>
      </div>
    </div>
  );
}
