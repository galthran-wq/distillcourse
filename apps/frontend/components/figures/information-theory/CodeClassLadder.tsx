import { Fragment } from "react";
import { ACCENT } from "../palette";

/**
 * The four nested classes of codes and one example code for each. Left: four
 * concentric rounded rectangles — all codes ⊃ nonsingular ⊃ uniquely decodable
 * ⊃ instantaneous (prefix), the innermost tinted amber. Right: the Cover &
 * Thomas Table 5.1 codes, one column per region, headers numbered with the
 * same badges that sit in the bands. One idea: prefix codes are the innermost
 * of four nested classes.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const AMBER_FILL = "rgba(226, 144, 58, 0.12)";

/** codes by column: singular | nonsingular not UD | UD not instantaneous | instantaneous */
const COLUMNS: { head: string[]; codes: string[] }[] = [
  { head: ["singular"], codes: ["0", "0", "0", "0"] },
  { head: ["nonsingular,", "not UD"], codes: ["0", "010", "01", "10"] },
  { head: ["UD, not", "instantaneous"], codes: ["10", "00", "11", "110"] },
  { head: ["instantaneous"], codes: ["0", "10", "110", "111"] },
];

function SvgBadge({ x, y, n, accent = false }: { x: number; y: number; n: number; accent?: boolean }) {
  const c = accent ? ACCENT : "currentColor";
  return (
    <g>
      <circle cx={x} cy={y} r={8.5} fill="none" stroke={c} strokeWidth="1.2" strokeOpacity={accent ? 1 : 0.65} />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill={c}
        opacity={accent ? 1 : 0.75}
      >
        {n}
      </text>
    </g>
  );
}

function Badge({ n, accent = false }: { n: number; accent?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 17,
        height: 17,
        borderRadius: "50%",
        border: `1.2px solid ${accent ? ACCENT : "currentColor"}`,
        color: accent ? ACCENT : "currentColor",
        opacity: accent ? 1 : 0.7,
        fontSize: 10.5,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {n}
    </span>
  );
}

/** Band label inside a concentric rectangle. */
function BandLabel({ y, text }: { y: number; text: string }) {
  return (
    <text x={134} y={y} textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.8">
      {text}
    </text>
  );
}

export default function CodeClassLadder() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        gap: "20px 34px",
        maxWidth: 720,
      }}
    >
      {/* left: the four nested classes */}
      <svg
        viewBox="0 0 268 236"
        width="252"
        role="img"
        aria-label="Four concentric rectangles: all codes, nonsingular, uniquely decodable, instantaneous (prefix)"
      >
        <rect x="6" y="6" width="256" height="216" rx="9" fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.55" />
        <rect x="24" y="28" width="220" height="172" rx="9" fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.55" />
        <rect x="42" y="50" width="184" height="128" rx="8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.55" />
        <rect
          x="60"
          y="72"
          width="148"
          height="84"
          rx="8"
          fill={ACCENT}
          fillOpacity="0.12"
          stroke={ACCENT}
          strokeWidth="1.6"
        />

        <BandLabel y={22} text="all codes" />
        <BandLabel y={44} text="nonsingular" />
        <BandLabel y={66} text="uniquely decodable" />
        <text x={134} y={106} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={ACCENT}>
          instantaneous
        </text>
        <text x={134} y={121} textAnchor="middle" fontSize="12.5" fontWeight="600" fill={ACCENT}>
          (prefix)
        </text>

        <SvgBadge x={134} y={211} n={1} />
        <SvgBadge x={134} y={189} n={2} />
        <SvgBadge x={134} y={167} n={3} />
        <SvgBadge x={134} y={143} n={4} accent />
      </svg>

      {/* right: one example code per region */}
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 74px 92px 100px 92px",
            border: "1px solid currentColor",
            borderRadius: 6,
            padding: "6px 8px 8px",
            justifyContent: "start",
            width: "fit-content",
          }}
        >
          <span />
          {COLUMNS.map((col, j) => (
            <span
              key={j}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "0 4px 6px",
                fontSize: 11.5,
                lineHeight: 1.25,
                textAlign: "center",
                color: j === 3 ? ACCENT : undefined,
                opacity: j === 3 ? 1 : 0.7,
                fontWeight: j === 3 ? 600 : 400,
                backgroundColor: j === 3 ? AMBER_FILL : undefined,
                borderRadius: j === 3 ? "5px 5px 0 0" : undefined,
              }}
            >
              <Badge n={j + 1} accent={j === 3} />
              <span>
                {col.head.map((line, k) => (
                  <Fragment key={k}>
                    {k > 0 && <br />}
                    {line}
                  </Fragment>
                ))}
              </span>
            </span>
          ))}

          {[0, 1, 2, 3].map((i) => (
            <Fragment key={i}>
              <span
                style={{
                  padding: "3px 10px 3px 2px",
                  textAlign: "right",
                  fontSize: 12,
                  opacity: 0.55,
                  fontStyle: "italic",
                }}
              >
                {i + 1}
              </span>
              {COLUMNS.map((col, j) => (
                <span
                  key={j}
                  style={{
                    padding: "3px 4px",
                    textAlign: "center",
                    fontFamily: MONO,
                    fontSize: 13,
                    color: j === 3 ? ACCENT : undefined,
                    backgroundColor: j === 3 ? AMBER_FILL : undefined,
                    borderRadius: j === 3 && i === 3 ? "0 0 5px 5px" : undefined,
                  }}
                >
                  {col.codes[i]}
                </span>
              ))}
            </Fragment>
          ))}
        </div>

        <div style={{ marginTop: 10, fontSize: 12.5, opacity: 0.7, maxWidth: 380 }}>
          the string <span style={{ fontFamily: MONO }}>010</span> has three parses under column 2
        </div>
      </div>
    </div>
  );
}
