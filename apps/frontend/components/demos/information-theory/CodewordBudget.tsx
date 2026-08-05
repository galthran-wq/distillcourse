"use client";

/**
 * CodewordBudget — Kraft inequality demo. Add/remove codewords of chosen
 * lengths; codewords are placed on a binary tree shortest-first (the
 * sufficiency construction), each claiming 2^-len of the budget of 1.
 * The budget bar overflows red past 1, and over-budget codewords find
 * no free node on the tree.
 */
import { useState } from "react";
import { Panel, PresetGroup, Button, Readout } from "@/components/ui";

const MAX_LEN = 4;
const UNITS = 1 << MAX_LEN; // budget of 1, in sixteenths
const TREE_W = 380;
const BAR_UNIT = 18; // px per sixteenth: budget line at 288px
const COSTS = ["1/2", "1/4", "1/8", "1/16"];

interface Preset {
  label: string;
  counts: number[]; // counts[i] = number of codewords of length i+1
  symbols: string[] | null;
}

const PRESETS: Preset[] = [
  { label: "impossible (1,2,2,2)", counts: [1, 3, 0, 0], symbols: null },
  { label: "tight (1,2,3,3)", counts: [1, 1, 2, 0], symbols: null },
  { label: "question tree (.5,.25,.15,.1)", counts: [1, 1, 2, 0], symbols: ["A", "B", "C", "D"] },
];

interface Codeword {
  len: number;
  cost: number; // in sixteenths
  barPos: number; // cumulative sixteenths incl. unplaced codewords
  treePos: number; // leftmost leaf-sixteenth of the claimed subtree
  bits: string;
  ok: boolean; // fits on the tree
  sym?: string;
}

/** Shortest-first canonical placement; once the budget is spent, later codewords fail. */
function placeCodewords(counts: number[], symbols: string[] | null): Codeword[] {
  const lens: number[] = [];
  counts.forEach((c, i) => {
    for (let k = 0; k < c; k++) lens.push(i + 1);
  });
  lens.sort((a, b) => a - b);
  let pos = 0;
  let bar = 0;
  return lens.map((len, i) => {
    const cost = UNITS >> len;
    const ok = pos + cost <= UNITS;
    const bits = (pos >> (MAX_LEN - len)).toString(2).padStart(len, "0");
    const cw: Codeword = { len, cost, barPos: bar, treePos: pos, bits: ok ? bits : "", ok, sym: symbols?.[i] };
    if (ok) pos += cost;
    bar += cost;
    return cw;
  });
}

const fmt = (u: number) => Number((u / UNITS).toFixed(4)).toString();
const nodeX = (d: number, k: number) => ((k + 0.5) * TREE_W) / (1 << d);
const nodeY = (d: number) => 22 + d * 52;

export default function CodewordBudget() {
  // Start on the tight code: the tree exactly tiled, the budget exactly spent.
  const [counts, setCounts] = useState<number[]>([...PRESETS[1].counts]);
  const [labeled, setLabeled] = useState(false);

  const codewords = placeCodewords(counts, labeled ? PRESETS[2].symbols : null);
  const total = codewords.reduce((s, c) => s + c.cost, 0);
  const unplaced = codewords.filter((c) => !c.ok);
  const activePreset = PRESETS.findIndex(
    (p) => p.counts.every((c, i) => c === counts[i]) && (p.symbols !== null) === labeled,
  );

  const bump = (len: number, delta: number) => {
    setCounts(counts.map((c, i) => (i === len - 1 ? c + delta : c)));
    setLabeled(false);
  };

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setCounts([...PRESETS[i].counts]);
          setLabeled(PRESETS[i].symbols !== null);
        }}
      />

      <div className="flex flex-wrap gap-x-6 gap-y-2 pb-1">
        {[1, 2, 3, 4].map((len) => (
          <div key={len} className="flex items-center gap-2 text-sm">
            <span>
              length {len} — cost {COSTS[len - 1]}
            </span>
            <Button
              onClick={() => bump(len, -1)}
              disabled={counts[len - 1] === 0}
              aria-label={`remove a codeword of length ${len}`}
              className="w-11 disabled:opacity-40"
            >
              −
            </Button>
            <span className="w-4 text-center font-mono">{counts[len - 1]}</span>
            <Button
              onClick={() => bump(len, 1)}
              disabled={counts[len - 1] >= 1 << len}
              aria-label={`add a codeword of length ${len}`}
              className="w-11 disabled:opacity-40"
            >
              +
            </Button>
          </div>
        ))}
      </div>

      <Readout>
        sum 2^−ℓ = <strong>{fmt(total)}</strong>
        {total < UNITS && ` ≤ 1 — fits; ${fmt(UNITS - total)} of the budget is free`}
        {total === UNITS && " = 1 — complete code: budget spent exactly, no free node left"}
        {total > UNITS &&
          ` > 1 — over budget: ${unplaced.length} codeword${unplaced.length > 1 ? "s" : ""} find no free node`}
      </Readout>

      <svg viewBox="0 0 480 48" className="mt-2 w-full" role="img" aria-label={`Budget bar: sum ${fmt(total)} of budget 1`}>
        <rect x="0" y="14" width={UNITS * BAR_UNIT} height="22" rx="3" fill="none" stroke="currentColor" strokeOpacity=".35" />
        {codewords.map((c, i) => {
          const x = c.barPos * BAR_UNIT;
          if (x >= 458) return null;
          const w = Math.min(c.cost * BAR_UNIT, 458 - x);
          return <rect key={i} x={x + 1} y="16" width={w - 2} height="18" rx="2" fill={c.ok ? "#e2903a" : "#c0392b"} />;
        })}
        <line x1={UNITS * BAR_UNIT} y1="8" x2={UNITS * BAR_UNIT} y2="42" stroke="currentColor" strokeOpacity=".7" strokeDasharray="3 2" />
        <text x={UNITS * BAR_UNIT + 5} y="11" fontSize="11" fill="currentColor">
          budget = 1
        </text>
      </svg>

      <svg
        viewBox="-12 0 502 264"
        className="mt-1 w-full"
        role="img"
        aria-label={`Code tree: ${codewords.length - unplaced.length} codewords placed${unplaced.length > 0 ? `, ${unplaced.length} without a free node` : ""}`}
      >
        {codewords
          .filter((c) => c.ok)
          .map((c, i) => (
            <rect
              key={i}
              x={(c.treePos * TREE_W) / UNITS}
              y={nodeY(c.len) - 9}
              width={(c.cost * TREE_W) / UNITS}
              height={248 - nodeY(c.len)}
              rx="4"
              fill="#e2903a"
              fillOpacity=".13"
              stroke="#e2903a"
              strokeOpacity=".5"
              strokeDasharray="3 2"
            />
          ))}
        {[1, 2, 3, 4].flatMap((d) =>
          Array.from({ length: 1 << d }, (_, k) => (
            <line key={`${d}-${k}`} x1={nodeX(d - 1, k >> 1)} y1={nodeY(d - 1)} x2={nodeX(d, k)} y2={nodeY(d)} stroke="currentColor" strokeOpacity=".25" />
          )),
        )}
        {[0, 1, 2, 3, 4].flatMap((d) =>
          Array.from({ length: 1 << d }, (_, k) => (
            <circle key={`${d}-${k}`} cx={nodeX(d, k)} cy={nodeY(d)} r="2.5" fill="currentColor" opacity=".4" />
          )),
        )}
        <text x={(nodeX(0, 0) + nodeX(1, 0)) / 2 - 10} y={(nodeY(0) + nodeY(1)) / 2} fontSize="11" fill="currentColor" opacity=".7">
          0
        </text>
        <text x={(nodeX(0, 0) + nodeX(1, 1)) / 2 + 4} y={(nodeY(0) + nodeY(1)) / 2} fontSize="11" fill="currentColor" opacity=".7">
          1
        </text>
        {codewords
          .filter((c) => c.ok)
          .map((c, i) => {
            const label = c.sym ? `${c.sym}:${c.bits}` : c.bits;
            const w = label.length * 7.5 + 10;
            const x = nodeX(c.len, c.treePos >> (MAX_LEN - c.len));
            return (
              <g key={i}>
                <rect x={x - w / 2} y={nodeY(c.len) - 10} width={w} height="20" rx="10" fill="#e2903a" />
                <text x={x} y={nodeY(c.len) + 4} textAnchor="middle" fontSize="12" fontFamily="monospace" fill="#222">
                  {label}
                </text>
              </g>
            );
          })}
        {unplaced.slice(0, 8).map((c, i) => (
          <g key={i}>
            <rect x="398" y={16 + i * 26} width="66" height="20" rx="10" fill="#c0392b" />
            <text x="431" y={30 + i * 26} textAnchor="middle" fontSize="12" fontFamily="monospace" fill="#fff">
              len {c.len}
            </text>
          </g>
        ))}
        {unplaced.length > 0 && (
          <text x="431" y={30 + Math.min(unplaced.length, 8) * 26} textAnchor="middle" fontSize="11" fill="#c0392b">
            no free node{unplaced.length > 1 ? ` ×${unplaced.length}` : ""}
          </text>
        )}
      </svg>
    </Panel>
  );
}
