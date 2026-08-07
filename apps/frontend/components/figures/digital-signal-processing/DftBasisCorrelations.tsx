import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const rows = [
  ["1", "1", "1", "1"],
  ["1", "-j", "-1", "j"],
  ["1", "-1", "1", "-1"],
  ["1", "j", "-1", "-j"],
];
const input = ["1", "0", "-1", "0"];
const output = ["0", "2", "0", "2"];

function Vector({ values, outputVector = false }: { values: string[]; outputVector?: boolean }) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      {values.map((value, i) => {
        const active = outputVector && i === 1;
        const color = outputVector ? (active ? OK : undefined) : ACCENT;
        return (
          <div key={i} style={{ alignItems: "center", background: color ? `color-mix(in srgb, ${color} 10%, transparent)` : undefined, border: `1px solid ${color ?? "color-mix(in srgb, currentColor 24%, transparent)"}`, borderRadius: 4, color, display: "flex", height: 38, justifyContent: "center", minWidth: 42 }}>
            <M tex={value} size={12} />
          </div>
        );
      })}
    </div>
  );
}

function Basis() {
  return (
    <div>
      <div style={{ display: "grid", gap: 3, gridTemplateColumns: "30px repeat(4, 42px)", marginBottom: 3 }}>
        <span />
        {[0, 1, 2, 3].map((n) => <span key={n} style={{ ...labelMuted, textAlign: "center" }}>n={n}</span>)}
      </div>
      <div style={{ display: "grid", gap: 3 }}>
        {rows.map((row, k) => (
          <div key={k} style={{ display: "grid", gap: 3, gridTemplateColumns: "30px repeat(4, 42px)" }}>
            <span style={{ alignItems: "center", color: k === 1 ? SUPPORT : undefined, display: "flex", fontSize: 11, fontWeight: k === 1 ? 750 : 500, justifyContent: "center" }}>k={k}</span>
            {row.map((value, n) => (
              <div key={n} style={{ alignItems: "center", background: k === 1 ? `color-mix(in srgb, ${SUPPORT} 10%, transparent)` : undefined, border: `1px solid ${k === 1 ? SUPPORT : "color-mix(in srgb, currentColor 24%, transparent)"}`, borderRadius: 4, color: k === 1 ? SUPPORT : undefined, display: "flex", height: 38, justifyContent: "center" }}>
                <M tex={value} size={12} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DftBasisCorrelations() {
  const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: 760 }}>
      <style>{`
        .dbc-mobile-correlation { display: none; }
        @media (max-width: 450px) {
          .dbc-equation { grid-template-columns: 1fr !important; justify-items: center; }
          .dbc-desktop-correlation { display: none; }
          .dbc-mobile-correlation { display: grid; }
        }
      `}</style>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "4px 14px", justifyContent: "space-between", marginBottom: 10 }}>
        <b>Four correlations make one DFT</b>
        <span style={labelMuted}>unscaled forward transform · <M tex={String.raw`N=4`} size={11.5} /></span>
      </div>
      <div className="dbc-equation" style={{ alignItems: "center", display: "grid", gap: 12, gridTemplateColumns: "auto auto auto auto auto", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: ACCENT, fontWeight: 700, marginBottom: 5 }}><M tex={String.raw`x[n]`} size={12} /> input</div>
          <Vector values={input} />
        </div>
        <div className="dbc-operator" style={{ color: ACCENT, fontSize: 24, fontWeight: 400 }}>×</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginBottom: 5 }}>
            <b><M tex={String.raw`W_4^{kn}`} size={12} /> basis</b>
            <span style={{ border: `1px solid ${SUPPORT}`, borderRadius: 99, color: SUPPORT, fontSize: 10.5, fontWeight: 700, padding: "2px 7px" }}>analysis sign −j</span>
          </div>
          <Basis />
        </div>
        <div className="dbc-operator" style={{ color: OK, fontSize: 24 }}>=</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, marginBottom: 5 }}><M tex={String.raw`X[k]`} size={12} /> output</div>
          <Vector outputVector values={output} />
        </div>
      </div>
      <div style={{ alignItems: "center", borderTop: border, display: "flex", flexWrap: "wrap", gap: "5px 16px", justifyContent: "center", marginTop: 11, paddingTop: 9 }}>
        <M tex={String.raw`X[k]=\sum_{n=0}^{3}x[n]W_4^{kn}`} size={11.5} />
        <M tex={String.raw`W_4=e^{-j2\pi/4}=-j`} color={SUPPORT} size={11.5} />
      </div>
      <div className="dbc-desktop-correlation" style={{ background: `color-mix(in srgb, ${SUPPORT} 7%, transparent)`, border: `1px solid ${SUPPORT}`, borderRadius: 6, marginTop: 8, padding: "8px 10px", textAlign: "center" }}>
        <M tex={String.raw`\textcolor{${OK}}{X[1]}=\textcolor{${ACCENT}}{1}\textcolor{${SUPPORT}}{(1)}+\textcolor{${ACCENT}}{0}\textcolor{${SUPPORT}}{(-j)}+\textcolor{${ACCENT}}{(-1)}\textcolor{${SUPPORT}}{(-1)}+\textcolor{${ACCENT}}{0}\textcolor{${SUPPORT}}{(j)}=\textcolor{${OK}}{2}`} size={11.5} />
      </div>
      <div className="dbc-mobile-correlation" style={{ background: `color-mix(in srgb, ${SUPPORT} 7%, transparent)`, border: `1px solid ${SUPPORT}`, borderRadius: 6, gap: 3, marginTop: 8, padding: "8px 10px", textAlign: "center" }}>
        <M tex={String.raw`\textcolor{${OK}}{X[1]}=\textcolor{${ACCENT}}{1}\textcolor{${SUPPORT}}{(1)}+\textcolor{${ACCENT}}{0}\textcolor{${SUPPORT}}{(-j)}`} size={11.5} />
        <M tex={String.raw`\quad+\textcolor{${ACCENT}}{(-1)}\textcolor{${SUPPORT}}{(-1)}+\textcolor{${ACCENT}}{0}\textcolor{${SUPPORT}}{(j)}=\textcolor{${OK}}{2}`} size={11.5} />
      </div>
      <div style={{ ...labelMuted, marginTop: 7, textAlign: "center" }}>
        one highlighted analysis row · complete result <M tex={String.raw`X=[0,2,0,2]^{\mathsf T}`} size={11} />
      </div>
    </div>
  );
}
