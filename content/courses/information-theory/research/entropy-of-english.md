# Research brief: entropy-of-english (Entropy of English text)

status: planned
module: shared-information
type: worked-practice
goal: Estimate the entropy of English text with Shannon's guessing game.

## Sources to consult

- **Shannon 1951, "Prediction and Entropy of Printed English"** — the primary
  source. The whole paper: the guessing-game experiment, the derivation of upper
  and lower bounds on the per-letter entropy from the distribution of guess
  ranks, and the ~1 bit/letter and ~50-75% redundancy conclusions.
- Cover & Thomas, **§6.4 "The Entropy of English"** (p. 168) and **§6.6
  "Gambling Estimate of the Entropy of English"** (p. 173) — the modern
  treatment, entropy-rate framing, and the gambling reformulation of Shannon's
  bounds. (Also relevant: **ch. 4 "Entropy Rates of a Stochastic Process", §4.2
  "Entropy Rate"** for the formal definition of the per-symbol limit.)
- Shannon 1948, Part I, **§3 "The Series of Approximations to English"** — the
  zero-order / first-order / digram / trigram / word approximations and the
  redundancy discussion; the ladder that motivates context reducing entropy.
- MacKay, **ch. 2, §2.1** (English monogram distribution, reused from the entropy
  lesson) and **ch. 6 "Stream Codes"** (why a good English model = good
  compressor, foreshadowing the ML module).

## Key points the lesson must cover

1. **Entropy rate** = per-symbol entropy given unlimited preceding context,
   `H_rate = lim_n H(X_n | X_1...X_{n-1})`. Context strictly lowers per-symbol
   uncertainty from the monogram `~4.1` bits toward `~1-1.3` bits/letter.
2. The **approximations ladder** (Shannon 1948 §3): uniform 26+space
   (`log2 27 ≈ 4.75`), monogram (`~4.1`), digram (`~3.3`), trigram (`~3.1`),
   word-level lower still — each conditioning step buys bits.
3. **Shannon's guessing game** (1951): a human predicts the next letter given the
   preceding text; the number of guesses until correct is recorded per position.
   The *distribution of guess-ranks* bounds the entropy rate — because an ideal
   predictor sharing the human's model could code each letter in
   `~ -log2 p(rank)` bits.
4. **Upper and lower bounds** from the guess-rank frequencies `q_i` (fraction of
   letters guessed right on the i-th try): Shannon's `F_N` bounds. The lesson can
   state the bounds and compute a rough estimate from a tally, not re-derive them
   fully.
5. **Redundancy** = `1 - H_rate / log2(alphabet)` ≈ 50-75%: the gap between a raw
   fixed-width encoding (ASCII's 8 bits, or `log2 27 ≈ 4.75`) and the entropy
   rate. This is why English compresses.
6. Worked in prose (no demo, per course.yaml): play the game on a short sentence,
   tally guess counts, convert to a bits-per-letter estimate; learner repeats.

## Pitfalls / subtleties to flag

- **Entropy rate vs. single-letter entropy**: the ~4.1-bit monogram figure is
  *not* the entropy of English; it ignores all inter-letter structure. The
  headline number (~1 bit) is the *rate*. Keep the two distinct — this is the
  lesson's central correction.
- The guessing game gives **bounds, not an exact value**; the estimate is
  model-dependent (depends on the predictor's skill) and corpus-dependent.
  Shannon's own estimate is a *range* (~0.6-1.3 bits/letter).
- Shannon's upper and lower bounds coincide only in the limit; a short tally
  gives a crude estimate — be honest about sample size.
- Alphabet choice matters (27 symbols vs. 26 vs. full ASCII with case and
  punctuation changes every number). State the alphabet.
- The game measures the entropy of *the predictor's model of English*, which
  upper-bounds the true rate; a better predictor gives a tighter (lower) estimate
  — directly foreshadowing compression-is-prediction.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the approximations ladder: descending bars
   from `log2 27 ≈ 4.75` (uniform) down through monogram, digram, trigram to the
   ~1-bit rate, each rung labeled with what it conditions on. One idea: context
   buys bits. Inspiration: Shannon 1948 §3.
2. **`<FigureSequence>` (4-5 frames)** — the guessing game on one word
   (e.g. "THE_QUICK"): each frame reveals the next letter and stacks the guess
   count for that position; final frame shows the tally row. Delta = one letter
   per frame. Inspiration: Shannon 1951's worked reveal.
3. **single `<Figure>` (component)** — guess-rank histogram: the fraction of
   letters guessed correctly on try 1, 2, 3, ...; the mass concentrated on
   "first try" is what makes the entropy low. One idea: a peaked guess
   distribution means low entropy. Inspiration: Shannon 1951 rank statistics.
4. **single `<Figure>` (component)** — bits/letter vs. context length: a curve
   dropping from ~4.1 (no context) toward the ~1-bit asymptote as the number of
   preceding letters grows. One idea: the limit is the entropy rate.
5. **single `<Figure>` (component)** — the redundancy bar: an 8-bit (or 4.75-bit)
   raw slot with the ~1-bit "actual information" shaded and the remaining ~75%
   marked "redundancy — removable by compression". One idea: most of written
   English is predictable. Foreshadows compression-is-prediction.
