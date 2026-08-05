"use client";

/**
 * RateDistortionCurve — trace the rate-distortion function live. Bernoulli(p)
 * source under Hamming distortion: R(D) = H(p) − H(D), hitting zero at D = p;
 * toggle to the Gaussian source under squared error: R(D) = ½ log₂(σ²/D),
 * zero from D = σ². Guided task (lesson): on the fair source drag D to 0.11
 * and read R = 0.500; check the biased source's endpoints; on the Gaussian
 * curve read R at D = 0.25 and D = 0.0625 — exactly one bit apart.
 */
import { useState } from "react";
import { Panel, PresetGroup, Slider, Readout, Button } from "@/components/ui";

type Mode = "bernoulli" | "gaussian";

// a = source parameter (bias p or variance σ²), d = distortion budget D
const PRESETS: { label: string; mode: Mode; a: number; d: number }[] = [
  { label: "Fair source", mode: "bernoulli", a: 0.5, d: 0.25 },
  { label: "Biased source", mode: "bernoulli", a: 0.25, d: 0.1 },
  { label: "Near-lossless", mode: "gaussian", a: 1, d: 0.0625 },
  { label: "Coarse", mode: "gaussian", a: 1, d: 0.25 },
];

const AMBER = "#e2903a";
// plot geometry (user units)
const VW = 480;
const VH = 296;
const PX = 52;
const PW = 396;
const PY = 18;
const PH = 220;
const BOTTOM = PY + PH;

function h2(p: number): number {
  const t = (v: number) => (v > 1e-12 ? -v * Math.log2(v) : 0);
  return t(p) + t(1 - p);
}

export default function RateDistortionCurve() {
  // D3: open on the fair-source preset — mid-curve point at R(0.25) = 0.189.
  const [mode, setMode] = useState<Mode>("bernoulli");
  const [p, setP] = useState(0.5);
  const [bernD, setBernD] = useState(0.25);
  const [sig2, setSig2] = useState(1);
  const [gaussD, setGaussD] = useState(0.25);

  const bern = mode === "bernoulli";
  const rAt = (d: number) =>
    bern
      ? Math.max(0, h2(p) - h2(d))
      : d >= sig2
        ? 0
        : 0.5 * Math.log2(sig2 / d);

  const D = bern ? bernD : gaussD;
  const rate = rAt(D);
  const xMax = bern ? 0.5 : 2.1;
  const yMax = bern ? 1 : 4;
  const dZero = bern ? p : sig2; // where the curve reaches zero rate

  const xOf = (d: number) => PX + (d / xMax) * PW;
  const yOf = (bits: number) => BOTTOM - (Math.min(yMax, bits) / yMax) * PH;

  const near = (x: number, y: number) => Math.abs(x - y) < 1e-9;
  const activePreset = PRESETS.findIndex(
    (q) =>
      q.mode === mode &&
      (bern ? near(q.a, p) && near(q.d, bernD) : near(q.a, sig2) && near(q.d, gaussD)),
  );

  const N = 160;
  const pts = Array.from({ length: N }, (_, i) => {
    const d = ((i + (bern ? 0 : 1)) / N) * xMax;
    return `${xOf(d).toFixed(1)},${yOf(rAt(d)).toFixed(1)}`;
  }).join(" ");

  const xTicks = bern ? [0, 0.1, 0.2, 0.3, 0.4, 0.5] : [0, 0.5, 1, 1.5, 2];
  const yTicks = bern ? [0, 0.25, 0.5, 0.75, 1] : [0, 1, 2, 3, 4];
  const unit = bern ? "bits/symbol" : "bits/sample";

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((q) => q.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          const q = PRESETS[i];
          setMode(q.mode);
          if (q.mode === "bernoulli") {
            setP(q.a);
            setBernD(q.d);
          } else {
            setSig2(q.a);
            setGaussD(q.d);
          }
        }}
      />

      <div className="flex flex-wrap gap-2 pb-3">
        <Button active={bern} onClick={() => setMode("bernoulli")}>
          Bernoulli, Hamming
        </Button>
        <Button active={!bern} onClick={() => setMode("gaussian")}>
          Gaussian, squared error
        </Button>
      </div>

      {bern ? (
        <Slider
          label="source bias p = P(X = 1)"
          value={p}
          min={0.05}
          max={0.5}
          step={0.01}
          onChange={setP}
          display={p.toFixed(2)}
          ariaLabel="Bernoulli source bias p"
        />
      ) : (
        <Slider
          label="source variance σ²"
          value={sig2}
          min={0.25}
          max={2}
          step={0.05}
          onChange={setSig2}
          display={sig2.toFixed(2)}
          ariaLabel="Gaussian source variance sigma squared"
        />
      )}

      <Slider
        label="distortion budget D"
        value={D}
        min={bern ? 0 : 0.0125}
        max={bern ? 0.5 : 2}
        step={bern ? 0.01 : 0.0125}
        onChange={bern ? setBernD : setGaussD}
        display={bern ? D.toFixed(2) : D.toFixed(4)}
        ariaLabel="Allowed expected distortion D"
      />

      <Readout>
        {rate > 0 ? (
          bern ? (
            <>
              R(D) = H({p.toFixed(2)}) − H({bernD.toFixed(2)}) ={" "}
              <strong>{rate.toFixed(3)} {unit}</strong>
            </>
          ) : (
            <>
              R(D) = ½ log₂({sig2.toFixed(2)}/{gaussD.toFixed(4)}) ={" "}
              <strong>{rate.toFixed(3)} {unit}</strong>
            </>
          )
        ) : (
          <>
            R(D) = <strong>0 {unit}</strong>
            <span className="pl-2 font-medium text-accent">
              {bern
                ? "D ≥ p: always guessing the majority symbol meets the budget"
                : "D ≥ σ²: the constant guess x̂ = 0 meets the budget"}
            </span>
          </>
        )}
      </Readout>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full select-none"
        role="img"
        aria-label={`Rate-distortion curve for a ${bern ? `Bernoulli source with bias ${p.toFixed(2)} under Hamming distortion` : `Gaussian source with variance ${sig2.toFixed(2)} under squared error`}; at distortion ${D} the rate is ${rate.toFixed(3)} bits, reaching zero from distortion ${dZero.toFixed(2)}`}
      >
        <line x1={PX} y1={BOTTOM} x2={PX + PW} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        <line x1={PX} y1={PY} x2={PX} y2={BOTTOM} stroke="currentColor" opacity="0.5" />
        {yTicks.map((b) => (
          <g key={`y${b}`}>
            <line x1={PX - 4} y1={yOf(b)} x2={PX} y2={yOf(b)} stroke="currentColor" opacity="0.5" />
            <text x={PX - 8} y={yOf(b) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.7">
              {bern ? b.toFixed(2) : b}
            </text>
          </g>
        ))}
        <text x={PX - 34} y={PY + PH / 2} fontSize="11" fill="currentColor" opacity="0.7" transform={`rotate(-90 ${PX - 34} ${PY + PH / 2})`} textAnchor="middle">
          R(D) bits
        </text>
        {xTicks.map((d) => (
          <g key={`x${d}`}>
            <line x1={xOf(d)} y1={BOTTOM} x2={xOf(d)} y2={BOTTOM + 4} stroke="currentColor" opacity="0.5" />
            <text x={xOf(d)} y={BOTTOM + 17} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
              {d}
            </text>
          </g>
        ))}
        <text x={PX + PW / 2} y={BOTTOM + 34} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.7">
          distortion budget D
        </text>

        {/* zero-rate boundary */}
        <line x1={xOf(dZero)} y1={PY} x2={xOf(dZero)} y2={BOTTOM} stroke="currentColor" opacity="0.3" strokeDasharray="3 3" />
        <text x={xOf(dZero) + 5} y={PY + 12} fontSize="11" fill="currentColor" opacity="0.7">
          {bern ? "D = p" : "D = σ²"}
        </text>

        {/* guides to the operating point, then curve on top */}
        <line x1={PX} y1={yOf(rate)} x2={xOf(D)} y2={yOf(rate)} stroke="currentColor" opacity="0.4" strokeDasharray="3 3" />
        <line x1={xOf(D)} y1={BOTTOM} x2={xOf(D)} y2={yOf(rate)} stroke="currentColor" opacity="0.4" strokeDasharray="3 3" />
        <polyline points={pts} fill="none" stroke={AMBER} strokeWidth="2.5" />
        <circle cx={xOf(D)} cy={yOf(rate)} r="4.5" fill={AMBER} />
        <text x={Math.min(xOf(D) + 10, PX + PW - 80)} y={Math.max(yOf(rate) - 8, PY + 26)} fontSize="12" fontWeight="bold" fill={AMBER}>
          R = {rate.toFixed(3)}
        </text>
      </svg>
    </Panel>
  );
}
