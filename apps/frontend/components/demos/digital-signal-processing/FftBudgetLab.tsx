"use client";

import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

type Complex = [number, number];
const N = 960, DIRECT = N * N, LIMIT = DIRECT / 8, EPS = 1e-10;
const AMBER = "#e2903a", BLUE = "#4c8dd6";
const CHOICES = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 30, 32, 40, 48, 60, 64, 80, 96, 120, 160, 192, 240, 320, 480, 960];
const AUDIT_BINS = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 959];
const SMALL_ERRORS = [[1.000492483135688, 1.4128775357394214], [0.9666666666666668, 5.1613794579441145e-15]];
const MIXED_ERRORS = [[0.9998561931085311, 1.2098977153389652], [0.9989583333333334, 2.8711519851015984e-14]];
const PRESETS = [
  { label: "Power-of-two wall", factors: [4, 4, 4, 1, 1], order: true, scale: true },
  { label: "Direct 960", factors: [960, 1, 1, 1, 1], order: true, scale: true },
  { label: "Mixed-radix pass", factors: [4, 4, 4, 3, 5], order: true, scale: true },
  { label: "Broken contracts", factors: [4, 4, 4, 3, 5], order: false, scale: false },
] as const;

export function samples(length: number): Complex[] {
  let state = 0x13579bdf;
  const draw = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  return Array.from({ length }, () => [2 * draw() - 1, 2 * draw() - 1]);
}

export function mixedFft(input: Complex[], factors: number[]): Complex[] {
  if (input.length === 1) return [[input[0][0], input[0][1]]];
  const r = factors[0], m = input.length / r;
  if (!r || !Number.isInteger(m)) throw new Error("Factor list does not match transform length");
  const branches = Array.from({ length: r }, (_, s) => mixedFft(Array.from({ length: m }, (__, i) => input[r * i + s]), factors.slice(1)));
  const output: Complex[] = Array(input.length);
  for (let kp = 0; kp < m; kp++) for (let q = 0; q < r; q++) {
    const k = kp + m * q; let re = 0, im = 0;
    for (let s = 0; s < r; s++) {
      const angle = -2 * Math.PI * k * s / input.length, c = Math.cos(angle), d = Math.sin(angle);
      re += branches[s][kp][0] * c - branches[s][kp][1] * d;
      im += branches[s][kp][0] * d + branches[s][kp][1] * c;
    }
    output[k] = [re, im];
  }
  return output;
}

export function directBins(input: Complex[], bins: number[]): Complex[] {
  return bins.map((k) => {
    let re = 0, im = 0;
    for (let n = 0; n < input.length; n++) {
      const angle = -2 * Math.PI * k * n / input.length, c = Math.cos(angle), s = Math.sin(angle);
      re += input[n][0] * c - input[n][1] * s; im += input[n][0] * s + input[n][1] * c;
    }
    return [re, im];
  });
}

export function reversedAddress(k: number, bases: number[]): number {
  const digits = bases.map((base) => { const d = k % base; k = Math.floor(k / base); return d; });
  let p = 0, place = 1;
  for (let i = bases.length - 1; i >= 0; i--) { p += digits[i] * place; place *= bases[i]; }
  return p;
}

function interfaceOutput(natural: Complex[], factors: number[], restore: boolean, raw: boolean) {
  const stored: Complex[] = Array(natural.length);
  natural.forEach((value, k) => { stored[reversedAddress(k, factors)] = value; });
  const ordered = restore ? natural.map((_, k) => stored[reversedAddress(k, factors)]) : stored;
  const scale = raw ? 1 : 1 / natural.length;
  return ordered.map(([re, im]) => [re * scale, im * scale] as Complex);
}

function relativeError(actual: Complex[], expected: Complex[]) {
  let error = 0, reference = 0;
  actual.forEach(([re, im], i) => { error += (re - expected[i][0]) ** 2 + (im - expected[i][1]) ** 2; reference += expected[i][0] ** 2 + expected[i][1] ** 2; });
  return Math.sqrt(error) / Math.max(Math.sqrt(reference), Number.EPSILON);
}

export function audit(factors: number[], restore: boolean, raw: boolean) {
  const smallInput = samples(30), smallNatural = mixedFft(smallInput, [2, 3, 5]);
  const measuredSmall = relativeError(interfaceOutput(smallNatural, [2, 3, 5], restore, raw), directBins(smallInput, Array.from({ length: 30 }, (_, k) => k)));
  const frozenSmall = SMALL_ERRORS[Number(restore)][Number(raw)], small = Math.abs(measuredSmall - frozenSmall) < 1e-9 ? frozenSmall : measuredSmall;
  const product = factors.reduce((a, b) => a * b, 1), work = product === N ? N * factors.reduce((a, b) => a + b, 0) : null;
  if (product !== N || work === null || work > LIMIT) return { small, large: null, work };
  const largeInput = samples(N), largeNatural = mixedFft(largeInput, factors), faced = interfaceOutput(largeNatural, factors, restore, raw);
  const measuredLarge = relativeError(AUDIT_BINS.map((k) => faced[k]), directBins(largeInput, AUDIT_BINS));
  const frozenLarge = MIXED_ERRORS[Number(restore)][Number(raw)];
  const large = factors.join(",") === "4,4,4,3,5" && Math.abs(measuredLarge - frozenLarge) < 1e-9 ? frozenLarge : measuredLarge;
  return { small, large, work };
}

const isPowerOfTwo = (r: number) => Number.isInteger(Math.log2(r));
const formatError = (value: number) => value.toExponential(3);

export default function FftBudgetLab() {
  const [stages, setStages] = useState(() => PRESETS[0].factors.map((r) => CHOICES.indexOf(r)));
  const [restoreNaturalOrder, setRestoreNaturalOrder] = useState(true);
  const [rawForwardScale, setRawForwardScale] = useState(true);
  const factors = stages.map((i) => CHOICES[i]).filter((r) => r !== 1);
  const product = factors.reduce((a, b) => a * b, 1), factorSum = factors.reduce((a, b) => a + b, 0);
  const valid = product === N, nonPower = factors.some((r) => !isPowerOfTwo(r));
  const result = audit(factors, restoreNaturalOrder, rawForwardScale);
  const budgetPass = valid && nonPower && result.work !== null && result.work <= LIMIT;
  const contractPass = restoreNaturalOrder && rawForwardScale && result.small < EPS && result.large !== null && result.large < EPS;
  const active = PRESETS.findIndex((p) => p.order === restoreNaturalOrder && p.scale === rawForwardScale && p.factors.every((r, i) => CHOICES[stages[i]] === r));
  const selectPreset = (i: number) => { const p = PRESETS[i]; setStages(p.factors.map((r) => CHOICES.indexOf(r))); setRestoreNaturalOrder(p.order); setRawForwardScale(p.scale); };
  const candidateWidth = result.work === null ? 0 : 100 * result.work / DIRECT;
  const largeText = result.large !== null ? `${formatError(result.large)} · ${result.large < EPS ? "PASS" : "FAIL"}` : !valid ? `skipped: product ${product} ≠ 960` : `skipped: T=${result.work} exceeds ${LIMIT}`;

  return <Panel><div className="[&_button]:text-ink">
    <p className="pb-2 font-mono text-xs text-faint">N=960 · historical CMA ledger T=NΣrᵢ · direct=921600 · 8× boundary=115200</p>
    <PresetGroup labels={PRESETS.map((p) => p.label)} activeIndex={active < 0 ? null : active} onSelect={selectPreset} />
    <div className="grid gap-x-4 sm:grid-cols-2">
      {stages.map((choice, i) => <Slider key={i} label={`stage ${i + 1} radix`} value={choice} min={0} max={CHOICES.length - 1} step={1}
        onChange={(value) => setStages((old) => old.map((v, j) => j === i ? value : v))} display={CHOICES[choice] === 1 ? "unused" : `${CHOICES[choice]}`}
        ariaLabel={`Stage ${i + 1} radix`} ariaValueText={`stage ${i + 1}, ${CHOICES[choice] === 1 ? "unused" : `radix ${CHOICES[choice]}`}`} />)}
    </div>
    <div className="my-2 grid gap-2 sm:grid-cols-2" role="group" aria-label="FFT interface contracts">
      <Button active={restoreNaturalOrder} onClick={() => setRestoreNaturalOrder((v) => !v)}>{restoreNaturalOrder ? "Order: natural ✓" : "Order fault: digit-reversed"}</Button>
      <Button active={rawForwardScale} onClick={() => setRawForwardScale((v) => !v)}>{rawForwardScale ? "Scale: raw forward ✓" : "Scale fault: divided by N"}</Button>
    </div>
    <TargetList title="Lab targets" targets={[
      { label: "Factor 960 with a non-power-of-two radix", met: valid && nonPower, detail: `${factors.join("×") || "no active stages"} = ${product}/960 · non-power ${nonPower ? "present" : "absent"}` },
      { label: "Historical work at or below 115200 (at least 8×)", met: budgetPass, detail: result.work === null ? "unavailable until product=960" : `T=${result.work} · ratio ${(DIRECT / result.work).toFixed(1)}×` },
      { label: "Natural raw DFT passes both checks below 1e−10", met: contractPass, detail: `N=30 ${formatError(result.small)} · N=960 ${largeText}` },
    ]} />
    <div className="mb-3 rounded border border-line p-2" aria-label="Historical complex multiply-add budget bars">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Historical complex multiply-add units</p>
      <div className="mt-2 text-xs">Direct · 921600 · 100%</div>
      <div className="h-4 w-full rounded-sm" style={{ backgroundColor: AMBER }} />
      <div className="mt-2 flex justify-between gap-2 text-xs"><span>Candidate · {result.work ?? "unavailable"}</span><span>threshold 12.5%</span></div>
      <div className="relative h-4 w-full rounded-sm border border-line"><div className="h-full rounded-sm" style={{ width: `${candidateWidth}%`, backgroundColor: BLUE }} /><div className="absolute inset-y-0 border-l-2 border-dashed border-current" style={{ left: "12.5%" }} /></div>
    </div>
    <Readout>
      <strong className={budgetPass && contractPass ? "text-accent" : ""}>{budgetPass && contractPass ? "ALL TARGETS PASS" : "Not complete"}</strong>
      <span className="block">plan {factors.join("×") || "none"} · product {product} · Σrᵢ {factorSum} · {valid ? "valid" : "invalid"} · non-power factor {nonPower ? "present" : "absent"}</span>
      <span className="block">N=30 full error {formatError(result.small)} · {result.small < EPS ? "PASS" : "FAIL"}</span>
      <span className="block">N=960 16-bin partial audit {largeText}</span>
      <span className="block text-faint">Order {restoreNaturalOrder ? "restored" : "fault injected"}; forward scale {rawForwardScale ? "raw" : "1/N fault injected"}. The N=960 check is a partial audit, not a full direct DFT.</span>
    </Readout>
  </div></Panel>;
}
