import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const soft = (color: string, amount = 10) =>
  `color-mix(in srgb, ${color} ${amount}%, var(--panel))`;

const natural8 = [0, 1, 2, 3, 4, 5, 6, 7];
const reversed8 = [0, 4, 2, 6, 1, 5, 3, 7];
const mixed12 = [0, 3, 6, 9, 1, 4, 7, 10, 2, 5, 8, 11];
const binary3 = ["000", "001", "010", "011", "100", "101", "110", "111"];

function Cell({
  children,
  color,
  emphasized = false,
}: {
  children: React.ReactNode;
  color?: string;
  emphasized?: boolean;
}) {
  return (
    <div
      style={{
        alignItems: "center",
        background: emphasized ? soft(color ?? ACCENT, 11) : "var(--panel)",
        border,
        borderColor: emphasized
          ? `color-mix(in srgb, ${color ?? ACCENT} 52%, transparent)`
          : undefined,
        borderRadius: 5,
        color,
        display: "flex",
        fontSize: 12,
        fontVariantNumeric: "tabular-nums",
        fontWeight: emphasized ? 750 : 650,
        justifyContent: "center",
        minHeight: 30,
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

function EightCellRow({
  label,
  values,
  color,
}: {
  label: string;
  values: number[];
  color?: string;
}) {
  return (
    <div style={{ display: "grid", gap: 5, gridTemplateColumns: "68px minmax(0, 1fr)", minWidth: 0 }}>
      <div
        style={{
          alignItems: "center",
          color: color ?? "currentColor",
          display: "flex",
          fontSize: 10,
          fontWeight: 750,
          lineHeight: 1.15,
        }}
      >
        {label}
      </div>
      <div style={{ display: "grid", gap: 3, gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
        {values.map((value, index) => (
          <Cell color={color} emphasized={Boolean(color)} key={`${label}-${index}`}>
            {value}
          </Cell>
        ))}
      </div>
    </div>
  );
}

function AddressHeader() {
  return (
    <div style={{ display: "grid", gap: 5, gridTemplateColumns: "68px minmax(0, 1fr)", minWidth: 0 }}>
      <div style={{ alignItems: "center", color: SUPPORT, display: "flex", fontSize: 10, fontWeight: 800 }}>
        address p
      </div>
      <div style={{ display: "grid", gap: 3, gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
        {natural8.map((value) => (
          <Cell color={SUPPORT} key={`address-${value}`}>
            {value}
          </Cell>
        ))}
      </div>
    </div>
  );
}

function BinaryMap() {
  return (
    <div style={{ display: "grid", gap: 5, gridTemplateColumns: "68px minmax(0, 1fr)", minWidth: 0 }}>
      <div style={{ ...labelMuted, alignItems: "center", display: "flex", fontSize: 9, lineHeight: 1.15 }}>
        source n → destination p
      </div>
      <div style={{ display: "grid", gap: 3, gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
        {binary3.map((bits, index) => (
          <div
            key={`binary-${bits}`}
            style={{
              color: "currentColor",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 7.5,
              lineHeight: 1.15,
              minWidth: 0,
              opacity: 0.62,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: ACCENT }}>{bits}</span>
            <br />
            ↓
            <br />
            <span style={{ color: SUPPORT }}>{binary3[reversed8[index]]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MixedCell({ address, source }: { address: number; source: number }) {
  return (
    <div
      style={{
        background: "var(--panel)",
        border,
        borderRadius: 6,
        minWidth: 0,
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: soft(SUPPORT, 10),
          color: SUPPORT,
          fontSize: 8.5,
          fontWeight: 750,
          padding: "3px 1px",
        }}
      >
        p={address}
      </div>
      <div style={{ color: ACCENT, fontSize: 12.5, fontWeight: 800, padding: "6px 1px" }}>
        n={source}
      </div>
    </div>
  );
}

function State({
  color,
  eyebrow,
  title,
  detail,
}: {
  color: string;
  eyebrow: string;
  title: string;
  detail: string;
}) {
  return (
    <div
      style={{
        background: soft(color, 10),
        border: `1.3px solid color-mix(in srgb, ${color} 55%, transparent)`,
        borderRadius: 7,
        minWidth: 0,
        padding: "7px 9px",
      }}
    >
      <div style={{ color, fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {eyebrow}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, marginTop: 2 }}>{title}</div>
      <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 2 }}>{detail}</div>
    </div>
  );
}

export default function FftMemoryOrderLedger({ frame }: { frame?: number }) {
  const forcedMobile = frame === 360;

  return (
    <div
      aria-label="Memory-order ledger. At increasing destination addresses, eight-point bit reversal stores source indices zero, four, two, six, one, five, three, seven. The factor order three by four stores zero, three, six, nine, one, four, seven, ten, two, five, eight, eleven. Apply the inverse permutation before treating address p as frequency bin k."
      role="img"
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.28,
        margin: 0,
        maxWidth: forcedMobile ? 312 : 780,
        width: forcedMobile ? 312 : "calc(100vw - 48px)",
      }}
    >
      <style>{`
        .fmol-state-arrow-narrow { display: none; }
        @media (max-width: 560px) {
          .fmol-heading { align-items: flex-start !important; flex-direction: column !important; }
          .fmol-mixed { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .fmol-equations { align-items: flex-start !important; flex-direction: column !important; }
          .fmol-states { grid-template-columns: minmax(0, 1fr) !important; }
          .fmol-state-arrow-wide { display: none; }
          .fmol-state-arrow-narrow { display: inline; }
        }
      `}</style>

      <header
        className="fmol-heading"
        style={{
          alignItems: forcedMobile ? "flex-start" : "baseline",
          display: "flex",
          flexDirection: forcedMobile ? "column" : "row",
          gap: "3px 14px",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <strong style={{ fontSize: 14 }}>storage position is not bin identity</strong>
        <span style={{ ...labelMuted, fontSize: 10.5 }}>destination address p → stored source index n</span>
      </header>

      <section style={{ border, borderRadius: 9, minWidth: 0, padding: "9px 10px 10px" }}>
        <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "3px 11px", marginBottom: 8 }}>
          <strong style={{ fontSize: 11.5 }}>N=8 · three-bit reversal</strong>
          <M tex={String.raw`p=\operatorname{reverse}_{3\,\mathrm{bits}}(n)`} size={11} />
          <span style={{ ...labelMuted, fontSize: 9.5 }}>self-inverse in this row</span>
        </div>

        <div style={{ display: "grid", gap: 5 }}>
          <AddressHeader />
          <EightCellRow label="natural order" values={natural8} />
          <BinaryMap />
          <EightCellRow color={ACCENT} label="bit-reversed source n" values={reversed8} />
        </div>

        <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 7, textAlign: "right" }}>
          increasing p: [0, 4, 2, 6, 1, 5, 3, 7]
        </div>
      </section>

      <section style={{ border, borderRadius: 9, marginTop: 9, minWidth: 0, padding: "9px 10px 10px" }}>
        <div
          className="fmol-equations"
          style={{
            alignItems: forcedMobile ? "flex-start" : "baseline",
            display: "flex",
            flexDirection: forcedMobile ? "column" : "row",
            flexWrap: "wrap",
            gap: "3px 12px",
            marginBottom: 8,
          }}
        >
          <strong style={{ fontSize: 11.5 }}>N=12 · mixed radices [3,4]</strong>
          <M tex={String.raw`n=d_0+3d_1`} size={11} />
          <M tex={String.raw`p=d_1+4d_0`} size={11} />
          <span style={{ ...labelMuted, fontSize: 9.5 }}>factor order [3,4] only</span>
        </div>

        <div style={{ ...labelMuted, fontSize: 9.5, marginBottom: 6 }}>
          <M tex={String.raw`d_0\in\{0,1,2\},\quad d_1\in\{0,1,2,3\}`} size={10} /> · source index n held at destination address p
        </div>

        <div
          className="fmol-mixed"
          style={{
            display: "grid",
            gap: 4,
            gridTemplateColumns: forcedMobile ? "repeat(4, minmax(0, 1fr))" : "repeat(12, minmax(0, 1fr))",
          }}
        >
          {mixed12.map((source, address) => (
            <MixedCell address={address} key={`mixed-${address}`} source={source} />
          ))}
        </div>

        <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 7, textAlign: "right" }}>
          increasing p: [0, 3, 6, 9, 1, 4, 7, 10, 2, 5, 8, 11]
        </div>
      </section>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          fontSize: 10,
          gap: "3px 8px",
          justifyContent: "center",
          margin: "8px 0 6px",
        }}
      >
        <strong>permutation, not frequency relabeling</strong>
        <span style={labelMuted}>p remains a memory address until order is restored</span>
      </div>

      <section
        className="fmol-states"
        style={{
          alignItems: "stretch",
          display: "grid",
          gap: 7,
          gridTemplateColumns: forcedMobile ? "minmax(0, 1fr)" : "minmax(0, 1fr) 92px minmax(0, 1fr)",
        }}
      >
        <State color={ACCENT} detail="p is an address, not yet k" eyebrow="reversed storage" title="not ready to plot" />
        <div
          className="fmol-state-arrow"
          style={{
            alignItems: "center",
            color: SUPPORT,
            display: "flex",
            fontSize: 9.5,
            fontWeight: 750,
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          inverse permutation{" "}
          {forcedMobile ? (
            <span aria-hidden="true">↓</span>
          ) : (
            <>
              <span aria-hidden="true" className="fmol-state-arrow-wide">→</span>
              <span aria-hidden="true" className="fmol-state-arrow-narrow">↓</span>
            </>
          )}
        </div>
        <State color={OK} detail="only now k=p and address k holds X[k]" eyebrow="restored natural order" title="ready" />
      </section>

      <div style={{ color: OK, fontSize: 10, fontWeight: 750, marginTop: 7, textAlign: "center" }}>
        restore before compare / plot
      </div>
    </div>
  );
}
