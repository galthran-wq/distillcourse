import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * ContrastiveLineup — the InfoNCE contrastive setup as one diagram: mutual
 * information estimation posed as an N-way classification over samples
 * (schematic recreation of the CPC §2.2–2.3 setup, van den Oord et al. 2018;
 * redrawn, not copied).
 *
 * A context x (currentColor structure) fans a score f(x, y_j) to each of N = 4
 * candidate cards. One card (y_2, amber) is the TRUE partner drawn from
 * p(y | x); the other three (blue) are NEGATIVES drawn from the marginal p(y)
 * by shuffling. The four scores feed a softmax whose weights are drawn as a
 * vertical bar stack; the loss is minus the log2 weight the classifier put on
 * the true partner.
 *
 * Color roles (playbook rule 1): amber = the positive (subject), blue = the
 * negatives, currentColor = structure.
 */

const W = 740;
const H = 420;

// --- geometry ---------------------------------------------------------------
const FAN = { x: 116, y: 178 }; // fan origin: right-center of the x box

const CARD = { left: 316, width: 254, height: 54, gap: 16 };
const cardTop = (i: number) => 44 + i * (CARD.height + CARD.gap);
const cardMidY = (i: number) => cardTop(i) + CARD.height / 2; // 71, 141, 211, 281
const CARD_ENTRY_X = CARD.left - 2;

// candidates, top to bottom; index 1 (y_2) is the positive
const CANDS = [
  { label: "y_1", positive: false },
  { label: "y_2", positive: true },
  { label: "y_3", positive: false },
  { label: "y_4", positive: false },
];

// softmax weights (an optimal critic concentrates weight on the true partner)
const WEIGHTS = [0.12, 0.62, 0.14, 0.12];
const BAR = { x: 602, width: 40, top: 66, height: 208 };
const barSeg = (i: number) => {
  const above = WEIGHTS.slice(0, i).reduce((a, w) => a + w, 0);
  const y = BAR.top + above * BAR.height;
  return { y, h: WEIGHTS[i] * BAR.height };
};
const amberSeg = barSeg(1);
const amberMidY = amberSeg.y + amberSeg.h / 2;

// f(x, y_j) label anchors: a point partway along each fan arrow
const labelAnchor = (i: number) => {
  const t = 0.66;
  return { x: FAN.x + t * (CARD_ENTRY_X - FAN.x), y: FAN.y + t * (cardMidY(i) - FAN.y) };
};

export default function ContrastiveLineup() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: W,
      }}
    >
      {/* ---- SVG layer: fan arrows, softmax bar, tie line ---- */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <marker id="cl-tip" markerWidth="7" markerHeight="7" refX="5.4" refY="3" orient="auto">
            <path d="M1 1 L5.6 3 L1 5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </marker>
        </defs>

        {/* fan of four thin arrows (fan = relates-to-each) */}
        {CANDS.map((c, i) => (
          <line
            key={`fan${i}`}
            x1={FAN.x}
            y1={FAN.y}
            x2={CARD_ENTRY_X}
            y2={cardMidY(i)}
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.5"
            markerEnd="url(#cl-tip)"
          />
        ))}

        {/* softmax bar stack: heights = softmax weights */}
        {WEIGHTS.map((w, i) => {
          const s = barSeg(i);
          const fill = CANDS[i].positive ? ACCENT : SUPPORT;
          return (
            <rect
              key={`bar${i}`}
              x={BAR.x}
              y={s.y}
              width={BAR.width}
              height={s.h}
              fill={fill}
              fillOpacity={CANDS[i].positive ? 0.9 : 0.55}
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="0.75"
            />
          );
        })}

        {/* thin line tying the amber segment to the formula's amber term */}
        <path
          d={`M ${BAR.x} ${amberMidY} C 604 250, 600 350, 372 366`}
          fill="none"
          stroke={ACCENT}
          strokeWidth="1"
          strokeOpacity="0.65"
          strokeDasharray="3 3"
        />
      </svg>

      {/* ---- context x box (structure = currentColor) ---- */}
      <div
        style={{
          position: "absolute",
          left: 14,
          top: FAN.y - 30,
          width: 96,
          height: 60,
          border: "1.6px solid currentColor",
          borderRadius: 9,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.65 }}>context</span>
        <M tex={String.raw`x`} size={20} />
      </div>

      {/* ---- f(x, y_j) arrow labels ---- */}
      {CANDS.map((c, i) => {
        const p = labelAnchor(i);
        return (
          <div
            key={`flab${i}`}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y - 11,
              transform: "translate(-50%, -50%)",
              fontSize: 11,
              padding: "0 2px",
              whiteSpace: "nowrap",
            }}
          >
            <M tex={String.raw`f(x,\, ${c.label})`} size={11.5} />
          </div>
        );
      })}

      {/* ---- candidate cards ---- */}
      {CANDS.map((c, i) => {
        const color = c.positive ? ACCENT : SUPPORT;
        return (
          <div
            key={`card${i}`}
            style={{
              position: "absolute",
              left: CARD.left,
              top: cardTop(i),
              width: CARD.width,
              height: CARD.height,
              border: `${c.positive ? 1.7 : 1.4}px solid ${color}`,
              borderRadius: 7,
              background: c.positive ? "rgba(226,144,58,0.10)" : "rgba(76,141,214,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 14px",
              boxSizing: "border-box",
            }}
          >
            <span style={{ color, fontWeight: 700, fontSize: 17 }}>
              <M tex={c.label} size={17} color={color} />
            </span>
            {c.positive && (
              <span style={{ color: ACCENT, fontSize: 11.5, lineHeight: 1.25 }}>
                <b>true partner</b>: drawn from{" "}
                <span style={{ whiteSpace: "nowrap" }}>
                  <M tex={String.raw`p(y\mid x)`} size={11.5} />
                </span>
              </span>
            )}
          </div>
        );
      })}

      {/* ---- shared negatives tag (blue, one tag for the three) ---- */}
      <div
        style={{
          position: "absolute",
          left: CARD.left,
          top: cardTop(3) + CARD.height + 8,
          width: CARD.width,
          textAlign: "center",
          color: SUPPORT,
          fontSize: 12,
          lineHeight: 1.3,
        }}
      >
        <b>negatives</b> (<M tex={String.raw`y_1, y_3, y_4`} size={12} color={SUPPORT} />): drawn from{" "}
        <M tex={String.raw`p(y)`} size={12} color={SUPPORT} /> by shuffling
      </div>

      {/* ---- softmax header + note near the classifier ---- */}
      <div
        style={{
          position: "absolute",
          left: BAR.x + BAR.width / 2 - 62,
          top: 36,
          width: 124,
          textAlign: "center",
          fontSize: 12,
          fontWeight: 600,
          opacity: 0.85,
        }}
      >
        softmax over scores
      </div>
      <div
        style={{
          position: "absolute",
          left: 452,
          top: 8,
          width: 232,
          textAlign: "center",
          fontSize: 10.5,
          fontStyle: "italic",
          opacity: 0.55,
        }}
      >
        (position unknown to the classifier)
      </div>

      {/* per-segment weight readouts */}
      {WEIGHTS.map((w, i) => {
        const s = barSeg(i);
        const positive = CANDS[i].positive;
        return (
          <div
            key={`wt${i}`}
            style={{
              position: "absolute",
              left: BAR.x + BAR.width + 6,
              top: s.y + s.h / 2 - 8,
              fontSize: 11,
              fontWeight: positive ? 700 : 400,
              color: positive ? ACCENT : SUPPORT,
              opacity: positive ? 1 : 0.75,
            }}
          >
            {w.toFixed(2)}
          </div>
        );
      })}

      {/* ---- loss formula, amber term tied to the amber segment ---- */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 356,
          width: 480,
          textAlign: "center",
          fontSize: 17,
        }}
      >
        <M
          display
          tex={String.raw`\mathcal{L}_N \;=\; -\log_2 \underbrace{\textcolor{${ACCENT}}{p_{\text{true}}}}_{\text{softmax weight on the true partner}}`}
        />
      </div>
    </div>
  );
}
