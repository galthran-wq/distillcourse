"use client";

/**
 * ThresholdMetricsExplorer — per-class score densities with a draggable
 * decision threshold; live confusion matrix, precision/recall/F1, and the
 * operating point traced on ROC and PR curves. Switching Balanced (1:1) →
 * Imbalanced (1:100) keeps the threshold and the ROC curve fixed while the
 * PR curve collapses toward the prevalence floor (lesson task: precision at
 * t = 0.5 falls ~0.89 → ~0.08).
 */
import { useMemo, useState } from "react";
import type { PointerEvent } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const AMBER = "#e2903a"; // positives / current operating point
const BLUE = "#4c8dd6"; // negatives

const PRESETS = [
  { label: "Balanced (1:1)", mu0: 0.35, mu1: 0.65, sigma: 0.12, nPos: 1_000, nNeg: 1_000 },
  { label: "Imbalanced (1:100)", mu0: 0.35, mu1: 0.65, sigma: 0.12, nPos: 1_000, nNeg: 100_000 },
  { label: "Heavy overlap (1:1)", mu0: 0.44, mu1: 0.56, sigma: 0.15, nPos: 1_000, nNeg: 1_000 },
] as const;

const GRID = Array.from({ length: 121 }, (_, i) => i / 120);

/** Standard normal CDF (Abramowitz–Stegun 7.1.26 erf approximation). */
function phi(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    t *
      (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
      Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export default function ThresholdMetricsExplorer() {
  // D3: open on the balanced preset at t=0.5 — a real operating point (TPR≈0.89, FPR≈0.11).
  const [preset, setPreset] = useState(0);
  const [t, setT] = useState(0.5);

  const p = PRESETS[preset];
  const prevalence = p.nPos / (p.nPos + p.nNeg);
  const tpr = 1 - phi((t - p.mu1) / p.sigma);
  const fpr = 1 - phi((t - p.mu0) / p.sigma);
  const tp = Math.round(p.nPos * tpr);
  const fp = Math.round(p.nNeg * fpr);
  const fn = p.nPos - tp;
  const tn = p.nNeg - fp;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
  const f1 = precision + tpr > 0 ? (2 * precision * tpr) / (precision + tpr) : 0;

  // ROC and PR polylines from a threshold sweep (analytic rates, so exact and instant).
  const { roc, pr } = useMemo(() => {
    const pts = GRID.map((u) => {
      const T = 1 - phi((u - p.mu1) / p.sigma);
      const F = 1 - phi((u - p.mu0) / p.sigma);
      const denom = T * prevalence + F * (1 - prevalence);
      return { T, F, prec: denom > 1e-12 ? (T * prevalence) / denom : 1 };
    });
    return {
      roc: pts.map((q) => `${cx(q.F)},${cy(q.T)}`).join(" "),
      pr: pts.map((q) => `${cx(q.T)},${cy(q.prec)}`).join(" "),
    };
  }, [p, prevalence]);

  // Histogram panel: score 0..1 → x 30..590, density 0..1 → y 120..15.
  const hx = (s: number) => 30 + s * 560;
  const density = (mu: number) =>
    `${hx(0)},120 ` +
    GRID.map((s) => `${hx(s).toFixed(1)},${(120 - 105 * Math.exp(-(((s - mu) / p.sigma) ** 2) / 2)).toFixed(1)}`).join(" ") +
    ` ${hx(1)},120`;

  const dragTo = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const s = (((e.clientX - r.left) / r.width) * 600 - 30) / 560;
    setT(Math.round(Math.min(1, Math.max(0, s)) * 200) / 200);
  };

  const num = (v: number) => v.toLocaleString("en-US");
  const cell = "border border-line px-2 py-1 text-right font-mono";

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((q) => q.label)}
        activeIndex={preset}
        onSelect={setPreset}
      />
      <Slider
        label="decision threshold t"
        value={t}
        min={0}
        max={1}
        step={0.005}
        onChange={setT}
        display={t.toFixed(3)}
        ariaLabel="Decision threshold on the classifier score"
      />
      <svg
        viewBox="0 0 600 140"
        className="w-full touch-none cursor-ew-resize select-none"
        role="img"
        aria-label={`Per-class score densities with the threshold at ${t.toFixed(3)}; scores above it are called positive. Drag horizontally to move the threshold.`}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragTo(e); }}
        onPointerMove={(e) => { if (e.buttons === 1) dragTo(e); }}
      >
        <line x1="30" y1="120" x2="590" y2="120" stroke="currentColor" opacity="0.5" />
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={hx(v)} y="133" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{v}</text>
        ))}
        <polygon points={density(p.mu0)} fill={BLUE} opacity="0.35" />
        <polygon points={density(p.mu1)} fill={AMBER} opacity="0.35" />
        <text x={hx(p.mu0)} y="12" textAnchor="middle" fontSize="11" fontWeight="bold" fill={BLUE}>negatives</text>
        <text x={hx(p.mu1)} y="12" textAnchor="middle" fontSize="11" fontWeight="bold" fill={AMBER}>positives</text>
        <text x="310" y="133" textAnchor="start" fontSize="10" fill="currentColor" opacity="0.7">score — per-class densities (not count-scaled); drag to move t</text>
        <line x1={hx(t)} y1="4" x2={hx(t)} y2="120" stroke="currentColor" strokeWidth="2" />
        <text x={hx(t) + (t > 0.85 ? -6 : 6)} y="30" textAnchor={t > 0.85 ? "end" : "start"} fontSize="11" fill="currentColor">t = {t.toFixed(3)} → call +</text>
      </svg>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
        <table className="border-collapse text-sm" aria-label="Confusion matrix at the current threshold">
          <tbody>
            <tr><td className="pr-2" /><td className={cell}>actual +</td><td className={cell}>actual −</td></tr>
            <tr><td className="pr-2 text-sm">pred +</td><td className={cell}>TP {num(tp)}</td><td className={cell}>FP {num(fp)}</td></tr>
            <tr><td className="pr-2 text-sm">pred −</td><td className={cell}>FN {num(fn)}</td><td className={cell}>TN {num(tn)}</td></tr>
          </tbody>
        </table>
        <Readout>
          precision = <strong>{precision.toFixed(3)}</strong>, recall (TPR) = <strong>{tpr.toFixed(3)}</strong>,{" "}
          FPR = <strong>{fpr.toFixed(3)}</strong>, F₁ = <strong>{f1.toFixed(3)}</strong>
        </Readout>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <svg viewBox="0 0 280 250" className="min-w-56 flex-1 select-none" role="img"
          aria-label={`ROC curve with the current operating point at false positive rate ${fpr.toFixed(3)}, true positive rate ${tpr.toFixed(3)}`}>
          {axes("ROC — FPR vs TPR")}
          <line x1={cx(0)} y1={cy(0)} x2={cx(1)} y2={cy(1)} stroke="currentColor" opacity="0.3" strokeDasharray="3 3" />
          <polyline points={roc} fill="none" stroke={AMBER} strokeWidth="2.5" />
          <circle cx={cx(fpr)} cy={cy(tpr)} r="5" fill={AMBER} stroke="currentColor" />
        </svg>
        <svg viewBox="0 0 280 250" className="min-w-56 flex-1 select-none" role="img"
          aria-label={`Precision–recall curve with the current point at recall ${tpr.toFixed(3)}, precision ${precision.toFixed(3)}; prevalence floor at ${prevalence.toFixed(3)}`}>
          {axes("PR — recall vs precision")}
          <line x1={cx(0)} y1={cy(prevalence)} x2={cx(1)} y2={cy(prevalence)} stroke="currentColor" opacity="0.4" strokeDasharray="2 4" />
          <text x={cx(1)} y={cy(prevalence) - 5} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">prevalence floor π = {prevalence.toFixed(3)}</text>
          <polyline points={pr} fill="none" stroke={AMBER} strokeWidth="2.5" />
          <circle cx={cx(tpr)} cy={cy(precision)} r="5" fill={AMBER} stroke="currentColor" />
        </svg>
      </div>
    </Panel>
  );
}

// Shared unit-square plot mapping: (0..1, 0..1) → x 36..272, y 210..8.
const cx = (v: number) => +(36 + v * 236).toFixed(1);
const cy = (v: number) => +(210 - v * 202).toFixed(1);

function axes(title: string) {
  return (
    <g>
      <line x1="36" y1="210" x2="272" y2="210" stroke="currentColor" opacity="0.5" />
      <line x1="36" y1="8" x2="36" y2="210" stroke="currentColor" opacity="0.5" />
      {[0, 0.5, 1].map((v) => (
        <g key={v}>
          <text x={cx(v)} y="223" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{v}</text>
          <text x="30" y={cy(v) + 3} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.7">{v}</text>
        </g>
      ))}
      <text x="154" y="240" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.7">{title}</text>
    </g>
  );
}
