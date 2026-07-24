"use client";

/**
 * PredictiveCompressor — type text, pick the model driving an ideal
 * arithmetic coder, and watch per-character surprisal, bits/char, and the
 * file size respond (lesson: compression-is-prediction). Three models:
 * uniform bytes (8 bits/char), fixed English letter frequencies, and a
 * bigram pretrained on a small built-in sample that also adapts to the
 * typed stream — the decoder can replay the same counts, so the model
 * rides on both ends. Sandbox culmination: better prediction = smaller file.
 */
import { useState } from "react";
import { Panel, PresetGroup, Readout, TextArea } from "@/components/ui";

// Standard English letter frequencies (percent of letters). Model mass:
// space 19%, letters 78% (scaled below), 3% floor over all other characters.
const LETTER_PCT: Record<string, number> = {
  e: 12.7, t: 9.06, a: 8.17, o: 7.51, i: 6.97, n: 6.75, s: 6.33, h: 6.09,
  r: 5.99, d: 4.25, l: 4.03, c: 2.78, u: 2.76, m: 2.41, w: 2.36, f: 2.23,
  g: 2.02, y: 1.97, p: 1.93, b: 1.49, v: 0.98, k: 0.77, j: 0.15, x: 0.15,
  q: 0.1, z: 0.07,
};
const OTHER_P = 0.0003; // ≈11.7 bits for anything outside a–z + space

function q1(c: string): number {
  if (c === " ") return 0.19;
  const pct = LETTER_PCT[c];
  return pct !== undefined ? pct * 0.0078 : OTHER_P;
}

// Training sample for the bigram model — the "model both ends already hold".
const CORPUS =
  "the idea of information theory is that a message can be measured by how surprising it is to the one who receives it. a rare event carries many bits and a certain event carries none. when a source repeats itself a good code spends few bits on the common parts and more on the rare ones. the length of the best code for a symbol is the logarithm of one over its probability. a model that predicts the next character well can therefore compress the text it reads. every compressor carries a model of the data it expects and every model of data defines a compressor. this holds for letters in english for pixels in an image and for tokens in a stream. the better the prediction the shorter the file and the shorter the file the better the prediction must have been. there is no way around the entropy of the source. it sets the floor under every code that can be decoded without loss.";
const PRIOR_MASS = 6; // pseudo-count weight of a corpus row in the blend
const UNI_MASS = 2; // pseudo-count weight of the letter-frequency fallback

// context -> follower -> P(follower | context), estimated once from CORPUS.
const ROWS: Map<string, Map<string, number>> = (() => {
  const counts = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();
  for (let i = 1; i < CORPUS.length; i++) {
    const ctx = CORPUS[i - 1], c = CORPUS[i];
    const row = counts.get(ctx) ?? new Map<string, number>();
    row.set(c, (row.get(c) ?? 0) + 1);
    counts.set(ctx, row);
    totals.set(ctx, (totals.get(ctx) ?? 0) + 1);
  }
  const rows = new Map<string, Map<string, number>>();
  for (const [ctx, row] of counts) {
    const total = totals.get(ctx) ?? 1;
    rows.set(ctx, new Map([...row].map(([c, n]) => [c, n / total])));
  }
  return rows;
})();

const MODELS = ["uniform bytes", "letter frequencies", "bigram"] as const;
type Model = (typeof MODELS)[number];

/** Per-character coding cost -log2 q(c | context) under the chosen model. */
function costs(text: string, model: Model): number[] {
  const chars = [...text];
  if (model === "uniform bytes") return chars.map(() => 8);
  if (model === "letter frequencies") return chars.map((c) => -Math.log2(q1(c)));
  const seen = new Map<string, Map<string, number>>(); // adaptive counts
  const seenTotal = new Map<string, number>();
  const out: number[] = [];
  let prev: string | null = null;
  for (const c of chars) {
    if (prev === null) out.push(-Math.log2(q1(c)));
    else {
      const prior = ROWS.get(prev);
      const n = seen.get(prev)?.get(c) ?? 0;
      const N = seenTotal.get(prev) ?? 0;
      const num = n + (prior ? PRIOR_MASS * (prior.get(c) ?? 0) : 0) + UNI_MASS * q1(c);
      out.push(-Math.log2(num / (N + (prior ? PRIOR_MASS : 0) + UNI_MASS)));
      const row = seen.get(prev) ?? new Map<string, number>();
      row.set(c, (row.get(c) ?? 0) + 1);
      seen.set(prev, row);
      seenTotal.set(prev, N + 1);
    }
    prev = c;
  }
  return out;
}

const PRESETS = [
  { label: "English sentence", text: "compression and prediction are the same problem stated twice" },
  { label: "Repeated character", text: "a".repeat(48) },
  { label: "Keyboard mash", text: "sdkfj qpwoe zx8cv;93 lkaj vn;m 84qw mz71 xjq2 wkfj9z" },
] as const;

// chart geometry (SVG user units)
const X0 = 34, X1 = 474, Y_TOP = 16, Y_BASE = 118;
const AMBER = "#e2903a"; // model cost bars (house palette)
const BLUE = "#4c8dd6"; // the mean guide line
const MAX_BARS = 360;

/** Bucket long texts so the strip stays a few hundred rects at most. */
function buckets(vals: number[]): number[] {
  if (vals.length <= MAX_BARS) return vals;
  const size = Math.ceil(vals.length / MAX_BARS);
  const out: number[] = [];
  for (let i = 0; i < vals.length; i += size) {
    const end = Math.min(vals.length, i + size);
    let s = 0;
    for (let j = i; j < end; j++) s += vals[j];
    out.push(s / (end - i));
  }
  return out;
}

export default function PredictiveCompressor() {
  // D3: open on the English preset under letter frequencies — bars already
  // sit near 4 bits, half the dashed raw-byte line, before any interaction.
  const [text, setText] = useState<string>(PRESETS[0].text);
  const [model, setModel] = useState<Model>("letter frequencies");

  const perChar = costs(text, model);
  const n = perChar.length;
  const totalBits = perChar.reduce((s, b) => s + b, 0);
  const mean = n > 0 ? totalBits / n : 0;
  const fileBits = n > 0 ? Math.ceil(totalBits) + 2 : 0; // arithmetic coder: within 2 bits
  const activePreset = PRESETS.findIndex((p) => p.text === text);

  const bars = buckets(perChar);
  const yMax = Math.max(12, Math.ceil(bars.reduce((m, b) => Math.max(m, b), 0)));
  const yOf = (b: number) => Y_BASE - (Math.min(b, yMax) / yMax) * (Y_BASE - Y_TOP);
  const barW = (X1 - X0) / Math.max(1, bars.length);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={activePreset === -1 ? null : activePreset}
        onSelect={(i) => setText(PRESETS[i].text)}
      />

      <TextArea label="text to compress" value={text} onChange={setText} />

      <div className="flex flex-wrap items-center gap-x-3 pt-3">
        <span className="pb-3 text-sm">model</span>
        <PresetGroup
          labels={[...MODELS]}
          activeIndex={MODELS.indexOf(model)}
          onSelect={(i) => setModel(MODELS[i])}
        />
      </div>

      <Readout>
        {n === 0 ? (
          <>type text above to compress it</>
        ) : (
          <>
            bits/char = <strong>{mean.toFixed(2)}</strong> &middot; file &asymp;{" "}
            <strong>{fileBits} bits</strong> &middot; raw bytes = {n * 8} bits
            {mean > 8 && (
              <span className="pl-2 font-medium text-accent">
                the model&rsquo;s bets lose: worse than raw bytes here
              </span>
            )}
          </>
        )}
      </Readout>

      <svg
        viewBox="0 0 480 140"
        className="mt-1 w-full"
        role="img"
        aria-label={`Per-character coding cost under ${model}: mean ${mean.toFixed(2)} bits per character over ${n} characters`}
      >
        <line x1={X0} y1={Y_TOP} x2={X0} y2={Y_BASE} stroke="currentColor" />
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" />
        {[0, 4, 8, yMax].map((t) => (
          <g key={t}>
            <line x1={X0 - 4} y1={yOf(t)} x2={X0} y2={yOf(t)} stroke="currentColor" />
            <text x={X0 - 7} y={yOf(t) + 4} textAnchor="end" fontSize="10" fill="currentColor">
              {t}
            </text>
          </g>
        ))}
        <text x={X0 + 4} y={Y_TOP - 5} fontSize="10" fill="currentColor">
          bits per character
        </text>
        {bars.map((b, i) => (
          <rect key={i} x={X0 + i * barW} y={yOf(b)} width={Math.max(0.5, barW - 0.5)}
            height={Y_BASE - yOf(b)} fill={AMBER} />
        ))}
        <line x1={X0} y1={yOf(8)} x2={X1} y2={yOf(8)} stroke="currentColor"
          strokeDasharray="5 4" opacity="0.6" />
        <text x={X1} y={yOf(8) - 4} textAnchor="end" fontSize="10" fill="currentColor">
          8 = raw byte
        </text>
        {n > 0 && (
          <>
            <line x1={X0} y1={yOf(mean)} x2={X1} y2={yOf(mean)} stroke={BLUE} strokeWidth="1.5" />
            <text x={X0 + 4} y={yOf(mean) + 12} fontSize="10" fontWeight="bold" fill={BLUE}>
              mean {mean.toFixed(2)}
            </text>
          </>
        )}
      </svg>
    </Panel>
  );
}
