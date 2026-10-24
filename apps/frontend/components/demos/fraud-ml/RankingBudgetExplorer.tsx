"use client";

/**
 * RankingBudgetExplorer — ten payments, two of them fraud, in an order the
 * reader drags; ROC-AUC, average precision and P@3 recompute live, with the
 * ROC staircase and the AP rectangles drawn beside the list. The targets
 * compare against the start ordering (frauds at ranks 1 and 10): raise AUC
 * while AP falls, then return to the start's AUC with nothing caught in the
 * top 3 — "AUC orders classifiers" falsified by construction.
 */
import { useState } from "react";
import { Panel, PresetGroup, ReorderList, Readout, TargetList } from "@/components/ui";

const AMBER = "#e2903a";
const N = 10;
const K = 3;
const EPS = 1e-9;

interface Payment {
  id: string;
  fraud: boolean;
}

const FRAUDS: Payment[] = [{ id: "F1", fraud: true }, { id: "F2", fraud: true }];
const GENUINE: Payment[] = Array.from({ length: N - 2 }, (_, i) => ({ id: `G${i + 1}`, fraud: false }));

// Presets name the ranks (1-based) the two frauds sit at.
const PRESETS = [
  { label: "Start: 1 & 10", ranks: [1, 10] },
  { label: "Lesson toy: 1 & 4", ranks: [1, 4] },
  { label: "Swapped: 2 & 3", ranks: [2, 3] },
  { label: "Perfect: 1 & 2", ranks: [1, 2] },
] as const;

function ordering(ranks: readonly number[]): Payment[] {
  const genuine = [...GENUINE];
  return Array.from({ length: N }, (_, i) => {
    const f = ranks.indexOf(i + 1);
    return f === -1 ? genuine.shift()! : FRAUDS[f];
  });
}

function metrics(order: Payment[]) {
  const m = order.filter((p) => p.fraud).length;
  const neg = N - m;
  const fraudRanks = order.flatMap((p, i) => (p.fraud ? [i + 1] : []));
  let tp = 0;
  let fp = 0;
  let correctPairs = 0;
  const cuts = [{ fpr: 0, tpr: 0, recall: 0, precision: 1 }];
  for (const p of order) {
    if (p.fraud) {
      tp++;
      correctPairs += neg - fp;
    } else fp++;
    cuts.push({ fpr: fp / neg, tpr: tp / m, recall: tp / m, precision: tp / (tp + fp) });
  }
  return {
    fraudRanks,
    cuts,
    auc: correctPairs / (m * neg),
    ap: fraudRanks.reduce((s, r, j) => s + (j + 1) / r, 0) / m,
    pAtK: order.slice(0, K).filter((p) => p.fraud).length / K,
  };
}

const START = metrics(ordering(PRESETS[0].ranks));

// Both plots share one frame: unit square → x 34..206, y 186..14.
const px = (v: number) => 34 + v * 172;
const py = (v: number) => 186 - v * 172;

function Axes({ x, y }: { x: string; y: string }) {
  return (
    <g fill="currentColor" fontSize="11">
      <rect x={px(0)} y={py(1)} width={172} height={172} fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <text x={px(0)} y="202" textAnchor="middle">0</text>
      <text x={px(1)} y="202" textAnchor="middle">1</text>
      <text x={px(0.5)} y="202" textAnchor="middle">{x}</text>
      <text x={px(0) - 6} y={py(1) + 4} textAnchor="end">1</text>
      <text x="10" y={py(0.5)} textAnchor="middle" transform={`rotate(-90 10 ${py(0.5)})`}>{y}</text>
    </g>
  );
}

const staircase = (pts: { fpr: number; tpr: number }[]) => pts.map((c) => `${px(c.fpr)},${py(c.tpr)}`).join(" ");

export default function RankingBudgetExplorer() {
  // D3: open on frauds at 1 and 10 — AUC 0.50 like a coin, yet AP 0.60 and the first alert is a fraud.
  const [order, setOrder] = useState(() => ordering(PRESETS[0].ranks));
  const [latched, setLatched] = useState([false, false]);

  const met = (s: ReturnType<typeof metrics>) => [
    s.auc > START.auc + EPS && s.ap < START.ap - EPS,
    Math.abs(s.auc - START.auc) < EPS && s.pAtK === 0,
  ];
  const apply = (next: Payment[]) => {
    setOrder(next);
    const now = met(metrics(next));
    setLatched((l) => l.map((v, i) => v || now[i]));
  };

  const s = metrics(order);
  const live = met(s);
  const activePreset = PRESETS.findIndex((p) => p.ranks.every((r, i) => s.fraudRanks[i] === r));
  const fmt = (v: number) => v.toFixed(2);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => apply(ordering(PRESETS[i].ranks))}
      />
      <TargetList
        targets={[
          {
            label: `Raise ROC-AUC above the start's ${fmt(START.auc)} while AP falls below its ${fmt(START.ap)}`,
            detail: `AUC ${fmt(s.auc)} · AP ${fmt(s.ap)}`,
            met: live[0],
            latched: latched[0],
          },
          {
            label: `Keep the start's AUC of ${fmt(START.auc)} with no fraud in the top ${K}`,
            detail: `AUC ${fmt(s.auc)} · P@${K} ${fmt(s.pAtK)}`,
            met: live[1],
            latched: latched[1],
          },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-[minmax(0,13rem)_1fr]">
        <ReorderList
          items={order}
          itemKey={(p) => p.id}
          itemLabel={(p) => (p.fraud ? `Fraud ${p.id}` : `Genuine ${p.id}`)}
          onReorder={apply}
          divider={{ index: K - 1, label: `budget k = ${K}` }}
          renderItem={(p, i) => (
            <span className="flex items-baseline gap-2 font-mono text-sm">
              <span className="w-5 text-right text-faint">{i + 1}</span>
              <span style={p.fraud ? { color: AMBER } : undefined} className={p.fraud ? "font-medium" : "text-soft"}>
                {p.fraud ? `fraud ${p.id}` : `genuine ${p.id}`}
              </span>
            </span>
          )}
        />
        <div>
          <Readout>
            ROC-AUC <strong>{fmt(s.auc)}</strong> · AP <strong>{fmt(s.ap)}</strong> · P@{K}{" "}
            <strong>{fmt(s.pAtK)}</strong>
            <span className="text-faint"> (frauds at ranks {s.fraudRanks.join(" & ")})</span>
          </Readout>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <svg viewBox="0 0 214 208" className="w-full" role="img" aria-label={`ROC staircase, area ${fmt(s.auc)}`}>
              <polygon points={`${staircase(s.cuts)} ${px(1)},${py(0)}`} fill={AMBER} fillOpacity="0.18" />
              <polyline points={staircase(START.cuts)} fill="none" stroke="currentColor" strokeOpacity="0.45" strokeDasharray="4 3" />
              <polyline points={staircase(s.cuts)} fill="none" stroke={AMBER} strokeWidth="2.5" />
              <Axes x="FPR" y="TPR" />
              <text x={px(0.97)} y={py(0.06)} textAnchor="end" fill="currentColor" fontSize="11">
                AUC {fmt(s.auc)}
              </text>
              <text x={px(0.97)} y={py(0.17)} textAnchor="end" fill="currentColor" fillOpacity="0.6" fontSize="10">
                dashed: start
              </text>
            </svg>
            <svg viewBox="0 0 214 208" className="w-full" role="img" aria-label={`Precision at each cut, average precision ${fmt(s.ap)}`}>
              {s.fraudRanks.map((r, j) => {
                const h = (j + 1) / r;
                const w = 1 / s.fraudRanks.length;
                return (
                  <rect key={j} x={px(j * w)} y={py(h)} width={w * 172} height={h * 172} fill={AMBER} fillOpacity="0.3" stroke={AMBER} />
                );
              })}
              <line x1={px(0)} x2={px(1)} y1={py(0.2)} y2={py(0.2)} stroke="currentColor" strokeOpacity="0.5" strokeDasharray="4 3" />
              {s.cuts.slice(1).map((c, i) => (
                <circle key={i} cx={px(c.recall)} cy={py(c.precision)} r={i < K ? 4 : 3} fill={i < K ? AMBER : "currentColor"} />
              ))}
              <Axes x="recall" y="precision" />
              <text x={px(0.97)} y={py(0.26)} textAnchor="end" fill="currentColor" fontSize="10">
                fraud share 0.2
              </text>
              <text x={px(0.97)} y={py(0.92)} textAnchor="end" fill="currentColor" fontSize="11">
                AP {fmt(s.ap)}
              </text>
            </svg>
          </div>
          <p className="pt-1 text-xs text-faint">
            Left: the shaded area is ROC-AUC. Right: one dot per cut, amber for the top {K}; the rectangles sum to AP.
          </p>
        </div>
      </div>
    </Panel>
  );
}
