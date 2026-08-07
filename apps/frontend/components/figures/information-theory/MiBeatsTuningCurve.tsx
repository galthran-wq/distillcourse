import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * MiBeatsTuningCurve — the same neuron summarized two ways (playbook rule 8:
 * two panels joined by a bold arrow, the changed phrase highlighted).
 *
 * Left "tuning curve": a stimulus axis with two points s0, s1 and the mean
 * response at each carrying +/- sd error bars that visibly OVERLAP — from the
 * means alone the two stimuli look nearly the same. Right "full response
 * distributions": for the SAME two stimuli, the two response histograms over r
 * on a shared axis — s0's mass near r=0 (blue), s1's near a higher r (amber),
 * overlap region shaded — with the readout I(S;R) = 0.456 bits below.
 *
 * Color roles: amber = the preferred-stimulus (s1) distribution and the MI
 * payoff; blue = the other (s0) distribution; currentColor = axes and the
 * tuning curve. One idea: variance summaries lose exactly what mutual
 * information keeps.
 *
 * Inspiration: Borst & Theunissen (1999) fig. 1 — recreated with a synthetic
 * two-stimulus example, not copied.
 */

// ── left panel: tuning curve ───────────────────────────────────────────────
const TL = 46;
const TR = 176;
const TT = 16;
const TB = 150;
const R_MAX = 8; // response axis 0..8
const yR = (v: number) => TB - (v / R_MAX) * (TB - TT);
const SX0 = 92;
const SX1 = 148;
const M0 = 3; // s0 mean response
const SD0 = 1.8;
const M1 = 5; // s1 mean response
const SD1 = 1.8;
// error-bar overlap zone in response units
const OV_LO = M1 - SD1; // 3.2
const OV_HI = M0 + SD0; // 4.8

function TuningPanel() {
  return (
    <svg viewBox="0 0 196 190" width="230" style={{ display: "block" }} aria-hidden="true">
      {/* error-bar overlap band */}
      <rect
        x={TL}
        y={yR(OV_HI)}
        width={TR - TL + 8}
        height={yR(OV_LO) - yR(OV_HI)}
        fill="currentColor"
        opacity="0.08"
      />
      <text
        x={TR + 6}
        y={(yR(OV_HI) + yR(OV_LO)) / 2 + 3}
        fontSize="9"
        fill="currentColor"
        opacity="0.5"
        textAnchor="middle"
        style={{ writingMode: "vertical-rl" as const }}
      >
        overlap
      </text>

      {/* axes */}
      <line x1={TL} y1={TT} x2={TL} y2={TB} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <line x1={TL} y1={TB} x2={TR + 8} y2={TB} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />

      {/* response-axis title */}
      <text
        transform={`translate(14 ${(TT + TB) / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize="10.5"
        fill="currentColor"
        opacity="0.6"
      >
        mean response r
      </text>

      {/* tuning curve: line through the two means (currentColor) */}
      <line
        x1={SX0}
        y1={yR(M0)}
        x2={SX1}
        y2={yR(M1)}
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.7"
      />

      {/* error bars + mean dots */}
      {[
        { x: SX0, m: M0, sd: SD0 },
        { x: SX1, m: M1, sd: SD1 },
      ].map(({ x, m, sd }, i) => (
        <g key={i}>
          <line x1={x} y1={yR(m - sd)} x2={x} y2={yR(m + sd)} stroke="currentColor" strokeWidth="1.4" />
          <line x1={x - 5} y1={yR(m + sd)} x2={x + 5} y2={yR(m + sd)} stroke="currentColor" strokeWidth="1.4" />
          <line x1={x - 5} y1={yR(m - sd)} x2={x + 5} y2={yR(m - sd)} stroke="currentColor" strokeWidth="1.4" />
          <circle cx={x} cy={yR(m)} r="4" fill="currentColor" />
        </g>
      ))}

      {/* stimulus ticks + labels, colored by stimulus identity */}
      {[
        { x: SX0, label: "s₀", color: SUPPORT },
        { x: SX1, label: "s₁", color: ACCENT },
      ].map(({ x, label, color }) => (
        <g key={label}>
          <line x1={x} y1={TB} x2={x} y2={TB + 4} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
          <text x={x} y={TB + 16} textAnchor="middle" fontSize="12" fontWeight="600" fill={color}>
            {label}
          </text>
        </g>
      ))}
      <text x={(SX0 + SX1) / 2} y={TB + 32} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.6">
        stimulus
      </text>
    </svg>
  );
}

// ── right panel: full response distributions ───────────────────────────────
const DL = 40;
const DR = 274;
const DT = 16;
const DB = 150;
const NBINS = 10; // r = 0..9
const SLOTW = (DR - DL) / NBINS;
const P_MAX = 0.25;
const yP = (p: number) => DB - (p / P_MAX) * (DB - DT);
const binCx = (i: number) => DL + (i + 0.5) * SLOTW;

// synthetic response distributions (rule 4: one concrete example)
const P_S0 = [0.06, 0.17, 0.23, 0.22, 0.15, 0.09, 0.05, 0.02, 0.01, 0.0]; // blue, low r
const P_S1 = [0.0, 0.01, 0.03, 0.08, 0.13, 0.18, 0.19, 0.16, 0.12, 0.1]; // amber, high r
const OV_FROM = 3; // overlap bins r = 3..6
const OV_TO = 6;
const BARW = (SLOTW - 5) / 2;

function DistPanel() {
  return (
    <svg viewBox="0 0 288 190" width="330" style={{ display: "block" }} aria-hidden="true">
      {/* overlap shading band */}
      <rect
        x={DL + OV_FROM * SLOTW}
        y={DT}
        width={(OV_TO - OV_FROM + 1) * SLOTW}
        height={DB - DT}
        fill="currentColor"
        opacity="0.07"
      />
      <text
        x={DL + (OV_FROM + (OV_TO - OV_FROM + 1) / 2) * SLOTW}
        y={DT + 10}
        textAnchor="middle"
        fontSize="9.5"
        fill="currentColor"
        opacity="0.5"
      >
        overlap
      </text>

      {/* axes */}
      <line x1={DL} y1={DT} x2={DL} y2={DB} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <line x1={DL} y1={DB} x2={DR + 4} y2={DB} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
      <text
        transform={`translate(12 ${(DT + DB) / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize="10.5"
        fill="currentColor"
        opacity="0.6"
      >
        P(r | s)
      </text>

      {/* grouped bars: blue (s0) + amber (s1) per response bin */}
      {P_S0.map((p0, i) => {
        const p1 = P_S1[i];
        const cx = binCx(i);
        return (
          <g key={i}>
            {p0 > 0 && (
              <rect
                x={cx - BARW - 1}
                y={yP(p0)}
                width={BARW}
                height={DB - yP(p0)}
                fill={SUPPORT}
                opacity="0.85"
                rx="1"
              />
            )}
            {p1 > 0 && (
              <rect
                x={cx + 1}
                y={yP(p1)}
                width={BARW}
                height={DB - yP(p1)}
                fill={ACCENT}
                opacity="0.85"
                rx="1"
              />
            )}
            <text x={cx} y={DB + 13} textAnchor="middle" fontSize="9.5" fill="currentColor" opacity="0.55">
              {i}
            </text>
          </g>
        );
      })}
      <text x={(DL + DR) / 2} y={DB + 30} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.6">
        response r (spikes)
      </text>

      {/* color-matched legend */}
      <g>
        <rect x={DR - 78} y={DT + 2} width={11} height={11} fill={SUPPORT} opacity="0.85" rx="1.5" />
        <text x={DR - 63} y={DT + 11} fontSize="11" fontWeight="600" fill={SUPPORT}>
          s&#8320;
        </text>
        <rect x={DR - 40} y={DT + 2} width={11} height={11} fill={ACCENT} opacity="0.85" rx="1.5" />
        <text x={DR - 25} y={DT + 11} fontSize="11" fontWeight="600" fill={ACCENT}>
          s&#8321;
        </text>
      </g>
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
        gap: 6,
        alignSelf: "center",
      }}
    >
      <svg viewBox="0 0 70 24" width="70" aria-hidden="true">
        <defs>
          <marker id="mbtc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M1 1 L7 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.7" />
          </marker>
        </defs>
        <line x1="4" y1="12" x2="60" y2="12" stroke="currentColor" strokeWidth="3.2" markerEnd="url(#mbtc-arrow)" />
      </svg>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: ACCENT,
          background: `${ACCENT}22`,
          borderRadius: 4,
          padding: "2px 7px",
          textAlign: "center",
          lineHeight: 1.25,
          maxWidth: 92,
        }}
      >
        distributions, not means
      </div>
    </div>
  );
}

function Panel({ header, children }: { header: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{header}</div>
      {children}
    </div>
  );
}

export default function MiBeatsTuningCurve() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 720,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <Panel header="tuning curve">
        <TuningPanel />
        <div style={{ fontStyle: "italic", opacity: 0.6, fontSize: 12.5, textAlign: "center" }}>
          means only: overlap hidden
        </div>
      </Panel>

      <Arrow />

      <Panel header="full response distributions">
        <DistPanel />
        <div style={{ marginTop: 2 }}>
          <M tex={String.raw`\textcolor{${ACCENT}}{I(S;R) = 0.456\ \text{bits}}`} size={15} />
        </div>
      </Panel>
    </div>
  );
}
