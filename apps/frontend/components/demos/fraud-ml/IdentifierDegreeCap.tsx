"use client";

/**
 * IdentifierDegreeCap — the lesson's nine users and seven shared identifiers.
 * Two users are joined when they share an identifier used by at most `cap`
 * users; union-find components recolour as the cap moves. The library PC and
 * the café IP reach users not drawn, kept as two weighted nodes so the
 * "labelled" count is the real one (63 at cap 60, 456 at cap 400).
 */
import { useState } from "react";
import { Panel, PresetGroup, Readout, Slider } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#3a7bd5";

// Nodes 0–8 are U1–U9; 9 and 10 stand for the undrawn users of d4 and p1.
const NODES = [
  ...Array.from({ length: 9 }, (_, i) => ({ name: `U${i + 1}`, size: 1, x: 36 + i * 52 })),
  { name: "56 PC users", size: 56, x: 528 },
  { name: "393 café users", size: 393, x: 600 },
];
const FLAGGED = new Set([1, 6]);
const RINGS = ["0,1,2", "5,6,7"];

const IDS = [
  { name: "k1", note: "card", x: 70, members: [0, 1, 2] },
  { name: "d1", note: "device", x: 140, members: [0, 1] },
  { name: "d2", note: "device", x: 210, members: [1, 2] },
  { name: "k2", note: "card", x: 280, members: [5, 6] },
  { name: "d3", note: "device", x: 350, members: [5, 6, 7] },
  { name: "d4", note: "library PC", x: 450, members: [2, 3, 4, 8, 9] },
  { name: "p1", note: "café IP", x: 560, members: [0, 2, 3, 4, 5, 7, 8, 10] },
].map((id) => ({ ...id, degree: id.members.reduce((s, m) => s + NODES[m].size, 0) }));

// Every integer to 100, then tens: the thresholds that matter (2, 3, 59, 60)
// each get their own keyboard step.
const CAPS = [
  ...Array.from({ length: 100 }, (_, i) => i + 1),
  ...Array.from({ length: 40 }, (_, i) => 110 + i * 10),
];

const PRESETS = [
  { label: "cap 1", cap: 1 },
  { label: "cap 10", cap: 10 },
  { label: "cap 500", cap: 500 },
];

function components(cap: number): number[][] {
  const parent = NODES.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (const id of IDS) {
    if (id.degree > cap) continue;
    for (const m of id.members) parent[find(m)] = find(id.members[0]);
  }
  const groups = new Map<number, number[]>();
  NODES.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]));
  return [...groups.values()];
}

export default function IdentifierDegreeCap() {
  const [idx, setIdx] = useState(CAPS.length - 1);
  const cap = CAPS[idx];
  const comps = components(cap);
  const compOf = new Map(comps.flatMap((c) => c.map((n) => [n, c] as const)));
  const hasFlag = (c: number[]) => c.some((n) => FLAGGED.has(n));
  const labelled = comps
    .filter(hasFlag)
    .flat()
    .filter((n) => !FLAGGED.has(n))
    .reduce((s, n) => s + NODES[n].size, 0);
  const flaggedComps = comps.filter(hasFlag).map((c) => c.join(","));
  const exact = flaggedComps.length === 2 && flaggedComps.every((c) => RINGS.includes(c));
  const groups = comps.filter((c) => c.length > 1);
  const alone = comps.filter((c) => c.length === 1).map((c) => NODES[c[0]].name);
  const names = (c: number[]) => `{${c.map((n) => NODES[n].name).join(", ")}}`;
  const active = PRESETS.findIndex((p) => p.cap === cap);

  const fill = (n: number) => {
    const c = compOf.get(n) ?? [n];
    if (FLAGGED.has(n)) return { fill: AMBER, opacity: 0.9 };
    if (hasFlag(c)) return { fill: AMBER, opacity: 0.3 };
    if (c.length > 1) return { fill: BLUE, opacity: 0.25 };
    return { fill: "none", opacity: 1 };
  };

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => setIdx(CAPS.indexOf(PRESETS[i].cap))}
      />
      <Slider
        label="identifier degree cap"
        value={idx}
        min={0}
        max={CAPS.length - 1}
        step={1}
        onChange={setIdx}
        display={`at most ${cap} users`}
        ariaLabel="Identifier degree cap"
        ariaValueText={`cap ${cap}`}
      />

      <svg viewBox="0 0 640 240" className="mt-3 w-full" role="img"
        aria-label={`Users and identifiers at cap ${cap}; ${groups.length} shared components`}>
        {IDS.flatMap((id) =>
          id.members.map((m) => (
            <line key={`${id.name}-${m}`} x1={NODES[m].x} y1={53} x2={id.x} y2={166}
              stroke="currentColor" strokeWidth={1.3}
              opacity={id.degree <= cap ? 0.55 : 0.12}
              strokeDasharray={id.degree <= cap ? undefined : "3 3"} />
          )),
        )}
        {NODES.map((node, n) => {
          const f = fill(n);
          const w = node.size > 1 ? 64 : 26;
          return (
            <g key={node.name}>
              <rect x={node.x - w / 2} y={27} width={w} height={26} rx={13}
                fill={f.fill} fillOpacity={f.opacity}
                stroke={f.fill === "none" ? "currentColor" : f.fill} strokeWidth={1.4} />
              <text x={node.x} y={44} textAnchor="middle" fontSize={node.size > 1 ? 10 : 10.5}
                fontWeight={600} fill="currentColor">
                {node.size > 1 ? `+${node.size}` : node.name}
              </text>
            </g>
          );
        })}
        {IDS.map((id) => {
          const kept = id.degree <= cap;
          return (
            <g key={id.name} opacity={kept ? 1 : 0.4}>
              <rect x={id.x - 22} y={166} width={44} height={24} rx={4} fill="none"
                stroke="currentColor" strokeWidth={1.3} strokeDasharray={kept ? undefined : "3 3"} />
              <text x={id.x} y={182} textAnchor="middle" fontSize={11} fontWeight={600} fill="currentColor">
                {id.name}
              </text>
              <text x={id.x} y={206} textAnchor="middle" fontSize={10.5} fill="currentColor">
                {id.degree} users
              </text>
              <text x={id.x} y={221} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.7}>
                {id.note}
              </text>
            </g>
          );
        })}
        <text x={8} y={16} fontSize={11} fill="currentColor" opacity={0.7}>
          users (U2, U7 flagged) · +n: users not drawn
        </text>
      </svg>

      <Readout>
        components: {groups.length ? groups.map(names).join(" · ") : "none"}
        {alone.length > 0 && <> · alone: {alone.join(", ")}</>}
      </Readout>
      <Readout>
        unflagged users labelled as fraud risks: <strong className="tabular-nums">{labelled}</strong>
        {exact && <> · both rings exact, nobody else labelled</>}
      </Readout>
    </Panel>
  );
}
