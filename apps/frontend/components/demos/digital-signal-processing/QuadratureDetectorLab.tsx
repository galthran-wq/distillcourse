"use client";

import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

type Mode = "sine" | "iq";
const N = 20, OMEGA = 0.3 * Math.PI, AMBER = "#e2903a", BLUE = "#4c8dd6";
const MODES = [{ label: "Sine only", id: "sine" }, { label: "I/Q pair", id: "iq" }] as const;
const PRESETS = [
  { label: "Oblique 37°", phase: 37 },
  { label: "Sine peak 90°", phase: 90 },
  { label: "Sine null 0°", phase: 0 },
  { label: "Wrap edge 180°", phase: 180 },
] as const;

function wrap(degrees: number) {
  const value = ((degrees + 180) % 360 + 360) % 360 - 180;
  return Math.abs(value + 180) < 1e-10 ? 180 : value;
}

function measure(phaseDeg: number) {
  const phase = phaseDeg * Math.PI / 180;
  let I = 0, Q = 0;
  const samples = Array.from({ length: N }, (_, n) => {
    const x = Math.cos(OMEGA * n + phase);
    I += x * Math.cos(OMEGA * n); Q -= x * Math.sin(OMEGA * n); return x;
  });
  I *= 2 / N; Q *= 2 / N;
  const amplitude = Math.hypot(I, Q);
  const phaseHat = amplitude === 0 ? null : wrap(Math.atan2(Q, I) * 180 / Math.PI);
  return { samples, I, Q, amplitude, phaseHat,
    phaseError: phaseHat === null ? null : Math.abs(wrap(phaseHat - phaseDeg)) };
}

const GRID = Array.from({ length: 1441 }, (_, i) => measure(-180 + 0.25 * i));
const SWEEP = {
  amplitude: Math.max(...GRID.map((m) => Math.abs(m.amplitude - 1))),
  phase: Math.max(...GRID.map((m) => m.phaseError ?? 0)),
};
const SWEEP_PASS = SWEEP.amplitude < 0.01 && SWEEP.phase < 2;
const clean = (value: number) => Math.abs(value) < 5e-13 ? 0 : value;
const fixed = (value: number) => clean(value).toFixed(6);
const percent = (value: number) => `${(100 * value).toFixed(4)}%`;

export default function QuadratureDetectorLab() {
  const [mode, setMode] = useState<Mode>("sine");
  const [phaseDeg, setPhaseDeg] = useState(37);
  const [seed, setSeed] = useState(0x6d2b79f5);
  const m = measure(phaseDeg), sineAmplitude = Math.abs(m.Q);
  const sineError = Math.abs(sineAmplitude - 1), iqError = Math.abs(m.amplitude - 1);
  const activeAmplitude = mode === "sine" ? sineAmplitude : m.amplitude;
  const activeError = mode === "sine" ? sineError : iqError;
  const falsified = mode === "sine" && Math.abs(m.Q) < 1e-12 && sineError > 0.99;
  const passed = mode === "iq" && SWEEP_PASS;
  const presetIndex = PRESETS.findIndex((p) => p.phase === phaseDeg);
  const px = 95 + 52 * m.I, py = 88 - 52 * m.Q;
  const sampleX = (n: number) => 20 + 17 * n, sampleY = (x: number) => 78 - 27 * x;
  const newSeededPhase = () => {
    const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    setSeed(next); setPhaseDeg(Math.round(next / 2 ** 32 * 360 - 180));
  };
  const status = falsified ? "FALSIFIED" : passed ? "PASS" : "Not yet";

  return (
    <Panel>
      <p className="pb-2 font-mono text-xs text-faint">A=1 · ω₀=0.3π rad/sample=0.15 cycle/sample · N=20 · noise-free, exactly 3 cycles</p>
      <div role="group" aria-label="Detector mode">
        <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">Detector</p>
        <PresetGroup labels={MODES.map((x) => x.label)} activeIndex={MODES.findIndex((x) => x.id === mode)}
          onSelect={(i) => setMode(MODES[i].id)} />
      </div>
      <div role="group" aria-label="Phase cases">
        <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">Phase cases</p>
        <PresetGroup labels={PRESETS.map((x) => x.label)} activeIndex={presetIndex < 0 ? null : presetIndex}
          onSelect={(i) => setPhaseDeg(PRESETS[i].phase)} />
      </div>
      <Button className="mb-2" onClick={newSeededPhase} aria-label="Choose new deterministic seeded input phase">New seeded phase</Button>
      <Slider label="input phase φ" value={phaseDeg} min={-180} max={180} step={1} onChange={setPhaseDeg}
        display={`${wrap(phaseDeg)}°`} ariaLabel="Input phase phi" ariaValueText={`${wrap(phaseDeg)} degrees`} />

      <TargetList targets={[
        { label: "Falsify sine-only at its null", met: falsified,
          detail: `|Q|=${Math.abs(m.Q).toExponential(2)} · amplitude error=${percent(sineError)}` },
        { label: "Switch to I/Q: pass every phase", met: passed,
          detail: `grid max: amplitude ${SWEEP.amplitude.toExponential(3)} · phase ${SWEEP.phase.toFixed(3)}°` },
      ]} />

      <Readout>
        <strong className={falsified || passed ? "text-accent" : ""}>{status}.</strong>{" "}
        I=<strong className="text-[#e2903a]">{fixed(m.I)}</strong> · Q=<strong className="text-[#4c8dd6]">{fixed(m.Q)}</strong> ·
        active Â=<strong>{fixed(activeAmplitude)}</strong> · error=<strong>{percent(activeError)}</strong>
        <span className="block text-faint">{mode === "iq" && m.phaseHat !== null
          ? `wrapped phase=${m.phaseHat.toFixed(3)}° · circular error=${(m.phaseError ?? 0).toFixed(3)}°`
          : "phase unavailable from one scalar projection; zero recovered magnitude would make phase undefined"}</span>
      </Readout>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <svg viewBox="0 0 280 180" className="w-full" role="img"
          aria-label={`Phasor at ${wrap(phaseDeg)} degrees with I ${fixed(m.I)} and Q ${fixed(m.Q)}.`}>
          <text x="12" y="18" fill="currentColor" fontSize="13" fontWeight="700">P=I+jQ · phase {wrap(phaseDeg)}°</text>
          <circle cx="95" cy="88" r="52" fill="none" stroke="currentColor" opacity="0.3" />
          <line x1="32" y1="88" x2="158" y2="88" stroke="currentColor" opacity="0.35" />
          <line x1="95" y1="25" x2="95" y2="151" stroke="currentColor" opacity="0.35" />
          <line x1="95" y1="88" x2={px} y2="88" stroke={AMBER} strokeWidth="3" strokeDasharray={mode === "sine" ? "5 4" : undefined} opacity={mode === "sine" ? 0.45 : 1} />
          <line x1={px} y1="88" x2={px} y2={py} stroke={BLUE} strokeWidth="3" />
          <line x1="95" y1="88" x2={px} y2={py} stroke="currentColor" strokeWidth="2" />
          <circle cx={px} cy={py} r="5" fill="var(--panel)" stroke="currentColor" strokeWidth="2" />
          <g className="hidden sm:inline">
            <text x="168" y="72" fill={AMBER} fontSize="12" fontWeight="700">I · cosine</text>
            <text x="268" y="72" textAnchor="end" fill={AMBER} fontSize="12" fontWeight="700">{fixed(m.I)}</text>
            <text x="168" y="94" fill={BLUE} fontSize="12" fontWeight="700">Q · −sine</text>
            <text x="268" y="94" textAnchor="end" fill={BLUE} fontSize="12" fontWeight="700">{fixed(m.Q)}</text>
            <text x="168" y="122" fill="currentColor" fontSize="11">radius = {fixed(m.amplitude)}</text>
            <text x="268" y="140" textAnchor="end" fill="currentColor" opacity="0.65" fontSize="10.5">P=I+jQ · exp(−jωn)</text>
          </g>
          <g className="sm:hidden">
            <text x="168" y="61" fill={AMBER} fontSize="12" fontWeight="700">I · cosine</text>
            <text x="268" y="78" textAnchor="end" fill={AMBER} fontSize="12" fontWeight="700">{fixed(m.I)}</text>
            <text x="168" y="94" fill={BLUE} fontSize="12" fontWeight="700">Q · −sine</text>
            <text x="268" y="111" textAnchor="end" fill={BLUE} fontSize="12" fontWeight="700">{fixed(m.Q)}</text>
            <text x="168" y="133" fill="currentColor" fontSize="11.25">radius = {fixed(m.amplitude)}</text>
            <text x="268" y="153" textAnchor="end" fill="currentColor" opacity="0.65" fontSize="11.25">P=I+jQ · exp(−jωn)</text>
          </g>
        </svg>

        <svg viewBox="0 0 280 180" className="w-full" role="img"
          aria-label={`${mode === "sine" ? "Sine-only" : "I Q"} detector active. Sine estimate ${fixed(sineAmplitude)}, I Q estimate ${fixed(m.amplitude)}, status ${status}.`}>
          <text x="12" y="18" fill="currentColor" fontSize="13" fontWeight="700">amplitude estimates</text>
          <line x1="252" y1="29" x2="252" y2="158" stroke="currentColor" strokeDasharray="4 3" opacity="0.55" />
          <text x="252" y="18" textAnchor="end" fill="currentColor" opacity="0.65" fontSize="10" className="text-[11.25px] sm:text-[10px]">true A=1</text>
          <rect x="8" y="34" width="263" height="58" rx="5" fill="none" stroke="currentColor" strokeWidth={mode === "sine" ? 2 : 1} opacity={mode === "sine" ? 0.75 : 0.18} />
          <text x="18" y="54" fill={BLUE} fontSize="12" fontWeight="700">sine-only |Q|</text>
          <rect x="18" y="63" width={234 * sineAmplitude} height="13" rx="3" fill={BLUE} />
          <text x="252" y="86" textAnchor="end" fill="currentColor" fontSize="11" className="text-[11.25px] sm:text-[11px]">{fixed(sineAmplitude)} · {percent(sineError)} error</text>
          <rect x="8" y="99" width="263" height="62" rx="5" fill="none" stroke="currentColor" strokeWidth={mode === "iq" ? 2 : 1} opacity={mode === "iq" ? 0.75 : 0.18} />
          <text x="18" y="119" fill="currentColor" fontSize="12" fontWeight="700">I/Q hypot(I,Q)</text>
          <rect x="18" y="128" width={234 * m.amplitude} height="13" rx="3" fill="currentColor" opacity="0.75" />
          <text x="252" y="154" textAnchor="end" fill="currentColor" fontSize="11" className="text-[11.25px] sm:text-[11px]">{fixed(m.amplitude)} · {percent(iqError)} error</text>
        </svg>
      </div>

      <svg viewBox="0 0 360 150" className="mt-1 w-full sm:hidden" role="img"
        aria-label={`Twenty unconnected samples of x n at phase ${wrap(phaseDeg)} degrees; minimum ${Math.min(...m.samples).toFixed(3)}, maximum ${Math.max(...m.samples).toFixed(3)}.`}>
        <text x="18" y="15" fill="currentColor" fontSize="14.5" fontWeight="700">fixed record x[n] · integer samples only</text>
        <line x1="16" y1="78" x2="347" y2="78" stroke="currentColor" opacity="0.4" />
        {m.samples.map((value, n) => <g key={n}><line x1={sampleX(n)} y1="78" x2={sampleX(n)} y2={sampleY(value)} stroke="currentColor" opacity="0.72" />
          <circle cx={sampleX(n)} cy={sampleY(value)} r="2.3" fill="currentColor" /></g>)}
        {[0, 5, 10, 15, 19].map((n) => <text key={n} x={sampleX(n)} y="116" textAnchor="middle" fill="currentColor" opacity="0.6" fontSize="14.5">{n}</text>)}
        <text x="181" y="143" textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="14.5">sample index n</text>
      </svg>
      <svg viewBox="0 0 360 130" className="mt-1 hidden w-full sm:block" role="img"
        aria-label={`Twenty unconnected samples of x n at phase ${wrap(phaseDeg)} degrees; minimum ${Math.min(...m.samples).toFixed(3)}, maximum ${Math.max(...m.samples).toFixed(3)}.`}>
        <text x="18" y="15" fill="currentColor" fontSize="12" fontWeight="700">fixed record x[n] · integer samples only</text>
        <line x1="16" y1="78" x2="347" y2="78" stroke="currentColor" opacity="0.4" />
        {m.samples.map((value, n) => <g key={n}><line x1={sampleX(n)} y1="78" x2={sampleX(n)} y2={sampleY(value)} stroke="currentColor" opacity="0.72" />
          <circle cx={sampleX(n)} cy={sampleY(value)} r="2.3" fill="currentColor" /></g>)}
        {[0, 5, 10, 15, 19].map((n) => <text key={n} x={sampleX(n)} y="116" textAnchor="middle" fill="currentColor" opacity="0.6" fontSize="10">{n}</text>)}
        <text x="181" y="125" textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="10.5">sample index n</text>
      </svg>
    </Panel>
  );
}
