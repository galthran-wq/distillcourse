import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * UnitsBridge — entropy is ONE quantity measured in two units. The same
 * half/half distribution wears two faces: on the Shannon side (amber) it is a
 * two-bar probability distribution worth H = 1 bit; on the physical side
 * (blue) it is a particle equally likely in either of two wells, worth
 * S = k ln 2 J/K. A double-headed arrow labelled × k ln 2 bridges them —
 * the same "× constant = change of unit" idiom as the bits/nats/hartleys
 * units strip in what-is-surprise.
 *
 * Color binds to role: amber = the Shannon side (subject), blue = the physical
 * side; the bridge and footer are currentColor structure.
 *
 * One idea: entropy is one quantity in two units.
 */

const H_SYM = String.raw`\textcolor{${ACCENT}}{H}`;
const S_SYM = String.raw`\textcolor{${SUPPORT}}{S}`;

function Card({
  header,
  headerColor,
  children,
  formula,
}: {
  header: string;
  headerColor: string;
  children: React.ReactNode;
  formula: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 18px 16px",
        border: `1.5px solid ${headerColor}`,
        borderRadius: 8,
        alignSelf: "stretch",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: headerColor }}>{header}</div>
      <div style={{ height: 96, display: "flex", alignItems: "flex-end" }}>{children}</div>
      <div style={{ fontSize: 14, whiteSpace: "nowrap" }}>
        <M tex={formula} />
      </div>
    </div>
  );
}

// Left visual: two amber bars, equal height (p = 1/2 each). -------------------
function TwoBars() {
  return (
    <svg viewBox="0 0 130 100" width="130" aria-hidden="true">
      {/* equal-height guide */}
      <line
        x1="10"
        y1="22"
        x2="120"
        y2="22"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <rect x="26" y="22" width="30" height="66" fill={ACCENT} opacity="0.85" rx="2" />
      <rect x="74" y="22" width="30" height="66" fill={ACCENT} opacity="0.85" rx="2" />
      {/* baseline */}
      <line x1="10" y1="88" x2="120" y2="88" stroke="currentColor" strokeOpacity="0.55" strokeWidth="1" />
      <text x="41" y="99" textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.7">
        ½
      </text>
      <text x="89" y="99" textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.7">
        ½
      </text>
    </svg>
  );
}

// Right visual: two wells, one particle (blue), equally likely in either. -----
function TwoWells() {
  return (
    <svg viewBox="0 0 130 100" width="130" aria-hidden="true">
      {/* two potential wells */}
      <path
        d="M8 20 Q37 108 66 20"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.4"
      />
      <path
        d="M64 20 Q93 108 122 20"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.4"
      />
      {/* the particle, resting in the left well */}
      <circle cx="37" cy="76" r="6.5" fill={SUPPORT} opacity="0.9" />
      {/* the equally-available other state */}
      <circle
        cx="93"
        cy="76"
        r="6.5"
        fill="none"
        stroke={SUPPORT}
        strokeWidth="1.4"
        strokeDasharray="2.5 2.5"
        opacity="0.8"
      />
      <text x="93" y="97" textAnchor="middle" fontSize="10.5" fill={SUPPORT} opacity="0.75">
        or
      </text>
    </svg>
  );
}

// The bridge: double-headed arrow, × k ln 2 above, gloss below. ---------------
function Bridge() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        minWidth: 122,
      }}
    >
      <div style={{ fontSize: 14 }}>
        <M tex={String.raw`\times\, k\ln 2`} />
      </div>
      <svg viewBox="0 0 110 16" width="110" aria-hidden="true">
        <defs>
          <marker id="ub-tip" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M6 1 L1 3.5 L6 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </marker>
          <marker id="ub-tip-r" markerWidth="7" markerHeight="7" refX="2" refY="3.5" orient="auto">
            <path d="M1 1 L6 3.5 L1 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </marker>
        </defs>
        <line
          x1="8"
          y1="8"
          x2="102"
          y2="8"
          stroke="currentColor"
          strokeOpacity="0.75"
          strokeWidth="1.5"
          markerStart="url(#ub-tip)"
          markerEnd="url(#ub-tip-r)"
        />
      </svg>
      <div style={{ fontSize: 11, opacity: 0.6, textAlign: "center", lineHeight: 1.25 }}>
        bits to joules
        <br />
        per kelvin
      </div>
    </div>
  );
}

export default function UnitsBridge() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 780,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center", gap: 4 }}>
        <Card
          header="information theory"
          headerColor={ACCENT}
          formula={String.raw`${H_SYM} = 1\ \text{bit}`}
        >
          <TwoBars />
        </Card>

        <Bridge />

        <Card
          header="thermodynamics"
          headerColor={SUPPORT}
          formula={String.raw`${S_SYM} = k\ln 2 \approx 9.57\times 10^{-24}\ \text{J/K}`}
        >
          <TwoWells />
        </Card>
      </div>

      <div style={{ textAlign: "center", fontSize: 13.5, lineHeight: 1.5 }}>
        <M tex={String.raw`${S_SYM} = (k\ln 2)\,${H_SYM}`} size={14} /> — thermodynamic entropy is
        Shannon entropy in nats times{" "}
        <M tex={String.raw`k`} size={13} />.
      </div>
    </div>
  );
}
