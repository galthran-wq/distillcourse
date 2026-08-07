"use client";

/**
 * RotationBalancer — insert keys into a height-tracked BST with the AVL
 * fixup switchable on and off. Every insert is one replay step; when the
 * fixup fires, the rotation gets its own before/after step with the
 * violating node and the rotated neighborhood highlighted. Guided task
 * (lesson <Task>): sorted 1..6 with rotations off climbs to height 5;
 * with rotations on, three rotations pin the height at 2; then find a
 * six-key order that triggers a double rotation. Presets: Rotations off,
 * Rotations on, Worst-case order (9 keys).
 */
import { useState, type FormEvent } from "react";
import { Button, Panel, PresetGroup, Readout, Slider, TextInput } from "@/components/ui";

type Node = { k: number; l: Node | null; r: Node | null };
type T = Node | null;
type Frame = { t: T; note: string; hot: number[]; rots: number };

const MAX_KEYS = 12;
const RED = "#d64545";
const height = (t: T): number => (t ? 1 + Math.max(height(t.l), height(t.r)) : -1);
const count = (t: T): number => (t ? 1 + count(t.l) + count(t.r) : 0);
const bf = (t: Node): number => height(t.r) - height(t.l);
const fmt = (b: number): string => (b > 0 ? `+${b}` : String(b).replace("-", "−"));
const attach = (t: T, k: number): Node =>
  !t ? { k, l: null, r: null } : k < t.k ? { ...t, l: attach(t.l, k) } : { ...t, r: attach(t.r, k) };
const rotL = (t: Node): Node => ({ ...t.r!, l: { ...t, r: t.r!.l } });
const rotR = (t: Node): Node => ({ ...t.l!, r: { ...t, l: t.l!.r } });

/** Deepest node whose balance factor has left [-1, +1] — where the fixup fires. */
function lowestViolation(t: T, d = 0): { z: Node; d: number } | null {
  if (!t) return null;
  const a = lowestViolation(t.l, d + 1);
  const b = lowestViolation(t.r, d + 1);
  const below = a && b ? (a.d >= b.d ? a : b) : (a ?? b);
  return below ?? (Math.abs(bf(t)) > 1 ? { z: t, d } : null);
}

/** Rebalance the node holding `key`: single rotation outside, double inside. */
function fixAt(t: T, key: number): T {
  if (!t) return t;
  if (t.k !== key) return key < t.k ? { ...t, l: fixAt(t.l, key) } : { ...t, r: fixAt(t.r, key) };
  if (bf(t) > 1) return rotL(bf(t.r!) < 0 ? { ...t, r: rotR(t.r!) } : t);
  return rotR(bf(t.l!) > 0 ? { ...t, l: rotL(t.l!) } : t);
}

function buildFrames(keys: number[], fix: boolean): Frame[] {
  const out: Frame[] = [];
  let t: T = null;
  for (const key of keys) {
    t = attach(t, key);
    const v = lowestViolation(t);
    if (!v) {
      out.push({ t, note: `insert ${key}: no violation`, hot: [key], rots: 0 });
      continue;
    }
    const z = v.z;
    const right = bf(z) > 0;
    const y = right ? z.r! : z.l!;
    if (!fix) {
      out.push({ t, note: `insert ${key} → bf(${z.k}) = ${fmt(bf(z))} — fixup off, the violation stands`, hot: [key], rots: 0 });
      continue;
    }
    const outside = right ? bf(y) >= 0 : bf(y) <= 0;
    const move = outside
      ? `${right ? "left" : "right"} rotation at ${z.k}`
      : `${right ? "right–left" : "left–right"} double rotation at ${z.k}`;
    const kind = `${outside ? "outside" : "inside"} case — ${move}`;
    out.push({ t, note: `insert ${key} → bf(${z.k}) = ${fmt(bf(z))}: ${kind}`, hot: [key], rots: 0 });
    const lifted = outside ? y.k : (right ? y.l! : y.r!).k;
    t = fixAt(t, z.k);
    out.push({ t, note: `${move} done: ${lifted} lifted over ${z.k}`, hot: [z.k, y.k, lifted], rots: outside ? 1 : 2 });
  }
  return out;
}

const PRESETS: { label: string; keys: number[]; fix: boolean }[] = [
  { label: "Rotations off", keys: [1, 2, 3, 4, 5, 6], fix: false },
  { label: "Rotations on", keys: [1, 2, 3, 4, 5, 6], fix: true },
  { label: "Worst-case order, 9 keys", keys: [1, 2, 3, 4, 5, 6, 7, 8, 9], fix: true },
];

export default function RotationBalancer() {
  // D3: opens on "Rotations on" fully applied — the root rotation just fired,
  // its three-node neighborhood highlighted, height pinned at 2.
  const [keys, setKeys] = useState<number[]>(PRESETS[1].keys);
  const [fix, setFix] = useState(true);
  const [k, setK] = useState(buildFrames(PRESETS[1].keys, true).length);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);

  // Frames are a pure function of (keys, fix) — toggling the fixup re-runs
  // the whole insertion sequence under the other rule (D2: synchronous).
  const frames = buildFrames(keys, fix);
  const frame = k > 0 ? frames[k - 1] : null;
  const tree = frame?.t ?? null;
  const n = count(tree);
  const h = height(tree);
  const floor = n > 0 ? Math.floor(Math.log2(n)) : 0;
  const rots = frames.slice(0, k).reduce((s, f) => s + f.rots, 0);

  const nodes: { k: number; depth: number; b: number }[] = [];
  const edges: { from: number; to: number }[] = [];
  (function walk(t: T, depth: number) {
    if (!t) return;
    nodes.push({ k: t.k, depth, b: bf(t) });
    for (const c of [t.l, t.r]) if (c) edges.push({ from: t.k, to: c.k });
    walk(t.l, depth + 1);
    walk(t.r, depth + 1);
  })(tree, 0);
  // x is fixed by in-order rank in the FULL key set, so rotations visibly
  // move nothing left or right (the lesson figure's convention).
  const sorted = [...keys].sort((a, b) => a - b);
  const X = (key: number) => ((sorted.indexOf(key) + 0.5) / keys.length) * 480;
  const Y = (key: number) => 28 + nodes.find((p) => p.k === key)!.depth * 40;

  const activePreset = PRESETS.findIndex(
    (p) => p.fix === fix && p.keys.length === keys.length && p.keys.every((x, i) => x === keys[i]),
  );

  function apply(nextKeys: number[], nextFix: boolean) {
    setKeys(nextKeys);
    setFix(nextFix);
    setK(buildFrames(nextKeys, nextFix).length);
    setDraft("");
    setNote(null);
  }
  function insert() {
    const key = /^\d{1,2}$/.test(draft.trim()) ? Number(draft.trim()) : null;
    if (key === null) return setNote("Type an integer key, 0–99.");
    if (keys.includes(key)) return setNote(`${key} is already in the tree.`);
    if (keys.length >= MAX_KEYS) return setNote(`Limit of ${MAX_KEYS} keys — Clear or pick a preset.`);
    apply([...keys, key], fix);
  }

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => apply(PRESETS[i].keys, PRESETS[i].fix)}
      />
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          insert();
        }}
      >
        <div className="grow">
          <TextInput label="key (0–99)" value={draft} onChange={(v) => (setDraft(v), setNote(null))} maxLength={2} />
        </div>
        <Button type="submit">insert</Button>
        <Button onClick={() => apply([], fix)}>Clear</Button>
        <Button active={fix} onClick={() => apply(keys, !fix)}>
          fixup: {fix ? "on" : "off"}
        </Button>
      </form>
      <p className="min-h-5 pt-1 text-xs text-faint">{note ?? frame?.note ?? "empty tree — insert a key or pick a preset"}</p>
      {frames.length > 0 && (
        <div className="py-1">
          <Slider
            label="steps applied — drag to replay; each rotation is its own step"
            value={k}
            min={0}
            max={frames.length}
            step={1}
            onChange={setK}
            display={`${k} / ${frames.length}`}
            ariaValueText={`${k} of ${frames.length} steps applied`}
          />
        </div>
      )}
      <Readout>
        {n === 0 ? (
          <>The tree is empty.</>
        ) : (
          <>
            n = <strong>{n}</strong> keys · height h = <strong>{h}</strong> · ⌊lg n⌋ = <strong>{floor}</strong> · rotations so far = <strong>{rots}</strong>
            {fix && h === floor && <> — height pinned at the floor.</>}
            {!fix && n > 2 && h === n - 1 && <> — a chain: every operation walks all {n} keys.</>}
          </>
        )}
      </Readout>
      {n > 0 && (
        <svg
          viewBox={`0 0 480 ${64 + h * 40}`}
          className="mt-2 w-full"
          role="img"
          aria-label={`Search tree with ${n} keys, height ${h}, ${rots} rotations so far, fixup ${fix ? "on" : "off"}`}
        >
          {Array.from({ length: h + 1 }, (_, d) => (
            <text key={d} x="4" y={32 + d * 40} fontSize="10" fill="currentColor" opacity="0.45">
              {d}
            </text>
          ))}
          {edges.map((e) => (
            <line key={e.to} x1={X(e.from)} y1={Y(e.from)} x2={X(e.to)} y2={Y(e.to)} stroke="currentColor" opacity="0.35" />
          ))}
          {nodes.map((p) => {
            const bad = Math.abs(p.b) > 1;
            const hot = frame?.hot.includes(p.k) ?? false;
            return (
              <g key={p.k}>
                <circle
                  cx={X(p.k)}
                  cy={Y(p.k)}
                  r="13"
                  fill="var(--panel)"
                  stroke={bad ? RED : hot ? "var(--accent)" : "currentColor"}
                  strokeWidth={bad || hot ? 2 : 1}
                />
                <text x={X(p.k)} y={Y(p.k) + 4} fontSize="12" fill="currentColor" textAnchor="middle">
                  {p.k}
                </text>
                <text x={X(p.k) + 14} y={Y(p.k) - 10} fontSize="9" fill={bad ? RED : "currentColor"} opacity={bad ? 1 : 0.55}>
                  {fmt(p.b)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </Panel>
  );
}
