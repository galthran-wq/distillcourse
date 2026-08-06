"use client";

import { useState } from "react";
import { Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

export type SpectrumMode = "single" | "pair";
export interface SpectrumPoint { k: number; f: number; a: number }

const FS = 1024, AMBER = "#e2903a", BLUE = "#4c8dd6";
const NS = [64, 128, 192, 256], QS = [1, 2, 4, 8, 16];
const PRESETS = [
  { label: "Coarse tone", mode: "single", N: 64, Q: 1, phase: 0 },
  { label: "Padded tone", mode: "single", N: 64, Q: 4, phase: 0 },
  { label: "Padded pair", mode: "pair", N: 64, Q: 16, phase: 0 },
  { label: "Long pair", mode: "pair", N: 256, Q: 4, phase: 0 },
] as const;
const PHASES = [{ label: "Phase 0°", value: 0 }, { label: "Phase 90°", value: 90 }] as const;

/** Direct one-sided DFT samples in the frozen 140–210 Hz display band. */
export function spectrum(mode: SpectrumMode, N: number, Q: number, phaseDeg: number): SpectrumPoint[] {
  const L = N * Q, phase = phaseDeg * Math.PI / 180;
  const samples = Array.from({ length: N }, (_, n) => mode === "single"
    ? Math.cos(2 * Math.PI * 173 * n / FS)
    : Math.cos(2 * Math.PI * 170 * n / FS) + 0.8 * Math.cos(2 * Math.PI * 180 * n / FS + phase));
  const points: SpectrumPoint[] = [];
  for (let k = Math.ceil(140 * L / FS); k <= Math.floor(210 * L / FS); k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = 2 * Math.PI * k * n / L;
      re += samples[n] * Math.cos(angle); im -= samples[n] * Math.sin(angle);
    }
    points.push({ k, f: k * FS / L, a: 2 * Math.hypot(re, im) / N });
  }
  return points;
}

export function peakCandidates(points: SpectrumPoint[]) {
  const threshold = 0.2 * Math.max(...points.map((p) => p.a));
  return points.filter((p, i) => i > 0 && i < points.length - 1 && p.f >= 150 && p.f <= 200
    && p.a > points[i - 1].a && p.a > points[i + 1].a && p.a >= threshold);
}

export function pairResolved(points: SpectrumPoint[]) {
  const peaks = peakCandidates(points);
  const p170 = peaks.find((p) => Math.abs(p.f - 170) <= 0.5);
  const p180 = peaks.find((p) => Math.abs(p.f - 180) <= 0.5);
  if (!p170 || !p180 || p170.k === p180.k) return false;
  const [left, right] = p170.k < p180.k ? [p170, p180] : [p180, p170];
  return points.some((p) => p.k > left.k && p.k < right.k && p.a < Math.min(left.a, right.a));
}

const peakText = (points: SpectrumPoint[]) => {
  const peaks = peakCandidates(points);
  return peaks.length ? peaks.map((p) => `${p.f.toFixed(2)} Hz`).join(", ") : "none";
};

export default function PaddingVsDataLab() {
  const [mode, setMode] = useState<SpectrumMode>("pair");
  const [N, setN] = useState(64);
  const [qIndex, setQIndex] = useState(4);
  const [phase, setPhase] = useState(0);
  const Q = QS[qIndex], L = N * Q, grid = FS / L;
  const p0 = mode === "pair" ? spectrum("pair", N, Q, 0) : [];
  const p90 = mode === "pair" ? spectrum("pair", N, Q, 90) : [];
  const points = mode === "single" ? spectrum("single", N, Q, 0)
    : phase === 0 ? p0 : phase === 90 ? p90 : spectrum("pair", N, Q, phase);
  const alternate = mode === "pair" ? (phase === 90 ? p0 : p90) : [];
  const singlePeak = points.reduce((best, p) => p.a > best.a ? p : best, points[0]);
  const eBin = mode === "single" ? Math.abs(singlePeak.f - 173) / (FS / N) : Infinity;
  const interpolated = mode === "single" && N === 64 && eBin < 0.1;
  const stable = mode === "pair" && pairResolved(p0) && pairResolved(p90);
  const activePreset = PRESETS.findIndex((p) => p.mode === mode && p.N === N && p.Q === Q && p.phase === phase);
  const phasePreset = PHASES.findIndex((p) => p.value === phase);
  const maxA = Math.max(...points.map((p) => p.a), ...alternate.map((p) => p.a), 1e-12);
  const coord = (value: number) => value.toFixed(3);
  const sx = (f: number) => coord(28 + 312 * (f - 140) / 70);
  const sy = (a: number) => coord(208 - 148 * a / maxA);
  const desktopY = (a: number) => coord(190 - 145 * a / maxA);
  const labelY = (a: number) => coord(Math.max(54, 200 - 148 * a / maxA));
  const desktopLabelY = (a: number) => coord(Math.max(34, 183 - 145 * a / maxA));
  const path = (data: SpectrumPoint[]) => data.map((p) => `${sx(p.f)},${sy(p.a)}`).join(" ");
  const desktopPath = (data: SpectrumPoint[]) => data.map((p) => `${sx(p.f)},${desktopY(p.a)}`).join(" ");
  const pointRadius = Q >= 8 ? coord(1.7) : coord(2.5);
  const labels = mode === "single" ? [singlePeak] : peakCandidates(points);
  const chartLabel = `${mode === "single" ? "Single tone" : "Two tone pair"}; N ${N}, L ${L}, grid ${grid.toFixed(2)} hertz; ${mode === "single" ? `peak ${singlePeak.f.toFixed(2)} hertz` : `live peaks ${peakText(points)}, two phase status ${stable ? "pass" : "fail"}`}.`;
  const setPreset = (i: number) => {
    const p = PRESETS[i]; setMode(p.mode); setN(p.N); setQIndex(QS.indexOf(p.Q)); setPhase(p.phase);
  };

  return (
    <Panel>
      <div className="[&_button]:text-ink">
      <p className="pb-2 font-mono text-xs text-faint">f_s=1024 Hz · rectangular record · 140–210 Hz display · one-sided 2|X_L[k]|/N</p>
      <PresetGroup labels={PRESETS.map((p) => p.label)} activeIndex={activePreset < 0 ? null : activePreset} onSelect={setPreset} />
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Slider label="acquired samples N" value={NS.indexOf(N)} min={0} max={3} step={1}
          onChange={(i) => setN(NS[i])} display={`${N}`} ariaLabel="Acquired sample count" ariaValueText={`${N} acquired samples`} />
        <Slider label="zero-padding factor Q" value={qIndex} min={0} max={4} step={1}
          onChange={setQIndex} display={`Q=${Q} · L=${L}`} ariaLabel="Zero padding factor" ariaValueText={`factor ${Q}, transform length ${L}`} />
      </div>
      {mode === "pair" && <div role="group" aria-label="Pair phase controls">
        <PresetGroup labels={PHASES.map((p) => p.label)} activeIndex={phasePreset < 0 ? null : phasePreset}
          onSelect={(i) => setPhase(PHASES[i].value)} />
        <Slider label="pair phase φ" value={phase} min={0} max={90} step={1} onChange={setPhase}
          display={`${phase}°`} ariaLabel="Pair phase" ariaValueText={`${phase} degrees`} />
      </div>}

      <TargetList targets={[
        { label: "Peak interpolation: N=64 and error < 0.1 original bins", met: interpolated,
          detail: mode === "single" ? `f̂=${singlePeak.f.toFixed(2)} Hz · e_bin=${eBin.toFixed(4)} · first allowed pass Q=4` : "select Coarse tone, then increase only Q" },
        { label: "Stable pair: 170 and 180 Hz pass at both 0° and 90°", met: stable,
          detail: mode === "pair" ? `0° peaks ${peakText(p0)} · 90° peaks ${peakText(p90)}` : "compare Padded pair with Long pair at L=1024" },
      ]} />

      <Readout>
        <strong className={interpolated || stable ? "text-accent" : ""}>{interpolated || stable ? "PASS" : "FAIL"}.</strong>{" "}
        {mode === "single" ? `single 173 Hz · f̂=${singlePeak.f.toFixed(2)} Hz · e_bin=${eBin.toFixed(4)}`
          : `pair φ=${phase}° · live peaks ${peakText(points)} · two-phase ${stable ? "PASS" : "FAIL"}`}
        <span className="block">N={N} · Q={Q} · L={L} · acquired {(1000 * N / FS).toFixed(1)} ms · original spacing {(FS / N).toFixed(2)} Hz · displayed spacing {grid.toFixed(2)} Hz</span>
        <span className="block">record-limited individual-tone main-lobe width {(2 * FS / N).toFixed(1)} Hz{mode === "pair" ? ` · phase tests: 0° ${peakText(p0)}; 90° ${peakText(p90)}` : ""}</span>
        <span className="block text-faint">Zero padding adds coordinates, not acquired information; the pair criterion is specific to these tones, amplitudes, rectangular record, and two phases.</span>
      </Readout>

      <svg viewBox="0 0 360 278" className="mt-2 w-full sm:hidden" role="img" aria-label={chartLabel}>
        <text x="16" y="17" fill="currentColor" fontSize="16" fontWeight="700">DFT coordinates</text>
        <text x="16" y="37" fill="currentColor" fontSize="16" fontWeight="700">{mode === "single" ? "173 Hz tone" : `170 + 0.8×180 Hz · φ=${phase}°`}</text>
        <line x1="28" y1="208" x2="340" y2="208" stroke="currentColor" opacity="0.4" />
        {mode === "single" ? <line x1={sx(173)} y1="48" x2={sx(173)} y2="212" stroke={AMBER} strokeDasharray="4 3" /> : <>
          <line x1={sx(170)} y1="48" x2={sx(170)} y2="212" stroke={AMBER} strokeDasharray="4 3" />
          <line x1={sx(180)} y1="48" x2={sx(180)} y2="212" stroke={BLUE} strokeDasharray="4 3" />
        </>}
        {Q >= 4 && <polyline points={path(points)} fill="none" stroke="currentColor" opacity="0.35" strokeWidth="1.5" />}
        {alternate.length > 0 && <polyline points={path(alternate)} fill="none" stroke={BLUE} opacity="0.55" strokeWidth="1.5" strokeDasharray="6 4" />}
        {points.map((p) => <g key={p.k}><line x1={sx(p.f)} y1="208" x2={sx(p.f)} y2={sy(p.a)} stroke="currentColor" opacity="0.45" />
          <circle cx={sx(p.f)} cy={sy(p.a)} r={pointRadius} fill="currentColor" /></g>)}
        {labels.map((p) => <text key={p.k} x={sx(p.f)} y={labelY(p.a)} textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700">{p.f.toFixed(1)} Hz</text>)}
        {(mode === "single" ? [140, 173, 210] : [140, 170, 180, 210]).map((f) => <text key={f} x={sx(f)} y="232" textAnchor="middle" fill={f === 170 || f === 173 ? AMBER : f === 180 ? BLUE : "currentColor"} fontSize="15">{f}</text>)}
        <text x="180" y="253" textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="15">frequency (Hz) · current L-point grid</text>
        {mode === "pair" && <text x="180" y="272" textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="15">dashed: alternate phase test</text>}
      </svg>

      <svg viewBox="0 0 360 240" className="mt-2 hidden w-full sm:block" role="img" aria-label={chartLabel}>
        <text x="16" y="18" fill="currentColor" fontSize="12" fontWeight="700">DFT coordinates · {mode === "single" ? "173 Hz tone" : `170 + 0.8×180 Hz · φ=${phase}°`}</text>
        <line x1="28" y1="190" x2="340" y2="190" stroke="currentColor" opacity="0.4" />
        {mode === "single" ? <line x1={sx(173)} y1="28" x2={sx(173)} y2="194" stroke={AMBER} strokeDasharray="4 3" /> : <>
          <line x1={sx(170)} y1="28" x2={sx(170)} y2="194" stroke={AMBER} strokeDasharray="4 3" />
          <line x1={sx(180)} y1="28" x2={sx(180)} y2="194" stroke={BLUE} strokeDasharray="4 3" />
        </>}
        {Q >= 4 && <polyline points={desktopPath(points)} fill="none" stroke="currentColor" opacity="0.35" strokeWidth="1.5" />}
        {alternate.length > 0 && <polyline points={desktopPath(alternate)} fill="none" stroke={BLUE} opacity="0.55" strokeWidth="1.5" strokeDasharray="6 4" />}
        {points.map((p) => <g key={p.k}><line x1={sx(p.f)} y1="190" x2={sx(p.f)} y2={desktopY(p.a)} stroke="currentColor" opacity="0.45" />
          <circle cx={sx(p.f)} cy={desktopY(p.a)} r={pointRadius} fill="currentColor" /></g>)}
        {labels.map((p) => <text key={p.k} x={sx(p.f)} y={desktopLabelY(p.a)} textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="700">{p.f.toFixed(1)} Hz</text>)}
        {(mode === "single" ? [140, 173, 210] : [140, 170, 180, 210]).map((f) => <text key={f} x={sx(f)} y="211" textAnchor="middle" fill={f === 170 || f === 173 ? AMBER : f === 180 ? BLUE : "currentColor"} fontSize="10">{f}</text>)}
        <text x="180" y="231" textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="10">frequency (Hz) · current L-point grid{mode === "pair" ? " · dashed: alternate phase test" : ""}</text>
      </svg>
      </div>
    </Panel>
  );
}
