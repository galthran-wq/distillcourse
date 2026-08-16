import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * SgdTwoTargets — the ★-section inversion drawn (gradient-descent lesson):
 * the SGD update is the same in both regimes; only where the sample comes
 * from changes, and with it the function whose gradient the step estimates —
 * the training loss J for a recycled index, the risk R itself for a fresh
 * draw from the distribution.
 *
 * Color roles: blue = the recycled-index regime (the familiar contrast),
 * amber = the fresh-sample regime, the subject.
 */

const A = ACCENT;
const B = SUPPORT;
const RULE = "1px solid color-mix(in srgb, currentColor 22%, transparent)";
const COLS = "108px 1.35fr 1fr 1.2fr";

const HEAD: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: 0.4,
  opacity: 0.45,
  fontWeight: 600,
};

function Chip({ name, color }: { name: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        border: `1.3px solid ${color}`,
        color,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        lineHeight: 1.5,
      }}
    >
      {name}
    </span>
  );
}

export default function SgdTwoTargets() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 660,
        margin: "0 auto",
      }}
    >
      {/* the one update both regimes run */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <M display size={19} tex={String.raw`\theta_{t+1} = \theta_t - \eta_t\, v_t`} />
      </div>
      <div
        style={{
          textAlign: "center",
          fontSize: 12.5,
          opacity: 0.6,
          marginBottom: 14,
        }}
      >
        one update — only where the sample behind <M tex={String.raw`v_t`} size={12.5} />{" "}
        comes from changes
      </div>

      <div style={{ borderTop: RULE, borderBottom: RULE }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            alignItems: "center",
            columnGap: 14,
            padding: "7px 0 6px",
          }}
        >
          <div style={HEAD}>regime</div>
          <div style={HEAD}>the step uses</div>
          <div style={HEAD}>in expectation</div>
          <div style={HEAD}>the function descended</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            alignItems: "center",
            columnGap: 14,
            padding: "10px 0",
            borderTop: RULE,
          }}
        >
          <div>
            <Chip name="recycled" color={B} />
          </div>
          <div>
            <M
              size={13.5}
              tex={String.raw`\nabla J_{i_t}(\theta_t),\; i_t \sim \mathrm{Unif}\{1..n\}`}
            />
          </div>
          <div>
            <M size={13.5} tex={String.raw`\textcolor{${B}}{\nabla J(\theta_t)}`} />
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.62 }}>
            the training loss — a stand-in for batch GD
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            alignItems: "center",
            columnGap: 14,
            padding: "10px 0",
            borderTop: RULE,
          }}
        >
          <div>
            <Chip name="fresh" color={A} />
          </div>
          <div>
            <M
              size={13.5}
              tex={String.raw`\nabla_\theta\, \ell(\theta_t, z_t),\; z_t \sim \mathcal{D}`}
            />
          </div>
          <div>
            <M size={13.5} tex={String.raw`\textcolor{${A}}{\nabla R(\theta_t)}`} />
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.62 }}>
            the risk itself — a function no algorithm can evaluate
          </div>
        </div>
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
        One pass over iid data: optimization and generalization are the same act.
      </div>
    </div>
  );
}
