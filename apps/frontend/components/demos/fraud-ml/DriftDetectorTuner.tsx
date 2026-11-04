"use client";

/**
 * DriftDetectorTuner — Page–Hinkley on a seeded error rate per 100 items, in
 * the lesson's letters (allowance v, threshold h, warm-up 30, restart after
 * each alarm). All three streams share one seed and one change step, so the
 * abrupt and gradual streams are identical until the change.
 */
import { useMemo, useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider } from "@/components/ui";

const AMBER = "#e2903a";
const BLUE = "#3a7bd5";
const STEPS = 900;
const CHANGE = 611;
const RISE = 0.02;
const WARM_UP = 30;
const TARGET = 50;
const V_MAX = 0.03;
const H_MIN = 0.02;
const H_MAX = 1;

// The seed gives 0 of 3,069 settings on "gradual"; about half of seeds do, and
// on the rest a chance run just after the change lets a few settings through.
// "abrupt" here passes 796 settings, the median across seeds.
const SEED = 126704;

function randoms(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stream(base: number, ramp: number): number[] {
  const rand = randoms(SEED);
  return Array.from({ length: STEPS }, (_, t) => {
    const p = base + RISE * Math.min(1, Math.max(0, (t - CHANGE + 1) / ramp));
    let errors = 0;
    for (let i = 0; i < 100; i++) if (rand() < p) errors++;
    return errors / 100;
  });
}

const STREAMS = [
  { label: "abrupt", xs: stream(0.05, 1), top: 0.16 },
  { label: "gradual", xs: stream(0.05, 250), top: 0.16 },
  { label: "noisier level", xs: stream(0.2, 1), top: 0.4 },
];

function pageHinkley(xs: number[], v: number, h: number) {
  const ph: number[] = [];
  const alarms: number[] = [];
  let n = 0, mean = 0, m = 0, low = 0;
  xs.forEach((x, t) => {
    n++;
    mean += (x - mean) / n;
    m += x - mean - v;
    low = Math.min(low, m);
    ph.push(m - low);
    if (n >= WARM_UP && m - low > h) {
      alarms.push(t);
      n = mean = m = low = 0;
    }
  });
  return { ph, alarms };
}

function score(alarms: number[]) {
  const first = alarms.find((t) => t >= CHANGE);
  return {
    falseAlarms: alarms.filter((t) => t < CHANGE).length,
    first,
    delay: first === undefined ? Infinity : first - CHANGE,
  };
}

function sweep(xs: number[]) {
  let total = 0, met = 0, fastestClean = Infinity, fewestFalse = Infinity;
  for (let vi = 0; vi <= V_MAX * 1000; vi++) {
    for (let hi = H_MIN * 100; hi <= H_MAX * 100; hi++) {
      const { falseAlarms, delay } = score(pageHinkley(xs, vi / 1000, hi / 100).alarms);
      total++;
      if (falseAlarms === 0 && delay <= TARGET) met++;
      if (falseAlarms === 0) fastestClean = Math.min(fastestClean, delay);
      if (delay <= TARGET) fewestFalse = Math.min(fewestFalse, falseAlarms);
    }
  }
  return { total, met, fastestClean, fewestFalse };
}

const X = (t: number) => 36 + (t / STEPS) * 436;
const path = (ys: number[], y: (value: number) => number) =>
  ys.map((value, t) => `${X(t).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
const RATE_BOTTOM = 92;
const PH_BOTTOM = 262;
const PH_TOP = 136;

export default function DriftDetectorTuner() {
  const [which, setWhich] = useState(0);
  const [v, setV] = useState(0.005);
  const [h, setH] = useState(0.1);
  const [revealed, setRevealed] = useState(false);
  const [swept, setSwept] = useState<number | null>(null);

  const { xs, top } = STREAMS[which];
  const { ph, alarms } = pageHinkley(xs, v, h);
  const { falseAlarms, first, delay } = score(alarms);
  const met = falseAlarms === 0 && delay <= TARGET;
  const all = useMemo(() => (swept === null ? null : sweep(STREAMS[swept].xs)), [swept]);

  const rateY = (rate: number) => RATE_BOTTOM - (rate / top) * 76;
  // The range follows h only past 0.32, so small thresholds stay readable and
  // the line visibly moves where the task is decided.
  const phMax = Math.max(0.4, h * 1.25);
  const phY = (value: number) => PH_BOTTOM - (Math.min(value, phMax) / phMax) * (PH_BOTTOM - PH_TOP);
  const shown = alarms.slice(0, 8).map((t) => t + 1).join(", ");
  const alarmColor = (t: number) =>
    !revealed ? "currentColor" : t < CHANGE ? AMBER : t === first ? BLUE : "currentColor";

  return (
    <Panel>
      <PresetGroup
        labels={STREAMS.map((s) => s.label)}
        activeIndex={which}
        onSelect={(i) => {
          setWhich(i);
          setSwept(null);
        }}
      />
      <Slider label="allowance v" value={v} min={0} max={V_MAX} step={0.001}
        onChange={setV} display={v.toFixed(3)} ariaLabel="Allowance v" />
      <Slider label="threshold h" value={h} min={H_MIN} max={H_MAX} step={0.01}
        onChange={setH} display={h.toFixed(2)} ariaLabel="Threshold h" />

      <svg viewBox="0 0 480 290" className="mt-3 w-full" role="img"
        aria-label={`Error rate and Page–Hinkley statistic over ${STEPS} steps, with ${alarms.length} alarms at threshold ${h.toFixed(2)}`}>
        <g fill="currentColor" fontSize={13}>
          <text x={36} y={12}>error rate per 100 items</text>
          <text x={36} y={124}>PH = m − M, restarted after each alarm</text>
          <text x={32} y={rateY(top) + 4} textAnchor="end">{top.toFixed(2)}</text>
          <text x={32} y={RATE_BOTTOM + 4} textAnchor="end">0</text>
          <text x={32} y={PH_TOP + 4} textAnchor="end">{phMax.toFixed(2)}</text>
          <text x={32} y={PH_BOTTOM + 4} textAnchor="end">0</text>
          {[0, 300, 600, 900].map((t) => (
            <text key={t} x={X(t)} y={PH_BOTTOM + 18} textAnchor={t === 900 ? "end" : "middle"}>
              {t === 900 ? "900 steps" : t}
            </text>
          ))}
        </g>
        <g stroke="currentColor" strokeWidth={1} opacity={0.5}>
          <line x1={36} x2={472} y1={RATE_BOTTOM} y2={RATE_BOTTOM} />
          <line x1={36} x2={472} y1={PH_BOTTOM} y2={PH_BOTTOM} />
        </g>
        {alarms.map((t) => (
          <line key={t} x1={X(t)} x2={X(t)} y1={PH_TOP} y2={PH_BOTTOM}
            stroke={alarmColor(t)} strokeWidth={1.5} opacity={alarmColor(t) === "currentColor" ? 0.45 : 1} />
        ))}
        {revealed && (
          <g stroke="currentColor" strokeDasharray="4 3">
            <line x1={X(CHANGE)} x2={X(CHANGE)} y1={16} y2={PH_BOTTOM} strokeWidth={1.2} />
            <text x={X(CHANGE) - 4} y={26} textAnchor="end" fontSize={13} fill="currentColor" stroke="none">
              change starts, step {CHANGE + 1}
            </text>
          </g>
        )}
        <polyline points={path(xs, rateY)} fill="none" stroke="currentColor" strokeWidth={0.7} opacity={0.6} />
        <polyline points={path(ph, phY)} fill="none" stroke="currentColor" strokeWidth={1.3} />
        <line x1={36} x2={472} y1={phY(h)} y2={phY(h)} stroke="currentColor" strokeWidth={1} strokeDasharray="5 3" />
        <text x={472} y={phY(h) - 4} textAnchor="end" fontSize={13} fill="currentColor">h</text>
      </svg>

      <div className="flex flex-wrap gap-2 py-2">
        <Button active={revealed} onClick={() => setRevealed(!revealed)}>Show the change</Button>
        <Button onClick={() => setSwept(which)}>Try every setting</Button>
      </div>

      <Readout>
        <span className="tabular-nums">
          {alarms.length} alarm{alarms.length === 1 ? "" : "s"}
          {alarms.length > 0 && <>, at step{alarms.length === 1 ? "" : "s"} {shown}{alarms.length > 8 && ", …"}</>}
        </span>
        {!revealed && <> · which are false? Show the change to score this setting.</>}
      </Readout>
      {revealed && (
        <Readout>
          false alarms on the stable stretch: <strong className="tabular-nums">{falseAlarms}</strong> ·{" "}
          {first === undefined
            ? "no alarm after the change"
            : <>caught <strong className="tabular-nums">{delay}</strong> steps after it starts</>}
          {met && <> · <strong>task met: within {TARGET} steps, no false alarm</strong></>}
        </Readout>
      )}
      {all && swept === which && (
        <Readout>
          Of <span className="tabular-nums">{all.total.toLocaleString("en-US")}</span> settings, on this stream,{" "}
          <strong className="tabular-nums">{all.met}</strong> meet the task. With no false alarm the fastest
          catch takes <span className="tabular-nums">{all.fastestClean}</span> steps; within {TARGET} steps the
          fewest false alarms is <span className="tabular-nums">{all.fewestFalse}</span>.
        </Readout>
      )}
    </Panel>
  );
}
