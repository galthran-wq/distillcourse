import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * Where the RatioCut relaxation loses optimality (spectral-clustering), on the
 * bridge graph's numbers: the two-valued encodings are finitely many points on
 * the constraint sphere, the eigenproblem minimizes over the whole sphere, and
 * rounding its minimizer back to a partition carries no guarantee.
 */

const CX = 175;
const CY = 148;
const R = 108;

// gray dots = two-valued encodings, spread over the circle away from the
// amber/blue marks that live in the 330°–40° arc
const GRAY_DEG = [65, 90, 115, 140, 165, 190, 215, 240, 265, 295, 320];

function onCircle(deg: number): [number, number] {
  const t = (deg * Math.PI) / 180;
  return [CX + R * Math.cos(t), CY - R * Math.sin(t)];
}

function starPath(cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const t = Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(t)).toFixed(1)},${(cy - r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

export default function RelaxationFeasibleSets() {
  const [ax, ay] = onCircle(-10); // discrete optimum (amber)
  const [sx, sy] = onCircle(33); // Fiedler vector (blue star)
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 700 }}>
      {/* the two problems, stated over the picture that contrasts them */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20, marginBottom: 6 }}>
        <div style={{ fontSize: 13 }}>
          <M tex={String.raw`\min f^{\top}Lf`} size={13} /> over the{" "}
          <span style={{ opacity: 0.65 }}>dots</span> — <strong>NP-hard</strong>
        </div>
        <div style={{ fontSize: 13 }}>
          <M tex={String.raw`\min f^{\top}Lf`} size={13} /> over the whole circle — an eigenproblem, value{" "}
          <M tex={String.raw`\textcolor{${SUPPORT}}{n\lambda_2}`} size={13} />
        </div>
      </div>

      <div style={{ position: "relative", height: 300 }}>
        <svg viewBox="0 0 348 300" width="348" aria-hidden="true" style={{ display: "block" }}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="currentColor" strokeWidth={1.4} opacity={0.6} />
          {GRAY_DEG.map((deg) => {
            const [x, y] = onCircle(deg);
            return <circle key={deg} cx={x} cy={y} r={4} fill="currentColor" opacity={0.4} />;
          })}
          {/* rounding arrow: from the relaxed minimizer back to the discrete set */}
          <path
            d={`M${sx + 8},${sy + 12} Q 322,124 ${ax + 12},${ay - 10}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeDasharray="4 4"
            opacity={0.6}
          />
          <path d={`M${ax + 12},${ay - 10} l 2,-9 l -10,4 z`} fill="currentColor" opacity={0.6} />
          {/* discrete optimum */}
          <circle cx={ax} cy={ay} r={6} fill={ACCENT} />
          {/* relaxed optimizer */}
          <path d={starPath(sx, sy, 10, 4.2)} fill={SUPPORT} />
        </svg>

        {/* the constraint set, named at its center */}
        <div style={{ position: "absolute", left: 88, top: 128, width: 174, textAlign: "center" }}>
          <M tex={String.raw`\{\,f : f \perp \mathbb{1},\ \lVert f\rVert = \sqrt{n}\,\}`} size={13} />
          <div style={{ ...labelMuted, fontSize: 11, marginTop: 2 }}>drawn as a circle; really an (n−2)-sphere</div>
        </div>

        {/* marks, labeled beside themselves */}
        <div style={{ position: "absolute", left: 356, top: 48, width: 320, color: SUPPORT, fontSize: 13 }}>
          relaxed minimizer: the Fiedler vector <M tex={String.raw`u_2`} size={13} />
          <div>
            <M tex={String.raw`f^{\top}Lf = n\lambda_2 = 0.405`} size={13} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 356, top: 112, width: 320, ...labelMuted, fontSize: 12.5 }}>
          rounding — no guarantee
        </div>
        <div style={{ position: "absolute", left: 356, top: 152, width: 320, color: ACCENT, fontSize: 13 }}>
          best two-valued encoding
          <div>
            <M tex={String.raw`f^{\top}Lf = 0.417`} size={13} />
          </div>
        </div>
      </div>

      <div style={{ ...labelMuted, fontSize: 12, marginTop: 2 }}>
        gray dots: the two-valued encodings of the bridge graph&rsquo;s partitions, one point per partition (a
        subset of the 15 drawn). The relaxed value 0.405 sits below the best discrete value 0.417, as a minimum
        over a larger set must.
      </div>
    </div>
  );
}
