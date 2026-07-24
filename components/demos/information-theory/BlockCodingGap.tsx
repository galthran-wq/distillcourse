"use client";

/**
 * BlockCodingGap — exact optimal (Huffman) block-code cost per symbol
 * vs. the entropy line, for an adjustable coin bias and block size n = 1–8.
 * Guided task (lesson prose): load the 90/10 preset, drag n from 1 to 8 and
 * watch the gap fall within 0.01 of H; on the fair coin the gap is 0 always.
 */
import { useMemo, useState } from "react";
import { Panel, PresetGroup, Slider, Readout } from "@/components/ui";

const PRESETS = [
  { label: "Fair coin", p: 0.5 },
  { label: "90/10 coin", p: 0.9 },
] as const;

const NS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

function entropy(p: number): number {
  const q = 1 - p;
  return -(p * Math.log2(p) + q * Math.log2(q));
}

/** Expected length of the optimal (Huffman) code, via the two-queue method:
 *  cost = sum of all merged internal-node weights. */
function huffmanLength(probs: number[]): number {
  const leaves = [...probs].sort((a, b) => a - b);
  const merged: number[] = [];
  let li = 0;
  let mi = 0;
  let total = 0;
  const next = () =>
    mi >= merged.length || (li < leaves.length && leaves[li] <= merged[mi])
      ? leaves[li++]
      : merged[mi++];
  for (let remaining = leaves.length; remaining > 1; remaining--) {
    const s = next() + next();
    total += s;
    merged.push(s);
  }
  return total;
}

/** All 2^n block probabilities of a bias-p coin, grouped by number of heads. */
function blockProbs(p: number, n: number): number[] {
  const probs: number[] = [];
  let binom = 1; // C(n, k), updated multiplicatively
  for (let k = 0; k <= n; k++) {
    const prob = p ** k * (1 - p) ** (n - k);
    for (let i = 0; i < binom; i++) probs.push(prob);
    binom = (binom * (n - k)) / (k + 1);
  }
  return probs;
}

// SVG geometry (user units)
const VW = 480;
const VH = 300;
const X0 = 46;
const X1 = 466;
const Y_TOP = 16;
const Y_BASE = 258;

export default function BlockCodingGap() {
  // D3: open on the 90/10 coin mid-squeeze — the fall onto the entropy line
  // is already on screen, and both presets visibly move the whole picture.
  const [bias, setBias] = useState<number>(0.9);
  const [n, setN] = useState<number>(4);

  const H = entropy(bias);
  // Exact optimal cost per symbol at every block size (≤ 510 leaves total).
  const perSymbol = useMemo(
    () => NS.map((m) => huffmanLength(blockProbs(bias, m)) / m),
    [bias],
  );

  const cost = perSymbol[n - 1];
  const gap = cost - H;
  const yMax = (H + 1) * 1.06; // guarantee curve at n = 1 tops the plot
  const xOf = (m: number) => X0 + ((m - 1) / 7) * (X1 - X0);
  const yOf = (bits: number) => Y_BASE - (bits / yMax) * (Y_BASE - Y_TOP);

  const gapZero = gap < 1e-9;
  const gapTiny = !gapZero && gap < 0.01;
  const activePreset = PRESETS.findIndex((pr) => Math.abs(pr.p - bias) < 1e-9);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((preset) => preset.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setBias(PRESETS[i].p)}
      />

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Slider
          label="coin bias P(heads)"
          value={bias}
          min={0.05}
          max={0.95}
          step={0.01}
          onChange={setBias}
          display={bias.toFixed(2)}
          ariaLabel="Coin bias, probability of heads"
        />
        <Slider
          label="block size n"
          value={n}
          min={1}
          max={8}
          step={1}
          onChange={setN}
          display={String(n)}
          ariaLabel="Block size n"
        />
      </div>

      <Readout>
        H = <strong>{H.toFixed(3)}</strong> &middot; optimal L{"ₙ"}/n ={" "}
        <strong>{cost.toFixed(3)} bits/symbol</strong> &middot; gap ={" "}
        <strong>{gap.toFixed(3)}</strong>
        {gapZero && (
          <span className="pl-2 font-medium text-accent">
            exactly 0 — surprisals are already integers
          </span>
        )}
        {gapTiny && (
          <span className="pl-2 font-medium text-accent">
            within 0.01 of the entropy floor
          </span>
        )}
      </Readout>

      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`Optimal bits per symbol for block sizes 1 to 8 on a coin with bias ${bias.toFixed(
          2,
        )}; at n = ${n} the cost is ${cost.toFixed(3)} bits against entropy ${H.toFixed(
          3,
        )}, a gap of ${gap.toFixed(3)}`}
      >
        {/* grid + y ticks */}
        {[0.5, 1, 1.5, 2].map(
          (t) =>
            t < yMax && (
              <g key={t}>
                <line x1={X0} y1={yOf(t)} x2={X1} y2={yOf(t)} stroke="currentColor" opacity="0.12" />
                <text x={X0 - 6} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill="currentColor" opacity="0.55">
                  {t}
                </text>
              </g>
            ),
        )}
        {/* axes */}
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" />
        <line x1={X0} y1={Y_BASE} x2={X0} y2={Y_TOP} stroke="currentColor" />
        {NS.map((m) => (
          <text key={m} x={xOf(m)} y={Y_BASE + 16} textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.55">
            {m}
          </text>
        ))}
        <text x={(X0 + X1) / 2} y={VH - 4} textAnchor="middle" fontSize="12" fill="currentColor">
          block size n
        </text>
        <text x={14} y={(Y_TOP + Y_BASE) / 2} textAnchor="middle" fontSize="12" fill="currentColor" transform={`rotate(-90 14 ${(Y_TOP + Y_BASE) / 2})`}>
          bits per symbol
        </text>

        {/* guarantee curve H + 1/n */}
        <polyline
          points={NS.map((m) => `${xOf(m)},${yOf(H + 1 / m)}`).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeDasharray="3 3"
          opacity="0.5"
        />
        <text x={xOf(6) + 8} y={yOf(H + 1 / 6) - 8} fontSize="11" fill="currentColor" opacity="0.55">
          H + 1/n
        </text>

        {/* entropy line */}
        <line x1={X0} y1={yOf(H)} x2={X1} y2={yOf(H)} stroke="#4c8dd6" strokeDasharray="4 3" />
        <text x={X0 + 4} y={yOf(H) + 14} fontSize="11" fill="#4c8dd6">
          H &#8776; {H.toFixed(3)}
        </text>

        {/* optimal per-symbol costs; current n highlighted */}
        <polyline
          points={NS.map((m) => `${xOf(m)},${yOf(perSymbol[m - 1])}`).join(" ")}
          fill="none"
          stroke="#e2903a"
          opacity="0.6"
        />
        {NS.map((m) => (
          <circle key={m} cx={xOf(m)} cy={yOf(perSymbol[m - 1])} r={m === n ? 6 : 3.5} fill="#e2903a" opacity={m === n ? 1 : 0.75} />
        ))}
        <text
          x={xOf(n)}
          y={yOf(cost) - 12}
          textAnchor={n > 6 ? "end" : "middle"}
          fontSize="12"
          fontWeight="bold"
          fill="#e2903a"
        >
          {cost.toFixed(3)}
        </text>
      </svg>
    </Panel>
  );
}
