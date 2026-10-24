"use client";

/**
 * CircularMeanClock — a card's payment times on a 24-hour clock, with the
 * arithmetic mean (dashed blue) and the circular mean (amber, length R̄) as
 * two hands and the 90% von Mises arc fitted to those times on the rim. A
 * separate payment is scored against the arc, as the periodic time feature
 * does: the fit uses only the earlier payments.
 */
import { useState, type MouseEvent } from "react";
import { Button, Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";
const GREEN = "#5aa46a";
const ALPHA = 0.9;
const MAX_PAYMENTS = 6;
const DAY = 1440;
const SIX_AM = 360;

// Times are whole minutes since midnight, so presets compare exactly.
const PRESETS = [
  { label: "Afternoon card", times: [780, 840, 960], probe: 1140 },
  { label: "Seven-payment card", times: [1100, 1235, 1350, 50, 1158], probe: 1425 },
  { label: "No habit", times: [180, 540, 840, 1200], probe: SIX_AM },
] as const;

// Quadrature over [0, π] keeps large κ stable where a Bessel series overflows.
const GRID = Array.from({ length: 2000 }, (_, i) => ((i + 0.5) / 2000) * Math.PI);
const KAPPA_MAX = 300;
const weights = (k: number) => GRID.map((t) => Math.exp(k * (Math.cos(t) - 1)));

function meanResultant(k: number) {
  const w = weights(k);
  return w.reduce((s, x, i) => s + x * Math.cos(GRID[i]), 0) / w.reduce((s, x) => s + x, 0);
}

function kappaFor(rBar: number) {
  let [lo, hi] = [0, KAPPA_MAX];
  if (meanResultant(hi) <= rBar) return hi;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (meanResultant(mid) < rBar) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function halfWidth(k: number) {
  const w = weights(k);
  const total = w.reduce((s, x) => s + x, 0);
  let acc = 0;
  for (let i = 0; i < w.length; i++) if ((acc += w[i]) >= ALPHA * total) return GRID[i];
  return Math.PI;
}

const toAngle = (m: number) => (2 * Math.PI * m) / DAY;
const toMinutes = (a: number) => ((((a * DAY) / (2 * Math.PI)) % DAY) + DAY) % DAY;
// Shortest distance around the clock, in minutes.
const gap = (a: number, b: number) => Math.min(Math.abs(a - b), DAY - Math.abs(a - b));
const hhmm = (m: number) => {
  const r = Math.round(m) % DAY;
  return `${String(Math.floor(r / 60)).padStart(2, "0")}:${String(r % 60).padStart(2, "0")}`;
};

function fit(times: number[]) {
  const c = times.reduce((s, m) => s + Math.cos(toAngle(m)), 0) / times.length;
  const s = times.reduce((s, m) => s + Math.sin(toAngle(m)), 0) / times.length;
  const rBar = Math.hypot(c, s);
  const kappa = kappaFor(rBar);
  return {
    arith: times.reduce((a, m) => a + m, 0) / times.length,
    // R̄ ≈ 0: the arrows cancel and the direction is undefined.
    mu: rBar < 1e-3 ? null : toMinutes(Math.atan2(s, c)),
    rBar,
    kappa,
    half: toMinutes(halfWidth(kappa)),
  };
}

// Target 1: four payments, arithmetic hand ≥ 3 h from all of them, circular hand ≤ 2 h from one.
function splits(times: number[], f: ReturnType<typeof fit>) {
  const near = (m: number) => Math.min(...times.map((t) => gap(t, m)));
  return times.length === 4 && near(f.arith) >= 180 && f.mu !== null && near(f.mu) <= 120;
}

// Clock geometry: midnight at the top, running clockwise.
const C = 150;
const R = 108;
const pt = (m: number, r: number) => [C + r * Math.sin(toAngle(m)), C - r * Math.cos(toAngle(m))] as const;

function arcPath(from: number, to: number, r: number) {
  const [x1, y1] = pt(from, r);
  const [x2, y2] = pt(to, r);
  return `M${x1},${y1} A${r},${r} 0 ${(to - from + DAY) % DAY > DAY / 2 ? 1 : 0} 1 ${x2},${y2}`;
}

export default function CircularMeanClock() {
  // D3: the afternoon card — both hands agree, so the reader has to move the times to split them.
  const [times, setTimes] = useState<number[]>([...PRESETS[0].times]);
  const [probe, setProbe] = useState<number>(PRESETS[0].probe);
  const [sel, setSel] = useState(0);
  const [latched, setLatched] = useState([false, false]);

  const f = fit(times);
  const split = splits(times, f);
  const inside = f.mu !== null && gap(probe, f.mu) <= f.half;
  const live = [split, split && probe === SIX_AM];

  const update = (next: number[], nextProbe = probe) => {
    setTimes(next);
    setProbe(nextProbe);
    const ok = splits(next, fit(next));
    setLatched((l) => [l[0] || ok, l[1] || (ok && nextProbe === SIX_AM)]);
  };
  const moveSelected = (m: number) => update(times.map((t, i) => (i === sel ? m : t)));

  const onClock = (e: MouseEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 300 - C;
    const y = ((e.clientY - box.top) / box.height) * 300 - C;
    const m = Math.round(toMinutes(Math.atan2(x, -y)) / 15) * 15 % DAY;
    const hit = times.findIndex((t) => gap(t, m) <= 20);
    if (hit !== -1) setSel(hit);
    else moveSelected(m);
  };

  const active = PRESETS.findIndex(
    (p) => p.probe === probe && p.times.length === times.length && p.times.every((t, i) => t === times[i]),
  );
  const [ax, ay] = pt(f.arith, R * 0.9);
  const [mx, my] = f.mu === null ? [C, C] : pt(f.mu, R * f.rBar);
  const [px, py] = pt(probe, R);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={active === -1 ? null : active}
        onSelect={(i) => {
          setSel(0);
          update([...PRESETS[i].times], PRESETS[i].probe);
        }}
      />
      <TargetList
        targets={[
          {
            label: "With four payments, point the arithmetic hand 3 h or more from every payment while the circular hand sits within 2 h of one",
            detail: `arithmetic ${hhmm(f.arith)} · circular ${f.mu === null ? "undefined" : hhmm(f.mu)}`,
            met: live[0],
            latched: latched[0],
          },
          {
            label: "Keeping that card, score a payment at 06:00 against its 90% arc",
            detail: `scored ${hhmm(probe)} · ${inside ? "inside, flag 1" : "outside, flag 0"}`,
            met: live[1],
            latched: latched[1],
          },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
        <svg viewBox="0 0 300 300" className="w-full cursor-pointer" onClick={onClock} role="img"
          aria-label={`Clock: payments at ${times.map(hhmm).join(", ")}; arithmetic mean ${hhmm(f.arith)}; circular mean ${f.mu === null ? "undefined" : hhmm(f.mu)}; scored payment ${hhmm(probe)} ${inside ? "inside" : "outside"} the 90% arc`}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="currentColor" strokeOpacity="0.35" />
          {f.mu !== null &&
            (f.half >= DAY / 2 - 1 ? (
              <circle cx={C} cy={C} r={R} fill="none" stroke={AMBER} strokeOpacity="0.4" strokeWidth="10" />
            ) : (
              <path d={arcPath(f.mu - f.half, f.mu + f.half, R)} fill="none" stroke={AMBER} strokeOpacity="0.4" strokeWidth="10" />
            ))}
          {Array.from({ length: 24 }, (_, h) => {
            const [x1, y1] = pt(h * 60, R - (h % 3 ? 4 : 8));
            const [x2, y2] = pt(h * 60, R);
            const [tx, ty] = pt(h * 60, R + 20);
            return (
              <g key={h} fill="currentColor" fontSize="12">
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity="0.5" />
                {h % 3 === 0 && <text x={tx} y={ty + 4} textAnchor="middle">{String(h).padStart(2, "0")}</text>}
              </g>
            );
          })}
          <line x1={C} y1={C} x2={ax} y2={ay} stroke={BLUE} strokeWidth="2.5" strokeDasharray="6 4" />
          {f.mu !== null && <line x1={C} y1={C} x2={mx} y2={my} stroke={AMBER} strokeWidth="4" strokeLinecap="round" />}
          <circle cx={C} cy={C} r="3" fill="currentColor" />
          {times.map((t, i) => {
            const [x, y] = pt(t, R);
            return <circle key={i} cx={x} cy={y} r={i === sel ? 8 : 6} fill="currentColor" stroke={i === sel ? AMBER : "none"} strokeWidth="3" />;
          })}
          <circle cx={px} cy={py} r="10" fill="none" stroke={inside ? GREEN : "currentColor"} strokeWidth="2.5" strokeDasharray={inside ? undefined : "3 3"} />
        </svg>
        <div>
          <div className="flex flex-wrap gap-2 pb-2" role="group" aria-label="Payments in the history">
            {times.map((t, i) => (
              <Button key={i} active={i === sel} onClick={() => setSel(i)}>{hhmm(t)}</Button>
            ))}
            <Button disabled={times.length >= MAX_PAYMENTS} onClick={() => { setSel(times.length); update([...times, 720]); }}>+ add</Button>
            <Button disabled={times.length <= 2} onClick={() => { setSel(0); update(times.filter((_, i) => i !== sel)); }}>− remove {hhmm(times[sel])}</Button>
          </div>
          <Slider label="selected payment" value={times[sel]} min={0} max={DAY - 15} step={15} onChange={moveSelected} display={hhmm(times[sel])} ariaValueText={hhmm(times[sel])} />
          <Slider label="payment being scored" value={probe} min={0} max={DAY - 15} step={15} onChange={(m) => update(times, m)} display={hhmm(probe)} ariaValueText={hhmm(probe)} />
          <Readout>
            R̄ <strong>{f.rBar.toFixed(2)}</strong> · κ̂ <strong>{f.kappa >= KAPPA_MAX ? `≥ ${KAPPA_MAX}` : f.kappa.toFixed(1)}</strong> · 90% arc{" "}
            <strong>{f.mu === null ? "undefined" : f.half >= DAY / 2 - 1 ? "the whole day" : `${hhmm(f.mu - f.half + DAY)} to ${hhmm(f.mu + f.half)}`}</strong>
          </Readout>
          <p className="pt-1 text-xs text-faint">
            Tap the clock to move the selected payment, or tap a dot to select it. Dashed blue: arithmetic mean. Amber hand: circular mean, length R̄; amber band: the 90% arc. Ring: the payment being scored, green when inside.
          </p>
        </div>
      </div>
    </Panel>
  );
}
