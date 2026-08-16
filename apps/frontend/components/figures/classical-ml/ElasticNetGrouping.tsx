import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * ElasticNetGrouping — how the three penalties place one unit of coefficient
 * on two duplicate predictors (ridge-lasso, elastic-net subsection).
 *
 * Three bar panels, same axes: ridge splits evenly (strict convexity), the
 * lasso is indifferent among same-sign splits — the solver's pick, mirror
 * optimum dashed — and the elastic net restores the even split. Color roles:
 * amber = the elastic net (the subject); muted currentColor = the parents;
 * dashed outline = the equally cheap mirror the lasso could have returned.
 */

const BAR_W = 34;
const BASE = 92;
const H = (v: number) => v * 64;

function Bars({
  v1,
  v2,
  fill,
  ghost,
}: {
  v1: number;
  v2: number;
  fill: string;
  /** dashed mirror split (β₁, β₂), drawn as outlines */
  ghost?: [number, number];
}) {
  const bar = (x: number, v: number) =>
    v > 0 && (
      <rect x={x} y={BASE - H(v)} width={BAR_W} height={H(v)} rx="3" fill={fill} opacity="0.85" />
    );
  const ghostBar = (x: number, v: number) =>
    v > 0 && (
      <rect
        x={x}
        y={BASE - H(v)}
        width={BAR_W}
        height={H(v)}
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="4 3"
        opacity="0.45"
      />
    );
  const value = (x: number, v: number) => (
    <text
      x={x + BAR_W / 2}
      y={BASE - H(v) - 6}
      textAnchor="middle"
      fill="currentColor"
      fontSize="12"
    >
      {v}
    </text>
  );
  return (
    <svg viewBox="0 0 160 118" fontFamily="system-ui, sans-serif" style={{ display: "block" }}>
      {bar(28, v1)}
      {bar(98, v2)}
      {ghost && ghostBar(28, ghost[0])}
      {ghost && ghostBar(98, ghost[1])}
      <line x1="14" y1={BASE} x2="146" y2={BASE} stroke="currentColor" strokeWidth="1.3" />
      {value(28, v1)}
      {value(98, v2)}
      <text x={28 + BAR_W / 2} y="108" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
        {"β₁"}
      </text>
      <text x={98 + BAR_W / 2} y="108" textAnchor="middle" fill="currentColor" opacity="0.55" fontSize="12">
        {"β₂"}
      </text>
    </svg>
  );
}

function Panel({
  title,
  tex,
  note,
  children,
}: {
  title: string;
  tex: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{title}</div>
      <div style={{ marginBottom: 6 }}>
        <M size={12.5} tex={tex} />
      </div>
      {children}
      <div style={{ fontSize: 11.5, opacity: 0.62, lineHeight: 1.4, marginTop: 6 }}>{note}</div>
    </div>
  );
}

export default function ElasticNetGrouping() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 620,
        margin: "0 auto",
      }}
    >
      <div style={{ textAlign: "center", fontSize: 12.5, opacity: 0.6, marginBottom: 12 }}>
        duplicate columns <M size={12.5} tex={String.raw`x_1 = x_2`} /> — every split with{" "}
        <M size={12.5} tex={String.raw`\beta_1 + \beta_2 = 1`} /> gives the same fit; the penalty
        alone decides
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          columnGap: 20,
          alignItems: "start",
        }}
      >
        <Panel
          title="ridge"
          tex={String.raw`\lambda\lVert\beta\rVert_2^2`}
          note="strict convexity forces the even split"
        >
          <Bars v1={0.5} v2={0.5} fill="currentColor" />
        </Panel>
        <Panel
          title="lasso"
          tex={String.raw`\lambda\lVert\beta\rVert_1`}
          note="all same-sign splits cost the same; the solver picks one, a resample can flip it (dashed: the mirror optimum)"
        >
          <Bars v1={1} v2={0} fill="currentColor" ghost={[0, 1]} />
        </Panel>
        <Panel
          title="elastic net"
          tex={String.raw`\lambda\sum_j\bigl(\alpha\beta_j^2 + (1-\alpha)\lvert\beta_j\rvert\bigr)`}
          note="the ℓ₂ part restores the even split; the ℓ₁ part keeps exact zeros elsewhere"
        >
          <Bars v1={0.5} v2={0.5} fill={ACCENT} />
        </Panel>
      </div>
    </div>
  );
}
