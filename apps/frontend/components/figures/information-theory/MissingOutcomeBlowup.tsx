import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * MissingOutcomeBlowup — the missing-outcome disaster for KL divergence, on the
 * running source p = (.5, .25, .15, .1) against a model q = (.5, .3, .2, 0)
 * that rules out symbol D entirely.
 *
 * Left: aligned grouped bars over A,B,C,D — blue = truth p, amber = model q.
 * The absent q(D) is a dashed hollow outline at zero height, flagged in the
 * warning color (playbook rule 10: warning color only for "don't").
 * Right: the four terms of D(p‖q) as a signed-bar waterfall — 0, −0.066, −0.062
 * as short bars near the axis, then the D-term as an arrow shooting off the top
 * edge of the frame, labeled 0.1·log₂(0.1/0) = +∞ in the warning color.
 *
 * One idea: one zero in the model outweighs every finite term — a model that
 * calls a real outcome impossible pays an unbounded penalty.
 *
 * Colors: blue = truth p, amber = model q, warning rose = the impossible slot
 * and the infinite term only; currentColor = axes, structure, finite terms.
 */

const WARN = "#d1495b"; // warning rose: the "don't" — impossibility and its price

/* ── left panel: grouped probability bars ───────────────────────────── */
const LW = 320;
const LH = 300;
const LX0 = 44; // y-axis
const LX1 = 296; // right edge of plot
const LTOP = 44;
const LBOT = 250;
const YMAX = 0.55;
const lSlot = (LX1 - LX0) / 4;
const lcx = (i: number) => LX0 + (i + 0.5) * lSlot;
const lY = (v: number) => LBOT - (v / YMAX) * (LBOT - LTOP);
const LBARW = 22;

const P = [0.5, 0.25, 0.15, 0.1]; // truth
const Q = [0.5, 0.3, 0.2, 0]; // model
const PLBL = [".5", ".25", ".15", ".1"];
const QLBL = [".5", ".3", ".2", ""];
const SYM = ["A", "B", "C", "D"];
const YT = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
const YTL = ["0", ".1", ".2", ".3", ".4", ".5"];

/* ── right panel: signed-bar waterfall of the four terms ────────────── */
const RW = 300;
const RH = 300;
const RX0 = 40;
const RX1 = 290;
const RZERO = 200; // the zero line
const rSlot = (RX1 - RX0) / 4;
const rcx = (i: number) => RX0 + (i + 0.5) * rSlot;
const TERM = [0, -0.066, -0.062]; // A, B, C (finite); D diverges
const RSCALE = 400; // px per bit
const RBARW = 26;

export default function MissingOutcomeBlowup() {
  const dArrowX = rcx(3);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: 720 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 28,
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        {/* ══════════ LEFT: truth vs model ══════════ */}
        <div style={{ flex: "1 1 300px", minWidth: 280, maxWidth: 340 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            Truth <M tex={String.raw`\textcolor{${SUPPORT}}{p}`} size={13} /> vs model{" "}
            <M tex={String.raw`\textcolor{${ACCENT}}{q}`} size={13} />, symbol by symbol
          </div>
          <svg width="100%" viewBox={`0 0 ${LW} ${LH}`} aria-hidden="true">
            {/* gridlines + y ticks */}
            {YT.map((t, i) => {
              const y = lY(t);
              return (
                <g key={`ly${t}`}>
                  <line
                    x1={LX0}
                    y1={y}
                    x2={LX1}
                    y2={y}
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeOpacity={t === 0 ? 0.45 : 0.12}
                  />
                  <text x={LX0 - 7} y={y + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55">
                    {YTL[i]}
                  </text>
                </g>
              );
            })}
            <line x1={LX0} y1={LTOP} x2={LX0} y2={LBOT} stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />

            {/* grouped bars */}
            {SYM.map((s, i) => {
              const bx = lcx(i) - LBARW - 2; // blue (truth) left
              const ax = lcx(i) + 2; // amber (model) right
              const pTop = lY(P[i]);
              const qTop = lY(Q[i]);
              const isD = i === 3;
              return (
                <g key={`grp${s}`}>
                  {/* truth p — blue */}
                  <rect x={bx} y={pTop} width={LBARW} height={LBOT - pTop} fill={SUPPORT} opacity="0.9" rx="2" />
                  <text x={bx + LBARW / 2} y={pTop - 5} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={SUPPORT}>
                    {PLBL[i]}
                  </text>

                  {/* model q — amber, or empty slot at D */}
                  {isD ? (
                    <rect
                      x={ax}
                      y={LBOT - 5}
                      width={LBARW}
                      height={5}
                      fill="none"
                      stroke={WARN}
                      strokeWidth="1.4"
                      strokeDasharray="3 2.5"
                    />
                  ) : (
                    <>
                      <rect x={ax} y={qTop} width={LBARW} height={LBOT - qTop} fill={ACCENT} opacity="0.9" rx="2" />
                      <text x={ax + LBARW / 2} y={qTop - 5} textAnchor="middle" fontSize="10.5" fontWeight="600" fill={ACCENT}>
                        {QLBL[i]}
                      </text>
                    </>
                  )}

                  {/* symbol label */}
                  <text x={lcx(i)} y={LBOT + 17} textAnchor="middle" fontSize="12.5" fill="currentColor" opacity="0.7">
                    {s}
                  </text>
                </g>
              );
            })}

            {/* q(D) = 0 flag — warning */}
            <path
              d={`M ${lcx(3) + 4} ${LBOT - 24} L ${lcx(3) + LBARW / 2 + 2} ${LBOT - 7}`}
              stroke={WARN}
              strokeWidth="1"
              fill="none"
              opacity="0.85"
            />
            <text x={lcx(3) + 2} y={LBOT - 30} textAnchor="middle" fontSize="11.5" fontWeight="700" fill={WARN}>
              q(D) = 0
            </text>

            {/* y-axis title */}
            <text
              transform={`translate(13 ${(LTOP + LBOT) / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize="11.5"
              fill="currentColor"
              opacity="0.6"
            >
              probability
            </text>
          </svg>

          {/* legend (rule 11: color-matched, under the graphic) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 6, fontSize: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, background: SUPPORT, borderRadius: 2, display: "inline-block" }} />
              truth p
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 12, background: ACCENT, borderRadius: 2, display: "inline-block" }} />
              model q
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: WARN, fontWeight: 600 }}>
              <span
                style={{ width: 12, height: 12, border: `1.4px dashed ${WARN}`, borderRadius: 2, display: "inline-block" }}
              />
              q(D) = 0
            </span>
          </div>
        </div>

        {/* ══════════ RIGHT: the four divergence terms ══════════ */}
        <div style={{ flex: "1 1 300px", minWidth: 280, maxWidth: 340 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            <M
              tex={String.raw`D(\textcolor{${SUPPORT}}{p}\,\|\,\textcolor{${ACCENT}}{q}) = \sum_x \textcolor{${SUPPORT}}{p(x)}\,\log_2\frac{\textcolor{${SUPPORT}}{p(x)}}{\textcolor{${ACCENT}}{q(x)}}`}
              size={13}
            />
          </div>
          <svg width="100%" viewBox={`0 0 ${RW} ${RH}`} aria-hidden="true">
            {/* zero line */}
            <line x1={RX0} y1={RZERO} x2={RX1} y2={RZERO} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
            <text x={RX0 - 6} y={RZERO + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55">
              0
            </text>

            {/* finite term bars: A (=0), B, C */}
            {TERM.map((v, i) => {
              const cx = rcx(i);
              const h = Math.abs(v) * RSCALE;
              return (
                <g key={`t${i}`}>
                  {v !== 0 && (
                    <rect x={cx - RBARW / 2} y={RZERO} width={RBARW} height={h} fill="currentColor" opacity="0.42" rx="2" />
                  )}
                  {v === 0 ? (
                    <text x={cx} y={RZERO - 6} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
                      0
                    </text>
                  ) : (
                    <text x={cx} y={RZERO + h + 15} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.75">
                      {`−${Math.abs(v).toFixed(3)}`}
                    </text>
                  )}
                  <text x={cx} y={RH - 26} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.7">
                    {SYM[i]}
                  </text>
                </g>
              );
            })}

            {/* D term: an arrow shooting off the top edge — warning */}
            <text x={dArrowX} y={RH - 26} textAnchor="middle" fontSize="12" fontWeight="700" fill={WARN}>
              D
            </text>
            <line x1={dArrowX} y1={RZERO} x2={dArrowX} y2={12} stroke={WARN} strokeWidth="2.4" />
            <path d={`M ${dArrowX} 4 L ${dArrowX - 6} 17 L ${dArrowX + 6} 17 Z`} fill={WARN} />
            {/* axis-break slashes: "runs off the frame" */}
            <line x1={dArrowX - 7} y1={112} x2={dArrowX + 7} y2={102} stroke={WARN} strokeWidth="1.6" />
            <line x1={dArrowX - 7} y1={122} x2={dArrowX + 7} y2={112} stroke={WARN} strokeWidth="1.6" />

            {/* infinite-term label */}
            <text x={dArrowX - 22} y={44} textAnchor="end" fontSize="12" fontWeight="700" fill={WARN}>
              0.1 log
              <tspan fontSize="9" dy="3">
                2
              </tspan>
              <tspan dy="-3">(0.1 / 0)</tspan>
            </text>
            <text x={dArrowX - 22} y={62} textAnchor="end" fontSize="13" fontWeight="700" fill={WARN}>
              = +&#8734;
            </text>

            {/* y-axis title */}
            <text
              transform={`translate(13 ${(20 + RZERO) / 2}) rotate(-90)`}
              textAnchor="middle"
              fontSize="11.5"
              fill="currentColor"
              opacity="0.6"
            >
              divergence term (bits)
            </text>
          </svg>
        </div>
      </div>

      {/* payoff line */}
      <div style={{ marginTop: 14, fontSize: 14, textAlign: "center", lineHeight: 1.45 }}>
        A model that calls a <b>real outcome impossible</b> pays an <b>unbounded penalty</b>: one zero in the
        model outweighs every finite term.
      </div>
    </div>
  );
}
