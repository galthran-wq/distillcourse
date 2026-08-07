"use client";

/**
 * HashCollisionExplorer — type keys into a fixed 8-slot table under a
 * selectable hash function and collision policy; bucket contents and the
 * probe sequence for the newest key update live, with a bucket preview as
 * you type so colliding keys can be hunted deliberately. Guided task
 * (lesson <Task>): find three keys sharing a bucket, insert them, and read
 * off chaining's 3 examined keys vs linear probing's 3 probes; the
 * near-full preset then makes probing's cost blow up while chaining's
 * barely moves. Presets: good hash (a chain of 2 on arrival), bad hash
 * (identity mod 4 piles everything into four buckets), near-full table.
 */
import { useState, type FormEvent } from "react";
import { Button, Panel, PresetGroup, Readout, TextInput } from "@/components/ui";

const M = 8; // fixed table size — no resizing, so α is fully load-driven
const MAX_KEYS = 12;

/** Digit strings hash by numeric value ("identity"); words by char codes. */
function keyValue(s: string): number {
  if (/^[0-9]+$/.test(s)) return parseInt(s, 10);
  let v = 0;
  for (const ch of s) v = (Math.imul(v, 31) + ch.charCodeAt(0)) >>> 0;
  return v;
}

const HASHES = {
  good: {
    label: "mixing (good)",
    fn: (s: string) => Math.imul(keyValue(s), 2654435761) >>> 29,
  },
  bad: { label: "identity mod 4 (bad)", fn: (s: string) => keyValue(s) % 4 },
} as const;
type HashName = keyof typeof HASHES;

const PRESETS: { label: string; hash: HashName; keys: string[] }[] = [
  { label: "Good hash", hash: "good", keys: ["oak", "ash"] },
  { label: "Bad hash (identity mod 4)", hash: "bad", keys: ["4", "7", "8", "12"] },
  { label: "Near-full table", hash: "good", keys: ["map", "ada", "cat", "dog", "fox"] },
];

function Chip({ label, note, step, target }: { label: string; note?: string; step?: number; target?: boolean }) {
  return (
    <span
      className={`inline-flex items-baseline rounded border px-1.5 py-0.5 font-mono text-xs ${
        target ? "border-accent bg-accent/10 text-accent" : step !== undefined ? "border-accent/60" : "border-line"
      }`}
    >
      {label}
      {note !== undefined && <span className="ml-1 text-[10px] text-faint">{note}</span>}
      {step !== undefined && <sup className="ml-0.5 text-[9px] text-accent">{step}</sup>}
    </span>
  );
}

export default function HashCollisionExplorer() {
  // D3: opens on the good-hash preset — "oak" and "ash" already share
  // bucket 6, so a collision (and probing's displacement) is on screen.
  const [hash, setHash] = useState<HashName>(PRESETS[0].hash);
  const [keys, setKeys] = useState<string[]>(PRESETS[0].keys);
  const [policy, setPolicy] = useState<"chain" | "probe">("chain");
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const h = HASHES[hash].fn;
  const last = keys.length > 0 ? keys[keys.length - 1] : null;

  // Both tables rebuild synchronously from the key sequence (D2), so the
  // readout can always compare the two policies on identical contents.
  const chains: string[][] = Array.from({ length: M }, () => []);
  for (const k of keys) chains[h(k)].push(k);

  const slots: (string | null)[] = Array<string | null>(M).fill(null);
  const overflow: string[] = [];
  for (const k of keys) {
    let i = h(k);
    let probes = 1;
    while (slots[i] !== null && probes <= M) {
      i = (i + 1) % M;
      probes++;
    }
    if (probes > M) overflow.push(k);
    else slots[i] = k;
  }

  const lastBucket = last === null ? -1 : h(last);
  const chainCost = last === null ? 0 : chains[lastBucket].indexOf(last) + 1;
  const path: number[] = []; // slots examined to find `last` under probing
  let probeFound = false;
  if (last !== null) {
    let i = lastBucket;
    for (let n = 0; n < M; n++) {
      path.push(i);
      if (slots[i] === last) {
        probeFound = true;
        break;
      }
      i = (i + 1) % M;
    }
  }

  const activePreset = PRESETS.findIndex(
    (p) => p.hash === hash && p.keys.length === keys.length && p.keys.every((k, i) => k === keys[i]),
  );

  function applyPreset(i: number) {
    setHash(PRESETS[i].hash);
    setKeys(PRESETS[i].keys);
    setDraft("");
    setNote(null);
  }

  function insert(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const k = draft.trim();
    if (k === "") setNote("Type a key first.");
    else if (keys.includes(k)) setNote(`"${k}" is already in the table.`);
    else if (keys.length >= MAX_KEYS) setNote(`Limit of ${MAX_KEYS} keys reached — pick a preset to reset.`);
    else {
      setKeys([...keys, k]);
      setDraft("");
      setNote(null);
    }
  }

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={applyPreset}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="hash function">
          <span className="text-xs text-faint">hash</span>
          {(Object.keys(HASHES) as HashName[]).map((name) => (
            <Button key={name} active={hash === name} onClick={() => setHash(name)}>
              {HASHES[name].label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="collision policy">
          <span className="text-xs text-faint">policy</span>
          <Button active={policy === "chain"} onClick={() => setPolicy("chain")}>
            chaining
          </Button>
          <Button active={policy === "probe"} onClick={() => setPolicy("probe")}>
            linear probing
          </Button>
        </div>
      </div>
      <form className="flex items-end gap-2" onSubmit={insert}>
        <div className="grow">
          <TextInput
            label="key to insert"
            value={draft}
            onChange={(v) => {
              setDraft(v);
              setNote(null);
            }}
            maxLength={10}
          />
        </div>
        <Button type="submit">insert</Button>
      </form>
      <p className="min-h-5 pt-1 text-xs text-faint">
        {note ??
          (draft.trim() === ""
            ? "type any key — this line previews its bucket before you commit"
            : `"${draft.trim()}" hashes to bucket ${h(draft.trim())}`)}
      </p>
      <Readout>
        {last === null ? (
          <>The table is empty — insert a key.</>
        ) : (
          <>
            Finding <strong className="font-mono">{last}</strong> (newest key): chaining examines{" "}
            <strong>{chainCost}</strong> {chainCost === 1 ? "key" : "keys"}; linear probing{" "}
            {probeFound ? (
              <>
                makes <strong>{path.length}</strong> {path.length === 1 ? "probe" : "probes"}
              </>
            ) : (
              <>never stored it — all {M} slots are full</>
            )}
            . Load factor α = {keys.length}/{M} = {(keys.length / M).toFixed(2)}.
          </>
        )}
      </Readout>
      <div className="mt-2">
        {policy === "chain"
          ? chains.map((chain, b) => (
              <div key={b} className="flex min-h-9 flex-wrap items-center gap-1.5 border-t border-line py-1 first:border-t-0">
                <span className={`w-5 shrink-0 text-right font-mono text-xs ${b === lastBucket ? "font-bold text-accent" : "text-faint"}`}>
                  {b}
                </span>
                {chain.length === 0 && <span className="text-xs text-faint">·</span>}
                {chain.map((k, j) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    {j > 0 && (
                      <span aria-hidden="true" className="text-xs text-faint">
                        →
                      </span>
                    )}
                    <Chip label={k} target={k === last} step={b === lastBucket && j < chainCost ? j + 1 : undefined} />
                  </span>
                ))}
              </div>
            ))
          : slots.map((k, i) => (
              <div key={i} className="flex min-h-9 flex-wrap items-center gap-1.5 border-t border-line py-1 first:border-t-0">
                <span className={`w-5 shrink-0 text-right font-mono text-xs ${i === lastBucket ? "font-bold text-accent" : "text-faint"}`}>
                  {i}
                </span>
                {k === null ? (
                  <span className="text-xs text-faint">empty</span>
                ) : (
                  <Chip
                    label={k}
                    target={k === last}
                    step={path.indexOf(i) === -1 ? undefined : path.indexOf(i) + 1}
                    note={h(k) === i ? undefined : `home ${h(k)}`}
                  />
                )}
              </div>
            ))}
        {policy === "probe" && overflow.length > 0 && (
          <p className="pt-2 text-xs text-accent">
            no slot for {overflow.map((k) => `"${k}"`).join(", ")} — open addressing cannot hold more than {M} keys
          </p>
        )}
        <p className="pt-2 text-xs text-faint">
          Superscripts count the steps taken to find the newest key; &ldquo;home n&rdquo; marks a key pushed off its own bucket.
        </p>
      </div>
    </Panel>
  );
}
