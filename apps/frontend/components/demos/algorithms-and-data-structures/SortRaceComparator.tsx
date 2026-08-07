"use client";

/**
 * SortRaceComparator — merge sort and quicksort (Lomuto partition,
 * fixed-end pivot, as in the lesson's pseudocode) stepped side by side
 * on one input, with comparison and swap/move counters. Guided task:
 * the sorted preset drives quicksort to n(n-1)/2 = 45 comparisons at
 * n = 10 while merge sort stays at 15.
 */
import { useEffect, useMemo, useState } from "react";
import { Button, Panel, PresetGroup, Readout, TextInput } from "@/components/ui";

interface Frame {
  a: number[];
  c: number; // comparisons so far
  s: number; // swaps (quicksort) or element moves (merge sort) so far
  hi: number[]; // indices touched by this step
}

function quicksortTrace(input: number[]): Frame[] {
  const a = [...input];
  let c = 0;
  let s = 0;
  const frames: Frame[] = [{ a: [...a], c, s, hi: [] }];
  const push = (hi: number[]) => frames.push({ a: [...a], c, s, hi });
  const sort = (p: number, r: number): void => {
    if (p >= r) return;
    const x = a[r];
    let i = p - 1;
    for (let j = p; j < r; j++) {
      c += 1;
      push([j, r]);
      if (a[j] <= x) {
        i += 1;
        [a[i], a[j]] = [a[j], a[i]];
        s += 1;
        push([i, j]);
      }
    }
    [a[i + 1], a[r]] = [a[r], a[i + 1]];
    s += 1;
    push([i + 1, r]);
    sort(p, i);
    sort(i + 2, r);
  };
  sort(0, a.length - 1);
  push([]);
  return frames;
}

function mergesortTrace(input: number[]): Frame[] {
  const a = [...input];
  let c = 0;
  let s = 0;
  const frames: Frame[] = [{ a: [...a], c, s, hi: [] }];
  const push = (hi: number[]) => frames.push({ a: [...a], c, s, hi });
  const sort = (lo: number, end: number): void => {
    if (end - lo < 2) return;
    const mid = (lo + end) >> 1;
    sort(lo, mid);
    sort(mid, end);
    const buf = a.slice(lo, end);
    const m = mid - lo;
    let i = 0;
    let j = m;
    let k = lo;
    while (i < m && j < end - lo) {
      c += 1;
      a[k] = buf[i] <= buf[j] ? buf[i++] : buf[j++];
      s += 1;
      k += 1;
      push([k - 1]);
    }
    for (; i < m; i++, k++, s++) {
      a[k] = buf[i];
      push([k]);
    }
    for (; j < end - lo; j++, k++, s++) {
      a[k] = buf[j];
      push([k]);
    }
  };
  sort(0, a.length);
  push([]);
  return frames;
}

const SORTED = Array.from({ length: 10 }, (_, i) => i + 1);
const REVERSE = [...SORTED].reverse();
const eq = (x: number[], y: number[] | null) =>
  y !== null && x.length === y.length && x.every((v, i) => v === y[i]);

function parseValues(text: string): number[] | null {
  const parts = text.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length < 2 || parts.length > 12) return null;
  const vals = parts.map(Number);
  return vals.every((v) => Number.isInteger(v) && v >= 1 && v <= 99) ? vals : null;
}

function Bars({ frame, title, moves }: { frame: Frame; title: string; moves: string }) {
  const max = Math.max(...frame.a);
  const w = 320 / frame.a.length;
  return (
    <div>
      <p className="pb-1 text-sm font-medium">{title}</p>
      <svg
        viewBox="0 0 320 116"
        className="w-full"
        role="img"
        aria-label={`${title}: ${frame.c} comparisons, ${frame.s} ${moves}`}
      >
        {frame.a.map((v, i) => (
          <g key={i}>
            <rect
              x={i * w + 1}
              y={100 - (v / max) * 88}
              width={w - 2}
              height={(v / max) * 88}
              rx="2"
              fill={frame.hi.includes(i) ? "var(--accent)" : "currentColor"}
              fillOpacity={frame.hi.includes(i) ? 1 : 0.3}
            />
            <text x={i * w + w / 2} y={112} textAnchor="middle" fontSize="10" fill="currentColor">
              {v}
            </text>
          </g>
        ))}
      </svg>
      <Readout>
        comparisons <strong>{frame.c}</strong> · {moves} <strong>{frame.s}</strong>
      </Readout>
    </div>
  );
}

export default function SortRaceComparator() {
  // D3: arrive on the sorted preset with the race finished — 45 vs 15.
  const [values, setValues] = useState<number[]>(SORTED);
  const [text, setText] = useState(SORTED.join(", "));
  const [randomBase, setRandomBase] = useState<number[] | null>(null);
  const [step, setStep] = useState(9999);
  const [playing, setPlaying] = useState(false);

  const merge = useMemo(() => mergesortTrace(values), [values]);
  const quick = useMemo(() => quicksortTrace(values), [values]);
  const maxStep = Math.max(merge.length, quick.length) - 1;

  const shown = Math.min(step, maxStep);
  const running = playing && shown < maxStep;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setStep((v) => Math.min(v + 1, maxStep)), 110);
    return () => clearInterval(id);
  }, [running, maxStep]);

  const load = (vals: number[]) => {
    setValues(vals);
    setText(vals.join(", "));
    setStep(0);
    setPlaying(false);
  };
  const parsed = parseValues(text);
  const activePreset = eq(values, randomBase) ? 0 : eq(values, SORTED) ? 1 : eq(values, REVERSE) ? 2 : null;

  return (
    <Panel>
      <PresetGroup
        labels={["Random", "Sorted", "Reverse-sorted"]}
        activeIndex={activePreset}
        onSelect={(i) => {
          if (i === 0) {
            const r = [...SORTED];
            for (let k = r.length - 1; k > 0; k--) {
              const m = Math.floor(Math.random() * (k + 1));
              [r[k], r[m]] = [r[m], r[k]];
            }
            setRandomBase(r);
            load(r);
          } else load(i === 1 ? SORTED : REVERSE);
        }}
      />
      <TextInput
        label="input array (2–12 integers between 1 and 99)"
        value={text}
        onChange={(t) => {
          setText(t);
          const vals = parseValues(t);
          if (vals !== null && !eq(vals, values)) {
            setValues(vals);
            setStep(0);
            setPlaying(false);
          }
        }}
        placeholder="e.g. 1, 2, 3, 4, 5, 6, 7, 8, 9, 10"
      />
      <Readout>
        {parsed === null
          ? "Unreadable list — give 2–12 integers between 1 and 99, separated by spaces or commas."
          : `step ${shown} of ${maxStep}${shown >= maxStep ? " — both sorts finished" : ""}`}
      </Readout>
      <div className="flex flex-wrap gap-2 py-3">
        <Button
          onClick={() => {
            setPlaying(false);
            setStep((v) => Math.min(Math.min(v, maxStep) + 1, maxStep));
          }}
        >
          Step
        </Button>
        <Button
          active={running}
          onClick={() => {
            if (running) setPlaying(false);
            else {
              if (shown >= maxStep) setStep(0);
              setPlaying(true);
            }
          }}
        >
          {running ? "Pause" : "Run"}
        </Button>
        <Button
          onClick={() => {
            setStep(0);
            setPlaying(false);
          }}
        >
          Reset
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bars frame={merge[Math.min(shown, merge.length - 1)]} title="Merge sort" moves="moves" />
        <Bars frame={quick[Math.min(shown, quick.length - 1)]} title="Quicksort (fixed-end pivot)" moves="swaps" />
      </div>
    </Panel>
  );
}
