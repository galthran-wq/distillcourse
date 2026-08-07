import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const rows = [
  {
    n: "0",
    input: "1",
    old: ["0", "0"],
    terms: ["1", "0", "0"],
    output: "1.0000000",
    next: ["1.0000000", "0"],
  },
  {
    n: "1",
    input: "0",
    old: ["1.0000000", "0"],
    terms: ["0", "0.8260118", "0"],
    output: "0.8260118",
    next: ["0.8260118", "1.0000000"],
  },
  {
    n: "2",
    input: "0",
    old: ["0.8260118", "1.0000000"],
    terms: ["0", "0.6822955", "-0.9409000"],
    output: "-0.2586045",
    next: ["-0.2586045", "0.8260118"],
  },
  {
    n: "3",
    input: "0",
    old: ["-0.2586045", "0.8260118"],
    terms: ["0", "-0.2136103", "-0.7771945"],
    output: "-0.9908049",
    next: ["-0.9908049", "-0.2586045"],
  },
  {
    n: "4",
    input: "0",
    old: ["-0.9908049", "-0.2586045"],
    terms: ["0", "-0.8184165", "+0.2433209"],
    output: "-0.5750956",
    next: ["-0.5750956", "-0.9908049"],
  },
] as const;

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";

const signedContribution = (value: string) => {
  if (value.startsWith("-")) return role(SUPPORT, value);
  return String.raw`+${role(SUPPORT, value.startsWith("+") ? value.slice(1) : value)}`;
};

function Field({
  label,
  color,
  minWidth,
  children,
}: {
  label: string;
  color?: string;
  minWidth: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rsl-field" style={{ flex: `1 1 ${minWidth}px`, minWidth: 0 }}>
      <div
        style={{
          color,
          fontSize: 9.5,
          fontWeight: 750,
          letterSpacing: "0.055em",
          marginBottom: 4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export default function ResonatorStateLedger() {
  return (
    <figure
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.35,
        margin: 0,
        maxWidth: 672,
      }}
    >
      <style>{`
        .rsl-mobile { display: none; }
        @media (max-width: 420px) {
          .rsl-desktop { display: none !important; }
          .rsl-mobile { display: grid !important; }
          .rsl-row { display: grid !important; grid-template-columns: minmax(0, 1fr); gap: 12px !important; }
          .rsl-field > div:first-child { font-size: 11.5px !important; }
          .rsl-caption { font-size: 12px !important; line-height: 1.45; }
        }
      `}</style>
      <div
        style={{
          background: "var(--panel)",
          border,
          borderRadius: 10,
          padding: "12px 14px",
        }}
      >
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            flexWrap: "wrap",
            gap: "5px 16px",
            justifyContent: "space-between",
          }}
        >
          <strong style={{ fontSize: 14 }}>second-order resonator</strong>
          <span className="rsl-desktop"><M tex={String.raw`f_s=1000\,\mathrm{Hz},\quad f_0=180\,\mathrm{Hz},\quad \omega_0=0.36\pi,\quad r=0.970`} size={12} /></span>
          <span className="rsl-mobile" style={{ gap: 4 }}>
            <M tex={String.raw`f_s=1000\,\mathrm{Hz},\quad f_0=180\,\mathrm{Hz}`} size={12} />
            <M tex={String.raw`\omega_0=0.36\pi,\quad r=0.970`} size={12} />
          </span>
        </div>
        <div style={{ marginTop: 9, overflowWrap: "anywhere", textAlign: "center" }}>
          <span className="rsl-desktop"><M tex={String.raw`y[n]=${role(ACCENT, "x[n]")}+${role(SUPPORT, "0.8260118\,y[n-1]-0.9409\,y[n-2]")}`} size={13} /></span>
          <span className="rsl-mobile" style={{ gap: 3, justifyItems: "center" }}>
            <M tex={String.raw`y[n]=${role(ACCENT, "x[n]")}+${role(SUPPORT, "0.8260118\,y[n-1]")}`} size={12.5} />
            <M tex={role(SUPPORT, String.raw`-0.9409\,y[n-2]`)} size={12.5} />
          </span>
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "5px 14px",
            justifyContent: "center",
            marginTop: 8,
          }}
        >
          <span style={{ color: ACCENT, fontSize: 11, fontWeight: 700 }}>unit impulse</span>
          <span style={{ color: SUPPORT, fontSize: 11, fontWeight: 700 }}>READ old state</span>
          <span aria-hidden="true" style={{ opacity: 0.45 }}>→</span>
          <span style={{ color: OK, fontSize: 11, fontWeight: 700 }}>COMPUTE, then WRITE / SHIFT</span>
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 12px",
          margin: "10px 2px 8px",
        }}
      >
        <span
          style={{
            border: `1.3px solid ${SUPPORT}`,
            borderRadius: 999,
            color: SUPPORT,
            fontSize: 10.5,
            fontWeight: 750,
            padding: "3px 8px",
          }}
        >
          initial rest
        </span>
        <M tex={String.raw`y[-1]=0,\qquad y[-2]=0`} size={12} />
        <span style={{ ...labelMuted, fontSize: 10.5, marginLeft: "auto" }}>
          values shown to 7 decimal places
        </span>
      </div>

      <div style={{ display: "grid", gap: 7 }}>
        {rows.map((row) => (
          <section
            key={row.n}
            style={{
              border: row.n === "0" ? `1.5px solid ${ACCENT}` : border,
              borderRadius: 9,
              padding: "9px 10px",
            }}
          >
            <div className="rsl-row" style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "8px 13px" }}>
              <Field label="sample" minWidth={36}>
                <M tex={String.raw`n=${row.n}`} size={12} />
              </Field>

              <Field color={ACCENT} label="input" minWidth={43}>
                <M tex={role(ACCENT, String.raw`x[n]=${row.input}`)} size={12} />
              </Field>

              <Field color={SUPPORT} label="1 · read old state" minWidth={128}>
                <span className="rsl-desktop"><M tex={role(SUPPORT, String.raw`(y[n-1],y[n-2])=(${row.old[0]},${row.old[1]})`)} size={10.5} /></span>
                <span className="rsl-mobile" style={{ gap: 2 }}>
                  <M tex={role(SUPPORT, String.raw`(y[n-1],y[n-2])`)} size={12} />
                  <M tex={role(SUPPORT, String.raw`=(${row.old[0]},${row.old[1]})`)} size={12} />
                </span>
              </Field>

              <Field color={OK} label="2 · compute y[n]" minWidth={190}>
                <div style={{ display: "grid", gap: 2 }}>
                  <M
                    tex={String.raw`${role(ACCENT, row.terms[0])}${signedContribution(row.terms[1])}${signedContribution(row.terms[2])}`}
                    size={10.5}
                  />
                  <M tex={String.raw`=${role(OK, row.output)}`} size={12.5} />
                </div>
              </Field>

              <Field color={OK} label="3 · write / shift" minWidth={128}>
                <span className="rsl-desktop"><M tex={role(OK, String.raw`(y[n],y[n-1])=(${row.next[0]},${row.next[1]})`)} size={10.5} /></span>
                <span className="rsl-mobile" style={{ gap: 2 }}>
                  <M tex={role(OK, String.raw`(y[n],y[n-1])`)} size={12} />
                  <M tex={role(OK, String.raw`=(${row.next[0]},${row.next[1]})`)} size={12} />
                </span>
              </Field>
            </div>
          </section>
        ))}
      </div>

      <figcaption className="rsl-caption" style={{ ...labelMuted, fontSize: 11, marginTop: 8, textAlign: "center" }}>
        Every new pair is <M tex={String.raw`(y[n],\ \text{old }y[n-1])`} size={11} />; neither old value is overwritten early.
      </figcaption>
    </figure>
  );
}
