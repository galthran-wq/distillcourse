"use client";

/**
 * ReshardingExplorer — rebalancing cost, live. 200 keys on a ring, colored
 * by owning node under three schemes (tabs): hash mod N, 32 fixed
 * partitions, consistent hashing with 64 virtual nodes per node. Add or
 * remove a node; the readout gives the fraction of keys that moved on that
 * membership change, against the joiner/leaver's fair share of 1/N.
 * Guided task (lesson): add one node under each scheme, record the moved
 * fraction, find the scheme that keeps it near 1/N; then remove a node and
 * check the ranking holds in reverse. Arrives at N = 4 with node 3 just
 * added, so mod N's ~70% bill is visible immediately.
 */
import { useState } from "react";
import { Panel, Button, PresetGroup, Readout } from "@/components/ui";

const KEYS = 200, PARTS = 32, VNODES = 64, MIN_N = 2, MAX_N = 8;
const SCHEMES = ["hash mod N", "32 fixed partitions", "consistent hashing"];
// One color per node id; ids are reused (smallest free), so they stay ≤ MAX_N.
const COLORS = ["#e2903a", "#4f9edb", "#56b06a", "#c46fc4", "#d95f5f", "#8b84e0", "#3ab5ab", "#c7a02e", "#e0799e"];

function hash32(x: number): number {
  let h = x | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

const KEY_HASHES = Array.from({ length: KEYS }, (_, k) => hash32(k * 2654435761 + 12345));
// Fixed positions on the ring: angle = the key's hash, radius jittered so
// 200 dots read as a band instead of stacking on one circle.
const KEY_POS = KEY_HASHES.map((h, k) => {
  const a = (h / 2 ** 32) * 2 * Math.PI - Math.PI / 2;
  const r = 96 + (hash32(k + 777) % 33);
  return { x: 160 + r * Math.cos(a), y: 160 + r * Math.sin(a) };
});

/** Fixed-partition reassignment: keep every partition where it is, hand
 *  orphans to the emptiest node, then move only the excess until balanced. */
function rebalance(prev: number[], nodes: number[]): number[] {
  const next = [...prev];
  const count: Record<number, number> = {};
  for (const n of nodes) count[n] = 0;
  for (let i = 0; i < next.length; i++) {
    if (count[next[i]] === undefined) next[i] = -1;
    else count[next[i]] += 1;
  }
  const extreme = (sign: number) =>
    nodes.reduce((a, b) => (sign * (count[b] - count[a]) > 0 ? b : a));
  for (let i = 0; i < next.length; i++) {
    if (next[i] === -1) {
      next[i] = extreme(-1);
      count[next[i]] += 1;
    }
  }
  while (count[extreme(1)] - count[extreme(-1)] > 1) {
    const from = extreme(1), to = extreme(-1);
    next[next.indexOf(from)] = to;
    count[from] -= 1;
    count[to] += 1;
  }
  return next;
}

/** Karger ring: each node hashed to VNODES positions; a key belongs to the
 *  first virtual node clockwise. Positions depend only on the node id. */
function vnodeList(nodes: number[]): [number, number][] {
  const vn: [number, number][] = [];
  for (const n of nodes)
    for (let v = 0; v < VNODES; v++) vn.push([hash32(n * 7919 + v * 104729 + 1), n]);
  return vn.sort((a, b) => a[0] - b[0]);
}

function ringOwners(nodes: number[]): number[] {
  const vn = vnodeList(nodes);
  return KEY_HASHES.map((h) => {
    let lo = 0, hi = vn.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (vn[mid][0] < h) lo = mid + 1;
      else hi = mid;
    }
    return vn[lo === vn.length ? 0 : lo][1];
  });
}

function owners(scheme: number, nodes: number[], assign: number[]): number[] {
  if (scheme === 0) return KEY_HASHES.map((h) => nodes[h % nodes.length]);
  if (scheme === 1) return KEY_HASHES.map((h) => assign[h % PARTS]);
  return ringOwners(nodes);
}

const ASSIGN_3 = rebalance(new Array<number>(PARTS).fill(-1), [0, 1, 2]);

interface Membership {
  nodes: number[];
  prev: number[];
  assign: number[];
  prevAssign: number[];
  last: { verb: "added" | "removed"; id: number };
}

export default function ReshardingExplorer() {
  const [scheme, setScheme] = useState(0);
  // D3: arrive mid-story — node 3 was just added to a 3-node cluster.
  const [st, setSt] = useState<Membership>({
    nodes: [0, 1, 2, 3],
    prev: [0, 1, 2],
    assign: rebalance(ASSIGN_3, [0, 1, 2, 3]),
    prevAssign: ASSIGN_3,
    last: { verb: "added", id: 3 },
  });

  const addNode = () => {
    let id = 0;
    while (st.nodes.includes(id)) id++;
    const nodes = [...st.nodes, id];
    setSt({ nodes, prev: st.nodes, assign: rebalance(st.assign, nodes), prevAssign: st.assign, last: { verb: "added", id } });
  };
  const removeNode = () => {
    const nodes = st.nodes.slice(0, -1);
    setSt({ nodes, prev: st.nodes, assign: rebalance(st.assign, nodes), prevAssign: st.assign, last: { verb: "removed", id: st.nodes[st.nodes.length - 1] } });
  };

  const cur = owners(scheme, st.nodes, st.assign);
  const was = owners(scheme, st.prev, st.prevAssign);
  const movedKeys = cur.map((o, k) => o !== was[k]);
  const moved = movedKeys.filter(Boolean).length;
  const pct = Math.round((moved / KEYS) * 100);
  // The joiner (or leaver) owns 1/N of the keyspace at the larger N.
  const fairDen = Math.max(st.nodes.length, st.prev.length);
  const perNode: Record<number, number> = {};
  for (const o of cur) perNode[o] = (perNode[o] ?? 0) + 1;

  return (
    <Panel>
      <PresetGroup labels={SCHEMES} activeIndex={scheme} onSelect={setScheme} />
      <div className="flex flex-wrap gap-2 pb-3">
        <Button variant="solid" onClick={addNode} disabled={st.nodes.length >= MAX_N}>
          add a node
        </Button>
        <Button onClick={removeNode} disabled={st.nodes.length <= MIN_N}>
          remove a node
        </Button>
      </div>

      <Readout>
        {st.last.verb} node {st.last.id} under {SCHEMES[scheme]}:{" "}
        <strong>{moved}/{KEYS} keys moved ({pct}%)</strong> — the{" "}
        {st.last.verb === "added" ? "joiner's" : "leaver's"} fair share is 1/{fairDen} ={" "}
        {Math.round(100 / fairDen)}%
      </Readout>

      <svg
        viewBox="0 0 320 320"
        className="mx-auto mt-3 w-full max-w-[340px]"
        role="img"
        aria-label={`Ring of ${KEYS} keys on ${st.nodes.length} nodes under ${SCHEMES[scheme]}; ${pct}% of keys moved on the last membership change`}
      >
        {scheme === 2 &&
          vnodeList(st.nodes).map(([h, n], i) => {
            const a = (h / 2 ** 32) * 2 * Math.PI - Math.PI / 2;
            return (
              <line key={i} x1={160 + 136 * Math.cos(a)} y1={160 + 136 * Math.sin(a)} x2={160 + 146 * Math.cos(a)} y2={160 + 146 * Math.sin(a)} stroke={COLORS[n]} strokeWidth="1.5" />
            );
          })}
        {KEY_POS.map(({ x, y }, k) => (
          <circle key={k} cx={x} cy={y} r="4" fill={COLORS[cur[k]]} stroke={movedKeys[k] ? "currentColor" : "none"} strokeWidth="1.5" />
        ))}
        <text x="160" y="152" textAnchor="middle" fill="currentColor" fontSize="32" fontWeight="700">
          {pct}%
        </text>
        <text x="160" y="172" textAnchor="middle" fill="currentColor" fillOpacity="0.75" fontSize="12">
          of keys moved
        </text>
        <text x="160" y="188" textAnchor="middle" fill="currentColor" fillOpacity="0.75" fontSize="12">
          ({st.last.verb} node {st.last.id})
        </text>
      </svg>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2">
        {st.nodes.map((n) => (
          <span key={n} className="inline-flex items-center gap-1.5 text-xs">
            <span className="h-3 w-3 rounded-full" style={{ background: COLORS[n] }} />
            node {n} · {perNode[n] ?? 0} keys
          </span>
        ))}
      </div>
    </Panel>
  );
}
