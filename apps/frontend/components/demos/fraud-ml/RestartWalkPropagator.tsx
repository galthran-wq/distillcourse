"use client";

/**
 * RestartWalkPropagator — the lesson's 20-node toy (layout and edges as
 * figures/walk-*.svg). Toggle restart nodes, then step ξ ← αQξ + (1−α)e from
 * ξ = e; discs are sized by ξ. With D, E, F, I the walk settles to D, F, E,
 * G, I — the unflagged G above the flagged I — and two seeds can reverse it.
 */
import { useState } from "react";
import { Button, Panel, PresetGroup, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const ALPHA = 0.85;
const TOL = 1e-4;

const POS: Record<string, [number, number]> = {
  A: [330, 190], B: [200, 115], C: [120, 80], D: [120, 180], E: [50, 240],
  F: [120, 305], G: [225, 245], H: [450, 260], I: [335, 325], J: [575, 385],
  K: [470, 360], L: [175, 465], M: [320, 470], N: [250, 405], O: [440, 140],
  P: [500, 70], Q: [560, 180], R: [640, 135], S: [640, 230], T: [300, 85],
};
const NAMES = Object.keys(POS);
const EDGES = "AB AG AH AI AO AT BC BD DE DF EF DG FG GI IK IN HK JK LM LN MN OP OQ QR QS"
  .split(" ")
  .map((e) => [e[0], e[1]] as const);
const ADJ: Record<string, string[]> = Object.fromEntries(NAMES.map((n) => [n, [] as string[]]));
for (const [a, b] of EDGES) {
  ADJ[a].push(b);
  ADJ[b].push(a);
}

const PRESETS = [
  { label: "four frauds", seeds: "DEFI" },
  { label: "D and I only", seeds: "DI" },
  { label: "uniform restart", seeds: NAMES.join("") },
];

type Vec = Record<string, number>;

function restart(seeds: Set<string>): Vec {
  return Object.fromEntries(NAMES.map((n) => [n, seeds.has(n) ? 1 / seeds.size : 0]));
}

// One power-iteration step: each node hands its mass to its neighbours in
// equal shares (column-normalised Q, unit weights), then the restart refills.
function step(xi: Vec, e: Vec): Vec {
  return Object.fromEntries(
    NAMES.map((n) => [n, ALPHA * ADJ[n].reduce((s, m) => s + xi[m] / ADJ[m].length, 0) + (1 - ALPHA) * e[n]]),
  );
}

const fmt = (x: number) => x.toFixed(3);

export default function RestartWalkPropagator() {
  const [seeds, setSeeds] = useState(() => new Set(PRESETS[0].seeds));
  const [xi, setXi] = useState<Vec>(() => restart(seeds));
  const [k, setK] = useState(0);
  const [delta, setDelta] = useState<number | null>(null);

  const reset = (next: Set<string>) => {
    setSeeds(next);
    setXi(restart(next));
    setK(0);
    setDelta(null);
  };
  const advance = (times: number) => {
    const e = restart(seeds);
    let cur = xi;
    let prev = xi;
    for (let i = 0; i < times; i++) [prev, cur] = [cur, step(cur, e)];
    setXi(cur);
    setK(k + times);
    setDelta(NAMES.reduce((s, n) => s + Math.abs(cur[n] - prev[n]), 0));
  };
  const toggle = (n: string) => {
    const next = new Set(seeds);
    if (next.has(n)) next.delete(n);
    else next.add(n);
    reset(next);
  };

  const ranked = [...NAMES].sort((a, b) => xi[b] - xi[a]);
  const settled = delta !== null && delta < TOL;
  const lowestSeed = ranked.filter((n) => seeds.has(n)).at(-1) ?? "";
  const above = ranked.filter((n) => !seeds.has(n) && xi[n] > xi[lowestSeed]);
  const flipped = settled && seeds.size === 2 && xi.I > xi.G;
  const key = [...seeds].sort().join("");
  const active = PRESETS.findIndex((p) => p.seeds === key);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => reset(new Set(PRESETS[i].seeds))}
      />
      <div className="flex flex-wrap gap-2 pb-3">
        <Button variant="solid" onClick={() => advance(1)}>Step</Button>
        <Button onClick={() => advance(10)}>Step ×10</Button>
        <Button variant="ghost" onClick={() => reset(seeds)}>Back to ξ = e</Button>
      </div>

      <svg viewBox="0 0 900 500" className="w-full" role="img"
        aria-label={`Toy graph after ${k} steps; top nodes ${ranked.slice(0, 5).join(", ")}`}>
        {EDGES.map(([a, b]) => (
          <line key={a + b} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]}
            stroke="currentColor" strokeWidth={1.1} opacity={0.35} />
        ))}
        {NAMES.map((n) => {
          const [x, y] = POS[n];
          return (
            <g key={n} onClick={() => toggle(n)} className="cursor-pointer" aria-hidden>
              <circle cx={x} cy={y} r={Math.max(9, 4 + 44 * Math.sqrt(xi[n]))}
                fill={AMBER} fillOpacity={xi[n] > 1e-4 ? 0.5 : 0} />
              <circle cx={x} cy={y} r={9} fill="none" stroke={seeds.has(n) ? AMBER : "currentColor"}
                strokeWidth={seeds.has(n) ? 2.5 : 1} opacity={seeds.has(n) ? 1 : 0.6} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={10.5} fontWeight={600} fill="currentColor">
                {n}
              </text>
            </g>
          );
        })}
        <g fill="currentColor" fontSize={13}>
          <text x={720} y={40} fontWeight={600}>step {k}</text>
          {ranked.slice(0, 8).map((n, i) => (
            <text key={n} x={720} y={70 + i * 22} className="tabular-nums"
              fill={seeds.has(n) ? AMBER : "currentColor"} fontWeight={seeds.has(n) ? 600 : 400}>
              {i + 1}. {n} {fmt(xi[n])}
            </text>
          ))}
          <text x={720} y={262} opacity={0.7} fontSize={11.5}>
            change {delta === null ? "—" : delta.toExponential(1)}
          </text>
          <text x={720} y={282} opacity={0.7} fontSize={11.5}>ringed amber: restart</text>
        </g>
      </svg>

      <p className="pt-2 text-sm" id="rwp-seeds">restart nodes (click a node or a letter):</p>
      <div className="flex flex-wrap gap-1.5 pb-2" role="group" aria-labelledby="rwp-seeds">
        {NAMES.map((n) => (
          <Button key={n} size="md" className="min-w-11" active={seeds.has(n)}
            disabled={seeds.size === 1 && seeds.has(n)} onClick={() => toggle(n)}>
            {n}
          </Button>
        ))}
      </div>

      <Readout>
        step {k}, change in the step {delta === null ? "—" : delta.toExponential(1)}
        {settled ? " · settled" : " · still moving"}
      </Readout>
      <Readout>
        {above.length === 0
          ? "no unseeded node outranks a restart node"
          : <>unseeded above restart node {lowestSeed} ({fmt(xi[lowestSeed])}):{" "}
            <strong>{above.map((n) => `${n} ${fmt(xi[n])}`).join(", ")}</strong></>}
      </Readout>
      <Readout>
        I {fmt(xi.I)} {xi.I > xi.G ? ">" : "<"} G {fmt(xi.G)}
        {flipped && <> · <strong>two restart nodes put I above G: the restart decides the order, not the degree</strong></>}
      </Readout>
    </Panel>
  );
}
