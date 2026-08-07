"use client";

/**
 * GrowthRaceChart — six running-time functions race as n grows. The slider
 * drags the race horizon; on a linear axis the frame's ceiling is 100n's own
 * finish line, so every faster-growing curve must leave through the top:
 * 2ⁿ near n ≈ 15 no matter how far out the horizon goes, n² only after its
 * n = 100 crossover with 100n. The log-axis toggle lifts the ceiling:
 * everything fits, and 2ⁿ straightens into a line. Guided task (lesson):
 * find the n²/100n crossover at n = 100, then the largest n at which 2ⁿ
 * still fits a linear frame, and compare it with where n² exits.
 * Prediction-before-reveal: the crossover marker, the exit-n labels, and
 * the readout's answers stay hidden until the reader's first interaction.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button } from "@/components/ui";

const AMBER = "#e2903a"; // n² — the subject of the crossover
const BLUE = "#4c8dd6"; // 100n — the linear algorithm with the awful constant
const WARN = "#c0392b"; // 2ⁿ — the curve no linear frame can hold

type Scale = "linear" | "log";
const PRESETS: { label: string; nMax: number; scale: Scale }[] = [
  { label: "Small n", nMax: 16, scale: "linear" },
  { label: "Crossover zoom", nMax: 200, scale: "linear" },
  { label: "Exponential blowup", nMax: 1000, scale: "linear" },
];

const CURVES = [
  { label: "log₂ n", f: (n: number) => Math.log2(n), color: undefined, op: 0.45 },
  { label: "n", f: (n: number) => n, color: undefined, op: 0.6 },
  { label: "n log₂ n", f: (n: number) => n * Math.log2(n), color: undefined, op: 0.75 },
  { label: "100n", f: (n: number) => 100 * n, color: BLUE, op: 1 },
  { label: "n²", f: (n: number) => n * n, color: AMBER, op: 1 },
  { label: "2ⁿ", f: (n: number) => Math.pow(2, n), color: WARN, op: 1 },
];

// plot geometry (user units)
const VW = 480, VH = 300, PX = 46, PW = 424, PY = 16, PH = 236;
const BOTTOM = PY + PH;
const SAMPLES = 240;
const num = (v: number) => v.toLocaleString("en-US");

export default function GrowthRaceChart() {
  // D3: opens on "Crossover zoom" — the overtake at n = 100 sits mid-frame
  // and 2ⁿ has already escaped through the ceiling at n ≈ 14, but the
  // annotations naming both stay hidden until the first interaction.
  const [nMax, setNMax] = useState(PRESETS[1].nMax);
  const [scale, setScale] = useState<Scale>(PRESETS[1].scale);
  const [touched, setTouched] = useState(false);

  const linear = scale === "linear";
  const yMax = 100 * nMax; // linear ceiling: where 100n finishes the race
  const decades = nMax * Math.log10(2); // log ceiling: where 2ⁿ finishes
  const xOf = (n: number) => PX + ((n - 1) / (nMax - 1)) * PW;
  const yOf = (v: number) =>
    linear
      ? BOTTOM - (Math.min(v, yMax) / yMax) * PH
      : BOTTOM - (Math.log10(Math.max(v, 1)) / decades) * PH;

  // exact frame exits on the linear axis (null = the curve stays in frame)
  const expExit = linear && Math.log2(yMax) < nMax ? Math.log2(yMax) : null;
  const sqExit = linear && Math.sqrt(yMax) < nMax ? Math.sqrt(yMax) : null;

  const series = CURVES.map((c, i) => {
    const pts: string[] = [];
    let lx = PX, ly = BOTTOM;
    for (let s = 0; s <= SAMPLES; s++) {
      const n = 1 + (s / SAMPLES) * (nMax - 1);
      const out = linear && c.f(n) > yMax;
      lx = xOf(n);
      ly = out ? PY : yOf(c.f(n));
      pts.push(`${lx.toFixed(1)},${ly.toFixed(1)}`);
      if (out) break; // curve leaves through the top of the frame
    }
    const exit = i === 5 ? expExit : i === 4 ? sqExit : null;
    return {
      ...c,
      path: pts.join(" "),
      text: exit === null || !touched ? c.label : `${c.label} exits, n ≈ ${Math.round(exit)}`,
      x: Math.min(lx, PX + PW - 6),
      y: Math.min(Math.max(ly + 4, PY + 10), BOTTOM - 3),
      anchor: lx > PX + PW - 60 ? ("end" as const) : ("start" as const),
    };
  });
  const placed: { x: number; y: number }[] = []; // nudge colliding labels up
  for (const l of [...series].sort((a, b) => b.y - a.y)) {
    while (placed.some((p) => Math.abs(p.x - l.x) < 70 && Math.abs(p.y - l.y) < 12)) l.y -= 12;
    placed.push(l);
  }

  const crossVisible = nMax >= 100; // (100, 10⁴) sits inside either frame
  const crossX = Math.min(xOf(100), PX + PW - 92);
  const xTicks = [0, 1, 2, 3, 4].map((k) => Math.round(1 + (k * (nMax - 1)) / 4));
  const expStep = Math.max(1, Math.ceil(decades / 4));
  const logTicks = Array.from({ length: Math.floor(decades / expStep) + 1 }, (_, k) => k * expStep);
  const activePreset = PRESETS.findIndex((p) => p.nMax === nMax && p.scale === scale);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setNMax(PRESETS[i].nMax);
          setScale(PRESETS[i].scale);
          setTouched(true);
        }}
      />
      <div className="flex flex-wrap gap-2 pb-3">
        <Button active={linear} onClick={() => { setScale("linear"); setTouched(true); }}>linear axis</Button>
        <Button active={!linear} onClick={() => { setScale("log"); setTouched(true); }}>log axis</Button>
      </div>
      <Slider
        label="race horizon: draw every curve up to n"
        value={nMax} min={8} max={1000} step={1}
        onChange={(v) => { setNMax(v); setTouched(true); }}
        display={`n = ${num(nMax)}`} ariaLabel="Largest input size n drawn"
      />
      <Readout>
        {!touched ? (
          <>
            Linear axis; the frame&apos;s ceiling is 100n&apos;s finish, {num(yMax)} steps.
            Two curves have already left through the top. Predict where n² overtakes 100n
            and how far 2ⁿ got — the markers appear on your first move.
          </>
        ) : linear ? (
          <>
            Linear axis; the frame&apos;s ceiling is 100n&apos;s finish, {num(yMax)} steps.{" "}
            {expExit === null
              ? <>2ⁿ still fits — push the horizon past n ≈ 10 and watch it go.</>
              : <>2ⁿ escapes through the top at <strong>n ≈ {Math.round(expExit)}</strong>, and dragging the horizon out barely moves that.</>}{" "}
            {sqExit === null
              ? <>n² runs below 100n this whole range: the crossover waits at n = 100.</>
              : <>n² lasts until n ≈ {Math.round(sqExit)}, after overtaking 100n at n = 100.</>}
          </>
        ) : (
          <>
            Log axis: every curve fits, and 2ⁿ is the straight line. At n = {num(nMax)} it needs
            ≈ 10<sup>{Math.round(decades)}</sup> steps against n² = {num(nMax * nMax)} — a gap
            of {Math.round(decades) - Math.round(Math.log10(nMax * nMax))} orders of magnitude.
          </>
        )}
      </Readout>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="mt-2 w-full select-none" role="img"
        aria-label={`Growth curves raced to n = ${nMax} on a ${scale} axis. ${!touched
          ? "Interact to reveal where each curve leaves the frame."
          : linear
          ? `2 to the n ${expExit === null ? "still fits the frame" : `leaves the frame near n = ${Math.round(expExit)}`}; n squared ${sqExit === null ? "stays below 100n" : `leaves near n = ${Math.round(sqExit)}`}.`
          : `All six curves fit; 2 to the n is a straight line reaching 10 to the ${Math.round(decades)}.`}`}
      >
        <line x1={PX} y1={BOTTOM} x2={PX + PW} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        <line x1={PX} y1={PY} x2={PX} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        {xTicks.map((t) => (
          <g key={`x${t}`}>
            <line x1={xOf(t)} y1={BOTTOM} x2={xOf(t)} y2={BOTTOM + 4} stroke="currentColor" opacity="0.5" />
            <text x={xOf(t)} y={BOTTOM + 17} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">{num(t)}</text>
          </g>
        ))}
        <text x={PX + PW / 2} y={BOTTOM + 32} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">input size n</text>
        {(linear ? [yMax / 2, yMax] : logTicks).map((t) => (
          <g key={`y${t}`}>
            <line x1={PX - 4} y1={linear ? yOf(t) : BOTTOM - (t / decades) * PH} x2={PX} y2={linear ? yOf(t) : BOTTOM - (t / decades) * PH} stroke="currentColor" opacity="0.5" />
            <text x={PX - 7} y={(linear ? yOf(t) : BOTTOM - (t / decades) * PH) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">
              {linear ? (t >= 1000 ? `${t / 1000}k` : t) : <>10<tspan dy="-4" fontSize="7">{t}</tspan></>}
            </text>
          </g>
        ))}
        <text x={12} y={PY + PH / 2} fontSize="11" fill="currentColor" opacity="0.7" textAnchor="middle" transform={`rotate(-90 12 ${PY + PH / 2})`}>steps</text>
        {series.map((s) => (
          <g key={s.label}>
            <polyline points={s.path} fill="none" stroke={s.color ?? "currentColor"} opacity={s.op} strokeWidth={s.color ? 2.5 : 1.5} />
            <text x={s.x + (s.anchor === "end" ? -4 : 4)} y={s.y} textAnchor={s.anchor} fontSize="11" fontWeight={s.color ? "bold" : "normal"} fill={s.color ?? "currentColor"} opacity={s.op}>{s.text}</text>
          </g>
        ))}
        {touched && crossVisible && (
          <g>
            <circle cx={crossX} cy={yOf(10000)} r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <text x={crossX} y={yOf(10000) + (yOf(10000) > BOTTOM - 26 ? -11 : 18)} textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">n = 100: n² overtakes 100n</text>
          </g>
        )}
      </svg>
    </Panel>
  );
}
