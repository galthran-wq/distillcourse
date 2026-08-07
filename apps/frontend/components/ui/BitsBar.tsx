export interface BitsRow {
  /** What is being coded, e.g. "p data, q code". */
  label: string;
  /** The unavoidable part of the cost (an entropy), drawn first. */
  floor: number;
  floorLabel: string;
  /** The overhead stacked on the floor; may be Infinity. */
  gap: number;
  gapLabel: string;
}

const VW = 480, X0 = 40, X1 = 470, ROW_H = 40;
const num = (b: number) => (Number.isFinite(b) ? b.toFixed(3) : "∞");

/**
 * Rows of "floor + overhead" bars on a shared bits axis: the house way of
 * showing a coding cost split into what the source demands and what a
 * mismatch adds. Values past `max` are clipped and annotated; an infinite
 * gap runs to the edge in `infColor`.
 */
export function BitsBar({
  rows,
  max = 4,
  floorColor,
  gapColor,
  infColor,
}: {
  rows: BitsRow[];
  max?: number;
  floorColor: string;
  gapColor: string;
  infColor: string;
}) {
  const H = rows.length * ROW_H + 36;
  const x = (b: number) => X0 + (Math.min(b, max) / max) * (X1 - X0);
  const ticks = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <svg
      viewBox={`0 0 ${VW} ${H}`}
      className="mt-1 w-full"
      role="img"
      aria-label={rows
        .map((r) => `${r.label}: ${r.floorLabel} ${num(r.floor)} plus ${r.gapLabel} ${num(r.gap)} bits`)
        .join("; ")}
    >
      {rows.map((r, i) => {
        const y = 20 + i * ROW_H, xf = x(r.floor);
        const inf = !Number.isFinite(r.gap), total = r.floor + r.gap;
        const xt = inf ? X1 : x(total), over = !inf && total > max;
        return (
          <g key={r.label}>
            <text x={X0} y={y - 5} fontSize="11" fill="currentColor">
              {r.label}: {r.floorLabel} {r.floor.toFixed(3)} + {r.gapLabel} {num(r.gap)}
              {inf || over ? "" : ` = ${total.toFixed(3)} bits`}
            </text>
            <rect x={X0} y={y} width={xf - X0} height={18} rx="2" fill={floorColor} />
            {xt - xf > 0.5 && (
              <rect x={xf} y={y} width={xt - xf} height={18} fill={inf ? infColor : gapColor} />
            )}
            {(inf || over) && (
              <text x={X1 - 5} y={y + 13} textAnchor="end" fontSize="11" fontWeight="bold" fill="#fff">
                {inf ? "→ ∞" : `→ ${total.toFixed(1)}`}
              </text>
            )}
          </g>
        );
      })}
      {ticks.map((b) => (
        <g key={b}>
          <line x1={x(b)} y1={H - 16} x2={x(b)} y2={H - 12} stroke="currentColor" />
          <text x={x(b)} y={H - 1} textAnchor="middle" fontSize="10" fill="currentColor">
            {b === max ? `${max} bits` : b}
          </text>
        </g>
      ))}
    </svg>
  );
}
