import type { ReactNode } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * SzilardFreeEnergy — where the kT ln 2 enters the ledger.
 *
 * Three states of the Szilard box in one aligned ledger grid: no partition;
 * partition in with the side unknown; partition in with the side known. Each
 * column carries the same rows — the box graphic, the two entropy entries
 * (position, side variable), then the totals ΔS and ΔF — so the eye reads
 * down the accounts and across the states.
 *
 * Color roles: amber = the informational entry that changes (the molecule,
 * the measured side in memory, the side variable it zeroes, and the free
 * energy that appears), blue = the two entries that cancel in panel 2,
 * currentColor = boxes, partition and ledger structure.
 *
 * One idea: confinement alone buys nothing, because the unknown side pays
 * back exactly what confinement removed; only the measurement creates F.
 */

const RULE = "rgba(128,128,128,0.32)";
const BOX_FILL = "rgba(128,128,128,0.05)";

// ---- the box graphic: identical frame in all three panels -------------------
const VB_W = 218;
const VB_H = 88;
const BX = 4;
const BY = 8;
const BW = 148;
const BH = 72;
const MID = BX + BW / 2; // partition position
const LEFT_C = BX + BW / 4;
const RIGHT_C = BX + (3 * BW) / 4;
const MOL_Y = 40;
const P_Y = 73; // probability labels inside the box
const MEM_X = 170;
const MEM_Y = 28;
const MEM_W = 34;
const MEM_H = 28;

function Molecule({ cx, faded }: { cx: number; faded?: boolean }) {
  return (
    <circle
      cx={cx}
      cy={MOL_Y}
      r="6.5"
      fill={ACCENT}
      // faded = "half-present in both halves": a solid amber ring keeps the
      // role legible on dark paper, where a low-opacity fill alone goes muddy
      fillOpacity={faded ? 0.38 : 1}
      stroke={ACCENT}
      strokeWidth={faded ? 1.6 : 1}
      strokeOpacity="1"
    />
  );
}

function BoxGraphic({ state }: { state: 1 | 2 | 3 }) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      fontFamily="system-ui, sans-serif"
      aria-hidden="true"
    >
      {/* the cylinder */}
      <rect
        x={BX}
        y={BY}
        width={BW}
        height={BH}
        rx="6"
        fill={BOX_FILL}
        stroke="currentColor"
        strokeWidth="1.8"
      />

      {/* the partition */}
      {state > 1 && (
        <line
          x1={MID}
          y1={BY}
          x2={MID}
          y2={BY + BH}
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )}

      {state === 1 && (
        <>
          <path
            d="M20,46 C 40,14 60,50 84,28 S 110,18 126,40"
            fill="none"
            stroke={ACCENT}
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.65"
          />
          <Molecule cx={126} />
          <text x={MID} y={P_Y} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.55">
            roams the whole box
          </text>
        </>
      )}

      {state === 2 && (
        <>
          <Molecule cx={LEFT_C} faded />
          <Molecule cx={RIGHT_C} faded />
          <text x={LEFT_C} y={P_Y} textAnchor="middle" fontSize="10.5" fill={SUPPORT} fontWeight="600">
            p = ½
          </text>
          <text x={RIGHT_C} y={P_Y} textAnchor="middle" fontSize="10.5" fill={SUPPORT} fontWeight="600">
            p = ½
          </text>
        </>
      )}

      {state === 3 && (
        <>
          <Molecule cx={LEFT_C} />
          <text x={LEFT_C} y={P_Y} textAnchor="middle" fontSize="10.5" fill={ACCENT} fontWeight="600">
            p = 1
          </text>
          <text x={RIGHT_C} y={P_Y} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.5">
            p = 0
          </text>
        </>
      )}

      {/* the memory cell beside the box: empty until the measurement */}
      <rect
        x={MEM_X}
        y={MEM_Y}
        width={MEM_W}
        height={MEM_H}
        rx="5"
        fill="none"
        stroke={state === 3 ? ACCENT : "currentColor"}
        strokeWidth={state === 3 ? 1.8 : 1.2}
        strokeDasharray={state === 3 ? undefined : "3 3"}
        opacity={state === 3 ? 1 : 0.4}
      />
      {state === 3 && (
        <text
          x={MEM_X + MEM_W / 2}
          y={MEM_Y + 20}
          textAnchor="middle"
          fontSize="15"
          fontWeight="700"
          fill={ACCENT}
        >
          L
        </text>
      )}
      <text
        x={MEM_X + MEM_W / 2}
        y={MEM_Y + MEM_H + 13}
        textAnchor="middle"
        fontSize="9.5"
        fill={state === 3 ? ACCENT : "currentColor"}
        opacity={state === 3 ? 0.9 : 0.45}
      >
        memory
      </text>
    </svg>
  );
}

// ---- the three states ------------------------------------------------------
const S_POS = String.raw`S_{\text{pos}}`;
const S_CONF = String.raw`S_{\text{pos}} - k\ln 2`;

type Panel = {
  header: string;
  state: 1 | 2 | 3;
  posSign?: string;
  pos: string;
  sideSign?: string;
  side: string;
  dS: string;
  dF: string;
  verdict: [ReactNode, ReactNode];
  verdictColor?: string;
  verdictBold?: boolean;
};

const PANELS: Panel[] = [
  {
    header: "no partition",
    state: 1,
    pos: S_POS,
    side: "0",
    dS: "0",
    dF: "0",
    verdict: ["reference state", ""],
  },
  {
    header: "partition in, side unknown",
    state: 2,
    posSign: "−",
    pos: String.raw`\textcolor{${SUPPORT}}{${S_CONF}}`,
    sideSign: "+",
    side: String.raw`\textcolor{${SUPPORT}}{+\,k\ln 2}`,
    dS: "0",
    dF: "0",
    verdict: ["the − and + cancel exactly:", "no work available"],
    verdictColor: SUPPORT,
  },
  {
    header: "partition in, side known",
    state: 3,
    pos: S_CONF,
    side: String.raw`\textcolor{${ACCENT}}{0}`,
    dS: String.raw`\textcolor{${ACCENT}}{-\,k\ln 2}`,
    dF: String.raw`\textcolor{${ACCENT}}{+\,kT\ln 2}`,
    verdict: [
      "the measurement bought",
      <>
        <M tex={String.raw`kT\ln 2`} size={12.5} /> of work
      </>,
    ],
    verdictColor: ACCENT,
    verdictBold: true,
  },
];

// ---- layout ----------------------------------------------------------------
const cellStyle = (i: number): React.CSSProperties => ({
  padding: "0 15px",
  // transparent border on the first column keeps all three content boxes the
  // same width, so the three box graphics render at exactly the same scale
  borderLeft: i > 0 ? `1px solid ${RULE}` : "1px solid transparent",
});

function LedgerRow({
  sign,
  signColor,
  label,
  value,
}: {
  sign?: string;
  signColor?: string;
  label: ReactNode;
  value: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "11px 1fr auto",
        alignItems: "baseline",
        columnGap: 4,
        padding: "3px 0",
      }}
    >
      <span style={{ color: signColor, fontWeight: 700, fontSize: 13 }}>{sign ?? ""}</span>
      <span style={{ fontSize: 12, opacity: 0.62 }}>{label}</span>
      <span style={{ textAlign: "right" }}>
        <M tex={value} size={13} />
      </span>
    </div>
  );
}

export default function SzilardFreeEnergy() {
  const cells = (id: string, render: (p: Panel, i: number) => ReactNode) =>
    PANELS.map((p, i) => (
      <div key={`${id}-${i}`} style={cellStyle(i)}>
        {render(p, i)}
      </div>
    ));

  const rule = (id: string, top = 8, bottom = 4) =>
    cells(id, () => (
      <div style={{ borderTop: `1px solid ${RULE}`, marginTop: top, marginBottom: bottom }} />
    ));

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 748,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          columnGap: 0,
        }}
      >
        {/* headers */}
        {cells("h", (p) => (
          <div style={{ fontWeight: 600, fontSize: 13, minHeight: 34, lineHeight: 1.3 }}>
            {p.header}
          </div>
        ))}

        {/* the box */}
        {cells("g", (p) => <BoxGraphic state={p.state} />)}

        {rule("r1", 6, 2)}

        {/* entropy entries */}
        {cells("pos", (p) => (
          <LedgerRow sign={p.posSign} signColor={SUPPORT} label="position" value={p.pos} />
        ))}
        {cells("side", (p) => (
          <LedgerRow
            sign={p.sideSign}
            signColor={SUPPORT}
            label="side variable"
            value={p.side}
          />
        ))}

        {rule("r2", 4, 2)}

        {/* totals */}
        {cells("ds", (p) => (
          <LedgerRow
            label={
              <>
                total <M tex={String.raw`\Delta S`} size={12} />
              </>
            }
            value={p.dS}
          />
        ))}
        {cells("df", (p) => (
          <LedgerRow
            label={
              <>
                free energy <M tex={String.raw`\Delta F`} size={12} />
              </>
            }
            value={p.dF}
          />
        ))}

        {/* verdicts */}
        {cells("v", (p) => (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              lineHeight: 1.35,
              minHeight: 32,
              color: p.verdictColor,
              opacity: p.verdictColor ? 1 : 0.55,
              fontWeight: p.verdictBold ? 700 : 400,
            }}
          >
            <div>{p.verdict[0]}</div>
            <div>{p.verdict[1]}</div>
          </div>
        ))}
      </div>

      {/* one idea */}
      <div
        style={{
          marginTop: 4,
          paddingTop: 10,
          borderTop: `1px solid ${RULE}`,
          fontSize: 13,
          textAlign: "center",
          lineHeight: 1.45,
        }}
      >
        <span style={{ opacity: 0.75 }}>the </span>
        <b style={{ color: ACCENT }}>measurement</b>
        <span style={{ opacity: 0.75 }}>, not the partition, creates the free energy the expansion spends</span>
      </div>
    </div>
  );
}
