import { Fragment } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * ConfusionMatrixMaster — the master confusion matrix for the running
 * fraud-detection example (100 fraud / 900 legitimate, threshold flags 170),
 * with every derived rate written at its row/column margin and the synonym
 * stacks that make the metric zoo one table.
 *
 * One idea: every classification metric is one confusion-matrix cell divided
 * by a row total (prediction-conditioned) or a column total
 * (truth-conditioned). Murphy PML Tables 5.3–5.5 collapsed into one graphic.
 *
 * Layout: center 2×2 count grid (truth = columns, prediction = rows); below
 * each truth column its truth-conditioned rates; right of each prediction row
 * its prediction-conditioned rates; a bottom band for accuracy. Thin connector
 * lines tie each rate stack to the cells it divides.
 *
 * Color roles (strict): amber = the positive / fraud subject — TP cell, TPR
 * stack, PPV; blue = FPR. Everything else currentColor.
 */

const AMBER_FILL = "rgba(226,144,58,0.14)";
const hairline = "1px solid rgba(128,128,128,0.42)";
const muted = "rgba(128,128,128,0.9)";

const CELL_W = 154;
const CELL_H = 78;

function Cell({
  acr,
  count,
  positive = false,
}: {
  acr: string;
  count: string;
  positive?: boolean;
}) {
  const color = positive ? ACCENT : "currentColor";
  return (
    <div
      style={{
        position: "relative",
        width: CELL_W,
        height: CELL_H,
        border: positive ? `1.5px solid ${ACCENT}` : hairline,
        background: positive ? AMBER_FILL : "transparent",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 9,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.3,
          color,
          opacity: positive ? 0.95 : 0.55,
        }}
      >
        {acr}
      </span>
      <span style={{ fontSize: 25, fontWeight: 600, color }}>{count}</span>
    </div>
  );
}

/** Vertical connector: from a column's bottom down into its rate stack. */
function ColConnector() {
  return (
    <svg width={CELL_W} height="14" style={{ display: "block" }} aria-hidden="true">
      <line
        x1={CELL_W / 2}
        y1="0"
        x2={CELL_W / 2}
        y2="14"
        stroke={muted}
        strokeWidth="1"
      />
      <line x1={CELL_W / 2 - 16} y1="13" x2={CELL_W / 2 + 16} y2="13" stroke={muted} strokeWidth="1" />
    </svg>
  );
}

/** Horizontal connector: from a row's right edge into its rate stack. */
function RowConnector() {
  return (
    <svg width="18" height={CELL_H} style={{ display: "block", flex: "0 0 auto" }} aria-hidden="true">
      <line x1="0" y1={CELL_H / 2} x2="18" y2={CELL_H / 2} stroke={muted} strokeWidth="1" />
      <line x1="1" y1={CELL_H / 2 - 15} x2="1" y2={CELL_H / 2 + 15} stroke={muted} strokeWidth="1" />
    </svg>
  );
}

function Header({ name, n, note }: { name: string; n: string; note?: string }) {
  return (
    <div style={{ textAlign: "center", paddingBottom: 4 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
      <div style={{ fontSize: 12, opacity: 0.55 }}>
        {note ? `${note} · ` : ""}
        <M tex={`n=${n}`} size={12} />
      </div>
    </div>
  );
}

/** One rate: a KaTeX formula line + a muted synonym line under it. */
function Rate({
  tex,
  syn,
  color,
  synColor,
}: {
  tex: string;
  syn: string;
  color?: string;
  synColor?: string;
}) {
  return (
    <div style={{ lineHeight: 1.25 }}>
      <M tex={tex} size={12.5} color={color} />
      <div style={{ fontSize: 11.5, opacity: 0.62, color: synColor, marginTop: 1 }}>{syn}</div>
    </div>
  );
}

const r = String.raw;

export default function ConfusionMatrixMaster() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 760, color: "currentColor" }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
        {/* rotated left caption */}
        <div
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            textAlign: "center",
            fontSize: 11.5,
            opacity: 0.55,
            letterSpacing: 0.4,
            alignSelf: "center",
          }}
        >
          PREDICTION (rows)
        </div>

        <div>
          {/* truth caption, aligned over the two data columns */}
          <div style={{ display: "flex", marginBottom: 4 }}>
            <div style={{ width: 98 }} />
            <div style={{ width: CELL_W * 2 + 6, textAlign: "center", fontSize: 11.5, opacity: 0.55, letterSpacing: 0.4 }}>
              TRUTH (columns)
            </div>
          </div>

          {/* ── matrix + margins grid ────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `92px ${CELL_W}px ${CELL_W}px`,
              columnGap: 6,
              rowGap: 6,
              alignItems: "stretch",
            }}
          >
            {/* header row */}
            <div />
            <Header name="fraud" n="100" note="positive" />
            <Header name="legitimate" n="900" note="negative" />

            {/* flagged row */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", paddingRight: 4, textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>flagged</div>
              <div style={{ fontSize: 12, opacity: 0.55 }}>
                <M tex="170" size={12} />
              </div>
            </div>
            <Cell acr="TP" count="80" positive />
            <Cell acr="FP" count="90" />

            {/* passed row */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", paddingRight: 4, textAlign: "right" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>passed</div>
              <div style={{ fontSize: 12, opacity: 0.55 }}>
                <M tex="830" size={12} />
              </div>
            </div>
            <Cell acr="FN" count="20" />
            <Cell acr="TN" count="810" />

            {/* connector row */}
            <div />
            <ColConnector />
            <ColConnector />

            {/* column-conditioned rate stacks */}
            <div style={{ fontSize: 11, opacity: 0.5, alignSelf: "start", textAlign: "right", paddingRight: 4, lineHeight: 1.3 }}>
              truth-<br />conditioned<br />(÷ column)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Rate
                tex={r`\textcolor{${ACCENT}}{\mathrm{TPR}=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FN}}=0.80}`}
                syn="recall = sensitivity = hit rate"
                synColor={ACCENT}
              />
              <Rate tex={r`\mathrm{FNR}=0.20`} syn="miss rate" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Rate
                tex={r`\textcolor{${SUPPORT}}{\mathrm{FPR}=\frac{\mathrm{FP}}{\mathrm{FP}+\mathrm{TN}}=0.10}`}
                syn="fall-out = 1 − specificity"
                synColor={SUPPORT}
              />
              <Rate tex={r`\mathrm{TNR}=0.90`} syn="specificity" />
            </div>
          </div>
        </div>

        {/* ── prediction-conditioned rate stacks (right margin) ──── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 33 }}>
          <div style={{ fontSize: 11, opacity: 0.5, lineHeight: 1.3, marginBottom: -2 }}>
            prediction-conditioned (÷ row)
          </div>
          <div style={{ display: "flex", alignItems: "center", height: CELL_H }}>
            <RowConnector />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Rate
                tex={r`\textcolor{${ACCENT}}{\mathrm{PPV}=\frac{\mathrm{TP}}{\mathrm{TP}+\mathrm{FP}}=0.47}`}
                syn="precision"
                synColor={ACCENT}
              />
              <Rate tex={r`\mathrm{FDR}=0.53`} syn="false discovery rate" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", height: CELL_H }}>
            <RowConnector />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Rate
                tex={r`\mathrm{NPV}=\frac{\mathrm{TN}}{\mathrm{TN}+\mathrm{FN}}=0.976`}
                syn="negative predictive value"
              />
              <Rate tex={r`\mathrm{FOR}=0.024`} syn="false omission rate" />
            </div>
          </div>
        </div>
      </div>

      {/* ── accuracy band ─────────────────────────────────────── */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: hairline,
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <M
          tex={r`\mathrm{accuracy}=\frac{\mathrm{TP}+\mathrm{TN}}{n}=\frac{80+810}{1000}=0.89`}
          size={13.5}
        />
        <span style={{ fontSize: 12, opacity: 0.6 }}>
          one number off the whole grid — and blind to the 90 % / 10 % class split
        </span>
      </div>
    </div>
  );
}
