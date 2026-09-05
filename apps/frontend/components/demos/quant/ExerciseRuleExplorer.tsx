"use client";

/**
 * ExerciseRuleExplorer — the four-period $5 put on the $4 stock (u = 2,
 * d = 1/2, r = 1/4, p̃ = 1/2). The reader toggles exercise nodes to define any
 * adapted rule (a toggled node stops every path through it); the panel values
 * the rule forward, Ẽ[G_τ / 1.25^τ], against the Snell value V_0 = 1.4432 of
 * the backward pass, and charges the gap to the nodes that cause it: stopping
 * where V_n > G_n and continuing where V_n exceeds the continuation both cost,
 * so no rule beats τ*, and a rule ties it only by differing where payoff and
 * value are both 0 (lesson: american-derivatives).
 */
import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, TargetList } from "@/components/ui";

const S0 = 4, U = 2, D = 0.5, R = 1.25, K = 5, N = 4, PT = 0.5;
const BLUE = "#4c8dd6", AMBER = "#e2903a", ROSE = "#d0446b";
const W = 400, H = 232;

// Node (n, k) = time n after k heads; the tree recombines, so price is a function of k alone.
const price = (n: number, k: number) => S0 * U ** k * D ** (n - k);
const payoff = (n: number, k: number) => Math.max(K - price(n, k), 0);
const id = (n: number, k: number) => `${n},${k}`;
const at = (n: number, k: number) => `S=${price(n, k)} at time ${n}`;
// The nodes a rule can toggle: every date before expiry, where the payoff is collected regardless.
const INTERIOR = Array.from({ length: N }, (_, n) => Array.from({ length: n + 1 }, (_, k) => [n, k] as const)).flat();

// Backward pass once, at module load: the Snell value V and the continuation value C at every node.
const V: number[][] = [], C: number[][] = [];
for (let n = N; n >= 0; n--) {
  V[n] = []; C[n] = [];
  for (let k = 0; k <= n; k++) {
    C[n][k] = n === N ? 0 : (PT * V[n + 1][k + 1] + (1 - PT) * V[n + 1][k]) / R;
    V[n][k] = Math.max(payoff(n, k), C[n][k]);
  }
}
const SNELL = V[0][0];

const select = (test: (n: number, k: number) => boolean) =>
  INTERIOR.filter(([n, k]) => test(n, k)).map(([n, k]) => id(n, k)).sort();
const PRESETS = [
  { label: "expiry only", nodes: [] as string[] },
  { label: "in the money", nodes: select((n, k) => payoff(n, k) > 0) },
  { label: "optimal", nodes: select((n, k) => V[n][k] === payoff(n, k)) },
];
const OPTIMAL = PRESETS[2].nodes;

interface Valuation { value: number; prob: number[][]; loss: number[][] }
/** The rule valued forward: reach probabilities, the payoff collected where it stops, and the loss each node charges. */
function evaluate(rule: string[]): Valuation {
  const prob: number[][] = [[1]], loss: number[][] = [];
  let value = 0;
  for (let n = 0; n <= N; n++) {
    prob[n + 1] = Array<number>(n + 2).fill(0); loss[n] = [];
    for (let k = 0; k <= n; k++) {
      const p = prob[n][k], disc = R ** n, stop = n === N || rule.includes(id(n, k));
      // V_0 − value = Ẽ[(V_τ − G_τ)/1.25^τ] + Ẽ[Σ_{n<τ} (V_n − C_n)/1.25^n]: the two ways a rule gives value up.
      if (stop) { value += p * payoff(n, k) / disc; loss[n][k] = p * (V[n][k] - payoff(n, k)) / disc; }
      else { loss[n][k] = p * (V[n][k] - C[n][k]) / disc; prob[n + 1][k + 1] += p * PT; prob[n + 1][k] += p * (1 - PT); }
    }
  }
  return { value, prob, loss };
}
// Two rules are the same stopping time iff they stop at the same reachable nodes.
const stoppingTime = (rule: string[], prob: number[][]) =>
  INTERIOR.filter(([n, k]) => rule.includes(id(n, k)) && prob[n][k] > 0).map(([n, k]) => id(n, k)).join(";");
const OPT = evaluate(OPTIMAL);
const TAU_STAR = stoppingTime(OPTIMAL, OPT.prob);
const ties = (rule: string[], val: Valuation) => Math.abs(val.value - SNELL) < 1e-9 && stoppingTime(rule, val.prob) !== TAU_STAR;

const f4 = (v: number) => v.toFixed(4);
const nx = (n: number) => 36 + n * 78;
const ny = (n: number, k: number) => 22 + (n - 2 * k + N) * 22;
const gx = (v: number) => 30 + (v / 1.6) * 350;

interface State { rule: string[]; best: number; tried: string[]; hit: boolean[] }
const targetsMet = (s: State, val: Valuation) => [s.tried.length >= 5, ties(s.rule, val)];

export default function ExerciseRuleExplorer() {
  // D3: open on the common rule the lesson refutes — exercise as soon as in the money — with its loss at the root showing.
  const [s, setS] = useState<State>(() => ({ rule: PRESETS[1].nodes, best: evaluate(PRESETS[1].nodes).value, tried: [PRESETS[1].nodes.join(";")], hit: [false, false] }));
  const setRule = (rule: string[]) =>
    setS((st) => {
      const val = evaluate(rule), k = rule.join(";");
      const next = { rule, best: Math.max(st.best, val.value), tried: st.tried.includes(k) ? st.tried : [...st.tried, k], hit: st.hit };
      return { ...next, hit: st.hit.map((h, i) => h || targetsMet(next, val)[i]) };
    });
  const { rule, best } = s;
  const val = evaluate(rule);
  const met = targetsMet(s, val);
  const preset = PRESETS.findIndex((p) => p.nodes.join(";") === rule.join(";"));
  const losses = INTERIOR.filter(([n, k]) => val.loss[n][k] > 1e-12);
  const gap = SNELL - val.value;
  const differs = INTERIOR.filter(([n, k]) => rule.includes(id(n, k)) !== OPTIMAL.includes(id(n, k)) && (val.prob[n][k] > 0 || OPT.prob[n][k] > 0));
  const toggle = (x: string) => setRule(rule.includes(x) ? rule.filter((y) => y !== x) : [...rule, x].sort());

  return (
    <Panel>
      <PresetGroup labels={PRESETS.map((p) => p.label)} activeIndex={preset === -1 ? null : preset} onSelect={(i) => setRule(PRESETS[i].nodes)} />
      <TargetList
        targets={[
          ["1. Beat the optimal rule: start from it, change any node, try five rules or more — the best so far never passes the Snell value",
            `rules tried: ${s.tried.length} · best so far ${f4(best)} · Snell V₀ = ${f4(SNELL)}`],
          ["2. Find a second rule that ties it: the same value from a different stopping time",
            met[1] ? `ties at ${f4(val.value)} — differs from τ* at ${differs.map(([n, k]) => `${at(n, k)} (payoff ${payoff(n, k)})`).join(", ")}`
              : gap < 1e-9 ? "this is τ* itself" : `${f4(val.value)}, short of V₀ by ${f4(gap)}`],
        ].map(([label, detail], i) => ({ label, detail, met: met[i], latched: s.hit[i] }))}
      />
      {Array.from({ length: N }, (_, n) => (
        <div key={n} className="flex flex-wrap items-center gap-2 pb-2">
          <span className="w-12 text-xs text-faint">time {n}</span>
          {Array.from({ length: n + 1 }, (_, i) => n - i).map((k) => (
            <Button key={k} active={rule.includes(id(n, k))} onClick={() => toggle(id(n, k))}
              className={val.prob[n][k] > 0 ? "" : "opacity-60"}
              aria-label={`Exercise at ${at(n, k)}, payoff ${payoff(n, k)}${val.prob[n][k] > 0 ? "" : ", not reached under this rule"}`}>
              <strong>{price(n, k)}</strong>&nbsp;pays {payoff(n, k)}
            </Button>
          ))}
        </div>
      ))}
      <Readout>
        This rule collects <strong>{f4(val.value)}</strong> against the Snell value {f4(SNELL)}
        {gap < 1e-9 ? <>: it gives nothing up at any node.</> : (
          <>, giving up <strong style={{ color: ROSE }}>{f4(gap)}</strong>:{" "}
            {losses.map(([n, k]) => `${f4(val.loss[n][k])} by ${rule.includes(id(n, k)) ? "exercising" : "holding"} at ${at(n, k)}`).join(", ")}.</>
        )}
      </Readout>
      <svg viewBox="0 0 400 46" className="mt-2 w-full" role="img"
        aria-label={`Rule value ${f4(val.value)} against the Snell value ${f4(SNELL)}; best so far ${f4(best)}`}>
        <line x1={gx(0)} x2={gx(1.6)} y1={26} y2={26} stroke="currentColor" opacity="0.4" />
        {[0, 0.5, 1, 1.5].map((t) => (
          <g key={t}>
            <line x1={gx(t)} x2={gx(t)} y1={26} y2={30} stroke="currentColor" opacity="0.5" />
            <text x={gx(t)} y={42} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.7">{t}</text>
          </g>
        ))}
        <rect x={gx(0)} y={14} width={gx(val.value) - gx(0)} height={12} fill={AMBER} />
        <path d={`M${gx(best) - 5},4 L${gx(best) + 5},4 L${gx(best)},13 Z`} fill="currentColor" />
        <line x1={gx(SNELL)} x2={gx(SNELL)} y1={2} y2={32} stroke={BLUE} strokeWidth="2" />
        <text x={gx(SNELL) + 5} y={11} fontSize="9" fill={BLUE}>Snell V₀ = {f4(SNELL)}</text>
      </svg>
      <p className="text-xs text-faint">amber bar: the value of this rule · black marker: best so far · blue line: the Snell value</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full select-none" role="img"
        aria-label={`Four-period tree; exercise nodes ${rule.length ? rule.map((x) => x.split(",").map(Number)).map(([n, k]) => at(n, k)).join(", ") : "none before expiry"}`}>
        {INTERIOR.flatMap(([n, k]) => [0, 1].map((h) => (
          <line key={`${n}-${k}-${h}`} x1={nx(n)} y1={ny(n, k)} x2={nx(n + 1)} y2={ny(n + 1, k + h)} stroke="currentColor"
            opacity={val.prob[n][k] > 0 && !rule.includes(id(n, k)) ? 0.6 : 0.12} />
        )))}
        {V.flatMap((col, n) => col.map((v, k) => {
          const stopped = n === N || rule.includes(id(n, k)), reached = val.prob[n][k] > 0;
          return (
            <g key={`${n}-${k}`} opacity={reached ? 1 : 0.3}>
              <circle cx={nx(n)} cy={ny(n, k)} r={stopped && n < N ? 5.5 : 3.5} fill={stopped && n < N ? AMBER : "currentColor"} opacity={stopped ? 1 : 0.5} />
              <text x={nx(n)} y={ny(n, k) - 8} textAnchor="middle" fontSize="9" fill="currentColor">{price(n, k)}</text>
              <text x={nx(n)} y={ny(n, k) + 15} textAnchor="middle" fontSize="9" fill={BLUE}>{n === N ? payoff(n, k) : f4(v)}</text>
              {val.loss[n][k] > 1e-12 && (
                <text x={nx(n) + 8} y={ny(n, k) + 3} fontSize="9" fill={ROSE}>−{f4(val.loss[n][k])}</text>
              )}
            </g>
          );
        }))}
        {Array.from({ length: N + 1 }, (_, n) => (
          <text key={n} x={nx(n)} y={H - 4} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{n === N ? "expiry" : `time ${n}`}</text>
        ))}
        <text x={W - 2} y={10} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.7">
          stock above, <tspan fill={BLUE}>Snell value</tspan> below, <tspan fill={ROSE}>loss</tspan> beside
        </text>
      </svg>
    </Panel>
  );
}
