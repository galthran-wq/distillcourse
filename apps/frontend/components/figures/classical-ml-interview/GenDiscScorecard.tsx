import { Fragment } from "react";
import type { CSSProperties, ReactNode } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT, OK } from "../palette";

/**
 * GenDiscScorecard — the closing ledger for the generative-vs-discriminative
 * section of the LDA/GDA chapter. A two-column verdict table: each row is a
 * practical scenario, each cell a ✓ (green, this column wins it) or ✗ (muted,
 * this column pays for it) with a 3–6 word note.
 *
 * One idea: neither column dominates — the generative column buys structure
 * (missing features, prior shift, unlabeled data, closed-form fit) that pays
 * only while its model of x is roughly right; the discriminative column wins
 * on feature freedom, robustness to a wrong p(x|y), asymptotic error, and
 * calibration.
 *
 * Color roles: amber = generative (subject, bound to the header + p(x,y)
 * subhead + faint column tint); blue = discriminative (bound to header +
 * p(y|x) subhead + tint); green = a won row (✓); muted currentColor = a lost
 * row (✗) and its note. At most three hues + currentColor.
 * Inspiration: the generative/discriminative trade-off table, Murphy PML
 * §9.4; sample-efficiency footer after Ng & Jordan (2002) — recreated.
 */

const hairline = "1px solid rgba(128,128,128,0.32)";
const GEN_TINT = "color-mix(in srgb, " + ACCENT + " 7%, transparent)";
const DISC_TINT = "color-mix(in srgb, " + SUPPORT + " 7%, transparent)";

type Verdict = { ok: boolean; note: ReactNode };
type Row = { label: ReactNode; gen: Verdict; disc: Verdict };

const px = (t: string) => <M tex={t} size={12.5} />;

const ROWS: Row[] = [
  {
    label: "closed-form one-pass fit",
    gen: { ok: true, note: "class statistics" },
    disc: { ok: false, note: "iterative optimization" },
  },
  {
    label: "missing features at test time",
    gen: { ok: true, note: "marginalize them out" },
    disc: { ok: false, note: "impute first" },
  },
  {
    label: "class-prior shift",
    gen: { ok: true, note: "swap the ln-odds term" },
    disc: { ok: false, note: "refit or reweight" },
  },
  {
    label: "unlabeled data",
    gen: { ok: true, note: <span>{px("x")} alone has likelihood</span> },
    disc: { ok: false, note: <span>unusable without {px("y")}</span> },
  },
  {
    label: "arbitrary correlated features",
    gen: { ok: false, note: "must model their density" },
    disc: { ok: true, note: "free" },
  },
  {
    label: <span>wrong {px("p(x \\mid y)")}</span>,
    gen: { ok: false, note: "biased boundary" },
    disc: { ok: true, note: "unaffected" },
  },
  {
    label: "asymptotic error",
    gen: { ok: false, note: "at best equal" },
    disc: { ok: true, note: "at least as low" },
  },
  {
    label: "calibration in practice",
    gen: { ok: false, note: "overconfident when misspecified" },
    disc: { ok: true, note: <span>direct fit of {px("p(y \\mid x)")}</span> },
  },
];

function Cell({ v, tint }: { v: Verdict; tint: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 9,
        padding: "9px 16px",
        background: tint,
        borderBottom: hairline,
      }}
    >
      <span
        style={{
          color: v.ok ? OK : "currentColor",
          opacity: v.ok ? 1 : 0.38,
          fontWeight: 700,
          fontSize: 14,
          width: 12,
          flexShrink: 0,
        }}
      >
        {v.ok ? "✓" : "✗"}
      </span>
      <span
        style={{
          fontSize: 12.5,
          opacity: v.ok ? 0.9 : 0.5,
          lineHeight: 1.35,
        }}
      >
        {v.note}
      </span>
    </div>
  );
}

const headBase: CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  padding: "4px 16px 8px",
  borderBottom: hairline,
};

const rowLabel: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  padding: "9px 18px 9px 2px",
  fontSize: 13,
  borderBottom: hairline,
};

export default function GenDiscScorecard() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 660,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(140px, auto) 1fr 1fr",
          alignItems: "stretch",
          border: hairline,
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* header row */}
        <div style={{ ...headBase, display: "flex", alignItems: "flex-end" }}>
          <span style={{ opacity: 0.5, fontWeight: 400, fontSize: 11.5, fontStyle: "italic" }}>
            scenario
          </span>
        </div>
        <div style={{ ...headBase, background: GEN_TINT }}>
          <div style={{ color: ACCENT }}>generative</div>
          <div style={{ opacity: 0.55, fontWeight: 400, fontSize: 11.5, marginTop: 2 }}>
            <M tex={"p(x, y)"} size={11.5} />
          </div>
        </div>
        <div style={{ ...headBase, background: DISC_TINT }}>
          <div style={{ color: SUPPORT }}>discriminative</div>
          <div style={{ opacity: 0.55, fontWeight: 400, fontSize: 11.5, marginTop: 2 }}>
            <M tex={"p(y \\mid x)"} size={11.5} />
          </div>
        </div>

        {/* body rows */}
        {ROWS.map((r, i) => (
          <Fragment key={i}>
            <div style={rowLabel}>{r.label}</div>
            <Cell v={r.gen} tint={GEN_TINT} />
            <Cell v={r.disc} tint={DISC_TINT} />
          </Fragment>
        ))}
      </div>

      {/* footer strip spanning both columns */}
      <div
        style={{
          marginTop: 10,
          padding: "10px 14px",
          border: hairline,
          borderRadius: 8,
          fontSize: 12.5,
          lineHeight: 1.5,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600 }}>sample efficiency:</span>
        <span style={{ opacity: 0.82 }}>
          the <span style={{ color: ACCENT }}>generative</span> fit reaches its{" "}
          <i>(worse)</i> asymptote first
        </span>
        <span style={{ opacity: 0.5, marginLeft: "auto" }}>— Ng &amp; Jordan 2002</span>
      </div>
    </div>
  );
}
