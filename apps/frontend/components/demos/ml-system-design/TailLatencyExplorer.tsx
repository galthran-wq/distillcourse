"use client";

/**
 * TailLatencyExplorer — tail amplification, live. Reader sets the
 * per-backend slow rate p (log slider) and the fan-out N of one user
 * request; the plot draws 1 − (1 − p)^N over N with the current point
 * marked. Guided task (lesson): with p = 1%, sweep N until more than
 * half of user requests are slow (crosses just under N = 70); then fix
 * N = 100 and lower p until the page stays under the 5% guide
 * (~1 slow call in 2,000). Presets: single call, microservice page
 * (N = 30), feature fan-out (N = 100).
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a";
const N_MAX = 150;
const LOGP_1PCT = -2; // log10(0.01): every preset uses the 1% backend
const PRESETS = [
  { label: "single call", n: 1 },
  { label: "microservice page (N=30)", n: 30 },
  { label: "feature fan-out (N=100)", n: 100 },
];

const W = 480, H = 250, ML = 46, MR = 10, MT = 10, MB = 30;
const PW = W - ML - MR, PH = H - MT - MB;

const slowFrac = (p: number, n: number) => 1 - Math.pow(1 - p, n);
const sx = (n: number) => ML + ((n - 1) / (N_MAX - 1)) * PW;
const sy = (f: number) => MT + (1 - f) * PH;

function pctLabel(p: number): string {
  const pct = p * 100;
  return `${pct.toFixed(pct < 0.1 ? 3 : pct < 1 ? 2 : 1)}%`;
}

export default function TailLatencyExplorer() {
  // D3: arrive on the microservice page — amplification already visible.
  const [logP, setLogP] = useState<number>(LOGP_1PCT);
  const [n, setN] = useState<number>(PRESETS[1].n);

  const p = Math.pow(10, logP);
  const frac = slowFrac(p, n);
  const activePreset = PRESETS.findIndex(
    (preset) => preset.n === n && logP === LOGP_1PCT,
  );

  const curve = Array.from({ length: N_MAX }, (_, i) => {
    const k = i + 1;
    return `${i ? "L" : "M"}${sx(k).toFixed(1)} ${sy(slowFrac(p, k)).toFixed(1)}`;
  }).join(" ");

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setLogP(LOGP_1PCT);
          setN(PRESETS[i].n);
        }}
      />

      <Slider
        label="per-backend slow rate p"
        value={logP}
        min={-4}
        max={-1}
        step={0.005}
        onChange={setLogP}
        display={`${pctLabel(p)} (1 in ${Math.round(1 / p).toLocaleString()})`}
        ariaLabel="Per-backend slow-call rate, log scale"
        ariaValueText={`${pctLabel(p)} of backend calls slow`}
      />

      <Slider
        label="fan-out N (backend calls per user request)"
        value={n}
        min={1}
        max={N_MAX}
        step={1}
        onChange={setN}
        display={`${n}`}
        ariaLabel="Fan-out: backend calls per user request"
      />

      <Readout>
        P(page slow) = 1 − (1 − p)<sup>N</sup> ={" "}
        <strong>{(frac * 100).toFixed(1)}%</strong> of user requests hit at
        least one slow call — ×{(frac / p).toFixed(frac / p < 10 ? 1 : 0)} the
        single-call rate.
      </Readout>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`Fraction of slow user requests versus fan-out: ${(frac * 100).toFixed(1)}% at N = ${n}`}
      >
        {/* axes */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + PH} stroke="currentColor" strokeOpacity="0.4" />
        <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke="currentColor" strokeOpacity="0.4" />
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={ML - 6} y={sy(f) + 4} textAnchor="end" fill="currentColor" fontSize="11">
            {f * 100}%
          </text>
        ))}
        {[1, 50, 100, 150].map((tick) => (
          <text key={tick} x={sx(tick)} y={MT + PH + 16} textAnchor="middle" fill="currentColor" fontSize="11">
            {tick}
          </text>
        ))}
        <text x={ML + PW / 2} y={H - 2} textAnchor="middle" fill="currentColor" fontSize="12">
          fan-out N
        </text>

        {/* the two task guides: half the users, and the 5% page budget */}
        {[
          { f: 0.5, label: "half of user requests slow" },
          { f: 0.05, label: "5% page budget" },
        ].map(({ f, label }) => (
          <g key={f}>
            <line x1={ML} y1={sy(f)} x2={ML + PW} y2={sy(f)} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="5 4" />
            <text x={ML + PW - 4} y={sy(f) - 5} textAnchor="end" fill="currentColor" fillOpacity="0.7" fontSize="11">
              {label}
            </text>
          </g>
        ))}

        <path d={curve} fill="none" stroke={AMBER} strokeWidth="2.5" />
        <circle cx={sx(n)} cy={sy(frac)} r="5" fill={AMBER} stroke="currentColor" strokeWidth="1" />
        <text
          x={sx(n) + (n > N_MAX * 0.6 ? -10 : 10)}
          y={sy(frac) + (frac > 0.85 ? 18 : -10)}
          textAnchor={n > N_MAX * 0.6 ? "end" : "start"}
          fill="currentColor"
          fontSize="12"
          fontWeight="600"
        >
          {(frac * 100).toFixed(1)}%
        </text>
      </svg>
    </Panel>
  );
}
