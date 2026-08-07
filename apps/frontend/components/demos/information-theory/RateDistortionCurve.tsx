"use client";

/**
 * RateDistortionCurve — propose a lossy scheme and let the converse judge it.
 * The reader places their own (D, R) point on the rate-distortion plane: the
 * achievable region above R(D) is shaded, the reference schemes are drawn
 * (store-half-and-guess for fair bits; the entropy-coded scalar quantizer at
 * R(D) + 0.254 bit for the Gaussian), and every proposal below the frontier is
 * rejected with its deficit in bits. Guided task (lesson): try to beat the
 * curve, fail, then find how close a buildable scheme is allowed to get.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button, TargetList } from "@/components/ui";

type Mode = "bernoulli" | "gaussian";
/** p = Bernoulli bias, s2 = Gaussian variance; bd/br and gd/gr = the reader's
 *  proposed (distortion, rate) pair, kept per mode; hit = latched targets. */
type S = { mode: Mode; p: number; bd: number; br: number; s2: number; gd: number; gr: number; hit: boolean[] };

const AMBER = "#e2903a"; // the frontier R(D) — the subject
const BLUE = "#4c8dd6"; // schemes: the reader's accepted point, the naive scheme
const WARN = "#c0392b"; // a proposal the converse rejects
const ECSQ = 0.254; // bits/sample an entropy-coded uniform scalar quantizer wastes
/** Accept anything within a millibit of the frontier: the slider grid is coarser
 *  than the curve, and the lesson's own headline point (fair source, D = 0.11,
 *  R = 0.50) needs R(D) = 0.500084 — it must read as achievable, not rejected. */
const TOL = 1e-3;

const PRESETS: { label: string; s: Omit<S, "hit"> }[] = [
  { label: "Fair source", s: { mode: "bernoulli", p: 0.5, bd: 0.25, br: 0.5, s2: 1, gd: 0.25, gr: 1.25 } },
  { label: "Biased source", s: { mode: "bernoulli", p: 0.25, bd: 0.1, br: 0.34, s2: 1, gd: 0.25, gr: 1.25 } },
  { label: "Near-lossless", s: { mode: "gaussian", p: 0.5, bd: 0.25, br: 0.5, s2: 1, gd: 0.0625, gr: 1.9 } },
  { label: "Coarse", s: { mode: "gaussian", p: 0.5, bd: 0.25, br: 0.5, s2: 1, gd: 0.25, gr: 1.25 } },
];

// plot geometry (user units)
const VW = 480, VH = 300, PX = 52, PW = 396, PY = 18, PH = 220;
const BOTTOM = PY + PH;

function h2(v: number): number {
  const t = (x: number) => (x > 1e-12 ? -x * Math.log2(x) : 0);
  return t(v) + t(1 - v);
}

/** The frontier, its inverse, and the verdict — all read off one state. */
function measure(s: S) {
  const bern = s.mode === "bernoulli";
  const D = bern ? s.bd : s.gd;
  const R = bern ? s.br : s.gr;
  const rAt = (d: number) =>
    bern ? Math.max(0, h2(s.p) - h2(Math.min(d, s.p))) : d >= s.s2 ? 0 : 0.5 * Math.log2(s.s2 / d);
  // least distortion the frontier allows at rate r: bisection on the binary
  // curve (H(D) is increasing on [0, p]), closed form on the Gaussian one
  const dAt = (r: number) => {
    if (!bern) return r <= 0 ? s.s2 : Math.min(s.s2, s.s2 * Math.pow(2, -2 * r));
    if (r <= 0) return s.p;
    if (r >= h2(s.p)) return 0;
    let lo = 0, hi = s.p;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (h2(s.p) - h2(mid) > r) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const need = rAt(D);
  const slack = R - need; // bits per symbol above the frontier; negative = impossible
  const met = [slack < -TOL, Math.abs(slack) <= 0.01, slack >= -TOL && slack < ECSQ];
  return { bern, D, R, rAt, need, slack, dMin: dAt(R), met };
}

export default function RateDistortionCurve() {
  // D3: opens on the fair source with the naive store-half-and-guess scheme as
  // the reader's proposal — accepted, and visibly 0.31 bit above the frontier.
  const [s, setS] = useState<S>({ ...PRESETS[0].s, hit: [false, false, false] });
  const set = (patch: Partial<S>) =>
    setS((prev) => {
      const next = { ...prev, ...patch };
      return { ...next, hit: prev.hit.map((h, i) => h || measure(next).met[i]) };
    });

  const { bern, D, R, rAt, need, slack, dMin, met } = measure(s);
  const rejected = slack < -TOL;
  const over = Math.max(0, slack); // what an accepted scheme overspends, never "-0.000"
  const xMax = bern ? 0.5 : 2.1;
  const yMax = bern ? 1 : 4;
  const unit = bern ? "bits/symbol" : "bits/sample";
  const xOf = (d: number) => PX + (d / xMax) * PW;
  const yOf = (bits: number) => BOTTOM - (Math.max(0, Math.min(yMax, bits)) / yMax) * PH;
  const fmtD = (v: number) => (bern ? v.toFixed(3) : v.toFixed(4));

  const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
  const activePreset = PRESETS.findIndex((q) =>
    (Object.keys(q.s) as (keyof Omit<S, "hit">)[]).every((k) =>
      k === "mode" ? q.s[k] === s[k] : near(q.s[k] as number, s[k] as number),
    ),
  );

  const N = 160;
  const dOf = (i: number) => ((i + (bern ? 0 : 0.4)) / N) * xMax;
  const curve = Array.from({ length: N + 1 }, (_, i) => [xOf(dOf(i)), yOf(rAt(dOf(i)))] as const);
  const path = curve.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const region = `${path} ${PX + PW},${PY} ${curve[0][0].toFixed(1)},${PY}`;
  const ecsq = curve
    .map(([x], i) => `${x.toFixed(1)},${yOf(rAt(dOf(i)) + ECSQ).toFixed(1)}`)
    .join(" ");
  const dLabel = 0.45 * (bern ? s.p : s.s2); // where the R(D) label sits on the curve
  const xTicks = bern ? [0, 0.1, 0.2, 0.3, 0.4, 0.5] : [0, 0.5, 1, 1.5, 2];
  const yTicks = bern ? [0, 0.25, 0.5, 0.75, 1] : [0, 1, 2, 3, 4];

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((q) => q.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => set(PRESETS[i].s)}
      />

      <div className="flex flex-wrap gap-2 pb-3">
        <Button active={bern} onClick={() => set({ mode: "bernoulli" })}>Bernoulli, Hamming</Button>
        <Button active={!bern} onClick={() => set({ mode: "gaussian" })}>Gaussian, squared error</Button>
      </div>

      <TargetList
        targets={(
          [
            ["1. Beat the frontier: place a scheme the converse rejects", `your R − R(D) = ${slack >= 0 ? "+" : ""}${slack.toFixed(3)} ${unit}`],
            ["2. Land on the frontier: within 0.01 bit of R(D)", `R(D) = ${need.toFixed(3)} at D = ${fmtD(D)}`],
            ["3. Land in the sliver: accepted, under 0.254 bit above R(D)", "0.254 bit is all an entropy-coded scalar quantizer wastes"],
          ] as const
        ).map(([label, detail], i) => ({ label, detail, met: met[i], latched: s.hit[i] }))}
      />

      {bern ? (
        <Slider label="source bias p = P(X = 1)" value={s.p} min={0.05} max={0.5} step={0.01}
          onChange={(v) => set({ p: v })} display={s.p.toFixed(2)} ariaLabel="Bernoulli source bias p" />
      ) : (
        <Slider label="source variance σ²" value={s.s2} min={0.25} max={2} step={0.05}
          onChange={(v) => set({ s2: v })} display={s.s2.toFixed(2)} ariaLabel="Gaussian source variance sigma squared" />
      )}
      <Slider label="your scheme: distortion D" value={D} min={bern ? 0 : 0.0125} max={bern ? 0.5 : 2}
        step={bern ? 0.01 : 0.0125} onChange={(v) => set(bern ? { bd: v } : { gd: v })}
        display={bern ? D.toFixed(2) : D.toFixed(4)} ariaLabel="Distortion of your proposed scheme" />
      <Slider label="your scheme: rate R" value={R} min={0} max={bern ? 1 : 4} step={bern ? 0.01 : 0.05}
        onChange={(v) => set(bern ? { br: v } : { gr: v })} display={`${R.toFixed(2)} ${unit}`}
        ariaLabel="Rate of your proposed scheme" />

      <Readout>
        {rejected ? (
          <>
            <strong>Rejected.</strong> R(D) = {need.toFixed(3)} {unit} at D = {fmtD(D)}, and you
            offered {R.toFixed(2)} — short by {(-slack).toFixed(3)}. At rate {R.toFixed(2)} no code
            of any block length gets below D = {fmtD(dMin)}.
          </>
        ) : (
          <>
            <strong>Achievable</strong> at long block length, and you overspend{" "}
            {over.toFixed(3)} {unit} against R(D) = {need.toFixed(3)}. The same rate buys
            D = {fmtD(dMin)} on the frontier.
          </>
        )}
      </Readout>

      <svg viewBox={`0 0 ${VW} ${VH}`} className="mt-2 w-full select-none" role="img"
        aria-label={`Rate-distortion plane for a ${bern ? `Bernoulli source of bias ${s.p.toFixed(2)} under Hamming distortion` : `Gaussian source of variance ${s.s2.toFixed(2)} under squared error`}. Your scheme at distortion ${fmtD(D)} and rate ${R.toFixed(2)} is ${rejected ? "below the frontier: impossible" : "on or above the frontier: achievable"}; the frontier charges ${need.toFixed(3)} bits at that distortion.`}
      >
        {/* the achievable region: on or above the frontier */}
        <polygon points={region} fill={AMBER} opacity="0.12" />
        <text x={PX + PW - 8} y={PY + 15} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.75">achievable: some code reaches it</text>
        <text x={PX + 8} y={BOTTOM - 8} fontSize="11" fill="currentColor" opacity="0.6">impossible: the converse forbids it</text>

        <line x1={PX} y1={BOTTOM} x2={PX + PW} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        <line x1={PX} y1={PY} x2={PX} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        {yTicks.map((b) => (
          <g key={`y${b}`}>
            <line x1={PX - 4} y1={yOf(b)} x2={PX} y2={yOf(b)} stroke="currentColor" opacity="0.5" />
            <text x={PX - 8} y={yOf(b) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">{bern ? b.toFixed(2) : b}</text>
          </g>
        ))}
        <text x={PX - 36} y={PY + PH / 2} fontSize="11" fill="currentColor" opacity="0.7" textAnchor="middle" transform={`rotate(-90 ${PX - 36} ${PY + PH / 2})`}>rate R ({unit})</text>
        {xTicks.map((d) => (
          <g key={`x${d}`}>
            <line x1={xOf(d)} y1={BOTTOM} x2={xOf(d)} y2={BOTTOM + 4} stroke="currentColor" opacity="0.5" />
            <text x={xOf(d)} y={BOTTOM + 17} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">{d}</text>
          </g>
        ))}
        <text x={PX + PW / 2} y={BOTTOM + 34} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">distortion D</text>

        {/* reference schemes: what one dimension at a time actually costs */}
        {!bern && (
          <>
            <polyline points={ecsq} fill="none" stroke="currentColor" opacity="0.55" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x={xOf(0.62)} y={yOf(rAt(0.62) + ECSQ) - 6} fontSize="11" fill="currentColor" opacity="0.75">entropy-coded scalar quantizer: R(D) + 0.254</text>
          </>
        )}
        {bern && Math.abs(s.p - 0.5) < 0.005 && (
          <>
            <circle cx={xOf(0.25)} cy={yOf(0.5)} r="8" fill="none" stroke={BLUE} strokeWidth="1.5" />
            <text x={xOf(0.25) + 8} y={yOf(0.5) - 7} fontSize="11" fill={BLUE}>store half, guess half</text>
          </>
        )}

        <polyline points={path} fill="none" stroke={AMBER} strokeWidth="2.5" />
        <text x={xOf(dLabel)} y={yOf(rAt(dLabel)) - 8} fontSize="11" fontWeight="bold" fill={AMBER}>R(D)</text>

        {/* the proposal, with the deficit drawn when it is rejected */}
        {rejected && (
          <line x1={xOf(D)} y1={yOf(R)} x2={xOf(D)} y2={yOf(need)} stroke={WARN} strokeWidth="1.5" strokeDasharray="3 3" />
        )}
        <line x1={PX} y1={yOf(R)} x2={xOf(D)} y2={yOf(R)} stroke="currentColor" opacity="0.35" strokeDasharray="3 3" />
        <circle cx={xOf(D)} cy={yOf(R)} r="5" fill={rejected ? WARN : BLUE} />
        <text x={Math.min(xOf(D) + 10, PX + PW - 130)} y={Math.max(yOf(R) + 17, PY + 30)} fontSize="12" fontWeight="bold" fill={rejected ? WARN : BLUE}>
          {rejected ? "your scheme: impossible" : `your scheme: +${over.toFixed(3)} bit`}
        </text>
      </svg>
    </Panel>
  );
}
