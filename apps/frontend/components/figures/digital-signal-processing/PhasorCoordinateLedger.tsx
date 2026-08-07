import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const I = role(ACCENT, "I");
const Q = role(SUPPORT, "Q");

function ComplexPlane() {
  return (
    <div style={{ minWidth: 0 }}>
      <svg
        aria-label="Complex plane for z equals one plus j: amber I equals one horizontally, blue Q equals one vertically, magnitude square root of two, and phase pi over four"
        role="img"
        style={{ display: "block", height: "auto", width: "100%" }}
        viewBox="0 0 300 250"
      >
        <defs>
          <marker id="pcl-arrow" markerHeight="5" markerWidth="5" orient="auto" refX="4.5" refY="2.5">
            <path d="M0 0L5 2.5L0 5Z" fill="currentColor" />
          </marker>
        </defs>

        {[40, 77.5, 152.5, 190, 227.5].map((x) => (
          <line key={`x-${x}`} x1={x} y1="22" x2={x} y2="220" stroke="currentColor" strokeDasharray="3 4" strokeOpacity="0.12" />
        ))}
        {[42.5, 80, 117.5, 192.5].map((y) => (
          <line key={`y-${y}`} x1="24" y1={y} x2="270" y2={y} stroke="currentColor" strokeDasharray="3 4" strokeOpacity="0.12" />
        ))}

        <path d="M23 155H278M115 224V14" fill="none" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.2" />
        <path d="M272 151L279 155L272 159M111 20L115 13L119 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.55" strokeWidth="1.2" />
        <text x="229" y="146" fill="currentColor" fontSize="11" opacity="0.62">real axis</text>
        <text x="123" y="23" fill="currentColor" fontSize="11" opacity="0.62">imaginary axis</text>

        <line x1="115" y1="155" x2="190" y2="155" stroke={ACCENT} strokeLinecap="round" strokeWidth="4" />
        <line x1="190" y1="155" x2="190" y2="80" stroke={SUPPORT} strokeLinecap="round" strokeWidth="4" />
        <path d="M115 155L190 80" fill="none" markerEnd="url(#pcl-arrow)" stroke="currentColor" strokeWidth="2.2" />
        <path d="M150 155A35 35 0 0 0 139.75 130.25" fill="none" stroke="currentColor" strokeOpacity="0.78" strokeWidth="1.5" />

        <circle cx="190" cy="80" fill="var(--panel)" r="5.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="115" cy="155" fill="currentColor" r="2.5" />
        <text x="140" y="177" fill={ACCENT} fontSize="11.5" fontWeight="750">I · in-phase</text>
        <text x="198" y="121" fill={SUPPORT} fontSize="11.5" fontWeight="750">Q · quadrature</text>
        <text x="121" y="100" fill="currentColor" fontSize="11" fontWeight="700">magnitude A</text>
        <text x="147" y="143" fill="currentColor" fontSize="10.5" fontWeight="700">phase θ</text>
        <text x="199" y="73" fill="currentColor" fontSize="11.5" fontWeight="750">same point z</text>
      </svg>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "4px 12px", justifyContent: "center", marginTop: -2 }}>
        <span style={{ color: ACCENT, fontSize: 11, fontWeight: 750 }}>horizontal · I=1</span>
        <span style={{ color: SUPPORT, fontSize: 11, fontWeight: 750 }}>vertical · Q=1</span>
      </div>
    </div>
  );
}

function LedgerCard({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section style={{ background: "var(--panel)", border, borderRadius: 9, minWidth: 0, padding: "10px 11px" }}>
      <strong style={{ display: "block", fontSize: 11, letterSpacing: "0.045em", marginBottom: 8, textTransform: "uppercase" }}>
        {title}
      </strong>
      {children}
    </section>
  );
}

export default function PhasorCoordinateLedger() {
  return (
    <figure
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.35,
        margin: 0,
        maxWidth: 672,
        width: "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 440px) {
          .pcl-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 9px !important; }
          .pcl-plane { margin-inline: auto; max-width: 290px; width: 100%; }
          .pcl-ledger { gap: 7px !important; }
          .pcl-summary { font-size: 11.5px !important; }
        }
      `}</style>

      <div className="pcl-grid" style={{ alignItems: "center", display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 1.08fr)" }}>
        <div className="pcl-plane"><ComplexPlane /></div>

        <div className="pcl-ledger" style={{ display: "grid", gap: 9, minWidth: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ ...labelMuted, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>one complex number</div>
            <div style={{ marginTop: 3 }}><M tex={String.raw`z=${role(ACCENT, "1")}+j${role(SUPPORT, "1")}`} size={18} /></div>
          </div>

          <LedgerCard title="rectangular">
            <div style={{ display: "grid", gap: 7, textAlign: "center" }}>
              <M tex={String.raw`z=${I}+j${Q}=${role(ACCENT, "1")}+j${role(SUPPORT, "1")}`} size={14} />
              <M tex={String.raw`(${I},${Q})=(${role(ACCENT, "1")},${role(SUPPORT, "1")})`} size={13} />
            </div>
          </LedgerCard>

          <LedgerCard title="polar">
            <div style={{ display: "grid", gap: 7, textAlign: "center" }}>
              <M tex={String.raw`z=Ae^{j\theta}=\sqrt{2}\,e^{j\pi/4}`} size={14} />
              <M tex={String.raw`A=\sqrt{${I}^{2}+${Q}^{2}}=\sqrt{2}`} size={13} />
              <M tex={String.raw`\theta=\operatorname{atan2}(${Q},${I})=\operatorname{atan2}(1,1)=\frac{\pi}{4}`} size={12.5} />
            </div>
          </LedgerCard>
        </div>
      </div>

      <figcaption className="pcl-summary" style={{ ...labelMuted, borderTop: border, fontSize: 11, marginTop: 11, paddingTop: 8, textAlign: "center" }}>
        <b style={{ color: "currentColor" }}>rectangular</b> stores the coordinates; <b style={{ color: "currentColor" }}>polar</b> stores the same point as <M tex={String.raw`(A,\theta)=(\sqrt2,\pi/4)`} size={11} />.
      </figcaption>
    </figure>
  );
}
