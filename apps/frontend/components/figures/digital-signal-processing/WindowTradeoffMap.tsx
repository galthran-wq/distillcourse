import type { CSSProperties } from "react";

import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

type Shape = "circle" | "square" | "diamond" | "triangle" | "cross";

interface WindowPoint {
  name: string;
  shortName: string;
  rejection: number;
  enbw: number;
  scallop: number;
  worstLoss: number;
  shape: Shape;
  labelDx: number;
  labelDy: number;
  anchor: "start" | "end";
}

const DATA: WindowPoint[] = [
  {
    name: "Rectangular",
    shortName: "Rectangle",
    rejection: 13.2615,
    enbw: 1,
    scallop: 3.9224,
    worstLoss: 3.9224,
    shape: "circle",
    labelDx: 12,
    labelDy: -11,
    anchor: "start",
  },
  {
    name: "Periodic Hann",
    shortName: "Hann",
    rejection: 31.4673,
    enbw: 1.5,
    scallop: 1.4236,
    worstLoss: 3.1845,
    shape: "square",
    labelDx: -11,
    labelDy: -13,
    anchor: "end",
  },
  {
    name: "Periodic Hamming",
    shortName: "Hamming",
    rejection: 42.675,
    enbw: 1.362826,
    scallop: 1.7514,
    worstLoss: 3.0958,
    shape: "diamond",
    labelDx: 12,
    labelDy: -22,
    anchor: "start",
  },
  {
    name: "Classic Blackman",
    shortName: "Blackman",
    rejection: 58.1088,
    enbw: 1.726757,
    scallop: 1.0989,
    worstLoss: 3.4712,
    shape: "triangle",
    labelDx: 12,
    labelDy: -13,
    anchor: "start",
  },
  {
    name: "4-term Blackman–Harris",
    shortName: "4-term BH",
    rejection: 92.0097,
    enbw: 2.004353,
    scallop: 0.8256,
    worstLoss: 3.8453,
    shape: "cross",
    labelDx: -13,
    labelDy: -13,
    anchor: "end",
  },
];

const panel: CSSProperties = {
  border: "1px solid color-mix(in srgb, currentColor 20%, transparent)",
  borderRadius: 9,
};

function PlotShape({ shape, x, y }: { shape: Shape; x: number; y: number }) {
  const common = {
    stroke: "currentColor",
    strokeWidth: 2.2,
    fill: "none",
  };

  if (shape === "circle") return <circle cx={x} cy={y} r="7" {...common} />;
  if (shape === "square") return <rect x={x - 7} y={y - 7} width="14" height="14" rx="1" {...common} />;
  if (shape === "diamond") {
    return <path d={`M${x} ${y - 8} L${x + 8} ${y} L${x} ${y + 8} L${x - 8} ${y} Z`} {...common} />;
  }
  if (shape === "triangle") {
    return <path d={`M${x} ${y - 8} L${x + 8} ${y + 7} L${x - 8} ${y + 7} Z`} {...common} />;
  }
  return (
    <g {...common}>
      <path d={`M${x - 7} ${y - 7} L${x + 7} ${y + 7}`} />
      <path d={`M${x + 7} ${y - 7} L${x - 7} ${y + 7}`} />
    </g>
  );
}

function ShapeIcon({ shape }: { shape: Shape }) {
  return (
    <svg viewBox="0 0 22 22" width="20" height="20" aria-hidden="true" style={{ flex: "0 0 auto" }}>
      <PlotShape shape={shape} x={11} y={11} />
    </svg>
  );
}

function TradeoffPlot() {
  const left = 82;
  const right = 746;
  const top = 42;
  const bottom = 328;
  const xScale = (value: number) => left + (value / 100) * (right - left);
  const yScale = (value: number) => bottom - ((value - 3) / 1.05) * (bottom - top);
  const xTicks = [0, 20, 40, 60, 80, 100];
  const yTicks = [3, 3.2, 3.4, 3.6, 3.8, 4];

  return (
    <svg
      viewBox="0 0 800 410"
      role="img"
      aria-label="Scatter plot of peak sidelobe rejection against worst-case processing loss for five periodic windows; the points do not form a universal ranking"
      style={{ display: "block", width: "100%", minWidth: 800, height: "auto" }}
    >
      <defs>
        <marker id="tradeoff-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill={SUPPORT} />
        </marker>
      </defs>

      {yTicks.map((tick) => {
        const y = yScale(tick);
        return (
          <g key={`y-${tick}`}>
            <line x1={left} x2={right} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.12" />
            <text x={left - 12} y={y + 4} textAnchor="end" fill="currentColor" fontSize="12" opacity="0.62">
              {tick.toFixed(1)}
            </text>
          </g>
        );
      })}

      {xTicks.map((tick) => {
        const x = xScale(tick);
        return (
          <g key={`x-${tick}`}>
            <line x1={x} x2={x} y1={top} y2={bottom} stroke="currentColor" strokeOpacity="0.09" />
            <text x={x} y={bottom + 20} textAnchor="middle" fill="currentColor" fontSize="12" opacity="0.62">
              {tick}
            </text>
          </g>
        );
      })}

      <line x1={left} x2={right} y1={bottom} y2={bottom} stroke={SUPPORT} strokeWidth="1.7" />
      <line x1={left} x2={left} y1={top} y2={bottom} stroke={ACCENT} strokeWidth="1.7" />

      <text x={(left + right) / 2} y="390" textAnchor="middle" fill={SUPPORT} fontSize="13" fontWeight="700">
        peak sidelobe rejection, −PSL (dB) →
      </text>
      <text
        x="20"
        y={(top + bottom) / 2}
        transform={`rotate(-90 20 ${(top + bottom) / 2})`}
        textAnchor="middle"
        fill={ACCENT}
        fontSize="13"
        fontWeight="700"
      >
        worst-case processing loss (dB)
      </text>

      <path
        d={`M${xScale(75)} ${yScale(3.57)} L${xScale(88)} ${yScale(3.20)}`}
        fill="none"
        stroke={SUPPORT}
        strokeWidth="1.4"
        strokeDasharray="4 4"
        markerEnd="url(#tradeoff-arrow)"
        opacity="0.8"
      />
      <text x={xScale(69)} y={yScale(3.66)} textAnchor="start" fill={SUPPORT} fontSize="11" fontWeight="650">
        lower/right is preferable
      </text>
      <text x={xScale(69)} y={yScale(3.66) + 14} textAnchor="start" fill={SUPPORT} fontSize="11">
        on these two axes only
      </text>

      {DATA.map((point) => {
        const x = xScale(point.rejection);
        const y = yScale(point.worstLoss);
        return (
          <g key={point.name}>
            <PlotShape shape={point.shape} x={x} y={y} />
            <text
              x={x + point.labelDx}
              y={y + point.labelDy}
              textAnchor={point.anchor}
              fill="currentColor"
              fontSize="12"
              fontWeight="720"
            >
              {point.shortName}
            </text>
            <text
              x={x + point.labelDx}
              y={y + point.labelDy + 14}
              textAnchor={point.anchor}
              fill="currentColor"
              fontSize="10.5"
              opacity="0.62"
            >
              {point.rejection.toFixed(1)} reject · {point.worstLoss.toFixed(2)} loss
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function WindowTradeoffMap() {
  return (
    <div
      className="wtm-root"
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        lineHeight: 1.38,
        maxWidth: 820,
        minWidth: 0,
        width: "100%",
        color: "currentColor",
      }}
    >
      <style>{`@media(max-width:640px){.wtm-contract{grid-template-columns:minmax(0,1fr)!important}.wtm-scroll{scrollbar-gutter:stable}}`}</style>
      <div style={{ fontSize: 17, fontWeight: 760 }}>Two calibrated metrics still do not choose a window</div>
      <div style={{ ...labelMuted, marginTop: 3 }}>
        Positive peak-sidelobe rejection increases to the right; lower worst-case processing loss is preferable. Values use the large-N reference N=65,536.
      </div>

      <div
        className="wtm-contract"
        style={{
          ...panel,
          marginTop: 13,
          padding: "10px 14px 8px",
          display: "grid",
          gridTemplateColumns: "minmax(250px, 0.85fr) minmax(340px, 1.15fr)",
          gap: 14,
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ color: ACCENT, fontSize: 12, fontWeight: 750, marginBottom: 4 }}>
            WORST-CASE PROCESSING LOSS
          </div>
          <div className="wtm-scroll" style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}><M
              display
              tex={String.raw`L_{\mathrm{wc}}=\underbrace{10\log_{10}B_e}_{\text{noise-bandwidth loss}}+\underbrace{L_s}_{\text{half-bin scalloping}}`}
            /></div>
        </div>
        <div style={{ fontSize: 12.5 }}>
          <b>Checked contract.</b> <M tex={String.raw`B_e=N\sum w^2/(\sum w)^2`} size={12} /> and positive
          <M tex={String.raw`\ L_s=-20\log_{10}(|W(e^{j\pi/N})|/|W(1)|)`} size={12} /> are evaluated from the same
          denominator-<M tex="N" size={12} /> coefficients at the fixed large-N reference <M tex={String.raw`N_{\mathrm{ref}}=65{,}536`} size={12} />. The horizontal coordinate is positive rejection
          <M tex={String.raw`\ -\mathrm{PSL}`} size={12} />.
        </div>
      </div>

      <div style={{ ...panel, marginTop: 12, padding: "4px 8px 0" }}>
        <div className="wtm-scroll" style={{ maxWidth: "100%", overflowX: "auto", overflowY: "hidden" }}><TradeoffPlot /></div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(142px, 1fr))",
          gap: 7,
          marginTop: 9,
        }}
      >
        {DATA.map((point) => (
          <div
            key={`card-${point.name}`}
            style={{
              ...panel,
              padding: "7px 8px",
              display: "flex",
              gap: 7,
              alignItems: "flex-start",
              minWidth: 0,
            }}
          >
            <ShapeIcon shape={point.shape} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 720 }}>{point.shortName}</div>
              <div style={{ ...labelMuted, fontSize: 10.5, marginTop: 1 }}>
                <M tex={String.raw`B_e=${point.enbw.toFixed(3)}`} size={10.5} /> · <M tex={String.raw`L_s=${point.scallop.toFixed(2)}\,\mathrm{dB}`} size={10.5} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          border: "1.4px dashed color-mix(in srgb, currentColor 35%, transparent)",
          borderRadius: 8,
          padding: "10px 12px",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 760, marginBottom: 7 }}>NOT SHOWN ON THESE TWO AXES</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {["coherent multitone addition", "local interferer placement", "main-lobe width and encroachment"].map((item) => (
            <span
              key={item}
              style={{
                borderRadius: 999,
                border: "1px solid color-mix(in srgb, currentColor 28%, transparent)",
                padding: "4px 9px",
                fontSize: 11.5,
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 8, fontWeight: 680 }}>
          Lower/right is a two-metric preference, not a universal winner; any omitted condition can reverse the task-specific choice.
        </div>
      </div>
    </div>
  );
}
