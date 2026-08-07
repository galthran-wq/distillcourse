"use client";

/**
 * QuickselectPivotChooser — quickselect where the reader chooses every
 * pivot (or asks for a random one) and watches each Lomuto partition
 * retire the pivot at its true rank and discard one whole side, with
 * running partition and comparison counters. Guided task (lesson <Task>):
 * find the 4th smallest of 12 keys in two partitions, then run the
 * adversarial preset and count 11 partitions, one per discarded key.
 * Presets: Random pivots, Adversarial first-element.
 */
import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider } from "@/components/ui";

const SCEN = [
  { label: "Random pivots", a: [50, 10, 40, 30, 60, 5, 25, 55, 15, 45, 20, 35], k: 4 },
  { label: "Adversarial first-element", a: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60], k: 12 },
] as const;

type S = {
  scen: number; a: number[]; k: number; lo: number; hi: number;
  parts: number; comps: number; found: number | null; pivots: number[]; last: string;
};

function load(scen: number): S {
  const { a, k } = SCEN[scen];
  return {
    scen, a: [...a], k, lo: 0, hi: a.length - 1,
    parts: 0, comps: 0, found: null, pivots: [],
    last: scen === 0
      ? "fresh array, k = 4 — pick a pivot slot and partition"
      : "sorted array, k = 12 — partition at slot 1 (the first element) each time",
  };
}

function partition(st: S, slot: number): S {
  const a = [...st.a];
  const { lo, hi } = st;
  [a[slot], a[hi]] = [a[hi], a[slot]];
  const p = a[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) if (a[j] <= p) { i++; [a[i], a[j]] = [a[j], a[i]]; }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
  const q = i + 1;
  const base = { ...st, a, parts: st.parts + 1, comps: st.comps + (hi - lo), pivots: [...st.pivots, q] };
  const t = st.k - 1;
  if (q === t) return { ...base, found: q, last: `partition ${base.parts}: pivot ${p} landed at slot ${q + 1} = k — found ${p}` };
  const nlo = t < q ? lo : q + 1;
  const nhi = t < q ? q - 1 : hi;
  if (nlo === nhi) return { ...base, lo: nlo, hi: nhi, found: nlo, last: `partition ${base.parts}: pivot ${p} retired at slot ${q + 1}; one slot left — the answer is ${a[nlo]}` };
  const cut = hi - lo - (nhi - nlo);
  return { ...base, lo: nlo, hi: nhi, last: `partition ${base.parts}: pivot ${p} retired at slot ${q + 1}, ${cut} slot${cut === 1 ? "" : "s"} discarded, range now ${nlo + 1}–${nhi + 1}` };
}

const X = (i: number) => 6 + 39 * i;

export default function QuickselectPivotChooser() {
  // D3: opens on the Random-pivots scenario with the lesson Example's first
  // partition (pivot 35) already applied — half the array already discarded.
  const [s, setS] = useState<S>(() => partition(load(0), 11));
  const [sel, setSel] = useState(1); // 1-based slot the slider points at

  function apply(st: S, slot: number) {
    const r = partition(st, slot);
    setS(r);
    setSel(Math.min(Math.max(sel, r.lo + 1), r.hi + 1));
  }
  function loadScen(i: number) {
    const st = load(i);
    setS(st);
    setSel(st.lo + 1);
  }

  const done = s.found !== null;
  const win = !done ? "" :
    s.scen === 0 && s.parts <= 2 ? " — two partitions: the task's target." :
    s.scen === 1 && s.parts >= 11 ? " — one partition per discarded key, the worst case." :
    s.scen === 0 ? " — the task asks for two partitions; reset and retry." : ".";

  return (
    <Panel>
      <PresetGroup
        labels={SCEN.map((c) => c.label)}
        activeIndex={s.scen}
        onSelect={loadScen}
      />
      {!done && (
        <Slider
          label="pivot slot"
          value={sel}
          min={s.lo + 1}
          max={s.hi + 1}
          step={1}
          onChange={setSel}
          display={`slot ${sel} holds ${s.a[sel - 1]}`}
          ariaLabel="Pivot slot within the live range"
        />
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {!done && <Button onClick={() => apply(s, sel - 1)}>partition at slot {sel}</Button>}
        {!done && <Button onClick={() => apply(s, s.lo + Math.floor(Math.random() * (s.hi - s.lo + 1)))}>random pivot</Button>}
        <Button onClick={() => loadScen(s.scen)}>reset</Button>
      </div>
      <p className="min-h-5 pt-1 text-xs text-faint">{s.last}</p>
      <Readout>
        k = <strong>{s.k}</strong>
        {done
          ? <> · found <strong>{s.a[s.found!]}</strong> at slot {s.found! + 1}</>
          : <> · live range slots <strong>{s.lo + 1}–{s.hi + 1}</strong> ({s.hi - s.lo + 1} keys)</>}
        {" "}· partitions = <strong>{s.parts}</strong> · comparisons = <strong>{s.comps}</strong>{win}
      </Readout>
      <svg
        viewBox="0 0 480 96"
        className="mt-2 w-full"
        role="img"
        aria-label={`Array of 12 slots, target rank ${s.k}; ${done ? `answer found at slot ${s.found! + 1}` : `live range slots ${s.lo + 1} to ${s.hi + 1}`}; ${s.parts} partitions so far`}
      >
        <text x={X(s.k - 1) + 16} y="12" fontSize="11" fill="var(--accent)" textAnchor="middle">k = {s.k} ▾</text>
        {s.a.map((v, i) => {
          const pivot = s.pivots.includes(i);
          const isFound = s.found === i;
          const dead = !isFound && (i < s.lo || i > s.hi);
          const stroke = isFound || pivot ? "var(--accent)" : "currentColor";
          return (
            <g key={i} opacity={dead && !pivot ? 0.3 : 1}>
              <rect x={X(i)} y="18" width="33" height="30" rx="3"
                fill={isFound ? "var(--accent)" : "var(--panel)"} fillOpacity={isFound ? 0.2 : 1}
                stroke={stroke} strokeWidth={isFound || pivot ? 2 : 1} />
              {!done && i === sel - 1 && (
                <rect x={X(i) - 3} y="15" width="39" height="36" rx="5" fill="none"
                  stroke="var(--accent)" strokeDasharray="4 3" />
              )}
              <text x={X(i) + 16} y="38" fontSize="12" fill="currentColor" textAnchor="middle">{v}</text>
              <text x={X(i) + 16} y="64" fontSize="9" fill="currentColor" opacity="0.5" textAnchor="middle">{i + 1}</text>
              {pivot && !isFound && (
                <text x={X(i) + 16} y="80" fontSize="9" fill="var(--accent)" textAnchor="middle">pivot</text>
              )}
              {isFound && (
                <text x={X(i) + 16} y="80" fontSize="9" fill="var(--accent)" textAnchor="middle">answer</text>
              )}
            </g>
          );
        })}
        <text x="6" y="94" fontSize="9" fill="currentColor" opacity="0.5">dimmed slots are discarded — never read again</text>
      </svg>
    </Panel>
  );
}
