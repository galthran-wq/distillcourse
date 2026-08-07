import { ACCENT, SUPPORT } from "../palette";

/**
 * PoissonCalibrationVerdict — the insurance case-study verdict, recreating the
 * IDEA of Murphy (PML, Fig. 12.2) schematically (never the drawing).
 *
 * Left: a calibration panel. x = predicted claim frequency (bins ordered by
 * risk), y = observed claim frequency; the dashed diagonal is perfect
 * calibration. The blue ridge polyline hugs the diagonal at low risk and sags
 * below it in the high-risk bins; the amber Poisson-GLM polyline tracks the
 * diagonal. Right: the totals tally on the test set — ridge 10,693, Poisson
 * 11,930, actual 11,935 (bold), with Poisson and actual adjacent to show the
 * near-match.
 *
 * One idea: the likelihood-matched loss finds the calibrated model; MSE cannot
 * tell the models apart, calibration and totals can. Amber = Poisson GLM (the
 * subject, the winner), blue = ridge.
 */

const W = 360;
const H = 300;
const PX0 = 42; // x = 0
const PX1 = 340; // x = 1
const PY0 = 244; // y = 0
const PY1 = 26; // y = 1

const xOf = (x: number) => PX0 + x * (PX1 - PX0);
const yOf = (y: number) => PY0 - y * (PY0 - PY1);

// bin centers (predicted claim frequency, schematic 0..1) ordered by risk
const BINS = [0.06, 0.15, 0.27, 0.4, 0.54, 0.7, 0.88];
// Poisson GLM: observed tracks the diagonal
const POISSON = [0.06, 0.16, 0.26, 0.41, 0.53, 0.71, 0.86];
// ridge: hugs low, sags below the diagonal at high risk
const RIDGE = [0.06, 0.14, 0.24, 0.34, 0.44, 0.55, 0.66];

const poly = (ys: number[]) =>
  BINS.map((x, i) => `${xOf(x).toFixed(1)},${yOf(ys[i]).toFixed(1)}`).join(" ");

function Swatch({ color, dashed = false }: { color: string; dashed?: boolean }) {
  return (
    <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true" style={{ flex: "none" }}>
      <line
        x1="1"
        y1="5"
        x2="25"
        y2="5"
        stroke={color}
        strokeWidth="2.6"
        strokeDasharray={dashed ? "4 3" : undefined}
        opacity={dashed ? 0.7 : 1}
      />
    </svg>
  );
}

function TallyRow({
  label,
  value,
  color,
  bold = false,
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 14,
      }}
    >
      <span style={{ color, fontWeight: bold ? 700 : 500, fontSize: 14 }}>{label}</span>
      <span
        style={{
          color,
          fontWeight: bold ? 700 : 600,
          fontSize: 22,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.5px",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function PoissonCalibrationVerdict() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 34,
        maxWidth: 640,
      }}
    >
      {/* LEFT: calibration panel */}
      <div style={{ position: "relative", width: W, height: H + 34 }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {/* faint grid at quarters */}
          {[0.25, 0.5, 0.75].map((q) => (
            <g key={`g${q}`}>
              <line x1={xOf(q)} y1={PY1} x2={xOf(q)} y2={PY0} stroke="currentColor" strokeWidth="1" opacity="0.08" />
              <line x1={PX0} y1={yOf(q)} x2={PX1} y2={yOf(q)} stroke="currentColor" strokeWidth="1" opacity="0.08" />
            </g>
          ))}

          {/* axes */}
          <line x1={PX0} y1={PY0} x2={PX1 + 6} y2={PY0} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          <line x1={PX0} y1={PY1 - 4} x2={PX0} y2={PY0} stroke="currentColor" strokeWidth="1.2" opacity="0.6" />

          {/* perfect-calibration diagonal */}
          <line
            x1={xOf(0)}
            y1={yOf(0)}
            x2={xOf(1)}
            y2={yOf(1)}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="5 4"
            opacity="0.5"
          />

          {/* ridge: hugs low, sags below the diagonal */}
          <polyline points={poly(RIDGE)} fill="none" stroke={SUPPORT} strokeWidth="2.6" />
          {BINS.map((x, i) => (
            <circle key={`r${i}`} cx={xOf(x)} cy={yOf(RIDGE[i])} r="3.6" fill={SUPPORT} />
          ))}

          {/* Poisson GLM: tracks the diagonal */}
          <polyline points={poly(POISSON)} fill="none" stroke={ACCENT} strokeWidth="2.6" />
          {BINS.map((x, i) => (
            <circle key={`p${i}`} cx={xOf(x)} cy={yOf(POISSON[i])} r="3.6" fill={ACCENT} />
          ))}

          {/* low → high risk direction on x */}
          <text x={xOf(0)} y={PY0 + 16} textAnchor="start" fontSize="10.5" fill="currentColor" opacity="0.5">
            low risk
          </text>
          <text x={xOf(1)} y={PY0 + 16} textAnchor="end" fontSize="10.5" fill="currentColor" opacity="0.5">
            high risk
          </text>
        </svg>

        {/* diagonal label */}
        <div
          style={{
            position: "absolute",
            left: 96,
            top: 96,
            transform: "rotate(-36deg)",
            transformOrigin: "left center",
            fontSize: 10.5,
            opacity: 0.55,
            whiteSpace: "nowrap",
          }}
        >
          perfect calibration
        </div>

        {/* Poisson curve label */}
        <div
          style={{
            position: "absolute",
            left: 176,
            top: 44,
            color: ACCENT,
            fontWeight: 600,
            fontSize: 12.5,
            whiteSpace: "nowrap",
          }}
        >
          Poisson GLM
        </div>

        {/* ridge curve label */}
        <div
          style={{
            position: "absolute",
            left: 210,
            top: 172,
            color: SUPPORT,
            fontWeight: 600,
            fontSize: 12.5,
            whiteSpace: "nowrap",
          }}
        >
          ridge
        </div>

        {/* y-axis title (rotated) */}
        <div
          style={{
            position: "absolute",
            left: -78,
            top: 118,
            width: 220,
            textAlign: "center",
            transform: "rotate(-90deg)",
            fontSize: 11.5,
            opacity: 0.65,
          }}
        >
          observed claim frequency
        </div>

        {/* x-axis title */}
        <div
          style={{
            position: "absolute",
            left: PX0,
            width: PX1 - PX0,
            top: PY0 + 30,
            textAlign: "center",
            fontSize: 11.5,
            opacity: 0.65,
          }}
        >
          predicted claim frequency (binned by risk)
        </div>
      </div>

      {/* RIGHT: totals tally */}
      <div style={{ minWidth: 190, flex: "1 1 190px", maxWidth: 230 }}>
        <div
          style={{
            fontSize: 10.5,
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            opacity: 0.6,
            fontWeight: 600,
            marginBottom: 14,
          }}
        >
          total claims, test set
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <TallyRow label="ridge" value="10,693" color={SUPPORT} />
          <div style={{ fontSize: 10.5, opacity: 0.5, textAlign: "right", marginTop: -4 }}>
            1,242 short
          </div>
        </div>

        {/* Poisson + actual adjacent, braced to show the near-match */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 10,
            marginTop: 16,
          }}
        >
          <div
            style={{
              width: 3,
              borderRadius: 2,
              background: "currentColor",
              opacity: 0.25,
              flex: "none",
            }}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <TallyRow label="Poisson GLM" value="11,930" color={ACCENT} />
            <TallyRow label="actual" value="11,935" color="currentColor" bold />
            <div style={{ fontSize: 10.5, opacity: 0.55, textAlign: "right", marginTop: -4 }}>
              differ by 5
            </div>
          </div>
        </div>

        {/* legend */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            fontSize: 11.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Swatch color={ACCENT} />
            <span style={{ color: ACCENT }}>Poisson GLM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Swatch color={SUPPORT} />
            <span style={{ color: SUPPORT }}>ridge</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.7 }}>
            <Swatch color="currentColor" dashed />
            <span>perfect calibration</span>
          </div>
        </div>
      </div>
    </div>
  );
}
