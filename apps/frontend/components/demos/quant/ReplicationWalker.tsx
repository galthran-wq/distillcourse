"use client";

/**
 * ReplicationWalker — the 80-stock three-period call (S0=80, u=1.5, d=0.5,
 * 1+r=1.1, K=80) priced by backward induction, then hedged forward one toss
 * at a time by the wealth equation X_{n+1} = Δ_n S_{n+1} + 1.1 (X_n − Δ_n S_n).
 * The reader chooses the tosses trying to make the portfolio miss the claim;
 * with the deltas followed it cannot, at any node. Skipping the time-one
 * rebalance opens a miss at time two that then compounds at 1.1, and starting
 * from a quote of 36 shows the excess 1.92 growing at 1.1 whatever the tosses
 * (lesson: multiperiod-binomial).
 */
import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, Switch, TargetList } from "@/components/ui";

const S0 = 80, U = 1.5, D = 0.5, R = 1.1, K = 80, N = 3;
const PT = (R - D) / (U - D); // risk-neutral probability of heads, 0.6
const QUOTE = 36; // the market quote the module's closing lesson trades against
type Toss = "H" | "T";
const PRESETS: { label: string; path: Toss[] }[] = [
  { label: "H, H, T (delivered)", path: ["H", "H", "T"] },
  { label: "H, T, T (abandoned)", path: ["H", "T", "T"] },
  { label: "T, H, H", path: ["T", "H", "H"] },
];
const BLUE = "#4c8dd6", AMBER = "#e2903a";
const W = 380, H = 180;

// Node (n, k) = time n after k heads; the tree recombines, so the price is a function of k alone.
const price = (n: number, k: number) => S0 * U ** k * D ** (n - k);
// Backward induction once, at module load: V[n][k] and the delta at each non-terminal node.
const V: number[][] = [], DELTA: number[][] = [];
for (let n = N; n >= 0; n--) {
  V[n] = []; DELTA[n] = [];
  for (let k = 0; k <= n; k++) {
    if (n === N) V[n][k] = Math.max(price(n, k) - K, 0);
    else {
      V[n][k] = (PT * V[n + 1][k + 1] + (1 - PT) * V[n + 1][k]) / R;
      DELTA[n][k] = (V[n + 1][k + 1] - V[n + 1][k]) / (price(n + 1, k + 1) - price(n + 1, k));
    }
  }
}

interface Row { n: number; k: number; toss: Toss | null; s: number; delta: number | null; money: number | null; x: number; v: number }

/** The hedge walked forward along `path`: the portfolio by the wealth equation, the claim by the table. */
function walk(path: Toss[], skip: boolean, wrong: boolean): Row[] {
  const rows: Row[] = [];
  let k = 0, x = wrong ? QUOTE : V[0][0], delta = DELTA[0][0];
  for (let n = 0; ; n++) {
    const s = price(n, k), v = V[n][k], toss = n ? path[n - 1] : null;
    if (n === N) { rows.push({ n, k, toss, s, delta: null, money: null, x, v }); break; }
    // The skipped rebalance: at time one the hedger keeps Δ_0 instead of moving to Δ_1.
    if (!(skip && n === 1)) delta = DELTA[n][k];
    const money = x - delta * s;
    rows.push({ n, k, toss, s, delta, money, x, v });
    if (n === path.length) break;
    if (path[n] === "H") k++;
    x = delta * price(n + 1, k) + R * money;
  }
  return rows;
}

const f2 = (v: number) => v.toFixed(2);
// Signed, float noise rounded away so a hedge that matches reads 0.00 rather than −0.00.
const signed = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return `${r < 0 ? "−" : r > 0 ? "+" : ""}${Math.abs(r).toFixed(2)}`;
};
const miss = (r: Row) => r.x - r.v;
const nx = (n: number) => 45 + n * 97;
const ny = (n: number, k: number) => 90 + (n - 2 * k) * 20;

interface State { path: Toss[]; skip: boolean; wrong: boolean; hit: boolean[] }
const targetsMet = ({ path, skip, wrong }: State) =>
  [path.length === N && !skip && !wrong, path.length === N && skip, path.length === N && wrong && !skip];

export default function ReplicationWalker() {
  // D3: open on the lesson's first walk, H, H, T, fully hedged to expiry.
  const [s, setS] = useState<State>({ path: PRESETS[0].path, skip: false, wrong: false, hit: [false, false, false] });
  const set = (patch: Partial<State>) =>
    setS((st) => {
      const next = { ...st, ...patch };
      return { ...next, hit: st.hit.map((h, i) => h || targetsMet(next)[i]) };
    });
  const { path, skip, wrong } = s;
  const rows = walk(path, skip, wrong);
  const cur = rows[rows.length - 1];
  const met = targetsMet(s);
  const preset = PRESETS.findIndex((p) => p.path.join() === path.join());
  const done = path.length === N;
  const worst = Math.max(...rows.map((r) => Math.abs(miss(r))));
  const cell = "px-1.5 py-1 text-right font-mono tabular-nums";
  const nodeLabel = (r: Row) => `${r.n}${r.toss ? ` ${r.toss}` : ""}`;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={preset === -1 ? null : preset}
        onSelect={(i) => set({ path: PRESETS[i].path })}
      />
      <TargetList
        targets={[
          ["1. Walk any path to expiry choosing the tosses to make the portfolio miss the claim: it cannot — the miss reads 0.00 at every date",
            `largest miss so far on this path: ${f2(worst)}`],
          ["2. Skip the time-one rebalance, then walk to expiry: the miss opened at time two compounds by 1.1",
            skip && rows.length > 2 ? `${signed(miss(rows[2]))} at time two${done ? ` × 1.1 = ${signed(miss(rows[3]))} at time three` : ""}` : "rebalancing every period"],
          ["3. Start from a quote of 36 instead of 34.08: the excess 1.92 grows by 1.1 per period whatever the tosses",
            wrong ? rows.map((r) => signed(miss(r))).join(" → ") : "starting from the replication cost 34.08"],
        ].map(([label, detail], i) => ({ label, detail, met: met[i], latched: s.hit[i] }))}
      />
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <Button disabled={done} onClick={() => set({ path: [...path, "H"] })}>Heads</Button>
        <Button disabled={done} onClick={() => set({ path: [...path, "T"] })}>Tails</Button>
        <Button variant="ghost" disabled={!path.length} onClick={() => set({ path: path.slice(0, -1) })}>step back</Button>
        <Button variant="ghost" disabled={!path.length} onClick={() => set({ path: [] })}>start over</Button>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 pb-2 text-sm">
        <span className="flex items-center gap-2">
          <Switch on={skip} label="Skip the time-one rebalance" onToggle={() => set({ skip: !skip })} />
          skip the time-one rebalance
        </span>
        <span className="flex items-center gap-2">
          <Switch on={wrong} label="Start from a quote of 36" onToggle={() => set({ wrong: !wrong })} />
          start from a quote of 36
        </span>
      </div>
      <Readout>
        Time {cur.n}{cur.toss ? ` after ${path.join(", ")}` : ""}, stock at <strong>{cur.s}</strong>:{" "}
        {cur.delta === null ? (
          <>the claim pays <strong>{f2(cur.v)}</strong> and the portfolio is worth <strong>{f2(cur.x)}</strong></>
        ) : (
          <>holding <strong>{cur.delta.toFixed(3)}</strong> share against a money market of{" "}
            <strong>{signed(cur.money ?? 0)}</strong>; portfolio <strong>{f2(cur.x)}</strong>, claim <strong>{f2(cur.v)}</strong></>
        )}
        {" — "}miss <strong style={{ color: Math.abs(miss(cur)) > 0.005 ? AMBER : undefined }}>{signed(miss(cur))}</strong>.
        {!done && " Choose the next toss."}
      </Readout>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full select-none" role="img"
        aria-label={`Three-period tree of stock prices and claim values; the walked path ${path.join(", ") || "starts at the root"}, current portfolio ${f2(cur.x)} against claim ${f2(cur.v)}`}>
        {V.slice(0, N).flatMap((col, n) => col.flatMap((_, k) => [0, 1].map((h) => (
          <line key={`${n}-${k}-${h}`} x1={nx(n)} y1={ny(n, k)} x2={nx(n + 1)} y2={ny(n + 1, k + h)} stroke="currentColor" opacity="0.25" />
        ))))}
        {rows.slice(1).map((r, i) => (
          <line key={`p${i}`} x1={nx(rows[i].n)} y1={ny(rows[i].n, rows[i].k)} x2={nx(r.n)} y2={ny(r.n, r.k)} stroke={BLUE} strokeWidth="2.5" />
        ))}
        {V.flatMap((col, n) => col.map((v, k) => {
          const walked = rows.find((r) => r.n === n && r.k === k);
          const off = walked !== undefined && Math.abs(miss(walked)) > 0.005;
          return (
            <g key={`${n}-${k}`}>
              <circle cx={nx(n)} cy={ny(n, k)} r={walked === cur ? 6 : 3.5}
                fill={off ? AMBER : walked ? BLUE : "currentColor"} opacity={walked ? 1 : 0.5} />
              <text x={nx(n)} y={ny(n, k) - 8} textAnchor="middle" fontSize="9" fill="currentColor">{price(n, k)}</text>
              <text x={nx(n)} y={ny(n, k) + 15} textAnchor="middle" fontSize="9" fill={BLUE}>{f2(v)}</text>
            </g>
          );
        }))}
        {[0, 1, 2, 3].map((n) => (
          <text key={n} x={nx(n)} y={H - 3} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">time {n}</text>
        ))}
        <text x={W - 2} y={10} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.7">stock above, <tspan fill={BLUE}>claim value</tspan> below</text>
      </svg>
      <div className="overflow-x-auto pt-2">
        <table className="w-full border-collapse text-xs" aria-label="The hedge along the chosen path, one row per date">
          <thead>
            <tr className="text-faint">
              {["node", "stock", "Δ held", "money mkt", "portfolio", "claim", "miss"].map((h, i) => (
                <th key={h} className={`${i ? cell : "py-1 text-left"} font-normal`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.n} className={r === cur ? "font-medium" : ""}>
                <td className="py-1 pr-1.5">{nodeLabel(r)}</td>
                <td className={cell}>{r.s}</td>
                <td className={cell}>{r.delta === null ? "settle" : r.delta.toFixed(3)}</td>
                <td className={cell}>{r.money === null ? "—" : signed(r.money)}</td>
                <td className={cell}>{f2(r.x)}</td>
                <td className={cell}>{f2(r.v)}</td>
                <td className={cell} style={{ color: Math.abs(miss(r)) > 0.005 ? AMBER : undefined }}>{signed(miss(r))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
