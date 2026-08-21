import { M } from "../M";
import { ACCENT, OK, SUPPORT, labelMuted } from "../palette";

/**
 * The spectral embedding as a change of reading direction (spectral-clustering):
 * the ideal-case eigenvector matrix H drawn as a literal cell grid whose columns
 * are eigenvectors, with one row followed into the scatter panel where each
 * component's three identical rows coincide in a single point.
 */

// component colors: A blue, B green, C muted currentColor; amber = the followed row
const COMPONENTS = [
  { name: "A", rows: [1, 2, 3], color: SUPPORT, tint: "rgba(76, 141, 214, 0.10)" },
  { name: "B", rows: [4, 5, 6], color: OK, tint: "rgba(90, 164, 106, 0.10)" },
  { name: "C", rows: [7, 8, 9], color: "currentColor", tint: "rgba(128, 128, 128, 0.10)" },
];

const CELL_W = 46;
const CELL_H = 26;
const FOLLOWED_ROW = 5;

function cellStyle(nonzero: boolean, color: string, tint: string): React.CSSProperties {
  return {
    width: CELL_W,
    height: CELL_H,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: nonzero ? tint : undefined,
    color: nonzero ? color : undefined,
    opacity: nonzero ? 1 : 0.35,
    borderRight: "1px solid rgba(128,128,128,0.25)",
    borderBottom: "1px solid rgba(128,128,128,0.25)",
  };
}

// each stack: three coinciding rows drawn as three slightly offset dots
function stack(x: number, y: number, color: string, ringed: boolean, muted = false) {
  return (
    <g>
      {ringed && <circle cx={x + 3} cy={y - 3} r={14} fill="none" stroke={ACCENT} strokeWidth={2} />}
      {[
        [6, -6],
        [3, -3],
        [0, 0],
      ].map(([dx, dy], i) => (
        <circle
          key={`${dx}`}
          cx={x + dx}
          cy={y + dy}
          r={5}
          fill={color}
          opacity={muted ? [0.3, 0.45, 0.6][i] : [0.45, 0.7, 1][i]}
        />
      ))}
    </g>
  );
}

export default function SpectralEmbeddingRows() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "center", columnGap: 0 }}>
        {/* the matrix as a literal cell grid, columns = eigenvectors */}
        <div>
          <div style={{ marginBottom: 6 }}>
            <M tex={String.raw`H \in \mathbb{R}^{9\times 3}`} size={13} />
            <span style={{ ...labelMuted, fontSize: 12, marginLeft: 8 }}>columns: eigenvectors</span>
          </div>
          <div style={{ display: "flex" }}>
            {/* row labels: vertex number, colored by component */}
            <div style={{ display: "flex", flexDirection: "column", marginTop: CELL_H }}>
              {COMPONENTS.flatMap((c) =>
                c.rows.map((r) => (
                  <div
                    key={r}
                    style={{
                      height: CELL_H,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 8,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: c.color,
                      opacity: c.name === "C" ? 0.55 : 1,
                    }}
                  >
                    {r}
                  </div>
                )),
              )}
            </div>
            <div>
              {/* column heads */}
              <div style={{ display: "flex", height: CELL_H }}>
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    style={{ width: CELL_W, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <M tex={String.raw`u_{${j}}`} size={13} />
                  </div>
                ))}
              </div>
              <div style={{ border: "1.5px solid rgba(128,128,128,0.5)", width: 3 * CELL_W }}>
                {COMPONENTS.map((c, ci) =>
                  c.rows.map((r) => (
                    <div
                      key={r}
                      style={{
                        display: "flex",
                        outline: r === FOLLOWED_ROW ? `2.5px solid ${ACCENT}` : undefined,
                        outlineOffset: -1,
                        position: "relative",
                      }}
                    >
                      {[0, 1, 2].map((j) => {
                        const nonzero = j === ci;
                        return (
                          <div key={j} style={cellStyle(nonzero, c.color, c.tint)}>
                            {nonzero ? <M tex={String.raw`\tfrac{1}{\sqrt{3}}`} size={11} /> : "0"}
                          </div>
                        );
                      })}
                    </div>
                  )),
                )}
              </div>
            </div>
          </div>
        </div>

        {/* the followed row becomes a point */}
        <div style={{ width: 190, flexShrink: 0, textAlign: "center" }}>
          <div style={{ color: ACCENT, fontSize: 13, marginBottom: 4 }}>
            <M tex={String.raw`y_5 = (u_1(5),\,u_2(5),\,u_3(5))`} size={12.5} color={ACCENT} />
          </div>
          <svg viewBox="0 0 170 24" width="170" aria-hidden="true">
            <line x1="4" y1="12" x2="156" y2="12" stroke={ACCENT} strokeWidth={1.8} />
            <path d="M166,12 l-12,-5 l0,10 z" fill={ACCENT} />
          </svg>
          <div style={{ ...labelMuted, fontSize: 12, marginTop: 4 }}>
            vertex <M tex="i" size={12} /> <M tex={String.raw`\mapsto`} size={12} /> row <M tex="i" size={12} /> of{" "}
            <M tex="H" size={12} />
          </div>
        </div>

        {/* the embedding: nine rows, three visible points */}
        <div>
          <svg viewBox="0 0 200 224" width="200" aria-hidden="true" style={{ display: "block" }}>
            <rect x="1" y="1" width="198" height="222" rx="6" fill="none" stroke="currentColor" opacity={0.3} />
            {stack(148, 48, SUPPORT, false)}
            {stack(38, 112, OK, true)}
            {stack(148, 178, "currentColor", false, true)}
            <text x="118" y="52" textAnchor="end" fontSize="11" fontWeight="600" fill={SUPPORT}>
              rows 1–3
            </text>
            <text x="62" y="116" fontSize="11" fontWeight="600" fill={OK}>
              rows 4–6
            </text>
            <text x="118" y="182" textAnchor="end" fontSize="11" fontWeight="600" fill="currentColor" opacity="0.6">
              rows 7–9
            </text>
          </svg>
          <div style={{ ...labelMuted, fontSize: 12, marginTop: 4, textAlign: "center" }}>
            k-means sees k point-stacks
          </div>
        </div>
      </div>

      <div style={{ ...labelMuted, fontSize: 12, marginTop: 8 }}>
        Three components of three vertices each: all rows of one component are the same scaled indicator, so the
        nine points coincide in three stacks of three.
      </div>
    </div>
  );
}
