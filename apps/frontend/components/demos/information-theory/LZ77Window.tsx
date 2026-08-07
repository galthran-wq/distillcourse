"use client";

/**
 * LZ77Window — a greedy LZ77 parse of text the reader supplies, priced in the
 * 1977 paper's fixed codeword: every phrase is one (pointer, length, literal)
 * triple, so the file size is the phrase count times a field width the window
 * slider sets. Three outcomes the reader must construct: 200 characters the
 * coder shrinks tenfold, 200 it makes bigger, and the shortest input that
 * breaks even — searches over inputs against a live parse, which no static
 * parse diagram can show (lesson: dictionary-coding).
 */
import { useState } from "react";
import { BitsBar, Panel, PresetGroup, Readout, Slider, TargetList, TextArea } from "@/components/ui";

const MAX_N = 800; // characters parsed, so the search stays instant
const LMAX = 255; // longest match an 8-bit length field can name
const FIXED_BITS = 16; // 8-bit length field + 8-bit literal, in every triple
const VIS = 40, VW = 480, CELL = VW / VIS; // characters drawn in the zoomed strip
const MAP_Y = 14, MAP_H = 10, ARC_TOP = 36, STRIP_Y = 60, STRIP_H = 20;
const BLUE = "#4c8dd6"; // earlier text: the window, and the source of a match
const AMBER = "#e2903a"; // symbols written by the copy, and literal-only triples
const WARN = "#c0392b"; // unreachable: no parse here charges infinite bits

type Phrase = { start: number; d: number; l: number; ch: string };

/** Greedy longest-match parse; every phrase ends in one literal symbol. */
function parse(text: string, W: number): Phrase[] {
  const n = text.length;
  const out: Phrase[] = [];
  for (let i = 0; i < n; ) {
    const cap = Math.min(LMAX, n - 1 - i); // one symbol is always left as the literal
    let bd = 0, bl = 0;
    for (let d = 1; d <= Math.min(W, i) && bl < cap; d++) {
      let l = 0;
      while (l < cap && text[i - d + l] === text[i + l]) l++; // overlap allowed
      if (l > bl) { bl = l; bd = d; }
    }
    out.push({ start: i, d: bl > 0 ? bd : 0, l: bl, ch: text[i + bl] });
    i += bl + 1;
  }
  return out;
}

const PRESETS = [
  { label: "1977 ternary example", text: "001010210210212021021200" },
  { label: "English sentence", text:
      "she sells sea shells by the sea shore. the shells she sells are sea shells " +
      "for sure. if she sells shells on the sea shore then the shells she sells " +
      "are sea shore shells." },
  { label: "Random bytes", text:
      "SWRl[}J/V?L}z>+|X<[WFOIM>Mo;!TyW7~aPz$YBxf1~|S*uFYIY?YkuhY@>nKU{*3yP]3.GjL" +
      "6<{x[DX/4/yc44rXif|n+xyvF^a/r3oA*Wdkk*X<iuh@q }$,rZ}a!A2NVH1wG4l+zBmpgxwH" +
      "1)+O+7=.ChVw1;{HoaiaxIt&mId6Ctj%g<seK< tt4V4ldzO2So:2@2Xj/ )-" },
] as const;

/** One parse plus the three target checks that read it. */
function stats(text: string, e: number) {
  const t = text.slice(0, MAX_N);
  const ph = parse(t, 2 ** e);
  const triple = e + FIXED_BITS;
  const n = t.length, out = ph.length * triple, raw = 8 * n;
  return {
    t, n, ph, triple, out, raw,
    ratio: out > 0 ? raw / out : 1,
    met: [n >= 200 && raw > 10 * out, n >= 200 && out > raw, n >= 1 && n <= 8 && out <= raw],
  };
}

/** Opening step: the longest match whose source still fits on the strip. */
function bestStep(text: string, e: number): number {
  const ph = stats(text, e).ph;
  let b = 0, bv = -1;
  ph.forEach((p, i) => {
    const v = p.d > 0 && p.d + p.l <= VIS - 4 ? p.l : 0;
    if (v > bv) { bv = v; b = i; }
  });
  return b + 1;
}

type State = { text: string; e: number; step: number; hit: boolean[] };

/** Any change re-scores the targets, and a target stays ticked once met. */
function apply(s: State, patch: Partial<State>): State {
  const next = { ...s, ...patch };
  const { ph, met } = stats(next.text, next.e);
  return {
    ...next,
    step: Math.min(Math.max(1, next.step), Math.max(1, ph.length)),
    hit: s.hit.map((h, i) => h || met[i]),
  };
}

export default function LZ77Window() {
  // D3: opens on the 1977 paper's own ternary string — five triples for
  // twenty-four symbols, sitting on the phrase that copies eight symbols
  // from seven back.
  const [s, setS] = useState<State>(() => ({
    text: PRESETS[0].text, e: 8, step: bestStep(PRESETS[0].text, 8), hit: [false, false, false],
  }));
  const { text, e, step, hit } = s;
  const { t, n, ph, triple, out, raw, ratio, met } = stats(text, e);
  const W = 2 ** e, T = ph.length, k = Math.min(step, Math.max(1, T)) - 1;
  const cur: Phrase | undefined = ph[k];
  const preset = PRESETS.findIndex((p) => p.text === text);
  const rate = n > 0 ? out / n : 0, lo = Math.min(rate, 8);
  const size = n === 0 ? "no input" : ratio >= 1
    ? `${ratio.toFixed(1)}× smaller` : `${(1 / ratio).toFixed(2)}× larger`;

  // The strip is anchored so the current phrase ends four cells from the right.
  const vs = cur ? Math.max(0, Math.min(n - VIS, cur.start + cur.l + 4 - VIS)) : 0;
  const x = (i: number) => (i - vs) * CELL;
  const src = cur && cur.d > 0 ? cur.start - cur.d : -1;
  const band = (a: number, b: number, fill: string, opacity: number) => {
    const lo2 = Math.max(a, vs), hi = Math.min(b, vs + VIS);
    return hi > lo2 ? (
      <rect x={x(lo2)} y={STRIP_Y} width={(hi - lo2) * CELL} height={STRIP_H} fill={fill} opacity={opacity} />
    ) : null;
  };

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((p) => p.label)}
        activeIndex={preset === -1 ? null : preset}
        onSelect={(i) => setS((st) => apply(st, { text: PRESETS[i].text, step: bestStep(PRESETS[i].text, st.e) }))}
      />
      <TargetList
        targets={[
          ["1. Shrink an input of 200 characters or more by more than 10×",
            `${n} characters · ${T} triples · ${size}`],
          ["2. Make an input of 200 characters or more come out larger than it went in",
            `${out} bits out vs ${raw} bits in · ${out >= raw ? "+" : ""}${out - raw} bits`],
          ["3. Break even — output no larger than input — on 8 characters or fewer",
            `${n} characters: ${out} out vs ${raw} in · one triple costs ${triple} bits`],
        ].map(([label, detail], i) => ({ label, detail, met: met[i], latched: hit[i] }))}
      />
      <TextArea label="text to compress" value={text} ariaLabel="Text for the LZ77 coder to parse"
        onChange={(v) => setS((st) => apply(st, { text: v }))} />
      <Slider label="window W" value={e} min={4} max={12} step={1}
        onChange={(v) => setS((st) => apply(st, { e: v }))}
        display={`${W} chars · ${e}-bit pointer`} ariaLabel="Window length, as a power of two"
        ariaValueText={`window ${W} characters, pointer field ${e} bits, triple ${triple} bits`} />
      <Readout>
        {T === 0 ? <>type text above to parse it</> : (
          <>
            <strong>{T} triples</strong> × {triple} bits = <strong>{out} bits</strong> against{" "}
            {raw} raw bits — <strong>{size}</strong>
            {text.length > MAX_N && <span className="pl-2 text-faint">first {MAX_N} characters</span>}
          </>
        )}
      </Readout>

      {/* raw bytes as the line to beat: an expanding parse overshoots it */}
      <BitsBar max={12} floorColor={BLUE} gapColor={AMBER} infColor={WARN}
        rows={[
          { label: "LZ77 triples", floorLabel: "winner", floor: lo, gapLabel: "excess", gap: rate - lo },
          { label: "raw 8-bit bytes", floorLabel: "winner", floor: lo, gapLabel: "excess", gap: 8 - lo },
        ]} />

      {cur && (
        <>
          <Slider label="parse step" value={k + 1} min={1} max={Math.max(1, T)} step={1}
            onChange={(v) => setS((st) => ({ ...st, step: v }))}
            display={`${k + 1} / ${T}`} ariaLabel="Which triple to show"
            ariaValueText={`triple ${k + 1} of ${T}, distance ${cur.d}, length ${cur.l}, literal ${cur.ch}`} />
          <Readout>
            emitted at position {cur.start + 1}:{" "}
            <strong>({cur.d}, {cur.l}, &lsquo;{cur.ch === " " ? "·" : cur.ch}&rsquo;)</strong> — covers{" "}
            {cur.l + 1} character{cur.l === 0 ? "" : "s"} for {triple} bits
          </Readout>
          <svg viewBox={`0 0 ${VW} 96`} className="mt-1 w-full" role="img"
            aria-label={`Triple ${k + 1} of ${T} at position ${cur.start + 1}: distance ${cur.d}, length ${cur.l}, literal ${cur.ch}`}>
            <text x="0" y="10" fontSize="10" fill="currentColor">
              {T} triples over {n} characters, one block per triple
            </text>
            {/* phrase map: the whole parse, each block as wide as the text it covers */}
            {ph.map((p, j) => (
              <rect key={p.start} x={(p.start / n) * VW} y={MAP_Y} width={Math.max(0.6, ((p.l + 1) / n) * VW)}
                height={MAP_H} fill={p.l > 0 ? BLUE : AMBER} opacity={j === k ? 1 : 0.5}
                stroke={j === k ? "currentColor" : "none"} />
            ))}
            {band(Math.max(0, cur.start - W), cur.start, BLUE, 0.12)}
            {cur.d > 0 && band(src, src + cur.l, BLUE, 0.4)}
            {cur.l > 0 && band(cur.start, cur.start + cur.l, AMBER, 0.4)}
            <rect x={x(cur.start + cur.l)} y={STRIP_Y} width={CELL} height={STRIP_H} fill="none"
              stroke="currentColor" strokeDasharray="3 2" />
            {Array.from({ length: Math.max(0, Math.min(VIS, n - vs)) }, (_, j) => vs + j).map((i) => (
              <text key={i} x={x(i) + CELL / 2} y={STRIP_Y + 14} textAnchor="middle" fontSize="10"
                fontFamily="ui-monospace, monospace" fill="currentColor">{t[i] === " " ? "·" : t[i]}</text>
            ))}
            {/* the copy: an arc from the earlier occurrence, or a marker if it is off the strip */}
            {cur.d > 0 && (src >= vs ? (
              <>
                <path fill="none" stroke="currentColor"
                  d={`M ${x(src) + CELL / 2} ${STRIP_Y} Q ${(x(src) + x(cur.start)) / 2 + CELL / 2} ${ARC_TOP - 8} ${x(cur.start) + CELL / 2} ${STRIP_Y}`} />
                <text x={(x(src) + x(cur.start)) / 2 + CELL / 2} y={ARC_TOP - 12} textAnchor="middle"
                  fontSize="10" fill="currentColor">d={cur.d}, ℓ={cur.l}</text>
              </>
            ) : (
              <text x="0" y={ARC_TOP + 4} fontSize="10" fill="currentColor">
                ← source {cur.d} back, off this strip (d={cur.d}, ℓ={cur.l})
              </text>
            ))}
            <text x="0" y={STRIP_Y + STRIP_H + 11} fontSize="9" fill="currentColor">
              from position {vs + 1}; shaded = window (W = {W})
            </text>
            <text x={x(cur.start + cur.l) + CELL / 2} y={STRIP_Y + STRIP_H + 11} textAnchor="middle"
              fontSize="9" fill="currentColor">literal</text>
          </svg>
        </>
      )}

      <p className="pt-1 text-xs text-faint">
        Blue = the window and the earlier copy of the match; amber = the symbols this triple writes,
        and triples that matched nothing; dashed = the literal byte every triple carries. Every triple
        costs the same {triple} bits whether it covers 1 character or {LMAX + 1}. No preset reaches
        target 1 or 3 — those you have to type.
      </p>
    </Panel>
  );
}
