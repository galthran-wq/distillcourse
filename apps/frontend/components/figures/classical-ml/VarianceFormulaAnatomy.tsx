import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * VarianceFormulaAnatomy — the correlated-average variance formula dissected
 * (bagging-random-forests lesson): the B×B covariance grid from the proof
 * feeds the two terms of ρσ² + (1−ρ)σ²/B.
 *
 * Color roles: amber = the off-diagonal covariance mass and the floor term
 * it becomes (the figure's subject), blue = the diagonal variances and the
 * vanishing term.
 */

const A = ACCENT;
const B = SUPPORT;

const N = 4; // drawn instance of the B×B grid
const CELL = 34;
const GAP = 3;
const GRID = N * CELL + (N - 1) * GAP;

const NOTE: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 12.5,
  lineHeight: 1.45,
};

export default function VarianceFormulaAnatomy() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 620,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
        }}
      >
        {/* the covariance grid, B = 4 instance */}
        <div>
          <div style={{ ...NOTE, opacity: 0.62, marginBottom: 6 }}>
            <M tex={String.raw`\operatorname{Cov}(Z_i, Z_j)`} size={12.5} /> — all{" "}
            <M tex={String.raw`B^2`} size={12.5} /> cells (here{" "}
            <M tex={String.raw`B = 4`} size={12.5} />)
          </div>
          <svg
            viewBox={`0 0 ${GRID} ${GRID}`}
            style={{ width: GRID, display: "block" }}
          >
            {Array.from({ length: N * N }, (_, k) => {
              const i = Math.floor(k / N);
              const j = k % N;
              const diag = i === j;
              return (
                <g key={k}>
                  <rect
                    x={j * (CELL + GAP)}
                    y={i * (CELL + GAP)}
                    width={CELL}
                    height={CELL}
                    rx={4}
                    fill={diag ? B : A}
                    opacity={diag ? 0.9 : 0.75}
                  />
                  <text
                    x={j * (CELL + GAP) + CELL / 2}
                    y={i * (CELL + GAP) + CELL / 2 + 4}
                    textAnchor="middle"
                    fontSize
={11.5}
                    fontFamily="system-ui, sans-serif"
                    fill="#fff"
                  >
                    {diag ? "σ²" : "ρσ²"}
                  </text>
                </g>
              );
            })}
          </svg>
          <div style={{ marginTop: 8, whiteSpace: "nowrap" }}>
            <div style={{ ...NOTE, color: B }}>
              <M tex={String.raw`B`} size={12.5} color={B} /> diagonal cells
            </div>
            <div style={{ ...NOTE, color: A }}>
              <M tex={String.raw`B(B-1)`} size={12.5} color={A} /> off-diagonal cells
            </div>
          </div>
        </div>

        {/* arrow */}
        <svg viewBox="0 0 44 20" style={{ width: 44, flex: "none" }}>
          <line
            x1="2"
            y1="10"
            x2="34"
            y2="10"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path d="M34 5 L42 10 L34 15 Z" fill="currentColor" />
        </svg>

        {/* the formula, terms color-bound to the grid */}
        <div style={{ textAlign: "center" }}>
          <M
            display
            size={17}
            tex={String.raw`\operatorname{Var}\!\left(\frac{1}{B}\sum_{b=1}^{B} Z_b\right) = \underbrace{\textcolor{${A}}{\rho\sigma^2}}_{\substack{\text{the floor:}\\ \text{survives } B \to \infty}} + \underbrace{\textcolor{${B}}{\frac{1-\rho}{B}\,\sigma^2}}_{\substack{\text{dies at rate } 1/B\text{:}\\ \text{trees are cheap}}}`}
          />
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: 14,
          fontSize: 12.5,
          opacity: 0.62,
        }}
      >
        <M
          tex={String.raw`\rho = 0:\ \sigma^2/B \text{ (independent)} \qquad \rho = 1:\ \sigma^2 \text{ (identical copies — averaging changes nothing)}`}
          size={12.5}
        />
      </div>
    </div>
  );
}
