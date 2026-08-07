import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * TwoPhysicsFaces — the course's entropy IS the physicist's entropy, used
 * twice (Jaynes 1957 / course spiral, figure plan item 6).
 *
 * Two compact panels over a shared footer:
 *   Left  "inference face"  p_i = e^{-E_i/kT}/Z  — maximize H under an energy
 *                           constraint gives the Boltzmann distribution.
 *   Right "cost face"       Q ≥ kT ln 2 per bit  — the second law prices every
 *                           erased bit (Landauer).
 * Both rest on ONE identity, the amber footer bar:
 *   Shannon H = thermodynamic S (÷ k ln 2).
 *
 * Color roles: amber = the shared entropy identity (footer); blue = the two
 * per-panel formulas; currentColor = structure. One idea: one entropy, used
 * once as an inference principle and once as an energy price.
 */

const BLUE = String.raw`\textcolor{${SUPPORT}}`;

function Panel({
  role,
  ref_,
  formulaTex,
  formulaSize,
  aside,
  gloss,
}: {
  role: string;
  ref_: string;
  formulaTex: string;
  formulaSize: number;
  aside?: string;
  gloss: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 240px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "4px 16px 16px",
        minWidth: 236,
      }}
    >
      {/* header: role (bold) — reference (muted mono) */}
      <div style={{ textAlign: "center", lineHeight: 1.3 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{role}</span>
        <span style={{ opacity: 0.5, fontSize: 12.5 }}>{" — "}</span>
        <span
          style={{
            opacity: 0.6,
            fontSize: 12,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {ref_}
        </span>
      </div>

      {/* the per-panel formula (blue), boxed */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: `1.5px solid ${SUPPORT}`,
          borderRadius: 6,
          padding: "10px 16px",
        }}
      >
        <M tex={formulaTex} size={formulaSize} />
        {aside ? (
          <span
            style={{
              fontSize: 11.5,
              opacity: 0.55,
              lineHeight: 1.15,
              whiteSpace: "pre-line",
            }}
          >
            {aside}
          </span>
        ) : null}
      </div>

      {/* gloss */}
      <div
        style={{
          fontStyle: "italic",
          opacity: 0.62,
          fontSize: 12.5,
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: 230,
        }}
      >
        {gloss}
      </div>

      {/* connector: this face rests on the footer (pinned to panel bottom so
          both faces meet the shared bar at the same height) */}
      <svg
        viewBox="0 0 12 20"
        width="12"
        height="20"
        aria-hidden="true"
        style={{ opacity: 0.4, marginTop: "auto" }}
      >
        <line x1="6" y1="0" x2="6" y2="20" stroke="currentColor" strokeWidth="1.3" strokeDasharray="3 3" />
      </svg>
    </div>
  );
}

export default function TwoPhysicsFaces() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 620,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        border: "1px solid currentColor",
        borderColor: "rgba(128,128,128,0.35)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* two faces, split by a vertical divider */}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <Panel
          role="inference face"
          ref_="max-entropy-principle"
          formulaTex={String.raw`${BLUE}{p_i} = \dfrac{e^{-E_i/kT}}{Z}`}
          formulaSize={19}
          gloss="maximize H under an energy constraint: the Boltzmann distribution"
        />
        <div
          aria-hidden="true"
          style={{
            width: 1,
            alignSelf: "stretch",
            background: "rgba(128,128,128,0.3)",
          }}
        />
        <Panel
          role="cost face"
          ref_="this lesson"
          formulaTex={String.raw`${BLUE}{Q} \geq kT \ln 2`}
          formulaSize={19}
          aside={"per\nerased bit"}
          gloss="the second law prices every bit"
        />
      </div>

      {/* the single fact both faces rest on — amber footer bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "12px 16px",
          background: `${ACCENT}22`,
          borderTop: `2px solid ${ACCENT}`,
          textAlign: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 700, color: ACCENT, fontSize: 14.5 }}>
          Shannon{" "}
        </span>
        <M tex={String.raw`\textcolor{${ACCENT}}{H}`} size={16} />
        <span style={{ fontWeight: 700, color: ACCENT, fontSize: 14.5 }}>
          {" "}={" "}
        </span>
        <span style={{ fontWeight: 700, color: ACCENT, fontSize: 14.5 }}>
          thermodynamic{" "}
        </span>
        <M tex={String.raw`\textcolor{${ACCENT}}{S}`} size={16} />
        <span style={{ fontWeight: 700, color: ACCENT, fontSize: 14.5 }}>
          {" "}
        </span>
        <M tex={String.raw`\textcolor{${ACCENT}}{(\div\, k \ln 2)}`} size={14} />
      </div>
    </div>
  );
}
