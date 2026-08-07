import type { CSSProperties, ReactNode } from "react";

import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const tone = String.raw`\textcolor{${ACCENT}}{\text{coherent tone}}`;
const noise = String.raw`\textcolor{${SUPPORT}}{\text{white noise}}`;
const corrected = String.raw`\textcolor{${OK}}{\text{calibrated}}`;

const panel: CSSProperties = {
  border: "1px solid color-mix(in srgb, currentColor 20%, transparent)",
  borderRadius: 9,
  padding: "15px 16px",
  minWidth: 0,
};

function Badge({ n, color }: { n: number; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 23,
        height: 23,
        borderRadius: "50%",
        border: `1.5px solid ${color}`,
        color,
        fontSize: 12,
        fontWeight: 700,
        flex: "0 0 auto",
      }}
    >
      {n}
    </span>
  );
}

function StepRow({
  n,
  color,
  title,
  children,
}: {
  n: number;
  color: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "24px minmax(0, 1fr)",
        columnGap: 9,
        alignItems: "start",
      }}
    >
      <Badge n={n} color={color} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

function ResultCard({
  color,
  label,
  children,
}: {
  color: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        border: `1.4px solid ${color}`,
        borderRadius: 7,
        padding: "8px 10px",
        minWidth: 0,
      }}
    >
      <div style={{ color, fontSize: 11, fontWeight: 750, letterSpacing: "0.02em" }}>
        {label}
      </div>
      <div style={{ marginTop: 3 }}>{children}</div>
    </div>
  );
}

function MathScroll({ children }: { children: ReactNode }) {
  return <div style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}>{children}</div>;
}

function WindowBars() {
  const weights = [0, 0.5, 1, 0.5];
  const squares = [0, 0.25, 1, 0.25];
  const xs = [52, 116, 180, 244];

  return (
    <svg
      viewBox="0 0 300 150"
      role="img"
      aria-label="Four Hann weights zero, one half, one, one half and their squares zero, one quarter, one, one quarter"
      style={{ width: "100%", maxWidth: 330, height: "auto", display: "block" }}
    >
      <line x1="31" y1="63" x2="275" y2="63" stroke="currentColor" strokeOpacity="0.3" />
      <line x1="31" y1="130" x2="275" y2="130" stroke="currentColor" strokeOpacity="0.3" />
      <text x="4" y="27" fill={ACCENT} fontSize="12" fontWeight="700">
        w[n]
      </text>
      <text x="4" y="94" fill={SUPPORT} fontSize="12" fontWeight="700">
        w²[n]
      </text>
      {weights.map((value, i) => {
        const h = value * 46;
        return (
          <g key={`w-${i}`}>
            <rect
              x={xs[i] - 15}
              y={63 - h}
              width="30"
              height={Math.max(h, 1.5)}
              rx="3"
              fill={ACCENT}
              fillOpacity="0.78"
            />
            <text x={xs[i]} y={13} textAnchor="middle" fill="currentColor" fontSize="11">
              {value}
            </text>
          </g>
        );
      })}
      {squares.map((value, i) => {
        const h = value * 46;
        return (
          <g key={`w2-${i}`}>
            <rect
              x={xs[i] - 15}
              y={130 - h}
              width="30"
              height={Math.max(h, 1.5)}
              rx="3"
              fill={SUPPORT}
              fillOpacity="0.75"
            />
            <text x={xs[i]} y="146" textAnchor="middle" fill="currentColor" fontSize="11">
              n={i}
            </text>
            <text x={xs[i]} y="80" textAnchor="middle" fill="currentColor" fontSize="11">
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function WindowCalibrationLedger() {
  return (
    <div
      className="wcl-root"
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        lineHeight: 1.38,
        maxWidth: 820,
        minWidth: 0,
        width: "100%",
        color: "currentColor",
      }}
    >
      <style>{`@media(max-width:640px){.wcl-summary,.wcl-paths{grid-template-columns:minmax(0,1fr)!important}.wcl-arrows{display:none!important}.wcl-paths{gap:12px!important}}`}</style>
      <div style={{ fontSize: 17, fontWeight: 750 }}>One periodic Hann window, two calibration paths</div>
      <div style={{ ...labelMuted, marginTop: 3 }}>
        The same four weights add coherently for a tone and add in squared magnitude for independent noise.
      </div>

      <div
        className="wcl-summary"
        style={{
          ...panel,
          marginTop: 13,
          display: "grid",
          gridTemplateColumns: "minmax(250px, 0.9fr) minmax(280px, 1.1fr)",
          gap: 18,
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}><WindowBars /></div>
        <div style={{ minWidth: 0 }}>
          <MathScroll><M display tex={String.raw`N=4,\qquad w=[0,\,0.5,\,1,\,0.5]`} /></MathScroll>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
              gap: 9,
              marginTop: 6,
            }}
          >
            <ResultCard color={ACCENT} label="COHERENT SUM">
              <M tex={String.raw`C_w=\sum_n w[n]=2`} />
              <div style={{ ...labelMuted, marginTop: 2 }}>
                <M tex={String.raw`G_c=C_w/N=0.5`} size={12} />
              </div>
            </ResultCard>
            <ResultCard color={SUPPORT} label="SQUARED SUM">
              <M tex={String.raw`\sum_n w^2[n]=1.5`} />
              <div style={{ ...labelMuted, marginTop: 2 }}>independent powers accumulate</div>
            </ResultCard>
          </div>
        </div>
      </div>

      <div
        className="wcl-arrows"
        aria-hidden="true"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          height: 24,
          margin: "0 24px",
        }}
      >
        <svg viewBox="0 0 300 24" preserveAspectRatio="none" style={{ width: "100%", height: 24 }}>
          <path d="M150 0 V8 H75 V21" fill="none" stroke={ACCENT} strokeWidth="1.5" />
          <path d="M69 16 L75 22 L81 16" fill="none" stroke={ACCENT} strokeWidth="1.5" />
        </svg>
        <svg viewBox="0 0 300 24" preserveAspectRatio="none" style={{ width: "100%", height: 24 }}>
          <path d="M150 0 V8 H225 V21" fill="none" stroke={SUPPORT} strokeWidth="1.5" />
          <path d="M219 16 L225 22 L231 16" fill="none" stroke={SUPPORT} strokeWidth="1.5" />
        </svg>
      </div>

      <div
        className="wcl-paths"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: 14,
        }}
      >
        <section style={{ ...panel, borderTop: `4px solid ${ACCENT}` }}>
          <div style={{ color: ACCENT, fontSize: 15, fontWeight: 750, marginBottom: 12 }}>
            Tone path: amplitudes use <M tex={String.raw`\sum w`} color={ACCENT} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <StepRow n={1} color={ACCENT} title="Matching bin">
              <M tex={String.raw`X_w[1]=A\,C_w=2A`} />
            </StepRow>
            <StepRow n={2} color={ACCENT} title="The N-only report is biased">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <ResultCard color={ACCENT} label="UNCORRECTED">
                  <M tex={String.raw`|X_w[1]|/N=0.5A`} />
                  <div style={{ ...labelMuted, marginTop: 2 }}>−6.02 dB amplitude bias</div>
                </ResultCard>
                <ResultCard color={OK} label="CALIBRATED">
                  <M tex={String.raw`|X_w[1]|/C_w=A`} />
                </ResultCard>
              </div>
            </StepRow>
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px dashed color-mix(in srgb, currentColor 28%, transparent)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 750, marginBottom: 5 }}>HALF-BIN INSET · FINITE N=4</div>
            <MathScroll><M
                display
                tex={String.raw`\frac{|W(e^{j\pi/N})|}{|W(1)|}=\frac{2+\sqrt2}{4}=0.8536`}
              /></MathScroll>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={labelMuted}>coherent correction remains applied</span>
              <span style={{ color: ACCENT, fontWeight: 750 }}>
                <M tex={String.raw`L_s=1.38\ \mathrm{dB}`} color={ACCENT} />
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              borderRadius: 6,
              background: "color-mix(in srgb, currentColor 6%, transparent)",
              padding: "8px 10px",
              fontSize: 12,
            }}
          >
            <b>Real-cosine guard:</b> use <M tex={String.raw`2|X_w[k]|/C_w`} size={12} /> at an interior positive bin;
            use <M tex={String.raw`|X_w[k]|/C_w`} size={12} /> at DC or even-<M tex="N" size={12} /> Nyquist.
          </div>
        </section>

        <section style={{ ...panel, borderTop: `4px solid ${SUPPORT}` }}>
          <div style={{ color: SUPPORT, fontSize: 15, fontWeight: 750, marginBottom: 12 }}>
            Noise path: powers use <M tex={String.raw`\sum w^2`} color={SUPPORT} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <StepRow n={1} color={SUPPORT} title="Independent samples add in power">
              <MathScroll><M tex={String.raw`E\{|Q_w[k]|^2\}=\sigma^2\sum_nw^2[n]=1.5\sigma^2`} /></MathScroll>
            </StepRow>
            <StepRow n={2} color={SUPPORT} title="Use the same tone calibration">
              <MathScroll><M
                  display
                  tex={String.raw`\frac{E\{|Q_w[k]|^2\}}{C_w^2}=\frac{1.5}{2^2}\sigma^2=0.375\sigma^2`}
                /></MathScroll>
            </StepRow>
            <StepRow n={3} color={SUPPORT} title="Express the result as bandwidth">
              <ResultCard color={SUPPORT} label="EQUIVALENT NOISE BANDWIDTH">
                <MathScroll><M display tex={String.raw`B_e=N\frac{\sum_nw^2[n]}{(\sum_nw[n])^2}=4\frac{1.5}{2^2}=1.5\ \text{bins}`} /></MathScroll>
              </ResultCard>
            </StepRow>
          </div>

          <div
            style={{
              marginTop: 14,
              borderRadius: 6,
              background: "color-mix(in srgb, currentColor 6%, transparent)",
              padding: "9px 10px",
              fontSize: 12,
            }}
          >
            A rectangular reference has <M tex={String.raw`B_e=1`} size={12} /> bin. After tone calibration, Hann collects
            <b style={{ color: SUPPORT }}> 1.5× the white-noise power</b> in one coefficient.
          </div>
        </section>
      </div>

      <div
        style={{
          marginTop: 13,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          fontSize: 13,
          fontWeight: 650,
        }}
      >
        <M tex={tone} />
        <span style={labelMuted}>→</span>
        <M tex={String.raw`C_w=\sum w`} color={ACCENT} />
        <span style={{ ...labelMuted, margin: "0 5px" }}>but</span>
        <M tex={noise} />
        <span style={labelMuted}>→</span>
        <M tex={String.raw`\sum w^2`} color={SUPPORT} />
        <span style={{ ...labelMuted, marginLeft: 5 }}>under the same</span>
        <M tex={corrected} />
        <span style={labelMuted}>tone scale</span>
      </div>
    </div>
  );
}
