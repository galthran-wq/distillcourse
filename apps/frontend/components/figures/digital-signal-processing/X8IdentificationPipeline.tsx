import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

function StepHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderBottom: border,
        fontSize: 11,
        fontWeight: 780,
        letterSpacing: "0.035em",
        padding: "9px 11px 8px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Card({
  children,
  header,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
}) {
  return (
    <section
      className="x8ip-card"
      style={{
        background: "var(--panel)",
        border,
        borderRadius: 10,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <StepHeader>{header}</StepHeader>
      <div style={{ display: "grid", gap: 10, padding: 11 }}>{children}</div>
    </section>
  );
}

function FlowArrow() {
  return (
    <div
      aria-hidden="true"
      className="x8ip-arrow"
      style={{
        alignItems: "center",
        color: ACCENT,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 26 32" style={{ display: "block", width: 26 }}>
        <path
          d="M2 16H21M16 10L22 16L16 22"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    </div>
  );
}

function AircraftMark() {
  return (
    <svg
      aria-label="Generic fixed-wing aircraft symbol"
      role="img"
      viewBox="0 0 180 70"
      style={{ display: "block", height: 62, width: "100%" }}
    >
      <path
        d="M90 7L98 29L156 42L155 49L99 44L96 59L112 64L111 68L90 64L69 68L68 64L84 59L81 44L25 49L24 42L82 29Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M4 14H42M13 22H50"
        fill="none"
        stroke="currentColor"
        strokeDasharray="4 4"
        strokeLinecap="round"
        strokeWidth="1.3"
        opacity="0.55"
      />
      <path
        d="M37 10L43 14L37 18M45 18L51 22L45 26"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
        opacity="0.55"
      />
    </svg>
  );
}

function SampleTicks({ color }: { color: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 116 18" style={{ display: "block", width: "100%" }}>
      <path d="M2 15H114" stroke="currentColor" strokeOpacity="0.16" />
      {[8, 24, 40, 56, 72, 88, 104].map((x) => (
        <path key={x} d={`M${x} 6V15`} stroke={color} strokeLinecap="round" strokeWidth="2.2" />
      ))}
    </svg>
  );
}

function Channel({
  color,
  label,
  tex,
}: {
  color: string;
  label: string;
  tex: string;
}) {
  return (
    <div
      style={{
        border: `1px solid color-mix(in srgb, ${color} 42%, transparent)`,
        borderRadius: 7,
        minWidth: 0,
        padding: "7px 8px 5px",
      }}
    >
      <div style={{ color, fontSize: 10.5, fontWeight: 720, lineHeight: 1.25 }}>
        {label} <M tex={role(color, tex)} size={10.5} />
      </div>
      <SampleTicks color={color} />
    </div>
  );
}

function CheckRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: 7 }}>
      <span
        aria-hidden="true"
        style={{
          border: "1px solid currentColor",
          borderRadius: 2,
          display: "inline-block",
          flex: "0 0 auto",
          height: 7,
          opacity: 0.42,
          width: 7,
        }}
      />
      <span style={{ fontSize: 11.5, lineHeight: 1.35 }}>{children}</span>
    </div>
  );
}

function ResetBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1.3px solid ${SUPPORT}`,
        borderRadius: 7,
        color: SUPPORT,
        display: "grid",
        padding: "7px 8px",
      }}
    >
      <strong style={{ fontSize: 11.5 }}>{children} · reset</strong>
    </div>
  );
}

export default function X8IdentificationPipeline() {
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
        @media (max-width: 420px) {
          .x8ip-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 8px !important; }
          .x8ip-arrow { display: none !important; }
          .x8ip-card { border-radius: 9px !important; }
          .x8ip-channel-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .x8ip-model-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .x8ip-limit { align-items: flex-start !important; flex-direction: column; }
          .x8ip-no-return { align-items: flex-start !important; }
          .x8ip-no-return-copy { font-size: 11.5px !important; }
          .x8ip-caption { font-size: 11.5px !important; line-height: 1.45 !important; }
        }
      `}</style>

      <div
        className="x8ip-grid"
        style={{
          alignItems: "stretch",
          display: "grid",
          gap: 7,
          gridTemplateColumns:
            "minmax(0, 1.08fr) 26px minmax(0, 1fr) 26px minmax(0, 1fr)",
        }}
      >
        <Card header="1 · physical flight → released record">
          <div style={{ textAlign: "center" }}>
            <AircraftMark />
            <strong style={{ fontSize: 12.5 }}>Skywalker X8 fixed-wing UAV</strong>
            <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 3 }}>
              strong NW wind + vertical component
            </div>
          </div>

          <div
            style={{
              borderTop: border,
              display: "grid",
              gap: 6,
              paddingTop: 9,
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, textAlign: "center" }}>
              manual sync + resampling
            </div>
            <div style={{ fontSize: 11, textAlign: "center" }}>
              40 samples/s · <M tex={String.raw`T_s=0.025\,\mathrm{s}`} size={11} />
            </div>
            <div
              className="x8ip-channel-grid"
              style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
            >
              <Channel color={ACCENT} label="elevator" tex={String.raw`u[n]\cdot\mathrm{rad}`} />
              <Channel color={SUPPORT} label="IMU pitch rate" tex={String.raw`q[n]\cdot\mathrm{rad/s}`} />
            </div>
          </div>
        </Card>

        <FlowArrow />

        <Card header="2 · training files choose">
          <div style={{ color: ACCENT, fontSize: 11.5, fontWeight: 750 }}>
            7 independent maneuvers · reset <M tex={role(ACCENT, "n=0")} size={11.5} />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <CheckRow>MD5 · 41 fields · time check</CheckRow>
            <CheckRow>fixed order + effective lag</CheckRow>
          </div>
          <div
            className="x8ip-model-grid"
            style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
          >
            <div style={{ border, borderRadius: 7, padding: "8px 6px", textAlign: "center" }}>
              <M tex={String.raw`\operatorname{AR}(2)`} size={12} />
            </div>
            <div
              style={{
                border: `1.3px solid ${ACCENT}`,
                borderRadius: 7,
                color: ACCENT,
                padding: "8px 6px",
                textAlign: "center",
              }}
            >
              <M tex={role(ACCENT, String.raw`\operatorname{ARX}(2,1,1)`)} size={12} />
            </div>
          </div>
          <div style={{ fontSize: 10.5, marginTop: -5, textAlign: "center" }}>
            fit AR(2) and ARX(2,1,1)
          </div>
          <div
            style={{
              alignItems: "center",
              border: `1.7px solid ${ACCENT}`,
              borderRadius: 8,
              color: ACCENT,
              display: "flex",
              fontSize: 12,
              fontWeight: 850,
              justifyContent: "center",
              letterSpacing: "0.12em",
              marginTop: 1,
              padding: "7px 8px",
            }}
          >
            FREEZE
          </div>
        </Card>

        <FlowArrow />

        <Card header="3 · validation files judge">
          <div style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <ResetBadge>3211_5</ResetBadge>
            <ResetBadge>doublet_4</ResetBadge>
          </div>
          <div style={{ borderTop: border, display: "grid", gap: 7, paddingTop: 9 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                "one step",
                "free run",
              ].map((mode) => (
                <span
                  key={mode}
                  style={{
                    border: `1px solid ${SUPPORT}`,
                    borderRadius: 999,
                    color: SUPPORT,
                    flex: "1 1 70px",
                    fontSize: 11,
                    fontWeight: 720,
                    padding: "5px 7px",
                    textAlign: "center",
                  }}
                >
                  {mode}
                </span>
              ))}
            </div>
            <div
              style={{
                border: border,
                borderRadius: 7,
                fontSize: 11.5,
                fontWeight: 700,
                padding: "8px",
                textAlign: "center",
              }}
            >
              per-file residual + ACF
            </div>
          </div>
        </Card>
      </div>

      <div
        className="x8ip-limit"
        style={{
          alignItems: "center",
          borderBottom: border,
          display: "flex",
          gap: "5px 12px",
          justifyContent: "center",
          marginTop: 9,
          padding: "0 4px 9px",
        }}
      >
        <span style={{ ...labelMuted, fontSize: 10.5, fontWeight: 750, textTransform: "uppercase" }}>
          record → model limit
        </span>
        <span style={{ fontSize: 11.5 }}>
          manual synchronization prevents exact actuator-delay inference
        </span>
      </div>

      <div
        className="x8ip-no-return"
        style={{
          alignItems: "center",
          display: "flex",
          gap: 9,
          marginTop: 9,
          padding: "0 3px",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            alignItems: "center",
            border: "1.5px solid currentColor",
            borderRadius: "50%",
            display: "inline-flex",
            flex: "0 0 22px",
            fontSize: 15,
            fontWeight: 800,
            height: 22,
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          ×
        </span>
        <span className="x8ip-no-return-copy" style={{ fontSize: 11.5, lineHeight: 1.4 }}>
          <strong>NO RETURN:</strong> validation cannot tune preprocessing, order,
          lag, coefficients, or plot windows
        </span>
        <span
          aria-hidden="true"
          style={{
            borderLeft: `2px solid ${ACCENT}`,
            color: ACCENT,
            fontSize: 10.5,
            fontWeight: 800,
            marginLeft: "auto",
            paddingLeft: 7,
            whiteSpace: "nowrap",
          }}
        >
          ⊣ FREEZE
        </span>
      </div>

      <figcaption
        className="x8ip-caption"
        style={{ ...labelMuted, fontSize: 10.5, marginTop: 9, textAlign: "center" }}
      >
        Training choices stop at FREEZE; both validation maneuvers start from
        independent state and move only forward to judgment.
      </figcaption>
    </figure>
  );
}
