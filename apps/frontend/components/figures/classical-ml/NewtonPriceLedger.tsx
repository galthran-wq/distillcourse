import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * NewtonPriceLedger — what a Newton step costs, next to a gradient step
 * (gradient-descent lesson). One idea: the gradient step's price grows like
 * d, Newton's like d² (memory) and d³ (solve) — negligible at d = 20,
 * prohibitive at d = 10⁴, and that asymmetry decides the classical division
 * of labor.
 *
 * Color roles: blue = the gradient step (contrast series), amber = the
 * Newton step, whose price is the figure's subject.
 */

const A = ACCENT;
const B = SUPPORT;
const RULE = "1px solid color-mix(in srgb, currentColor 22%, transparent)";
const COLS = "128px 1fr 1.45fr";

const HEAD: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: 0.4,
  opacity: 0.45,
  fontWeight: 600,
};

const ROW_LABEL: React.CSSProperties = {
  fontSize: 12.5,
  opacity: 0.62,
};

type Row = {
  label: string;
  gd: React.ReactNode;
  newton: React.ReactNode;
};

function Note({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12.5, opacity: 0.62 }}>{children}</span>;
}

const ROWS: Row[] = [
  {
    label: "update",
    gd: <M size={14.5} tex={String.raw`\theta \leftarrow \theta - \eta\,\nabla J`} />,
    newton: <M size={14.5} tex={String.raw`\theta \leftarrow \theta - H^{-1}\nabla J`} />,
  },
  {
    label: "curvature carried",
    gd: <Note>one scalar, η, tuned by hand</Note>,
    newton: (
      <span style={{ fontSize: 12.5 }}>
        <Note>the full Hessian: </Note>
        <M size={13.5} tex={String.raw`\textcolor{${A}}{d^2}`} />
        <Note> entries</Note>
      </span>
    ),
  },
  {
    label: "one step costs",
    gd: <M size={14.5} tex={String.raw`\textcolor{${B}}{O(nd)}`} />,
    newton: (
      <M
        size={14.5}
        tex={String.raw`\textcolor{${A}}{O(nd^2)}\ \text{form} \;+\; \textcolor{${A}}{O(d^3)}\ \text{solve}`}
      />
    ),
  },
  {
    label: "at d = 20",
    gd: <Note>gradient: 20 numbers</Note>,
    newton: <Note>Hessian: 400 numbers — the solve is instant</Note>,
  },
  {
    label: "at d = 10⁴",
    gd: <Note>gradient: 10⁴ numbers (80 KB)</Note>,
    newton: (
      <span style={{ fontSize: 12.5 }}>
        <Note>Hessian: 10⁸ numbers </Note>
        <span style={{ color: A, fontWeight: 600 }}>≈ 800 MB</span>
        <Note>, before any arithmetic</Note>
      </span>
    ),
  },
];

export default function NewtonPriceLedger() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 620,
        margin: "0 auto",
      }}
    >
      <div style={{ borderTop: RULE, borderBottom: RULE }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            alignItems: "center",
            columnGap: 16,
            padding: "7px 0 6px",
          }}
        >
          <div style={HEAD} />
          <div style={{ ...HEAD, color: B, opacity: 0.85 }}>gradient step</div>
          <div style={{ ...HEAD, color: A, opacity: 0.85 }}>Newton step</div>
        </div>

        {ROWS.map((r) => (
          <div
            key={r.label}
            style={{
              display: "grid",
              gridTemplateColumns: COLS,
              alignItems: "center",
              columnGap: 16,
              padding: "9px 0",
              borderTop: RULE,
            }}
          >
            <div style={ROW_LABEL}>{r.label}</div>
            <div>{r.gd}</div>
            <div>{r.newton}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 14,
          fontSize: 12.5,
          opacity: 0.62,
          lineHeight: 1.45,
        }}
      >
        Per step: <M size={12.5} tex={String.raw`\textcolor{${B}}{d}`} /> against{" "}
        <M size={12.5} tex={String.raw`\textcolor{${A}}{d^2}`} /> memory and{" "}
        <M size={12.5} tex={String.raw`\textcolor{${A}}{d^3}`} /> arithmetic — Newton is
        the method of moderate dimension.
      </div>
    </div>
  );
}
