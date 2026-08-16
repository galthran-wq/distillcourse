import { ACCENT } from "../palette";

/**
 * LarPathSteps — least angle regression building the piecewise-linear
 * coefficient path (ridge-lasso ★ section), 4 frames.
 *
 * Shared layout: coefficient value vs. path progress (‖β‖₁ growing), zero
 * line as the horizontal axis, dashed guides at the three events. Each frame
 * extends the path by one step; the step's moving segments are amber, the
 * already-walked path fades to muted currentColor:
 *   frame 1  x₁ activates, β₁ moves alone toward its LS value
 *   frame 2  x₂'s correlation ties, β₁ and β₂ move equiangularly
 *   frame 3  x₃ ties; the recomputed direction sends β₂ back toward zero
 *   frame 4  lasso modification: β₂ hits zero and x₂ is dropped
 * One idea: kinks happen exactly at the events; between events every path is
 * a straight line. Idea from ESL §3.4.4 / Efron et al. 2004, drawn fresh.
 */

const X = (t: number) => 80 + t * 128;
const Y = (v: number) => 300 - v * 208;

// coefficient values at the kinks t = 0..4 (made-up but LAR-shaped: β₂
// enters second, turns down when x₃ joins, crosses zero at t = 3)
const SERIES: { name: string; v: number[] }[] = [
  { name: "β₁", v: [0, 0.5, 0.8, 1.0, 1.15] },
  { name: "β₂", v: [0, 0, 0.35, 0, 0] },
  { name: "β₃", v: [0, 0, 0, 0.3, 0.5] },
];

const GUIDES = [
  { t: 1, label: "x₂ ties" },
  { t: 2, label: "x₃ ties" },
  { t: 3, label: "β₂ = 0" },
];

// activation dots: the point where a coefficient leaves (or, dropped,
// returns to) the zero line; shown once the path has reached it
const DOTS = [
  { t: 1, from: 2 }, // β₂ activates, visible from frame 2
  { t: 2, from: 3 }, // β₃ activates
];

const STEP_LABEL = ["step 1", "step 2", "step 3", "lasso modification"];
const STEP_TEXT = [
  "x₁, most correlated with r = y, activates; β₁ moves toward its LS value",
  "x₂'s correlation catches up; β₁, β₂ move along the equiangular direction",
  "x₃ ties; the recomputed direction sends β₂ back toward zero",
  "β₂ hits zero — x₂ is dropped, the direction recomputed without it",
];

// endpoint labels per frame: [seriesIndex, x, y, anchor]
const LABELS: [number, number, number, "start" | "middle" | "end"][][] = [
  [[0, X(1) + 8, Y(0.5) + 4, "start"]],
  [
    [0, X(2) + 8, Y(0.8) + 4, "start"],
    [1, X(2) + 8, Y(0.35) + 4, "start"],
  ],
  [
    [0, X(3) + 8, Y(1.0) + 4, "start"],
    [1, 364, 238, "middle"],
    [2, X(3) + 8, Y(0.3) + 4, "start"],
  ],
  [
    [0, X(4) + 8, Y(1.15) + 4, "start"],
    [2, X(4) + 8, Y(0.5) + 4, "start"],
  ],
];

export default function LarPathSteps({ frame = 1 }: { frame?: number }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <svg viewBox="0 0 640 348" fontFamily="system-ui, sans-serif" fontSize="13">
        {/* axes: coefficient scale (left) and the zero line the paths leave from */}
        <line x1="80" y1="44" x2="80" y2="300" stroke="currentColor" strokeWidth="1.5" />
        <line x1="80" y1="300" x2="600" y2="300" stroke="currentColor" strokeWidth="1.5" />
        <text x="72" y="52" textAnchor="end" fill="currentColor" fontSize="13">
          {"βⱼ"}
        </text>
        <text x="72" y="304" textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
          0
        </text>
        <text x="598" y="318" textAnchor="end" fill="currentColor" opacity="0.55" fontSize="12">
          {"‖β‖₁ →"}
        </text>

        {/* event guides, revealed as the path reaches them */}
        {GUIDES.filter((g) => frame >= g.t).map((g) => (
          <g key={g.label}>
            <line
              x1={X(g.t)}
              y1="50"
              x2={X(g.t)}
              y2="300"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.4"
            />
            <text x={X(g.t)} y="44" textAnchor="middle" fill="currentColor" fontSize="11" opacity="0.6">
              {g.label}
            </text>
          </g>
        ))}

        {/* paths: one straight segment per step; the current step is amber */}
        {SERIES.map((s) =>
          s.v.slice(1, frame + 1).map((v, i) => {
            const k = i + 1;
            if (s.v[k - 1] === 0 && v === 0) return null;
            const current = k === frame;
            return (
              <line
                key={`${s.name}${k}`}
                x1={X(k - 1)}
                y1={Y(s.v[k - 1])}
                x2={X(k)}
                y2={Y(v)}
                stroke={current ? ACCENT : "currentColor"}
                strokeWidth={current ? 2.6 : 1.6}
                opacity={current ? 1 : 0.4}
                strokeLinecap="round"
              />
            );
          }),
        )}

        {/* activation dots at the zero line */}
        {DOTS.filter((d) => frame >= d.from).map((d) => (
          <circle
            key={`dot${d.t}`}
            cx={X(d.t)}
            cy={Y(0)}
            r="3.5"
            fill={frame === d.from ? ACCENT : "currentColor"}
            opacity={frame === d.from ? 1 : 0.4}
          />
        ))}
        {/* the drop: an open marker where β₂ crosses zero and leaves */}
        {frame >= 4 && (
          <>
            <circle cx={X(3)} cy={Y(0)} r="4.5" fill="none" stroke={ACCENT} strokeWidth="2" />
            <text x={X(3)} y="318" textAnchor="middle" fill={ACCENT} fontSize="11.5">
              {"β₂ = 0 — dropped"}
            </text>
          </>
        )}

        {/* endpoint labels for the frame's moving coefficients */}
        {LABELS[frame - 1].map(([si, x, y, anchor]) => (
          <text
            key={`lb${si}`}
            x={x}
            y={y}
            textAnchor={anchor}
            fill={ACCENT}
            fontWeight={600}
            fontSize="13"
          >
            {SERIES[si].name}
          </text>
        ))}

        {/* step annotation */}
        <text x="340" y="340" textAnchor="middle" fill="currentColor" fontSize="13">
          <tspan fill={ACCENT} fontWeight={600}>
            {STEP_LABEL[frame - 1]}
          </tspan>
          <tspan opacity="0.75">{" — " + STEP_TEXT[frame - 1]}</tspan>
        </text>
      </svg>
    </div>
  );
}
