import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const soft = (color: string, amount = 10) =>
  `color-mix(in srgb, ${color} ${amount}%, var(--panel))`;
const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const A = role(ACCENT, "a");
const B = role(SUPPORT, "b");
const T = role(SUPPORT, "t");
const U = role(ACCENT, "u");
const V = role(SUPPORT, "v");

function ActionRow({
  number,
  action,
  children,
  complete = false,
}: {
  number: number;
  action: string;
  children: React.ReactNode;
  complete?: boolean;
}) {
  return (
    <div
      style={{
        alignItems: "center",
        background: complete ? soft(OK, 12) : "transparent",
        borderTop: number === 1 ? "none" : border,
        display: "grid",
        gap: 9,
        gridTemplateColumns: "25px 82px minmax(0, 1fr)",
        minHeight: 54,
        padding: "7px 9px",
      }}
    >
      <span
        style={{
          alignItems: "center",
          border: `1.4px solid ${complete ? OK : "currentColor"}`,
          borderRadius: "50%",
          color: complete ? OK : "currentColor",
          display: "inline-flex",
          fontSize: 11,
          fontWeight: 800,
          height: 23,
          justifyContent: "center",
          opacity: complete ? 1 : 0.72,
          width: 23,
        }}
      >
        {number}
      </span>
      <strong style={{ color: complete ? OK : "currentColor", fontSize: 11.5, letterSpacing: "0.035em" }}>
        {action}
      </strong>
      <div style={{ fontSize: 11.5, lineHeight: 1.35 }}>{children}</div>
    </div>
  );
}

function ButterflyGraph() {
  return (
    <svg
      aria-label="Radix-two butterfly sharing one twiddle product between a sum and a difference"
      role="img"
      style={{ display: "block", height: "auto", width: "100%" }}
      viewBox="0 0 390 224"
    >
      <defs>
        <marker id="fbl-arrow-amber" markerHeight="6" markerWidth="7" orient="auto" refX="6" refY="3">
          <path d="M0 0 L7 3 L0 6 Z" fill={ACCENT} />
        </marker>
        <marker id="fbl-arrow-blue" markerHeight="6" markerWidth="7" orient="auto" refX="6" refY="3">
          <path d="M0 0 L7 3 L0 6 Z" fill={SUPPORT} />
        </marker>
      </defs>

      <text x="20" y="19" fill="currentColor" fontSize="11" fontWeight="750">old inputs</text>
      <text x="357" y="19" fill="currentColor" fontSize="11" fontWeight="750" textAnchor="end">paired outputs</text>

      <rect x="19" y="39" width="70" height="42" rx="7" fill={soft(ACCENT, 13)} stroke={ACCENT} strokeWidth="1.4" />
      <text x="54" y="56" fill={ACCENT} fontSize="11" fontWeight="800" textAnchor="middle">old a</text>
      <text x="54" y="72" fill="currentColor" fontSize="11" textAnchor="middle">3 + 2j</text>

      <rect x="19" y="143" width="70" height="42" rx="7" fill={soft(SUPPORT, 13)} stroke={SUPPORT} strokeWidth="1.4" />
      <text x="54" y="160" fill={SUPPORT} fontSize="11" fontWeight="800" textAnchor="middle">old b</text>
      <text x="54" y="176" fill="currentColor" fontSize="11" textAnchor="middle">1 − j</text>

      <path d="M89 60 H242" fill="none" markerEnd="url(#fbl-arrow-amber)" stroke={ACCENT} strokeWidth="2" />
      <path d="M89 60 L247 151" fill="none" markerEnd="url(#fbl-arrow-amber)" stroke={ACCENT} strokeWidth="2" />
      <path d="M89 164 H119" fill="none" markerEnd="url(#fbl-arrow-blue)" stroke={SUPPORT} strokeWidth="2" />

      <circle cx="147" cy="164" fill="var(--panel)" r="27" stroke={SUPPORT} strokeWidth="1.6" />
      <text x="147" y="160" fill={SUPPORT} fontSize="12" fontWeight="800" textAnchor="middle">× twiddle</text>
      <text x="147" y="176" fill="currentColor" fontSize="11" textAnchor="middle">one product</text>

      <path d="M174 164 L247 72" fill="none" stroke="var(--panel)" strokeWidth="7" />
      <path d="M174 164 L247 72" fill="none" markerEnd="url(#fbl-arrow-blue)" stroke={SUPPORT} strokeWidth="2" />
      <path d="M174 164 H242" fill="none" markerEnd="url(#fbl-arrow-blue)" stroke={SUPPORT} strokeWidth="2" />
      <text x="201" y="104" fill={SUPPORT} fontSize="11" fontWeight="750">shared t</text>

      <circle cx="264" cy="60" fill="var(--panel)" r="19" stroke="currentColor" strokeWidth="1.4" />
      <text x="264" y="66" fill="currentColor" fontSize="21" fontWeight="650" textAnchor="middle">+</text>
      <circle cx="264" cy="164" fill="var(--panel)" r="19" stroke="currentColor" strokeWidth="1.4" />
      <text x="264" y="168" fill="currentColor" fontSize="22" fontWeight="650" textAnchor="middle">−</text>

      <path d="M283 60 H304" fill="none" markerEnd="url(#fbl-arrow-amber)" stroke={ACCENT} strokeWidth="2" />
      <path d="M283 164 H304" fill="none" markerEnd="url(#fbl-arrow-blue)" stroke={SUPPORT} strokeWidth="2" />

      <rect x="311" y="39" width="61" height="42" rx="7" fill={soft(ACCENT, 13)} stroke={ACCENT} strokeWidth="1.4" />
      <text x="341.5" y="57" fill={ACCENT} fontSize="11" fontWeight="800" textAnchor="middle">upper u</text>
      <text x="341.5" y="72" fill="currentColor" fontSize="11" textAnchor="middle">sum</text>
      <rect x="311" y="143" width="61" height="42" rx="7" fill={soft(SUPPORT, 13)} stroke={SUPPORT} strokeWidth="1.4" />
      <text x="341.5" y="161" fill={SUPPORT} fontSize="11" fontWeight="800" textAnchor="middle">lower v</text>
      <text x="341.5" y="176" fill="currentColor" fontSize="11" textAnchor="middle">difference</text>

      <line x1="19" x2="372" y1="207" y2="207" stroke="currentColor" strokeOpacity="0.14" />
      <text x="195" y="220" fill="currentColor" fontSize="11" opacity="0.58" textAnchor="middle">
        one temporary fans into both operators
      </text>
    </svg>
  );
}

export default function FftButterflyLedger({ frame }: { frame?: number }) {
  const forcedMobile = frame === 360;

  return (
    <div
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.3,
        margin: 0,
        maxWidth: forcedMobile ? 312 : 780,
        width: forcedMobile ? 312 : "calc(100vw - 48px)",
      }}
    >
      <style>{`
        @media (max-width: 560px) {
          .fbl-main { grid-template-columns: minmax(0, 1fr) !important; }
          .fbl-arithmetic { grid-template-columns: minmax(0, 1fr) !important; }
          .fbl-heading { align-items: flex-start !important; flex-direction: column !important; }
        }
      `}</style>

      <header
        className="fbl-heading"
        style={{
          alignItems: forcedMobile ? "flex-start" : "baseline",
          display: "flex",
          flexDirection: forcedMobile ? "column" : "row",
          gap: "4px 14px",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <strong style={{ fontSize: 14 }}>one shared product, two outputs</strong>
        <span style={{ ...labelMuted, fontSize: 10.5 }}>radix-2 butterfly · inherited negative-sign twiddle</span>
      </header>

      <div
        className="fbl-main"
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: forcedMobile ? "minmax(0, 1fr)" : "minmax(0, 1.2fr) minmax(255px, 0.8fr)",
        }}
      >
        <section style={{ background: "var(--panel)", border, borderRadius: 9, minWidth: 0, padding: "9px 10px 8px" }}>
          <ButterflyGraph />
        </section>

        <section style={{ border, borderRadius: 9, minWidth: 0, overflow: "hidden" }}>
          <div style={{ ...labelMuted, background: "var(--panel)", fontSize: 10, fontWeight: 750, letterSpacing: "0.045em", padding: "7px 9px", textTransform: "uppercase" }}>
            safe in-place update
          </div>
          <ActionRow number={1} action="READ both">
            Snapshot <M tex={String.raw`${A}=3+2j`} size={11.5} /> and <M tex={String.raw`${B}=1-j`} size={11.5} />.
          </ActionRow>
          <ActionRow number={2} action="COMPUTE">
            Form <M tex={String.raw`${T}=W_8^1${B}`} size={11.5} />, then <M tex={String.raw`${U}=${A}+${T}`} size={11.5} /> and <M tex={String.raw`${V}=${A}-${T}`} size={11.5} />.
          </ActionRow>
          <ActionRow number={3} action="WRITE both" complete>
            Store <M tex={String.raw`A\leftarrow${U}`} size={11.5} /> and <M tex={String.raw`B\leftarrow${V}`} size={11.5} /> only now.
          </ActionRow>
        </section>
      </div>

      <section
        className="fbl-arithmetic"
        style={{
          background: "var(--panel)",
          border,
          borderRadius: 9,
          display: "grid",
          gap: "7px 16px",
          gridTemplateColumns: forcedMobile ? "minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 1fr)",
          marginTop: 10,
          padding: "9px 12px",
        }}
      >
        <div>
          <div style={{ ...labelMuted, fontSize: 9.5, marginBottom: 4, textTransform: "uppercase" }}>shared twiddle product</div>
          <M
            display
            size={12.5}
            tex={String.raw`W_8^1=\frac{1-j}{\sqrt2},\quad ${T}=W_8^1${B}=\frac{(1-j)^2}{\sqrt2}=-\sqrt2j`}
          />
        </div>
        <div>
          <div style={{ ...labelMuted, fontSize: 9.5, marginBottom: 4, textTransform: "uppercase" }}>paired results</div>
          <M display size={12.5} tex={String.raw`${U}=3+j(2-\sqrt2)\approx3+0.585786j`} />
          <M display size={12.5} tex={String.raw`${V}=3+j(2+\sqrt2)\approx3+3.414214j`} />
        </div>
      </section>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          fontSize: 11,
          gap: "6px 12px",
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        <strong style={{ color: SUPPORT }}>1 twiddle multiplication</strong>
        <span aria-hidden="true" style={{ opacity: 0.42 }}>+</span>
        <strong style={{ color: ACCENT }}>2 complex additions</strong>
        <span style={{ ...labelMuted, fontSize: 10.5 }}>old a and old b remain intact through COMPUTE</span>
      </div>
    </div>
  );
}
