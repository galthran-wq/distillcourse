"use client";

/**
 * CamouflageKnapsack — the lesson's message (LO 4.90, LT 1.70, gap 3.2) and
 * its edits e1–e8, cuts kept in whole steps of 0.4 as the lesson's table
 * keeps them. A pass retrains the classifier: each edit used has its cut
 * halved, rounded down to the grid. Brute force over all choices: 99 of the
 * 120 passing first rounds still allow three passes, none allows a fourth.
 */
import { useState } from "react";
import { Button, Panel, PresetGroup, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const START = [5, 4, 3, 3, 2, 2, 1, 1];
const PRICE = [9, 6, 3, 4, 2, 4, 1, 2];
const GAP = 8;
const PAYOFF = 20;
const LO = 4.9;
const LT = 1.7;
const STEP = 0.4;
const ALL = (1 << START.length) - 1;

const fmt = (steps: number) => (steps * STEP).toFixed(1);
const has = (mask: number, i: number) => ((mask >> i) & 1) === 1;
const members = (mask: number) => START.map((_, i) => i).filter((i) => has(mask, i));
const cutOf = (steps: number[], mask: number) => members(mask).reduce((s, i) => s + steps[i], 0);
const priceOf = (mask: number) => members(mask).reduce((s, i) => s + PRICE[i], 0);
const names = (mask: number) => members(mask).map((i) => `e${i + 1}`).join(" + ");

/** Take edits in the given order until the gap closes. */
function greedy(steps: number[], key: (i: number) => number) {
  const order = START.map((_, i) => i).sort((a, b) => key(b) - key(a));
  let mask = 0;
  for (const i of order) {
    if (cutOf(steps, mask) >= GAP) break;
    mask |= 1 << i;
  }
  return mask;
}

/** What the lesson's table returns: the cheapest set that closes the gap, or null. */
function cheapest(steps: number[]) {
  let best: number | null = null;
  for (let mask = 1; mask <= ALL; mask++) {
    if (cutOf(steps, mask) >= GAP && (best === null || priceOf(mask) < priceOf(best))) best = mask;
  }
  return best;
}

const STRATEGIES = [
  { label: "largest first", pick: (s: number[]) => greedy(s, (i) => s[i]) },
  { label: "best ratio", pick: (s: number[]) => greedy(s, (i) => s[i] / PRICE[i]) },
  { label: "cheapest (the table)", pick: (s: number[]) => cheapest(s) ?? -1 },
];

const X = (lo: number) => 30 + (lo + 4) * 44;
const PX = (price: number) => 30 + (price / 34) * 440;

export default function CamouflageKnapsack() {
  const [steps, setSteps] = useState(START);
  const [picked, setPicked] = useState(() => STRATEGIES[0].pick(START));
  const [passed, setPassed] = useState<{ mask: number; price: number }[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const cut = cutOf(steps, picked);
  const price = priceOf(picked);
  const closes = cut >= GAP;
  const pays = price < PAYOFF;
  const best = cheapest(steps);
  const wall = best === null || priceOf(best) >= PAYOFF;
  const round = passed.length + 1;
  const active = STRATEGIES.findIndex((s) => s.pick(steps) === picked);

  function send() {
    if (!closes) return setMessage(`Caught: the edits cut ${fmt(cut)} of a gap of 3.2.`);
    if (!pays) return setMessage(`Caught: a price of ${price} is not below the payoff of ${PAYOFF}, so the spammer sends it unedited.`);
    const shrunk = members(picked).map((i) => `e${i + 1} ${fmt(steps[i])} → ${fmt(steps[i] >> 1)}`);
    setSteps(steps.map((s, i) => (has(picked, i) ? s >> 1 : s)));
    setPassed([...passed, { mask: picked, price }]);
    setPicked(0);
    setMessage(`Round ${round} is through at price ${price}. The classifier retrains on it: ${shrunk.join(", ")}.`);
  }

  function restart() {
    setSteps(START);
    setPicked(STRATEGIES[0].pick(START));
    setPassed([]);
    setMessage(null);
  }

  const chain = members(picked).map((i, k, list) => {
    const from = LO - cutOf(steps, list.slice(0, k).reduce((m, j) => m | (1 << j), 0)) * STEP;
    return { i, from, to: from - steps[i] * STEP };
  });
  const tone = closes && pays ? AMBER : "currentColor";

  return (
    <Panel>
      <PresetGroup
        labels={STRATEGIES.map((s) => s.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(k) => setPicked(Math.max(0, STRATEGIES[k].pick(steps)))}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((s, i) => (
          <Button key={i} active={has(picked, i)} onClick={() => setPicked(picked ^ (1 << i))}
            aria-label={`Edit e${i + 1}: cut ${fmt(s)}, price ${PRICE[i]}`}>
            <span className="tabular-nums">e{i + 1} · −{fmt(s)} · {PRICE[i]}</span>
          </Button>
        ))}
      </div>

      <svg viewBox="0 0 480 170" className="mt-3 w-full" role="img"
        aria-label={`Selected edits cut ${fmt(cut)} of a gap of 3.2 at price ${price}, against a payoff of ${PAYOFF}`}>
        <g fill="currentColor" fontSize={13}>
          <text x={30} y={14}>log-odds of spam, round {round}</text>
          {[-4, -2, 0, 2, 4, 6].map((v) => (
            <text key={v} x={X(v)} y={92} textAnchor="middle">{v}</text>
          ))}
          <text x={X(LT) - 4} y={30} textAnchor="end">LT 1.70: ham at or below</text>
          <text x={X(LO)} y={30} textAnchor="middle">message</text>
          <text x={30} y={122}>price of the edits, against the payoff</text>
          <text x={PX(PAYOFF) + 4} y={162}>payoff {PAYOFF}</text>
          <text x={30} y={162} className="tabular-nums">{price}</text>
        </g>
        <line x1={30} x2={470} y1={76} y2={76} stroke="currentColor" opacity={0.5} />
        <line x1={X(LT)} x2={X(LT)} y1={36} y2={80} stroke="currentColor" strokeDasharray="4 3" />
        <line x1={X(LT)} x2={X(LO)} y1={44} y2={44} stroke={AMBER} strokeWidth={2} />
        <text x={(X(LT) + X(LO)) / 2} y={40} textAnchor="middle" fontSize={12} fill="currentColor">gap 3.2</text>
        {chain.map(({ i, from, to }, k) => (
          <g key={i}>
            <line x1={X(from)} x2={X(to)} y1={62} y2={62} stroke={tone} strokeWidth={6} opacity={k % 2 ? 0.55 : 1} />
            {from - to >= 0.8 && (
              <text x={(X(from) + X(to)) / 2} y={56} textAnchor="middle" fontSize={11} fill="currentColor">e{i + 1}</text>
            )}
          </g>
        ))}
        <circle cx={X(LO)} cy={62} r={5} fill={AMBER} />
        <rect x={30} y={130} width={PX(price) - 30} height={14} fill={tone} opacity={0.8} />
        <rect x={30} y={130} width={440} height={14} fill="none" stroke="currentColor" opacity={0.4} />
        <line x1={PX(PAYOFF)} x2={PX(PAYOFF)} y1={126} y2={148} stroke="currentColor" strokeDasharray="4 3" />
      </svg>

      <div className="flex flex-wrap gap-2 py-2">
        <Button variant="solid" onClick={send} disabled={wall}>Send round {round}</Button>
        <Button onClick={restart}>Start over</Button>
      </div>

      <Readout>
        <span className="tabular-nums">
          {names(picked) || "no edits"}: cut {fmt(cut)} of 3.2, price {price}
        </span>
        {" · "}
        {!closes ? "short of the threshold" : pays ? "passes, and pays" : "passes, but costs more than a pass is worth"}
      </Readout>
      {message && <Readout>{message}</Readout>}
      {passed.length > 0 && (
        <Readout>
          Through so far:{" "}
          {passed.map((p, k) => `round ${k + 1}, ${names(p.mask)} at ${p.price}`).join("; ")}.
        </Readout>
      )}
      {wall && (
        <Readout>
          <strong>Round {round}: no affordable set closes the gap.</strong>{" "}
          {best === null
            ? `All eight edits together cut only ${fmt(cutOf(steps, ALL))}.`
            : `The cheapest set that closes it costs ${priceOf(best)}.`}{" "}
          {passed.length >= 3
            ? "The spam is caught however it is edited."
            : "Earlier rounds bought cuts they did not need; start over and spend less."}
        </Readout>
      )}
    </Panel>
  );
}
