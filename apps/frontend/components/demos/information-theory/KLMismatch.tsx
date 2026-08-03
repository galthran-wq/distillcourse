"use client";

/**
 * KLMismatch — three targets to hit: push D(p‖q) past 2 bits while H(p) stays
 * put, open a gap of more than 3× between D(p‖q) and D(q‖p), and make the cost
 * infinite. Both coding costs are stacked bars (entropy floor + divergence), so
 * the asymmetry is measured, not asserted; the sliders are log-scaled because
 * the model probabilities that cost real bits are the small ones (kl-divergence).
 */
import { useRef, useState } from "react";
import { BitsBar, Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

type Dist = [number, number, number, number];
type State = { p: Dist; q: Dist; hit: boolean[] };

const RUNNING: Dist = [0.5, 0.25, 0.15, 0.1];
const PRESETS: { label: string; p: Dist; q: Dist }[] = [
  { label: "Perfect model", p: RUNNING, q: [0.5, 0.25, 0.15, 0.1] },
  { label: "Overconfident model", p: RUNNING, q: [0.8, 0.1, 0.05, 0.05] },
  { label: "Missing-outcome disaster", p: RUNNING, q: [0.5, 0.3, 0.2, 0] },
];

const OUTCOMES = ["A", "B", "C", "D"] as const;
const BLUE = "#4c8dd6"; // entropy floor (house palette: blue = the true distribution)
const AMBER = "#e2903a"; // the divergence stacked on top of that floor
const WARN = "#c0392b"; // the infinite penalty only

// geometry (SVG user units); BITS_MAX = cost-bar axis ceiling
const VW = 480, VH = 200, X0 = 40, X1 = 470, Y_TOP = 16, Y_BASE = 178;
const SLOT = (X1 - X0) / 4, BAR_W = SLOT * 0.3, BITS_MAX = 4;
const FLOOR = 1e-4; // smallest probability a slider can express (0 is its left stop)

const yOf = (v: number) => Y_BASE - v * (Y_BASE - Y_TOP);
// log slider mapping: position 0 = exactly 0, (0,1] = FLOOR…1 (~10% per notch),
// so a reader can walk q down into the region where the log ratio bites
const sPos = (v: number) => (v <= FLOOR ? 0 : Math.log(v / FLOOR) / Math.log(1 / FLOOR));
const sVal = (s: number) => (s <= 0 ? 0 : FLOOR * Math.pow(1 / FLOOR, s));
const fmt = (v: number) =>
  v === 0 ? "0" : v >= 0.095 ? v.toFixed(2) : v >= 0.001 ? v.toFixed(4) : v.toExponential(1);
const bits = (b: number) => (Number.isFinite(b) ? b.toFixed(3) : "∞");

const entropy = (p: Dist) => p.reduce((h, v) => (v > 0 ? h - v * Math.log2(v) : h), 0);
// +Infinity exactly when the second distribution is 0 where the first is not.
const divergence = (a: Dist, b: Dist) =>
  Math.max(0, a.reduce((d, v, i) => (v > 0 ? d + v * Math.log2(v / b[i]) : d), 0));

const H_RUN = entropy(RUNNING); // 1.743 bits — the entropy target 1 holds fixed

/** Everything the readouts and the three target checks are built from. */
function measure(p: Dist, q: Dist) {
  const Hp = entropy(p), Hq = entropy(q);
  const Dpq = divergence(p, q), Dqp = divergence(q, p);
  const finite = Number.isFinite(Dpq) && Number.isFinite(Dqp);
  const ratio = finite && Math.min(Dpq, Dqp) > 1e-9 ? Math.max(Dpq, Dqp) / Math.min(Dpq, Dqp) : NaN;
  const held = Math.abs(Hp - H_RUN) < 0.005; // H(p) still the running example's
  const met = [Number.isFinite(Dpq) && Dpq > 2 && held, ratio > 3, !Number.isFinite(Dpq)];
  return { Hp, Hq, Dpq, Dqp, finite, ratio, held, met };
}

/** New p, q — and a target stays ticked once it has been met (latching). */
function commit(s: State, p: Dist, q: Dist): State {
  const { met } = measure(p, q);
  return { p, q, hit: s.hit.map((h, i) => h || met[i]) };
}

export default function KLMismatch() {
  // D3: opens on the running example against a uniform model — H(p) = 1.743,
  // H(p,q) = 2.000, and the two divergences already visibly unequal.
  const init: State = { p: RUNNING, q: [0.25, 0.25, 0.25, 0.25], hit: [false, false, false] };
  const [{ p, q, hit }, setS] = useState<State>(init);

  // Set one outcome and renormalize the rest proportionally (sum stays 1).
  const move = (dist: 0 | 1, i: number, t: number) =>
    setS((s) => {
      const cur = dist === 0 ? s.p : s.q;
      const v = Math.min(1, Math.max(0, t)), rest = 1 - cur[i];
      const next = cur.map((w, j) =>
        j === i ? v : rest > 1e-9 ? (w / rest) * (1 - v) : (1 - v) / 3,
      ) as Dist;
      return dist === 0 ? commit(s, next, s.q) : commit(s, s.p, next);
    });

  // which bar the current pointer gesture owns (survives re-renders)
  const drag = useRef<{ dist: 0 | 1; idx: number } | null>(null);
  function dragTo(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * VW;
    const sy = ((e.clientY - r.top) / r.height) * VH;
    if (!drag.current) {
      const idx = Math.min(3, Math.max(0, Math.floor((sx - X0) / SLOT)));
      drag.current = { dist: sx - X0 - idx * SLOT < SLOT / 2 ? 0 : 1, idx };
    }
    move(drag.current.dist, drag.current.idx, Math.round(((Y_BASE - sy) / (Y_BASE - Y_TOP)) * 100) / 100);
  }

  const { Hp, Hq, Dpq, Dqp, finite, ratio, held, met } = measure(p, q);
  const activePreset = PRESETS.findIndex(
    (pr) =>
      pr.p.every((v, i) => Math.abs(v - p[i]) < 1e-9) &&
      pr.q.every((v, i) => Math.abs(v - q[i]) < 1e-9),
  );
  const t1 = `D(p‖q) = ${bits(Dpq)} · H(p) = ${Hp.toFixed(3)}${held ? "" : " — p left the running example; click a preset to restore it"}`;
  const t2 = finite
    ? `D(p‖q) ${bits(Dpq)} vs D(q‖p) ${bits(Dqp)} = ${Number.isFinite(ratio) ? `${ratio.toFixed(2)}×` : "0 vs 0"}`
    : "one direction is infinite — both must be finite to compare them";
  const t3 = met[2]
    ? "D(p‖q) = ∞ — the code has no word for an outcome that happens"
    : "D(p‖q) is finite: q still covers every outcome p produces";
  const rows = [
    { label: "p data, q code", floorLabel: "H(p)", floor: Hp, gapLabel: "D(p‖q)", gap: Dpq },
    { label: "q data, p code", floorLabel: "H(q)", floor: Hq, gapLabel: "D(q‖p)", gap: Dqp },
  ];

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setS((s) => commit(s, PRESETS[i].p, PRESETS[i].q))}
      />

      <TargetList
        targets={[
          ["1. Drive D(p‖q) past 2 bits without moving H(p)", t1],
          ["2. Make the two directions differ by more than 3×", t2],
          ["3. Send the cost off the scale: zero q where p keeps mass", t3],
        ].map(([label, detail], i) => ({ label, detail, met: met[i], latched: hit[i] }))}
      />

      <Readout>
        H(p) = <strong>{Hp.toFixed(3)}</strong> · H(p,q) = <strong>{bits(Hp + Dpq)}</strong> · D(p‖q)
        = <strong>{bits(Dpq)}</strong> · D(q‖p) = <strong>{bits(Dqp)}</strong>
        {Number.isFinite(Dpq) && Dpq < 0.005 && (
          <span className="pl-2 font-medium text-accent">q = p: no extra bits (Gibbs’ equality)</span>
        )}
      </Readout>

      {/* both coding costs: blue entropy floor + amber divergence, shared axis */}
      <BitsBar rows={rows} max={BITS_MAX} floorColor={BLUE} gapColor={AMBER} infColor={WARN} />

      {/* grouped bars: per outcome, blue p (left) and amber q (right), draggable */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={`Paired bars per outcome: ${p.map((v, i) => `${OUTCOMES[i]} true ${fmt(v)} model ${fmt(q[i])}`).join(", ")}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = null;
          dragTo(e);
        }}
        onPointerMove={(e) => drag.current && dragTo(e)}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      >
        <line x1={X0} y1={Y_TOP} x2={X0} y2={Y_BASE} stroke="currentColor" />
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" />
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={X0 - 4} y1={yOf(t)} x2={X0} y2={yOf(t)} stroke="currentColor" />
            <text x={X0 - 7} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill="currentColor">{t}</text>
          </g>
        ))}
        <rect x={X0 + 6} y={Y_TOP} width="10" height="10" fill={BLUE} />
        <text x={X0 + 20} y={Y_TOP + 9} fontSize="11" fill="currentColor">true p</text>
        <rect x={X0 + 66} y={Y_TOP} width="10" height="10" fill={AMBER} />
        <text x={X0 + 80} y={Y_TOP + 9} fontSize="11" fill="currentColor">model q</text>
        {OUTCOMES.map((name, i) => {
          const cx = X0 + SLOT * (i + 0.5);
          return (
            <g key={name} style={{ cursor: "ns-resize" }}>
              <rect x={cx - SLOT / 2} y={Y_TOP} width={SLOT} height={Y_BASE - Y_TOP} fill="transparent" />
              {([p[i], q[i]] as const).map((v, d) => {
                const bx = cx + (d === 0 ? -1 : 1) * SLOT * 0.19 - BAR_W / 2;
                return (
                  <g key={d}>
                    <rect x={bx} y={yOf(v)} width={BAR_W} height={Y_BASE - yOf(v)} rx="2" fill={d === 0 ? BLUE : AMBER} />
                    <text x={bx + BAR_W / 2} y={yOf(v) - 4} textAnchor="middle" fontSize="10" fill="currentColor">
                      {fmt(v)}
                    </text>
                  </g>
                );
              })}
              <text x={cx} y={Y_BASE + 16} textAnchor="middle" fontSize="12" fill="currentColor">{name}</text>
            </g>
          );
        })}
      </svg>

      <p className="pt-1 text-xs text-faint">
        Drag the bars for coarse moves; the sliders are log-scaled from 0.0001 to 1 (left stop is
        exactly 0), because the probabilities that cost real bits are the small ones.
      </p>
      {/* keyboard path: native sliders, same renormalization as dragging */}
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {([p, q] as const).flatMap((dist, d) =>
          OUTCOMES.map((name, i) => (
            <Slider key={`${d}${name}`} label={`${d === 0 ? "p" : "q"}(${name})`} min={0} max={1}
              step={0.01} value={sPos(dist[i])} display={fmt(dist[i])} ariaValueText={fmt(dist[i])}
              onChange={(s) => move(d as 0 | 1, i, sVal(s))}
              ariaLabel={`${d === 0 ? "True" : "Model"} probability of outcome ${name}`} />
          )),
        )}
      </div>
    </Panel>
  );
}
