"use client";

/**
 * ArbitrageLock — quote a price for the one-period call (S0=4, u=2, d=1/2,
 * r=1/4, K=5) and watch the counter-trade assemble itself: for any quote
 * other than 1.20 the table shows the trade (call, ½ share, loan, excess
 * deposit) whose net is 0 now and (quote − 1.20) × 1.25 in BOTH states. The
 * trade flips direction at 1.20 and its P&L is a V with vertex there; the
 * reader's job is to find the vertex, then read the replicating portfolio
 * off the rows that are left when the excess is zero (lesson: one-period-binomial).
 */
import { useState } from "react";
import { Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

const FAIR = 1.2; // replication cost: ½ share at 4 minus 0.80 borrowed
const DELTA = 0.5, LOAN = 0.8, GROWTH = 1.25;
const PAY_H = 3, PAY_T = 0; // the call at S1 = 8 and S1 = 2, strike 5
const S_H = DELTA * 8, S_T = DELTA * 2, DEBT = LOAN * GROWTH;
const QMIN = 0.5, QMAX = 2.5, STEP = 0.01;
const AMBER = "#e2903a"; // quote too high: sell the call, run the hedge
const BLUE = "#4c8dd6"; // quote too low: buy the call, hedge in reverse
const PRESETS = [
  { label: "overpriced at 1.50", q: 1.5 },
  { label: "underpriced at 1.00", q: 1.0 },
  { label: "fair", q: FAIR },
];
const W = 360, H = 120, PL = 36, PR = 350, PT = 10, PB = 96;
const PMAX = (QMAX - FAIR) * GROWTH;

// 1.20 sits on the slider's grid exactly, so the reader can land on it; the
// comparison is against half a step so float noise cannot turn 1.20 into 1.2000001.
const near = (a: number, b: number) => Math.abs(a - b) < STEP / 2;
// Signed, trailing zeros dropped, float noise rounded away so a cancelled row reads 0 rather than +0.
const money = (v: number) => {
  const x = Math.round(v * 1e4) / 1e4;
  return `${x < 0 ? "−" : x > 0 ? "+" : ""}${Math.abs(x).toFixed(4).replace(/\.?0+$/, "")}`;
};
const gx = (q: number) => PL + ((q - QMIN) / (QMAX - QMIN)) * (PR - PL);
const gy = (p: number) => PB - (p / PMAX) * (PB - PT);

/** The counter-trade at a quote: rows of (label, now, heads, tails) with the excess deposit last. */
function trade(q: number) {
  const fair = near(q, FAIR);
  const sell = fair || q > FAIR; // at exactly 1.20 there is nothing to collect; show the hedger's side
  const s = sell ? 1 : -1;
  const excess = fair ? 0 : Math.abs(q - FAIR);
  const rows: [string, number, number, number][] = [
    [sell ? `sell 1 call at ${q.toFixed(2)}` : `buy 1 call at ${q.toFixed(2)}`, s * q, -s * PAY_H, -s * PAY_T],
    [sell ? "buy ½ share at 4" : "short ½ share at 4", -s * DELTA * 4, s * S_H, s * S_T],
    [sell ? "borrow 0.80" : "deposit 0.80", s * LOAN, -s * DEBT, -s * DEBT],
    [`deposit excess ${excess.toFixed(2)}`, -excess, excess * GROWTH, excess * GROWTH],
  ];
  const net = [1, 2, 3].map((c) => rows.reduce((a, r) => a + (r[c] as number), 0));
  return { fair, sell, excess, rows, net };
}

const targetsMet = (q: number) => [near(q, FAIR), near(Math.abs(q - FAIR), 0.01)];

export default function ArbitrageLock() {
  // D3: open on the overpriced quote, the left table of the lesson's figure.
  const [s, setS] = useState({ q: PRESETS[0].q, hit: [false, false] });
  const setQ = (q: number) =>
    setS((st) => ({ q, hit: st.hit.map((h, i) => h || targetsMet(q)[i]) }));
  const { q } = s;
  const { fair, sell, excess, rows, net } = trade(q);
  const met = targetsMet(q);
  const color = sell ? AMBER : BLUE;
  const preset = PRESETS.findIndex((p) => near(p.q, q));
  const pnl = excess * GROWTH;
  const cell = "px-2 py-1 text-right font-mono tabular-nums";
  // The V: the guaranteed P&L against every quote, one arm per trade direction.
  const vertex = `${gx(FAIR)},${gy(0)}`;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={preset === -1 ? null : preset}
        onSelect={(i) => setQ(PRESETS[i].q)}
      />
      <TargetList
        targets={[
          ["1. Find the one quote at which the net row is 0 in both states",
            `net at time one: ${money(net[1])} on heads, ${money(net[2])} on tails`],
          ["2. Quote 1.21 or 1.19 — Shreve's own numbers — and read 0.0125 in both states",
            `(${q.toFixed(2)} − 1.20) × 1.25 = ${money((q - FAIR) * GROWTH)}`],
        ].map(([label, detail], i) => ({ label, detail, met: met[i], latched: s.hit[i] }))}
      />
      <Slider label="your quote for the call" value={q} min={QMIN} max={QMAX} step={STEP}
        onChange={setQ} display={q.toFixed(2)} ariaLabel="Quoted price of the call" />
      <Readout>
        {fair ? (
          <>
            At <strong>1.20</strong> the excess deposit is 0 and the hedger nets exactly nothing in both states:
            what is left, <strong>½ share and 0.80 borrowed</strong>, is the replicating portfolio, and 1.20 is its cost.
          </>
        ) : (
          <>
            {sell ? "Sell the call and run the hedge" : "Buy the call and hedge in reverse"}: net{" "}
            <strong>{money(pnl)}</strong> on heads and <strong>{money(pnl)}</strong> on tails, from nothing —{" "}
            |{q.toFixed(2)} − 1.20| × 1.25.
          </>
        )}
      </Readout>
      <div className="overflow-x-auto pt-2">
        <table className="w-full border-collapse text-sm" aria-label="The counter-trade at the current quote, now and in each state">
          <thead>
            <tr className="text-faint">
              <th className="py-1 text-left font-normal" style={{ color }}>
                {sell ? "quote too high: sell the call, run the hedge" : "quote too low: buy the call, hedge in reverse"}
              </th>
              <th className={`${cell} font-normal`}>now</th>
              <th className={`${cell} font-normal`}>heads</th>
              <th className={`${cell} font-normal`}>tails</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, now, h, t]) => (
              <tr key={label}>
                <td className="py-1 pr-2">{label}</td>
                <td className={cell}>{money(now)}</td>
                <td className={cell}>{money(h)}</td>
                <td className={cell}>{money(t)}</td>
              </tr>
            ))}
            <tr className="border-t border-line font-medium">
              <td className="py-1 pr-2">net</td>
              <td className={cell}>{money(net[0])}</td>
              <td className={cell} style={{ color: fair ? undefined : color }}>{money(net[1])}</td>
              <td className={cell} style={{ color: fair ? undefined : color }}>{money(net[2])}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full select-none" role="img"
        aria-label={`Guaranteed P&L against the quote: a V with its vertex at 1.20; current quote ${q.toFixed(2)} gives ${pnl.toFixed(4)}`}>
        <line x1={PL} y1={PB} x2={PR} y2={PB} stroke="currentColor" opacity="0.4" />
        <line x1={PL} y1={PT} x2={PL} y2={PB} stroke="currentColor" opacity="0.4" />
        {[0.5, 1, 1.5, 2, 2.5].map((v) => (
          <text key={v} x={gx(v)} y={PB + 13} textAnchor="middle" fontSize="10" fill="currentColor">{v.toFixed(2)}</text>
        ))}
        <text x={PL - 4} y={PT + 4} textAnchor="end" fontSize="10" fill="currentColor">{PMAX.toFixed(2)}</text>
        <text x={PL - 4} y={PB + 3} textAnchor="end" fontSize="10" fill="currentColor">0</text>
        <text x={PR} y={PT + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">guaranteed P&L at time one, either state</text>
        <line x1={gx(FAIR)} y1={PT} x2={gx(FAIR)} y2={PB} stroke="currentColor" opacity="0.3" strokeDasharray="3 3" />
        <text x={gx(FAIR)} y={PB + 24} textAnchor="middle" fontSize="10" fill="currentColor">quote (1.20 = replication cost)</text>
        <polyline points={`${gx(QMIN)},${gy((FAIR - QMIN) * GROWTH)} ${vertex}`} fill="none" stroke={BLUE} strokeWidth="2" />
        <polyline points={`${vertex} ${gx(QMAX)},${gy(PMAX)}`} fill="none" stroke={AMBER} strokeWidth="2" />
        <circle cx={gx(q)} cy={gy(pnl)} r="5" fill={color} stroke="currentColor" />
      </svg>
    </Panel>
  );
}
