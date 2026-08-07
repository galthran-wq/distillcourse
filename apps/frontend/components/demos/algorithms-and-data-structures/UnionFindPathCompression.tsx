"use client";

/**
 * UnionFindPathCompression — a live disjoint-set forest over 10 elements.
 * Click two elements to union their groups, the same element twice to run a
 * find; the preset row replays the entire recorded operation history under
 * naive linking, union by rank only, or rank + path compression, so one
 * union sequence can be compared across rule sets. Guided task (lesson
 * <Task>): naive unions 0-1, 1-2, ..., 5-6 build a height-6 chain; switching
 * to "Both optimizations" replays the same unions into a forest no taller
 * than 2, and a repeated find costs a single step. Presets: Naive union,
 * Union by rank only, Both optimizations.
 */
import { useState } from "react";
import { Button, Panel, PresetGroup, Readout } from "@/components/ui";

const N = 10;
const MAX_OPS = 40;
const MODES = ["Naive union", "Union by rank only", "Both optimizations"];

type Op = { kind: "u"; a: number; b: number } | { kind: "f"; x: number };

const CHAIN: Op[] = [0, 1, 2].map((k) => ({ kind: "u", a: k, b: k + 1 }));

/** Pure replay of the whole history under one rule set (D2: synchronous). */
function run(ops: Op[], mode: number) {
  const parent = Array.from({ length: N }, (_, i) => i);
  const rank = new Array(N).fill(0);
  let desc = "no operations yet";
  let changed: number[] = [];

  const find = (x: number) => {
    let r = x;
    let walked = 0;
    while (parent[r] !== r) {
      r = parent[r];
      walked += 1;
    }
    const repointed: number[] = [];
    if (mode === 2) {
      let cur = x;
      while (parent[cur] !== r) {
        const next = parent[cur];
        parent[cur] = r;
        repointed.push(cur);
        cur = next;
      }
    }
    return { r, walked, repointed };
  };

  for (const op of ops) {
    if (op.kind === "f") {
      const { r, walked, repointed } = find(op.x);
      desc =
        `find(${op.x}): walked ${walked} pointer${walked === 1 ? "" : "s"} to root ${r}` +
        (mode === 2 ? `, repointed ${repointed.length} node${repointed.length === 1 ? "" : "s"}` : "");
      changed = repointed;
    } else {
      const fa = find(op.a);
      const fb = find(op.b);
      changed = [...fa.repointed, ...fb.repointed];
      if (fa.r === fb.r) {
        desc = `union(${op.a},${op.b}): already in the same group`;
        continue;
      }
      let child = fa.r;
      let root = fb.r;
      if (mode >= 1 && rank[fa.r] >= rank[fb.r]) {
        child = fb.r;
        root = fa.r;
        if (rank[fa.r] === rank[fb.r]) rank[root] += 1;
      }
      parent[child] = root;
      changed = [...changed, child];
      desc = `union(${op.a},${op.b}): walked ${fa.walked + fb.walked}, attached root ${child} under root ${root}`;
    }
  }
  return { parent, desc, changed };
}

/** Column/depth layout: leaves get consecutive columns, parents center over children. */
function layout(parent: number[]) {
  const children: number[][] = Array.from({ length: N }, () => []);
  parent.forEach((p, i) => {
    if (p !== i) children[p].push(i);
  });
  const x = new Array(N).fill(0);
  const depth = new Array(N).fill(0);
  let cursor = 0;
  const place = (v: number, d: number): number => {
    depth[v] = d;
    if (children[v].length === 0) return (x[v] = cursor++);
    const xs = children[v].map((c) => place(c, d + 1));
    return (x[v] = (Math.min(...xs) + Math.max(...xs)) / 2);
  };
  const roots = parent.map((_, i) => i).filter((i) => parent[i] === i);
  roots.forEach((r, idx) => {
    if (idx > 0) cursor += 0.5;
    place(r, 0);
  });
  return { x, depth, cols: cursor, groups: roots.length };
}

export default function UnionFindPathCompression() {
  // D3: opens mid-story — three naive unions already forming a chain.
  const [mode, setMode] = useState(0);
  const [ops, setOps] = useState<Op[]>(CHAIN);
  const [sel, setSel] = useState<number | null>(null);

  const { parent, desc, changed } = run(ops, mode);
  const { x, depth, cols, groups } = layout(parent);
  const height = Math.max(...depth);
  const colW = 480 / Math.max(cols, 6);
  const X = (v: number) => (x[v] + 0.5) * colW;
  const Y = (v: number) => 26 + depth[v] * 38;

  const full = ops.length >= MAX_OPS;
  const hint = full
    ? `history full at ${MAX_OPS} operations — Undo or Clear to continue`
    : sel === null
      ? "click two elements to union their groups, or the same element twice to find it"
      : `selected ${sel} — click another element to union, or ${sel} again to find(${sel})`;

  function clickNode(i: number) {
    if (sel === null) return setSel(i);
    if (!full) setOps([...ops, sel === i ? { kind: "f", x: i } : { kind: "u", a: sel, b: i }]);
    setSel(null);
  }

  return (
    <Panel>
      <PresetGroup labels={MODES} activeIndex={mode} onSelect={setMode} />
      <p className="pb-1 text-xs text-faint">
        switching a preset replays your whole history ({ops.length} operation{ops.length === 1 ? "" : "s"}) under the new
        rule
      </p>
      <div className="flex flex-wrap items-center gap-1.5 py-1">
        {Array.from({ length: N }, (_, i) => (
          <Button key={i} className="w-11" active={sel === i} onClick={() => clickNode(i)}>
            {i}
          </Button>
        ))}
        <Button onClick={() => (setOps(ops.slice(0, -1)), setSel(null))}>Undo</Button>
        <Button onClick={() => (setOps([]), setSel(null))}>Clear</Button>
      </div>
      <p className="min-h-5 text-xs text-faint">
        {hint} · last: {desc}
      </p>
      <Readout>
        <strong>{groups}</strong> group{groups === 1 ? "" : "s"} · tallest tree height <strong>{height}</strong>
        {mode === 0 && height >= 6 && <> — a find at the bottom of that chain walks {height} pointers.</>}
        {mode === 2 && height <= 2 && ops.length > 0 && <> — no find here walks more than {Math.max(height, 1)}.</>}
      </Readout>
      <svg
        viewBox={`0 0 480 ${52 + height * 38}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`Disjoint-set forest: ${groups} trees over ${N} elements, tallest height ${height}`}
      >
        {Array.from({ length: height + 1 }, (_, d) => (
          <text key={d} x="2" y={30 + d * 38} fontSize="10" fill="currentColor" opacity="0.45">
            {d}
          </text>
        ))}
        {parent.map((p, i) =>
          p === i ? null : (
            <line key={i} x1={X(i)} y1={Y(i) - 13} x2={X(p)} y2={Y(p) + 13} stroke="currentColor" opacity="0.35" />
          ),
        )}
        {Array.from({ length: N }, (_, i) => {
          const hot = changed.includes(i);
          return (
            <g key={i}>
              <circle
                cx={X(i)}
                cy={Y(i)}
                r="13"
                fill="var(--panel)"
                stroke={hot ? "var(--accent)" : "currentColor"}
                strokeWidth={hot ? 2 : 1}
              />
              <text x={X(i)} y={Y(i) + 4} fontSize="12" fill="currentColor" textAnchor="middle">
                {i}
              </text>
            </g>
          );
        })}
      </svg>
    </Panel>
  );
}
