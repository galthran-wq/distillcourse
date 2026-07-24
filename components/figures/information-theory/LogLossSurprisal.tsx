import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * Log-loss IS the surprisal curve. Two panels share one layout and plot the
 * identical curve y = -log2 x on (0, 1]. Left ("surprisal, lesson 1"): blue,
 * the true probability p on the x-axis, a dot at the coin flip (0.5, 1 bit) —
 * the same curve and same landmark as the what-is-surprise lesson. Right
 * ("log-loss, this lesson"): amber, the model's probability q substituted for
 * p, a dot at the cat example (0.7, 0.51 bits). A bold "=" between them makes
 * the one idea explicit: the loss is the surprisal curve with q in place of p.
 * Colors: blue = the truth's probability (lesson-1 role), amber = the model.
 */

// shared plot frame: x in [0,1] -> [X0,X1]; v bits in [0,5] -> [Y0,YTOP].
const X0 = 54;
const X1 = 250;
const Y0 = 210;
const YTOP = 30;
const X = (x: number) => X0 + x * (X1 - X0);
const Y = (v: number) => Y0 - (v * (Y0 - YTOP)) / 5;

// curve I(x) = -log2 x, sampled where it stays within the 5-bit window
// (x >= 2^-5 = 0.03125, so the curve enters at the top-left corner).
const XMIN = 0.03125;
const N = 200;
const curvePath = Array.from({ length: N + 1 }, (_, i) => {
  const x = XMIN + (i / N) * (1 - XMIN);
  const v = -Math.log2(x);
  return `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(v).toFixed(1)}`;
}).join(" ");

const yTicks = [0, 1, 2, 3, 4, 5];
const xTicks: { x: number; t: string }[] = [
  { x: 0, t: "0" },
  { x: 0.5, t: "0.5" },
  { x: 1, t: "1" },
];

type Dot = {
  x: number;
  v: number;
  line1: string;
  line2: string;
};

function Plot({ color, dot }: { color: string; dot: Dot }) {
  const dx = X(dot.x);
  const dy = Y(dot.v);
  return (
    <svg viewBox="0 0 300 240" fontFamily="system-ui, sans-serif" fontSize="12" style={{ width: "100%" }}>
      {/* axes */}
      <line x1={X0} y1={Y0} x2={X1 + 8} y2={Y0} stroke="currentColor" strokeWidth="1.4" />
      <line x1={X0} y1={Y0} x2={X0} y2={YTOP - 6} stroke="currentColor" strokeWidth="1.4" />

      {/* y ticks (bits) */}
      {yTicks.map((v) => (
        <g key={`y${v}`}>
          <line x1={X0 - 5} y1={Y(v)} x2={X0} y2={Y(v)} stroke="currentColor" strokeWidth="1" />
          <text x={X0 - 9} y={Y(v) + 4} textAnchor="end" fill="currentColor" opacity="0.55">
            {v}
          </text>
        </g>
      ))}
      <text x={X0 - 30} y={YTOP - 12} fill="currentColor" opacity="0.55">
        bits
      </text>

      {/* x ticks (probability) */}
      {xTicks.map(({ x, t }) => (
        <g key={`x${t}`}>
          <line x1={X(x)} y1={Y0} x2={X(x)} y2={Y0 + 5} stroke="currentColor" strokeWidth="1" />
          <text x={X(x)} y={Y0 + 18} textAnchor="middle" fill="currentColor" opacity="0.55">
            {t}
          </text>
        </g>
      ))}

      {/* dashed coordinate guides to the marked point */}
      <path
        d={`M${dx} ${Y0} L${dx} ${dy} L${X0} ${dy}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.5"
      />

      {/* the curve y = -log2 x */}
      <path d={curvePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />

      {/* marked point + its label */}
      <circle cx={dx} cy={dy} r="4" fill={color} />
      <text x={dx + 11} y={dy - 16} fill={color} fontWeight="600">
        {dot.line1}
      </text>
      <text x={dx + 11} y={dy - 2} fill={color} fontWeight="600">
        {dot.line2}
      </text>
    </svg>
  );
}

function Panel({
  color,
  header,
  yLabel,
  xLabelMath,
  xLabelText,
  dot,
}: {
  color: string;
  header: string;
  yLabel: string;
  xLabelMath: string;
  xLabelText: string;
  dot: Dot;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 300px", minWidth: 260 }}>
      <div style={{ fontWeight: 600, color, marginBottom: 6 }}>{header}</div>
      <div style={{ alignSelf: "flex-start", paddingLeft: 20, marginBottom: 2 }}>
        <M tex={yLabel} size={13} color={color} />
      </div>
      <Plot color={color} dot={dot} />
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4, fontSize: 12.5 }}>
        <M tex={xLabelMath} size={13} color={color} />
        <span style={{ opacity: 0.55 }}>{xLabelText}</span>
      </div>
    </div>
  );
}

export default function LogLossSurprisal() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 820, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <Panel
          color={SUPPORT}
          header="surprisal (lesson 1)"
          yLabel={String.raw`I(x) = -\log_2 p(x)`}
          xLabelMath={String.raw`p(x)`}
          xLabelText="— the true probability of the event"
          dot={{ x: 0.5, v: 1, line1: "coin flip:", line2: "1 bit" }}
        />

        {/* the identity: same curve, q substituted for p */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: "0 0 96px",
            alignSelf: "center",
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>=</div>
          <div style={{ fontSize: 11, opacity: 0.55, textAlign: "center", marginTop: 8, lineHeight: 1.3 }}>
            same curve, model&rsquo;s probability substituted
          </div>
        </div>

        <Panel
          color={ACCENT}
          header="log-loss (this lesson)"
          yLabel={String.raw`\ell = -\log_2 q(x_{\text{true}})`}
          xLabelMath={String.raw`q(x_{\text{true}})`}
          xLabelText="— the model's probability of the truth"
          dot={{ x: 0.7, v: -Math.log2(0.7), line1: "cat example:", line2: "0.51 bits" }}
        />
      </div>
    </div>
  );
}
