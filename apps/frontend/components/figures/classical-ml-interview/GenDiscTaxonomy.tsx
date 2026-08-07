import { Fragment } from "react";
import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * GenDiscTaxonomy — Bishop's §1.5.4 route taxonomy as three stacked pipelines
 * (FIGURE PLAN item 1). One idea: each route down the stack MODELS LESS, so the
 * pipeline gets shorter. All boxes share one height and every lane is
 * left-aligned, so the shrinking right edge is the visual message.
 *
 *   generative  : data → {fit p(x|y), fit p(y)} → Bayes' rule → p(y|x) → decision
 *   discriminative : data → fit p(y|x) directly → decision
 *   discriminant fn: data → fit f:x→label → decision
 *
 * Color role: amber = generative, the chapter's subject (GDA lives here);
 * the other two lanes stay neutral so amber reads as "this is what we study".
 * Inspiration: Bishop PRML §1.5.4 — redrawn, not traced.
 */

const BOX_H = 44;
const NEUTRAL = "rgba(128,128,128,0.5)";
const NEUTRAL_SOFT = "rgba(128,128,128,0.4)";

function Box({
  children,
  accent = false,
}: {
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        height: BOX_H,
        padding: "0 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        border: `1.5px solid ${accent ? ACCENT : NEUTRAL}`,
        borderRadius: 6,
        fontSize: 12.5,
        lineHeight: 1.15,
        textAlign: "center",
        whiteSpace: "nowrap",
        flex: "0 0 auto",
      }}
    >
      {children}
    </div>
  );
}

function Arrow({ accent = false }: { accent?: boolean }) {
  const c = accent ? ACCENT : "currentColor";
  return (
    <svg
      width="24"
      height="12"
      viewBox="0 0 24 12"
      style={{ flex: "0 0 auto", opacity: accent ? 0.85 : 0.55 }}
      aria-hidden="true"
    >
      <line x1="0" y1="6" x2="18" y2="6" stroke={c} strokeWidth="1.5" />
      <path d="M17 2 L23 6 L17 10" fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Badge({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <span
      style={{
        fontSize: 11.5,
        padding: "2px 9px",
        borderRadius: 20,
        border: `1px solid ${highlight ? ACCENT : NEUTRAL_SOFT}`,
        color: highlight ? ACCENT : "inherit",
        background: highlight ? "rgba(226,144,58,0.10)" : "transparent",
        fontWeight: highlight ? 600 : 400,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function LaneLabel({ n, accent = false }: { n: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
      <span
        style={{
          width: 4,
          height: 15,
          borderRadius: 2,
          background: accent ? ACCENT : NEUTRAL,
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 0.2,
          color: accent ? ACCENT : "currentColor",
        }}
      >
        {n}
      </span>
    </div>
  );
}

const dataBox = (
  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
    data <M tex={String.raw`(x,\,y)`} size={12.5} />
  </span>
);

const decisionBox = (
  <Fragment>
    <span>decision</span>
    <span style={{ opacity: 0.6 }}>
      <M tex={String.raw`\hat{y}`} size={11} />
    </span>
  </Fragment>
);

const laneStyle: React.CSSProperties = { marginBottom: 26 };
const pipeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
};
const badgeRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 9,
  flexWrap: "wrap",
};
const rightNote: React.CSSProperties = {
  fontSize: 11.5,
  fontStyle: "italic",
  opacity: 0.6,
  marginLeft: 6,
};

export default function GenDiscTaxonomy() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, color: "currentColor", maxWidth: 860 }}>
      {/* ── Lane 1: generative (the subject) ───────────────────────────── */}
      <div style={laneStyle}>
        <LaneLabel n="generative" accent />
        <div style={pipeStyle}>
          <Box accent>{dataBox}</Box>
          <Arrow accent />
          {/* two-box stage: model the joint via p(x|y) and p(y) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Box accent>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                fit <M tex={String.raw`p(x\mid y)`} size={12.5} />
              </span>
            </Box>
            <Box accent>
              <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
                fit <M tex={String.raw`p(y)`} size={12.5} />
              </span>
            </Box>
          </div>
          <Arrow accent />
          <Box accent>Bayes&rsquo; rule</Box>
          <Arrow accent />
          <Box accent>
            <M tex={String.raw`p(y\mid x)`} size={13} />
          </Box>
          <Arrow accent />
          <Box accent>{decisionBox}</Box>
        </div>
        <div style={badgeRow}>
          <Badge>naive Bayes</Badge>
          <Badge highlight>GDA — this chapter</Badge>
        </div>
      </div>

      {/* ── Lane 2: discriminative ─────────────────────────────────────── */}
      <div style={laneStyle}>
        <LaneLabel n="discriminative" />
        <div style={pipeStyle}>
          <Box>{dataBox}</Box>
          <Arrow />
          <Box>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
              fit <M tex={String.raw`p(y\mid x)`} size={12.5} /> directly
            </span>
          </Box>
          <Arrow />
          <Box>{decisionBox}</Box>
          <span style={rightNote}>
            never models&nbsp;
            <M tex={String.raw`x`} size={11.5} />
          </span>
        </div>
        <div style={badgeRow}>
          <Badge>logistic regression</Badge>
          <Badge>k&#8209;NN</Badge>
        </div>
      </div>

      {/* ── Lane 3: discriminant function ──────────────────────────────── */}
      <div style={laneStyle}>
        <LaneLabel n="discriminant function" />
        <div style={pipeStyle}>
          <Box>{dataBox}</Box>
          <Arrow />
          <Box>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4 }}>
              fit <M tex={String.raw`f\colon x \to \text{label}`} size={12.5} />
            </span>
          </Box>
          <Arrow />
          <Box>{decisionBox}</Box>
          <span style={rightNote}>no probabilities anywhere</span>
        </div>
        <div style={badgeRow}>
          <Badge>perceptron</Badge>
          <Badge>SVM</Badge>
          <Badge>least squares on indicators</Badge>
        </div>
      </div>
    </div>
  );
}
