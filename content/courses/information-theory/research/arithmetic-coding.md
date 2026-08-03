# Research brief: arithmetic-coding (Arithmetic coding)

status: planned (NEW lesson)
module: coding
type: core
goal: Construct an arithmetic code for a message and explain why its overhead is two bits per message rather than one bit per symbol.
est_minutes: 36

## ARC

- **Inherits:** the proved floor `L ≥ H` and the observed
  `H ≤ L_Huffman < H + 1` (`source-coding-theorem-lite`, `huffman-by-hand`).
- **Spine step:** "The one-bit gap and the known-distribution requirement were
  assumptions, not necessities: arithmetic coding spends fractional bits,
  Lempel-Ziv learns the source while reading it, and shipped formats combine
  both." (step 4, *Dropping the assumptions*, 1977–2021)
- **Contributes:** a coder whose total overhead is two bits **per message**, and
  the separation of model from coder — which is exactly what makes
  `compression-is-prediction` a construction rather than an analogy.
- **Hands off to:** `dictionary-coding` (which drops the other assumption) and,
  across the course, to `compression-is-prediction` and
  `language-models-as-compressors`, both of which need a coder that can consume
  an arbitrary per-symbol probability.

## Sources to consult

- **Witten, Neal & Cleary 1987** (primary) — the whole paper. In order of use:
  the Huffman critique (p. 520-521); the "eaii!" decimal worked example and
  Table I model (p. 521-523, and the interval figures 1a/1b); the idealized
  pseudocode (fig. 2, p. 523); the finite-precision correctness proof (p. 532-533
  and the appendix); the underflow problem and the E3 middle-half fix with the
  condition `Max_frequency ≤ (Top_value+1+1)/4` (p. 533-534, fig. 5); the
  word-length constraints `f ≤ c-2`, `f+c ≤ p` (p. 534-535); the
  three-source-of-overhead efficiency analysis (p. 536); and the head-to-head
  against UNIX `compact` (Table IV, p. 538).
- MacKay, **ch. 6 §6.2-6.3** — the nested-interval construction, the worked
  "bbba2" bent-coin encoding, and Dasher (an inverted arithmetic coder used as a
  gaze-driven text entry system, ~25 words/minute hands-free).
- Cover & Thomas, **§13.3** — the ternary worked example on
  `p = (0.4, 0.4, 0.2)` encoding "ACAA" into `[0.32, 0.3328)` and a 9-bit
  codeword.
- Polyanskiy & Wu, **§9.1** — arithmetic coding as the dyadic-interval
  construction with the sequential `F_n` recursion.

## Key points the lesson must cover

1. **The flaw, restated precisely.** A symbol code must spend `⌈-log2 p⌉` bits.
   For a symbol with `p = 0.99`, that is 1 bit against 0.0145 bits of
   information — a factor of 69. Blocking fixes it only by paying `|X|^n`
   table entries. Open here.
2. **The construction.** Start with `[0,1)`. Each symbol replaces the current
   interval with the sub-interval its cumulative probabilities define. After
   `n` symbols the width is exactly `p(x_1…x_n)`.
3. **The cost.** Any interval of width `w` contains a dyadic interval of width
   at least `w/4`, so `⌈-log2 w⌉ + 1` bits suffice to name a point inside it.
   Total cost is within 2 bits of `-log2 p(message)` — *for the whole message*,
   not per symbol.
4. **Worked example** — reproduce the paper's "eaii!" trace in decimal on the
   model `{a:.2, e:.3, i:.1, o:.2, u:.1, !:.1}`, narrowing to
   `[0.23354, 0.2336)`, then decode it back symbol by symbol. Note the authors'
   own observation that this example *expands* the message because the model is
   bad, and that the entropy of the same message under a better single-character
   model is 2.89 decimal digits against 4.22 — a clean statement that
   compression quality is the model's job.
5. **The end-of-message problem**: without an explicit EOF symbol the decoder
   does not know when to stop.
6. **Finite precision**: the interval must be renormalized as its high bits
   settle, and the underflow case (low and high converging around Half without
   agreeing) needs the E3 middle-half expansion with a pending-bit counter.
   State the fix and the `Max_frequency` condition; do not derive the full
   inequality algebra.
7. **Model/coder separation.** The coder consumes a cumulative-frequency table
   per symbol and knows nothing else. The model can be adaptive, context
   dependent, or a neural network. This is the sentence the ML module returns to.

## Pitfalls / subtleties to flag

- The 2-bit overhead is per **message**, and this is the whole point. Do not let
  it be read as per symbol.
- Arithmetic coding is not "better than Huffman at compressing" in the abstract:
  given the same model, it removes the rounding loss. With a bad model it is as
  bad as anything else.
- The interval arithmetic in the worked example is decimal for legibility; real
  implementations are binary and integer. Say so once.
- Underflow is not a rounding nuisance — unhandled, it makes some symbols
  unencodable. Worth one sentence of gravity.
- Patents encumbered arithmetic coding through the 1990s, which is a real reason
  DEFLATE uses Huffman. Mention once, in the hand-off, without editorializing.

## FIGURE PLAN

1. `draw:` **`<FigureSequence>` (5-6 frames)** — the interval narrowing for
   "eaii!": each frame shows the current interval subdivided by the model, the
   chosen sub-interval highlighted, and the running width and bit count.
   Frame deltas change exactly one thing. Inspiration: Witten et al. fig. 1a/1b,
   redrawn with the scale re-expanded at each step.
2. `draw:` **single `<Figure>`** — the cost identity: a bar of width
   `p(message)` on a `[0,1)` axis with `-log2 w` marked, and the dyadic grid
   overlaid showing the largest dyadic interval that fits — the picture behind
   "2 bits of slack".
3. `draw:` **single `<Figure>`** — Huffman against arithmetic on a 0.99/0.01
   source over a 10-symbol message: two bit-count tallies side by side (10 bits
   against about 2.1), with the per-symbol and per-message overheads labelled
   separately. One idea: the overhead moved from per-symbol to per-message.
4. `draw:` **`<FigureSequence>` (3 frames)** — decoding: given the final number,
   each frame asks which sub-interval contains it, emits a symbol, and rescales.
   The mirror of figure 1.
5. `draw:` **`<FigureSequence>` (3 frames)** — renormalization and underflow:
   frame 1 the interval settling its top bit and shifting out; frame 2 the
   underflow case straddling Half; frame 3 the middle-half expansion with the
   pending-bit counter incremented. Inspiration: Witten et al. fig. 5.
6. `draw:` **single `<Figure>`** — the two-box architecture: MODEL (emits a
   cumulative frequency table) → CODER (emits bits), with the arrow labelled
   "the only interface". One idea: the coder is generic. This figure is
   referenced again in `compression-is-prediction` and
   `language-models-as-compressors`.
7. `source:` **arithmeticco-decode-code** → save as
   `figures/witten-1987-decoder.png`, float right in the finite-precision
   section. The reader must be able to read the variable names
   (`low`, `high`, `value`, `Half`, `First_qtr`, `Third_qtr`) and see that this
   is a page of published C, because the claim being made is that every later
   implementation descends from this listing. One sourced image.

## EXERCISE PLAN

1. *(warm-up)* Encode the two-symbol message "ae" under the paper's model and
   report the final interval and the number of bits required.
2. **Boundary probe.** Encode a message consisting of the most probable symbol
   repeated 20 times. Report the interval width, the bit cost, and the cost the
   same message would incur under a Huffman code. Then explain what happens to
   the arithmetic coder's cost as the probability of that symbol approaches 1,
   and why no symbol code can follow it there.
3. **Claim to refute.** "Arithmetic coding is optimal, so it always produces a
   shorter file than Huffman coding." Construct a case where the two produce the
   same length, and a case where arithmetic coding is longer, and name the
   condition that decides.
4. **Derivation the lesson skipped.** Prove the 2-bit bound: show that any
   interval of width `w` contains a dyadic interval of width at least `w/4`,
   and conclude the code length is below `-log2 w + 2`. State where the factor 4
   comes from.
5. **Error-diagnosis.** A student's encoder emits the correct interval but the
   decoder produces garbage after the fourth symbol. Given the symptom (the
   decoded prefix is right, then diverges, and the interval had been straddling
   Half), name the bug and the fix.
6. **Research-shaped.** Reproduce the paper's "eaii!" example exactly:
   report the final interval, the number of decimal digits, the entropy of the
   message under the given model, and the entropy under the single-character
   model fitted to the message itself (the paper reports 4.22 and 2.89 decimal
   digits). State what agreement you would accept.
7. **FORWARD (E7).** Encode a 30-character English sentence twice: once with a
   fixed letter-frequency model, once with a model that updates its counts after
   every character. Report both bit counts. Reaches
   `compression-is-prediction` and `dictionary-coding` — the solution notes that
   the adaptive coder pays no header and needs no prior knowledge of the source,
   and `<Ref>`s both.
