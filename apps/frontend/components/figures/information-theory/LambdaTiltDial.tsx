import { ACCENT, labelMuted } from "../palette";

/**
 * LambdaTiltDial — the Lagrange multiplier as a tilt dial, static twin of the
 * MaxEntDice demo. Three six-face dice pmfs side by side on identical axes,
 * all amber bars:
 *   left   λ = +0.371  bars falling  ⟨i⟩ = 2.5  H = 2.328 bits
 *   middle λ = 0        flat 1/6      ⟨i⟩ = 3.5  H = 2.585 bits (max)
 *   right  λ = -0.371  bars rising   ⟨i⟩ = 4.5  H = 2.328 bits
 * A horizontal λ-axis above binds each panel to its multiplier via ticks
 * (+0.371, 0, -0.371); a payoff line below states the takeaway.
 *
 * One idea: turning the multiplier either way buys constraint satisfaction
 * (a shifted mean) at the cost of entropy — symmetrically about λ = 0.
 *
 * Colors: amber = the distribution (bars, the subject); currentColor = axes,
 * ticks and labels (survives both themes).
 */

const W = 620;
const H = 322;

// three panels
const X0 = [30, 225, 420];
const PANELW = 180;
const CENTER = X0.map((x) => x + PANELW / 2); // 120, 315, 510

// vertical geometry
const PTOP = 96; // top reachable by tallest bar
const PBOT = 250; // baseline
const YMAX = 0.36;

// bars
const NBARS = 6;
const SLOTW = PANELW / NBARS; // 30
const BARW = 20;

const FALLING = [0.347, 0.24, 0.165, 0.114, 0.079, 0.054];
const RISING = [0.054, 0.079, 0.114, 0.165, 0.24, 0.347];
const FLAT = Array(6).fill(1 / 6);

type Panel = {
  vals: number[];
  lambda: string;
  mean: string;
  h: string;
  max?: boolean;
};

const PANELS: Panel[] = [
  { vals: FALLING, lambda: "+0.371", mean: "2.5", h: "2.328 bits" },
  { vals: FLAT, lambda: "0", mean: "3.5", h: "2.585 bits", max: true },
  { vals: RISING, lambda: "−0.371", mean: "4.5", h: "2.328 bits" },
];

const AXY = 44; // λ-axis line y
const barCx = (p: number, i: number) => X0[p] + (i + 0.5) * SLOTW;
const yPx = (v: number) => PBOT - (v / YMAX) * (PBOT - PTOP);

export default function LambdaTiltDial() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: W }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <marker
            id="ltd-arrow"
            markerWidth="9"
            markerHeight="9"
            refX="5"
            refY="4.5"
            orient="auto"
          >
            <path d="M1 1 L6 4.5 L1 8" fill="none" stroke="currentColor" strokeWidth="1.3" />
          </marker>
        </defs>

        {/* ── λ-axis: double-headed arrow with ticks bound to panel centres ── */}
        <line
          x1={CENTER[0] - 30}
          y1={AXY}
          x2={CENTER[2] + 30}
          y2={AXY}
          stroke="currentColor"
          strokeOpacity="0.6"
          strokeWidth="1.2"
          markerStart="url(#ltd-arrow)"
          markerEnd="url(#ltd-arrow)"
        />
        <text x={CENTER[2] + 44} y={AXY + 4} fontSize="14" fontStyle="italic" fill="currentColor" opacity="0.75">
          λ
        </text>

        {PANELS.map((panel, p) => (
          <g key={`ax${p}`}>
            {/* tick on the λ-axis */}
            <line
              x1={CENTER[p]}
              y1={AXY - 5}
              x2={CENTER[p]}
              y2={AXY + 5}
              stroke="currentColor"
              strokeOpacity="0.6"
              strokeWidth="1.2"
            />
            <text
              x={CENTER[p]}
              y={AXY - 10}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="currentColor"
              opacity="0.75"
            >
              {panel.lambda}
            </text>
            {/* drop guide binding the tick to its panel */}
            <line
              x1={CENTER[p]}
              y1={AXY + 8}
              x2={CENTER[p]}
              y2={PTOP - 8}
              stroke="currentColor"
              strokeOpacity="0.22"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          </g>
        ))}

        {/* ── the three panels ── */}
        {PANELS.map((panel, p) => (
          <g key={`p${p}`}>
            {/* bars */}
            {panel.vals.map((v, i) => {
              const top = yPx(v);
              return (
                <rect
                  key={`b${p}-${i}`}
                  x={barCx(p, i) - BARW / 2}
                  y={top}
                  width={BARW}
                  height={PBOT - top}
                  fill={ACCENT}
                  opacity="0.9"
                  rx="2"
                />
              );
            })}

            {/* baseline */}
            <line
              x1={X0[p]}
              y1={PBOT}
              x2={X0[p] + PANELW}
              y2={PBOT}
              stroke="currentColor"
              strokeOpacity="0.45"
              strokeWidth="1"
            />

            {/* die faces 1..6 */}
            {panel.vals.map((_, i) => (
              <text
                key={`f${p}-${i}`}
                x={barCx(p, i)}
                y={PBOT + 15}
                textAnchor="middle"
                fontSize="10.5"
                fill="currentColor"
                opacity="0.5"
              >
                {i + 1}
              </text>
            ))}

            {/* panel labels: mean, then entropy */}
            <text
              x={CENTER[p]}
              y={PBOT + 40}
              textAnchor="middle"
              fontSize="13"
              fill="currentColor"
              opacity="0.8"
            >
              {`⟨i⟩ = ${panel.mean}`}
            </text>
            <text
              x={CENTER[p]}
              y={PBOT + 60}
              textAnchor="middle"
              fontSize="13"
              fontWeight={panel.max ? 700 : 600}
              fill="currentColor"
              opacity={panel.max ? 0.95 : 0.75}
            >
              {panel.max ? `H = ${panel.h} (max)` : `H = ${panel.h}`}
            </text>
          </g>
        ))}
      </svg>

      {/* payoff line — flowing HTML text, not squeezed into the SVG */}
      <div style={{ ...labelMuted, marginTop: 6, maxWidth: W, lineHeight: 1.4 }}>
        Entropy is maximal at <span style={{ fontWeight: 600, opacity: 0.85 }}>λ = 0</span> and drops as the
        constraint bites — symmetrically in the tilt direction.
      </div>
    </div>
  );
}
