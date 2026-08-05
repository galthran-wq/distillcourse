import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * TwoLimitsMap — Shannon's two limits as the two extreme points of mutual
 * information. A central I(X;Y) node on a horizontal spine sends one arrow
 * left to "data compression" (minimize I over representations, limit H(X))
 * and one arrow right to "data transmission" (maximize I over inputs, the
 * capacity C).
 *
 * Color roles: amber = the capacity / transmission side (this lesson's
 * subject); blue = the compression side (the source-coding lessons);
 * currentColor = the spine, the central node, and the glosses.
 *
 * One idea: entropy and capacity are the min and max of the same quantity —
 * the two operational limits of the theory.
 *
 * Recreated after Cover & Thomas fig. 1.2 (idea only, redrawn in house style).
 */

/** Horizontal spine arrow. dir "left" points toward the left terminal. */
function SpineArrow({ dir, label }: { dir: "left" | "right"; label: string }) {
  const W = 96;
  const Y = 30;
  return (
    <div style={{ flex: "0 0 auto", width: W }}>
      <svg viewBox={`0 0 ${W} 52`} width={W} aria-hidden="true">
        {dir === "left" ? (
          <>
            <line
              x1={W}
              y1={Y}
              x2={9}
              y2={Y}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeOpacity="0.75"
            />
            <path d={`M 5 ${Y} l 9 -4 l 0 8 Z`} fill="currentColor" fillOpacity="0.75" />
          </>
        ) : (
          <>
            <line
              x1={0}
              y1={Y}
              x2={W - 9}
              y2={Y}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeOpacity="0.75"
            />
            <path d={`M ${W - 5} ${Y} l -9 -4 l 0 8 Z`} fill="currentColor" fillOpacity="0.75" />
          </>
        )}
        <text
          x={W / 2}
          y={16}
          textAnchor="middle"
          fontSize="11.5"
          fontStyle="italic"
          fill="currentColor"
          opacity="0.6"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

function Terminal({
  color,
  header,
  bodyTex,
  gloss,
}: {
  color: string;
  header: string;
  bodyTex: string;
  gloss: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: 208,
        minHeight: 148,
        border: `1.6px solid ${color}`,
        borderRadius: 10,
        padding: "12px 14px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ color, fontWeight: 600, fontSize: 13.5 }}>{header}</div>
      <M tex={bodyTex} size={16} />
      <div
        style={{
          opacity: 0.6,
          fontSize: 11.5,
          lineHeight: 1.4,
        }}
      >
        {gloss}
      </div>
    </div>
  );
}

export default function TwoLimitsMap() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        maxWidth: 720,
      }}
    >
      {/* the spine: left terminal ← I(X;Y) → right terminal */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Terminal
          color={SUPPORT}
          header="data compression"
          bodyTex={String.raw`\min_{p(\hat{x}\mid x)}\, I(X;\hat{X})`}
          gloss={
            <>
              the fewest bits that still represent the source — the
              source-coding side; limit{" "}
              <M tex={String.raw`H(X)`} size={11.5} />
            </>
          }
        />

        <SpineArrow dir="left" label="minimize" />

        {/* central node on the spine */}
        <div
          style={{
            flex: "0 0 auto",
            border: "1.6px solid currentColor",
            borderRadius: 999,
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <M tex={String.raw`I(X;Y)`} size={17} />
        </div>

        <SpineArrow dir="right" label="maximize" />

        <Terminal
          color={ACCENT}
          header="data transmission"
          bodyTex={String.raw`\max_{p(x)}\, I(X;Y)`}
          gloss={
            <>
              the most bits a noisy channel passes — the capacity{" "}
              <M tex={String.raw`C`} size={11.5} />
            </>
          }
        />
      </div>

      {/* one-line takeaway under the spine */}
      <div style={{ opacity: 0.6, fontSize: 12.5, fontStyle: "italic" }}>
        one quantity, two extreme points
      </div>
    </div>
  );
}
