"use client";

import { useMemo, useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

const N = 16_384, TONES = [0.18, 0.22] as const, AMBER = "#e2903a", BLUE = "#4c8dd6";
const LENGTHS = [32, 64, 128, 256, 512, 1024, 2048, 4096] as const;
const OVERLAPS = [0, 0.5, 0.75] as const;
const PRESETS = [
  { label: "Short blur", m: 32, overlap: 0.5 },
  { label: "Balanced edge", m: 2048, overlap: 0.5 },
  { label: "Long jitter", m: 4096, overlap: 0.5 },
  { label: "Overlap trap", m: 512, overlap: 0.75 },
] as const;
const EMPIRICAL: Record<string, number> = {
  "32/0.5": 0.034780, "64/0.5": 0.045648, "128/0.5": 0.060471,
  "512/0": 0.178210, "512/0.5": 0.140159, "512/0.75": 0.126204,
  "2048/0.5": 0.267121, "4096/0.5": 0.402942,
};

type Complex = { re: number; im: number };
const mul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const conj = (z: Complex): Complex => ({ re: z.re, im: -z.im });
function dirichlet(m: number, d: number): Complex {
  const den = Math.sin(Math.PI * d);
  if (Math.abs(den) < 1e-12) return { re: m, im: 0 };
  const a = Math.PI * (m - 1) * d, gain = Math.sin(Math.PI * m * d) / den;
  return { re: gain * Math.cos(a), im: -gain * Math.sin(a) };
}
function hannResponse(m: number, d: number): Complex {
  const a = dirichlet(m, d), b = dirichlet(m, d - 1 / m), c = dirichlet(m, d + 1 / m);
  return { re: 0.5 * a.re - 0.25 * (b.re + c.re), im: 0.5 * a.im - 0.25 * (b.im + c.im) };
}
function plan(m: number, overlap: number) {
  const hop = Math.round(m * (1 - overlap)), k = Math.floor((N - m) / hop) + 1, u = 3 * m / 8;
  const rhos: number[] = [];
  for (let shift = hop; shift < m; shift += hop) {
    let inner = 0;
    for (let n = 0; n + shift < m; n++) inner += (0.5 - 0.5 * Math.cos(2 * Math.PI * n / m)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * (n + shift) / m));
    rhos.push(inner / u);
  }
  const inflation = k + 2 * rhos.reduce((sum, rho, i) => sum + (k - i - 1) * rho ** 2, 0);
  return { hop, k, u, rho: rhos[0] ?? 0, keff: k ** 2 / inflation };
}
function expectedPsd(m: number, p: ReturnType<typeof plan>, f: number) {
  const w = TONES.map((tone) => hannResponse(m, f - tone));
  let phase: Complex = { re: 0, im: 0 };
  for (let frame = 0; frame < p.k; frame++) {
    const a = 2 * Math.PI * (TONES[0] - TONES[1]) * frame * p.hop;
    phase = { re: phase.re + Math.cos(a) / p.k, im: phase.im + Math.sin(a) / p.k };
  }
  const auto = 0.25 * w.reduce((sum, z) => sum + z.re ** 2 + z.im ** 2, 0);
  const cross = mul(mul(w[0], conj(w[1])), phase);
  return 1 + (auto + 0.5 * cross.re) / p.u;
}
function analyze(points: { f: number; psd: number }[]) {
  const peaks = points.filter((q, i) => i > 0 && i < points.length - 1 && q.f >= 0.16 && q.f <= 0.24 && q.psd > points[i - 1].psd && q.psd > points[i + 1].psd);
  const pair = TONES.map((tone) => peaks.reduce<typeof peaks[number] | null>((best, q) => !best || Math.abs(q.f - tone) < Math.abs(best.f - tone) ? q : best, null));
  if (!pair[0] || !pair[1] || pair[0] === pair[1]) return { resolves: false, peaks: [] as number[], valley: 0 };
  const between = points.filter((q) => q.f >= pair[0]!.f && q.f <= pair[1]!.f), valley = Math.min(...between.map((q) => q.psd));
  const depth = 10 * Math.log10(Math.min(pair[0].psd, pair[1].psd) / valley);
  const resolves = pair.every((q, i) => Math.abs(q!.f - TONES[i]) < 0.01) && depth >= 1;
  return { resolves, peaks: pair.map((q) => q!.f), valley: depth };
}

export default function WelchTradeoffLab() {
  const [m, setM] = useState<number>(2048), [overlap, setOverlap] = useState<number>(0.5);
  const p = useMemo(() => plan(m, overlap), [m, overlap]);
  const points = useMemo(() => Array.from({ length: 985 }, (_, i) => { const f = 0.14 + i / 8192; return { f, psd: expectedPsd(m, p, f) }; }), [m, p]);
  const result = useMemo(() => analyze(points), [points]), empirical = EMPIRICAL[`${m}/${overlap}`], predicted = 1 / Math.sqrt(p.keff);
  const variancePass = empirical !== undefined && empirical < 0.30, combined = variancePass && result.resolves;
  const active = PRESETS.findIndex((q) => q.m === m && q.overlap === overlap);
  const maxDb = Math.max(...points.map((q) => 10 * Math.log10(q.psd))), chart = points.filter((_, i) => i % 4 === 0);
  const sx = (f: number) => 42 + 438 * (f - 0.14) / 0.12, sy = (v: number) => 176 - 142 * Math.max(0, 10 * Math.log10(v)) / Math.max(1, maxDb);
  const path = chart.map((q, i) => `${i ? "L" : "M"}${sx(q.f).toFixed(1)},${sy(q.psd).toFixed(1)}`).join(" ");
  const setPreset = (i: number) => { setM(PRESETS[i].m); setOverlap(PRESETS[i].overlap); };
  return <Panel><div className="min-w-0">
    <p className="pb-2 text-xs font-medium uppercase tracking-wide text-faint">Frozen 96-trial study · N=16,384 · periodic Hann · two-sided PSD per cycles/sample</p>
    <PresetGroup labels={PRESETS.map((q) => q.label)} activeIndex={active < 0 ? null : active} onSelect={setPreset} />
    <Slider label="Segment length M" value={LENGTHS.indexOf(m as typeof LENGTHS[number])} min={0} max={7} step={1} onChange={(i) => setM(LENGTHS[i])} display={`${m} samples`} ariaValueText={`${m} samples`} />
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Frame overlap">
      {OVERLAPS.map((q) => <Button key={q} active={overlap === q} onClick={() => setOverlap(q)}>{q * 100}% overlap</Button>)}
      <Button onClick={() => { setM(2048); setOverlap(0.5); }}>Reset</Button>
    </div>
    <TargetList title="Two-part acceptance test" targets={[
      { label: "Separate tones 0.04 cycles/sample apart", met: result.resolves, detail: result.resolves ? `peaks ${result.peaks.map((f) => f.toFixed(6)).join(", ")} · valley ${result.valley.toFixed(2)} dB` : "MERGED · needs two peaks and a ≥1 dB valley" },
      { label: "Seeded empirical CV < 0.30", met: variancePass, detail: empirical === undefined ? `not audited for this setting · prediction ${predicted.toFixed(6)}` : `96 trials at f=0.3125 · CV ${empirical.toFixed(6)}` },
    ]} />
    <div className="w-full overflow-x-auto overscroll-x-contain">
      <svg viewBox="0 0 600 244" className="block w-full min-w-[560px]" role="img" aria-label={`Mean PSD for tones at 0.18 and 0.22 cycles per sample. ${result.resolves ? "Separated" : "Merged"}. Segment length ${m}, overlap ${overlap * 100} percent.`}>
        {[0, 10, 20, 30].map((db) => <g key={db}><line x1="42" x2="480" y1={sy(10 ** (db / 10))} y2={sy(10 ** (db / 10))} stroke="currentColor" opacity=".12"/><text x="36" y={sy(10 ** (db / 10)) + 4} textAnchor="end" fill="currentColor" fontSize="13">{db}</text></g>)}
        <path d={path} fill="none" stroke={BLUE} strokeWidth="2"/>
        {TONES.map((f) => <g key={f}><line x1={sx(f)} x2={sx(f)} y1="24" y2="178" stroke={AMBER} strokeWidth="1.5" strokeDasharray="5 4"/><text x={sx(f)} y="198" textAnchor="middle" fill={AMBER} fontSize="13" fontWeight="700">{f.toFixed(2)}</text></g>)}
        <text x="42" y="15" fill={BLUE} fontSize="13" fontWeight="700">exact frame-mean PSD + unit noise floor</text><text x="42" y="218" fill="currentColor" fontSize="13">frequency (cycles/sample)</text><text x="480" y="15" textAnchor="end" fill="currentColor" fontSize="13">10 log₁₀(S/1) dB</text>
        <text x="500" y="48" fill="currentColor" fontSize="13"><tspan x="500" fontWeight="700">{result.resolves ? "SEPARATED" : "MERGED"}</tspan><tspan x="500" dy="18">ENBW</tspan><tspan x="500" dy="14">{(1.5 / m).toFixed(6)}</tspan><tspan x="500" dy="18">null-to-null</tspan><tspan x="500" dy="14">{(4 / m).toFixed(6)}</tspan><tspan x="500" dy="18">cycles/sample</tspan></text>
      </svg>
    </div>
    <Readout><strong>{combined ? "PASS" : "FAIL"}</strong> · M={m} · hop H={p.hop} · nominal frames K={p.k} · adjacent ρ₁={p.rho.toFixed(6)} · effective averages K<sub>eff</sub>={p.keff.toFixed(6)} · predicted CV={predicted.toFixed(6)}{empirical === undefined ? " · no frozen empirical verdict" : ` · seeded empirical CV=${empirical.toFixed(6)}`}.</Readout>
    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
      <div className="rounded border border-line p-2"><span className="block text-faint">Frame evidence</span><strong className="font-mono">K {p.k} → K<sub>eff</sub> {p.keff.toFixed(3)}</strong><div className="mt-2 h-2 rounded bg-line"><div className="h-2 rounded bg-accent" style={{ width: `${100 * p.keff / p.k}%` }} /></div></div>
      <div className="rounded border border-line p-2 text-faint">U=Σ|w[n]|²={p.u.toFixed(3)} calibrates noise power. CV uses the noise-only bin f=0.3125. Overlap adds correlated frames; K is not an independent-average count.</div>
    </div>
    <p className="pt-2 text-xs text-faint">Signal: 0.5e<sup>j2π0.18n</sup>+0.5e<sup>j2π0.22n</sup>+v[n], v[n]~CN(0,1). The 1 dB valley rule is this demo&apos;s declared criterion, not a universal resolution theorem. Rounded labels never decide PASS/FAIL.</p>
  </div></Panel>;
}
