import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const X_TIME = role(SUPPORT, "x[m]");
const H_TIME = role(ACCENT, "h[n-m]");
const Y_TIME = role(OK, "y[n]");
const X_FREQ = role(SUPPORT, String.raw`X(e^{j\omega})`);
const H_FREQ = role(ACCENT, String.raw`H(e^{j\omega})`);
const Y_FREQ = role(OK, String.raw`Y(e^{j\omega})`);

function RoleCard({
  children,
  color,
  label,
}: {
  children: React.ReactNode;
  color: string;
  label: string;
}) {
  return (
    <div style={{ background: "var(--panel)", border: `1.3px solid ${color}`, borderRadius: 8, minWidth: 0, padding: "9px 7px", textAlign: "center" }}>
      <div style={{ color, fontSize: 10.5, fontWeight: 760, letterSpacing: "0.035em", marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
      {children}
    </div>
  );
}

function Op({ children }: { children: React.ReactNode }) {
  return <div aria-hidden="true" style={{ alignSelf: "center", fontSize: 19, opacity: 0.58, textAlign: "center" }}>{children}</div>;
}

function DesktopBridge() {
  return (
    <div className="cmb-desktop">
      <div style={{ ...labelMuted, fontSize: 10.5, fontWeight: 720, margin: "0 0 5px 2px" }}>time index n · convolution dummy m</div>
      <div style={{ alignItems: "stretch", display: "grid", gap: 6, gridTemplateColumns: "minmax(0,.8fr) 20px minmax(0,.95fr) 29px minmax(0,1.55fr)" }}>
        <RoleCard color={SUPPORT} label="input"><M tex={X_TIME} size={14} /></RoleCard>
        <Op>∗</Op>
        <RoleCard color={ACCENT} label="impulse response"><M tex={H_TIME} size={13.5} /></RoleCard>
        <Op>→</Op>
        <RoleCard color={OK} label="output · linear convolution">
          <div style={{ display: "grid", gap: 4 }}>
            <M tex={String.raw`${Y_TIME}=\sum_m ${X_TIME}${H_TIME}`} size={12} />
            <M tex={String.raw`=(x*h)[n]`} size={11.5} />
          </div>
        </RoleCard>
      </div>

      <div style={{ alignItems: "center", display: "grid", gap: 6, gridTemplateColumns: "minmax(0,.8fr) 20px minmax(0,.95fr) 29px minmax(0,1.55fr)", margin: "5px 0" }}>
        {[SUPPORT, undefined, ACCENT, undefined, OK].map((color, index) => color ? (
          <div key={color} style={{ color, display: "grid", fontSize: 10, justifyItems: "center", lineHeight: 1.15 }}>
            <span aria-hidden="true">↕</span>
            <span style={{ color: "currentColor", opacity: 0.68 }}>{index === 2 ? "DTFT / inverse DTFT" : "transform pair"}</span>
          </div>
        ) : <span key={index} />)}
      </div>

      <div style={{ alignItems: "stretch", display: "grid", gap: 6, gridTemplateColumns: "minmax(0,.8fr) 20px minmax(0,.95fr) 29px minmax(0,1.55fr)" }}>
        <RoleCard color={SUPPORT} label="input transform"><M tex={X_FREQ} size={12} /></RoleCard>
        <Op>×</Op>
        <RoleCard color={ACCENT} label="system transform"><M tex={H_FREQ} size={12} /></RoleCard>
        <Op>→</Op>
        <RoleCard color={OK} label="output · pointwise in ω">
          <M tex={String.raw`${Y_FREQ}=${X_FREQ}${H_FREQ}`} size={11.5} />
        </RoleCard>
      </div>
    </div>
  );
}

function MobileBridge() {
  return (
    <div className="cmb-mobile" style={{ display: "none", gap: 7 }}>
      <section style={{ background: "var(--panel)", border, borderRadius: 9, display: "grid", gap: 7, padding: "10px 8px", textAlign: "center" }}>
        <strong style={{ fontSize: 11.5 }}>time · linear convolution</strong>
        <M tex={String.raw`${Y_TIME}=\sum_m ${X_TIME}${H_TIME}`} size={13} />
        <M tex={String.raw`=(x*h)[n]`} size={12.5} />
        <span style={{ ...labelMuted, fontSize: 10.5 }}>time index n · dummy m</span>
      </section>
      <div style={{ display: "grid", fontSize: 10.5, justifyItems: "center", lineHeight: 1.2 }}>
        <span>↓ DTFT</span><span>↑ inverse DTFT</span>
      </div>
      <section style={{ background: "var(--panel)", border, borderRadius: 9, display: "grid", gap: 7, padding: "10px 5px", textAlign: "center" }}>
        <strong style={{ fontSize: 11.5 }}>continuous frequency · pointwise product</strong>
        <M tex={String.raw`${Y_FREQ}=${X_FREQ}${H_FREQ}`} size={12.5} />
      </section>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "3px 11px", justifyContent: "center", fontSize: 10.5 }}>
        <span style={{ color: SUPPORT, fontWeight: 750 }}>x / X · input</span>
        <span style={{ color: ACCENT, fontWeight: 750 }}>h / H · system</span>
        <span style={{ color: OK, fontWeight: 750 }}>y / Y · output</span>
      </div>
    </div>
  );
}

export default function ConvolutionMultiplicationBridge() {
  return (
    <figure style={{ color: "currentColor", fontFamily: "system-ui, sans-serif", lineHeight: 1.35, margin: 0, maxWidth: 672, width: "calc(100vw - 48px)" }}>
      <style>{`
        @media (max-width: 450px) {
          .cmb-desktop { display: none !important; }
          .cmb-mobile { display: grid !important; }
          .cmb-ledger { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>

      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "space-between", marginBottom: 9 }}>
        <strong style={{ fontSize: 13 }}>one theorem · two coordinate systems</strong>
        <span style={{ border: "1.2px solid currentColor", borderRadius: 999, fontSize: 10.5, fontWeight: 720, opacity: 0.72, padding: "3px 8px" }}>
          <M tex={String.raw`x,h\in\ell^1\quad\cdot\quad y=x*h`} size={10.5} />
        </span>
      </div>

      <DesktopBridge />
      <MobileBridge />

      <div className="cmb-ledger" style={{ borderTop: border, display: "grid", gap: 8, gridTemplateColumns: "minmax(0,1fr) minmax(0,1.25fr)", marginTop: 10, paddingTop: 9 }}>
        <div style={{ background: "var(--panel)", border, borderRadius: 8, display: "grid", gap: 4, padding: "8px 7px", textAlign: "center" }}>
          <strong style={{ fontSize: 10.5 }}>analysis · negative j</strong>
          <M tex={String.raw`X(e^{j\omega})=\sum_n x[n]e^{-j\omega n}`} size={11} />
        </div>
        <div style={{ background: "var(--panel)", border, borderRadius: 8, display: "grid", gap: 4, padding: "8px 6px", textAlign: "center" }}>
          <strong style={{ fontSize: 10.5 }}>synthesis · positive j · inverse scale only</strong>
          <span className="cmb-inverse"><M tex={String.raw`x[n]=\frac{1}{2\pi}\int_{-\pi}^{\pi}X(e^{j\omega})e^{j\omega n}\,d\omega`} size={10.5} /></span>
        </div>
      </div>

      <figcaption style={{ ...labelMuted, alignItems: "center", display: "flex", flexWrap: "wrap", fontSize: 10.5, gap: "3px 13px", justifyContent: "center", marginTop: 8, textAlign: "center" }}>
        <span>ω continuous · 2π-periodic</span>
        <b style={{ color: "currentColor" }}>linear convolution · not unpadded N-point circular convolution</b>
      </figcaption>
    </figure>
  );
}
