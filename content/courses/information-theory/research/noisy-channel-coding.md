# Research brief: noisy-channel-coding (The noisy-channel coding theorem)

status: planned
module: channels
type: core
goal: Explain why capacity is the exact threshold between reliable and unreliable communication.

New lesson. The headline theorem of the field: capacity is not a soft trade-off
but a sharp threshold. Below C, error can be driven to zero; above C, error is
bounded away from zero. This is the "explain-level" lesson — state the theorem,
sketch achievability (random coding + joint typicality) and the converse (Fano),
and ground it with the Hamming (7,4) code as a concrete finite construction.

## Sources to consult

- Shannon 1948, **Part II, §13 "The Fundamental Theorem for a Discrete Channel
  with Noise"** (Theorem 11, the coding theorem and converse; random-coding
  argument), **§14** (redundancy already in the source helps), **§17** (the
  Hamming (7,4) single-error-correcting code reaching capacity blockwise).
- Cover & Thomas, **§7.5-7.7** — definitions of a code/rate, jointly typical
  sequences, the channel coding theorem (Theorem 7.7.1) via random coding;
  **§7.9 "Fano's Inequality and the Converse"**; **§7.11 "Hamming Codes"**.
- MacKay, **ch. 9-10** — §9.6-9.7 statement and intuitive typical-set preview,
  ch. 10 the full random-coding + joint-typicality proof and the converse; ch. 1
  introduces the (7,4) Hamming code and repetition codes as a first taste.
- Polyanskiy & Wu, **ch. 14-16** (achievability bounds, Fano converse), **ch. 20
  §20.3** (dispersion — why the threshold is sharp at finite blocklength).
- Arıkan 2009 (arXiv:0807.3917) — one-sentence modern payoff: explicit
  capacity-achieving polar codes exist (the 5G lineage). Attribute the 5G
  framing to later work, not to Arıkan's paper.

## Key points the lesson must cover

1. **Setup**: a rate-R blocklength-n code maps `2^{nR}` messages to length-n
   inputs; decode the noisy output; error = wrong message. The question is which
   rates R admit codes with error → 0 as n → ∞.
2. **The theorem** (statement): for a discrete memoryless channel of capacity C,
   every rate `R < C` is achievable (codes exist with error → 0) and no rate
   `R > C` is (error bounded away from 0). Capacity is the threshold.
3. **Achievability, sketched** (framework-first, then the trick): a single code
   is hard to analyze; average over **random codebooks**. Encode `2^{nR}`
   messages as random length-n inputs; decode by **joint typicality** (pick the
   message whose codeword is jointly typical with the output). The typical set
   has `~2^{nH}` members; a wrong codeword is jointly typical only with
   probability `~2^{-nI(X;Y)}`, and with `2^{nR}` competitors the union bound
   gives error → 0 when `R < I(X;Y)`, maximized at C. State, do not fully prove.
4. **Converse, via Fano**: Fano's inequality `H(W|Ŵ) ≤ 1 + Pe·log(2^{nR})`
   bounds how much the decoder can still not know when it errs; combined with
   `I(W;Ŵ) ≤ nC` (data-processing along the code → channel → decoder chain) it
   forces `Pe` bounded below once `R > C`. Introduce Fano here; lean on the
   data-processing inequality from the prior lesson for `I(W;Ŵ) ≤ nC`.
5. **A concrete code**: the **Hamming (7,4)** code — 4 data bits, 3 parity bits,
   corrects any single-bit error; rate 4/7 ≈ 0.571. Show the parity-check idea
   and that it beats naive repetition at the same rate. Note it is one point, not
   the theorem.
6. **What the theorem does and does not give**: it proves good codes *exist*
   (non-constructively) but the random-coding proof yields no usable code; modern
   explicit capacity-achieving codes (LDPC, turbo, polar/Arıkan) close that gap.
   One paragraph, precise.

## Pitfalls / subtleties to flag

- **Sharp threshold, not a trade-off**: below C error vanishes, above C it does
  not. The `<KeyFact>`. Resist "higher rate = more error" gradualism.
- The random-coding proof shows **existence in expectation**: if the average code
  is good, some code is at least as good. It names no code.
- **Blocklength → ∞** is essential; at finite n there is a soft transition
  (dispersion). Say the theorem is asymptotic; the demo shows the cliff
  sharpening with n.
- Fano bounds error from **below** in the converse; it is not a construction.
- The Hamming code is a single finite code at a fixed rate, corrects one error
  per block — it does not "achieve capacity" except in Shannon's specific
  blockwise-channel sense (§17). Do not overclaim.
- Capacity is per channel use; comparing to a source's entropy rate (source-
  channel separation) is a further result — one-sentence pointer, out of scope.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the coding pipeline: message W →
   encoder → length-n channel input → noisy channel → output → decoder → Ŵ, with
   rate `R = (log #messages)/n` labeled. One idea: coding spreads a message over
   many channel uses. Inspiration: MacKay ch. 9.1 big-picture diagram.
2. **single `<Figure>` (component)** — the threshold: achievable error vs rate,
   a curve pinned near 0 for `R < C` and rising to a floor for `R > C`, the wall
   at C marked. Static twin of the ChannelCodingThreshold demo. One idea: C is a
   cliff. Inspiration: Cover & Thomas coding-theorem region / Polyanskiy §20.
3. **`<FigureSequence>` (3-4 frames)** — joint-typicality decoding: frame 1 the
   received y; frame 2 the true codeword sitting in y's jointly-typical shell;
   frames 3-4 random wrong codewords, almost all outside the shell, one rare
   collision — union-bounded away as n grows. One idea: only the true codeword is
   jointly typical. Inspiration: MacKay ch. 10 typicality picture (recreate).
4. **single `<Figure>` (component)** — the converse, schematic: the chain
   `W → X^n → Y^n → Ŵ` with `I(W;Ŵ) ≤ nC` (data-processing) over it and Fano's
   `Pe` bound underneath, meeting at "`R > C` ⇒ `Pe` cannot vanish". One idea:
   capacity cannot be crossed. Inspiration: Cover & Thomas §7.9.
5. **single `<Figure>` (component)** — Hamming (7,4): the 4 data bits, 3 parity
   bits, and the three overlapping parity circles (the classic Venn), with a
   single flipped bit localized by which parities fail. One idea: three checks
   pinpoint one error. Inspiration: MacKay ch. 1 / Cover & Thomas §7.11
   (recreate the Venn, do not copy).
6. **single `<Figure>` (component)** — random-vs-repetition at rate 4/7: a tally
   comparing repetition-code error to the Hamming code's on a BSC, payoff
   "structure beats brute redundancy". One idea: how you add redundancy matters.
   Inspiration: MacKay ch. 1 error-vs-rate curves.
7. **`<FigureSequence>` (3 frames)** — the cliff sharpening: error-vs-rate for
   n = 10, 100, 1000, the transition around C steepening each frame toward a
   step. One idea: the sharp threshold is the n → ∞ limit. Inspiration:
   finite-blocklength/dispersion (Polyanskiy ch. 20).
