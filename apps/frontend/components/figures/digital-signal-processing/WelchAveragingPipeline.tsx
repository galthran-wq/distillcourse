import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const soft = (c: string, n = 10) => `color-mix(in srgb, ${c} ${n}%, var(--panel))`;

function Badge({ n, color }: { n: number; color: string }) {
  return <span style={{ alignItems: "center", border: `1.5px solid ${color}`, borderRadius: "50%", color, display: "inline-flex", flex: "0 0 24px", fontSize: 12, fontWeight: 850, height: 24, justifyContent: "center" }}>{n}</span>;
}

function Stage({ n, color, title, detail, children }: { n: number; color: string; title: string; detail: string; children?: React.ReactNode }) {
  return <section style={{ background: soft(color), border: `1.4px solid color-mix(in srgb, ${color} 48%, transparent)`, borderRadius: 9, minWidth: 0, padding: "9px 10px" }}><div style={{ alignItems: "center", display: "flex", gap: 7 }}><Badge n={n} color={color}/><strong style={{ color, fontSize: 12.5 }}>{title}</strong></div><div style={{ ...labelMuted, fontSize: 12, margin: "5px 0 0 31px" }}>{detail}</div>{children}</section>;
}

function Arrow() { return <span className="wap-arrow" aria-hidden="true" style={{ alignSelf: "center", color: "currentColor", fontSize: 19, opacity: .5 }}>→</span>; }

function SegmentStrip({ overlap }: { overlap: boolean }) {
  const starts = overlap ? [4, 66, 128] : [4, 116, 228];
  return <svg viewBox="0 0 340 96" role="img" aria-label={overlap ? "Three overlapping segments reuse blue sample regions" : "Three nonoverlapping segments use disjoint samples"} style={{ display: "block", minWidth: 340, width: "100%" }}>
    <defs><pattern id={`hatch-${overlap}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke={SUPPORT} strokeWidth="2" opacity=".5"/></pattern></defs>
    <line x1="10" x2="330" y1="70" y2="70" stroke="currentColor" opacity=".4"/>
    {starts.map((x,i)=><g key={x}><path d={`M${x} 63 Q${x+48} ${26+i*4} ${x+96} 63`} fill="none" stroke={ACCENT} strokeWidth="2"/><text x={x+48} y={84} textAnchor="middle" fill={ACCENT} fontSize="12" fontWeight="700">m={i}</text></g>)}
    {overlap && <><rect x="66" y="42" width="34" height="28" fill={`url(#hatch-${overlap})`}/><rect x="128" y="42" width="34" height="28" fill={`url(#hatch-${overlap})`}/><text x="170" y="18" textAnchor="middle" fill={SUPPORT} fontSize="12" fontWeight="700">blue hatch = samples reused</text></>}
  </svg>;
}

export default function WelchAveragingPipeline() {
  return <figure aria-label="Welch estimation windows several segments, squares and normalizes each transform, and averages them; overlapping segments visibly reuse samples and therefore are correlated." style={{ color: "currentColor", containerType: "inline-size", fontFamily: "system-ui, sans-serif", lineHeight: 1.35, margin: 0, maxWidth: 800, minWidth: 0, width: "100%" }}>
    <style>{`@container(max-width:640px){.wap-flow{grid-template-columns:minmax(0,1fr)!important}.wap-arrow{transform:rotate(90deg)}.wap-formula{overflow-x:auto}}@container(max-width:720px){.wap-compare{grid-template-columns:minmax(0,1fr)!important}}`}</style>
    <header style={{ marginBottom: 10 }}><strong style={{ fontSize: 16 }}>Welch spends record length twice: resolution first, averaging second</strong><div style={{ ...labelMuted, marginTop: 3 }}>Every numbered badge reappears in the estimator formula below.</div></header>
    <div className="wap-flow" style={{ display: "grid", gap: 7, gridTemplateColumns: "1.15fr auto 1fr auto 1fr auto 1fr" }}>
      <Stage n={1} color={ACCENT} title="frame + window" detail="length M, hop H"/><Arrow/>
      <Stage n={2} color={SUPPORT} title="transform" detail="unscaled FFT"/><Arrow/>
      <Stage n={3} color={ACCENT} title="power-normalize" detail="divide by U=Σw²"/><Arrow/>
      <Stage n={4} color={OK} title="average" detail="K frame powers"/>
    </div>
    <div className="wap-formula" style={{ border, borderRadius: 8, marginTop: 9, minWidth: 0, padding: "9px 12px", textAlign: "center" }}><M display tex={String.raw`\widehat S_W(f)=\underbrace{\frac{1}{K}\sum_{m=0}^{K-1}}_{\textcolor{${OK}}{(4)\ \mathrm{average}}}\underbrace{\frac{\left|\underbrace{\sum_{n=0}^{M-1}\textcolor{${ACCENT}}{w[n]x[mH+n]}e^{-j2\pi fn}}_{\textcolor{${SUPPORT}}{(2)\ \mathrm{transform}}}\right|^2}{\textcolor{${ACCENT}}{U}}}_{\textcolor{${ACCENT}}{(1),(3)\ \mathrm{frame\ and\ normalize}}}`} size={13}/></div>
    <div className="wap-compare" style={{ display: "grid", gap: 9, gridTemplateColumns: "repeat(2,minmax(0,1fr))", marginTop: 9 }}>
      <section style={{ border, borderRadius: 9, minWidth: 0, overflow: "hidden", padding: "8px 9px" }}><strong style={{ fontSize: 12.5 }}>nonoverlap · disjoint evidence</strong><div style={{ maxWidth: "100%", overflowX: "auto" }}><SegmentStrip overlap={false}/></div><div style={{ ...labelMuted, fontSize: 12 }}>For independent records, variance falls approximately as 1/K.</div></section>
      <section style={{ border: `1.4px solid color-mix(in srgb, ${SUPPORT} 48%, transparent)`, borderRadius: 9, minWidth: 0, overflow: "hidden", padding: "8px 9px" }}><strong style={{ color: SUPPORT, fontSize: 12.5 }}>overlap · correlated evidence</strong><div style={{ maxWidth: "100%", overflowX: "auto" }}><SegmentStrip overlap/></div><div style={{ fontSize: 12 }}><b style={{ color: SUPPORT }}>K frames ≠ K independent averages.</b> Shared samples reduce effective evidence.</div></section>
    </div>
    <figcaption style={{ ...labelMuted, fontSize: 12, marginTop: 8, textAlign: "center" }}>Segment length fixes smoothing; averaging lowers variance; overlap changes the effective count.</figcaption>
  </figure>;
}
