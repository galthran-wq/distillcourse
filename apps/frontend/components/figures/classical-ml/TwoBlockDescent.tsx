import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * TwoBlockDescent — why Lloyd's algorithm cannot climb (k-means lesson).
 * Three tiers: the distortion with its two argument blocks marked by
 * underbraces, the two half-step inequalities that each freeze one block,
 * and the measured staircase of J from the lesson's Lloyd run.
 *
 * Color roles: amber = the assignment block r (and every assignment
 * half-step), blue = the center block mu (and every update half-step).
 */

const A = ACCENT;
const B = SUPPORT;

const R = String.raw`\textcolor{${A}}{r}`;
const MU = String.raw`\textcolor{${B}}{\mu}`;

const OBJECTIVE = String.raw`J(${R}, ${MU}) \;=\; \sum_{n=1}^{N} \sum_{k=1}^{K}
  \underbrace{\textcolor{${A}}{r_{nk}}}_{\textcolor{${A}}{\substack{\text{assignment block}\\[1pt] \text{one 1 per point}}}}
  \; \big\lVert x_n - \underbrace{\textcolor{${B}}{\mu_k}}_{\textcolor{${B}}{\substack{\text{center}\\[1pt] \text{block}}}} \big\rVert^2`;

/** J after each half-step of the lesson's measured run, oldest first. */
const RUN = [809, 254, 181, 95, 56, 45];
const KIND = (i: number) => (i % 2 === 0 ? "assignment" : "update");
const COLOR = (i: number) => (i % 2 === 0 ? A : B);

// staircase geometry
const X0 = 34;
const X1 = 502;
const Y_TOP = 18;
const Y_BASE = 170;
const LO = 35;
const HI = 1000;
const TREAD = (X1 - X0) / RUN.length;
const y = (v: number) =>
  Y_BASE - ((Math.log10(v) - Math.log10(LO)) / (Math.log10(HI) - Math.log10(LO))) * (Y_BASE - Y_TOP);

function Half({ tone, label, tex }: { tone: string; label: React.ReactNode; tex: string }) {
  return (
    <>
      <div
        style={{
          borderLeft: `2.5px solid ${tone}`,
          paddingLeft: 12,
          color: tone,
          fontSize: 13,
          lineHeight: 1.4,
          alignSelf: "center",
        }}
      >
        {label}
      </div>
      <div style={{ alignSelf: "center" }}>
        <M tex={tex} size={15.5} />
      </div>
    </>
  );
}

export default function TwoBlockDescent() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 660,
        margin: "0 auto",
      }}
    >
      {/* tier 1 — one objective, two blocks of variables */}
      <div style={{ textAlign: "center" }}>
        <M display size={16.5} tex={OBJECTIVE} />
      </div>

      {/* tier 2 — one inequality per half-step, each freezing one block */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          columnGap: 26,
          rowGap: 12,
          justifyContent: "center",
          alignItems: "center",
          marginTop: 14,
        }}
      >
        <Half
          tone={A}
          label={
            <>
              <b>assignment step</b>
              <br />
              minimize over <M tex={R} size={13} />, <M tex={MU} size={13} /> frozen
            </>
          }
          tex={String.raw`J\big(\textcolor{${A}}{r^{(t+1)}}, \textcolor{${B}}{\mu^{(t)}}\big) \;\le\; J\big(\textcolor{${A}}{r^{(t)}}, \textcolor{${B}}{\mu^{(t)}}\big)`}
        />
        <Half
          tone={B}
          label={
            <>
              <b>update step</b>
              <br />
              minimize over <M tex={MU} size={13} />, <M tex={R} size={13} /> frozen
            </>
          }
          tex={String.raw`J\big(\textcolor{${A}}{r^{(t+1)}}, \textcolor{${B}}{\mu^{(t+1)}}\big) \;\le\; J\big(\textcolor{${A}}{r^{(t+1)}}, \textcolor{${B}}{\mu^{(t)}}\big)`}
        />
      </div>

      {/* tier 3 — the measured run: one tread per half-step */}
      <svg viewBox="0 0 520 226" width="100%" style={{ marginTop: 12 }} aria-hidden="true">
        <line x1={X0} y1={Y_TOP - 4} x2={X0} y2={Y_BASE} stroke="currentColor" strokeOpacity="0.3" />
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" strokeOpacity="0.3" />
        <text
          x={X0 - 16}
          y={(Y_TOP + Y_BASE) / 2}
          textAnchor="middle"
          fontSize="14"
          fontStyle="italic"
          fill="currentColor"
        >
          J
        </text>

        {RUN.map((v, i) => {
          const xL = X0 + i * TREAD;
          const c = COLOR(i);
          return (
            <g key={i}>
              {i > 0 && (
                <line
                  x1={xL}
                  y1={y(RUN[i - 1])}
                  x2={xL}
                  y2={y(v)}
                  stroke={c}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              )}
              <line
                x1={xL}
                y1={y(v)}
                x2={xL + TREAD}
                y2={y(v)}
                stroke={c}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <text
                x={xL + TREAD / 2}
                y={y(v) - 6}
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="600"
                fill={c}
              >
                {v}
              </text>
              <text x={xL + TREAD / 2} y={186} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6">
                {i + 1}
              </text>
              <text x={xL + TREAD / 2} y={199} textAnchor="middle" fontSize="10" fill={c}>
                {KIND(i)}
              </text>
            </g>
          );
        })}

        <text x={(X0 + X1) / 2} y={218} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.5">
          half-steps
        </text>

        <text x={X1} y={46} textAnchor="end" fontSize="11.5" fill="currentColor" opacity="0.6">
          each half-step minimizes one block,
        </text>
        <text x={X1} y={62} textAnchor="end" fontSize="11.5" fill="currentColor" opacity="0.6">
          so the staircase can only go down
        </text>
        <text x={X1} y={78} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.4">
          (J on a log axis)
        </text>
      </svg>
    </div>
  );
}
