import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

const role = (color: string, tex: string) =>
  String.raw`\textcolor{${color}}{${tex}}`;

const CURRENT = role(ACCENT, String.raw`1\,x[n]`);
const PREVIOUS = role(SUPPORT, String.raw`0.5\,x[n-1]`);
const RULE = String.raw`y[n]=${CURRENT}+${PREVIOUS}`;

const sums = [
  String.raw`y[0]=${role(ACCENT, "1")}+${role(SUPPORT, "0")}=${role(OK, "1")}`,
  String.raw`y[1]=${role(ACCENT, "2")}+${role(SUPPORT, "0.5")}=${role(OK, "2.5")}`,
  String.raw`y[2]=${role(ACCENT, "-1")}+${role(SUPPORT, "1")}=${role(OK, "0")}`,
  String.raw`y[3]=${role(ACCENT, "0")}+${role(SUPPORT, "-0.5")}=${role(OK, "-0.5")}`,
];

const MATRIX = String.raw`
${role(OK, String.raw`\begin{bmatrix}1\\2.5\\0\\-0.5\end{bmatrix}`)}
=
\begin{bmatrix}
${role(ACCENT, "1")}&0&0\\
${role(SUPPORT, "0.5")}&${role(ACCENT, "1")}&0\\
0&${role(SUPPORT, "0.5")}&${role(ACCENT, "1")}\\
0&0&${role(SUPPORT, "0.5")}
\end{bmatrix}
\begin{bmatrix}1\\2\\-1\end{bmatrix}`;

const calls = [
  { n: "0", current: "1", previous: "0", output: "1" },
  { n: "1", current: "2", previous: "1", output: "2.5" },
  { n: "2", current: "-1", previous: "2", output: "0" },
  { n: "3", current: "0", previous: "-1", output: "-0.5", flush: true },
];

const border = "1px solid color-mix(in srgb, currentColor 18%, transparent)";

function Panel({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        minWidth: 0,
        padding: "11px 8px 12px",
        border,
        borderRadius: 8,
        background: "var(--panel)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 21,
            height: 21,
            flex: "0 0 21px",
            border: `1.5px solid ${OK}`,
            borderRadius: "50%",
            color: OK,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {step}
        </span>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{title}</span>
      </div>
      {children}
    </section>
  );
}

function Equals() {
  return (
    <div style={{ alignSelf: "center", textAlign: "center", color: OK }}>
      <M tex="=" size={18} />
    </div>
  );
}

function SumPanel() {
  return (
    <Panel step={1} title="sum">
      <div style={{ textAlign: "center", margin: "1px 0 8px" }}>
        <M tex={RULE} size={12.5} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {sums.map((tex) => (
          <div
            key={tex}
            style={{
              borderBottom: "1px solid color-mix(in srgb, currentColor 12%, transparent)",
              paddingBottom: 7,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            <M tex={tex} size={12.5} />
          </div>
        ))}
      </div>
      <div style={{ ...labelMuted, marginTop: 8, fontSize: 11, textAlign: "center" }}>
        emit <M tex={String.raw`n=0,\ldots,3`} size={11} />
      </div>
    </Panel>
  );
}

function MatrixPanel() {
  return (
    <Panel step={2} title="Toeplitz matrix">
      <div style={{ textAlign: "center", marginTop: 4 }}>
        <M tex={MATRIX} display size={11.5} />
      </div>
      <div style={{ ...labelMuted, marginTop: 9, fontSize: 11, lineHeight: 1.45 }}>
        Each row emits one <M tex={String.raw`y[n]`} size={11} />. The diagonal
        carries <M tex={role(ACCENT, "1")} size={11} />; the subdiagonal carries{" "}
        <M tex={role(SUPPORT, "0.5")} size={11} />.
      </div>
      <div style={{ marginTop: 8, textAlign: "center", color: OK, fontWeight: 650 }}>
        <M tex={role(OK, String.raw`y=[1,2.5,0,-0.5]`)} size={11.5} />
      </div>
    </Panel>
  );
}

function StreamPanel() {
  return (
    <Panel step={3} title="streaming buffer">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 3,
          marginBottom: 9,
        }}
      >
        <div style={{ border: `1.3px solid ${ACCENT}`, borderRadius: 5, padding: "5px 2px", textAlign: "center" }}>
          <div style={{ color: ACCENT, fontSize: 10.5, fontWeight: 650 }}>current</div>
          <M tex={String.raw`x[n]\times 1`} size={10} />
        </div>
        <M tex="+" size={14} />
        <div style={{ border: `1.3px solid ${SUPPORT}`, borderRadius: 5, padding: "5px 2px", textAlign: "center" }}>
          <div style={{ color: SUPPORT, fontSize: 10.5, fontWeight: 650 }}>1-slot state</div>
          <M tex={String.raw`x[n-1]\times 0.5`} size={10} />
        </div>
      </div>

      <div style={{ ...labelMuted, fontSize: 10.5, marginBottom: 5 }}>
        zero initial state: <M tex={String.raw`x[-1]=0`} size={10.5} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.7fr 1fr 1fr 1fr",
          borderTop: border,
          borderLeft: border,
          fontSize: 10.5,
        }}
      >
        {["n", "x[n]", "x[n-1]", String.raw`\text{emit }y[n]`].map((tex, index) => (
          <div
            key={tex}
            style={{
              borderRight: border,
              borderBottom: border,
              padding: "4px 2px",
              textAlign: "center",
              color: index === 1 ? ACCENT : index === 2 ? SUPPORT : index === 3 ? OK : undefined,
              fontWeight: 650,
            }}
          >
            <M tex={tex} size={10.5} />
          </div>
        ))}
        {calls.flatMap((call) => [
          <div
            key={`${call.n}-n`}
            style={{ borderRight: border, borderBottom: border, padding: "4px 2px", textAlign: "center" }}
          >
            <M tex={call.n} size={10.5} />
            {call.flush && <div style={{ color: OK, fontSize: 8.5, fontWeight: 700 }}>flush</div>}
          </div>,
          <div
            key={`${call.n}-current`}
            style={{ borderRight: border, borderBottom: border, padding: "4px 2px", textAlign: "center", color: ACCENT }}
          >
            <M tex={role(ACCENT, call.current)} size={10.5} />
          </div>,
          <div
            key={`${call.n}-previous`}
            style={{ borderRight: border, borderBottom: border, padding: "4px 2px", textAlign: "center", color: SUPPORT }}
          >
            <M tex={role(SUPPORT, call.previous)} size={10.5} />
          </div>,
          <div
            key={`${call.n}-output`}
            style={{ borderRight: border, borderBottom: border, padding: "4px 2px", textAlign: "center", color: OK }}
          >
            <M tex={role(OK, call.output)} size={10.5} />
          </div>,
        ])}
      </div>
      <div style={{ marginTop: 8, textAlign: "center", whiteSpace: "nowrap" }}>
        <M
          tex={String.raw`\text{flush: }${role(ACCENT, "0")}+${role(SUPPORT, "0.5(-1)")}=${role(OK, "-0.5")}`}
          size={11}
        />
      </div>
    </Panel>
  );
}

export default function ConvolutionThreeViews() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 672,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        color: "currentColor",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <M tex={String.raw`x=[1,2,-1],\quad h=[1,0.5]`} size={13} />
        <span style={{ padding: "0 8px", opacity: 0.45 }}>→</span>
        <M tex={role(OK, String.raw`y=[1,2.5,0,-0.5]`)} size={13} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 18px minmax(0,1fr) 18px minmax(0,1fr)",
          gap: 4,
          alignItems: "stretch",
        }}
      >
        <SumPanel />
        <Equals />
        <MatrixPanel />
        <Equals />
        <StreamPanel />
      </div>

      <div
        style={{
          marginTop: 10,
          borderTop: border,
          paddingTop: 8,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "3px 13px",
          fontSize: 11.5,
        }}
      >
        <span><b>same coefficient order</b>: <M tex={RULE} size={11.5} /></span>
        <span><b>same boundary</b>: <M tex={String.raw`x[-1]=0`} size={11.5} /></span>
        <span><b>same output range</b>: <M tex={String.raw`n=0,\ldots,3`} size={11.5} /></span>
        <span><b>same flush</b>: <M tex={String.raw`x[3]=0`} size={11.5} /></span>
      </div>
    </div>
  );
}
