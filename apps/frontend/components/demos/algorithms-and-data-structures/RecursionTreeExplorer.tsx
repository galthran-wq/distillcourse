"use client";

/**
 * RecursionTreeExplorer — set a, b, and f(n) = n^k for T(n) = aT(n/b) + f(n);
 * the demo draws the recursion tree level by level (bars subdivided into the
 * a^i equal-cost calls at each depth), totals each level, and names the
 * Master-theorem case. What a static figure can't show: the level totals
 * tilting continuously from flat into a decreasing or increasing geometric
 * series as one parameter moves — including the exact threshold a = 3 where,
 * with f(n) = n and b = 2, the leaves take over from the combine step.
 * Guided task (lesson Task block): confirm merge sort's flat totals, tilt
 * them with f(n) = n² (case 3) and f(n) = 1 (case 1), then find the smallest
 * a that beats a linear combine step. Depth is fixed at 5, so n = b⁵.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout, TargetList } from "@/components/ui";

const AMBER = "#e2903a"; // the dominant level(s) — where the cost lives
const BLUE = "#4c8dd6"; // every other level
const DEPTH = 5;
const EPS = 1e-9;

const PRESETS = [
  { label: "Merge sort", a: 2, b: 2, k: 1 },
  { label: "Binary search", a: 1, b: 2, k: 0 },
  { label: "Heavy combine (case 3)", a: 2, b: 2, k: 2 },
] as const;

const fmt = (x: number): string =>
  x >= 1e6
    ? x.toExponential(1).replace("e+", "e")
    : x >= 100
      ? Math.round(x).toLocaleString("en-US")
      : Math.abs(x - Math.round(x)) < 0.05
        ? String(Math.round(x))
        : x.toFixed(1);

const fDisplay = (k: number) => (k === 0 ? "1" : k === 0.5 ? "√n" : k === 1 ? "n" : `n^${k}`);

function Pow({ e }: { e: number }) {
  if (Math.abs(e) < 0.005) return <>1</>;
  if (Math.abs(e - 1) < 0.005) return <>n</>;
  return (
    <>
      n<sup>{Math.abs(e - Math.round(e)) < 0.005 ? Math.round(e) : e.toFixed(2)}</sup>
    </>
  );
}

// bar-chart geometry (SVG user units)
const VW = 480, X0 = 118, X1 = 472, ROW = 30, Y0 = 26, BAR = 16;
const VH = Y0 + (DEPTH + 1) * ROW + 4;

export default function RecursionTreeExplorer() {
  // D3: opens on merge sort — six equal cn bars, the balanced case, on screen.
  const [a, setA] = useState<number>(PRESETS[0].a);
  const [b, setB] = useState<number>(PRESETS[0].b);
  const [k, setK] = useState<number>(PRESETS[0].k);
  const [latched, setLatched] = useState([false, false, false]);

  const n = Math.pow(b, DEPTH);
  const ratio = a / Math.pow(b, k); // one level's total over the one above
  const caseNum = ratio > 1 + EPS ? 1 : ratio < 1 - EPS ? 3 : 2;
  const shape = caseNum === 1 ? "leaf-dominated" : caseNum === 2 ? "balanced" : "root-dominated";
  const w = Math.log(a) / Math.log(b); // watershed exponent log_b a

  const totals = Array.from({ length: DEPTH + 1 }, (_, i) =>
    Math.pow(a, i) * Math.pow(b, k * (DEPTH - i)),
  );
  const maxTotal = Math.max(...totals);
  const sum = totals.reduce((s, t) => s + t, 0);
  const domIndex = caseNum === 1 ? DEPTH : caseNum === 3 ? 0 : null; // null = all tie
  const domShare = Math.round((100 * (domIndex === null ? totals[0] : totals[domIndex])) / sum);

  // A target's met test, as a function of any (a, b, k) state.
  const mets = (ta: number, tb: number, tk: number): boolean[] => [
    ta === 2 && tb === 2 && ta / Math.pow(tb, tk) < 1 - EPS,
    ta === 2 && tb === 2 && tk === 0,
    tk === 1 && tb === 2 && ta === 3,
  ];
  const [metTilt, metLeaf, metThreshold] = mets(a, b, k);
  const set = (na: number, nb: number, nk: number) => {
    setA(na); setB(nb); setK(nk);
    const m = mets(na, nb, nk); // latch on the state being entered
    setLatched((p) => p.map((v, i) => v || m[i]));
  };

  const trend = caseNum === 2 ? "flat" : caseNum === 1 ? "increasing" : "decreasing";
  const active = PRESETS.findIndex((p) => p.a === a && p.b === b && p.k === k);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => set(PRESETS[i].a, PRESETS[i].b, PRESETS[i].k)}
      />
      <TargetList
        targets={[
          { label: "Tilt merge sort into case 3 by changing only f — try f(n) = n²", met: metTilt, latched: latched[0] },
          { label: "Now f(n) = 1: the same tree turns leaf-dominated (case 1)", met: metLeaf, latched: latched[1] },
          {
            label: "With f(n) = n and b = 2, find the smallest a where the leaves take over",
            detail: k === 1 && b === 2 ? `now a = ${a}: case ${caseNum}` : undefined,
            met: metThreshold, latched: latched[2],
          },
        ]}
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <Slider label="a — calls per level" value={a} min={1} max={9} step={1}
          onChange={(v) => set(v, b, k)} display={`a = ${a}`} ariaLabel="Branching factor a, subproblems per call" />
        <Slider label="b — shrink factor" value={b} min={2} max={4} step={1}
          onChange={(v) => set(a, v, k)} display={`b = ${b}`} ariaLabel="Shrink factor b, each subproblem is n over b" />
        <Slider label="f(n) = nᵏ — local work" value={k} min={0} max={3} step={0.5}
          onChange={(v) => set(a, b, v)} display={`f(n) = ${fDisplay(k)}`}
          ariaLabel="Exponent k of the driving function n to the k" ariaValueText={`f of n equals ${fDisplay(k)}`} />
      </div>
      <Readout>
        T(n) = {a}T(n/{b}) + {fDisplay(k)}. Watershed <Pow e={w} />; f(n) = <Pow e={k} />{" "}
        {caseNum === 2 ? "matches it" : caseNum === 1 ? "is polynomially smaller" : "is polynomially larger"}:{" "}
        <strong>case {caseNum} ({shape})</strong>, T(n) = Θ(
        {caseNum === 1 ? <Pow e={w} /> : k === 0 ? "log n" : <Pow e={k} />}
        {caseNum === 2 && k > 0 ? " log n" : ""}). The{" "}
        {domIndex === null ? "levels share the cost equally" : domIndex === 0 ? `root level carries ${domShare}% of the sum` : `leaves carry ${domShare}% of the sum`}.
      </Readout>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="mt-2 w-full select-none" role="img"
        aria-label={`Recursion tree for n = ${n}: per-level work totals are ${trend}, ratio ${ratio.toFixed(2)} per level. Case ${caseNum}, ${shape}.`}>
        <text x={X0} y={12} fontSize="11" fill="currentColor" opacity="0.8">
          level totals ×{ratio.toFixed(2)} per level → {trend} {caseNum === 2 ? "(sum = total × levels)" : caseNum === 1 ? "(leaves decide)" : "(root decides)"}
        </text>
        {totals.map((t, i) => {
          const nodes = Math.pow(a, i);
          const bw = Math.max((t / maxTotal) * (X1 - X0), 2);
          const y = Y0 + i * ROW;
          const inside = bw > 290;
          return (
            <g key={i}>
              <text x={4} y={y + BAR - 3} fontSize="11" fill="currentColor" opacity="0.8">
                {i === DEPTH ? `leaves · ${fmt(nodes)}` : `level ${i} · ${fmt(nodes)} call${nodes === 1 ? "" : "s"}`}
              </text>
              <rect x={X0} y={y} width={bw} height={BAR} rx="2"
                fill={domIndex === null || domIndex === i ? AMBER : BLUE} />
              {nodes > 1 && nodes <= 48 &&
                Array.from({ length: nodes - 1 }, (_, j) => (
                  <line key={j} x1={X0 + (bw * (j + 1)) / nodes} y1={y}
                    x2={X0 + (bw * (j + 1)) / nodes} y2={y + BAR}
                    stroke="var(--panel)" strokeWidth="1" />
                ))}
              <text x={inside ? X0 + bw - 5 : X0 + bw + 5} y={y + BAR - 4}
                textAnchor={inside ? "end" : "start"} fontSize="10" fontWeight="bold"
                fill={inside ? "var(--panel)" : "currentColor"}>
                {fmt(t)}
              </text>
            </g>
          );
        })}
      </svg>
    </Panel>
  );
}
