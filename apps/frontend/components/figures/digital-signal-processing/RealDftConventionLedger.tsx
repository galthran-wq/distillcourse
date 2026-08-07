import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const soft = (color: string) =>
  `color-mix(in srgb, ${color} 12%, var(--panel))`;
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const bins = [0, 1, 2, 3, 4, 5, 6, 7];
const signedKhz = ["0", "+1", "+2", "+3", "-4", "-3", "-2", "-1"];
const dft = [0, 4, 0, 0, 0, 0, 0, 4];

function StripLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        ...labelMuted,
        fontSize: 10,
        fontWeight: 750,
        letterSpacing: "0.055em",
        marginBottom: 4,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function EightCells({
  kind,
}: {
  kind: "index" | "frequency" | "coefficient";
}) {
  const values =
    kind === "index" ? bins.map(String) : kind === "frequency" ? signedKhz : dft.map(String);

  return (
    <div
      className="rdcl-eight"
      style={{
        display: "grid",
        gap: 4,
        gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
      }}
    >
      {values.map((value, index) => {
        const positive = index === 1;
        const negative = index === 7;
        const active = positive || negative;
        return (
          <div
            key={`${kind}-${index}`}
            style={{
              alignItems: "center",
              background: positive
                ? soft(ACCENT)
                : negative
                  ? soft(SUPPORT)
                  : kind === "coefficient"
                    ? "var(--panel)"
                    : "transparent",
              border: kind === "coefficient" ? border : "1px solid transparent",
              borderRadius: 5,
              color: positive ? ACCENT : negative ? SUPPORT : "currentColor",
              display: "flex",
              fontSize: kind === "coefficient" ? 15 : 11,
              fontWeight: active ? 800 : kind === "coefficient" ? 650 : 600,
              justifyContent: "center",
              minHeight: kind === "coefficient" ? 34 : 20,
              minWidth: 0,
            }}
          >
            {value}
          </div>
        );
      })}
    </div>
  );
}

function PairBrace() {
  return (
    <div style={{ marginTop: 3 }}>
      <svg
        aria-hidden="true"
        preserveAspectRatio="none"
        style={{ display: "block", height: 24, width: "100%" }}
        viewBox="0 0 800 24"
      >
        <path
          d="M150 4 C250 23 650 23 750 4"
          fill="none"
          stroke="currentColor"
          strokeDasharray="4 4"
          strokeOpacity="0.46"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="150" cy="4" fill={ACCENT} r="3.5" />
        <circle cx="750" cy="4" fill={SUPPORT} r="3.5" />
      </svg>
      <div
        className="rdcl-pair"
        style={{
          alignItems: "center",
          display: "grid",
          gap: 6,
          gridTemplateColumns: "1fr auto 1fr",
          marginTop: -2,
          textAlign: "center",
        }}
      >
        <strong style={{ color: ACCENT, fontSize: 11 }}>+1 kHz · positive frequency</strong>
        <M tex={String.raw`${role(SUPPORT, "X[7]")}=${role(ACCENT, "X^{*}[1]")} = 4`} size={13} />
        <strong style={{ color: SUPPORT, fontSize: 11 }}>−1 kHz · negative frequency</strong>
      </div>
    </div>
  );
}

function FiveCells({
  values,
  greenAtOne = false,
}: {
  values: string[];
  greenAtOne?: boolean;
}) {
  return (
    <div
      className="rdcl-five"
      style={{
        display: "grid",
        gap: 5,
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
      }}
    >
      {values.map((value, index) => {
        const active = index === 1;
        const color = active ? (greenAtOne ? OK : ACCENT) : "currentColor";
        return (
          <div
            key={`${greenAtOne ? "amplitude" : "packed"}-${index}`}
            style={{
              background: active ? soft(color) : "var(--panel)",
              border,
              borderRadius: 5,
              color,
              minWidth: 0,
              padding: "6px 3px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 9.5, fontWeight: 650, opacity: active ? 0.9 : 0.54 }}>
              k={index}
            </div>
            <div style={{ fontSize: 15, fontWeight: active ? 800 : 650, marginTop: 2 }}>
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={className}
      style={{
        background: "var(--panel)",
        border,
        borderRadius: 9,
        minWidth: 0,
        padding: "11px 12px",
      }}
    >
      {children}
    </section>
  );
}

const scaleRows = [
  {
    forward: String.raw`1`,
    inverse: String.raw`1/N`,
    result: String.raw`\lvert X[1]\rvert=4`,
    note: "course convention",
  },
  {
    forward: String.raw`1/N`,
    inverse: String.raw`1`,
    result: String.raw`\lvert X[1]\rvert=1/2`,
    note: "forward-scaled",
  },
  {
    forward: String.raw`1/\sqrt{N}`,
    inverse: String.raw`1/\sqrt{N}`,
    result: String.raw`\lvert X[1]\rvert=\sqrt{2}`,
    note: "unitary",
  },
  {
    forward: String.raw`1`,
    inverse: String.raw`1/N`,
    result: String.raw`A[1]=2\lvert X[1]\rvert/N=1`,
    note: "one-sided report",
    accepted: true,
  },
];

function ScaleLedger() {
  return (
    <Card className="rdcl-ledger">
      <StripLabel>forward / inverse scale ledger</StripLabel>
      <div
        className="rdcl-scale-head"
        style={{
          ...labelMuted,
          display: "grid",
          fontSize: 9.5,
          fontWeight: 750,
          gap: 8,
          gridTemplateColumns: "0.65fr 0.65fr 1.3fr 1fr",
          letterSpacing: "0.045em",
          padding: "0 7px 4px",
          textTransform: "uppercase",
        }}
      >
        <span>forward</span>
        <span>inverse</span>
        <span>reported value</span>
        <span>meaning</span>
      </div>
      <div style={{ display: "grid", gap: 5 }}>
        {scaleRows.map((row) => (
          <div
            className="rdcl-scale-row"
            key={row.note}
            style={{
              alignItems: "center",
              background: row.accepted ? soft(OK) : "transparent",
              border: row.accepted ? `1px solid ${OK}` : border,
              borderRadius: 6,
              display: "grid",
              gap: 8,
              gridTemplateColumns: "0.65fr 0.65fr 1.3fr 1fr",
              minWidth: 0,
              padding: "6px 7px",
            }}
          >
            <M tex={row.forward} size={12} />
            <M tex={row.inverse} size={12} />
            <M tex={row.accepted ? role(OK, row.result) : row.result} size={12} />
            <span style={{ color: row.accepted ? OK : "currentColor", fontSize: 10.5, fontWeight: row.accepted ? 750 : 600 }}>
              {row.note}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function RealDftConventionLedger() {
  return (
    <div
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.3,
        margin: 0,
        maxWidth: 760,
        width: "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 440px) {
          .rdcl-main { gap: 8px !important; }
          .rdcl-eight { gap: 2px !important; }
          .rdcl-pair { grid-template-columns: 1fr !important; gap: 2px !important; }
          .rdcl-pair > :first-child { order: 1; }
          .rdcl-pair > :nth-child(2) { order: 0; }
          .rdcl-pair > :last-child { order: 2; }
          .rdcl-lower { grid-template-columns: minmax(0, 1fr) !important; gap: 8px !important; }
          .rdcl-five { gap: 3px !important; }
          .rdcl-scale-head { display: none !important; }
          .rdcl-scale-row { grid-template-columns: 0.55fr 0.55fr 1.25fr !important; gap: 5px !important; }
          .rdcl-scale-row > :last-child { grid-column: 1 / -1; font-size: 9.5px !important; margin-top: -2px; }
          .rdcl-summary { font-size: 10.5px !important; }
        }
      `}</style>

      <header style={{ marginBottom: 10, textAlign: "center" }}>
        <div style={{ ...labelMuted, fontSize: 10.5, fontWeight: 750, letterSpacing: "0.055em", textTransform: "uppercase" }}>
          same real cosine · four declared views
        </div>
        <div style={{ marginTop: 4 }}>
          <M tex={String.raw`N=8,\quad f_s=8\ \mathrm{kHz},\quad x[n]=\cos(2\pi n/8)`} size={16} />
        </div>
      </header>

      <div className="rdcl-main" style={{ display: "grid", gap: 10 }}>
        <Card>
          <StripLabel>full two-sided X[k] · unscaled forward DFT</StripLabel>
          <div style={{ display: "grid", gap: 2 }}>
            <EightCells kind="index" />
            <EightCells kind="frequency" />
            <EightCells kind="coefficient" />
          </div>
          <div
            style={{
              ...labelMuted,
              display: "flex",
              fontSize: 9.5,
              justifyContent: "space-between",
              marginTop: 3,
            }}
          >
            <span>bin k</span>
            <span>signed interval [−4, 4) kHz</span>
            <span>X[k]</span>
          </div>
          <PairBrace />
          <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 4, textAlign: "center" }}>
            <M tex={String.raw`X=[0,4,0,0,0,0,0,4]`} size={11} />; DC and Nyquist are self-conjugate real bins.
          </div>
        </Card>

        <div
          className="rdcl-lower"
          style={{
            alignItems: "start",
            display: "grid",
            gap: 10,
            gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 1.08fr)",
          }}
        >
          <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
            <Card>
              <StripLabel>logical real-output bins k=0,…,4</StripLabel>
              <FiveCells values={["0", "4", "0", "0", "0"]} />
              <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 7 }}>
                Store five <b style={{ color: "currentColor" }}>complex bins</b>; reconstruct <M tex={String.raw`X[8-k]=X^{*}[k]`} size={11} />. This is not a universal scalar memory packing.
              </div>
            </Card>

            <Card>
              <StripLabel>one-sided amplitude spectrum</StripLabel>
              <FiveCells values={["0", "1", "0", "0", "0"]} greenAtOne />
              <div style={{ color: OK, fontSize: 12, fontWeight: 800, marginTop: 7, textAlign: "center" }}>
                <M color={OK} tex={String.raw`A[1]=2\lvert X[1]\rvert/N=1`} size={13} />
              </div>
              <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 4, textAlign: "center" }}>
                DC and Nyquist: use <M tex={String.raw`\lvert X[k]\rvert/N`} size={11} /> — do not double.
              </div>
            </Card>
          </div>

          <ScaleLedger />
        </div>
      </div>

      <div
        className="rdcl-summary"
        style={{
          ...labelMuted,
          borderTop: border,
          fontSize: 11,
          marginTop: 10,
          paddingTop: 8,
          textAlign: "center",
        }}
      >
        <b style={{ color: ACCENT }}>positive</b> and <b style={{ color: SUPPORT }}>negative</b> bins retain one real cosine; only the declared <b style={{ color: OK }}>one-sided amplitude</b> reports its amplitude as 1.
      </div>
    </div>
  );
}
