"use client";

/**
 * BSTInsertDelete — insert and delete integer keys in a live BST and watch
 * the shape respond; the readout (and a dashed line in the drawing) tracks
 * the current height h against the floor ceil(lg(n+1)) - 1. Every edit
 * appends to an operation history that a slider can scrub, so the sorted
 * preset's height climb and the delete-heavy preset's successor splices
 * replay one operation at a time. Guided task (lesson <Task>): sorted 1..8
 * reaches h = 7 (a chain), the shuffled order 5,2,7,1,3,6,8,4 lands on the
 * floor h = 3. Presets: Sorted insertion, Shuffled insertion, Delete-heavy.
 */
import { useState, type FormEvent } from "react";
import { Button, Panel, PresetGroup, Readout, Slider, TextInput } from "@/components/ui";

type BST = { key: number; left: BST | null; right: BST | null } | null;
type Op = { type: "ins" | "del"; key: number };

const MAX_KEYS = 12;
const MAX_OPS = 24;

function insert(t: BST, key: number): BST {
  if (!t) return { key, left: null, right: null };
  if (key < t.key) return { ...t, left: insert(t.left, key) };
  if (key > t.key) return { ...t, right: insert(t.right, key) };
  return t;
}

/** Hibbard deletion: a two-child node is replaced by its in-order successor. */
function remove(t: BST, key: number): BST {
  if (!t) return null;
  if (key < t.key) return { ...t, left: remove(t.left, key) };
  if (key > t.key) return { ...t, right: remove(t.right, key) };
  if (!t.left) return t.right;
  if (!t.right) return t.left;
  let s = t.right;
  while (s.left) s = s.left;
  return { key: s.key, left: t.left, right: remove(t.right, s.key) };
}

const height = (t: BST): number => (t ? 1 + Math.max(height(t.left), height(t.right)) : -1);
const count = (t: BST): number => (t ? 1 + count(t.left) + count(t.right) : 0);
const has = (t: BST, key: number): boolean => (t ? (key === t.key ? true : has(key < t.key ? t.left : t.right, key)) : false);

const ins = (keys: number[]): Op[] => keys.map((key) => ({ type: "ins", key }));
const SHUFFLED = ins([5, 2, 7, 1, 3, 6, 8, 4]);
const PRESETS: { label: string; ops: Op[] }[] = [
  { label: "Sorted insertion", ops: ins([1, 2, 3, 4, 5, 6, 7, 8]) },
  { label: "Shuffled insertion", ops: SHUFFLED },
  // Four deletions, each of a two-child node, so every one splices a successor up.
  { label: "Delete-heavy", ops: [...SHUFFLED, ...[5, 2, 6, 7].map((key) => ({ type: "del" as const, key }))] },
];

export default function BSTInsertDelete() {
  // D3: opens on the shuffled preset fully applied — a bushy 8-key tree
  // already sitting exactly on the height floor.
  const [ops, setOps] = useState<Op[]>(PRESETS[1].ops);
  const [k, setK] = useState(PRESETS[1].ops.length);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);

  // The tree is a pure fold of the first k operations (D2: synchronous).
  const tree = ops.slice(0, k).reduce<BST>((t, op) => (op.type === "ins" ? insert(t, op.key) : remove(t, op.key)), null);
  const n = count(tree);
  const h = height(tree);
  const floor = n > 0 ? Math.ceil(Math.log2(n + 1)) - 1 : 0;
  const lastOp = k > 0 ? ops[k - 1] : null;

  const nodes: { key: number; ix: number; depth: number }[] = [];
  const edges: { from: number; to: number }[] = [];
  let ix = 0;
  (function walk(t: BST, depth: number) {
    if (!t) return;
    walk(t.left, depth + 1);
    nodes.push({ key: t.key, ix: ix++, depth });
    walk(t.right, depth + 1);
    for (const c of [t.left, t.right]) if (c) edges.push({ from: t.key, to: c.key });
  })(tree, 0);
  const X = (i: number) => ((nodes.find((p) => p.key === i)!.ix + 0.5) / n) * 480;
  const Y = (i: number) => 24 + nodes.find((p) => p.key === i)!.depth * 36;
  const floorY = 24 + floor * 36;

  const activePreset = PRESETS.findIndex(
    (p) => p.ops.length === ops.length && p.ops.every((op, i) => op.type === ops[i].type && op.key === ops[i].key),
  );

  function edit(type: Op["type"]) {
    const key = /^\d{1,2}$/.test(draft.trim()) ? Number(draft.trim()) : null;
    if (key === null) return setNote("Type an integer key, 0–99.");
    if (type === "ins" && has(tree, key)) return setNote(`${key} is already in the tree.`);
    if (type === "ins" && n >= MAX_KEYS) return setNote(`Limit of ${MAX_KEYS} keys — delete some or Clear.`);
    if (type === "del" && !has(tree, key)) return setNote(`${key} is not in the tree.`);
    if (k >= MAX_OPS) return setNote(`History full at ${MAX_OPS} operations — Clear or pick a preset.`);
    setOps([...ops.slice(0, k), { type, key }]);
    setK(k + 1);
    setDraft("");
    setNote(null);
  }

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setOps(PRESETS[i].ops);
          setK(PRESETS[i].ops.length);
          setDraft("");
          setNote(null);
        }}
      />
      <form
        className="flex items-end gap-2"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          edit("ins");
        }}
      >
        <div className="grow">
          <TextInput label="key (0–99)" value={draft} onChange={(v) => (setDraft(v), setNote(null))} maxLength={2} />
        </div>
        <Button type="submit">insert</Button>
        <Button onClick={() => edit("del")}>delete</Button>
        <Button
          onClick={() => {
            setOps([]);
            setK(0);
            setNote(null);
          }}
        >
          Clear
        </Button>
      </form>
      <p className="min-h-5 pt-1 text-xs text-faint">
        {note ?? (lastOp ? `last operation: ${lastOp.type === "ins" ? "insert" : "delete"} ${lastOp.key}` : "no operations yet")}
      </p>
      <div className="py-1">
        <Slider
          label="operations applied — drag to replay the history"
          value={k}
          min={0}
          max={ops.length}
          step={1}
          onChange={setK}
          display={`${k} / ${ops.length}`}
          ariaValueText={`${k} of ${ops.length} operations applied`}
        />
      </div>
      <Readout>
        {n === 0 ? (
          <>The tree is empty — insert a key or pick a preset.</>
        ) : (
          <>
            n = <strong>{n}</strong> keys · height h = <strong>{h}</strong> · floor ⌈lg(n+1)⌉−1 = <strong>{floor}</strong>
            {h === floor && <> — at the floor: no BST on {n} keys is flatter.</>}
            {n > 2 && h === n - 1 && <> — a chain: every operation now walks all {n} keys, exactly a linked list.</>}
          </>
        )}
      </Readout>
      {n > 0 && (
        <svg
          viewBox={`0 0 480 ${64 + h * 36}`}
          className="mt-2 w-full"
          role="img"
          aria-label={`Binary search tree with ${n} keys, height ${h}, floor ${floor}`}
        >
          {Array.from({ length: h + 1 }, (_, d) => (
            <text key={d} x="4" y={28 + d * 36} fontSize="10" fill="currentColor" opacity="0.45">
              {d}
            </text>
          ))}
          <line x1="16" y1={floorY} x2="480" y2={floorY} stroke="var(--accent)" strokeDasharray="4 4" opacity="0.6" />
          <text x="478" y={floorY - 5} fontSize="10" fill="var(--accent)" textAnchor="end">
            floor ⌈lg(n+1)⌉−1 = {floor}
          </text>
          {edges.map((e) => (
            <line key={e.to} x1={X(e.from)} y1={Y(e.from)} x2={X(e.to)} y2={Y(e.to)} stroke="currentColor" opacity="0.35" />
          ))}
          {nodes.map((p) => {
            const hot = lastOp?.type === "ins" && lastOp.key === p.key;
            return (
              <g key={p.key}>
                <circle
                  cx={X(p.key)}
                  cy={Y(p.key)}
                  r="13"
                  fill="var(--panel)"
                  stroke={hot ? "var(--accent)" : "currentColor"}
                  strokeWidth={hot ? 2 : 1}
                />
                <text x={X(p.key)} y={Y(p.key) + 4} fontSize="12" fill="currentColor" textAnchor="middle">
                  {p.key}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </Panel>
  );
}
