"use client";

/**
 * HeapSiftVisualizer — an array-backed min-heap the reader drives: insert
 * keys and extract the minimum, watching the sift path (every swapped
 * index) light up in the tree drawing AND the array row at once, with a
 * running swap counter. Guided task (lesson <Task>): five inserts with the
 * counter at 0 (ascending), then an order forcing the maximum 6 swaps
 * (descending); the readout announces both. Presets: Empty heap,
 * Build-heap (10 keys) — Floyd swaps vs one-by-one insert swaps —
 * and Extract-heavy.
 */
import { useState, type FormEvent } from "react";
import { Button, Panel, PresetGroup, Readout, TextInput } from "@/components/ui";

const MAX_KEYS = 15;
const UNSORTED = [72, 32, 91, 11, 65, 50, 20, 15, 41, 26];

function insertOp(h: number[], v: number) {
  const heap = [...h, v];
  let i = heap.length - 1;
  const path = [i];
  let swaps = 0;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p] <= heap[i]) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
    path.push(i);
    swaps++;
  }
  return { heap, path, swaps };
}

function siftDown(heap: number[], i: number) {
  const path = [i];
  let swaps = 0;
  while (2 * i + 1 < heap.length) {
    let c = 2 * i + 1;
    if (c + 1 < heap.length && heap[c + 1] < heap[c]) c = c + 1;
    if (heap[i] <= heap[c]) break;
    [heap[i], heap[c]] = [heap[c], heap[i]];
    i = c;
    path.push(i);
    swaps++;
  }
  return { path, swaps };
}

function extractOp(h: number[]) {
  const heap = [...h];
  const min = heap[0];
  const last = heap.pop()!;
  if (heap.length === 0) return { heap, min, path: [] as number[], swaps: 0 };
  heap[0] = last;
  return { heap, min, ...siftDown(heap, 0) };
}

function buildHeap(arr: number[]) {
  const heap = [...arr];
  let swaps = 0;
  for (let i = (heap.length >> 1) - 1; i >= 0; i--) swaps += siftDown(heap, i).swaps;
  return { heap, swaps };
}

type S = { heap: number[]; path: number[]; swaps: number; inserts: number; last: string };

const PRESET_LABELS = ["Empty heap", "Build-heap (10 keys)", "Extract-heavy"];

function presetState(i: number): S {
  if (i === 0) return { heap: [], path: [], swaps: 0, inserts: 0, last: "empty heap, counter reset — insert keys" };
  const built = buildHeap(UNSORTED);
  if (i === 1) {
    const oneByOne = UNSORTED.reduce((acc, v) => {
      const r = insertOp(acc.h, v);
      return { h: r.heap, n: acc.n + r.swaps };
    }, { h: [] as number[], n: 0 });
    return {
      heap: built.heap, path: [], swaps: built.swaps, inserts: 0,
      last: `build-heap on 10 unsorted keys: ${built.swaps} swaps; inserting the same keys one-by-one costs ${oneByOne.n}`,
    };
  }
  let h = built.heap, total = built.swaps, path: number[] = [];
  const mins: number[] = [];
  for (let k = 0; k < 3; k++) {
    const r = extractOp(h);
    h = r.heap; total += r.swaps; path = r.path; mins.push(r.min);
  }
  return { heap: h, path, swaps: total, inserts: 0, last: `extracted ${mins.join(", then ")} — the minimum every time, each followed by a sift-down` };
}

export default function HeapSiftVisualizer() {
  // D3: opens on the build-heap preset — a live 10-key heap with the
  // Floyd-vs-inserts swap comparison already in the note.
  const [s, setS] = useState<S>(() => presetState(1));
  const [active, setActive] = useState<number | null>(1);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);

  function doInsert() {
    const v = /^\d{1,2}$/.test(draft.trim()) ? Number(draft.trim()) : null;
    if (v === null) return setNote("Type an integer key, 0–99.");
    if (s.heap.length >= MAX_KEYS) return setNote(`Heap full at ${MAX_KEYS} keys — extract or reset.`);
    const r = insertOp(s.heap, v);
    setS({ heap: r.heap, path: r.path, swaps: s.swaps + r.swaps, inserts: s.inserts + 1, last: `insert ${v}: ${r.swaps} swap${r.swaps === 1 ? "" : "s"}, settled at index ${r.path[r.path.length - 1]}` });
    setActive(null); setDraft(""); setNote(null);
  }
  function doExtract() {
    if (s.heap.length === 0) return setNote("The heap is empty — nothing to extract.");
    const r = extractOp(s.heap);
    setS({ ...s, heap: r.heap, path: r.path, swaps: s.swaps + r.swaps, last: `extract-min returned ${r.min}: ${r.swaps} swap${r.swaps === 1 ? "" : "s"} sifting the promoted leaf down` });
    setActive(null); setNote(null);
  }

  const n = s.heap.length;
  const depth = n ? Math.floor(Math.log2(n)) : 0;
  const hot = new Set(s.path);
  const NX = (i: number) => { const d = Math.floor(Math.log2(i + 1)); return ((i - (2 ** d - 1) + 0.5) / 2 ** d) * 480; };
  const NY = (i: number) => 22 + Math.floor(Math.log2(i + 1)) * 42;
  const arrY = 22 + depth * 42 + 36;
  const cellX = (i: number) => (480 - 30 * n) / 2 + 30 * i;
  const taskMsg =
    s.inserts === 5 && n === 5
      ? s.swaps === 0
        ? " — five inserts, zero swaps: task one done (ascending order never violates the parent)."
        : s.swaps === 6
          ? " — six swaps, the maximum five inserts can force: every key climbed to the root."
          : null
      : null;

  return (
    <Panel>
      <PresetGroup labels={PRESET_LABELS} activeIndex={active} onSelect={(i) => { setS(presetState(i)); setActive(i); setDraft(""); setNote(null); }} />
      <form className="flex items-end gap-2" onSubmit={(e: FormEvent<HTMLFormElement>) => { e.preventDefault(); doInsert(); }}>
        <div className="grow">
          <TextInput label="key (0–99)" value={draft} onChange={(v) => { setDraft(v); setNote(null); }} maxLength={2} />
        </div>
        <Button type="submit">insert</Button>
        <Button onClick={doExtract}>extract-min</Button>
      </form>
      <p className="min-h-5 pt-1 text-xs text-faint">{note ?? `last operation: ${s.last}`}</p>
      <Readout>
        n = <strong>{n}</strong> · swap counter = <strong>{s.swaps}</strong>
        {n > 0 && <> · minimum at Q[0] = <strong>{s.heap[0]}</strong></>}
        {taskMsg}
      </Readout>
      {n > 0 && (
        <svg viewBox={`0 0 480 ${arrY + 48}`} className="mt-2 w-full" role="img" aria-label={`Min-heap with ${n} keys shown as a tree and as an array; swap counter ${s.swaps}`}>
          {s.heap.map((_, i) => i > 0 && (
            <line key={`e${i}`} x1={NX((i - 1) >> 1)} y1={NY((i - 1) >> 1)} x2={NX(i)} y2={NY(i)}
              stroke={hot.has(i) && hot.has((i - 1) >> 1) ? "var(--accent)" : "currentColor"}
              strokeWidth={hot.has(i) && hot.has((i - 1) >> 1) ? 2 : 1} opacity={hot.has(i) && hot.has((i - 1) >> 1) ? 0.9 : 0.3} />
          ))}
          {s.heap.map((v, i) => (
            <g key={`n${i}`}>
              <circle cx={NX(i)} cy={NY(i)} r="13" fill="var(--panel)" stroke={hot.has(i) ? "var(--accent)" : "currentColor"} strokeWidth={hot.has(i) ? 2 : 1} />
              <text x={NX(i)} y={NY(i) + 4} fontSize="12" fill="currentColor" textAnchor="middle">{v}</text>
            </g>
          ))}
          <text x="2" y={arrY - 8} fontSize="10" fill="currentColor" opacity="0.55">same heap as an array — children of i at 2i+1, 2i+2</text>
          {s.heap.map((v, i) => (
            <g key={`c${i}`}>
              <rect x={cellX(i)} y={arrY} width="30" height="26" fill="var(--panel)" stroke={hot.has(i) ? "var(--accent)" : "currentColor"} strokeWidth={hot.has(i) ? 2 : 1} opacity={hot.has(i) ? 1 : 0.5} />
              <text x={cellX(i) + 15} y={arrY + 17} fontSize="12" fill="currentColor" textAnchor="middle">{v}</text>
              <text x={cellX(i) + 15} y={arrY + 38} fontSize="9" fill="currentColor" opacity="0.45" textAnchor="middle">{i}</text>
            </g>
          ))}
        </svg>
      )}
    </Panel>
  );
}
