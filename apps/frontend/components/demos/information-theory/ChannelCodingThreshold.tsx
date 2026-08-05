"use client";

/**
 * ChannelCodingThreshold — best achievable block error vs. rate R on the
 * BSC(0.1) (C ≈ 0.531), with blocklength n adjustable, via the
 * finite-blocklength normal approximation ε ≈ Q((C − R)·√(n/V)).
 * Guided task (lesson prose): below-capacity preset + raise n → error falls
 * toward 0; above-capacity + raise n → error climbs; largest n + sweep R
 * across 0.531 → trace the cliff.
 */
import { useMemo, useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const C = 0.531; // capacity of BSC(0.1): 1 − H(0.1)
const V = 0.9043; // dispersion of BSC(0.1): p(1−p)·log2²((1−p)/p), bits²
const PRESETS = [
  { label: "below capacity", R: 0.35, n: 50 },
  { label: "at capacity", R: 0.531, n: 50 },
  { label: "above capacity", R: 0.75, n: 50 },
] as const;

/** Gaussian tail Q(x), via Abramowitz–Stegun 7.1.26 erfc (|err| < 1.5e-7). */
function Q(x: number): number {
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const poly =
    t *
    (0.254829592 +
      t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const q = 0.5 * poly * Math.exp(-z * z);
  return x >= 0 ? q : 1 - q;
}

const blockError = (R: number, n: number) => Q((C - R) * Math.sqrt(n / V));

// SVG geometry (user units)
const VW = 480;
const VH = 290;
const X0 = 46;
const X1 = 466;
const Y_TOP = 18;
const Y_BASE = 244;
const xOf = (R: number) => X0 + R * (X1 - X0);
const yOf = (e: number) => Y_BASE - e * (Y_BASE - Y_TOP);

export default function ChannelCodingThreshold() {
  // D3: open on the below-capacity preset — the S-curve and a visibly
  // nonzero-but-small error are on screen, ready to be crushed by raising n.
  const [R, setR] = useState<number>(PRESETS[0].R);
  const [n, setN] = useState<number>(PRESETS[0].n);

  const err = blockError(R, n);
  const curve = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 140; i++) {
      const r = i / 140;
      pts.push(`${xOf(r)},${yOf(blockError(r, n))}`);
    }
    return pts.join(" ");
  }, [n]);

  const atCapacity = Math.abs(R - C) <= 0.003;
  const crushed = !atCapacity && R < C && err < 0.001;
  const doomed = !atCapacity && R > C && err > 0.999;
  const activePreset = PRESETS.findIndex(
    (pr) => Math.abs(pr.R - R) < 1e-9 && pr.n === n,
  );

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => {
          setR(PRESETS[i].R);
          setN(PRESETS[i].n);
        }}
      />

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Slider
          label="rate R (bits per use)"
          value={R}
          min={0.05}
          max={1}
          step={0.001}
          onChange={setR}
          display={R.toFixed(3)}
          ariaLabel="Code rate R in bits per channel use"
        />
        <Slider
          label="blocklength n"
          value={n}
          min={10}
          max={1000}
          step={10}
          onChange={setN}
          display={String(n)}
          ariaLabel="Blocklength n"
        />
      </div>

      <Readout>
        C = <strong>0.531</strong> &middot; block error &asymp;{" "}
        <strong>{err < 0.001 ? err.toExponential(1) : err.toFixed(3)}</strong>
        {crushed && (
          <span className="pl-2 font-medium text-accent">
            below C: growing n crushed the error
          </span>
        )}
        {doomed && (
          <span className="pl-2 font-medium text-accent">
            above C: growing n made failure certain
          </span>
        )}
        {atCapacity && (
          <span className="pl-2 font-medium text-accent">
            at C: pinned near 1/2 at every n
          </span>
        )}
      </Readout>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`Best achievable block error against rate on a binary symmetric channel with capacity 0.531, at blocklength ${n}; at rate ${R.toFixed(
          3,
        )} the block error is about ${err.toFixed(3)}`}
      >
        {/* grid + y ticks */}
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={X0} y1={yOf(t)} x2={X1} y2={yOf(t)} stroke="currentColor" opacity="0.12" />
            <text x={X0 - 6} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55">
              {t}
            </text>
          </g>
        ))}
        {/* axes + x ticks */}
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" />
        <line x1={X0} y1={Y_BASE} x2={X0} y2={Y_TOP} stroke="currentColor" />
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text key={t} x={xOf(t)} y={Y_BASE + 16} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
            {t}
          </text>
        ))}
        <text x={(X0 + X1) / 2} y={VH - 6} textAnchor="middle" fontSize="12" fill="currentColor">
          rate R (bits per use)
        </text>
        <text x={14} y={(Y_TOP + Y_BASE) / 2} textAnchor="middle" fontSize="12" fill="currentColor" transform={`rotate(-90 14 ${(Y_TOP + Y_BASE) / 2})`}>
          block error
        </text>

        {/* capacity wall */}
        <line x1={xOf(C)} y1={Y_TOP} x2={xOf(C)} y2={Y_BASE} stroke="#e2903a" strokeDasharray="4 3" />
        <text x={xOf(C) + 6} y={Y_TOP + 10} fontSize="11" fill="#e2903a">
          C = 0.531
        </text>
        <text x={xOf(C) - 8} y={yOf(0.06)} textAnchor="end" fontSize="11" fill="#4c8dd6">
          error &rarr; 0
        </text>
        <text x={xOf(C) + 8} y={yOf(0.94) + 8} fontSize="11" fill="currentColor" opacity="0.55">
          error &rarr; 1
        </text>

        {/* error curve at this n, and the current operating point */}
        <polyline points={curve} fill="none" stroke="#4c8dd6" strokeWidth="2" />
        <circle cx={xOf(R)} cy={yOf(err)} r={6} fill="#e2903a" />
        <text
          x={xOf(R) + (R > 0.82 ? -10 : 10)}
          y={yOf(err) - 10}
          textAnchor={R > 0.82 ? "end" : "start"}
          fontSize="12"
          fontWeight="bold"
          fill="#e2903a"
        >
          {err < 0.001 ? err.toExponential(1) : err.toFixed(3)}
        </text>
      </svg>
    </Panel>
  );
}
