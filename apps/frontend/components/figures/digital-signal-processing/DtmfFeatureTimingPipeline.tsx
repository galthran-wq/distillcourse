import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

function FlowArrow({ vertical = false }: { vertical?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        alignItems: "center",
        display: "inline-flex",
        flex: "0 0 auto",
        justifyContent: "center",
        opacity: 0.62,
        transform: vertical ? "rotate(90deg)" : undefined,
        width: 22,
      }}
    >
      ⟶
    </span>
  );
}

function StageCard({
  children,
  color,
  heading,
}: {
  children: React.ReactNode;
  color?: string;
  heading: string;
}) {
  return (
    <section
      style={{
        background: "var(--panel)",
        border: color
          ? `1.4px solid color-mix(in srgb, ${color} 68%, transparent)`
          : border,
        borderRadius: 9,
        minWidth: 0,
        padding: "9px 10px",
      }}
    >
      <div
        style={{
          color,
          fontSize: 11,
          fontWeight: 780,
          letterSpacing: "0.035em",
          marginBottom: 5,
          textTransform: "uppercase",
        }}
      >
        {heading}
      </div>
      {children}
    </section>
  );
}

function FeatureRail() {
  return (
    <svg
      aria-label="A 205-sample feature span ending before the 320-sample duration boundary"
      role="img"
      viewBox="0 0 320 48"
      style={{ display: "block", height: 48, width: "100%" }}
    >
      <path
        d="M12 27H304"
        fill="none"
        stroke="currentColor"
        strokeDasharray="4 4"
        strokeOpacity="0.28"
      />
      <path
        d="M12 27H199"
        fill="none"
        stroke={ACCENT}
        strokeLinecap="round"
        strokeWidth="6"
      />
      <path d="M12 18V35M199 15V37M304 15V37" stroke="currentColor" strokeOpacity="0.48" />
      <circle cx="199" cy="27" fill={ACCENT} r="5" />
      <text x="12" y="45" fill="currentColor" fontSize="10" opacity="0.55">
        received onset
      </text>
      <text x="199" y="11" fill={ACCENT} fontSize="10.5" fontWeight="700" textAnchor="middle">
        205
      </text>
      <text x="304" y="11" fill="currentColor" fontSize="10.5" opacity="0.55" textAnchor="end">
        320
      </text>
    </svg>
  );
}

function TemporalRail() {
  return (
    <svg
      aria-label="Temporal state persisting from received-signal onset through at least 320 samples"
      role="img"
      viewBox="0 0 320 48"
      style={{ display: "block", height: 48, width: "100%" }}
    >
      <path d="M12 27H304" fill="none" stroke={SUPPORT} strokeLinecap="round" strokeWidth="6" />
      {[12, 48.5, 85, 121.5, 158, 194.5, 231, 267.5, 304].map((x) => (
        <path key={x} d={`M${x} 18V35`} stroke="currentColor" strokeOpacity="0.42" />
      ))}
      <circle cx="304" cy="27" fill={SUPPORT} r="5" />
      <text x="12" y="45" fill="currentColor" fontSize="10" opacity="0.55">
        received onset
      </text>
      <text x="158" y="11" fill={SUPPORT} fontSize="10.5" fontWeight="700" textAnchor="middle">
        state persists across blocks
      </text>
      <text x="304" y="45" fill={SUPPORT} fontSize="10.5" fontWeight="700" textAnchor="end">
        320+
      </text>
    </svg>
  );
}

function Gate({
  children,
  detail,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
}) {
  return (
    <div
      style={{
        border,
        borderRadius: 6,
        display: "grid",
        gap: 2,
        minWidth: 0,
        padding: "6px 7px",
      }}
    >
      <strong style={{ fontSize: 10.5 }}>{children}</strong>
      <span style={{ ...labelMuted, fontSize: 9.5, lineHeight: 1.3 }}>{detail}</span>
    </div>
  );
}

function DecisionOutput({
  kind,
}: {
  kind: "KEY" | "REJECT";
}) {
  const accepted = kind === "KEY";
  return (
    <div
      style={{
        alignItems: "center",
        background: accepted
          ? `color-mix(in srgb, ${OK} 14%, transparent)`
          : undefined,
        border: accepted ? `1.5px solid ${OK}` : "1.5px dashed currentColor",
        borderRadius: 7,
        display: "flex",
        fontSize: 12,
        fontWeight: 820,
        gap: 7,
        justifyContent: "center",
        minHeight: 34,
        padding: "4px 8px",
      }}
    >
      <span aria-hidden="true" style={{ color: accepted ? OK : "currentColor", fontSize: 16 }}>
        {accepted ? "✓" : "×"}
      </span>
      {kind}
    </div>
  );
}

export default function DtmfFeatureTimingPipeline({ frame }: { frame?: number }) {
  const forcedWidth = frame === 312 || frame === 360 ? frame : undefined;

  return (
    <div
      style={{
        color: "currentColor",
        containerType: "inline-size",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.35,
        maxWidth: 760,
        width: forcedWidth ?? "100%",
      }}
    >
      <style>{`
        @container (max-width: 520px) {
          .dtftp-origin-flow { grid-template-columns: minmax(0, 1fr) !important; }
          .dtftp-origin-arrow { display: flex; justify-content: center; }
          .dtftp-origin-arrow > span { transform: rotate(90deg); }
          .dtftp-lanes { grid-template-columns: minmax(0, 1fr) !important; }
          .dtftp-decision { grid-template-columns: minmax(0, 1fr) !important; }
          .dtftp-decision-arrow { display: flex; justify-content: center; }
          .dtftp-decision-arrow > span { transform: rotate(90deg); }
          .dtftp-and-rows { grid-template-columns: minmax(0, 1fr) !important; }
          .dtftp-gates { grid-template-columns: minmax(0, 1fr) !important; }
          .dtftp-origin-bracket { grid-template-columns: minmax(0, 1fr) !important; gap: 3px !important; text-align: center; }
          .dtftp-origin-bracket-arrow { display: flex; justify-content: center; }
          .dtftp-origin-bracket-arrow > span { transform: rotate(90deg); }
          .dtftp-caption { font-size: 11.5px !important; line-height: 1.45 !important; }
        }
        @container (max-width: 330px) {
          .dtftp-caption { display: none !important; }
        }
      `}</style>

      <header
        style={{
          alignItems: "baseline",
          display: "flex",
          flexWrap: "wrap",
          gap: "3px 12px",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <strong style={{ fontSize: 14 }}>spectral evidence and temporal qualification</strong>
        <M tex={String.raw`f_s=8000\,\mathrm{Hz}`} size={11.5} />
      </header>

      <div
        className="dtftp-origin-flow"
        style={{
          alignItems: "center",
          display: "grid",
          gap: 8,
          gridTemplateColumns: "minmax(0, 1fr) 24px minmax(0, 1fr)",
        }}
      >
        <StageCard color={ACCENT} heading="synthetic source">
          <div style={{ fontSize: 12, fontWeight: 700 }}>
            key 5 · <M tex={role(ACCENT, String.raw`770\,\mathrm{Hz}`)} size={11.5} /> +{" "}
            <M tex={role(SUPPORT, String.raw`1336\,\mathrm{Hz}`)} size={11.5} />
          </div>
          <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 2 }}>source-signal onset</div>
        </StageCard>

        <span className="dtftp-origin-arrow">
          <FlowArrow />
        </span>

        <StageCard heading="course FIR, not Q.24">
          <div style={{ fontSize: 12, fontWeight: 700 }}>101 taps · synthetic 300–3400 Hz</div>
          <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 2 }}>received-signal onset follows the filter</div>
        </StageCard>
      </div>

      <div
        className="dtftp-origin-bracket"
        style={{
          alignItems: "center",
          borderBottom: border,
          display: "grid",
          gap: 7,
          gridTemplateColumns: "auto 22px auto 1fr",
          margin: "7px 2px 10px",
          padding: "0 4px 8px",
        }}
      >
        <span style={{ color: ACCENT, fontSize: 10.5, fontWeight: 750 }}>source origin</span>
        <span className="dtftp-origin-bracket-arrow"><FlowArrow /></span>
        <span style={{ fontSize: 11.5, fontWeight: 760 }}>
          <M tex={String.raw`50\ \text{samples}=6.25\,\mathrm{ms}`} size={11.5} />
        </span>
        <span style={{ color: SUPPORT, fontSize: 10.5, fontWeight: 750, textAlign: "right" }}>
          received-signal origin · the 40 ms clock starts here
        </span>
      </div>

      <div
        className="dtftp-lanes"
        style={{
          alignItems: "stretch",
          display: "grid",
          gap: 9,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <section
          style={{
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 10,
            display: "grid",
            gap: 8,
            minWidth: 0,
            padding: 10,
          }}
        >
          <div>
            <div style={{ color: ACCENT, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              1 · spectral evidence · one frame
            </div>
            <div style={{ fontSize: 13, fontWeight: 760, marginTop: 3 }}>
              <M tex={role(ACCENT, String.raw`N=205=25.625\,\mathrm{ms}`)} size={12.5} /> · rectangular
            </div>
          </div>
          <FeatureRail />
          <div
            style={{
              background: `color-mix(in srgb, ${ACCENT} 10%, transparent)`,
              borderRadius: 7,
              display: "grid",
              gap: 2,
              padding: "7px 8px",
              textAlign: "center",
            }}
          >
            <strong style={{ color: ACCENT, fontSize: 11.5 }}>eight declared coordinates</strong>
            <span style={{ ...labelMuted, fontSize: 10 }}>
              one family only: exact <M tex={String.raw`C(f)`} size={10} /> or declared grid bins
            </span>
          </div>
          <div className="dtftp-gates" style={{ display: "grid", gap: 5, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <Gate detail="operate ≤±1.5%; non-operate from ±3.5%">frequency</Gate>
            <Gate detail="frozen local threshold">dominance</Gate>
            <Gate detail="high − low: −8 to +4 dB">twist</Gate>
          </div>
          <div style={{ color: ACCENT, fontSize: 10.5, fontWeight: 760, textAlign: "right" }}>
            spectral pass →
          </div>
        </section>

        <section
          style={{
            border: `1.5px solid ${SUPPORT}`,
            borderRadius: 10,
            display: "grid",
            gap: 8,
            minWidth: 0,
            padding: 10,
          }}
        >
          <div>
            <div style={{ color: SUPPORT, fontSize: 11, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              2 · temporal state · across frames
            </div>
            <div style={{ fontSize: 13, fontWeight: 760, marginTop: 3 }}>
              <M tex={role(SUPPORT, String.raw`\ge 320\ \text{received samples}=40\,\mathrm{ms}`)} size={12.5} />
            </div>
          </div>
          <TemporalRail />
          <div
            style={{
              background: `color-mix(in srgb, ${SUPPORT} 10%, transparent)`,
              borderRadius: 7,
              display: "grid",
              gap: 2,
              padding: "7px 8px",
              textAlign: "center",
            }}
          >
            <strong style={{ color: SUPPORT, fontSize: 11.5 }}>persistent temporal state</strong>
            <span style={{ ...labelMuted, fontSize: 10 }}>the 205-sample frame cannot certify this boundary</span>
          </div>
          <div className="dtftp-gates" style={{ display: "grid", gap: 5, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <Gate detail="operation side ≥40 ms">duration</Gate>
            <Gate detail="required ≥40 ms">pause</Gate>
            <Gate detail="tolerated ≤10 ms">interruption</Gate>
          </div>
          <div style={{ color: SUPPORT, fontSize: 10.5, fontWeight: 760, textAlign: "right" }}>
            temporal pass →
          </div>
        </section>
      </div>

      <div
        style={{
          ...labelMuted,
          fontSize: 9.5,
          margin: "5px 2px 0",
          textAlign: "right",
        }}
      >
        named AT&amp;T profile · every failed or ambiguous gate rejects
      </div>

      <div
        className="dtftp-decision"
        style={{
          alignItems: "center",
          borderTop: border,
          display: "grid",
          gap: 8,
          gridTemplateColumns: "minmax(0, 1fr) 24px minmax(150px, 0.55fr)",
          marginTop: 9,
          paddingTop: 9,
        }}
      >
        <div
          className="dtftp-and-rows"
          style={{
            display: "grid",
            gap: 6,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          <div style={{ border: `1.3px solid ${ACCENT}`, borderRadius: 7, color: ACCENT, fontSize: 11, fontWeight: 760, padding: "7px 8px", textAlign: "center" }}>
            spectral pass
          </div>
          <div style={{ border: `1.3px solid ${SUPPORT}`, borderRadius: 7, color: SUPPORT, fontSize: 11, fontWeight: 760, padding: "7px 8px", textAlign: "center" }}>
            temporal pass
          </div>
          <div style={{ border: `1.5px solid ${OK}`, borderRadius: 7, fontSize: 11, fontWeight: 800, gridColumn: "1 / -1", padding: "7px 8px", textAlign: "center" }}>
            AND · both pass
          </div>
          <div style={{ border: "1.3px dashed currentColor", borderRadius: 7, fontSize: 10.5, gridColumn: "1 / -1", opacity: 0.72, padding: "6px 8px", textAlign: "center" }}>
            any gate fails or is ambiguous
          </div>
        </div>

        <span className="dtftp-decision-arrow"><FlowArrow /></span>

        <div style={{ display: "grid", gap: 7 }}>
          <DecisionOutput kind="KEY" />
          <DecisionOutput kind="REJECT" />
        </div>
      </div>

      <div className="dtftp-caption" style={{ ...labelMuted, fontSize: 10.5, marginTop: 8, textAlign: "center" }}>
        One feature frame supplies evidence; only persistent temporal state can satisfy the received-origin duration gate.
      </div>
    </div>
  );
}
