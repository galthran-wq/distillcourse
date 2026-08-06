"use client";

/**
 * ArithmeticInterval — the lesson's Table I model run as a race the reader can
 * win and lose. A typed message narrows the interval band by band and is priced
 * two ways at once: the bits an arithmetic coder actually emits (the shortest
 * dyadic cell inside the final interval, codeword shown) against the bits the
 * optimal Huffman code spends on the same symbols. The opening preset *loses*
 * by a bit, so "arithmetic coding wins" is something the reader has to go find
 * — the per-symbol overpay column is the clue (lesson: arithmetic-coding).
 */
import { useState } from "react";
import { Panel, PresetGroup, Readout, TargetList, TextArea } from "@/components/ui";

const SYMS = ["a", "e", "i", "o", "u", "!"] as const;
const TENTHS: Record<string, number> = { a: 2, e: 3, i: 1, o: 2, u: 1, "!": 1 };
// One optimal Huffman code for (.3,.2,.2,.1,.1,.1); expected length 2.50 bits.
const HUFF: Record<string, string> = { a: "111", e: "10", i: "010", o: "00", u: "011", "!": "110" };
const LOW: Record<string, number> = {};
let acc = 0;
for (const s of SYMS) { LOW[s] = acc; acc += TENTHS[s]; }

const MAX_LEN = 14; // 10^14: every integer below stays exact in a double
const ROWS = 7; // interval steps drawn before the ladder is summarised
const BLUE = "#4c8dd6"; // arithmetic: the interval and the bits it costs
const AMBER = "#e2903a"; // Huffman: the same message under integer lengths
const X0 = 40, X1 = 330, W = X1 - X0, RH = 30; // ladder geometry (SVG units)
const HEADS = ["symbol", "p", "model range", "−log₂p", "Huffman", "code − info"];

/** Exact interval after the message: [U/D, V/D) in integers, so no drift. */
function encode(msg: string) {
  let U = 0, V = 1, D = 1;
  for (const c of msg) {
    const w = V - U, q = LOW[c];
    [U, V, D] = [U * 10 + w * q, U * 10 + w * (q + TENTHS[c]), D * 10];
  }
  return { U, V, D };
}

/**
 * Shortest dyadic cell [m/2^k, (m+1)/2^k) inside [U/D, V/D) — the codeword the
 * coder actually emits. Doubling U with its remainder kept mod D (the
 * renormalisation the lesson describes) holds every intermediate under 2^53.
 */
function emit(U: number, V: number, D: number) {
  if (V - U >= D) return { k: 0, m: 0 }; // empty message: nothing to send
  let q = 0, r = U, w = V - U; // U*2^k = q*D + r, and w = (V-U)*2^k
  for (let k = 1; k <= 60; k++) {
    const t = 2 * r;
    q = 2 * q + (t >= D ? 1 : 0);
    r = t >= D ? t - D : t;
    w *= 2;
    const up = r > 0 ? 1 : 0;
    // floor(V*2^k/D) - floor(U*2^k/D) ≥ 1 above the cell starting at ceil(U*2^k/D)
    if ((w + r - ((r + w) % D)) / D - up >= 1) return { k, m: q + up };
  }
  return { k: 60, m: 0 };
}

const p = (s: string) => TENTHS[s] / 10;
const over = (s: string) => HUFF[s].length + Math.log2(p(s)); // Huffman − surprisal
const info = (msg: string) => [...msg].reduce((b, c) => b - Math.log2(p(c)), 0);
const width = (msg: string) => { const { U, V, D } = encode(msg); return (V - U) / D; };
const dec = (X: number, D: number, n: number) =>
  X >= D ? "1" : n === 0 ? "0"
    : ("0." + X.toString().padStart(n, "0")).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");

const PRESETS = [
  { label: "eaii! (Witten–Neal–Cleary)", text: "eaii!" },
  { label: "run of e (most probable)", text: "eeeeeeeeee" },
  { label: "alternating eo", text: "eoeoeoeo" },
] as const;

function score(raw: string) {
  const kept = [...raw].filter((c) => c in TENTHS);
  const msg = kept.slice(0, MAX_LEN).join("");
  const { U, V, D } = encode(msg);
  const { k, m } = emit(U, V, D);
  const h = [...msg].reduce((b, c) => b + HUFF[c].length, 0);
  return {
    msg, U, V, D, k, m, h, bits: info(msg), ignored: [...raw].length - msg.length,
    // The two targets the lesson's <Task> states, both on four-symbol messages.
    met: [msg.length === 4 && h - k > 1, msg.length === 4 && Math.abs(h - k) <= 0.1],
  };
}

type State = { raw: string; hit: boolean[] };
const commit = (s: State, raw: string): State => ({
  raw,
  hit: s.hit.map((h, i) => h || score(raw).met[i]),
});

export default function ArithmeticInterval() {
  // D3: opens on the paper's own example, already coded to the 15-bit codeword
  // the lesson derives by hand — and already losing to Huffman's 14 bits.
  const [{ raw, hit }, setS] = useState<State>({ raw: PRESETS[0].text, hit: [false, false] });
  const { msg, U, V, D, k, m, h, bits, ignored, met } = score(raw);

  const preset = PRESETS.findIndex((q) => q.text === raw);
  const shown = [...msg].slice(0, ROWS);
  const ladderH = shown.length * RH + 34;
  const x = (tenths: number) => X0 + (tenths / 10) * W;
  const max = Math.max(8, Math.ceil((Math.max(k, h, bits) + 1) / 4) * 4);
  const bx = (b: number) => 48 + (b / max) * 422;

  return (
    <Panel>
      <PresetGroup
        labels={PRESETS.map((q) => q.label)}
        activeIndex={preset === -1 ? null : preset}
        onSelect={(i) => setS((s) => commit(s, PRESETS[i].text))}
      />
      <TargetList
        targets={[
          ["1. Four symbols where arithmetic beats Huffman by more than one bit",
            `${msg.length === 4 ? `${msg}: ` : `${msg.length} symbols — `}arithmetic ${k} vs Huffman ${h}, gap ${h - k} (need 2)`],
          ["2. Four symbols where the two land within a tenth of a bit",
            msg.length === 4 ? `${msg}: ${Math.abs(h - k)} bits apart` : "scored on four-symbol messages"],
        ].map(([label, detail], i) => ({ label, detail, met: met[i], latched: hit[i] }))}
      />
      <TextArea label="message (alphabet a e i o u !)" value={raw} rows={2}
        onChange={(t) => setS((s) => commit(s, t))}
        ariaLabel="Message to encode, over the alphabet a e i o u and exclamation mark" />
      <Readout>
        {msg.length === 0 ? (
          <>the empty message is the whole interval [0, 1) — type an a e i o u or ! to narrow it</>
        ) : (
          <>
            interval <strong>[{dec(U, D, msg.length)}, {dec(V, D, msg.length)})</strong>, width{" "}
            {width(msg).toPrecision(2)} &middot; codeword{" "}
            <strong className="break-all">{m.toString(2).padStart(k, "0")}</strong> ={" "}
            <strong>{k} bits</strong> against Huffman&rsquo;s <strong>{h}</strong>
            {ignored > 0 && (
              <span className="pl-2 text-faint">
                ({ignored} ignored: outside the alphabet, or past the {MAX_LEN}-symbol limit)
              </span>
            )}
          </>
        )}
      </Readout>

      {/* the two costs on one bits axis, with the message's own information marked */}
      <svg viewBox="0 0 480 90" className="mt-2 w-full" role="img"
        aria-label={`Arithmetic ${k} bits, Huffman ${h} bits, message information ${bits.toFixed(2)} bits`}>
        <text x={Math.min(bx(bits), 340)} y="9" fontSize="9" fill="currentColor">
          −log₂w = {bits.toFixed(2)} bits of information
        </text>
        <line x1={bx(bits)} y1="12" x2={bx(bits)} y2="68" stroke="currentColor"
          strokeDasharray="4 3" opacity="0.7" />
        {[{ lab: "arith", v: k, c: BLUE, y: 16 }, { lab: "Huff", v: h, c: AMBER, y: 42 }].map((b) => (
          <g key={b.lab}>
            <text x="44" y={b.y + 13} textAnchor="end" fontSize="10" fill="currentColor">{b.lab}</text>
            <rect x="48" y={b.y} width={bx(b.v) - 48} height="18" rx="2" fill={b.c} />
            <text x={bx(b.v) + 5} y={b.y + 13} fontSize="11" fill="currentColor">{b.v} bits</text>
          </g>))}
        {Array.from({ length: max / 4 + 1 }, (_, i) => i * 4).map((b) => (
          <g key={b}>
            <line x1={bx(b)} y1="68" x2={bx(b)} y2="72" stroke="currentColor" />
            <text x={bx(b)} y="84" textAnchor="middle" fontSize="10" fill="currentColor">
              {b === max ? `${max} bits` : b}</text>
          </g>))}
      </svg>

      {/* the ladder: every row is the current interval redrawn at full width */}
      <svg viewBox={`0 0 480 ${ladderH}`} className="mt-1 w-full" role="img"
        aria-label={`Interval ladder for ${msg || "the empty message"}: ${shown.length} steps, final width ${width(msg).toPrecision(2)}`}>
        {SYMS.map((s) => (
          <text key={s} x={(x(LOW[s]) + x(LOW[s] + TENTHS[s])) / 2} y="12" textAnchor="middle"
            fontSize="10" fill="currentColor" opacity="0.8">{s}</text>))}
        <text x={X1 + 6} y="12" fontSize="9" fill="currentColor" opacity="0.8">model bands (fixed)</text>
        {shown.map((c, i) => {
          const y = 20 + i * RH, lo = x(LOW[c]), hi = x(LOW[c] + TENTHS[c]);
          return (
            <g key={i}>
              <text x={X0 - 5} y={y + 12} textAnchor="end" fontSize="11" fill="currentColor">{i + 1} {c}</text>
              {SYMS.map((s) => (
                <rect key={s} x={x(LOW[s])} y={y} width={x(TENTHS[s]) - X0} height="15" strokeWidth="0.5"
                  fill={s === c ? BLUE : "none"} stroke="currentColor" opacity={s === c ? 1 : 0.4} />))}
              <text x={X1 + 6} y={y + 12} fontSize="10" fill="currentColor">
                w = {width(msg.slice(0, i + 1)).toPrecision(2)} · {info(msg.slice(0, i + 1)).toFixed(2)} bits
              </text>
              {i + 1 < shown.length && [[lo, X0], [hi, X1]].map(([a, b]) => (
                <line key={a} x1={a} y1={y + 15} x2={b} y2={y + RH} stroke="currentColor" opacity="0.35" />))}
            </g>);
        })}
        {msg.length > ROWS && (
          <text x={X0} y={ladderH - 6} fontSize="10" fill="currentColor" opacity="0.8">
            …{msg.length - ROWS} more symbols narrow it to {width(msg).toPrecision(2)}
          </text>
        )}
      </svg>

      <div className="overflow-x-auto">
        <table className="mt-2 w-full text-xs">
          <thead><tr className="text-faint">
            {HEADS.map((t) => <th key={t} className="pb-1 text-left font-normal">{t}</th>)}
          </tr></thead>
          <tbody className="font-mono">
            {SYMS.map((s) => (
              <tr key={s}>
                <td>{s}</td><td>{p(s).toFixed(1)}</td>
                <td>[{(LOW[s] / 10).toFixed(1)}, {((LOW[s] + TENTHS[s]) / 10).toFixed(1)})</td>
                <td>{(-Math.log2(p(s))).toFixed(2)}</td><td>{HUFF[s]} ({HUFF[s].length})</td>
                <td className={over(s) > 0 ? "text-accent" : ""}>{over(s) > 0 ? "+" : ""}{over(s).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="pt-2 text-xs text-faint">
        The last column is what the symbol code overspends on each symbol: pile up the rows where it
        is positive. Ties in the Huffman merge leave two optimal 2.50-bit codes here; this is one of
        them. The coder prices exactly what you type — code the terminator `!` yourself when you want
        a decoder to be able to stop.
      </p>
    </Panel>
  );
}
