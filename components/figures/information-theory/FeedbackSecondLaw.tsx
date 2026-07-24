import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * FeedbackSecondLaw — the Sagawa–Ueda feedback second law, dissected in place.
 *
 * One centered display equation
 *
 *     W  ≥  ΔF  −  kT ln2 · I(X;M)
 *
 * with short labels and thin arrows dropping onto the exact symbols
 * (playbook rule 7), and an underbrace under the information term glossing
 * the price of a bit. Two one-line special cases sit beneath.
 *
 * Color roles (rule 1): amber = the information term I(X;M) — the subject,
 * mutual information entering the bound; blue = the classical free-energy
 * term ΔF (the no-measurement bound); currentColor = the work W and all
 * structure. At most these two hues plus currentColor.
 *
 * One idea: mutual information enters the second law as a work voucher
 * priced at kT ln2 per bit. Source: Sagawa–Ueda bound as stated in
 * Parrondo, Horowitz & Sagawa, "Thermodynamics of information," Nature
 * Physics 11 (2015) — recreated in house style, not copied.
 */

const A = ACCENT; // amber — information term (subject)
const B = SUPPORT; // blue — classical free-energy term

const amber = (tex: string) => String.raw`\textcolor{${A}}{${tex}}`;
const blue = (tex: string) => String.raw`\textcolor{${B}}{${tex}}`;

// Main dissected equation. The information term carries an underbrace whose
// two-line gloss states the price of a bit.
const MAIN = String.raw`
  W \;\ge\; ${blue(String.raw`\Delta F`)} \;-\;
  \underbrace{\,kT\ln 2 \cdot ${amber(String.raw`I(X;M)`)}\,}_{
    \substack{
      \text{the bits you gathered buy this} \\[1pt]
      \text{much extra work: } kT\ln 2 \text{ per bit}
    }
  }`;

// Special cases (smaller).
const CASE_NO_MEAS = String.raw`\text{no measurement, } ${amber(
  String.raw`I = 0`,
)}:\quad W \;\ge\; ${blue(String.raw`\Delta F`)}`;

const CASE_SZILARD = String.raw`\text{Szilard cycle, } ${blue(
  String.raw`\Delta F = 0`,
)},\ ${amber(String.raw`I = 1\text{ bit}`)}:\quad
  \underbrace{-W}_{\text{extractable work}} \;\le\; kT\ln 2`;

/** A thin "this label names that symbol" arrow (rule 6): line + small head. */
function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}) {
  // unit vector along the arrow, for the head
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // perpendicular
  const px = -uy;
  const py = ux;
  const h = 6; // head length
  const w = 2.6; // head half-width
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  return (
    <g stroke={color} fill={color} opacity={0.9}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1} />
      <path
        d={`M ${x2} ${y2} L ${bx + px * w} ${by + py * w} L ${
          bx - px * w
        } ${by - py * w} Z`}
        strokeWidth={0}
      />
    </g>
  );
}

const labelBase: React.CSSProperties = {
  position: "absolute",
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  lineHeight: 1.3,
};

export default function FeedbackSecondLaw() {
  const W = 600;
  const H = 340;
  return (
    <div
      style={{
        position: "relative",
        width: W,
        minHeight: H,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        boxSizing: "border-box",
        padding: "6px 8px",
      }}
    >
      {/* ---- top label band with arrows onto the symbols ---- */}
      {/* label: W (currentColor) */}
      <div
        style={{
          ...labelBase,
          left: 8,
          top: 20,
          width: 132,
          color: "currentColor",
          textAlign: "left",
        }}
      >
        work done on the system <span style={{ opacity: 0.6 }}>(average)</span>
      </div>
      {/* label: ΔF (blue) */}
      <div
        style={{
          ...labelBase,
          left: 202,
          top: 4,
          width: 156,
          color: B,
          textAlign: "center",
        }}
      >
        free-energy change: the no-measurement bound
      </div>
      {/* label: I(X;M) (amber) */}
      <div
        style={{
          ...labelBase,
          right: 8,
          top: 20,
          width: 128,
          color: A,
          textAlign: "right",
        }}
      >
        measured information, in bits
      </div>

      {/* arrows overlay (px == svg units) */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <Arrow x1={80} y1={56} x2={90} y2={148} color="currentColor" />
        <Arrow x1={280} y1={44} x2={182} y2={148} color={B} />
        <Arrow x1={515} y1={56} x2={442} y2={148} color={A} />
      </svg>

      {/* ---- main dissected equation ---- */}
      <div
        style={{
          position: "absolute",
          top: 118,
          left: 0,
          width: W,
          textAlign: "center",
        }}
      >
        <M tex={MAIN} display size={24} />
      </div>

      {/* ---- special cases ---- */}
      <div
        style={{
          position: "absolute",
          top: 258,
          left: 0,
          width: W,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <M tex={CASE_NO_MEAS} size={15} />
        <M tex={CASE_SZILARD} size={15} />
      </div>
    </div>
  );
}
