import { M } from "../M";
import { ACCENT } from "../palette";

/**
 * Co2KernelLedger — the eleven fitted hyperparameters of the Mauna Loa
 * composite kernel, grouped by the claim each term makes, every value paired
 * with what it says about the atmosphere. One idea: the evidence alone turned
 * eleven free numbers into a physical description.
 *
 * Color roles: amber = the fitted values (the figure's subject); everything
 * else is currentColor at graded opacity.
 */

const A = ACCENT;
const RULE = "1px solid color-mix(in srgb, currentColor 22%, transparent)";
const COLS = "150px 1fr";
const SUBCOLS = "34px 118px 1fr";

const HEAD: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 0.5,
  opacity: 0.45,
  fontWeight: 600,
  textTransform: "uppercase",
};

const READ: React.CSSProperties = {
  fontSize: 12.5,
  opacity: 0.66,
  lineHeight: 1.35,
};

type Row = { tex: string; value: string; unit?: string; reading: string };
type Group = { tex: string; name: string; form: string; rows: Row[]; note?: React.ReactNode };

const GROUPS: Group[] = [
  {
    tex: String.raw`k_1`,
    name: "trend",
    form: "SE",
    rows: [
      { tex: String.raw`\theta_1`, value: "66", unit: "ppm", reading: "a tens-of-ppm phenomenon, not a wiggle" },
      { tex: String.raw`\theta_2`, value: "67", unit: "yr", reading: "the trend's habit spans ~7 decades" },
    ],
  },
  {
    tex: String.raw`k_2`,
    name: "seasonal",
    form: "periodic × SE",
    rows: [
      { tex: String.raw`\theta_3`, value: "2.4", unit: "ppm", reading: "the annual sawtooth's amplitude" },
      { tex: String.raw`\theta_4`, value: "90", unit: "yr", reading: "shape drifts on a ~90-yr scale — twice the record" },
      { tex: String.raw`\theta_5`, value: "1.3", reading: "smooth within the year: one peak, one trough" },
    ],
  },
  {
    tex: String.raw`k_3`,
    name: "medium term",
    form: "rational quadratic",
    rows: [
      { tex: String.raw`\theta_6`, value: "0.66", unit: "ppm", reading: "sub-ppm wanderings" },
      { tex: String.raw`\theta_7`, value: "1.2", unit: "yr", reading: "a typical wiggle lasts about a year" },
      { tex: String.raw`\theta_8`, value: "0.78", reading: "wiggles at many timescales at once" },
    ],
  },
  {
    tex: String.raw`k_4`,
    name: "noise",
    form: "SE + iid",
    rows: [
      { tex: String.raw`\theta_9`, value: "0.18", unit: "ppm", reading: "correlated, weather-scale part" },
      { tex: String.raw`\theta_{10}`, value: "1.6", unit: "months", reading: "adjacent months share their weather" },
      { tex: String.raw`\theta_{11}`, value: "0.19", unit: "ppm", reading: "independent measurement error" },
    ],
    note: (
      <>
        total noise <M size={12.5} tex={String.raw`\sqrt{\theta_9^2 + \theta_{11}^2} = \textcolor{${A}}{0.26}`} />{" "}
        ppm — clean to a quarter of a ppm
      </>
    ),
  },
];

function ValueCell({ value, unit }: { value: string; unit?: string }) {
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <span style={{ color: A, fontWeight: 600, fontSize: 15, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      {unit ? <span style={{ color: A, opacity: 0.72, fontSize: 12.5, marginLeft: 4 }}>{unit}</span> : null}
    </span>
  );
}

export default function Co2KernelLedger() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 690, margin: "0 auto" }}>
      <div style={{ borderTop: RULE, borderBottom: RULE }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            columnGap: 18,
            padding: "7px 0 6px",
          }}
        >
          <div style={HEAD}>kernel term</div>
          <div style={{ display: "grid", gridTemplateColumns: SUBCOLS, columnGap: 14 }}>
            <div style={HEAD} />
            <div style={{ ...HEAD, color: A, opacity: 0.85 }}>fitted</div>
            <div style={HEAD}>reads as</div>
          </div>
        </div>

        {GROUPS.map((g) => (
          <div
            key={g.name}
            style={{
              display: "grid",
              gridTemplateColumns: COLS,
              columnGap: 18,
              alignItems: "start",
              padding: "10px 0",
              borderTop: RULE,
            }}
          >
            <div style={{ paddingTop: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <M size={15} tex={g.tex} />
                <span style={{ fontWeight: 600 }}>{g.name}</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.45, marginTop: 2 }}>{g.form}</div>
            </div>

            <div>
              <div style={{ display: "grid", gridTemplateColumns: SUBCOLS, columnGap: 14, rowGap: 6, alignItems: "baseline" }}>
                {g.rows.map((r) => (
                  <div key={r.tex} style={{ display: "contents" }}>
                    <div>
                      <M size={14} tex={r.tex} />
                    </div>
                    <ValueCell value={r.value} unit={r.unit} />
                    <div style={READ}>{r.reading}</div>
                  </div>
                ))}
              </div>
              {g.note ? <div style={{ ...READ, marginTop: 8, paddingLeft: 48 }}>{g.note}</div> : null}
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 13, fontSize: 12.5, opacity: 0.62, lineHeight: 1.45 }}>
        all eleven set by maximizing <M size={12.5} tex={String.raw`\log p(y \mid X, \theta)`} /> — no validation set
        <span style={{ opacity: 0.75 }}> · Rasmussen &amp; Williams §5.4.3</span>
      </div>
    </div>
  );
}
