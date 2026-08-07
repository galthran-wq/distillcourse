import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * HoeffdingBin — the bin-and-tray picture for Hoeffding on ONE fixed
 * hypothesis h. A big jar (population) holds many marbles; amber marbles are
 * the inputs where h(x) ≠ y (errors), so the amber fraction IS the true error
 * probability E_out(h) = μ, which is unknown. Drawing N i.i.d. marbles fills a
 * small blue tray whose amber fraction is the empirical error E_in(h) = ν, which
 * we observe. Hoeffding bounds the chance the two fractions disagree by more
 * than ε.
 *
 * Single component figure. Two color roles only (+ currentColor):
 *   amber (ACCENT)  = errors / the error fraction being tracked → E_out, bin, μ
 *   blue  (SUPPORT) = the drawn sample → E_in, tray, ν
 * The naming lines are KaTeX \underbrace labels under E_in and E_out in the
 * bound, color-matched to the tray and the bin.
 *
 * One idea: for one FIXED h, the sample fraction ν tracks the bin fraction μ.
 *
 * Recreated in house style after Abu-Mostafa, "Learning From Data" (the
 * bin/marble analogy) — not copied.
 */

const ERR = ACCENT; // amber marble = h(x) ≠ y
const SAMP = SUPPORT; // blue = the sample / tray

// amber marble indices inside the 6×8 bin grid (12 of 48 → μ = 0.25)
const BIN_ERR = new Set([2, 7, 10, 15, 19, 23, 28, 31, 36, 40, 44, 46]);
// amber marble indices inside the 2×6 tray (3 of 12 → ν = 0.25)
const TRAY_ERR = new Set([1, 6, 9]);

function marbleFill(isErr: boolean) {
  return isErr ? ERR : "currentColor";
}
function marbleOpacity(isErr: boolean) {
  return isErr ? 0.92 : 0.24;
}

function Bin() {
  const cols = 6;
  const rows = 8;
  const x0 = 27;
  const y0 = 26;
  const stepX = 21;
  const stepY = 17.5;
  return (
    <svg viewBox="0 0 166 172" width="150" aria-hidden="true">
      <rect
        x="6"
        y="6"
        width="154"
        height="160"
        rx="15"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="2"
      />
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const isErr = BIN_ERR.has(i);
        return (
          <circle
            key={i}
            cx={x0 + c * stepX}
            cy={y0 + r * stepY}
            r="7"
            fill={marbleFill(isErr)}
            opacity={marbleOpacity(isErr)}
          />
        );
      })}
    </svg>
  );
}

function Tray() {
  const cols = 6;
  const rows = 2;
  const x0 = 24;
  const y0 = 27;
  const stepX = 22;
  const stepY = 26;
  return (
    <svg viewBox="0 0 156 96" width="150" aria-hidden="true">
      <rect
        x="5"
        y="5"
        width="146"
        height="86"
        rx="12"
        fill="none"
        stroke={SAMP}
        strokeWidth="2.2"
      />
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const isErr = TRAY_ERR.has(i);
        return (
          <circle
            key={i}
            cx={x0 + c * stepX}
            cy={y0 + r * stepY}
            r="9"
            fill={marbleFill(isErr)}
            opacity={marbleOpacity(isErr)}
          />
        );
      })}
    </svg>
  );
}

function Arrow() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        width: 116,
      }}
    >
      <M tex={String.raw`\text{draw } N \text{ i.i.d.}`} size={12.5} />
      <svg viewBox="0 0 116 16" width="116" aria-hidden="true">
        <defs>
          <marker
            id="hb-arrow"
            markerWidth="9"
            markerHeight="9"
            refX="7"
            refY="4.5"
            orient="auto"
          >
            <path d="M0 0 L9 4.5 L0 9 z" fill="currentColor" opacity="0.7" />
          </marker>
        </defs>
        <line
          x1="4"
          y1="8"
          x2="104"
          y2="8"
          stroke="currentColor"
          strokeOpacity="0.7"
          strokeWidth="2"
          markerEnd="url(#hb-arrow)"
        />
      </svg>
    </div>
  );
}

function Caption({
  tex,
  sub,
}: {
  tex: string;
  sub: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        marginTop: 10,
      }}
    >
      <M tex={tex} size={15} />
      <span style={{ ...labelMuted, fontStyle: "italic" }}>{sub}</span>
    </div>
  );
}

const POP_LABEL = String.raw`\text{population: }\;
  \textcolor{${ERR}}{\mu} = \textcolor{${ERR}}{E_{\text{out}}(h)}`;
const SAMP_LABEL = String.raw`\text{sample: }\;
  \textcolor{${SAMP}}{\nu} = \textcolor{${SAMP}}{E_{\text{in}}(h)}`;

const BOUND = String.raw`\Pr\!\Big[\,\big|\,
  \underbrace{\textcolor{${SAMP}}{E_{\text{in}}(h)}}_{\textcolor{${SAMP}}{\text{tray }\nu}}
  \;-\;
  \underbrace{\textcolor{${ERR}}{E_{\text{out}}(h)}}_{\textcolor{${ERR}}{\text{bin }\mu}}
  \,\big| > \epsilon \,\Big]
  \;\le\; 2e^{-2\epsilon^{2}N}`;

const PLUGGED = String.raw`\epsilon = 0.05,\;\; N = 1000:\quad
  \text{bound} = 2e^{-5} \approx \mathbf{0.014}`;

export default function HoeffdingBin() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        padding: "10px 10px 4px",
        width: 720,
        boxSizing: "border-box",
      }}
    >
      {/* TOP: bin → tray (the setup) */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Bin />
          <Caption tex={POP_LABEL} sub="unknown" />
        </div>
        <div style={{ marginBottom: 34 }}>
          <Arrow />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Tray />
          <Caption tex={SAMP_LABEL} sub="observed" />
        </div>
      </div>

      {/* BOTTOM: the bound + plugged instance (the theorem) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <M tex={BOUND} display size={21} />
        <div
          style={{
            borderTop: "1px solid rgba(128,128,128,0.28)",
            paddingTop: 14,
          }}
        >
          <M tex={PLUGGED} size={15} />
        </div>
        <div style={{ ...labelMuted, fontStyle: "italic", textAlign: "center", maxWidth: 360 }}>
          for one fixed h, the tray fraction ν tracks the bin fraction μ
        </div>
      </div>
    </div>
  );
}
