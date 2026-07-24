# Research brief: source-coding-theorem-lite (The source coding theorem)

status: planned
module: coding
type: core
goal: Explain why no lossless code can average fewer bits per symbol than the entropy.

Restructure note: prerequisites are now `huffman-by-hand` and
`entropy-as-average-surprise` (the Kraft achievability engine moved to its own
`kraft-inequality` lesson, upstream of Huffman). This lesson also formally
introduces the `typical-set` concept (the AEP/typical-set argument in point 4),
which the noisy-channel-coding lesson later reuses for joint typicality.

## Sources to consult

- Cover & Thomas, **§5.3 "Optimal Codes"** and **§5.4 "Bounds on the Optimal
  Codelength"** — the derivation `L ≥ H(X)` via the Kraft budget and the
  **wrong-code / mismatch identity** `L = H(p) + D(p||q) + (Kraft slack)`, where
  `q(x) = 2^{-l(x)} / Σ 2^{-l}`. Theorem 5.4.1 gives `H(X) ≤ L* < H(X)+1`. This
  §5.4 identity is the conceptual spine reused in the ML module.
- MacKay, **ch. 4 "The Source Coding Theorem"** — the block-coding version via
  the **typical set** and the asymptotic-equipartition idea (raw vs. essential
  bit content, `H_delta`), showing per-symbol cost -> `H` as block length grows.
  Use MacKay for the "block coding closes the gap" half.
- Shannon 1948, Part I, **Theorem 9** (the noiseless coding theorem) — the
  original statement that `H` is the achievable limit.

## Key points the lesson must cover

1. **Every prefix code implicitly bets on a distribution** `q(x) = 2^{-l(x)}`
   (normalized): assigning length `l(x)` is assigning probability `2^{-l(x)}`.
   The Kraft budget is why these `q` sum to ≤ 1.
2. **Expected length decomposes**: `L = Σ p(x) l(x) = H(p) + D(p||q) + slack`.
   Since `D(p||q) ≥ 0` (Gibbs, forward-ref to `kl-divergence`) and slack ≥ 0,
   `L ≥ H(p)`, with equality only when `q = p` and lengths are exactly
   `-log2 p(x)` (dyadic case). This is the theorem's lower half.
3. **Achievability**: the Shannon code `l(x) = ⌈-log2 p(x)⌉` satisfies Kraft and
   gives `L < H(p)+1` — the same 1-bit gap Huffman achieves.
4. **Block coding closes the gap**: coding blocks of `n` symbols at once spreads
   the ≤1-bit overhead over `n` symbols, so per-symbol cost `-> H` as `n -> ∞`
   (typical-set argument, stated not fully proved — this is the "lite" version).
5. Statement of the **source coding theorem**: the minimum achievable expected
   bits per symbol equals the entropy `H(X)` (entropy rate for sources with
   memory, forward-ref `entropy-of-english`).
6. Ties the module together: Kraft (achievability of lengths) + entropy (the
   floor) = no lossless code beats `H`.

## Pitfalls / subtleties to flag

- The "bet on q" framing is the load-bearing idea and the bridge to the ML
  module — make it explicit, it is where cross-entropy and KL come from.
- "Lite" = the block-coding limit is asserted via the typical set, not proven
  with full AEP machinery. Say so; do not overclaim a proof.
- The bound is on **expected** length over the true `p`; a particular message can
  be shorter or longer. Lossless, symbol-by-symbol independence assumed for the
  single-symbol version.
- Distinguish the **per-symbol** 1-bit overhead of symbol codes from the
  **vanishing** per-symbol overhead of block codes — this is exactly the flaw
  Huffman-by-hand left open.
- `H` here is the source's entropy; for sources with dependence the floor is the
  entropy *rate*, lower than the single-symbol `H`. Flag, defer.

## FIGURE PLAN

1. **single `<Figure>` (component)** — "a code is a bet": a codeword-length table
   beside the implied `q(x) = 2^{-l(x)}` bars, next to the true `p(x)` bars, with
   the mismatch highlighted. One idea: lengths are a probability model.
   Inspiration: Cover & Thomas §5.4 framing.
2. **single `<Figure>` (component)** — the decomposition `L = H(p) + D(p||q)`
   dissected: a stacked bar, the `H(p)` floor in one color and the wasted
   `D(p||q)` extra on top, with the label "extra bits from betting wrong". One
   idea: cost = floor + mismatch. Forward-binds to kl-divergence.
3. **`<FigureSequence>` (5 frames)** — the block-coding gap shrinking: block size
   `n = 1,2,4,6,8` on a 0.9/0.1 coin, each frame plots best-achievable
   bits/symbol dropping toward the entropy line `H ≈ 0.47`. This is the
   BlockCodingGap demo static; delta = block size per frame. Inspiration: MacKay
   ch. 4 typical-set convergence.
4. **single `<Figure>` (component)** — the typical set, schematically: the space
   of length-`n` sequences with a shaded "typical" region of size `~2^{nH}` that
   carries almost all probability; atypical sequences outside, nearly never seen.
   One idea: only `2^{nH}` sequences matter, so `nH` bits suffice. Inspiration:
   MacKay's typical-set figure (ch. 4).
5. **single `<Figure>` (component)** — the Shannon code `l(x) = ⌈-log2 p(x)⌉`:
   the real `-log2 p` values rounded up to integers, the rounding gap shaded, its
   total bounded by 1 bit. One idea: rounding costs less than a bit.
6. **single `<Figure>` (component)** — module capstone: a number line with `H`
   marked as a hard wall, Huffman/Shannon codes landing in `[H, H+1)`, and block
   codes converging onto `H` from the right. One idea: `H` is the floor nothing
   crosses.
