"use client";

import { useState } from "react";
import { Panel, PresetGroup, Readout, Slider } from "@/components/ui";

type Probe = "constant" | "impulse";
type Kernel = [number, number, number];

const N = 8;
const TRUTH: Kernel = [0.7, 0.25, 0.1];
const PROBES: { label: string; id: Probe }[] = [
  { label: "Constant input", id: "constant" },
  { label: "Impulse probe", id: "impulse" },
];
const PRESETS: { label: string; h: Kernel }[] = [
  { label: "Same sum, wrong taps", h: [0.9, 0.05, 0.1] },
  { label: "Close, error high", h: [0.695, 0.255, 0.105] },
  { label: "Threshold pass", h: [0.695, 0.255, 0.1] },
  { label: "Exact kernel", h: [0.7, 0.25, 0.1] },
];
const TAPS = [
  { label: "dry h[0]", min: 0, max: 1 },
  { label: "early echo h[1]", min: -0.25, max: 0.5 },
  { label: "late echo h[2]", min: -0.25, max: 0.3 },
] as const;
const AMBER = "#e2903a", BLUE = "#4c8dd6";

function convolve(probe: Probe, h: Kernel): number[] {
  const x = (n: number) => (probe === "constant" ? 1 : n === 0 ? 1 : 0);
  return Array.from({ length: N }, (_, n) => h.reduce((sum, tap, m) => sum + tap * x(n - m), 0));
}

function normalizedError(prediction: number[], target: number[]): number {
  const norm = (v: number[]) => Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
  const targetNorm = norm(target), predictionNorm = norm(prediction);
  if (targetNorm === 0) return predictionNorm === 0 ? 0 : Number.POSITIVE_INFINITY;
  return norm(prediction.map((v, i) => v - target[i])) / Math.max(targetNorm, Number.EPSILON);
}

const sameKernel = (a: Kernel, b: Kernel) => a.every((v, i) => Math.abs(v - b[i]) < 1e-9);
const percent = (v: number) => (Number.isFinite(v) ? `${(100 * v).toFixed(2)}%` : "∞%");
const list = (v: number[]) => `[${v.map((x) => x.toFixed(2)).join(", ")}]`;

export default function EchoKernelLab() {
  const [probe, setProbe] = useState<Probe>("constant");
  const [candidate, setCandidate] = useState<Kernel>([...PRESETS[0].h]);
  const target = convolve(probe, TRUTH), predicted = convolve(probe, candidate);
  const impulseTarget = convolve("impulse", TRUTH), impulsePredicted = convolve("impulse", candidate);
  const selectedError = normalizedError(predicted, target);
  const impulseError = normalizedError(impulsePredicted, impulseTarget);
  const maxTapError = Math.max(...candidate.map((v, i) => Math.abs(v - TRUTH[i])));
  const tapsClose = maxTapError <= 0.01 + 1e-9;
  const passed = tapsClose && impulseError < 0.01;
  const activePreset = PRESETS.findIndex((p) => sameKernel(candidate, p.h));
  const values = [...target, ...predicted];
  const low = Math.min(0, ...values), high = Math.max(0, ...values);
  const pad = Math.max(0.08, 0.12 * Math.max(0.25, high - low));
  const yMin = low - pad, yMax = high + pad;
  const xOf = (n: number) => 64 + n * 53;
  const yOf = (v: number) => 214 - ((v - yMin) / (yMax - yMin)) * 88;
  const mobileX = (n: number) => 42 + n * 31;
  const mobileY = (v: number) => 260 - ((v - yMin) / (yMax - yMin)) * 88;
  const input = Array.from({ length: N }, (_, n) => (probe === "constant" || n === 0 ? 1 : 0));
  const updateTap = (index: number, value: number) =>
    setCandidate((old) => old.map((v, i) => (i === index ? value : v)) as Kernel);

  return (
    <Panel>
      <div role="group" aria-label="Identification input">
        <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">Identification input</p>
        <PresetGroup labels={PROBES.map((p) => p.label)} activeIndex={PROBES.findIndex((p) => p.id === probe)}
          onSelect={(i) => setProbe(PROBES[i].id)} />
      </div>
      <div role="group" aria-label="Candidate kernel presets">
        <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">Candidate kernel presets</p>
        <PresetGroup labels={PRESETS.map((p) => p.label)} activeIndex={activePreset < 0 ? null : activePreset}
          onSelect={(i) => setCandidate([...PRESETS[i].h])} />
      </div>
      <p className="pb-2 font-mono text-xs text-faint">target h = [0.700, 0.250, 0.100]</p>
      <div className="grid gap-x-4 sm:grid-cols-3">
        {TAPS.map((tap, i) => (
          <Slider key={tap.label} label={tap.label} value={candidate[i]} min={tap.min} max={tap.max} step={0.005}
            onChange={(v) => updateTap(i, v)} display={candidate[i].toFixed(3)}
            ariaLabel={`Candidate ${tap.label}`} ariaValueText={`${candidate[i].toFixed(3)} gain`} />
        ))}
      </div>
      <Readout>
        <strong className={passed ? "text-accent" : ""}>{passed ? "PASS" : "Not yet"}.</strong>{" "}
        selected error <strong>{percent(selectedError)}</strong> · impulse validation <strong>{percent(impulseError)}</strong> ·
        max tap error <strong>{maxTapError.toFixed(3)}</strong>
        <span className="block text-faint">
          {probe === "constant"
            ? `Steady state excludes startup edges: only the tap sum ${candidate.reduce((a, b) => a + b, 0).toFixed(3)} is observed (rank 1).`
            : "The first three impulse outputs are independent tap coordinates (rank 3)."}
        </span>
      </Readout>

      <svg viewBox="0 0 480 260" className="mt-2 hidden w-full select-none sm:block" role="img"
        aria-label={`${probe === "constant" ? "Eternal constant input with steady state only" : "Unit impulse input"}. Observed output ${list(target)}; candidate output ${list(predicted)}; normalized error ${percent(selectedError)}.`}>
        <text x="48" y="18" fontSize="12" fontWeight="bold" fill="currentColor">input x[n]</text>
        <text x="456" y="18" textAnchor="end" fontSize="11" fill="currentColor" opacity="0.65">
          {probe === "constant" ? "steady state · rank 1" : "unit impulse · rank 3"}
        </text>
        <line x1="48" y1="76" x2="456" y2="76" stroke="currentColor" opacity="0.45" />
        <text x="42" y="42" textAnchor="end" fontSize="10" fill="currentColor" opacity="0.6">1</text>
        <text x="42" y="80" textAnchor="end" fontSize="10" fill="currentColor" opacity="0.6">0</text>
        {input.map((v, n) => <g key={`x${n}`}><line x1={xOf(n)} y1="76" x2={xOf(n)} y2={v ? 38 : 76}
          stroke="currentColor" strokeWidth="2" /><circle cx={xOf(n)} cy={v ? 38 : 76} r="3" fill="currentColor" /></g>)}

        <text x="48" y="108" fontSize="12" fontWeight="bold" fill="currentColor">output y[n]</text>
        <line x1="294" y1="104" x2="308" y2="104" stroke={AMBER} strokeWidth="3" />
        <circle cx="301" cy="104" r="3" fill={AMBER} /><text x="313" y="108" fontSize="10" fill="currentColor">observed</text>
        <line x1="382" y1="104" x2="396" y2="104" stroke={BLUE} strokeDasharray="3 2" />
        <circle cx="389" cy="104" r="3" fill="none" stroke={BLUE} /><text x="401" y="108" fontSize="10" fill="currentColor">candidate</text>
        <line x1="48" y1={yOf(0)} x2="456" y2={yOf(0)} stroke="currentColor" opacity="0.45" />
        <text x="44" y="129" textAnchor="end" fontSize="9" fill="currentColor" opacity="0.6">{yMax.toFixed(2)}</text>
        <text x="44" y="216" textAnchor="end" fontSize="9" fill="currentColor" opacity="0.6">{yMin.toFixed(2)}</text>
        {target.map((v, n) => <g key={`y${n}`}><line x1={xOf(n) - 3} y1={yOf(0)} x2={xOf(n) - 3} y2={yOf(v)}
          stroke={AMBER} strokeWidth="3" /><circle cx={xOf(n) - 3} cy={yOf(v)} r="4" fill={AMBER} /></g>)}
        {predicted.map((v, n) => <g key={`p${n}`}><line x1={xOf(n) + 3} y1={yOf(0)} x2={xOf(n) + 3} y2={yOf(v)}
          stroke={BLUE} strokeWidth="2" strokeDasharray="4 3" /><circle cx={xOf(n) + 3} cy={yOf(v)} r="4" fill="var(--panel)" stroke={BLUE} strokeWidth="2" /></g>)}
        {input.map((_, n) => <text key={`n${n}`} x={xOf(n)} y="235" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.65">{n}</text>)}
        <text x="252" y="253" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">sample index n</text>
      </svg>

      <svg viewBox="0 0 280 315" className="mt-2 block w-full select-none sm:hidden" role="img"
        aria-label={`${probe === "constant" ? "Eternal constant input with steady state only" : "Unit impulse input"}. Observed output ${list(target)}; candidate output ${list(predicted)}; normalized error ${percent(selectedError)}.`}>
        <text x="30" y="18" fontSize="13" fontWeight="bold" fill="currentColor">input x[n]</text>
        <text x="266" y="18" textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
          {probe === "constant" ? "steady state · rank 1" : "unit impulse · rank 3"}
        </text>
        <line x1="30" y1="85" x2="266" y2="85" stroke="currentColor" opacity="0.45" />
        <text x="25" y="49" textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">1</text>
        <text x="25" y="90" textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">0</text>
        {input.map((v, n) => <g key={`mx${n}`}><line x1={mobileX(n)} y1="85" x2={mobileX(n)} y2={v ? 45 : 85}
          stroke="currentColor" strokeWidth="2" /><circle cx={mobileX(n)} cy={v ? 45 : 85} r="3.5" fill="currentColor" /></g>)}

        <text x="30" y="122" fontSize="13" fontWeight="bold" fill="currentColor">output y[n]</text>
        <line x1="30" y1="143" x2="46" y2="143" stroke={AMBER} strokeWidth="3" />
        <circle cx="38" cy="143" r="3.5" fill={AMBER} /><text x="52" y="147" fontSize="12" fill="currentColor">observed</text>
        <line x1="145" y1="143" x2="161" y2="143" stroke={BLUE} strokeDasharray="4 3" />
        <circle cx="153" cy="143" r="3.5" fill="var(--panel)" stroke={BLUE} /><text x="167" y="147" fontSize="12" fill="currentColor">candidate</text>
        <line x1="30" y1={mobileY(0)} x2="266" y2={mobileY(0)} stroke="currentColor" opacity="0.45" />
        <text x="34" y="174" textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">{yMax.toFixed(2)}</text>
        <text x="34" y="263" textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">{yMin.toFixed(2)}</text>
        {target.map((v, n) => <g key={`my${n}`}><line x1={mobileX(n) - 3} y1={mobileY(0)} x2={mobileX(n) - 3} y2={mobileY(v)}
          stroke={AMBER} strokeWidth="3" /><circle cx={mobileX(n) - 3} cy={mobileY(v)} r="4" fill={AMBER} /></g>)}
        {predicted.map((v, n) => <g key={`mp${n}`}><line x1={mobileX(n) + 3} y1={mobileY(0)} x2={mobileX(n) + 3} y2={mobileY(v)}
          stroke={BLUE} strokeWidth="2" strokeDasharray="4 3" /><circle cx={mobileX(n) + 3} cy={mobileY(v)} r="4" fill="var(--panel)" stroke={BLUE} strokeWidth="2" /></g>)}
        {input.map((_, n) => <text key={`mn${n}`} x={mobileX(n)} y="284" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.75">{n}</text>)}
        <text x="148" y="307" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.75">sample index n</text>
      </svg>
    </Panel>
  );
}
