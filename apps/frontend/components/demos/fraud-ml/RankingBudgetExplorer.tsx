"use client";

/**
 * RankingBudgetExplorer — the ten-transaction toy day (two frauds) as a
 * reorderable ranking. ROC-AUC, AP and P@3 follow the order live, compared
 * with a pinned reference ordering; the ROC and PR walks are drawn with the
 * three alerts a budget of k = 3 reaches in amber. Lesson task: from "One
 * early, one late" (frauds at 1 and 8) reach a higher AUC with a lower AP,
 * then the same AUC with an empty queue (frauds at 4 and 5).
 */
import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { Button, Panel, PresetGroup, Readout, TargetList } from "@/components/ui";

const AMBER = "#e2903a";
const K = 3;
const N_NEG = 8;
const FRAUD = new Set([1, 2]);
// The toy's genuine transactions in score order; only fraud positions matter to the metrics.
const GENUINE = [3, 4, 5, 6, 7, 8, 9, 10];

/** Ranking (transaction ids, top first) with the two frauds at ranks a < b. */
function rankingWith(a: number, b: number): number[] {
  const out = [...GENUINE];
  out.splice(a - 1, 0, 1);
  out.splice(b - 1, 0, 2);
  return out;
}

const PRESETS = [
  { label: "Toy day", ranks: [1, 4] },
  { label: "One early, one late", ranks: [1, 8] },
  { label: "Perfect", ranks: [1, 2] },
] as const;

interface Metrics { lost: number; auc: number; ap: number; pAtK: number }

function metricsOf(ranks: number[]): Metrics {
  // Genuines above the i-th fraud = r_i - 1 - i; each is one mis-ordered pair.
  const lost = ranks.reduce((s, r, i) => s + r - 1 - i, 0);
  return {
    lost,
    auc: 1 - lost / (2 * N_NEG),
    ap: ranks.reduce((s, r, i) => s + (i + 1) / r, 0) / 2,
    pAtK: ranks.filter((r) => r <= K).length / K,
  };
}

const fraudRanks = (order: number[]) =>
  order.flatMap((id, i) => (FRAUD.has(id) ? [i + 1] : []));

const ALL = Array.from({ length: 10 }, (_, a) =>
  Array.from({ length: 9 - a }, (_, j) => metricsOf([a + 1, a + j + 2])),
).flat();

const fmt = (x: number) => x.toFixed(3);
const delta = (x: number, ref: number) =>
  Math.abs(x - ref) < 1e-9 ? "=" : x > ref ? `+${(x - ref).toFixed(3)}` : (x - ref).toFixed(3);

/** One of the two walks down the ranking, the first K steps in amber. */
function Walk({ x0, title, pts, lit }: { x0: number; title: string; pts: [number, number][]; lit: number }) {
  const S = 120;
  const p = pts.map(([u, v]) => `${x0 + u * S},${140 - v * S}`);
  return (
    <g>
      <rect x={x0} y={20} width={S} height={S} fill="none" stroke="currentColor" opacity={0.3} />
      <text x={x0 + S / 2} y={14} textAnchor="middle" fontSize={11} fill="currentColor">{title}</text>
      <polyline points={p.join(" ")} fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.6} />
      <polyline points={p.slice(0, lit).join(" ")} fill="none" stroke={AMBER} strokeWidth={3} />
    </g>
  );
}

export default function RankingBudgetExplorer() {
  // D3: open on the lesson's toy day, frauds at ranks 1 and 4, already inside the PR dip at k = 3.
  const [order, setOrder] = useState(() => rankingWith(1, 4));
  const [ref, setRef] = useState({ name: "Toy day", ranks: [1, 4] });
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const ranks = fraudRanks(order);
  const m = metricsOf(ranks);
  const r = metricsOf(ref.ranks);
  const active = PRESETS.findIndex((p) => p.ranks.every((x, i) => x === ranks[i]));

  const move = (from: number, to: number) => {
    if (to < 0 || to > 9 || to === from) return;
    const next = [...order];
    next.splice(to, 0, ...next.splice(from, 1));
    setOrder(next);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const to = e.key === "ArrowUp" ? i - 1 : e.key === "ArrowDown" ? i + 1 : null;
    if (to === null) return;
    e.preventDefault();
    move(i, to);
    // Reordering keyed nodes can drop focus; put it back on the moved transaction.
    const id = order[i];
    requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLButtonElement>(`[data-id="${id}"]`)?.focus(),
    );
  };

  // The order changes on release, not mid-drag: moving the captured node would drop its capture.
  const rankAt = (e: PointerEvent) => {
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-rank]");
    return hit ? Number(hit.dataset.rank) : null;
  };
  const endDrag = (e: PointerEvent | null) => {
    const to = e ? rankAt(e) : null;
    if (dragging !== null && to !== null) move(dragging, to);
    setDragging(null);
    setOver(null);
  };

  const steps = order.map((_, i) => {
    const tp = order.slice(0, i + 1).filter((id) => FRAUD.has(id)).length;
    return { tp, fp: i + 1 - tp, k: i + 1 };
  });
  const roc: [number, number][] = [[0, 0], ...steps.map((s): [number, number] => [s.fp / N_NEG, s.tp / 2])];
  const pr: [number, number][] = steps.map((s) => [s.tp / 2, s.tp / s.k]);

  const same = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const t1 = (x: Metrics) => x.auc > r.auc + 1e-9 && x.ap < r.ap - 1e-9;
  const t2 = (x: Metrics) => x.lost === r.lost && x.pAtK === 0;
  const never = (t: (x: Metrics) => boolean) =>
    ALL.some(t) ? undefined : "no ordering of this day can do it against this reference";

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => {
          const p = PRESETS[i];
          setOrder(rankingWith(p.ranks[0], p.ranks[1]));
          setRef({ name: p.label, ranks: [...p.ranks] });
        }}
      />
      <TargetList
        title={`Targets against the reference: ${ref.name} (AUC ${fmt(r.auc)}, AP ${fmt(r.ap)}, P@3 ${fmt(r.pAtK)})`}
        targets={[
          { label: "Raise ROC-AUC while AP falls", met: t1(m), detail: never(t1) },
          { label: "Same ROC-AUC, P@3 = 0", met: t2(m), detail: never(t2) },
        ]}
      />
      <div className="flex flex-wrap gap-4">
        <ol
          ref={listRef}
          className="w-56 max-w-full space-y-1"
          aria-label="Ranking, top first. Arrow up or down moves the focused transaction."
          onPointerMove={(e) => dragging !== null && setOver(rankAt(e))}
          onPointerUp={endDrag}
          onPointerCancel={() => endDrag(null)}
        >
          {order.map((id, i) => (
            <li key={id} className="relative">
              {i === K && (
                <span className="block border-t border-dashed border-current pb-1 text-[11px] text-faint">
                  budget k = 3 ends here
                </span>
              )}
              <Button
                data-id={id}
                data-rank={i}
                active={dragging === i || over === i}
                className="w-full touch-none select-none"
                aria-label={`Rank ${i + 1}: transaction ${id}, ${FRAUD.has(id) ? "fraud" : "genuine"}`}
                onKeyDown={(e) => onKey(e, i)}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragging(i);
                }}
              >
                <span className="flex w-full justify-between font-mono">
                  <span>#{i + 1} · T{id}</span>
                  <span style={FRAUD.has(id) ? { color: AMBER } : undefined}>
                    {FRAUD.has(id) ? "fraud" : "genuine"}
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ol>
        <div className="min-w-0 flex-1 basis-64">
          <Readout>
            ROC-AUC <strong>{fmt(m.auc)}</strong> ({delta(m.auc, r.auc)}) · AP{" "}
            <strong>{fmt(m.ap)}</strong> ({delta(m.ap, r.ap)}) · P@3{" "}
            <strong>{fmt(m.pAtK)}</strong> ({delta(m.pAtK, r.pAtK)})
          </Readout>
          <p className="pb-2 text-xs text-soft">
            Frauds at ranks {ranks.join(" and ")}: {m.lost} of 16 fraud–genuine pairs mis-ordered.
            {same(m.pAtK, 0) && " The investigators' three calls find nothing."}
          </p>
          <svg viewBox="0 0 300 160" className="w-full max-w-sm" role="img"
            aria-label={`ROC and precision-recall walks; the first ${K} alerts in amber`}>
            <Walk x0={10} title="ROC (FPR → TPR)" pts={roc} lit={K + 1} />
            <Walk x0={170} title="PR (recall → precision)" pts={pr} lit={K} />
            <text x={10} y={154} fontSize={10} fill="currentColor" opacity={0.7}>amber: the k = 3 alerts</text>
          </svg>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRef({ name: "pinned ordering", ranks })}
          >
            Pin this ordering as the reference
          </Button>
        </div>
      </div>
    </Panel>
  );
}
