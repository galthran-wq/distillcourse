import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const MODE = role(ACCENT, String.raw`e^{j\omega n}`);
const H = role(SUPPORT, String.raw`H(e^{j\omega})`);

function Header({ number, title }: { number: number; title: string }) {
  return (
    <div style={{ alignItems: "center", borderBottom: border, display: "flex", gap: 7, padding: "8px 10px" }}>
      <span style={{ alignItems: "center", border: "1.4px solid currentColor", borderRadius: "50%", display: "inline-flex", flex: "0 0 22px", fontSize: 11, fontWeight: 780, height: 22, justifyContent: "center", width: 22 }}>
        {number}
      </span>
      <strong style={{ fontSize: 11.5, letterSpacing: "0.02em" }}>{title}</strong>
    </div>
  );
}

function Card({
  children,
  number,
  title,
}: {
  children: React.ReactNode;
  number: number;
  title: string;
}) {
  return (
    <section className="cme-card" style={{ background: "var(--panel)", border, borderRadius: 9, minWidth: 0, overflow: "hidden" }}>
      <Header number={number} title={title} />
      <div style={{ alignContent: "center", display: "grid", gap: 8, minHeight: 134, padding: "10px 8px", textAlign: "center" }}>
        {children}
      </div>
    </section>
  );
}

function Arrow() {
  return (
    <div aria-hidden="true" className="cme-arrow" style={{ alignItems: "center", display: "flex", justifyContent: "center", opacity: 0.6 }}>
      <svg viewBox="0 0 28 32" style={{ display: "block", width: 27 }}>
        <path d="M2 16H23M17 10L24 16L17 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    </div>
  );
}

export default function ComplexModeEigenfunction() {
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
        .cme-mobile { display: none; }
        @media (max-width: 460px) {
          .cme-flow { grid-template-columns: minmax(0, 1fr) !important; gap: 8px !important; }
          .cme-arrow { display: none !important; }
          .cme-card > div:last-child { min-height: 0 !important; padding-block: 12px !important; }
          .cme-desktop { display: none !important; }
          .cme-mobile { display: grid !important; }
          .cme-ledger { grid-template-columns: minmax(0, 1fr) !important; }
          .cme-boundary { align-items: flex-start !important; flex-direction: column; }
        }
      `}</style>

      <div className="cme-flow" style={{ alignItems: "stretch", display: "grid", gap: 6, gridTemplateColumns: "minmax(0, 0.88fr) 27px minmax(0, 1.12fr) 27px minmax(0, 1.25fr)" }}>
        <Card number={1} title="eternal mode">
          <M tex={String.raw`x[n]=${MODE}`} size={14} />
          <div style={{ border: `1.2px solid ${ACCENT}`, borderRadius: 999, color: ACCENT, fontSize: 11, fontWeight: 750, justifySelf: "center", padding: "3px 9px" }}>
            n in ℤ · all integers
          </div>
          <span style={{ ...labelMuted, fontSize: 10.5 }}>not switched on at n=0</span>
        </Card>

        <Arrow />

        <Card number={2} title="three-tap LTI">
          <span className="cme-desktop"><M tex={String.raw`y[n]=h_0x[n]+h_1x[n-1]`} size={10.5} /></span>
          <span className="cme-desktop"><M tex={String.raw`{}+h_2x[n-2]`} size={10.5} /></span>
          <span className="cme-mobile" style={{ gap: 4 }}>
            <M tex={String.raw`y[n]=h_0x[n]+h_1x[n-1]`} size={12.5} />
            <M tex={String.raw`{}+h_2x[n-2]`} size={12.5} />
          </span>
          <div style={{ alignItems: "end", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", margin: "3px auto 0", maxWidth: 150, width: "100%" }}>
            {["h₀", "h₁", "h₂"].map((tap, index) => (
              <div key={tap} style={{ textAlign: "center" }}>
                <div style={{ border: "1.2px solid currentColor", borderRadius: 4, fontSize: 11, fontWeight: 700, margin: "0 auto 4px", padding: "4px 2px", width: 30 }}>{tap}</div>
                <div style={{ height: 10 + index * 7, margin: "auto", borderLeft: "1.2px solid currentColor", opacity: 0.45, width: 0 }} />
              </div>
            ))}
          </div>
        </Card>

        <Arrow />

        <Card number={3} title="same ω">
          <M tex={String.raw`y[n]=${H}\,${MODE}`} size={13} />
          <div style={{ borderTop: border, display: "grid", gap: 4, paddingTop: 8 }}>
            <span className="cme-desktop"><M tex={String.raw`${H}=h_0+h_1e^{-j\omega}`} size={10.5} /></span>
            <span className="cme-desktop"><M tex={String.raw`{}+h_2e^{-j2\omega}`} size={10.5} /></span>
            <span className="cme-mobile" style={{ gap: 4 }}>
              <M tex={String.raw`${H}=h_0+h_1e^{-j\omega}`} size={12} />
              <M tex={String.raw`{}+h_2e^{-j2\omega}`} size={12} />
            </span>
          </div>
        </Card>
      </div>

      <div className="cme-ledger" style={{ borderTop: border, display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)", marginTop: 11, paddingTop: 9 }}>
        <div style={{ alignItems: "center", border: `1.2px solid ${ACCENT}`, borderRadius: 8, display: "flex", flexWrap: "wrap", gap: "3px 7px", justifyContent: "center", padding: "7px 9px", textAlign: "center" }}>
          <M tex={MODE} size={12.5} />
          <span aria-hidden="true" style={{ opacity: 0.5 }}>→</span>
          <strong style={{ color: ACCENT, fontSize: 11.5 }}>same ω</strong>
        </div>
        <div style={{ alignItems: "center", border: `1.2px solid ${SUPPORT}`, borderRadius: 8, display: "flex", flexWrap: "wrap", gap: "4px 11px", justifyContent: "center", padding: "7px 9px", textAlign: "center" }}>
          <M tex={H} size={12.5} />
          <span style={{ color: SUPPORT, fontSize: 11.5, fontWeight: 750 }}>|H| · gain</span>
          <span style={{ color: SUPPORT, fontSize: 11.5, fontWeight: 750 }}>angle H · phase shift</span>
        </div>
      </div>

      <figcaption className="cme-boundary" style={{ ...labelMuted, alignItems: "center", display: "flex", fontSize: 11, gap: "5px 14px", justifyContent: "space-between", marginTop: 9 }}>
        <span><b style={{ color: "currentColor" }}>next:</b> frequency response</span>
        <span>causal startup is a different boundary</span>
      </figcaption>
    </figure>
  );
}
