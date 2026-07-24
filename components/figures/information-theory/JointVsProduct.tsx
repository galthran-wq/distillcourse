import type { CSSProperties } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * JointVsProduct — mutual information as the gap between the joint p(x,y) and
 * the independent product p(x)p(y) that shares its marginals.
 *
 * Running weather table (Cover & Thomas §2.3, redrawn):
 *   rows = sky (clear / overcast), cols = ground (dry / wet).
 *   Row marginals 1/2, 1/2; column marginals 3/4, 1/4 — IDENTICAL in both panels.
 *   joint p(x,y):      [1/2, 0 ; 1/4, 1/4]
 *   product p(x)p(y):  [3/8, 1/8 ; 3/8, 1/8]
 * Left grid tints the cells where the joint departs from the product:
 *   amber = excess (joint > product): clear-dry, overcast-wet.
 *   blue  = deficit (joint < product): overcast-dry, clear-wet.
 * The right grid is neutral: same edges, different interior.
 *   I(X;Y) = D(p(x,y) || p(x)p(y)) = 0.311 bits.
 *
 * One idea: MI measures how far the joint sits from the independent product
 * with the same marginals. Forward-binds to the kl-divergence lesson.
 */

const AMBER_TINT = "#e2903a30"; // excess
const BLUE_TINT = "#4c8dd630"; // deficit

type Tint = "amber" | "blue" | null;

const bg = (t: Tint) =>
  t === "amber" ? AMBER_TINT : t === "blue" ? BLUE_TINT : "transparent";

function Cell({ tex, tint }: { tex: string; tint: Tint }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 62,
        height: 46,
        border: "1px solid currentColor",
        borderColor: "color-mix(in srgb, currentColor 32%, transparent)",
        background: bg(tint),
        fontSize: 15,
      }}
    >
      <M tex={tex} />
    </div>
  );
}

function ColHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 62,
        textAlign: "center",
        fontWeight: 600,
        fontSize: 13,
        paddingBottom: 3,
      }}
    >
      {children}
    </div>
  );
}

function RowHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        height: 46,
        paddingRight: 8,
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

function Marg({ children, kind }: { children: React.ReactNode; kind: "row" | "col" }) {
  const base: CSSProperties = {
    ...labelMuted,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  return (
    <div
      style={
        kind === "row"
          ? { ...base, height: 46, width: 40, justifyContent: "flex-start", paddingLeft: 8 }
          : { ...base, width: 62, paddingTop: 3 }
      }
    >
      {children}
    </div>
  );
}

/** cells: [[topLeft, topRight],[botLeft, botRight]]; tints laid out the same. */
function Panel({
  label,
  headingTex,
  cells,
  tints,
}: {
  label: string;
  headingTex: string;
  cells: string[][];
  tints: Tint[][];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* panel heading: word + typeset probability */}
      <div
        style={{
          fontSize: 14,
          marginBottom: 10,
          textAlign: "center",
          display: "flex",
          alignItems: "baseline",
          gap: 6,
        }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <M tex={headingTex} size={14} />
      </div>

      {/* ground axis label over the two columns */}
      <div style={{ ...labelMuted, fontSize: 11, fontStyle: "italic", marginBottom: 2 }}>
        ground
      </div>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {/* sky axis label, vertical, left of the row heads */}
        <div
          style={{
            ...labelMuted,
            fontSize: 11,
            fontStyle: "italic",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            alignSelf: "center",
            marginRight: 2,
            height: 92,
            display: "flex",
            alignItems: "center",
          }}
        >
          sky
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "auto auto auto auto" }}>
          {/* header row: corner, dry, wet, corner */}
          <div />
          <ColHead>dry</ColHead>
          <ColHead>wet</ColHead>
          <div />

          {/* clear row */}
          <RowHead>clear</RowHead>
          <Cell tex={cells[0][0]} tint={tints[0][0]} />
          <Cell tex={cells[0][1]} tint={tints[0][1]} />
          <Marg kind="row">
            <M tex={F(1, 2)} size={12} />
          </Marg>

          {/* overcast row */}
          <RowHead>overcast</RowHead>
          <Cell tex={cells[1][0]} tint={tints[1][0]} />
          <Cell tex={cells[1][1]} tint={tints[1][1]} />
          <Marg kind="row">
            <M tex={F(1, 2)} size={12} />
          </Marg>

          {/* column marginals */}
          <div />
          <Marg kind="col">
            <M tex={F(3, 4)} size={12} />
          </Marg>
          <Marg kind="col">
            <M tex={F(1, 4)} size={12} />
          </Marg>
          <div />
        </div>
      </div>
    </div>
  );
}

const F = (n: number, d: number) => String.raw`\tfrac{${n}}{${d}}`;

export default function JointVsProduct() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 640,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      {/* twin panels */}
      <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
        <Panel
          label="joint"
          headingTex="p(x,y)"
          cells={[
            [F(1, 2), String.raw`0`],
            [F(1, 4), F(1, 4)],
          ]}
          tints={[
            ["amber", "blue"],
            ["blue", "amber"],
          ]}
        />
        <Panel
          label="product"
          headingTex="p(x)\,p(y)"
          cells={[
            [F(3, 8), F(1, 8)],
            [F(3, 8), F(1, 8)],
          ]}
          tints={[
            [null, null],
            [null, null],
          ]}
        />
      </div>

      {/* color legend: role bound to the word naming it */}
      <div
        style={{
          display: "flex",
          gap: 22,
          marginTop: 14,
          fontSize: 12.5,
          alignItems: "center",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 15,
              height: 15,
              background: AMBER_TINT,
              border: `1px solid ${ACCENT}`,
              display: "inline-block",
            }}
          />
          <span style={{ color: ACCENT }}>excess</span>
          <span style={labelMuted}>(joint &gt; product)</span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 15,
              height: 15,
              background: BLUE_TINT,
              border: `1px solid ${SUPPORT}`,
              display: "inline-block",
            }}
          />
          <span style={{ color: SUPPORT }}>deficit</span>
          <span style={labelMuted}>(joint &lt; product)</span>
        </span>
      </div>

      {/* the divergence identity, evaluated on this table */}
      <div style={{ marginTop: 14 }}>
        <M
          display
          tex={String.raw`I(X;Y) \;=\; D\big(p(x,y)\,\big\|\,p(x)p(y)\big) \;=\; 0.311 \text{ bits}`}
        />
      </div>
      <div style={{ ...labelMuted, fontSize: 12.5, textAlign: "center" }}>
        same marginals, different table: the gap is the dependence
      </div>
    </div>
  );
}
