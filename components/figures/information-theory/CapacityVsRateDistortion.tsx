import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * CapacityVsRateDistortion — capacity and the rate-distortion function are the
 * two extreme points of the SAME mutual information I(X; ·) (playbook rule 8:
 * two near-identical panels joined by a marked connector; recreation of Cover &
 * Thomas fig. 1.2, redrawn in house style).
 *
 * Both panels are the same three-node pipeline  input -> box -> output. Color
 * binds to ROLE, not to a fixed object:
 *   amber       = the object we are free to TUNE, and the words that change
 *   currentColor= the object that is FIXED
 * Left  (communicate): channel p(y|x) is fixed, the input p(x) is free -> push
 *   information through; C = max I. Right (compress): the source p(x) is fixed,
 *   the test channel p(x̂|x) is free -> withhold information within a budget;
 *   R(D) = min I. Only max/min, Y/X̂, and which block is amber differ.
 *
 * One idea: capacity and R(D) are the max and min extremes of one quantity, I.
 */

const MUTED = "rgba(128,128,128,0.85)";

function Arrow() {
  return (
    <svg viewBox="0 0 30 16" width="30" height="16" aria-hidden="true" style={{ flex: "none" }}>
      <defs>
        <marker
          id="cvrd-head"
          markerWidth="7"
          markerHeight="7"
          refX="5.5"
          refY="3.5"
          orient="auto"
        >
          <path d="M1 1 L6 3.5 L1 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </marker>
      </defs>
      <line
        x1="2"
        y1="8"
        x2="24"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.7"
        markerEnd="url(#cvrd-head)"
      />
    </svg>
  );
}

function Tag({ text, tuned }: { text: string; tuned: boolean }) {
  return (
    <span
      style={{
        fontStyle: "italic",
        fontSize: 11,
        color: tuned ? ACCENT : MUTED,
        fontWeight: tuned ? 600 : 400,
      }}
    >
      {text}
    </span>
  );
}

function Node({ tex, tag, tuned }: { tex: string; tag: string; tuned: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: "none" }}>
      <M tex={tex} size={15} />
      <Tag text={tag} tuned={tuned} />
    </div>
  );
}

function Box({ tex, tuned }: { tex: string; tuned: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: "none" }}>
      <div
        style={{
          border: `${tuned ? 2 : 1.4}px solid ${tuned ? ACCENT : "currentColor"}`,
          borderRadius: 6,
          padding: "7px 9px",
          opacity: tuned ? 1 : 0.75,
          whiteSpace: "nowrap",
        }}
      >
        <M tex={tex} size={12.5} />
      </div>
      <Tag text={tuned ? "free" : "fixed"} tuned={tuned} />
    </div>
  );
}

function Panel({
  header,
  formulaTex,
  constraintTex,
  inputTex,
  inputTuned,
  boxTex,
  boxTuned,
  outputTex,
  gloss,
}: {
  header: string;
  formulaTex: string;
  constraintTex?: string;
  inputTex: string;
  inputTuned: boolean;
  boxTex: string;
  boxTuned: boolean;
  outputTex: string;
  gloss: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        maxWidth: 260,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13.5, textAlign: "center" }}>{header}</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <M display tex={formulaTex} />
        <span
          style={{
            opacity: 0.62,
            fontSize: 12,
            visibility: constraintTex ? "visible" : "hidden",
          }}
        >
          subject to <M tex={constraintTex ?? String.raw`\mathbb{E}[d]\le D`} size={12} />
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
        <Node tex={inputTex} tag={inputTuned ? "free" : "fixed"} tuned={inputTuned} />
        <div style={{ paddingTop: 5 }}>
          <Arrow />
        </div>
        <Box tex={boxTex} tuned={boxTuned} />
        <div style={{ paddingTop: 5 }}>
          <Arrow />
        </div>
        <Node tex={outputTex} tag="" tuned={false} />
      </div>
      <div
        style={{
          fontStyle: "italic",
          opacity: 0.62,
          fontSize: 12.5,
          textAlign: "center",
          lineHeight: 1.4,
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
        gap: 7,
        alignSelf: "center",
        flex: "none",
        padding: "0 16px",
      }}
    >
      <svg viewBox="0 0 88 20" width="88" aria-hidden="true">
        <defs>
          <marker id="cvrd-conn" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M1 1 L7 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.7" />
          </marker>
        </defs>
        <line
          x1="44"
          y1="10"
          x2="7"
          y2="10"
          stroke="currentColor"
          strokeWidth="3"
          markerEnd="url(#cvrd-conn)"
        />
        <line
          x1="44"
          y1="10"
          x2="81"
          y2="10"
          stroke="currentColor"
          strokeWidth="3"
          markerEnd="url(#cvrd-conn)"
        />
      </svg>
      <div style={{ fontSize: 12, textAlign: "center", lineHeight: 1.3, whiteSpace: "nowrap" }}>
        <div style={{ fontWeight: 600 }}>same currency:</div>
        <M tex={String.raw`I(X;\,\cdot\,)`} size={13} />
      </div>
    </div>
  );
}

export default function CapacityVsRateDistortion() {
  const A = ACCENT;
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 680,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <Panel
        header="channel coding — communicate"
        formulaTex={String.raw`C = \textcolor{${A}}{\max}_{\,p(x)}\; I(X;\textcolor{${A}}{Y})`}
        inputTex={String.raw`\textcolor{${A}}{p(x)}`}
        inputTuned={true}
        boxTex={String.raw`\text{channel } p(y\mid x)`}
        boxTuned={false}
        outputTex={String.raw`\textcolor{${A}}{Y}`}
        gloss="channel fixed, input free; push information through"
      />
      <Connector />
      <Panel
        header="lossy source coding — compress"
        formulaTex={String.raw`R(D) = \textcolor{${A}}{\min}_{\,p(\hat x \mid x)}\; I(X;\textcolor{${A}}{\hat X})`}
        constraintTex={String.raw`\mathbb{E}[d]\le D`}
        inputTex={String.raw`p(x)`}
        inputTuned={false}
        boxTex={String.raw`\textcolor{${A}}{\text{test channel } p(\hat x\mid x)}`}
        boxTuned={true}
        outputTex={String.raw`\textcolor{${A}}{\hat X}`}
        gloss="source fixed, channel free; withhold information within the budget"
      />
    </div>
  );
}
