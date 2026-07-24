import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * DpiCeilingStack — the data-processing inequality read as an ML pipeline.
 *
 * A bottom-up architecture stack (playbook rule 5): raw data at the bottom,
 * prediction at the top, upward data-flow arrows labeled "processing". To the
 * right, one horizontal bar per stage on a shared bits axis showing how much
 * each stage still knows about the label Y: I(X;Y) = 0.811 for the raw data
 * (amber, touching the ceiling), then non-increasing bars for the processed
 * features and the prediction (blue). A dashed vertical line at 0.811 is the
 * ceiling: I(·;Y) <= I(X;Y).
 *
 * One idea: no layer of a pipeline rises above the information the raw data
 * had about the label.
 */

const W = 640;
const HGT = 344;

// stack geometry
const BOX_X = 24;
const BOX_W = 128;
const BOX_CX = BOX_X + BOX_W / 2; // 88
const BOX_H = 40;
const ROW_Y0 = 66;
const PITCH = 68;

// bar geometry
const BAR_X0 = 270; // pixel for 0 bits
const BAR_SCALE = 330; // px per bit
const xOf = (v: number) => BAR_X0 + v * BAR_SCALE;
const BAR_H = 22;

const CEIL = 0.811;
const CEIL_X = xOf(CEIL);

const AXIS_Y = 320;
const TICKS = [0, 0.2, 0.4, 0.6];

type Row = {
  key: string;
  color: string;
  name: React.ReactNode; // box label
  mi: string; // TeX for I(stage;Y)
  value: number;
};

const ROWS: Row[] = [
  {
    key: "yhat",
    color: SUPPORT,
    name: (
      <>
        prediction&nbsp;
        <M tex={String.raw`\textcolor{${SUPPORT}}{\hat{Y}}`} />
      </>
    ),
    mi: String.raw`\textcolor{${SUPPORT}}{I(\hat{Y};Y)}`,
    value: 0.55,
  },
  {
    key: "t2",
    color: SUPPORT,
    name: (
      <>
        feature&nbsp;
        <M tex={String.raw`\textcolor{${SUPPORT}}{T_2}`} />
      </>
    ),
    mi: String.raw`\textcolor{${SUPPORT}}{I(T_2;Y)}`,
    value: 0.61,
  },
  {
    key: "t1",
    color: SUPPORT,
    name: (
      <>
        feature&nbsp;
        <M tex={String.raw`\textcolor{${SUPPORT}}{T_1}`} />
      </>
    ),
    mi: String.raw`\textcolor{${SUPPORT}}{I(T_1;Y)}`,
    value: 0.72,
  },
  {
    key: "x",
    color: ACCENT,
    name: (
      <>
        data&nbsp;
        <M tex={String.raw`\textcolor{${ACCENT}}{X}`} />
      </>
    ),
    mi: String.raw`\textcolor{${ACCENT}}{I(X;Y)}`,
    value: 0.811,
  },
];

const rowY = (i: number) => ROW_Y0 + i * PITCH;

export default function DpiCeilingStack() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: HGT,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* upward data-flow arrows between boxes */}
        {[0, 1, 2].map((j) => {
          const yBottom = rowY(j + 1) - BOX_H / 2; // top edge of lower box
          const yTop = rowY(j) + BOX_H / 2 + 2; // just below upper box
          return (
            <g key={`arr${j}`}>
              <line
                x1={BOX_CX}
                y1={yBottom}
                x2={BOX_CX}
                y2={yTop + 6}
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.5"
              />
              <path
                d={`M${BOX_CX} ${yTop} l -4 8 l 8 0 Z`}
                fill="currentColor"
                opacity="0.5"
              />
            </g>
          );
        })}

        {/* boxes */}
        {ROWS.map((r, i) => {
          const y = rowY(i) - BOX_H / 2;
          return (
            <rect
              key={r.key}
              x={BOX_X}
              y={y}
              width={BOX_W}
              height={BOX_H}
              rx="8"
              fill={r.color}
              fillOpacity="0.1"
              stroke={r.color}
              strokeWidth="1.6"
            />
          );
        })}

        {/* bits axis */}
        <line
          x1={BAR_X0}
          y1={AXIS_Y}
          x2={600}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.6"
        />
        <path d="M600 320 l -7 -3 l 0 6 Z" fill="currentColor" opacity="0.6" />
        {TICKS.map((v) => (
          <g key={v}>
            <line
              x1={xOf(v)}
              y1={AXIS_Y}
              x2={xOf(v)}
              y2={AXIS_Y + 5}
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <text
              x={xOf(v)}
              y={AXIS_Y + 18}
              textAnchor="middle"
              fontSize="11"
              fill="currentColor"
              opacity="0.7"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text
          x={598}
          y={AXIS_Y - 8}
          textAnchor="end"
          fontSize="11"
          fill="currentColor"
          opacity="0.5"
          fontStyle="italic"
        >
          bits
        </text>

        {/* bars */}
        {ROWS.map((r, i) => {
          const y = rowY(i) - BAR_H / 2;
          return (
            <g key={`bar${r.key}`}>
              <rect
                x={BAR_X0}
                y={y}
                width={xOf(r.value) - BAR_X0}
                height={BAR_H}
                rx="3"
                fill={r.color}
                fillOpacity="0.85"
              />
              <text
                x={xOf(r.value) + 7}
                y={rowY(i) + 4}
                textAnchor="start"
                fontSize="11.5"
                fontWeight="600"
                fill={r.color}
              >
                {r.value.toFixed(3)}
              </text>
            </g>
          );
        })}

        {/* the ceiling: dashed vertical at I(X;Y) = 0.811 */}
        <line
          x1={CEIL_X}
          y1={44}
          x2={CEIL_X}
          y2={AXIS_Y}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="4 4"
          opacity="0.7"
        />
      </svg>

      {/* box labels (KaTeX overlay) */}
      {ROWS.map((r, i) => (
        <div
          key={`lbl${r.key}`}
          style={{
            position: "absolute",
            left: BOX_CX,
            top: rowY(i),
            transform: "translate(-50%, -50%)",
            whiteSpace: "nowrap",
            color: r.color,
            fontWeight: 600,
          }}
        >
          {r.name}
        </div>
      ))}

      {/* I(stage; Y) expression, right-aligned in the gap before each bar */}
      {ROWS.map((r, i) => (
        <div
          key={`mi${r.key}`}
          style={{
            position: "absolute",
            left: BAR_X0 - 10,
            top: rowY(i),
            transform: "translate(-100%, -50%)",
            whiteSpace: "nowrap",
          }}
        >
          <M tex={r.mi} />
        </div>
      ))}

      {/* processing labels beside the upward arrows */}
      {[0, 1, 2].map((j) => (
        <div
          key={`proc${j}`}
          style={{
            position: "absolute",
            left: BOX_CX + 12,
            top: (rowY(j) + rowY(j + 1)) / 2,
            transform: "translateY(-50%)",
            whiteSpace: "nowrap",
            fontStyle: "italic",
            fontSize: 11.5,
            opacity: 0.6,
          }}
        >
          processing
        </div>
      ))}

      {/* ceiling label, right-aligned to the dashed line */}
      <div
        style={{
          position: "absolute",
          left: CEIL_X + 4,
          top: 26,
          transform: "translate(-100%, -50%)",
          whiteSpace: "nowrap",
        }}
      >
        <M tex={String.raw`\text{ceiling: } I(\cdot\,;Y)\le \textcolor{${ACCENT}}{I(X;Y)}`} />
      </div>
    </div>
  );
}
