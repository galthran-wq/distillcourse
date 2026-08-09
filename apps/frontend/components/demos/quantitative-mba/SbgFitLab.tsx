"use client";

import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider } from "@/components/ui";

const AMBER = "#e2903a", BLUE = "#4c8dd6";
// High End segment, Fader & Hardie (2007): % surviving, years 0–12.
const S_OBS = [1, 0.869, 0.743, 0.653, 0.593, 0.551, 0.517, 0.491, 0.468, 0.445, 0.427, 0.409, 0.394];
const LOST = [131, 126, 90, 60, 42, 34, 26]; // cancellations per 1000, years 1–7
const ALIVE = 491; // still active at year 7
// OLS quadratic on years 0–7 (R² = .998); +92% at year 12.
const QUAD = [0.99671, -0.14223, 0.010185];
const MLE_LL = -1611.2;
const QUAD_ERR = 92;
const TARGET_ERR = 10; // the task: land within ±10% (relative) of the held-out 39.4%
const PRESETS = [
  { label: "Worksheet start", a: 1, b: 1 },
  { label: "One coin, almost", a: 3, b: 17 },
  { label: "MLE (0.668, 3.806)", a: 0.668, b: 3.806 },
] as const;

/** sBG survival S(0..12) via the retention recursion r_t = (β+t−1)/(α+β+t−1). */
function sbgS(a: number, b: number): number[] {
  const s = [1];
  for (let t = 1; t <= 12; t++) s.push(s[t - 1] * ((b + t - 1) / (a + b + t - 1)));
  return s;
}

/** Log-likelihood of the years 1–7 counts: Σ n_t ln(S(t−1)−S(t)) + 491 ln S(7). */
function logLik(a: number, b: number): number {
  const s = sbgS(a, b);
  let ll = ALIVE * Math.log(s[7]);
  for (let t = 1; t <= 7; t++) ll += LOST[t - 1] * Math.log(s[t - 1] - s[t]);
  return ll;
}

const quadAt = (t: number) => QUAD[0] + QUAD[1] * t + QUAD[2] * t * t;
// Survival chart geometry: t∈[0,12] → x, S∈[0,1] → y.
const X = (t: number) => 36 + 34 * t;
const Y = (s: number) => 14 + (1 - s) * 196;

export default function SbgFitLab() {
  const [a, setA] = useState<number>(PRESETS[0].a);
  const [b, setB] = useState<number>(PRESETS[0].b);
  const [showQuad, setShowQuad] = useState(false);

  const s = sbgS(a, b);
  const ll = logLik(a, b);
  const gap = MLE_LL - ll;
  const err = (s[12] / S_OBS[12] - 1) * 100;
  const onTarget = Math.abs(err) < TARGET_ERR;
  const atMle = gap < 1;
  const meanTheta = a / (a + b);
  const activePreset = PRESETS.findIndex((p) => p.a === a && p.b === b);

  // Implied Beta(α, β) density on a θ grid, normalized numerically; the
  // display clips at 8 so shapes stay comparable across parameter values.
  const thetas = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
  const raw = thetas.map((th) => Math.exp((a - 1) * Math.log(th) + (b - 1) * Math.log(1 - th)));
  const mass = raw.reduce((acc, u) => acc + u, 0) / 100;
  const density = raw.map((u) => Math.min(u / mass, 8));
  const bx = (th: number) => 20 + 168 * th;
  const by = (d: number) => 210 - 24.5 * d;
  const betaPath = thetas.map((th, i) => `${bx(th).toFixed(1)},${by(density[i]).toFixed(1)}`).join(" ");

  const sbgFit = s.slice(0, 8).map((v, t) => `${X(t)},${Y(v).toFixed(1)}`).join(" ");
  const sbgProj = s.slice(7).map((v, t) => `${X(t + 7)},${Y(v).toFixed(1)}`).join(" ");
  const quadPath = Array.from({ length: 49 }, (_, i) => i / 4)
    .map((t) => `${X(t).toFixed(1)},${Y(Math.min(1.02, quadAt(t))).toFixed(1)}`).join(" ");

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => { setA(PRESETS[i].a); setB(PRESETS[i].b); }}
      />
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Slider label="α (shape)" value={a} min={0.05} max={3} step={0.001} onChange={setA}
          display={a.toFixed(3)} ariaLabel="alpha, first Beta shape parameter" />
        <Slider label="β (shape)" value={b} min={0.1} max={20} step={0.001} onChange={setB}
          display={b.toFixed(3)} ariaLabel="beta, second Beta shape parameter" />
      </div>
      <div className="pt-2">
        <Button active={showQuad} onClick={() => setShowQuad((v) => !v)}>
          {showQuad ? "Hide quadratic fit" : "Fit quadratic (R² = .998)"}
        </Button>
      </div>
      <Readout>
        LL = <strong>{ll.toFixed(1)}</strong> (MLE −1611.2, gap {gap.toFixed(1)})
        {" · "}year-12 projection <strong>{(100 * s[12]).toFixed(1)}%</strong> vs actual 39.4%
        {" → "}<strong>{err >= 0 ? "+" : "−"}{Math.abs(err).toFixed(1)}%</strong>
        {showQuad && <> · quadratic: +{QUAD_ERR}%</>}
      </Readout>
      <Readout>
        {onTarget
          ? `✓ within ${TARGET_ERR}% of the held-out 39.4% — the quadratic missed by +${QUAD_ERR}%`
          : `not yet within ${TARGET_ERR}% of the held-out 39.4%`}
        {atMle && " · ✓ at the MLE — this is as good as the likelihood gets"}
      </Readout>

      <div className="grid gap-4 pt-3 sm:grid-cols-[3fr_2fr]">
        <svg viewBox="0 0 460 240" className="w-full" role="img"
          aria-label={`High End survival, sBG fit projecting ${(100 * s[12]).toFixed(1)} percent at year 12 against actual 39.4`}>
          <rect x={X(7)} y="14" width={X(12) - X(7)} height="196" fill="currentColor" opacity="0.06" />
          <text x={X(9.5)} y="28" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">held out</text>
          <line x1="36" y1="210" x2="444" y2="210" stroke="currentColor" opacity="0.5" />
          <line x1="36" y1="14" x2="36" y2="210" stroke="currentColor" opacity="0.5" />
          {[0, 2, 4, 6, 8, 10, 12].map((t) => (
            <text key={t} x={X(t)} y="224" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{t}</text>
          ))}
          {[0, 0.5, 1].map((v) => (
            <text key={v} x="30" y={Y(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">{v * 100}%</text>
          ))}
          <text x="240" y="238" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">year — % surviving</text>
          {showQuad && <polyline points={quadPath} fill="none" stroke={BLUE} strokeWidth="2" strokeDasharray="5 3" />}
          {showQuad && (
            <text x={X(12) - 4} y={Y(quadAt(12)) - 6} textAnchor="end" fontSize="10" fill={BLUE}>quadratic +92%</text>
          )}
          <polyline points={sbgFit} fill="none" stroke={AMBER} strokeWidth="2.5" />
          <polyline points={sbgProj} fill="none" stroke={AMBER} strokeWidth="2.5" strokeDasharray="5 3" />
          <circle cx={X(12)} cy={Y(s[12])} r="4" fill={AMBER} />
          {S_OBS.map((v, t) => (
            <circle key={t} cx={X(t)} cy={Y(v)} r="3.5"
              fill={t <= 7 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" opacity="0.85" />
          ))}
        </svg>
        <svg viewBox="0 0 200 240" className="w-full" role="img"
          aria-label={`Implied Beta density with mean churn probability ${(100 * meanTheta).toFixed(0)} percent`}>
          <line x1="20" y1="210" x2="188" y2="210" stroke="currentColor" opacity="0.5" />
          <line x1="20" y1="14" x2="20" y2="210" stroke="currentColor" opacity="0.5" />
          {[0, 0.5, 1].map((th) => (
            <text key={th} x={bx(th)} y="224" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{th}</text>
          ))}
          <text x="104" y="238" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">θ — Beta(α, β) density</text>
          <polyline points={betaPath} fill="none" stroke={AMBER} strokeWidth="2" />
          <line x1={bx(meanTheta)} y1="30" x2={bx(meanTheta)} y2="210" stroke="currentColor" opacity="0.35" strokeDasharray="3 3" />
          <text x={bx(meanTheta) + 4} y="40" fontSize="10" fill="currentColor" opacity="0.8">
            E(θ) = {(100 * meanTheta).toFixed(0)}%
          </text>
        </svg>
      </div>
    </Panel>
  );
}
