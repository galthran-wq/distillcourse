"use client";

import { useState } from "react";
import { Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

const AMBER = "#e2903a", BLUE = "#4c8dd6", TARGET = 0.18;
const PRESETS = [
  { label: "Untuned start", f: 0.15, r: 0.98 },
  { label: "On pitch, slow", f: 0.18, r: 0.98 },
  { label: "Meets all", f: 0.18, r: 0.97 },
  { label: "100-sample trap", f: 0.18, r: 1.002 },
] as const;
const VIEWS = [{ label: "First 100", n: 100 }, { label: "Extend to 1000", n: 1000 }] as const;
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
const peak = (v: number[]) => Math.max(...v.map(Math.abs));
const settling = (r: number) => r < 1 ? Math.ceil(Math.log(0.01) / Math.log(r)) : Infinity;

function impulse(f: number, r: number): number[] {
  const a1 = 2 * r * Math.cos(2 * Math.PI * f), a2 = -r * r;
  let previous = 0, older = 0;
  return Array.from({ length: 1000 }, (_, n) => {
    const current = (n === 0 ? 1 : 0) + a1 * previous + a2 * older;
    older = previous; previous = current; return current;
  });
}

export default function FeedbackStabilityLab() {
  const [f, setF] = useState(0.15), [r, setR] = useState(0.98), [N, setN] = useState<100 | 1000>(100);
  const omega = 2 * Math.PI * f, a1 = 2 * r * Math.cos(omega), a2 = -r * r;
  const full = impulse(f, r), shown = full.slice(0, N), max100 = peak(full.slice(0, 100)), maxShown = peak(shown);
  const ratio = max100 > 0 ? maxShown / max100 : NaN, n1 = settling(r), error = Math.abs(f - TARGET) / TARGET;
  const finite = [a1, a2, max100, maxShown, ...shown].every(Number.isFinite);
  const gates = [error < 0.01, r <= 0.98 + 1e-12, n1 < 200], passed = finite && gates.every(Boolean);
  const poleClass = r < 1 ? "inside" : r === 1 ? "on" : "outside";
  const falsified = finite && N === 1000 && r >= 1 && ratio > 2;
  const active = PRESETS.findIndex((p) => close(p.f, f) && close(p.r, r));
  const scale = Math.max(1e-9, 1.1 * maxShown), x = (n: number) => 38 + 430 * n / (N - 1);
  const y = (v: number) => 255 - 68 * v / scale;
  const points = shown.map((v, n) => Number.isFinite(y(v)) ? `${x(n)},${y(v)}` : "").filter(Boolean).join(" ");
  const envelope = shown.map((_, n) => Math.pow(r, n) / Math.abs(Math.sin(omega)));
  const upper = envelope.map((v, n) => `${x(n)},${y(v)}`).join(" ");
  const lower = envelope.map((v, n) => `${x(n)},${y(-v)}`).join(" ");
  const poleX = 92 + 48 * r * Math.cos(omega), poleY = 79 - 48 * r * Math.sin(omega);
  const mx = (n: number) => 36 + 234 * n / (N - 1), my = (v: number) => 330 - 95 * v / scale;
  const mobilePoints = shown.map((v, n) => `${mx(n)},${my(v)}`).join(" ");
  const mobileUpper = envelope.map((v, n) => `${mx(n)},${my(v)}`).join(" "), mobileLower = envelope.map((v, n) => `${mx(n)},${my(-v)}`).join(" ");
  const mobilePoleX = 72 + 45 * r * Math.cos(omega), mobilePoleY = 88 - 45 * r * Math.sin(omega);
  const choosePreset = (i: number) => { setF(PRESETS[i].f); setR(PRESETS[i].r); if (i === 3) setN(100); };
  const settlingText = Number.isFinite(n1) ? `${n1} samples` : "never";
  const chartLabel = `Impulse response at f zero ${f.toFixed(3)} cycles per sample, radius ${r.toFixed(3)}, poles ${poleClass} the unit circle, ${N} samples shown, first-100 maximum ${max100.toFixed(3)}, shown maximum ${maxShown.toFixed(3)}, claim ${falsified ? "falsified" : "not falsified"}.`;

  return (
    <Panel>
      <div role="group" aria-label="Resonator presets">
        <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">Resonator presets</p>
        <PresetGroup labels={PRESETS.map((p) => p.label)} activeIndex={active < 0 ? null : active} onSelect={choosePreset} />
      </div>
      <p className="pb-2 font-mono text-xs text-faint">fₛ=1000 samples/s · x[n]=δ[n] · initial state y[-1]=y[-2]=0</p>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Slider label="resonant frequency f₀" value={f} min={0.05} max={0.45} step={0.001} onChange={setF}
          display={`${f.toFixed(3)} cycles/sample`} ariaLabel="Resonant frequency f zero"
          ariaValueText={`${f.toFixed(3)} cycles per sample, omega zero is ${(2 * f).toFixed(3)} pi radians per sample`} />
        <Slider label="pole radius r" value={r} min={0.9} max={1.02} step={0.001} onChange={setR}
          display={r.toFixed(3)} ariaLabel="Pole radius r" ariaValueText={`pole radius ${r.toFixed(3)}`} />
      </div>
      <TargetList title="Tuning targets" targets={[
        { label: "Frequency error below 1%", detail: `target 0.180 (180 Hz); current ${f.toFixed(3)} cycles/sample · error ${(100 * error).toFixed(3)}%`, met: gates[0] },
        { label: "Radius at most 0.980", detail: `r=${r.toFixed(3)} (${poleClass} unit circle)`, met: gates[1] },
        { label: "1% settling strictly below 200", detail: `${settlingText}; grid maximum that passes is 0.977`, met: gates[2] },
      ]} />
      <div role="group" aria-label="Trace length">
        <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">Trace length · one uninterrupted computation</p>
        <PresetGroup labels={VIEWS.map((v) => v.label)} activeIndex={N === 100 ? 0 : 1} onSelect={(i) => setN(VIEWS[i].n)} />
      </div>
      <Readout>
        <strong className={passed ? "text-accent" : ""}>{passed ? "PASS" : "Not yet"}</strong> ·
        <span className="font-mono"> y[n]=x[n]+a₁y[n−1]+a₂y[n−2]; a₁={a1.toFixed(7)}, a₂={a2.toFixed(7)}</span> · BIBO <strong>{r < 1 ? "stable" : "unstable"}</strong>
        <span className="block text-faint">max |h| first 100 = {max100.toFixed(3)} · shown {N} = {maxShown.toFixed(3)} · ratio {Number.isFinite(ratio) ? ratio.toFixed(2) : "—"}×</span>
        <span className={`block font-medium ${falsified ? "text-accent" : ""}`}>
          {falsified ? "FALSIFIED: extension grows beyond 2×; outside-unit-circle poles reject the claim." : N === 100 ? "Bounded over 100 displayed samples—not proof of stability." : "Claim not yet falsified: choose the outside-unit-circle trap."}
        </span>
      </Readout>

      <svg viewBox="0 0 480 340" className="mt-2 hidden w-full select-none sm:block" role="img" aria-label={chartLabel}>
        <text x="14" y="17" fontSize="12" fontWeight="bold" fill="currentColor">pole plane</text>
        <line x1="25" y1="79" x2="159" y2="79" stroke="currentColor" opacity=".45" /><line x1="92" y1="12" x2="92" y2="146" stroke="currentColor" opacity=".45" />
        <circle cx="92" cy="79" r="48" fill="none" stroke="currentColor" strokeDasharray="4 4" opacity=".55" />
        <text x="148" y="74" fontSize="9" fill="currentColor" opacity=".65">Re</text><text x="97" y="20" fontSize="9" fill="currentColor" opacity=".65">Im</text><text x="28" y="31" fontSize="9" fill="currentColor" opacity=".65">unit circle</text>
        <line x1="92" y1="79" x2={poleX} y2={poleY} stroke={AMBER} strokeWidth="2" />
        {[poleY, 158 - poleY].map((py, i) => <circle key={i} cx={poleX} cy={py} r="5" fill={AMBER} />)}
        <text x="164" y="48" fontSize="11" fill="currentColor">r={r.toFixed(3)} · {poleClass}</text>
        <text x="164" y="67" fontSize="11" fill="currentColor">f₀={f.toFixed(3)} cycles/sample</text>
        <text x="164" y="86" fontSize="11" fill="currentColor">ω₀={(2 * f).toFixed(3)}π rad/sample</text>
        <text x="164" y="105" fontSize="11" fill="currentColor">settling: {settlingText}</text>
        <text x="14" y="166" fontSize="12" fontWeight="bold" fill="currentColor">impulse response h[n]</text>
        {N === 1000 && <><rect x="38" y="180" width={x(99) - 38} height="150" fill="currentColor" opacity=".07" /><line x1={x(99)} y1="180" x2={x(99)} y2="330" stroke="currentColor" strokeDasharray="3 3" opacity=".65" /><text x="40" y="204" fontSize="8" fill="currentColor">first 100</text><text x={x(99) + 4} y="192" fontSize="9" fill="currentColor">n=99 boundary</text></>}
        <line x1="38" y1="255" x2="468" y2="255" stroke="currentColor" opacity=".45" /><line x1="38" y1="180" x2="38" y2="330" stroke="currentColor" opacity=".45" />
        <polyline points={upper} fill="none" stroke={AMBER} strokeDasharray="5 4" opacity=".8" /><polyline points={lower} fill="none" stroke={AMBER} strokeDasharray="5 4" opacity=".8" />
        <polyline points={points} fill="none" stroke={BLUE} strokeWidth="1.7" vectorEffect="non-scaling-stroke" />
        <text x="43" y="177" fontSize="9" fill="currentColor">+{scale.toPrecision(3)}</text><text x="43" y="327" fontSize="9" fill="currentColor">−{scale.toPrecision(3)}</text>
        <text x="38" y="338" fontSize="9" fill="currentColor">0</text><text x="468" y="338" textAnchor="end" fontSize="9" fill="currentColor">n={N - 1}</text>
        <line x1="300" y1="157" x2="318" y2="157" stroke={BLUE} strokeWidth="2" /><text x="322" y="161" fontSize="9" fill="currentColor">response</text>
        <line x1="384" y1="157" x2="402" y2="157" stroke={AMBER} strokeDasharray="4 3" /><text x="406" y="161" fontSize="9" fill="currentColor">± envelope</text>
      </svg>
      <svg viewBox="0 0 280 470" className="mt-2 block w-full select-none sm:hidden" role="img" aria-label={chartLabel}>
        <text x="8" y="16" fontSize="13" fontWeight="bold" fill="currentColor">pole plane</text>
        <line x1="16" y1="88" x2="128" y2="88" stroke="currentColor" opacity=".5" /><line x1="72" y1="32" x2="72" y2="144" stroke="currentColor" opacity=".5" />
        <circle cx="72" cy="88" r="45" fill="none" stroke="currentColor" strokeDasharray="5 4" opacity=".6" />
        <text x="112" y="82" fontSize="12" fill="currentColor">Re</text><text x="77" y="41" fontSize="12" fill="currentColor">Im</text><text x="10" y="31" fontSize="12" fill="currentColor">unit circle</text>
        <line x1="72" y1="88" x2={mobilePoleX} y2={mobilePoleY} stroke={AMBER} strokeWidth="2.4" />
        {[mobilePoleY, 176 - mobilePoleY].map((py, i) => <circle key={i} cx={mobilePoleX} cy={py} r="5.5" fill={AMBER} />)}
        <text x="140" y="52" fontSize="12" fill="currentColor">r={r.toFixed(3)} · {poleClass}</text>
        <text x="140" y="73" fontSize="12" fill="currentColor">f₀={f.toFixed(3)} cyc/sample</text>
        <text x="140" y="94" fontSize="12" fill="currentColor">ω₀={(2 * f).toFixed(3)}π rad/sample</text>
        <text x="140" y="115" fontSize="12" fill="currentColor">settling: {settlingText}</text>
        <line x1="18" y1="166" x2="40" y2="166" stroke={BLUE} strokeWidth="2.5" /><text x="46" y="170" fontSize="12" fill="currentColor">solid response</text>
        <line x1="140" y1="166" x2="160" y2="166" stroke={AMBER} strokeWidth="2" strokeDasharray="5 4" /><text x="166" y="170" fontSize="12" fill="currentColor">dashed envelope</text>
        <text x="8" y="200" fontSize="13" fontWeight="bold" fill="currentColor">impulse response h[n]</text>
        {N === 1000 && <><rect x="36" y="218" width={mx(99) - 36} height="218" fill="currentColor" opacity=".08" /><line x1={mx(99)} y1="218" x2={mx(99)} y2="436" stroke="currentColor" strokeDasharray="4 3" opacity=".7" /><text x="39" y="236" fontSize="12" fill="currentColor">first 100</text><text x={mx(99) + 5} y="251" fontSize="12" fill="currentColor">n=99 boundary</text></>}
        <line x1="36" y1="330" x2="270" y2="330" stroke="currentColor" opacity=".5" /><line x1="36" y1="218" x2="36" y2="436" stroke="currentColor" opacity=".5" />
        <polyline points={mobileUpper} fill="none" stroke={AMBER} strokeDasharray="6 5" strokeWidth="1.7" /><polyline points={mobileLower} fill="none" stroke={AMBER} strokeDasharray="6 5" strokeWidth="1.7" />
        <polyline points={mobilePoints} fill="none" stroke={BLUE} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <text x="3" y="224" fontSize="12" fill="currentColor">+{scale.toPrecision(3)}</text><text x="3" y="435" fontSize="12" fill="currentColor">−{scale.toPrecision(3)}</text>
        <text x="36" y="458" fontSize="12" fill="currentColor">n=0</text><text x="270" y="458" textAnchor="end" fontSize="12" fill="currentColor">n={N - 1}</text>
      </svg>
    </Panel>
  );
}
