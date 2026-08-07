import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

function FrequencyStrip() {
  return (
    <svg aria-label="Two separate narrow occupied bands and a response zero outside both bands" role="img" style={{ display: "block", height: "auto", width: "100%" }} viewBox="0 0 300 132">
      <line x1="24" y1="74" x2="280" y2="74" stroke="currentColor" strokeOpacity="0.52" />
      <path d="M274 70L281 74L274 78" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.52" />
      <text x="278" y="91" fill="currentColor" fontSize="10" opacity="0.58">ω</text>

      <path d="M48 65V55H112V65" fill="none" stroke={SUPPORT} strokeWidth="2" />
      <rect x="57" y="68" width="46" height="12" rx="3" fill={SUPPORT} opacity="0.18" />
      <text x="80" y="48" fill={SUPPORT} fontSize="11" fontWeight="750" textAnchor="middle">narrow B1</text>
      <text x="80" y="98" fill={SUPPORT} fontSize="10" fontWeight="700" textAnchor="middle">around ω1</text>

      <path d="M133 65V55H197V65" fill="none" stroke={ACCENT} strokeWidth="2" />
      <rect x="142" y="68" width="46" height="12" rx="3" fill={ACCENT} opacity="0.18" />
      <text x="165" y="48" fill={ACCENT} fontSize="11" fontWeight="750" textAnchor="middle">narrow B2</text>
      <text x="165" y="98" fill={ACCENT} fontSize="10" fontWeight="700" textAnchor="middle">around ω2</text>

      <path d="M237 66L253 82M253 66L237 82" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <line x1="222" y1="43" x2="268" y2="43" stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.5" />
      <text x="245" y="34" fill="currentColor" fontSize="10.5" fontWeight="750" textAnchor="middle">zero boundary</text>
      <text x="245" y="101" fill="currentColor" fontSize="10" fontWeight="700" textAnchor="middle">ωz · H=0</text>
      <text x="150" y="121" fill="currentColor" fontSize="9.5" opacity="0.58" textAnchor="middle">occupied brackets stop before the null</text>
    </svg>
  );
}

function SlopeCard({ color, band, slope, delay }: { color: string; band: string; slope: number; delay: number }) {
  return (
    <section style={{ background: "var(--panel)", border: `1.2px solid ${color}`, borderRadius: 8, display: "grid", gap: 5, minWidth: 0, padding: "7px 8px" }}>
      <div style={{ alignItems: "center", display: "flex", gap: 7, justifyContent: "space-between" }}>
        <strong style={{ color, fontSize: 11.5 }}>{band} · continuous unwrapped phase</strong>
        <svg aria-hidden="true" viewBox="0 0 58 28" style={{ flex: "0 0 58px", width: 58 }}>
          <line x1="3" y1="24" x2="55" y2="24" stroke="currentColor" strokeOpacity="0.25" />
          <line x1="8" y1="4" x2="50" y2="24" stroke={color} strokeLinecap="round" strokeWidth={slope === -5 ? 1.7 : 2.4} />
        </svg>
      </div>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "3px 11px", justifyContent: "center" }}>
        <M tex={role(color, String.raw`\frac{d\theta_H}{d\omega}=${slope}`)} size={11.5} />
        <M tex={role(color, String.raw`\tau_g=${delay}\ \text{samples}`)} size={11.5} />
      </div>
    </section>
  );
}

const packetPath = (center: number, cycles: number, span = 60) => {
  const points = Array.from({ length: 81 }, (_, index) => {
    const dx = ((index - 40) / 40) * span;
    const envelope = Math.exp(-Math.pow(dx / (span * 0.52), 2));
    const phase = (index / 80) * cycles * 2 * Math.PI;
    return `${center + dx},${55 - 20 * envelope * Math.sin(phase)}`;
  });
  return `M${points.join("L")}`;
};

function envelopePath(center: number, sign: number, span = 62) {
  return `M${center - span} 55 C${center - span * 0.65} ${55 - sign * 3},${center - span * 0.45} ${55 - sign * 20},${center} ${55 - sign * 20} C${center + span * 0.45} ${55 - sign * 20},${center + span * 0.65} ${55 - sign * 3},${center + span} 55`;
}

function PacketGraphic({ color, cycles, delay, mobile = false, omega }: { color: string; cycles: number; delay: number; mobile?: boolean; omega: string }) {
  const origin = mobile ? 55 : 115;
  const scale = mobile ? 8 : 14;
  const output = origin + delay * scale;
  const span = mobile ? 34 : 62;
  const ticks = [
    { n: 0, x: origin },
    { n: 5, x: origin + 5 * scale },
    { n: 20, x: origin + 20 * scale },
  ];
  return (
    <svg aria-label={`${omega} narrowband packet with input envelope centered at n equals zero and output envelope centered at n equals ${delay}`} role="img" style={{ display: "block", height: "auto", width: "100%" }} viewBox={mobile ? "0 0 300 124" : "0 0 520 112"}>
        <line x1={mobile ? 16 : 42} y1="55" x2={mobile ? 284 : 486} y2="55" stroke="currentColor" strokeOpacity="0.4" />
        <path d={mobile ? "M278 51L285 55L278 59" : "M480 51L487 55L480 59"} fill="none" stroke="currentColor" strokeOpacity="0.4" />
        {ticks.map((tick) => (
          <g key={tick.n}>
            <line x1={tick.x} y1="51" x2={tick.x} y2="62" stroke="currentColor" strokeOpacity="0.45" />
            <text x={tick.x} y="76" fill="currentColor" fontSize={mobile ? "11" : "10"} opacity="0.64" textAnchor="middle">n={tick.n}</text>
          </g>
        ))}
        <text x={mobile ? 283 : 486} y="76" fill="currentColor" fontSize={mobile ? "11" : "10"} opacity="0.58">n</text>
        <path d={envelopePath(origin, 1, span)} fill="none" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.42" strokeWidth="1.3" />
        <path d={envelopePath(origin, -1, span)} fill="none" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.42" strokeWidth="1.3" />
        <text x={origin} y={mobile ? "116" : "101"} fill="currentColor" fontSize={mobile ? "10.5" : "9.5"} opacity="0.58" textAnchor="middle">input center</text>
        <path d={packetPath(output, cycles, span - 2)} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <path d={envelopePath(output, 1, span)} fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1.1" />
        <path d={envelopePath(output, -1, span)} fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1.1" />
        <line x1={origin} y1={mobile ? "95" : "88"} x2={output} y2={mobile ? "95" : "88"} stroke={color} strokeWidth="1.4" />
        <path d={mobile ? `M${origin + 6} 91L${origin} 95L${origin + 6} 99M${output - 6} 91L${output} 95L${output - 6} 99` : `M${origin + 6} 84L${origin} 88L${origin + 6} 92M${output - 6} 84L${output} 88L${output - 6} 92`} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
        <text x={(origin + output) / 2} y={mobile ? "91" : "84"} fill={color} fontSize={mobile ? "11" : "10.5"} fontWeight="750" textAnchor="middle">Δn={delay}</text>
    </svg>
  );
}

function PacketRow({ color, delay, omega, cycles }: { color: string; delay: number; omega: string; cycles: number }) {
  return (
    <section style={{ background: "var(--panel)", border, borderRadius: 9, minWidth: 0, padding: "8px 9px 6px" }}>
      <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "3px 11px", justifyContent: "space-between" }}>
        <strong style={{ color, fontSize: 11.5 }}>{omega} packet</strong>
        <M tex={role(color, String.raw`\text{delay}\approx ${delay}\ \text{samples}`)} size={11.5} />
      </div>
      <div className="gdp-packet-desktop"><PacketGraphic color={color} cycles={cycles} delay={delay} omega={omega} /></div>
      <div className="gdp-packet-mobile" style={{ display: "none" }}><PacketGraphic color={color} cycles={cycles} delay={delay} mobile omega={omega} /></div>
    </section>
  );
}

export default function GroupDelayPackets() {
  return (
    <figure style={{ color: "currentColor", fontFamily: "system-ui, sans-serif", lineHeight: 1.35, margin: 0, maxWidth: 672, width: "calc(100vw - 48px)" }}>
      <style>{`
        @media (max-width: 450px) {
          .gdp-top { grid-template-columns: minmax(0, 1fr) !important; }
          .gdp-slope-grid { gap: 7px !important; }
          .gdp-conditions { align-items: flex-start !important; flex-direction: column; }
          .gdp-packet-desktop { display: none !important; }
          .gdp-packet-mobile { display: block !important; }
        }
      `}</style>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "4px 13px", justifyContent: "space-between", marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>equal local gain · different local phase slopes</strong>
        <M tex={String.raw`\tau_g(\omega)=-\frac{d\theta_H(\omega)}{d\omega}`} size={13} />
      </div>

      <div className="gdp-top" style={{ alignItems: "center", display: "grid", gap: 10, gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)" }}>
        <div>
          <FrequencyStrip />
          <div style={{ color: OK, fontSize: 10.5, fontWeight: 750, marginTop: -2, textAlign: "center" }}><M tex={role(OK, String.raw`|H(e^{j\omega})|\approx1\ \text{locally in both occupied bands}`)} size={10.5} /></div>
        </div>
        <div className="gdp-slope-grid" style={{ display: "grid", gap: 8 }}>
          <SlopeCard band="B1" color={SUPPORT} delay={5} slope={-5} />
          <SlopeCard band="B2" color={ACCENT} delay={20} slope={-20} />
        </div>
      </div>

      <div style={{ border: "1px dashed currentColor", borderRadius: 7, fontSize: 10.5, margin: "8px 0", opacity: 0.72, padding: "6px 8px", textAlign: "center" }}>
        <M tex={String.raw`\omega_z:\ H(e^{j\omega_z})=0`} size={10.5} /> · phase and group delay undefined · no unwrapped branch crosses the null
      </div>

      <div style={{ display: "grid", gap: 7 }}>
        <div style={{ ...labelMuted, fontSize: 10.5, fontWeight: 700 }}>input envelopes aligned at n=0 · dashed reference retained on the same sample scale</div>
        <PacketRow color={SUPPORT} cycles={5} delay={5} omega="ω1 / B1" />
        <PacketRow color={ACCENT} cycles={8} delay={20} omega="ω2 / B2" />
      </div>

      <div className="gdp-conditions" style={{ alignItems: "center", borderTop: border, display: "flex", flexWrap: "wrap", fontSize: 10.5, gap: "4px 12px", justifyContent: "center", marginTop: 9, paddingTop: 8 }}>
        <b>sufficiently narrow bands</b><span>H nonzero + differentiable</span><span>|H| nearly flat</span><span>higher-order phase negligible</span>
      </div>
      <figcaption style={{ ...labelMuted, display: "grid", fontSize: 10.5, gap: 3, marginTop: 6, textAlign: "center" }}>
        <span><b style={{ color: "currentColor" }}>constructed local response · not the averager</b></span>
        <span>For the three-tap averager, <M tex={String.raw`H(e^{j\omega})=0\ \text{at}\ \omega=\pm2\pi/3`} size={10.5} />: group delay is undefined there, and phase must not be unwrapped across either zero.</span>
      </figcaption>
    </figure>
  );
}
