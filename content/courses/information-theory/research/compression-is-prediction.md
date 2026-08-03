# Research brief: compression-is-prediction (Compression as prediction)

status: drafted (kept slug — revise, do not rewrite)
module: information-in-ml
type: synthesis
goal: Explain why a better predictive model is exactly a better compressor, and vice versa.
est_minutes: 34

## ARC

- **Inherits:** cross-entropy as an expected code length (`cross-entropy-loss`),
  a coder that consumes arbitrary per-symbol probabilities (`arithmetic-coding`),
  and the measured entropy rate of a real source (`entropy-of-english`).
- **Spine step:** step 7, *The price of a wrong model*.
- **Contributes:** the two-way construction. Given a model, build a compressor;
  given a compressor, read off a model. Not an analogy — an algorithm in each
  direction.
- **Hands off to:** `kolmogorov-complexity` (what happens when the model is
  allowed to be any program) and `language-models-as-compressors` (the
  measurement).

## Sources to consult

- **Delétang et al. 2024, §2** — the predictor/compressor equivalence stated
  precisely, with eq. 2 (cross-entropy = expected code length) and the
  arithmetic-coding construction; also §2's "Universal Coding" paragraph tying
  the ceiling to Solomonoff and Kolmogorov.
- MacKay, **ch. 6** — stream codes as the practical realisation, and §6.5's
  benchmark tables (a simple Laplace-model arithmetic coder against gzip,
  compress, bzip2, ppmz on a text file and a sparse binary file, with actual
  sizes and times).
- Witten, Neal & Cleary 1987 — the model/coder interface, already established in
  `arithmetic-coding`; cite by `<Ref>`, do not re-derive.
- Cover & Thomas, **§13.2-13.3** — universal coding and the sequential
  probability assignment view; **§6.5** for the gambling/compression duality if
  a starred section wants it.
- Polyanskiy & Wu, **§9.5** — the Krichevsky-Trofimov "add 1/2" sequential
  assignment, the principled version of the adaptive counting model the lesson
  builds.

## Key points the lesson must cover

1. **Direction one: model → compressor.** A model that assigns `q(x_t | x_{<t})`
   plus an arithmetic coder gives a lossless compressor whose output length is
   `Σ_t -log2 q(x_t | x_{<t})` plus at most two bits. Nothing else is required.
   Build it explicitly on a short string.
2. **Direction two: compressor → model.** Any lossless compressor `C` defines
   `q(x) = 2^{-|C(x)|}` (normalized), and Kraft guarantees the total is at most
   one. So a compressor cannot avoid having a probability model; it can only
   avoid admitting to it. Work the reverse on a small code table.
3. **The equality.** Expected compressed size per symbol equals the
   cross-entropy of the model against the source. Therefore a lower loss is a
   smaller file, exactly, and the two objectives are the same objective in
   different units.
4. **Adaptivity is free.** If the model updates on the symbols already
   transmitted, the decoder can run the identical update, so no header is
   needed. This is why online models beat two-pass ones at equal quality, and it
   is the sentence `minimum-description-length` will complicate.
5. **A worked ladder.** On one paragraph of English, measure: uniform bytes
   (8 bits/char), letter frequencies (~4.1), bigram (~3.3), and the ~1 bit/char
   entropy-rate estimate from module 1. Each row is a model and a file size.
   This is the same ladder as `entropy-of-english`, now with the coder attached
   — a deliberate spiral revisit.
6. **The scoreboard is honest.** Compression ratio is a held-out, non-gameable
   measure of model quality: no hyperparameter of the evaluation, no arbitrary
   metric choice. Say why this matters, briefly.

## Pitfalls / subtleties to flag

- The equivalence is per stream and in expectation. A single file can be
  compressed below its model's cross-entropy by luck.
- The compressor must be lossless for the correspondence to hold. Lossy
  compressors correspond to something else — `rate-distortion`, later.
- A model's size counts if it must be transmitted. The adaptive construction
  dodges this; a model with 70 billion parameters does not, and that tension is
  deferred to `minimum-description-length`. Name the debt here.
- `q(x) = 2^{-|C(x)|}` may sum to less than one (Kraft slack), so the induced
  model is a sub-probability. Say so; the slack is wasted bits.
- Do not claim gzip "is" a model in a useful sense — the induced distribution is
  intractable to evaluate. The construction is a proof of existence, not a
  practical extraction.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the two-way arrow: MODEL ⇄ COMPRESSOR, with
   the construction in each direction written under its arrow (arithmetic coder
   one way, `2^{-|C(x)|}` the other). One idea: the correspondence is
   constructive both ways.
2. `draw:` **`<FigureSequence>` (4 frames)** — compressing a short string with an
   adaptive model: each frame shows the current counts, the predicted
   distribution, the symbol arriving, the bits charged, and the counts updated.
   Delta = one symbol per frame. Binds the PredictiveCompressor demo.
3. `draw:` **single `<Figure>`** — the ladder: four bars for uniform, monogram,
   bigram and entropy-rate models on the same paragraph, each labelled with
   bits/char and the resulting file size in bytes. One idea: a better model is
   a smaller file, measured.
4. `draw:` **single `<Figure>`** — the adaptive-versus-two-pass comparison: two
   bitstreams drawn to scale, one with a header block shaded and one without,
   with the crossover file size annotated. One idea: the header is the price of
   not being adaptive.
5. `draw:` **single `<Figure>`** — the Kraft slack in a real compressor: the
   induced `q` bars summing to less than one, with the deficit shaded "wasted".
   One idea: every compressor is a bet, and a sloppy one leaves money on the
   table.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* Given a per-symbol model and a 12-symbol message, compute the
   arithmetic-coded length and the cross-entropy, and confirm they agree to
   within two bits.
2. **Boundary probe.** Apply the construction to a model that assigns
   probability 1 to the observed symbol at every step. Report the file size,
   then explain what such a model implies about the source and why it is
   unattainable for any source with positive entropy rate.
3. **Claim to refute.** "gzip compresses this file to 30%, so the file's entropy
   rate is about 2.4 bits per byte." Give two reasons the inference is invalid,
   one about the direction of the inequality and one about what gzip's model can
   represent.
4. **Derivation the lesson skipped.** Show that for any uniquely decodable code
   `C`, the induced `q(x) = 2^{-|C(x)|}` satisfies `Σ q ≤ 1`, and hence that no
   compressor can beat the entropy in expectation. State which earlier theorem
   is doing the work.
5. **Research-shaped.** Build the ladder yourself: on a text file of at least
   10 KB, compute the compressed size under a uniform model, a letter-frequency
   model and a bigram model with a small smoothing constant. Report four numbers
   (the three plus gzip) and state which model gzip's performance sits between.
6. **Mixed review (E3).** You are given two models and one test stream. Decide
   which model compresses better *without* running the coder, then run it and
   check. State what quantity you compared.
7. **FORWARD (E7).** Your bigram model needs a table of 26x26 counts. Estimate
   the bits required to transmit that table alongside the compressed file, and
   compute the total. Then find the file size at which the bigram model stops
   paying for itself against the monogram model. Reaches
   `minimum-description-length` — the solution names the two-part code and
   `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph; and `arithmetic-coding` now available as a prerequisite. The
  current draft has to hand-wave the coder because arithmetic coding did not
  exist in the syllabus — it now does, and the construction should be stated
  concretely with a `<Ref>` rather than described.
- Direction two (compressor → model) given equal weight; the current draft is
  lopsided toward direction one.
- Figures 1, 4, 5 above.
- The explicit debt to `minimum-description-length` about model size, stated as
  an open question rather than left silent.
- Depth toward 34 minutes.

**Lose**
- Any claim that the correspondence is approximate or metaphorical.
- Restating the equality in a callout after deriving it (L15).
