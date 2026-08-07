"use client";

import { useState } from "react";
import { Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

const B = 4.0, M = 512, AMBER = "#e2903a", BLUE = "#4c8dd6";
const TONES = [0.7, 1.8, 3.1, 4.0], PHASES = [0, 45, 90];
const TIMES = Array.from({ length: M }, (_, m) => (20 * m) / M); // ms; kHz·ms = cycles
const RATE_PRESETS = [
  { label: "Aliased 7.50", fs: 7.5 },
  { label: "Nyquist 8.00", fs: 8.0 },
  { label: "No guard 8.50", fs: 8.5 },
  { label: "Guard pass 9.00", fs: 9.0 },
] as const;
const PHASE_PRESETS = [
  { label: "Cosine 0°", phase: 0 },
  { label: "Oblique 45°", phase: 45 },
  { label: "Sine null 90°", phase: 90 },
] as const;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Signed residue q=f-round(f/fs)fs in [-fs/2,fs/2]; ties resolved before calling. */
function aliasMap(f: number, fs: number) {
  const q = f - Math.round(f / fs) * fs;
  return { q, fa: Math.abs(q) };
}

/** Unfloored per-tone reconstruction error E for a unit tone at f kHz, phase deg. */
function toneError(f: number, phaseDeg: number, fs: number) {
  if (2 * f < fs) return 0; // ideal reconstruction returns the tone exactly
  const ph = rad(phaseDeg);
  const xh = (t: number) => {
    if (2 * f === fs) return Math.cos(ph) * Math.cos(2 * Math.PI * f * t);
    const { q, fa } = aliasMap(f, fs);
    return Math.cos(2 * Math.PI * fa * t + (q >= 0 ? ph : -ph));
  };
  let num = 0, den = 0;
  for (const t of TIMES) {
    const x = Math.cos(2 * Math.PI * f * t + ph);
    num += (xh(t) - x) ** 2; den += x * x;
  }
  return Math.sqrt(num) / Math.max(Math.sqrt(den), Number.EPSILON);
}

const toDb = (e: number) => (e === 0 ? -120 : 20 * Math.log10(e)); // display floor only

export default function AliasThresholdLab() {
  const [fsKhz, setFsKhz] = useState(8.0);
  const [edgePhaseDeg, setEdgePhaseDeg] = useState(90);
  const nyquist = fsKhz / 2, guard = nyquist - B;
  // Universal 12-case bank: each tone separately at 0°, 45°, 90°.
  let worst = { e: 0, f: TONES[0], phase: PHASES[0] };
  for (const f of TONES) for (const phase of PHASES) {
    const e = toneError(f, phase, fsKhz);
    if (e > worst.e) worst = { e, f, phase };
  }
  const allBelowNyquist = TONES.every((f) => 2 * f < fsKhz);
  const pass = worst.e < 1e-3 && allBelowNyquist && guard >= 0.5;
  // Sample-equivalent edge pair: x_A at 4 kHz phase φ, x_B at fs−4 kHz phase −φ.
  const fB = fsKhz - B, ph = rad(edgePhaseDeg);
  const xA = (t: number) => Math.cos(2 * Math.PI * B * t + ph);
  const xB = (t: number) => Math.cos(2 * Math.PI * fB * t - ph);
  let mismatch = 0;
  for (let n = 0; n * (1 / fsKhz) <= 20; n++) mismatch = Math.max(mismatch, Math.abs(xA(n / fsKhz) - xB(n / fsKhz)));
  let sepNum = 0, sepDen = 0;
  for (const t of TIMES) { sepNum += (xA(t) - xB(t)) ** 2; sepDen += xA(t) ** 2; }
  const separation = Math.sqrt(sepNum) / Math.max(Math.sqrt(sepDen), Number.EPSILON);
  const falsified = fsKhz === 8.0 && mismatch < 1e-12 && separation > 1e-3;
  const status = pass ? "PASS" : falsified ? "FALSIFIED" : "Not yet";
  const ratePreset = RATE_PRESETS.findIndex((p) => p.fs === fsKhz);
  const phasePreset = PHASE_PRESETS.findIndex((p) => p.phase === edgePhaseDeg);
  const apparent = TONES.map((f) => `${f.toFixed(1)}→${aliasMap(f, fsKhz).fa.toFixed(2)}`);
  // Spectral lane geometry: 0–6 kHz mapped to x∈[24,344].
  const fx = (f: number) => 24 + (320 * Math.min(f, 6)) / 6;
  const replicaEdge = fsKhz - B; // left edge of the first replica's mirrored support
  // Waveform chart: 0–1 ms, y for value v in [-1,1].
  const wx = (t: number) => 24 + 320 * t, wy = (v: number) => 78 - 46 * v;
  const curve = (fn: (t: number) => number) =>
    Array.from({ length: 161 }, (_, i) => `${wx(i / 160).toFixed(1)},${wy(fn(i / 160)).toFixed(1)}`).join(" ");
  const dots = Array.from({ length: Math.floor(fsKhz) + 1 }, (_, n) => n / fsKhz).filter((t) => t <= 1);

  return (
    <Panel>
      <p className="pb-2 font-mono text-xs text-faint">declared band |f|≤B=4.0 kHz · tones 0.7 / 1.8 / 3.1 / 4.0 kHz each tested at 0°, 45°, 90° · E on 512 fixed times over 20 ms</p>
      <div role="group" aria-label="Sample-rate presets">
        <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">Sample rate</p>
        <PresetGroup labels={RATE_PRESETS.map((p) => p.label)} activeIndex={ratePreset < 0 ? null : ratePreset}
          onSelect={(i) => setFsKhz(RATE_PRESETS[i].fs)} />
      </div>
      <Slider label="f_s" value={fsKhz} min={6} max={10} step={0.25} onChange={setFsKhz}
        display={`${fsKhz.toFixed(2)} kHz`} ariaLabel="Sample rate" ariaValueText={`${fsKhz.toFixed(2)} kilohertz`} />
      <div role="group" aria-label="Edge-tone phase presets">
        <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">4 kHz edge-tone phase φ</p>
        <PresetGroup labels={PHASE_PRESETS.map((p) => p.label)} activeIndex={phasePreset < 0 ? null : phasePreset}
          onSelect={(i) => setEdgePhaseDeg(PHASE_PRESETS[i].phase)} />
      </div>
      <Slider label="φ" value={edgePhaseDeg} min={0} max={90} step={1} onChange={setEdgePhaseDeg}
        display={`${edgePhaseDeg}°`} ariaLabel="Edge tone phase" ariaValueText={`${edgePhaseDeg} degrees`} />

      <TargetList targets={[
        { label: "Lowest guarded rate: every case < −60 dB and clearance ≥ 0.50 kHz", met: pass,
          detail: `worst E=${toDb(worst.e).toFixed(1)} dB (${worst.f.toFixed(1)} kHz, ${worst.phase}°) · clearance ${guard.toFixed(2)} kHz · first grid pass is 9.00 kHz` },
        { label: "Break equality with phase: identical samples, different signals", met: falsified,
          detail: `sample mismatch ${mismatch.toExponential(1)} · continuous separation ${separation.toExponential(2)}` },
      ]} />

      <Readout>
        <strong className={pass || falsified ? "text-accent" : ""}>{status}.</strong>{" "}
        f_s=<strong>{fsKhz.toFixed(2)}</strong> kHz · f_s/2=<strong>{nyquist.toFixed(2)}</strong> · B=4.00 · clearance=<strong>{guard.toFixed(2)}</strong> kHz
        <span className="block">apparent kHz: {apparent.join(" · ")} · worst case {toDb(worst.e).toFixed(1)} dB at {worst.f.toFixed(1)} kHz, {worst.phase}°</span>
        <span className="block">edge candidate f_B=f_s−4=<strong>{fB.toFixed(2)}</strong> kHz — {fB <= B ? "inside the declared band: the samples admit both analog origins" : "outside the declared band: the bandlimit excludes it"}</span>
        <span className="block text-faint">identical records leave a digital filter no label to choose an analog origin; separation must happen before sampling</span>
      </Readout>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <svg viewBox="0 0 360 150" className="w-full" role="img"
          aria-label={`Spectral lane at ${fsKhz.toFixed(2)} kilohertz: band edge 4, Nyquist ${nyquist.toFixed(2)}, replica edge ${replicaEdge.toFixed(2)}, clearance ${guard.toFixed(2)} kilohertz, status ${status}.`}>
          <text x="12" y="16" fill="currentColor" fontSize="12" fontWeight="700">spectral lane · replica edge f_s−B</text>
          <line x1="24" y1="96" x2="344" y2="96" stroke="currentColor" opacity="0.4" />
          <rect x={fx(0)} y="60" width={fx(B) - fx(0)} height="36" fill={BLUE} opacity="0.3" />
          <rect x={fx(Math.max(replicaEdge, 0))} y="60" width={Math.max(fx(6) - fx(Math.max(replicaEdge, 0)), 0)} height="36" fill={AMBER} opacity="0.35" />
          {replicaEdge < B && <rect x={fx(Math.max(replicaEdge, 0))} y="60" width={Math.max(fx(B) - fx(Math.max(replicaEdge, 0)), 0)} height="36" fill="none" stroke="currentColor" strokeDasharray="3 3" />}
          <line x1={fx(nyquist)} y1="40" x2={fx(nyquist)} y2="112" stroke="currentColor" strokeDasharray="5 4" />
          <line x1={fx(B + 0.5)} y1="52" x2={fx(B + 0.5)} y2="104" stroke="currentColor" strokeDasharray="2 3" opacity="0.7" />
          {TONES.map((f) => <line key={f} x1={fx(f)} y1="70" x2={fx(f)} y2="96" stroke="currentColor" strokeWidth="2" />)}
          <text x={fx(0)} y="126" fill="currentColor" opacity="0.7" fontSize="10">0</text>
          <text x={fx(B)} y="126" textAnchor="middle" fill={BLUE} fontSize="10" fontWeight="700">B=4</text>
          <text x={fx(nyquist)} y="52" textAnchor="middle" fill="currentColor" fontSize="10">f_s/2={nyquist.toFixed(2)}</text>
          <text x={fx(B + 0.5)} y="140" textAnchor="middle" fill="currentColor" opacity="0.7" fontSize="10">need ≥4.50</text>
          <text x={Math.min(fx(replicaEdge), 330)} y="126" textAnchor="middle" fill={AMBER} fontSize="10" fontWeight="700">f_s−B={replicaEdge.toFixed(2)}</text>
          <text x="344" y="36" textAnchor="end" fill="currentColor" fontSize="11" fontWeight="700">
            {replicaEdge < B ? "overlap: aliased" : replicaEdge === B ? "touch: equality" : guard >= 0.5 ? "guard pass" : "no guard"}
          </text>
        </svg>

        <svg viewBox="0 0 360 150" className="w-full" role="img"
          aria-label={`One millisecond of the 4 kilohertz tone at ${edgePhaseDeg} degrees and its ${fB.toFixed(2)} kilohertz sample-equivalent candidate; ${dots.length} shared sample dots; sample mismatch ${mismatch.toExponential(1)}.`}>
          <text x="12" y="16" fill="currentColor" fontSize="12" fontWeight="700">edge pair · one shared set of samples</text>
          <line x1="24" y1="78" x2="344" y2="78" stroke="currentColor" opacity="0.4" />
          <polyline points={curve(xA)} fill="none" stroke={AMBER} strokeWidth="2" />
          <polyline points={curve(xB)} fill="none" stroke={BLUE} strokeWidth="2" strokeDasharray="6 4" />
          {dots.map((t) => <circle key={t} cx={wx(t)} cy={wy(xA(t))} r="3.2" fill="currentColor" />)}
          <text x="30" y="34" fill={AMBER} fontSize="10.5" fontWeight="700">x_A: 4.00 kHz, {edgePhaseDeg}°</text>
          <text x="30" y="140" fill={BLUE} fontSize="10.5" fontWeight="700">x_B: {fB.toFixed(2)} kHz, −{edgePhaseDeg}° {fB > B ? "· excluded by B" : "· admissible"}</text>
          <text x="344" y="140" textAnchor="end" fill="currentColor" opacity="0.7" fontSize="10">t: 0–1 ms</text>
        </svg>
      </div>
    </Panel>
  );
}
