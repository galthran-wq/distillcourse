"use client";

import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

type Win = { label: string; cg: number; enbw: number; width: number; scallop: number; psl: number };
type Cell = { leak: number; margin: number; phase: number };
export const WINDOWS: Win[] = [
  { label: "Rectangular", cg: 1, enbw: 1, width: 2, scallop: 3.92218, psl: -13.25968 },
  { label: "Hann", cg: .5, enbw: 1.5, width: 4, scallop: 1.42362, psl: -31.46731 },
  { label: "Hamming", cg: .54, enbw: 1.362826, width: 4, scallop: 1.75147, psl: -42.6179 },
  { label: "4-term Blackman-Harris", cg: .35875, enbw: 2.004353, width: 8, scallop: .82557, psl: -92.01373 },
];
export const RECORDS = [64, 128, 256] as const;
export const STUDY: Cell[][] = [
  [{ leak: -17.88, margin: -.629, phase: 45 }, { leak: -24.71, margin: -1.619, phase: 90 }, { leak: -30.343, margin: -.071, phase: 292.5 }],
  [{ leak: -32.305, margin: -4.379, phase: 225 }, { leak: -53.937, margin: 12.546, phase: 270 }, { leak: -71.099, margin: 31.099, phase: 90 }],
  [{ leak: -50.489, margin: 10.057, phase: 135 }, { leak: -43.179, margin: 1.428, phase: 90 }, { leak: -47.393, margin: 7.66, phase: 90 }],
  [{ leak: -23.133, margin: -1.311, phase: 45 }, { leak: -99.165, margin: 59.158, phase: 270 }, { leak: -99.186, margin: 59.186, phase: 270 }],
];
const PRESETS = [
  { label: "Rectangular trap", w: 0, r: 1 }, { label: "Hann clears", w: 1, r: 1 },
  { label: "Short BH trap", w: 3, r: 0 }, { label: "Longer Hamming", w: 2, r: 2 },
] as const;

function weight(w: number, n: number, N: number) {
  const a = 2 * Math.PI * n / N;
  if (w === 0) return 1;
  if (w === 1) return .5 - .5 * Math.cos(a);
  if (w === 2) return .54 - .46 * Math.cos(a);
  return .35875 - .48829 * Math.cos(a) + .14128 * Math.cos(2 * a) - .01168 * Math.cos(3 * a);
}
function spectrum(w: number, N: number, q: number, phase: number, weak = true) {
  let re = 0, im = 0, sum = 0;
  for (let n = 0; n < N; n++) {
    const g = weight(w, n, N), a = 2 * Math.PI * (20.5 - q) * n / 128;
    re += g * Math.cos(a); im += g * Math.sin(a); sum += g;
    if (weak) { const b = 2 * Math.PI * (26 - q) * n / 128 + phase; re += .01 * g * Math.cos(b); im += .01 * g * Math.sin(b); }
  }
  return Math.hypot(re, im) / sum;
}
export function phaseMetric(w: number, N: number, phaseIndex: number) {
  let leak = 0, peak = 0;
  for (let r = 0; r <= 64; r++) { const q = 25.5 + r / 64; leak = Math.max(leak, spectrum(w, N, q, 0, false)); peak = Math.max(peak, spectrum(w, N, q, phaseIndex * Math.PI / 8)); }
  return { leakDb: 20 * Math.log10(leak), peakDb: 20 * Math.log10(peak), marginDb: 20 * Math.log10(peak / leak) };
}
const dbY = (db: number) => 22 - 1.2 * Math.max(-120, Math.min(0, db));
const y = (v: number) => dbY(20 * Math.log10(v));

export default function WeakToneWindowLab() {
  const [w, setW] = useState(0), [r, setR] = useState(1), [phase, setPhase] = useState(0), [revealed, setRevealed] = useState(true), [seen, setSeen] = useState([true, false, false]);
  const N = RECORDS[r], win = WINDOWS[w], cell = STUDY[w][r], current = phaseMetric(w, N, phase), pass = cell.margin >= 3;
  const active = phase === 0 && revealed ? PRESETS.findIndex((p) => p.w === w && p.r === r) : -1;
  const mark = (old: boolean[]) => [old[0] || (w === 0 && r === 1 && !pass), old[1] || pass, old[2] || (w === 3 && r === 1 && pass)];
  const choose = (i: number) => { const p = PRESETS[i]; setW(p.w); setR(p.r); setPhase(0); setRevealed(true); setSeen((old) => [old[0] || i === 0, old[1] || i === 1 || i === 3, old[2]]); };
  const setWindow = (i: number) => { setW(i); setRevealed(false); };
  const setRecord = (i: number) => { setR(i); setRevealed(false); };
  const audit = () => { setRevealed(true); setSeen(mark); };
  const points = Array.from({ length: 129 }, (_, i) => { const q = 19 + i / 16, x = 38 + i * 3.18; return { x, full: y(spectrum(w, N, q, phase * Math.PI / 8)), leak: y(spectrum(w, N, q, 0, false)) }; });
  const path = (key: "full" | "leak") => points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p[key].toFixed(1)}`).join(" ");

  return <Panel><div>
    <p className="pb-2 text-xs font-medium uppercase tracking-wide text-faint">Deterministic analytic two-tone study · weak line −40 dB · separation 5.5 original bins</p>
    <PresetGroup labels={PRESETS.map((p) => p.label)} activeIndex={active < 0 ? null : active} onSelect={choose} />
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Analysis window">
      {WINDOWS.map((item, i) => <Button key={item.label} active={w === i} onClick={() => setWindow(i)}>{item.label}</Button>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Slider label="Acquired record N" value={r} min={0} max={2} step={1} onChange={setRecord} display={`${N} samples`} ariaValueText={`${N} samples`} />
      <Slider label="Inspected relative phase" value={phase} min={0} max={15} step={1} onChange={setPhase} display={`${phase * 22.5}°`} ariaValueText={`${phase * 22.5} degrees`} />
    </div>
    <div className="mb-2 flex flex-wrap gap-2"><Button active={revealed} onClick={audit}>Audit all 16 phases</Button><Button onClick={() => { setW(0); setR(1); setPhase(0); setRevealed(true); setSeen([true, false, false]); }}>Reset</Button></div>

    <div className="w-full overflow-x-auto overscroll-x-contain">
      <svg viewBox="0 0 560 210" className="block w-full min-w-[560px]" role="img" aria-label={`${win.label}, ${N} samples, phase ${phase * 22.5} degrees; local leakage ${current.leakDb.toFixed(2)} decibels, observed neighborhood peak ${current.peakDb.toFixed(2)} decibels, current margin ${current.marginDb.toFixed(2)} decibels${revealed ? `, worst margin ${cell.margin.toFixed(2)} decibels, ${pass ? "pass" : "fail"}` : ", all-phase audit hidden"}.`}>
        {[0, -40, -80, -120].map((db) => <g key={db}><line x1="38" x2="445" y1={22 - 1.2 * db} y2={22 - 1.2 * db} stroke="currentColor" opacity=".12"/><text x="34" y={26 - 1.2 * db} textAnchor="end" fill="currentColor" fontSize="10">{db}</text></g>)}
        <rect x="368.7" y="22" width="50.9" height="144" fill="currentColor" opacity=".06"/><path d={path("leak")} fill="none" stroke="#4c8dd6" strokeWidth="2"/><path d={path("full")} fill="none" stroke="#e2903a" strokeWidth="2"/>
        <line x1="114.3" x2="114.3" y1="20" y2="170" stroke="currentColor" strokeDasharray="3 3"/><line x1="393.6" x2="393.6" y1="20" y2="170" stroke="currentColor" strokeDasharray="3 3"/>
        <line x1="368.7" x2="419.6" y1={dbY(current.leakDb)} y2={dbY(current.leakDb)} stroke="#4c8dd6" strokeWidth="2.5"/>
        <line x1="368.7" x2="419.6" y1={dbY(current.peakDb)} y2={dbY(current.peakDb)} stroke="#e2903a" strokeWidth="2.5"/>
        <path d={`M419.6,${dbY(current.leakDb).toFixed(1)} H440 L448,47`} fill="none" stroke="#4c8dd6" strokeWidth="1.2"/>
        <path d={`M419.6,${dbY(current.peakDb).toFixed(1)} H440 L448,77`} fill="none" stroke="#e2903a" strokeWidth="1.2"/>
        <text x="452" y="48" fill="#4c8dd6" fontSize="10" fontWeight="700"><tspan x="452">local leakage</tspan><tspan x="452" dy="12">{current.leakDb.toFixed(2)} dB</tspan></text>
        <text x="452" y="78" fill="#e2903a" fontSize="10" fontWeight="700"><tspan x="452">observed peak</tspan><tspan x="452" dy="12">{current.peakDb.toFixed(2)} dB</tspan></text>
        <line x1="368.7" x2="419.6" y1="174" y2="174" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="368.7" x2="368.7" y1="169" y2="179" stroke="currentColor" strokeWidth="1.2"/><line x1="419.6" x2="419.6" y1="169" y2="179" stroke="currentColor" strokeWidth="1.2"/>
        <text x="394.2" y="187" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="700">local q ∈ [25.5, 26.5]</text>
        <text x="114" y="202" textAnchor="middle" fill="currentColor" fontSize="10">strong q=20.5</text><text x="394" y="202" textAnchor="middle" fill="currentColor" fontSize="10">weak q=26</text>
        <text x="42" y="14" fill="#4c8dd6" fontSize="10">strong-only leakage</text><text x="170" y="14" fill="#e2903a" fontSize="10">two-tone spectrum</text><text x="443" y="14" textAnchor="end" fill="currentColor" fontSize="10">dB / q original bins</text>
      </svg>
    </div>

    <Readout>Current phase margin <strong>{current.marginDb.toFixed(2)} dB</strong>. {revealed ? <>Worst of 16 phases: <strong>{cell.margin.toFixed(2)} dB at {cell.phase}° — {pass ? "PASS" : "FAIL"}</strong> against ≥3.00 dB.</> : <strong>Choose first, then audit all phases.</strong>}</Readout>
    <div className="my-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
      {[['main-lobe width', `${win.width} current-record bins`], ['peak sidelobe · N=128 reference', `${win.psl.toFixed(2)} dB`], ['coherent gain', win.cg.toFixed(5)], ['scalloping loss · N=128 reference', `${win.scallop.toFixed(2)} dB`], ['ENBW', `${win.enbw.toFixed(3)} bins`]].map(([a, b]) => <div key={a} className="rounded border border-line p-2"><span className="block text-faint">{a}</span><strong className="font-mono">{b}</strong></div>)}
    </div>
    <p className="mb-3 rounded border border-line p-2 text-xs text-faint">Local leakage <strong className="text-ink">{cell.leak.toFixed(2)} dB</strong> is recomputed for the selected N and target neighborhood, not copied from the headline peak-sidelobe value. The PSL and positive scalloping-loss cards are finite N=128 references. N changes acquired duration; no zero padding is used.</p>
    <TargetList title="Window-choice audit" targets={[
      { label: "Falsify narrowest-is-best with Rectangular N=128", met: revealed && w === 0 && r === 1 && !pass, latched: seen[0], detail: "2-bin lobe · −1.62 dB worst margin" },
      { label: "Find a window-record pair that passes every phase", met: revealed && pass, latched: seen[1], detail: revealed ? `${win.label} · ${cell.margin.toFixed(2)} dB` : "audit hidden" },
      { label: "Raise Short BH from N=64 to N=128", met: revealed && w === 3 && r === 1 && pass, latched: seen[2], detail: "−1.31 dB → 59.16 dB" },
    ]} />
  </div></Panel>;
}
