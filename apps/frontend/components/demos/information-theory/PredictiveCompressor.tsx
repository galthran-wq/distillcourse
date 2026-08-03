"use client";

/**
 * PredictiveCompressor — three targets on text the reader supplies: drive the
 * bigram under 1 bit/char, make the bigram *lose* to letter frequencies, and
 * make raw bytes beat both models. All three coders run on the same stream at
 * once, so the scoreboard names the winner and prices the excess bits every
 * rival wastes: "better prediction = smaller file" is something the reader
 * wins and loses, not a curve that moves (lesson: compression-is-prediction).
 */
import { useState } from "react";
import { BitsBar, Panel, PresetGroup, Readout, TargetList, TextArea } from "@/components/ui";

// Standard English letter frequencies (percent of letters). Model mass:
// space 19%, letters 78% (scaled below), 3% floor over all other characters.
const LETTER_PCT: Record<string, number> = Object.fromEntries(
  ("e12.7 t9.06 a8.17 o7.51 i6.97 n6.75 s6.33 h6.09 r5.99 d4.25 l4.03 c2.78 u2.76 m2.41 " +
    "w2.36 f2.23 g2.02 y1.97 p1.93 b1.49 v0.98 k0.77 j0.15 x0.15 q0.1 z0.07")
    .split(" ")
    .map((t) => [t[0], Number(t.slice(1))]),
);
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
  const rows = new Map<string, Map<string, number>>();
  const totals = new Map<string, number>();
  for (let i = 1; i < CORPUS.length; i++) {
    const ctx = CORPUS[i - 1], c = CORPUS[i];
    const row = rows.get(ctx) ?? new Map<string, number>();
    row.set(c, (row.get(c) ?? 0) + 1);
    rows.set(ctx, row);
    totals.set(ctx, (totals.get(ctx) ?? 0) + 1);
  }
  for (const [ctx, row] of rows)
    for (const [c, k] of row) row.set(c, k / (totals.get(ctx) ?? 1));
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
    const prior = prev === null ? undefined : ROWS.get(prev);
    if (prev === null) out.push(-Math.log2(q1(c)));
    else {
      const N = seenTotal.get(prev) ?? 0;
      const num = (seen.get(prev)?.get(c) ?? 0) + PRIOR_MASS * (prior?.get(c) ?? 0) + UNI_MASS * q1(c);
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

const MIN_N = 12; // shortest stream a target will score, so one lucky character can't win
const BLUE = "#4c8dd6"; // bits the winning model spends — the part no rival avoids
const AMBER = "#e2903a"; // excess bits a losing model spends
const WARN = "#c0392b"; // unreachable: no model here can charge infinite bits
const STRIP = 240; // characters drawn in the per-character strip
const X0 = 34, X1 = 474, Y_TOP = 16, Y_BASE = 118; // strip geometry (SVG units)

/** Code the stream under all three models; the target checks read these. */
function measure(text: string) {
  const perModel = MODELS.map((m) => costs(text, m));
  const n = perModel[0].length;
  const rate = perModel.map((c) => (n > 0 ? c.reduce((s, b) => s + b, 0) / n : 0));
  const long = n >= MIN_N;
  return {
    n, rate, perModel,
    best: rate.indexOf(Math.min(...rate)),
    met: [
      long && rate[2] < 1,
      long && rate[2] > rate[1],
      long && rate[1] > 8 && rate[2] > 8,
    ],
  };
}

type State = { text: string; model: Model; hit: boolean[] };
/** New text — and a target stays ticked once it has been met (latching). */
const commit = (s: State, text: string): State => ({
  ...s, text, hit: s.hit.map((h, i) => h || measure(text).met[i]),
});

export default function PredictiveCompressor() {
  // D3: opens on the English preset with all three coders already running —
  // 8.00 / 4.17 / 3.38 bits per character, the ladder, before any interaction.
  const [{ text, model, hit }, setS] = useState<State>({
    text: PRESETS[0].text, model: "bigram", hit: [false, false, false],
  });
  const { n, rate, perModel, best, met } = measure(text);
  const mi = MODELS.indexOf(model);
  const preset = PRESETS.findIndex((p) => p.text === text);
  const fmt = (i: number) => `${rate[i].toFixed(2)} bits/char`;

  const bars = perModel[mi].slice(0, STRIP);
  const yMax = Math.max(12, Math.ceil(bars.reduce((m, b) => Math.max(m, b), 0)));
  const yOf = (b: number) => Y_BASE - (Math.min(b, yMax) / yMax) * (Y_BASE - Y_TOP);
  const barW = (X1 - X0) / Math.max(1, bars.length);

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={preset === -1 ? null : preset}
        onSelect={(i) => setS((s) => commit(s, PRESETS[i].text))}
      />
      <TargetList
        targets={[
          ["1. Get the bigram under 1.00 bits/char — an eighth of a raw byte",
            `bigram ${fmt(2)}${n < MIN_N ? ` · scored from ${MIN_N} characters, have ${n}` : ""}`],
          ["2. Make the bigram lose to letter frequencies",
            `bigram ${fmt(2)} vs letters ${fmt(1)} — context ${met[1] ? "costs" : "saves"} ${Math.abs(rate[2] - rate[1]).toFixed(2)}`],
          ["3. Make raw bytes win: put both models above 8.00 bits/char",
            `letters ${fmt(1)} · bigram ${fmt(2)} · raw byte 8.00`],
        ].map(([label, detail], i) => ({ label, detail, met: met[i], latched: hit[i] }))}
      />
      <TextArea label="text to compress" value={text} onChange={(t) => setS((s) => commit(s, t))} />
      <Readout>
        {n === 0 ? (
          <>type text above to compress it</>
        ) : (
          <>
            winner: <strong>{MODELS[best]}</strong> at <strong>{fmt(best)}</strong> &middot;{" "}
            <strong>{Math.ceil((rate[best] * n + 2) / 8)} bytes</strong> for {n} characters
            {best !== 2 && (
              <span className="pl-2 font-medium text-accent">the bigram&rsquo;s bets lose here</span>
            )}
          </>
        )}
      </Readout>

      {/* all three coders, same stream: the winner's bits plus each rival's excess */}
      <BitsBar
        rows={MODELS.map((label, i) => ({
          label, floorLabel: "winner", floor: rate[best],
          gapLabel: "excess", gap: rate[i] - rate[best],
        }))}
        max={12} floorColor={BLUE} gapColor={AMBER} infColor={WARN}
      />

      <div className="flex flex-wrap items-center gap-x-3 pt-1">
        <span className="pb-3 text-sm">bits charged per character, model:</span>
        <PresetGroup labels={[...MODELS]} activeIndex={mi}
          onSelect={(i) => setS((s) => ({ ...s, model: MODELS[i] }))} />
      </div>

      <svg viewBox="0 0 480 140" className="mt-1 w-full" role="img"
        aria-label={`Per-character coding cost under ${model}: mean ${fmt(mi)} over ${n} characters`}>
        <line x1={X0} y1={Y_TOP} x2={X0} y2={Y_BASE} stroke="currentColor" />
        <line x1={X0} y1={Y_BASE} x2={X1} y2={Y_BASE} stroke="currentColor" />
        {[0, 4, 8, yMax].map((t) => (
          <g key={t}>
            <line x1={X0 - 4} y1={yOf(t)} x2={X0} y2={yOf(t)} stroke="currentColor" />
            <text x={X0 - 7} y={yOf(t) + 4} textAnchor="end" fontSize="10" fill="currentColor">{t}</text>
          </g>
        ))}
        <text x={X0 + 4} y={Y_TOP - 5} fontSize="10" fill="currentColor">
          bits per character{n > STRIP ? ` (first ${STRIP} of ${n})` : ""}
        </text>
        {bars.map((b, i) => (
          <rect key={i} x={X0 + i * barW} y={yOf(b)} width={Math.max(0.5, barW - 0.5)}
            height={Y_BASE - yOf(b)} fill={b > 8 ? AMBER : BLUE} />
        ))}
        <line x1={X0} y1={yOf(8)} x2={X1} y2={yOf(8)} stroke="currentColor"
          strokeDasharray="5 4" opacity="0.6" />
        <text x={X1} y={yOf(8) - 4} textAnchor="end" fontSize="10" fill="currentColor">8 = raw byte</text>
      </svg>

      <p className="pt-1 text-xs text-faint">
        Every amber bar cost more than shipping the raw byte: there the model bet against what
        arrived. No preset reaches target 3 — that one you have to type.
      </p>
    </Panel>
  );
}
