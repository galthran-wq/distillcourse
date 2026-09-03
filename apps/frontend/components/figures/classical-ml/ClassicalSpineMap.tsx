import { ACCENT } from "../palette";

/**
 * ClassicalSpineMap — the course's closing map (FIGURE PLAN "the course's
 * closing map" for the `tabular-showdown` lesson): the eleven spine steps of
 * course.yaml as one left-to-right strip, each panel carrying the step's own
 * label and, beneath it, the one clause it contributed to the course's single
 * question — why does a finite sample guarantee anything?
 *
 * One idea: the eleven modules are one sentence, read left to right, and the
 * last one is where that sentence is still being tested — which is what this
 * lesson measured.
 *
 * Color roles (one hue + currentColor):
 *   currentColor = the ten settled steps
 *   amber        = the arrow that assembles the answer, the eleventh step
 *                  (the living frontier), and the tabular verdict it closes on
 */

const NEUTRAL = "rgba(128,128,128,0.5)";
const FILL = "color-mix(in srgb, currentColor 4%, transparent)";
const ACCENT_FILL = `color-mix(in srgb, ${ACCENT} 13%, transparent)`;

// ── strip geometry: ten equal steps, then the wider open one ───────────────
const STEP_W = 65;
const LAST_W = 102;
const GAP = 4;
const TOTAL = 10 * STEP_W + LAST_W + 10 * GAP; // 792 — fits the 800px body
const VERDICT_W = 330;

type Step = { n: number; label: string; answer: string };

// A 65px panel is narrower than several of the spine's own words, and the
// labels are course.yaml's verbatim: soft hyphens (only ever rendered when the
// line actually has to break) keep them inside their borders.
const S = "­";

const STEPS: Step[] = [
  { n: 1, label: "Fitting is not learning", answer: "risk, not training error" },
  { n: 2, label: `Esti${S}mation is like${S}lihood`, answer: `the like${S}lihood floor` },
  {
    n: 3,
    label: `The linear model as pro${S}jection`,
    answer: `penalties price flexi${S}bility`,
  },
  { n: 4, label: "Three roads to a boundary", answer: "three biases, one boundary" },
  {
    n: 5,
    label: `Measure${S}ment is part of the method`,
    answer: `honest measure${S}ment`,
  },
  {
    n: 6,
    label: `Local and recur${S}sive models`,
    answer: `flexi${S}bility's variance bill`,
  },
  { n: 7, label: `The ensemble reso${S}lution`, answer: "averaging pays it" },
  { n: 8, label: `Struc${S}ture without labels`, answer: `struc${S}ture needs no labels` },
  { n: 9, label: "Why it works", answer: `capacity buys guaran${S}tees` },
  {
    n: 10,
    label: `Predic${S}tions with guaran${S}tees`,
    answer: `uncer${S}tainty with coverage`,
  },
  { n: 11, label: "Where the classical story breaks", answer: "and where it breaks" },
];

function Badge({ n, open }: { n: number; open: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 16,
        height: 16,
        padding: "0 4px",
        boxSizing: "border-box",
        borderRadius: 999,
        border: `1.2px solid ${open ? ACCENT : NEUTRAL}`,
        color: open ? ACCENT : "currentColor",
        fontSize: 9.5,
        fontWeight: 600,
        lineHeight: 1,
        opacity: open ? 1 : 0.8,
      }}
    >
      {n}
    </span>
  );
}

/**
 * One panel is four grid cells in the same column — frame, badge, label,
 * answer — so the three bands align across all eleven panels whatever the
 * longest label costs in lines. A per-panel flex column cannot do that: its
 * divider sits wherever its own label ends.
 */
function panelCells(step: Step, col: number) {
  const open = step.n === 11;
  const ink = open ? ACCENT : "currentColor";
  return [
    <div
      key={`frame-${step.n}`}
      aria-hidden="true"
      style={{
        gridColumn: col,
        gridRow: "1 / 4",
        alignSelf: "stretch",
        border: `${open ? 1.6 : 1.2}px solid ${open ? ACCENT : NEUTRAL}`,
        borderRadius: 7,
        background: open ? ACCENT_FILL : FILL,
      }}
    />,
    <div
      key={`badge-${step.n}`}
      style={{ gridColumn: col, gridRow: 1, padding: "8px 4px 6px", textAlign: "center" }}
    >
      <Badge n={step.n} open={open} />
    </div>,
    <div
      key={`label-${step.n}`}
      style={{
        gridColumn: col,
        gridRow: 2,
        alignSelf: "stretch",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 4px 7px",
        textAlign: "center",
        fontSize: 9.5,
        fontWeight: 600,
        lineHeight: 1.28,
        color: ink,
        overflowWrap: "break-word",
      }}
    >
      {step.label}
    </div>,
    <div
      key={`answer-${step.n}`}
      style={{ gridColumn: col, gridRow: 3, padding: "0 4px 9px", textAlign: "center" }}
    >
      <div
        style={{
          width: "82%",
          margin: "0 auto 6px",
          borderTop: `1px solid ${open ? ACCENT : NEUTRAL}`,
          opacity: open ? 0.55 : 0.75,
        }}
      />
      <div
        style={{
          fontSize: 9,
          lineHeight: 1.3,
          fontStyle: "italic",
          opacity: open ? 0.95 : 0.62,
          color: ink,
          overflowWrap: "break-word",
        }}
      >
        {step.answer}
      </div>
    </div>,
  ];
}

export default function ClassicalSpineMap() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "currentColor",
        width: TOTAL,
        maxWidth: "100%",
      }}
    >
      {/* ── the question the whole strip answers ── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, paddingBottom: 7 }}>
        <span
          style={{
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: 0.5,
            whiteSpace: "nowrap",
          }}
        >
          the one question
        </span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          why does a model fitted to a finite sample say anything about data it has never seen?
        </span>
      </div>

      {/* ── the answer, assembled left to right ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8 }}>
        <span style={{ fontSize: 10, fontStyle: "italic", color: ACCENT, whiteSpace: "nowrap" }}>
          the answer, one clause per module
        </span>
        <div style={{ flex: 1, borderTop: `1.4px solid ${ACCENT}`, opacity: 0.85 }} />
        <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true" style={{ marginLeft: -8 }}>
          <path
            d="M1 1 L7.6 5 L1 9"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* ── the eleven steps ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(10, ${STEP_W}px) ${LAST_W}px`,
          gridTemplateRows: "auto auto auto",
          columnGap: GAP,
          alignItems: "start",
        }}
      >
        {STEPS.flatMap((s, i) => panelCells(s, i + 1))}
      </div>

      {/* ── the colour's meaning on the left, what the open step closes on
             hung under it on the right ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 12 }}>
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: 3,
              background: ACCENT,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11.5, opacity: 0.78 }}>
            the one step still open &mdash; the frontier this lesson measured
          </span>
        </div>
        <div style={{ width: VERDICT_W, flexShrink: 0 }}>
          {/* the tie descends from the centre of step 11, not of the box */}
          <svg width={VERDICT_W} height="22" viewBox={`0 0 ${VERDICT_W} 22`} aria-hidden="true">
            <line
              x1={VERDICT_W - LAST_W / 2}
              y1="0"
              x2={VERDICT_W - LAST_W / 2}
              y2="18"
              stroke={ACCENT}
              strokeWidth="1.4"
              opacity="0.85"
            />
            <path
              d={`M ${VERDICT_W - LAST_W / 2 - 3.2} 13.6 L ${VERDICT_W - LAST_W / 2} 18 L ${VERDICT_W - LAST_W / 2 + 3.2} 13.6`}
              fill="none"
              stroke={ACCENT}
              strokeWidth="1.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
          <div
            style={{
              boxSizing: "border-box",
              padding: "9px 11px",
              border: `1.6px solid ${ACCENT}`,
              borderRadius: 7,
              background: ACCENT_FILL,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                opacity: 0.75,
                color: ACCENT,
                paddingBottom: 3,
              }}
            >
              the tabular verdict
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.35 }}>
              on tables, the <b>classical ensemble still wins</b> &mdash; for&nbsp;stated reasons
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
