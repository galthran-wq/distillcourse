import type { ReactNode } from "react";
import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const soft = (color: string) =>
  `color-mix(in srgb, ${color} 11%, var(--panel))`;
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

type Count = { value: string; unit: string };

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        ...labelMuted,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={className}
      style={{
        background: "var(--panel)",
        border,
        borderRadius: 8,
        minWidth: 0,
        padding: "10px 11px",
      }}
    >
      {children}
    </section>
  );
}

function CountRow({ count }: { count: Count }) {
  return (
    <div
      style={{
        alignItems: "center",
        borderTop: border,
        display: "grid",
        gap: 6,
        gridTemplateColumns: "auto minmax(0, 1fr)",
        paddingTop: 5,
      }}
    >
      <strong style={{ fontSize: 12 }}><M tex={count.value} size={12} /></strong>
      <span style={{ fontSize: 10.5, fontWeight: 650 }}>{count.unit}</span>
    </div>
  );
}

function CostCard({
  title,
  subtitle,
  counts,
}: {
  title: string;
  subtitle: ReactNode;
  counts: Count[];
}) {
  return (
    <Card className="dcl-cost-card">
      <strong style={{ display: "block", fontSize: 11.5 }}>{title}</strong>
      <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 2, minHeight: 27 }}>{subtitle}</div>
      <div style={{ display: "grid", gap: 5, marginTop: 6 }}>
        {counts.map((count) => <CountRow count={count} key={count.unit} />)}
      </div>
    </Card>
  );
}

function ExactCoordinateGroup() {
  return (
    <section
      style={{
        border: `1.5px solid color-mix(in srgb, ${ACCENT} 55%, transparent)`,
        borderRadius: 10,
        minWidth: 0,
        padding: 7,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <SectionLabel><span style={{ color: ACCENT }}>same coordinate set</span> · equality applies here only</SectionLabel>
        <div style={{ marginTop: 2 }}><M tex={role(ACCENT, String.raw`C_{205}(f_i)`)} size={12.5} /></div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "1px 10px",
            justifyContent: "center",
            marginTop: 1,
          }}
        >
          <M tex={role(ACCENT, String.raw`f_i\in\{697,770,852,941\}\ \mathrm{Hz}`)} size={9.5} />
          <M tex={role(ACCENT, String.raw`f_i\in\{1209,1336,1477,1633\}\ \mathrm{Hz}`)} size={9.5} />
        </div>
      </div>
      <div
        className="dcl-exact-cards"
        style={{
          display: "grid",
          gap: 7,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          marginTop: 7,
        }}
      >
        <CostCard
          title="Direct selected sums"
          subtitle={<>eight exact correlations · <M tex={String.raw`N=205`} size={9.5} /></>}
          counts={[
            { value: "1640", unit: "complex product slots" },
            { value: "1632", unit: "complex additions" },
          ]}
        />
        <CostCard
          title="Real-input Goertzel"
          subtitle={<>same physical frequencies · possibly noninteger resonator coordinate</>}
          counts={[
            { value: "1656", unit: "real multiplications" },
            { value: "3288", unit: "real additions" },
          ]}
        />
      </div>
      <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 6, textAlign: "center" }}>
        coordinate equality does not make real and complex work units interchangeable
      </div>
    </section>
  );
}

function GridCoordinateCard() {
  return (
    <section
      style={{
        border: `1.5px solid color-mix(in srgb, ${SUPPORT} 55%, transparent)`,
        borderRadius: 10,
        minWidth: 0,
        padding: 7,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <SectionLabel><span style={{ color: SUPPORT }}>different coordinate set</span></SectionLabel>
        <div style={{ marginTop: 2 }}><M tex={role(SUPPORT, String.raw`X_{256}[k_i]`)} size={14} /></div>
        <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 1 }}>205 acquired + 51 zeros · FFT grid</div>
      </div>
      <Card className="dcl-grid-card">
        <strong style={{ display: "block", fontSize: 11.5 }}>Selected direct sums</strong>
        <div style={{ display: "grid", gap: 5, marginTop: 6 }}>
          <CountRow count={{ value: "2048", unit: "complex product slots" }} />
          <CountRow count={{ value: "2040", unit: "complex additions" }} />
        </div>
        <div style={{ ...labelMuted, borderTop: border, fontSize: 9.5, fontWeight: 750, marginTop: 7, paddingTop: 6, textTransform: "uppercase" }}>
          full radix-2 FFT
        </div>
        <div style={{ display: "grid", gap: 5, marginTop: 4 }}>
          <CountRow count={{ value: "1024", unit: "twiddle slots — not total work" }} />
          <CountRow count={{ value: "2048", unit: "complex additions" }} />
        </div>
      </Card>
    </section>
  );
}

function DifferentSeparator() {
  return (
    <div className="dcl-different" style={{ alignSelf: "center", minWidth: 32, textAlign: "center" }}>
      <div style={{ fontSize: 24, fontWeight: 750, lineHeight: 1 }}>≠</div>
      <div style={{ ...labelMuted, fontSize: 8, fontWeight: 800, textTransform: "uppercase" }}>coordinates</div>
    </div>
  );
}

function Rail({
  color,
  end,
  label,
  note,
  start,
}: {
  color: string;
  end: string;
  label: ReactNode;
  note: ReactNode;
  start: string;
}) {
  return (
    <Card className="dcl-rail-card">
      <div style={{ alignItems: "center", display: "grid", gap: 7, gridTemplateColumns: "auto minmax(36px, 1fr) auto" }}>
        <strong style={{ fontSize: 10.5 }}>{start}</strong>
        <div style={{ height: 3, position: "relative", background: color }}>
          <span style={{ background: color, borderRadius: "50%", height: 8, left: -1, position: "absolute", top: -2.5, width: 8 }} />
          <span style={{ background: color, borderRadius: "50%", height: 8, position: "absolute", right: -1, top: -2.5, width: 8 }} />
        </div>
        <strong style={{ fontSize: 10.5 }}>{end}</strong>
      </div>
      <div style={{ color, fontSize: 11.5, fontWeight: 800, marginTop: 7, textAlign: "center" }}>{label}</div>
      <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 3, textAlign: "center" }}>{note}</div>
    </Card>
  );
}

const studyRows = [
  {
    metric: "held-out clean accuracy",
    observed: String.raw`512/512=100.000\%`,
    target: String.raw`\ge 99\%`,
    pass: true,
  },
  {
    metric: "10 dB active-tone SNR · independent ±1.5% offsets",
    observed: String.raw`1023/1024=99.902\%`,
    target: String.raw`\ge 95\%`,
    pass: true,
  },
  {
    metric: "mandatory negative controls rejected",
    observed: String.raw`637/640=99.531\%`,
    target: String.raw`640/640\ \text{all reject}`,
    pass: false,
  },
  {
    metric: "maximum accepted hard-set latency",
    observed: String.raw`50\ \mathrm{ms}`,
    target: String.raw`\le 40\ \mathrm{ms}`,
    pass: false,
  },
] as const;

function StudyRow({ row }: { row: (typeof studyRows)[number] }) {
  const color = row.pass ? OK : "currentColor";
  return (
    <div
      style={{
        background: row.pass ? soft(OK) : "transparent",
        border: row.pass ? `1px solid ${OK}` : "1.5px dashed currentColor",
        borderRadius: 7,
        display: "grid",
        gap: 5,
        gridTemplateColumns: "auto minmax(0, 1fr)",
        padding: "7px 8px",
      }}
    >
      <span style={{ color, fontSize: 18, fontWeight: 850, lineHeight: 1 }}>{row.pass ? "✓" : "×"}</span>
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: 10.5 }}>{row.metric}</strong>
        <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "2px 8px", marginTop: 3 }}>
          <M color={color} tex={row.observed} size={11.5} />
          <span style={{ ...labelMuted, fontSize: 9.5 }}>target <M tex={row.target} size={9.5} /></span>
          <strong style={{ color, fontSize: 10.5 }}>{row.pass ? "PASS" : "FAIL"}</strong>
        </div>
      </div>
    </div>
  );
}

export default function DtmfCoordinateCostLatencyLedger() {
  return (
    <div
      aria-label="Coordinate, arithmetic, latency, and study ledger: two 205-sample exact-frequency methods keep separate real and complex operation units, the 256-point FFT uses a different grid, source and received-signal timing have separate origins, and a separate 160-sample study passes 512 of 512 clean and 1023 of 1024 hard trials but fails all-negative rejection at 637 of 640 and the 40 millisecond latency target with a 50 millisecond maximum"
      role="img"
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.28,
        margin: 0,
        maxWidth: 780,
        width: "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 650px) {
          .dcl-cost-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 7px !important; }
          .dcl-different { min-height: 25px; }
          .dcl-exact-cards { grid-template-columns: minmax(0, 1fr) !important; }
          .dcl-timing-grid, .dcl-study-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>

      <header style={{ marginBottom: 9, textAlign: "center" }}>
        <SectionLabel>coordinate set first · operation units stay separate</SectionLabel>
        <div style={{ marginTop: 3 }}>
          <M tex={String.raw`f_s=8000\ \mathrm{Hz},\qquad N_{\mathrm{acquired}}=205`} size={14.5} />
        </div>
      </header>

      <div
        className="dcl-cost-grid"
        style={{
          alignItems: "start",
          display: "grid",
          gap: 7,
          gridTemplateColumns: "minmax(0, 2fr) auto minmax(0, 1fr)",
        }}
      >
        <ExactCoordinateGroup />
        <DifferentSeparator />
        <GridCoordinateCard />
      </div>

      <div style={{ marginTop: 11 }}>
        <SectionLabel>latency origins stay separate</SectionLabel>
        <div
          className="dcl-timing-grid"
          style={{ display: "grid", gap: 7, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 5 }}
        >
          <Rail
            color={ACCENT}
            start="received-signal origin"
            end="duration qualified"
            label={<M color={ACCENT} tex={String.raw`320\ \text{samples}=40\ \mathrm{ms}`} size={11.5} />}
            note={<>actual decision latency: measure with declared 5 ms block/hop schedule</>}
          />
          <Rail
            color={SUPPORT}
            start="source origin"
            end="received-signal origin"
            label={<M color={SUPPORT} tex={String.raw`50\ \text{samples}=6.25\ \mathrm{ms}`} size={11.5} />}
            note={<>synthetic FIR delay only · do not print a fabricated end-to-end total</>}
          />
        </div>
      </div>

      <section style={{ borderTop: "3px solid currentColor", marginTop: 12, paddingTop: 8 }}>
        <div style={{ textAlign: "center" }}>
          <SectionLabel>separate frozen N=160 receiver study · 5 ms temporal blocks</SectionLabel>
          <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 2 }}>
            exact-nominal 20 ms spectral record · not the N=205 or N=256 alternatives above
          </div>
        </div>
        <div
          className="dcl-study-grid"
          style={{ display: "grid", gap: 6, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginTop: 7 }}
        >
          {studyRows.map((row) => <StudyRow key={row.metric} row={row} />)}
        </div>
        <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 6, textAlign: "center" }}>
          training and all 24–39 ms gray-region trials excluded · deterministic synthetic course study, not standards conformance
        </div>
      </section>
    </div>
  );
}
