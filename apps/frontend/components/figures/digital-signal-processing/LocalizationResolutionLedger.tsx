import type { ReactNode } from "react";

import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const soft = (color: string) =>
  `color-mix(in srgb, ${color} 10%, var(--panel))`;

function LedgerRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ borderTop: border, display: "grid", gap: 4, padding: "8px 9px" }}>
      <div style={{ ...labelMuted, fontSize: 10, fontWeight: 800, letterSpacing: "0.055em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 11.5, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function DecisionCard({
  badge,
  color,
  title,
  subtitle,
  children,
}: {
  badge: string;
  color: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section style={{ border: `1.5px solid color-mix(in srgb, ${color} 52%, transparent)`, borderRadius: 10, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
      <header style={{ background: soft(color), padding: "10px 10px 9px" }}>
        <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
          <span style={{ alignItems: "center", border: `1.5px solid ${color}`, borderRadius: "50%", color, display: "inline-flex", flex: "0 0 23px", fontSize: 11, fontWeight: 850, height: 23, justifyContent: "center" }}>{badge}</span>
          <strong style={{ color, fontSize: 13 }}>{title}</strong>
        </div>
        <div style={{ ...labelMuted, fontSize: 10.5, margin: "3px 0 0 31px" }}>{subtitle}</div>
      </header>
      {children}
    </section>
  );
}

function Arrow({ color }: { color: string }) {
  return (
    <span aria-hidden="true" style={{ color, fontSize: 17, fontWeight: 800 }}>→</span>
  );
}

export default function LocalizationResolutionLedger() {
  return (
    <figure
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.38,
        margin: 0,
        maxWidth: 790,
        minWidth: 0,
        width: "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .lrl-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .lrl-summary { align-items: flex-start !important; flex-direction: column !important; }
        }
      `}</style>

      <header style={{ marginBottom: 9, textAlign: "center" }}>
        <strong style={{ fontSize: 14 }}>Choose the action that matches the claim</strong>
        <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 2 }}>A denser coordinate grid and a longer informative record solve different problems.</div>
      </header>

      <div className="lrl-grid" style={{ display: "grid", gap: 11, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        <DecisionCard badge="1" color={ACCENT} title="localize one isolated peak" subtitle="fixed acquired record · one concave main lobe">
          <LedgerRow label="claim">
            Estimate the tone coordinate and peak height between displayed FFT samples.
          </LedgerRow>
          <LedgerRow label="hold fixed">
            <M tex={String.raw`N,\ f_s,\ w[n],\ C_w`} size={11.5} /> and the acquired samples.
          </LedgerRow>
          <LedgerRow label="permissible action">
            <span style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "3px 7px" }}>
              increase <M tex="L" size={11.5} /> <Arrow color={ACCENT} /> fit the three-sample peak model
            </span>
          </LedgerRow>
          <LedgerRow label="quantity that changes">
            <M tex={String.raw`\Delta f_{\mathrm{grid}}=f_s/L`} size={11.5} /> becomes smaller; the main-lobe width does not.
          </LedgerRow>
          <LedgerRow label="failure check">
            Reject flat curvature, <M tex={String.raw`|p|>1/2`} size={11.5} />, endpoints, or neighboring-component contamination.
          </LedgerRow>
          <div style={{ background: soft(OK), borderTop: border, color: OK, fontSize: 10.5, fontWeight: 800, marginTop: "auto", padding: "7px 9px", textAlign: "center" }}>
            valid output · a model-qualified coordinate estimate
          </div>
        </DecisionCard>

        <DecisionCard badge="2" color={SUPPORT} title="separate overlapping components" subtitle="two tones merged by the finite observation">
          <LedgerRow label="claim">
            Identify two component frequencies whose reported locations remain stable.
          </LedgerRow>
          <LedgerRow label="hold fixed">
            Physical tone frequencies and sample rate <M tex="f_s" size={11.5} /> while testing the observation.
          </LedgerRow>
          <LedgerRow label="permissible action">
            <span style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "3px 7px" }}>
              acquire a larger <M tex="N" size={11.5} /> <Arrow color={SUPPORT} /> or change the declared window/model
            </span>
          </LedgerRow>
          <LedgerRow label="quantity that changes">
            <M tex={String.raw`T=N/f_s`} size={11.5} /> grows and the same-family window lobe narrows in hertz.
          </LedgerRow>
          <LedgerRow label="failure check">
            Perturb relative phase; reject peaks whose count or assigned locations move outside tolerance.
          </LedgerRow>
          <div style={{ background: soft(OK), borderTop: border, color: OK, fontSize: 10.5, fontWeight: 800, marginTop: "auto", padding: "7px 9px", textAlign: "center" }}>
            valid output · two stable, evidence-supported locations
          </div>
        </DecisionCard>
      </div>

      <figcaption
        className="lrl-summary"
        style={{
          alignItems: "center",
          borderTop: border,
          display: "flex",
          fontSize: 10.5,
          gap: "4px 16px",
          justifyContent: "center",
          marginTop: 10,
          paddingTop: 8,
        }}
      >
        <span><b style={{ color: ACCENT }}>larger L:</b> improves localization on fixed data</span>
        <span><b style={{ color: SUPPORT }}>larger N:</b> adds resolving evidence</span>
      </figcaption>
    </figure>
  );
}
