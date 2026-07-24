import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * LandauerErasure — erasing one bit as a collapsing double well (after
 * Parrondo, Horowitz & Sagawa, Nature Physics 2015, redrawn — not copied).
 *
 * Left: a symmetric double-well potential (currentColor structure) with minima
 * labeled 0 and 1; the memory's state (amber) is half-present in BOTH wells,
 * p = 1/2 each — a genuine unknown bit: H = 1 bit, S = k ln 2. A bold RESET
 * arrow deforms the landscape: the right well is raised into a wall so the
 * particle can only sit in 0. Right: the amber state is definitely in 0,
 * p = 1: H = 0, S = 0. The k ln 2 of entropy that left the memory is dumped
 * into the thermal bath as heat (blue): Q >= kT ln 2 ≈ 2.9e-21 J at 300 K.
 *
 * Color roles: amber = the memory's state (the subject), blue = the heat
 * leaving, currentColor = the potentials and structure.
 *
 * One idea: forgetting a bit pushes k ln 2 of entropy into the bath as heat.
 */

// ---- shared coordinate frame for both potential panels ---------------------
// x in [-1.55, 1.55] -> px [29, 191];  V in [0, 2.7] -> y [118, 20]
const X = (x: number) => 110 + 52 * x;
const Yv = (V: number) => 118 - 36.3 * V;
const dwell = (x: number) => Math.pow(x * x - 1, 2); // symmetric double well
// erased landscape: left well + barrier, then a rising wall where "1" used to be
const rWell = (x: number) => (x <= 0 ? dwell(x) : 1 + 1.1 * x);

const samples = (a: number, b: number, n: number) =>
  Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

const pathOf = (f: (x: number) => number, a = -1.55, b = 1.55) =>
  samples(a, b, 160)
    .map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Yv(f(x)).toFixed(1)}`)
    .join(" ");

const LEFT_CURVE = pathOf(dwell);
const RIGHT_CURVE = pathOf(rWell);
// faint ghost of the well that was raised away (original right half)
const GHOST_RIGHT = pathOf(dwell, 0, 1.55);

const WELL_Y = 118; // floor of a well
const PR = 10; // particle radius; center sits one radius above the floor
const PCY = WELL_Y - PR;

const PANEL_W = 300;

function Particle({ x, faded }: { x: number; faded?: boolean }) {
  return (
    <circle
      cx={X(x)}
      cy={PCY}
      r={PR}
      fill={ACCENT}
      fillOpacity={faded ? 0.5 : 1}
      stroke={ACCENT}
      strokeOpacity={faded ? 0.6 : 1}
    />
  );
}

/** Before: symmetric double well, the bit is p=1/2 in each well. */
function BeforePanel() {
  return (
    <svg viewBox="0 0 220 162" width={PANEL_W} fontFamily="system-ui, sans-serif" aria-hidden="true">
      <path d={LEFT_CURVE} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <Particle x={-1} faded />
      <Particle x={1} faded />
      {/* state labels under the wells */}
      <text x={X(-1)} y="137" textAnchor="middle" fontWeight="700" fontSize="15" fill="currentColor">0</text>
      <text x={X(1)} y="137" textAnchor="middle" fontWeight="700" fontSize="15" fill="currentColor">1</text>
      <text x={X(-1)} y="154" textAnchor="middle" fontSize="12" fill={ACCENT} fontWeight="600">p = ½</text>
      <text x={X(1)} y="154" textAnchor="middle" fontSize="12" fill={ACCENT} fontWeight="600">p = ½</text>
    </svg>
  );
}

/** After: right well raised into a wall; the bit is certainly 0. */
function AfterPanel() {
  return (
    <svg viewBox="0 0 220 162" width={PANEL_W} fontFamily="system-ui, sans-serif" aria-hidden="true">
      {/* ghost of the removed well */}
      <path d={GHOST_RIGHT} fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 3" opacity="0.28" />
      <path d={RIGHT_CURVE} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {/* the raising: one clean up-arrow in the gap where the "1" well used to be */}
      <line
        x1={X(1.18)}
        y1={Yv(dwell(1.18)) - 4}
        x2={X(1.18)}
        y2={Yv(rWell(1.18)) + 8}
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.4"
        markerEnd="url(#le-up)"
      />
      <text x={X(1.18) + 6} y="86" fontSize="11" opacity="0.55" fill="currentColor">
        raised
      </text>
      <Particle x={-1} />
      <text x={X(-1)} y="137" textAnchor="middle" fontWeight="700" fontSize="15" fill="currentColor">0</text>
      <text x={X(1)} y="137" textAnchor="middle" fontWeight="700" fontSize="15" opacity="0.4" fill="currentColor">1</text>
      <text x={X(-1)} y="154" textAnchor="middle" fontSize="12" fill={ACCENT} fontWeight="600">p = 1</text>
    </svg>
  );
}

export default function LandauerErasure() {
  const before = String.raw`\text{before:}\ \ H = 1\ \text{bit},\ \ S = k\ln 2`;
  const after = String.raw`\text{after:}\ \ H = 0,\ \ S = 0`;
  const qLabel = String.raw`\textcolor{${SUPPORT}}{Q \ \ge\ kT\ln 2 \ \approx\ 2.9\times 10^{-21}\ \text{J}}`;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 740,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* shared marker for the little "raised" up-ticks */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <marker id="le-up" markerWidth="6" markerHeight="6" refX="3" refY="4.5" orient="auto">
            <path d="M1 5 L3 1 L5 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </marker>
        </defs>
      </svg>

      {/* top row: before  --RESET-->  after */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 4 }}>
        {/* before */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <BeforePanel />
          <M tex={before} />
        </div>

        {/* RESET arrow, aligned with the wells */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 78 }}>
          <svg viewBox="0 0 96 56" width={96} aria-hidden="true">
            <text x="48" y="16" textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="2" fill="currentColor">
              RESET
            </text>
            <line x1="6" y1="36" x2="74" y2="36" stroke="currentColor" strokeWidth="3.5" />
            <path d="M72 28 L90 36 L72 44 Z" fill="currentColor" />
          </svg>
        </div>

        {/* after */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <AfterPanel />
          <M tex={after} />
        </div>
      </div>

      {/* heat down into the thermal bath */}
      <svg viewBox="0 0 700 104" width="100%" style={{ maxWidth: 700, marginTop: 6 }} fontFamily="system-ui, sans-serif" aria-hidden="true">
        {/* blue heat arrow, descending from under the RESET action */}
        <line x1="350" y1="4" x2="350" y2="46" stroke={SUPPORT} strokeWidth="3" />
        <path d="M342 44 L350 58 L358 44 Z" fill={SUPPORT} />
        <text x="366" y="34" fontSize="13" fontWeight="600" fill={SUPPORT}>
          heat Q
        </text>

        {/* the thermal bath */}
        <rect x="60" y="62" width="580" height="34" rx="7" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.55" />
        {/* faint agitation squiggles inside the bath */}
        {[130, 250, 450, 570].map((cx) => (
          <path
            key={cx}
            d={`M${cx - 16},82 q8,-9 16,0 q8,9 16,0`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        <text x="350" y="84" textAnchor="middle" fontSize="12.5" opacity="0.7" fill="currentColor">
          thermal bath — 300 K
        </text>
      </svg>

      {/* the Landauer bound (blue = heat) */}
      <div style={{ marginTop: 2 }}>
        <M tex={qLabel} />
      </div>

      {/* one idea */}
      <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7, textAlign: "center", maxWidth: 560, lineHeight: 1.4 }}>
        forgetting a bit pushes <M tex={String.raw`k\ln 2`} size={12} /> of entropy out of the memory and into the bath as heat
      </div>
    </div>
  );
}
