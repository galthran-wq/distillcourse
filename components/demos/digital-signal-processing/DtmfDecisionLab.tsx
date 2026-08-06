"use client";

import { useState } from "react";
import { Button, Panel, PresetGroup, Readout, Slider, TargetList } from "@/components/ui";

type Trial = { label: string; id: string; candidate: string; study: string; expected: string | null; pair: boolean; hz?: [number, number]; amp?: [number, number]; runner?: [number, number]; dom?: [number, number]; detune?: [number, number]; twist?: number; duration: number; pause: number; latency?: number; reason: string };
export const PRESETS = ["Two lows", "Detuned pair", "Low twist", "Timing audit"] as const;
export const TIMING = ["Hard 50 ms", "Short 22 ms", "Gray 26 ms", "Pause 38 ms"] as const;
export const LABELS = [..."123A456B789C*0#D", "REJECT"];
export const TRIALS: Trial[] = [
  { label: "Two lows", id: "negative-two_low-013", candidate: "B", study: "B", expected: "REJECT", pair: false, hz: [770, 1633], amp: [.2398210402, .3439802783], runner: [.1665680147, .0251591889], dom: [3.16591346, 22.71673815], detune: [-.75, .25], twist: 3.20141784, duration: 80, pause: 60, latency: 45, reason: "frozen false accept · one of three" },
  { label: "Detuned pair", id: "negative-detuned-000", candidate: "4", study: "REJECT", expected: "REJECT", pair: true, hz: [770, 1209], amp: [.1661679020, .1078253313], dom: [14.12002955, 12.97291641], detune: [-3.5, 4], twist: -1.61705555, duration: 60, pause: 50, latency: 45, reason: "detuning" },
  { label: "Low twist", id: "negative-twist_low-000", candidate: "5", study: "REJECT", expected: "REJECT", pair: true, hz: [770, 1336], amp: [.2658238795, .0442255753], dom: [14.41440351, 7.12653900], detune: [0, -.25], twist: -15.55542333, duration: 60, pause: 60, latency: 45, reason: "twist" },
];
export const TIMING_TRIALS: Trial[] = [
  { label: "Hard 50 ms", id: "hard-7-031", candidate: "7", study: "7", expected: "7", pair: true, hz: [852, 1209], dom: [13.78019722, 13.18269220], detune: [-.75, .5], twist: -6.93913240, duration: 40, pause: 50, latency: 50, reason: "accept · 10 dB · channel" },
  { label: "Short 22 ms", id: "negative-short_duration_le_23ms-000", candidate: "REJECT", study: "REJECT", expected: "REJECT", pair: true, duration: 22, pause: 40, reason: "duration_or_pause · mandatory non-operation" },
  { label: "Gray 26 ms", id: "gray-000", candidate: "REJECT", study: "REJECT", expected: null, pair: true, duration: 26, pause: 50, reason: "duration_or_pause · local output only" },
  { label: "Pause 38 ms", id: "negative-insufficient_pause_lt_40ms-013", candidate: "2", study: "2", expected: "REJECT", pair: true, hz: [697, 1336], dom: [16.94684487, 16.27329883], detune: [-.25, 0], twist: -4.38323861, duration: 50, pause: 38, latency: 42, reason: "frozen false accept · one of three" },
];
const GATES = ["one low + one high", "|detune| ≤2%", "twist −10…+5 dB", "duration ≥40 ms", "pause ≥40 ms"];
export function evaluate(t: Trial, enabled: boolean[]) {
  const pass = [t.pair, !t.detune || t.detune.every((x) => Math.abs(x) <= 2), t.twist === undefined || (t.twist >= -10 && t.twist <= 5), t.duration >= 40, t.pause >= 40];
  const fail = pass.findIndex((ok, i) => enabled[i] && !ok);
  return { pass, fail, output: fail < 0 ? t.candidate : "REJECT" };
}
const n = (x: number) => Number.isInteger(x) ? `${x}` : x.toFixed(2);

export default function DtmfDecisionLab() {
  const [preset, setPreset] = useState(0), [timing, setTiming] = useState(0), [gates, setGates] = useState([false, false, false, false, false]);
  const t = preset === 3 ? TIMING_TRIALS[timing] : TRIALS[preset], result = evaluate(t, gates);
  const pristine = gates.every((x) => !x) && (preset !== 3 || timing === 0);
  const choose = (i: number) => { setPreset(i); setTiming(0); setGates([false, false, false, false, false]); };
  const reset = () => { setTiming(0); setGates([false, false, false, false, false]); };
  const taskMet = preset === 0 ? gates[0] && result.output === "REJECT" : preset === 1 ? gates[1] && result.output === "REJECT" : preset === 2 ? gates[2] && result.output === "REJECT" : timing === 0 ? t.latency === 50 : timing === 1 ? t.study === "REJECT" : timing === 2 ? t.expected === null : gates[4] && result.output === "REJECT";
  const task = preset === 0 ? "Enable exactly-one-per-group; reject forced B" : preset === 1 ? "Enable detuning; reject −3.5% / +4.0%" : preset === 2 ? "Enable twist; reject −15.56 dB" : `Audit ${t.label}${timing === 3 ? "; enable pause" : ""}`;
  const durationX = 18 + 282 * Math.min(t.duration, 60) / 60, latencyX = 18 + 282 * Math.min(t.latency ?? 0, 60) / 60;
  const measured = [t.pair ? "low 1 / high 1" : "low 2 / high 1", t.detune ? `${t.detune.map(n).join("% / ")}%` : "not evaluated", t.twist === undefined ? "not evaluated" : `${t.twist.toFixed(2)} dB`, `${t.duration} ms active`, `${t.pause} ms prior quiet`];

  return <Panel><div className="[&_button]:min-h-11 [&_button]:text-ink">
    <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">Frozen deterministic contract cards · no audio capture · not standards conformance</p>
    <PresetGroup labels={[...PRESETS]} activeIndex={pristine ? preset : null} onSelect={choose} />
    {preset === 3 && <Slider label="Timing case" value={timing} min={0} max={3} step={1} onChange={setTiming} display={TIMING[timing]} ariaLabel="Timing audit case" ariaValueText={TIMING[timing]} />}
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Teaching-contract gates">
      {GATES.map((g, i) => <Button key={g} active={gates[i]} onClick={() => setGates((old) => old.map((v, j) => j === i ? !v : v))}>{g}</Button>)}
      <Button onClick={reset}>Reset gates</Button>
    </div>
    <p className="mb-3 rounded border border-line p-2 font-mono text-xs text-faint">immutable local thresholds · block 0.028 · group energy 0.035 · dominance ≥3 dB · twist [−10,+5] dB · |detune| ≤2%</p>
    <div className="mb-3 rounded border border-line p-2" aria-label="Five teaching-contract gate rows">
      {GATES.map((g, i) => <div key={g} className="grid grid-cols-[2.4rem_1fr_auto] gap-2 border-b border-line py-1 text-xs last:border-0">
        <strong className={gates[i] ? "text-accent" : "text-faint"}>{gates[i] ? "ON" : "OFF"}</strong><span><strong>{g}</strong><span className="block font-mono text-faint">{measured[i]}</span></span><strong>{result.pass[i] ? "PASS" : "FAIL"}</strong>
      </div>)}
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <section className="rounded border border-[#e2903a] p-3" aria-label="Spectral feature evidence">
        <h3 className="text-sm font-semibold text-[#e2903a]">Spectral feature · N=160 =20 ms</h3>
        <p className="text-xs text-faint">exact nominal C(f), rectangular · eight coordinates</p>
        {t.hz ? <div className="mt-2 space-y-1 text-sm">
          <p>winners <strong>{t.hz.join(" / ")} Hz</strong>{t.amp && ` · A ${t.amp.map((x) => x.toFixed(6)).join(" / ")}`}</p>
          {t.runner && <p className="text-xs text-faint">runners A {t.runner.map((x) => x.toFixed(6)).join(" / ")}</p>}
          {t.dom && <p>dominance <strong>{t.dom.map((x) => x.toFixed(2)).join(" / ")} dB</strong></p>}
          {t.detune && <p>detune <strong>{t.detune.map(n).join("% / ")}%</strong></p>}
          {t.twist !== undefined && <p>twist <strong>{t.twist.toFixed(2)} dB</strong></p>}
        </div> : <p className="mt-3 rounded border border-dashed border-line p-2 text-sm">No qualified 40 ms feature decision; do not invent winners.</p>}
      </section>
      <section className="rounded border border-[#4c8dd6] p-3" aria-label="Temporal qualification">
        <h3 className="text-sm font-semibold text-[#4c8dd6]">Temporal qualification · 5 ms blocks</h3>
        <p className="text-xs text-faint">received-signal onset; separate from spectral record</p>
        <svg viewBox="0 0 320 112" className="mt-1 w-full" role="img" aria-label={`${t.duration} millisecond duration, ${t.pause} millisecond pause${t.latency ? `, ${t.latency} millisecond decision latency` : ""}.`}>
          <rect x="126" y="25" width="80" height="18" fill="currentColor" opacity="0.08"/><text x="70" y="38" textAnchor="middle" fill="currentColor" fontSize="9.5">≤23 reject</text><text x="166" y="38" textAnchor="middle" fill="currentColor" fontSize="9.5">gray 24–39</text><text x="254" y="38" textAnchor="middle" fill="currentColor" fontSize="9.5">≥40 operate</text>
          <line x1="18" y1="55" x2="300" y2="55" stroke="currentColor" opacity=".35"/><line x1="18" y1="55" x2={durationX} y2="55" stroke="#4c8dd6" strokeWidth="7"/><circle cx={durationX} cy="55" r="5" fill="#4c8dd6"/>
          <line x1="206" y1="18" x2="206" y2="98" stroke="currentColor" strokeDasharray="4 3"/><text x="206" y="14" textAnchor="middle" fill="currentColor" fontSize="10">40 ms target</text>
          {t.latency && <><line x1={latencyX} y1="61" x2={latencyX} y2="96" stroke="currentColor" strokeWidth="2"/><text x={latencyX} y="108" textAnchor="middle" fill="currentColor" fontSize="10">decision {t.latency} ms</text></>}
          <text x="18" y="77" fill="currentColor" fontSize="11">active {t.duration} ms</text><text x="300" y="77" textAnchor="end" fill="currentColor" fontSize="11">prior pause {t.pause} ms</text>
        </svg>
        <p className="text-sm">duration <strong>{t.duration} ms</strong> · pause <strong>{t.pause} ms</strong>{t.latency && <> · latency <strong>{t.latency} ms {t.latency <= 40 ? "PASS" : "FAIL ≤40"}</strong></>}</p>
      </section>
    </div>

    <div className="my-3 grid gap-2 sm:grid-cols-2">
      <div className="rounded border border-line p-2"><p className="text-xs uppercase tracking-wide text-faint">Frozen study output · immutable</p><p className="text-lg font-semibold">{t.study}</p><p className="text-xs text-faint">{t.id} · {t.reason}</p></div>
      <div className="rounded border border-accent p-2"><p className="text-xs uppercase tracking-wide text-faint">Teaching-contract output</p><p className="text-lg font-semibold">{result.output}</p><p className="text-xs text-faint">{result.fail < 0 ? "enabled checks pass" : `first fail: ${GATES[result.fail]}`}</p></div>
    </div>
    <Readout><strong>{t.expected === null ? "UNSCORED / NO LABEL" : `Declared label ${t.expected}`}</strong> · frozen {t.study} · teaching {result.output}<span className="block text-faint">Gate toggles audit this card only; they never alter the frozen study.</span></Readout>
    <TargetList title="Current guided task" targets={[{ label: task, met: taskMet, detail: `${t.label} · study ${t.study} · teaching ${result.output}` }]} />

    <div className="grid gap-2 text-xs sm:grid-cols-4" aria-label="Persistent held-out synthetic study results">
      <div className="rounded border border-line p-2"><strong>PASS · clean</strong><span className="block font-mono">512/512 · 100%</span></div>
      <div className="rounded border border-line p-2"><strong>PASS · 10 dB ±1.5%</strong><span className="block font-mono">1023/1024 · 99.902%</span></div>
      <div className="rounded border border-dashed border-current p-2"><strong>FAIL · negatives</strong><span className="block font-mono">637/640 · 99.531%</span></div>
      <div className="rounded border border-dashed border-current p-2"><strong>FAIL · hard latency</strong><span className="block font-mono">median 45 · max 50 ms ≤40</span></div>
    </div>
  </div></Panel>;
}
