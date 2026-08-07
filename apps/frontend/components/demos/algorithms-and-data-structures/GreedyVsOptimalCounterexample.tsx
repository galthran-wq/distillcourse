"use client";

/**
 * GreedyVsOptimalCounterexample — interval scheduling under a selectable
 * greedy criterion (earliest finish, shortest interval, fewest conflicts).
 * The reader edits the instance interval by interval and watches all three
 * tallies at once. Guided task (lesson <Task>): rebuild the three-interval
 * counterexample (tallies 1 against 2), then try to build any instance on
 * which earliest-finish-first is beaten. Presets: Counterexample,
 * Dense conflicts (the lesson's eight-request instance), Sandbox.
 */
import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider } from "@/components/ui";

type Iv = { s: number; f: number };

const PRESETS: { label: string; ivs: Iv[] }[] = [
  { label: "Counterexample", ivs: [[1, 4], [3, 5], [4, 7]].map(([s, f]) => ({ s, f })) },
  {
    label: "Dense conflicts",
    ivs: [[1, 4], [3, 5], [0, 6], [4, 7], [2, 9], [7, 10], [8, 14], [12, 16]].map(([s, f]) => ({ s, f })),
  },
  { label: "Sandbox", ivs: [[0, 3], [2, 6], [5, 9], [8, 12]].map(([s, f]) => ({ s, f })) },
];

const CRITERIA = ["earliest finish", "shortest interval", "fewest conflicts"] as const;
const T_MAX = 16;
const MAX_N = 12;

/** Greedy sweep under criterion `crit`; returns chosen indices in pick order. */
function sweep(ivs: Iv[], crit: number): number[] {
  const conf = ivs.map((a, i) => ivs.filter((b, j) => j !== i && a.s < b.f && b.s < a.f).length);
  const key = (i: number): [number, number] =>
    crit === 0 ? [ivs[i].f, ivs[i].s] : crit === 1 ? [ivs[i].f - ivs[i].s, ivs[i].f] : [conf[i], ivs[i].f];
  const order = ivs.map((_, i) => i).sort((a, b) => key(a)[0] - key(b)[0] || key(a)[1] - key(b)[1]);
  const chosen: number[] = [];
  for (const i of order)
    if (chosen.every((c) => ivs[i].s >= ivs[c].f || ivs[c].s >= ivs[i].f)) chosen.push(i);
  return chosen;
}

const lbl = (iv: Iv) => `[${iv.s},${iv.f})`;
const X = (t: number) => 16 + 28 * t;

export default function GreedyVsOptimalCounterexample() {
  // D3: opens on the three-interval counterexample — tallies already 2/1/2.
  const [ivs, setIvs] = useState<Iv[]>(PRESETS[0].ivs);
  const [crit, setCrit] = useState(1); // shortest-interval: the criterion under indictment
  const [edit, setEdit] = useState(1); // the short straddling interval

  const tallies = CRITERIA.map((_, c) => sweep(ivs, c));
  const picks = tallies[crit];
  const pickOrder = new Map(picks.map((i, k) => [i, k + 1]));
  const activePreset = PRESETS.findIndex(
    (p) => p.ivs.length === ivs.length && p.ivs.every((iv, i) => iv.s === ivs[i].s && iv.f === ivs[i].f),
  );

  function setIv(patch: Partial<Iv>) {
    setIvs(ivs.map((iv, i) => (i === edit ? { ...iv, ...patch } : iv)));
  }
  function addIv() {
    if (ivs.length >= MAX_N) return;
    setIvs([...ivs, { s: 0, f: 2 }]);
    setEdit(ivs.length);
  }
  function removeIv() {
    if (ivs.length <= 2) return;
    setIvs(ivs.filter((_, i) => i !== edit));
    setEdit(Math.max(0, edit - 1));
  }

  const height = 26 + ivs.length * 24 + 6;
  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setIvs(PRESETS[i].ivs);
          setEdit(0);
        }}
      />
      <div className="flex flex-wrap items-center gap-2 pb-2 text-sm">
        <span>criterion:</span>
        {CRITERIA.map((c, i) => (
          <Button key={c} active={i === crit} onClick={() => setCrit(i)}>
            {c}
          </Button>
        ))}
      </div>
      <Readout>
        tallies — {CRITERIA.map((c, i) => (
          <span key={c}>
            {i > 0 && " · "}
            {c}: {i === crit ? <strong>{tallies[i].length}</strong> : tallies[i].length}
          </span>
        ))}
      </Readout>
      <svg
        viewBox={`0 0 480 ${height}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`${ivs.length} intervals; ${CRITERIA[crit]} selects ${picks.length}: ${picks.map((i) => lbl(ivs[i])).join(", ")}`}
      >
        {Array.from({ length: T_MAX / 2 + 1 }, (_, k) => 2 * k).map((t) => (
          <g key={t}>
            <text x={X(t)} y="10" fontSize="9" fill="currentColor" opacity="0.5" textAnchor="middle">{t}</text>
            <line x1={X(t)} y1="14" x2={X(t)} y2={height - 4} stroke="currentColor" opacity="0.12" />
          </g>
        ))}
        {ivs.map((iv, i) => {
          const y = 20 + i * 24;
          const w = 28 * (iv.f - iv.s);
          const order = pickOrder.get(i);
          const text = order !== undefined ? `${order} · ${lbl(iv)}` : lbl(iv);
          const inside = w >= 60;
          const atRight = X(iv.f) <= 420;
          return (
            <g key={i}>
              <rect
                x={X(iv.s)} y={y} width={w} height="16" rx="3"
                fill={order !== undefined ? "var(--accent)" : "none"} fillOpacity={0.25}
                stroke={order !== undefined ? "var(--accent)" : "currentColor"}
                strokeWidth={order !== undefined ? 2 : 1} strokeOpacity={order !== undefined ? 1 : 0.5}
              />
              {i === edit && (
                <rect x={X(iv.s) - 3} y={y - 3} width={w + 6} height="22" rx="5" fill="none"
                  stroke="var(--accent)" strokeDasharray="4 3" />
              )}
              <text
                x={inside ? X(iv.s) + w / 2 : atRight ? X(iv.f) + 6 : X(iv.s) - 6}
                y={y + 12} fontSize="10" fill="currentColor"
                textAnchor={inside ? "middle" : atRight ? "start" : "end"}
              >
                {text}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-2 pt-2">
        {ivs.map((iv, i) => (
          <Button key={i} active={i === edit} onClick={() => setEdit(i)} aria-label={`Edit interval ${lbl(iv)}`}>
            {lbl(iv)}
          </Button>
        ))}
        <Button onClick={addIv} disabled={ivs.length >= MAX_N}>+ add</Button>
        <Button onClick={removeIv} disabled={ivs.length <= 2}>− remove</Button>
      </div>
      <div className="grid gap-2 pt-2 sm:grid-cols-2">
        <Slider
          label={`start of ${lbl(ivs[edit])}`}
          value={ivs[edit].s} min={0} max={ivs[edit].f - 1} step={1}
          onChange={(v) => setIv({ s: v })}
          display={String(ivs[edit].s)}
          ariaLabel="Start time of the selected interval"
        />
        <Slider
          label={`finish of ${lbl(ivs[edit])}`}
          value={ivs[edit].f} min={ivs[edit].s + 1} max={T_MAX} step={1}
          onChange={(v) => setIv({ f: v })}
          display={String(ivs[edit].f)}
          ariaLabel="Finish time of the selected interval"
        />
      </div>
    </Panel>
  );
}
