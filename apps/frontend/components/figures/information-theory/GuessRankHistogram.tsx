import { ACCENT, SUPPORT } from "../palette";

/**
 * GuessRankHistogram — the worked 40-position guessing game as a vertical bar
 * chart. Amber bars give the fraction of letters first guessed on rank 1..6
 * (26/6/4/2/1/1 of 40 = .65/.15/.10/.05/.025/.025); rank 7+ is empty.
 *
 * One idea: the mass piled on rank 1 (two thirds of letters) is a peaked
 * rank distribution — that skew is what drives both the entropy bounds down.
 *
 * Colors: amber = bars (the subject); blue = the rank-1 callout only;
 * currentColor = axes + tick labels (survives both themes).
 */

const W = 560;
const H = 320;

const PX0 = 60; // y-axis x
const PX1 = 540; // right edge of plot
const PTOP = 44; // top of plot (v = 0.7)
const PBOT = 272; // baseline (v = 0)
const YMAX = 0.7;

const SLOTS = 7;
const SLOTW = (PX1 - PX0) / SLOTS;
const BARW = 42;

const VALS = [0.65, 0.15, 0.1, 0.05, 0.025, 0.025, 0];
const VLABELS = [".65", ".15", ".10", ".05", ".025", ".025", ""];
const XLABELS = ["1", "2", "3", "4", "5", "6", "7+"];

const YTICKS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
const YTLABELS = ["0", ".1", ".2", ".3", ".4", ".5", ".6", ".7"];

const cx = (i: number) => PX0 + (i + 0.5) * SLOTW;
const yPx = (v: number) => PBOT - (v / YMAX) * (PBOT - PTOP);

export default function GuessRankHistogram() {
  const bar1Cx = cx(0);
  const bar1Top = yPx(VALS[0]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {/* ── horizontal gridlines + y ticks ── */}
        {YTICKS.map((t, i) => {
          const y = yPx(t);
          return (
            <g key={`y${t}`}>
              <line
                x1={PX0}
                y1={y}
                x2={PX1}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeOpacity={t === 0 ? 0.45 : 0.12}
              />
              <text
                x={PX0 - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="currentColor"
                opacity="0.55"
              >
                {YTLABELS[i]}
              </text>
            </g>
          );
        })}

        {/* ── y-axis line ── */}
        <line x1={PX0} y1={PTOP} x2={PX0} y2={PBOT} stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />

        {/* ── bars + value labels + x labels ── */}
        {VALS.map((v, i) => {
          const x = cx(i) - BARW / 2;
          const top = yPx(v);
          return (
            <g key={`b${i}`}>
              {v > 0 && (
                <>
                  <rect x={x} y={top} width={BARW} height={PBOT - top} fill={ACCENT} opacity="0.9" rx="2" />
                  <text
                    x={cx(i)}
                    y={top - 7}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="600"
                    fill={ACCENT}
                  >
                    {VLABELS[i]}
                  </text>
                </>
              )}
              <text
                x={cx(i)}
                y={PBOT + 18}
                textAnchor="middle"
                fontSize="12.5"
                fill="currentColor"
                opacity="0.7"
              >
                {XLABELS[i]}
              </text>
            </g>
          );
        })}

        {/* ── rank-1 callout: blue text + thin pointer line to the bar top ── */}
        <path
          d={`M ${bar1Cx + BARW / 2 + 2} ${bar1Top + 6} L 196 ${bar1Top + 2}`}
          stroke={SUPPORT}
          strokeWidth="1"
          fill="none"
          opacity="0.8"
        />
        <circle cx={bar1Cx + BARW / 2 + 2} cy={bar1Top + 6} r="2" fill={SUPPORT} />
        <text x={200} y={bar1Top - 4} fontSize="12.5" fontWeight="600" fill={SUPPORT}>
          two thirds of letters:
        </text>
        <text x={200} y={bar1Top + 12} fontSize="12.5" fontWeight="600" fill={SUPPORT}>
          first guess
        </text>

        {/* ── axis titles ── */}
        <text x={PX0 + (PX1 - PX0) / 2} y={H - 6} textAnchor="middle" fontSize="12.5" fill="currentColor" opacity="0.7">
          guess rank
        </text>
        <text
          transform={`translate(16 ${PTOP + (PBOT - PTOP) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="12.5"
          fill="currentColor"
          opacity="0.7"
        >
          fraction of positions
        </text>
      </svg>
    </div>
  );
}
