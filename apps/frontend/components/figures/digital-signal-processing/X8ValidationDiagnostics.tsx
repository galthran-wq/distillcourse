import {
  X8_VALIDATION_DIAGNOSTICS,
  type X8ValidationManeuver,
} from "./X8ValidationDiagnostics.data";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

const DATA = X8_VALIDATION_DIAGNOSTICS;
const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";
const strongBorder = "1.5px solid color-mix(in srgb, currentColor 24%, transparent)";

const chart = {
  width: 320,
  height: 104,
  left: 29,
  right: 8,
  top: 8,
  bottom: 20,
} as const;

function scale(
  value: number,
  domain: readonly string[],
  rangeStart: number,
  rangeEnd: number,
) {
  const low = Number(domain[0]);
  const high = Number(domain[1]);
  return rangeStart + ((value - low) / (high - low)) * (rangeEnd - rangeStart);
}

function tracePath(
  time: readonly string[],
  values: readonly string[],
  valueDomain: readonly string[],
) {
  if (time.length !== values.length) {
    throw new Error("X8 trace arrays have different lengths");
  }
  const xDomain = DATA.axes.timeS;
  const x0 = chart.left;
  const x1 = chart.width - chart.right;
  const y0 = chart.height - chart.bottom;
  const y1 = chart.top;
  return values
    .map((value, index) => {
      const x = scale(Number(time[index]), xDomain, x0, x1);
      const y = scale(Number(value), valueDomain, y0, y1);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function ModelLegend() {
  return (
    <div
      className="x8vd-legend"
      style={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: "5px 14px",
        margin: "7px 0 8px",
      }}
    >
      <span style={{ alignItems: "center", color: SUPPORT, display: "inline-flex", fontSize: 10.5, fontWeight: 700, gap: 5 }}>
        <span aria-hidden="true" style={{ background: SUPPORT, display: "inline-block", height: 2, width: 18 }} />
        AR(2): q memory only
      </span>
      <span style={{ alignItems: "center", color: ACCENT, display: "inline-flex", fontSize: 10.5, fontWeight: 700, gap: 5 }}>
        <span aria-hidden="true" style={{ background: ACCENT, display: "inline-block", height: 2, width: 18 }} />
        ARX(2,1,1): q memory + elevator
      </span>
    </div>
  );
}

function NrmseRow({
  label,
  ar2,
  arx,
}: {
  label: string;
  ar2: string;
  arx: string;
}) {
  return (
    <div
      style={{
        alignItems: "baseline",
        display: "grid",
        gap: 7,
        gridTemplateColumns: "minmax(0, 1fr) auto",
      }}
    >
      <span style={{ fontSize: 10.5, fontWeight: 650 }}>{label}</span>
      <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        <b style={{ color: SUPPORT }}>{ar2}</b>
        <span aria-hidden="true" style={{ opacity: 0.5, padding: "0 5px" }}>→</span>
        <b style={{ color: ACCENT }}>{arx}</b>
      </span>
    </div>
  );
}

function TimeTrace({
  title,
  time,
  ar2,
  arx,
  domain,
}: {
  title: string;
  time: readonly string[];
  ar2: readonly string[];
  arx: readonly string[];
  domain: readonly string[];
}) {
  const xStart = chart.left;
  const xEnd = chart.width - chart.right;
  const yStart = chart.top;
  const yEnd = chart.height - chart.bottom;
  const zeroY = scale(0, domain, yEnd, yStart);
  const midX = scale(6, DATA.axes.timeS, xStart, xEnd);

  return (
    <section style={{ marginTop: 8 }}>
      <div style={{ fontSize: 10.5, fontWeight: 720, margin: "0 0 2px 2px" }}>{title}</div>
      <svg
        aria-label={`${title}; AR(2) and ARX traces on a common 0 to 12 second axis`}
        role="img"
        style={{ display: "block", height: "auto", overflow: "visible", width: "100%" }}
        viewBox={`0 0 ${chart.width} ${chart.height}`}
      >
        <line x1={xStart} y1={yStart} x2={xStart} y2={yEnd} stroke="currentColor" strokeOpacity="0.32" />
        <line x1={xStart} y1={zeroY} x2={xEnd} y2={zeroY} stroke="currentColor" strokeOpacity="0.42" />
        <line x1={midX} y1={yStart} x2={midX} y2={yEnd} stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.16" />
        <text x="1" y={yStart + 3} fill="currentColor" fontSize="8.5" opacity="0.58">{domain[1]}</text>
        <text x="1" y={yEnd + 2} fill="currentColor" fontSize="8.5" opacity="0.58">{domain[0]}</text>
        <text x={xStart - 3} y={chart.height - 5} fill="currentColor" fontSize="8.5" opacity="0.58">0</text>
        <text x={midX - 3} y={chart.height - 5} fill="currentColor" fontSize="8.5" opacity="0.58">6</text>
        <text x={xEnd - 9} y={chart.height - 5} fill="currentColor" fontSize="8.5" opacity="0.58">12</text>
        <text x={xEnd - 80} y={chart.height - 5} fill="currentColor" fontSize="8.5" opacity="0.58">time (s)</text>
        <path
          d={tracePath(time, ar2, domain)}
          fill="none"
          stroke={SUPPORT}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.82"
          strokeWidth="1.15"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={tracePath(time, arx, domain)}
          fill="none"
          stroke={ACCENT}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.35"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </section>
  );
}

function AcfPlot({ item }: { item: X8ValidationManeuver }) {
  const width = 320;
  const height = 117;
  const left = 29;
  const right = 8;
  const top = 8;
  const bottom = 26;
  const xStart = left;
  const xEnd = width - right;
  const yStart = top;
  const yEnd = height - bottom;
  const zeroY = scale(0, DATA.axes.acf, yEnd, yStart);
  const band = Number(item.acf.descriptiveBand);
  const upperBand = scale(band, DATA.axes.acf, yEnd, yStart);
  const lowerBand = scale(-band, DATA.axes.acf, yEnd, yStart);
  const crossingSet = new Set<string>(item.acf.crossingLags);

  return (
    <section style={{ borderTop: border, marginTop: 8, paddingTop: 8 }}>
      <div style={{ fontSize: 10.5, fontWeight: 720 }}>ARX one-step residual ACF</div>
      <div style={{ ...labelMuted, fontSize: 9.5, marginTop: 2 }}>
        lag 1 = <b style={{ color: ACCENT, opacity: 1 }}>{item.display.lag1Acf}</b>
        <span aria-hidden="true"> · </span>
        descriptive ±1.96/√M = ±{item.display.acfBand}
      </div>
      <svg
        aria-label={`ARX one-step residual autocorrelation for ${item.key}; descriptive band plus or minus ${item.display.acfBand}`}
        role="img"
        style={{ display: "block", height: "auto", overflow: "visible", width: "100%" }}
        viewBox={`0 0 ${width} ${height}`}
      >
        <line x1={xStart} y1={yStart} x2={xStart} y2={yEnd} stroke="currentColor" strokeOpacity="0.32" />
        <line x1={xStart} y1={zeroY} x2={xEnd} y2={zeroY} stroke="currentColor" strokeOpacity="0.42" />
        {[upperBand, lowerBand].map((y) => (
          <line
            key={y}
            x1={xStart}
            y1={y}
            x2={xEnd}
            y2={y}
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeOpacity="0.45"
          />
        ))}
        <text x="1" y={yStart + 3} fill="currentColor" fontSize="8.5" opacity="0.58">0.6</text>
        <text x="0" y={yEnd + 2} fill="currentColor" fontSize="8.5" opacity="0.58">−0.6</text>
        {item.acf.values.map((value, index) => {
          const lag = item.acf.lagsSamples[index];
          const x = scale(Number(lag), DATA.axes.acfLagSamples, xStart, xEnd);
          const y = scale(Number(value), DATA.axes.acf, yEnd, yStart);
          const crossing = crossingSet.has(lag);
          return (
            <g key={lag}>
              <line
                x1={x}
                y1={zeroY}
                x2={x}
                y2={y}
                stroke="currentColor"
                strokeOpacity={crossing ? 0.78 : 0.5}
                strokeWidth={crossing ? 1.35 : 1}
              />
              <circle cx={x} cy={y} fill={crossing ? ACCENT : "currentColor"} opacity={crossing ? 1 : 0.66} r={crossing ? 2.4 : 1.8} />
            </g>
          );
        })}
        <text x={xStart - 2} y={height - 8} fill="currentColor" fontSize="8.5" opacity="0.58">1</text>
        <text x={scale(10, DATA.axes.acfLagSamples, xStart, xEnd) - 5} y={height - 8} fill="currentColor" fontSize="8.5" opacity="0.58">10</text>
        <text x={xEnd - 9} y={height - 8} fill="currentColor" fontSize="8.5" opacity="0.58">20</text>
        <text x={xEnd - 96} y={height - 8} fill="currentColor" fontSize="8.5" opacity="0.58">lag k (samples)</text>
      </svg>
    </section>
  );
}

function ManeuverCard({ item }: { item: X8ValidationManeuver }) {
  return (
    <article
      className="x8vd-card"
      style={{
        background: "var(--panel)",
        border: strongBorder,
        borderRadius: 10,
        minWidth: 0,
        padding: "11px 10px 10px",
      }}
    >
      <div style={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: "3px 9px", justifyContent: "space-between" }}>
        <strong className="x8vd-card-title" style={{ fontSize: 13.5 }}>{item.key} · M={item.scoredSamples}</strong>
        <span style={{ ...labelMuted, fontSize: 9.5 }}>untouched maneuver</span>
      </div>

      <ModelLegend />

      <div
        style={{
          border,
          borderRadius: 7,
          display: "grid",
          gap: 4,
          padding: "6px 8px",
        }}
      >
        <NrmseRow
          ar2={item.display.oneStepNrmse.ar2}
          arx={item.display.oneStepNrmse.arx}
          label="NRMSE · one step"
        />
        <NrmseRow
          ar2={item.display.freeRunNrmse.ar2}
          arx={item.display.freeRunNrmse.arx}
          label="NRMSE · free run"
        />
      </div>

      <TimeTrace
        ar2={item.traces.ar2_one_step_residual_rad_s}
        arx={item.traces.arx_one_step_residual_rad_s}
        domain={DATA.axes.oneStepResidualRadS}
        time={item.traces.t_s}
        title="one-step residual e1 (rad/s)"
      />
      <TimeTrace
        ar2={item.traces.ar2_free_run_error_rad_s}
        arx={item.traces.arx_free_run_error_rad_s}
        domain={DATA.axes.freeRunErrorRadS}
        time={item.traces.t_s}
        title="free-run error ef (rad/s)"
      />
      <AcfPlot item={item} />
    </article>
  );
}

function MacroBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="x8vd-macro-badge"
      style={{
        border: `1.4px solid ${ACCENT}`,
        borderRadius: 999,
        color: ACCENT,
        flex: "1 1 245px",
        fontSize: 11.5,
        fontWeight: 750,
        padding: "6px 10px",
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

export default function X8ValidationDiagnostics() {
  return (
    <figure
      style={{
        color: "currentColor",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.3,
        margin: 0,
        maxWidth: 760,
        minWidth: 0,
        width: "100%",
      }}
    >
      <style>{`
        @media (max-width: 420px) {
          .x8vd-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .x8vd-card { padding: 11px 8px 10px !important; }
          .x8vd-card-title { font-size: 14px !important; }
          .x8vd-legend { align-items: flex-start !important; flex-direction: column; gap: 4px !important; }
          .x8vd-macro-badge { flex-basis: 100% !important; font-size: 11px !important; }
          .x8vd-provenance { font-size: 10.5px !important; line-height: 1.45; }
        }
      `}</style>

      <header
        style={{
          alignItems: "baseline",
          borderBottom: border,
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 12px",
          justifyContent: "space-between",
          marginBottom: 9,
          paddingBottom: 8,
        }}
      >
        <strong style={{ fontSize: 15 }}>Skywalker X8 · untouched validation</strong>
        <span style={{ ...labelMuted, fontSize: 10 }}>two files · separate state and ACF boundaries</span>
      </header>

      <div
        className="x8vd-grid"
        style={{
          display: "grid",
          gap: 9,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        {DATA.maneuvers.map((item) => <ManeuverCard item={item} key={item.file} />)}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
        <MacroBadge>macro NRMSE: {DATA.macro.displayOneStepPercent}% lower · one step</MacroBadge>
        <MacroBadge>macro NRMSE: {DATA.macro.displayFreeRunPercent}% lower · free run</MacroBadge>
      </div>

      <div
        style={{
          alignItems: "center",
          border: strongBorder,
          borderRadius: 8,
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 10px",
          justifyContent: "center",
          marginTop: 8,
          padding: "7px 10px",
          textAlign: "center",
        }}
      >
        <strong style={{ color: ACCENT, fontSize: 12.5 }}>{DATA.macro.adequacy}</strong>
        <span style={{ ...labelMuted, fontSize: 10.5 }}>
          band crossings are diagnostic, not a formal whiteness test
        </span>
      </div>

      <figcaption className="x8vd-provenance" style={{ ...labelMuted, fontSize: 9.5, marginTop: 7, textAlign: "center" }}>
        X8 Version {DATA.dataset.version} · {DATA.dataset.license} · DOI {DATA.dataset.doi.replace("https://doi.org/", "")}
      </figcaption>
    </figure>
  );
}
