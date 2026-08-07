import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * KlAsymmetryPanels — direction matters (playbook rule 8: two near-identical
 * panels side by side, joined by a marked connector, the payoff as a tally).
 *
 * Running example (rule 4): the 99/1 coin p = (.99, .01) vs the fair coin
 * q = (.5, .5) over {heads, tails}. Both panels are the SAME two-bar chart;
 * only the ROLES swap.
 *   Left  D(p‖q) = 0.919 bits : blue bars = truth p (99/1), amber outline = model q (fair)
 *   Right D(q‖p) = 2.329 bits : blue bars = truth q (fair), amber outline = model p (99/1)
 * Color binds to ROLE, not to a fixed distribution: blue = whichever coin is
 * real in that panel, amber = the model. Between the panels, a bold two-headed
 * arrow broken by a ≠, labeled D(p‖q) ≠ D(q‖p).
 *
 * One idea: swapping which distribution is real changes the number.
 */

// chart geometry ------------------------------------------------------------
const VB_W = 210;
const VB_H = 170;
const AXIS_X = 30;
const BASELINE = 138;
const TOP_Y = 10;
const PLOT_H = BASELINE - TOP_Y; // prob 1 .. 0
const HEADS_CX = 80;
const TAILS_CX = 160;
const BLUE_W = 44;
const AMBER_W = 62;

const yOf = (p: number) => BASELINE - p * PLOT_H;

function Bars({
  truth,
  model,
}: {
  truth: [number, number]; // blue, filled — the real distribution
  model: [number, number]; // amber, outline — the model
}) {
  const cats: Array<[number, number]> = [
    [HEADS_CX, 0],
    [TAILS_CX, 1],
  ];
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="210"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {/* fair-coin reference gridline at p = 0.5 */}
      <line
        x1={AXIS_X}
        y1={yOf(0.5)}
        x2={VB_W - 6}
        y2={yOf(0.5)}
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        strokeOpacity="0.25"
      />
      <text
        x={VB_W - 4}
        y={yOf(0.5) - 3}
        textAnchor="end"
        fontSize="8.5"
        fill="currentColor"
        opacity="0.4"
      >
        ½
      </text>

      {/* y axis with 0 / 1 ticks */}
      <line
        x1={AXIS_X}
        y1={TOP_Y}
        x2={AXIS_X}
        y2={BASELINE}
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.45"
      />
      {[0, 1].map((p) => (
        <g key={`yt${p}`}>
          <line
            x1={AXIS_X - 4}
            y1={yOf(p)}
            x2={AXIS_X}
            y2={yOf(p)}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.45"
          />
          <text
            x={AXIS_X - 7}
            y={yOf(p) + 3.5}
            textAnchor="end"
            fontSize="9"
            fill="currentColor"
            opacity="0.55"
          >
            {p}
          </text>
        </g>
      ))}

      {/* baseline */}
      <line
        x1={AXIS_X}
        y1={BASELINE}
        x2={VB_W - 6}
        y2={BASELINE}
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.45"
      />

      {cats.map(([cx, idx]) => {
        const tp = truth[idx];
        const mp = model[idx];
        return (
          <g key={cx}>
            {/* blue filled bar = truth */}
            <rect
              x={cx - BLUE_W / 2}
              y={yOf(tp)}
              width={BLUE_W}
              height={BASELINE - yOf(tp)}
              fill={SUPPORT}
              opacity="0.9"
            />
            {/* amber outline bracket = model (drawn wider so its top edge
                stays visible whether it is taller or shorter than the bar) */}
            <rect
              x={cx - AMBER_W / 2}
              y={yOf(mp)}
              width={AMBER_W}
              height={BASELINE - yOf(mp)}
              fill="none"
              stroke={ACCENT}
              strokeWidth="2"
            />
            {/* category label */}
            <text
              x={cx}
              y={BASELINE + 14}
              textAnchor="middle"
              fontSize="10.5"
              fill="currentColor"
              opacity="0.7"
            >
              {idx === 0 ? "heads" : "tails"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Swatch({ kind }: { kind: "truth" | "model" }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 12,
        height: 12,
        flex: "none",
        borderRadius: 2,
        background: kind === "truth" ? SUPPORT : "transparent",
        border: kind === "model" ? `2px solid ${ACCENT}` : "none",
        opacity: kind === "truth" ? 0.9 : 1,
      }}
    />
  );
}

function Panel({
  headerTex,
  truth,
  model,
  truthLabel,
  modelLabel,
  gloss,
}: {
  headerTex: string;
  truth: [number, number];
  model: [number, number];
  truthLabel: string;
  modelLabel: string;
  gloss: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        maxWidth: 236,
      }}
    >
      <div style={{ fontWeight: 700 }}>
        <M tex={headerTex} size={15} />
      </div>
      <Bars truth={truth} model={model} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          alignSelf: "start",
          paddingLeft: 24,
          fontSize: 12.5,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Swatch kind="truth" />
          <span style={{ color: SUPPORT, fontWeight: 600 }}>{truthLabel}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Swatch kind="model" />
          <span style={{ color: ACCENT, fontWeight: 600 }}>{modelLabel}</span>
        </span>
      </div>
      <div
        style={{
          fontStyle: "italic",
          opacity: 0.6,
          fontSize: 12.5,
          textAlign: "center",
          lineHeight: 1.35,
        }}
      >
        {gloss}
      </div>
    </div>
  );
}

function Connector() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        alignSelf: "center",
      }}
    >
      <svg viewBox="0 0 96 30" width="96" aria-hidden="true">
        <defs>
          <marker
            id="kap-arrow"
            markerWidth="7"
            markerHeight="7"
            refX="5.5"
            refY="3.5"
            orient="auto"
          >
            <path d="M1 1 L6 3.5 L1 6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </marker>
        </defs>
        {/* two-headed arrow, broken by the ≠ glyph in the gap */}
        <line
          x1="38"
          y1="15"
          x2="9"
          y2="15"
          stroke="currentColor"
          strokeWidth="3"
          markerEnd="url(#kap-arrow)"
        />
        <line
          x1="58"
          y1="15"
          x2="87"
          y2="15"
          stroke="currentColor"
          strokeWidth="3"
          markerEnd="url(#kap-arrow)"
        />
        <text
          x="48"
          y="22"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="currentColor"
        >
          ≠
        </text>
      </svg>
      <div style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
        <M
          tex={String.raw`D(p \parallel q) \neq D(q \parallel p)`}
          size={13}
        />
      </div>
    </div>
  );
}

export default function KlAsymmetryPanels() {
  const P = String.raw`\textcolor{${SUPPORT}}{p}`;
  const Q = String.raw`\textcolor{${ACCENT}}{q}`;
  const Pm = String.raw`\textcolor{${ACCENT}}{p}`;
  const Qt = String.raw`\textcolor{${SUPPORT}}{q}`;
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 640,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      <Panel
        headerTex={String.raw`D(${P} \parallel ${Q}) = 0.919 \text{ bits}`}
        truth={[0.99, 0.01]}
        model={[0.5, 0.5]}
        truthLabel="truth p: 99/1"
        modelLabel="model q: fair"
        gloss="fair code on 99/1 data"
      />
      <Connector />
      <Panel
        headerTex={String.raw`D(${Qt} \parallel ${Pm}) = 2.329 \text{ bits}`}
        truth={[0.5, 0.5]}
        model={[0.99, 0.01]}
        truthLabel="truth q: fair"
        modelLabel="model p: 99/1"
        gloss="99/1 code on fair data — the 6.6-bit codeword fires half the time"
      />
    </div>
  );
}
