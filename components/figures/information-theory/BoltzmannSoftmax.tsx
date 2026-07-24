import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * BoltzmannSoftmax — one maximum-entropy solution wearing two vocabularies
 * (playbook rule 8: two near-identical panels; rule 7: labels-with-arrows onto
 * the exact symbols).
 *
 * Center: the shared skeleton p_i = e^{□_i} / Σ_j e^{□_j}; amber = the
 * exponential skeleton, the □ slot is the thing each field fills in. A fork
 * drops to two panels that fill the SAME slot differently:
 *   left  (physics): □_i = -E_i/kT  — E_i energy, T temperature, Z partition fn
 *   right (ML):      □_i =  z_i/T    — z_i logit, T temperature, softmax normalizer
 * Color binds to ROLE: amber = the shared skeleton (e, Σ, the slot), blue =
 * the per-field constrained quantity that fills the slot (E_i / z_i).
 *
 * One idea: two vocabularies label one formula.
 */

const box = ACCENT;
const quant = SUPPORT;

// shared skeleton, slot empty ------------------------------------------------
const SKELETON = String.raw`p_i \;=\; \dfrac{\textcolor{${box}}{e}^{\,\textcolor{${box}}{\square_i}}}{\textcolor{${box}}{\sum_j}\,\textcolor{${box}}{e}^{\,\textcolor{${box}}{\square_j}}}`;

// panel formulas: same skeleton, slot filled with the blue constrained qty ---
const PHYS = String.raw`p_i \;=\; \dfrac{\textcolor{${box}}{e}^{\,-\textcolor{${quant}}{E_i}/kT}}{\textcolor{${box}}{\sum_j}\,\textcolor{${box}}{e}^{\,-\textcolor{${quant}}{E_j}/kT}}`;
const ML = String.raw`p_i \;=\; \dfrac{\textcolor{${box}}{e}^{\,\textcolor{${quant}}{z_i}/T}}{\textcolor{${box}}{\sum_j}\,\textcolor{${box}}{e}^{\,\textcolor{${quant}}{z_j}/T}}`;

// panel geometry (viewBox coords for the arrow overlay) ----------------------
const PW = 336;
const PH = 250;
// formula sits centered horizontally, vertically around y≈130
const FCX = 168;

type Arrow = { x1: number; y1: number; x2: number; y2: number };
type Lab = {
  node: React.ReactNode;
  // absolute HTML box position (left/top or right/bottom in px)
  css: React.CSSProperties;
  arrow: Arrow;
};

function ArrowLayer({ arrows }: { arrows: Arrow[] }) {
  return (
    <svg
      viewBox={`0 0 ${PW} ${PH}`}
      width={PW}
      height={PH}
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="bs-tip"
          markerWidth="6"
          markerHeight="6"
          refX="4.5"
          refY="3"
          orient="auto"
        >
          <path d="M1 1 L5 3 L1 5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </marker>
      </defs>
      {arrows.map((a, i) => (
        <line
          key={i}
          x1={a.x1}
          y1={a.y1}
          x2={a.x2}
          y2={a.y2}
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.55"
          markerEnd="url(#bs-tip)"
        />
      ))}
    </svg>
  );
}

function Panel({ header, formula, labels }: { header: string; formula: string; labels: Lab[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{header}</div>
      <div style={{ position: "relative", width: PW, height: PH }}>
        {/* the formula, centered in the box */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 108,
            textAlign: "center",
            fontSize: 21,
          }}
        >
          <M display tex={formula} />
        </div>
        {/* thin label-arrows onto the exact symbols */}
        <ArrowLayer arrows={labels.map((l) => l.arrow)} />
        {labels.map((l, i) => (
          <div key={i} style={{ position: "absolute", fontSize: 12.5, lineHeight: 1.3, ...l.css }}>
            {l.node}
          </div>
        ))}
      </div>
    </div>
  );
}

function QLabel({ children }: { children: React.ReactNode }) {
  return <span style={{ color: quant, fontWeight: 600 }}>{children}</span>;
}

export default function BoltzmannSoftmax() {
  const physLabels: Lab[] = [
    {
      node: (
        <span>
          <QLabel>
            <M tex={String.raw`E_i`} size={12} color={quant} />
          </QLabel>
          : energy of microstate <M tex={String.raw`i`} size={12} />
        </span>
      ),
      css: { left: 4, top: 4, maxWidth: 168 },
      arrow: { x1: 74, y1: 40, x2: 132, y2: 104 },
    },
    {
      node: (
        <span>
          <M tex={String.raw`T`} size={12} />: temperature
        </span>
      ),
      css: { right: 8, top: 66, maxWidth: 150, textAlign: "left" },
      arrow: { x1: 234, y1: 90, x2: 214, y2: 128 },
    },
    {
      node: (
        <span>
          denominator: partition function <M tex={String.raw`Z`} size={12} />
        </span>
      ),
      css: { left: 44, bottom: 4, maxWidth: 250, textAlign: "center" },
      arrow: { x1: 160, y1: 214, x2: 150, y2: 176 },
    },
  ];

  const mlLabels: Lab[] = [
    {
      node: (
        <span>
          <QLabel>
            <M tex={String.raw`z_i`} size={12} color={quant} />
          </QLabel>
          : logit <M tex={String.raw`i`} size={12} />
        </span>
      ),
      css: { left: 4, top: 4, maxWidth: 150 },
      arrow: { x1: 70, y1: 40, x2: 138, y2: 104 },
    },
    {
      node: (
        <span>
          <M tex={String.raw`T`} size={12} />: temperature
          <br />
          <span style={{ opacity: 0.6, whiteSpace: "nowrap" }}>
            (<M tex={String.raw`T=1`} size={11} /> in training)
          </span>
        </span>
      ),
      css: { right: 8, top: 60, maxWidth: 150, textAlign: "left" },
      arrow: { x1: 232, y1: 96, x2: 212, y2: 128 },
    },
    {
      node: <span>denominator: the softmax normalizer</span>,
      css: { left: 40, bottom: 4, maxWidth: 258, textAlign: "center" },
      arrow: { x1: 160, y1: 214, x2: 150, y2: 176 },
    },
  ];

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* shared skeleton */}
      <div style={{ fontSize: 24 }}>
        <M display tex={SKELETON} />
      </div>
      <div style={{ ...({} as React.CSSProperties), fontSize: 12.5, opacity: 0.6, marginTop: 2 }}>
        one maximum-entropy solution — fill the{" "}
        <span style={{ color: box, fontWeight: 700 }}>amber slot</span> two ways
      </div>

      {/* fork down to the two panels */}
      <svg viewBox="0 0 420 46" width="420" style={{ marginTop: 4 }} aria-hidden="true">
        <defs>
          <marker id="bs-fork" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M1 1 L6 3.5 L1 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </marker>
        </defs>
        <line x1="210" y1="2" x2="210" y2="16" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.55" />
        <path
          d="M210 16 C210 30 120 22 120 41"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.55"
          markerEnd="url(#bs-fork)"
        />
        <path
          d="M210 16 C210 30 300 22 300 41"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.55"
          markerEnd="url(#bs-fork)"
        />
      </svg>

      {/* two vocabularies */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
        <Panel header="Boltzmann distribution" formula={PHYS} labels={physLabels} />
        <Panel header="softmax layer" formula={ML} labels={mlLabels} />
      </div>

      {/* payoff */}
      <div
        style={{
          marginTop: 6,
          padding: "8px 16px",
          border: `1.4px solid ${box}`,
          borderRadius: 6,
          maxWidth: 620,
          textAlign: "center",
          fontSize: 13.5,
          lineHeight: 1.4,
        }}
      >
        same maximum-entropy solution — energies are negative logits{" "}
        <M tex={String.raw`(E_i = -z_i)`} size={12} />, and{" "}
        <M tex={String.raw`\beta = 1/kT`} size={12} /> is the Lagrange multiplier.
      </div>
    </div>
  );
}
