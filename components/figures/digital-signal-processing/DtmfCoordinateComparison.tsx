import type { ReactNode } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const soft = (color: string) =>
  `color-mix(in srgb, ${color} 11%, var(--panel))`;
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const tones = [
  {
    name: "low tone",
    color: ACCENT,
    nominal: "770",
    n205: { k: "20", hz: "780.4878", error: "+10.4878", percent: "+1.3621" },
    n256: { k: "25", hz: "781.25", error: "+11.25", percent: "+1.4610" },
  },
  {
    name: "high tone",
    color: SUPPORT,
    nominal: "1336",
    n205: { k: "34", hz: "1326.8293", error: "-9.1707", percent: "-0.6864" },
    n256: { k: "43", hz: "1343.75", error: "+7.75", percent: "+0.5801" },
  },
] as const;

type GridKey = "n205" | "n256";

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={className}
      style={{
        background: "var(--panel)",
        border,
        borderRadius: 9,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        padding: "11px 12px 12px",
      }}
    >
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <strong
      style={{
        display: "block",
        fontSize: 11,
        letterSpacing: "0.045em",
        textAlign: "center",
        textTransform: "uppercase",
      }}
    >
      {children}
    </strong>
  );
}

function HeaderRow() {
  return (
    <div
      className="dcc-head"
      style={{
        ...labelMuted,
        display: "grid",
        fontSize: 9,
        fontWeight: 750,
        gap: 6,
        gridTemplateColumns: "0.7fr 1.15fr 1.25fr",
        letterSpacing: "0.035em",
        marginTop: 9,
        padding: "0 7px 4px",
        textTransform: "uppercase",
      }}
    >
      <span>tone</span>
      <span>coordinate</span>
      <span>signed coordinate error</span>
    </div>
  );
}

function ExactCard() {
  return (
    <Card className="dcc-card">
      <CardTitle>exact nominal C(f)</CardTitle>
      <div style={{ marginTop: 6, minHeight: 35, textAlign: "center" }}>
        <M
          tex={String.raw`C(f)=\sum_{n=0}^{204}x[n]e^{-j2\pi fn/8000}`}
          size={11.5}
        />
      </div>
      <HeaderRow />
      <div style={{ display: "grid", gap: 6 }}>
        {tones.map((tone) => (
          <div
            className="dcc-row"
            key={tone.nominal}
            style={{
              alignItems: "center",
              background: soft(tone.color),
              border: `1px solid color-mix(in srgb, ${tone.color} 42%, transparent)`,
              borderRadius: 6,
              display: "grid",
              gap: 6,
              gridTemplateColumns: "0.7fr 1.15fr 1.25fr",
              minHeight: 48,
              padding: "6px 7px",
            }}
          >
            <strong style={{ color: tone.color, fontSize: 10.5 }}>{tone.name}</strong>
            <M tex={role(tone.color, String.raw`f=${tone.nominal}\ \mathrm{Hz}`)} size={12} />
            <span style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.66 }}>
              <M tex={String.raw`0\ \mathrm{Hz}`} size={10.5} /> · exact
            </span>
          </div>
        ))}
      </div>
      <div style={{ ...labelMuted, fontSize: 10, marginTop: "auto", paddingTop: 8, textAlign: "center" }}>
        physical frequencies · no integer-bin labels
      </div>
    </Card>
  );
}

function PaddingBrace() {
  return (
    <div style={{ margin: "5px 4px 0", textAlign: "center" }}>
      <div
        aria-hidden="true"
        style={{
          borderLeft: border,
          borderRight: border,
          borderTop: border,
          height: 5,
        }}
      />
      <div style={{ fontSize: 9.5, fontWeight: 750, marginTop: 2 }}>
        205 acquired + <span style={{ color: SUPPORT }}>51 zeros</span>
      </div>
    </div>
  );
}

function GridCard({ grid }: { grid: GridKey }) {
  const is205 = grid === "n205";
  return (
    <Card className="dcc-card">
      <CardTitle>
        <M
          tex={String.raw`N=${is205 ? "205" : "256"},\quad \Delta f=${is205 ? "39.0244" : "31.25"}\ \mathrm{Hz}`}
          size={11}
        />
      </CardTitle>
      {is205 ? (
        <div style={{ ...labelMuted, fontSize: 10, marginTop: 7, minHeight: 34, textAlign: "center" }}>
          same 205 acquired samples
        </div>
      ) : (
        <PaddingBrace />
      )}
      <HeaderRow />
      <div style={{ display: "grid", gap: 6 }}>
        {tones.map((tone) => {
          const value = tone[grid];
          return (
            <div
              className="dcc-row"
              key={tone.nominal}
              style={{
                alignItems: "center",
                background: soft(tone.color),
                border: `1px solid color-mix(in srgb, ${tone.color} 42%, transparent)`,
                borderRadius: 6,
                display: "grid",
                gap: 6,
                gridTemplateColumns: "0.7fr 1.15fr 1.25fr",
                minHeight: 48,
                padding: "6px 7px",
              }}
            >
              <strong style={{ color: tone.color, fontSize: 10.5 }}>{tone.name}</strong>
              <div style={{ display: "grid", gap: 1 }}>
                <M tex={String.raw`k=${value.k}`} size={10.5} />
                <M tex={role(tone.color, String.raw`${value.hz}\ \mathrm{Hz}`)} size={11.5} />
              </div>
              <div style={{ display: "grid", gap: 1 }}>
                <M tex={String.raw`${value.error}\ \mathrm{Hz}`} size={10.5} />
                <M tex={String.raw`${value.percent}\%`} size={10.5} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...labelMuted, fontSize: 10, marginTop: "auto", paddingTop: 8, textAlign: "center" }}>
        nearest ordinary FFT-grid coordinates
      </div>
    </Card>
  );
}

function NotEqual() {
  return (
    <div
      className="dcc-neq"
      style={{
        alignItems: "center",
        alignSelf: "center",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        justifyContent: "center",
        minWidth: 30,
      }}
    >
      <span style={{ fontSize: 25, fontWeight: 650, lineHeight: 1 }}>≠</span>
      <span style={{ ...labelMuted, fontSize: 8.5, fontWeight: 750, textTransform: "uppercase" }}>not equal</span>
    </div>
  );
}

export default function DtmfCoordinateComparison() {
  return (
    <div
      aria-label="Key 5 coordinate comparison: exact correlations at 770 and 1336 hertz differ from the nearest 205-point bins at 780.4878 and 1326.8293 hertz and the nearest zero-padded 256-point bins at 781.25 and 1343.75 hertz"
      role="img"
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.3,
        margin: 0,
        maxWidth: 780,
        width: "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 650px) {
          .dcc-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 7px !important; }
          .dcc-neq { flex-direction: row !important; min-height: 24px; }
          .dcc-card { padding: 10px !important; }
          .dcc-common { flex-basis: 100%; }
        }
        @media (max-width: 340px) {
          .dcc-head, .dcc-row { grid-template-columns: 0.62fr 1.12fr 1.26fr !important; gap: 4px !important; }
          .dcc-row { padding-inline: 5px !important; }
        }
      `}</style>

      <header style={{ marginBottom: 10, textAlign: "center" }}>
        <div style={{ ...labelMuted, fontSize: 10.5, fontWeight: 750, letterSpacing: "0.055em", textTransform: "uppercase" }}>
          key 5 · three coordinate families
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "2px 20px",
            justifyContent: "center",
            marginTop: 4,
          }}
        >
          <span className="dcc-common"><M tex={String.raw`f_s=8000\ \mathrm{Hz}`} size={15} /></span>
          <M tex={role(ACCENT, String.raw`f_L=770\ \mathrm{Hz}`)} size={15} />
          <M tex={role(SUPPORT, String.raw`f_H=1336\ \mathrm{Hz}`)} size={15} />
        </div>
      </header>

      <div
        className="dcc-grid"
        style={{
          alignItems: "stretch",
          display: "grid",
          gap: 8,
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr)",
        }}
      >
        <ExactCard />
        <NotEqual />
        <GridCard grid="n205" />
        <NotEqual />
        <GridCard grid="n256" />
      </div>

      <div
        style={{
          borderTop: border,
          display: "grid",
          gap: 4,
          marginTop: 10,
          paddingTop: 8,
          textAlign: "center",
        }}
      >
        <div><M tex={String.raw`C(f)=X_N[k]\quad\text{only when}\quad f=kf_s/N`} size={13} /></div>
        <div style={{ ...labelMuted, fontSize: 10.5 }}>
          same acquired record · smaller <M tex={String.raw`\Delta f`} size={10.5} /> gives a <b style={{ color: "currentColor" }}>denser grid, not new information</b>
        </div>
      </div>
    </div>
  );
}
