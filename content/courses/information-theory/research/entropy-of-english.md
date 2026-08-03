# Research brief: entropy-of-english (Entropy of English text)

status: drafted (kept slug — revise; the lesson MOVES module, from
shared-information to foundations, and becomes the module APPLICATION)
module: foundations
type: worked-practice
goal: Estimate the entropy rate of English text with Shannon's guessing game.
est_minutes: 35

## ARC

- **Inherits:** `H(Y|X)` and the fact that conditioning reduces average
  uncertainty (`joint-and-conditional-entropy`).
- **Spine step:** "Observing a second variable lowers average uncertainty, so a
  real source's information is per-symbol entropy given everything before it —
  not the entropy of its symbol frequencies." (step 2, *Context destroys
  uncertainty*)
- **Contributes:** the entropy **rate**, and a measured number for a real source
  — about one bit per letter against a 4.75-bit alphabet.
- **Hands off to:** the coding module, which asks what a bound of one bit per
  letter is a bound on; and to `dictionary-coding` and
  `compression-is-prediction`, both of which return to this number.

## APPLICATION SPEC (L16 — module 1 closes here)

- **Artifact:** Shannon's 1951 guessing-game experiment, reproduced by the
  reader on a passage of their own choosing.
- **Module results it uses:** surprisal (`-log2 p` of each guess outcome),
  entropy as an expectation, conditional entropy, and the chain rule that makes
  `F_N` a decreasing sequence.
- **Where the artifact departs from the idealisation:** the source is assumed
  stationary and ergodic and is neither; the "model" is a human, so the estimate
  measures the guesser and upper-bounds the true rate; the sample is tens of
  characters, not thousands, so the bounds are wide; and the alphabet choice
  (27 symbols versus 26 versus full ASCII with case and punctuation) changes
  every number reported. Each of these must be named in the lesson, not left to
  the pitfalls list.

## Sources to consult

- **Shannon 1951, "Prediction and Entropy of Printed English"** — the primary
  source: the experiment, the guess-rank statistics, the `F_N` upper and lower
  bounds, and the ~1 bit/letter and 75% redundancy conclusions.
- Shannon 1948, Part I, **§3 "The Series of Approximations to English"** — the
  zero-order through word-level generated samples ("XFOML RXKHRJFFJUJ…" through
  "THE HEAD AND IN FRONTAL ATTACK ON AN ENGLISH WRITER…") with their entropy
  estimates 4.76, 4.03, …, 2.8. Also **§7** for the crossword-puzzle argument
  and the 50% redundancy claim, plus the Basic English / *Finnegans Wake*
  contrast.
- Cover & Thomas, **§6.4** and **§6.6** — the modern treatment and the gambling
  reformulation (12 subjects, a 75-letter excerpt, ~1.34 bits/letter);
  **§4.2** for the formal entropy-rate definition.
- MacKay, **ch. 18 §18.1** (crosswords as a constrained channel, the Wenglish
  model) and **§18.2** (Zipf and Zipf-Mandelbrot on real corpora).

## Key points the lesson must cover

1. **Entropy rate** `H_rate = lim_n H(X_n | X_1…X_{n-1})`, and the fact that the
   sequence is non-increasing — which is exactly the conditioning-reduces-entropy
   result from the previous lesson applied repeatedly.
2. The **approximations ladder** (Shannon 1948 §3): `log2 27 ≈ 4.75` uniform,
   ~4.03 monogram, ~3.3 digram, ~3.1 trigram, lower at word level. Quote the
   generated samples — they are the most memorable artifact in the 1948 paper
   and they make "higher-order model" concrete before any formalism.
3. **Shannon's guessing game**: a human predicts the next letter given the
   preceding text; the guess rank per position is recorded. Run it in prose on a
   short sentence, tally, convert.
4. **The bound structure**: the guess-rank frequencies `q_i` give Shannon's
   `F_N` upper and lower bounds. State the bounds and compute a crude estimate;
   do not re-derive the full argument.
5. **Redundancy** `1 - H_rate / log2(alphabet)` ≈ 75%, and the crossword
   argument: at 50% redundancy large two-dimensional crosswords are just
   possible, at 33% three-dimensional ones would be. This is the best available
   intuition pump for what redundancy *means*.
6. The game measures the entropy of **the guesser's model**, which upper-bounds
   the true rate. A better predictor gives a lower estimate — stated here as
   fact, cashed out in `compression-is-prediction`.

## Pitfalls / subtleties to flag

- Entropy rate versus single-letter entropy is the lesson's central correction,
  and it is a genuine prevalent misconception (L13): people quote "English is
  4.1 bits a letter" from a frequency table. State the correct claim, state the
  misconception once, reject it, explain why frequency tables cannot see
  context, replace, and discriminate with the digram number.
- The guessing game gives **bounds**, not a value, and Shannon's own answer is a
  range (0.6–1.3 bits/letter).
- Sample size: a 50-character tally is a demonstration, not a measurement. Say
  so with a number for how wide the interval is.
- The "75% redundancy" and "50% redundancy" figures in the literature use
  different alphabets and context lengths. Reconcile them or pick one and state
  the convention.

## FIGURE PLAN

1. `draw:` **NEW, single `<Figure>`** — the approximations ladder as descending
   bars from 4.75 down through monogram, digram, trigram to the ~1-bit rate,
   each rung labelled with what it conditions on. Inspiration: Shannon 1948 §3.
2. `draw:` **guessing-game-1..5.svg** (exist, `<FigureSequence>`) — the game on
   one phrase: each frame reveals the next letter and stacks its guess count.
3. `draw:` **NEW, single `<Figure>`** — guess-rank histogram: the fraction of
   letters got on try 1, 2, 3, … The mass on "first try" is what makes the rate
   low. Inspiration: Shannon 1951's rank statistics.
4. `draw:` **NEW, single `<Figure>`** — bits per letter against context length,
   the curve falling from ~4.1 toward the ~1-bit asymptote. One idea: the limit
   is the entropy rate.
5. `draw:` **NEW, single `<Figure>`** — the redundancy bar: a 4.75-bit slot with
   ~1 bit shaded as information and the rest marked removable.
6. `source:` **shannon-1948-approximations-1..4.png** (already in the lesson's
   figures/ with credits) — Shannon's own generated text samples. Keep as a
   `<FigureSequence>`; the exact strings are the artifact and retyping them
   loses the typographic evidence that they came out of a 1948 procedure.
   Placement: centered, in the ladder section.
7. `source:` **shannon-1951-bounds.png** (already in figures/, and the lesson's
   `key_image`) — Shannon's published upper/lower bound curves against context
   length. Real measured data; centered, in the bounds section.
8. `source:` **informationt-s2-crossword** (research/images.yaml) → save as
   `figures/mackay-crosswords.png`, float right beside the crossword argument.
   The reader must be able to see that both grids are genuinely filled and
   internally consistent — a schematic grid would not carry the argument that
   such puzzles *exist* in quantity.

Three sourced images is at the top of the budget for a technical course; they
are justified here because the lesson's subject is a historical measurement and
the artifacts are the evidence. If one must go, drop the crossword.

## EXERCISE PLAN

1. *(warm-up)* Convert a guess-rank tally supplied in the exercise into a
   bits-per-letter estimate, and state the alphabet convention used.
2. **Boundary probe.** What does the guessing game report for a text that is a
   single letter repeated 200 times? Compute it, then state what the game
   reports for a string of uniform random letters, and explain which property of
   the source each answer is detecting.
3. **Claim to refute.** "Since English has about 1 bit per letter of entropy, a
   perfect compressor could store any 1000-letter English text in about 1000
   bits." Identify the two distinct things wrong with this — one about
   expectation versus individual strings, one about who has the model.
4. **Derivation the lesson skipped.** Show that `H(X_n | X_1…X_{n-1})` is
   non-increasing in `n`, using only the result that conditioning reduces
   entropy. Then explain why this proves the ladder in figure 1 can never turn
   upward.
5. **Research-shaped (the application's core task).** Run the guessing game
   yourself on a 60-character passage a partner chooses, tally the ranks, and
   report an estimate with an honest statement of its width. Compare against
   Shannon's 0.6–1.3 bits/letter range and against the 1.34 bits/letter from the
   12-subject gambling experiment. State what would count as agreement.
6. **Mixed review (E3).** Using the digram entropy you estimated in the previous
   lesson's exercise, compute the redundancy of English at digram order and
   compare it with the redundancy at monogram order. Which model buys more
   bits, and where does the buying stop?
7. **FORWARD (E7).** Take the ~1 bit/letter rate as given. A file of 1 MB of
   English text is stored as ASCII. Compute the size a compressor achieving the
   entropy rate would produce, then compress the same text with gzip and report
   the actual ratio. Reaches `deflate-and-zstd` and `dictionary-coding` — the
   solution notes that the gap is the price of not knowing the source, and
   `<Ref>`s both.

## REVISION (kept slug)

**Gain**
- ARC paragraph and an explicit statement that this lesson closes the module by
  measuring something real (L16). The current draft reads as another theory
  chapter with an experiment in it.
- The APPLICATION section: name the four departures from the idealisation
  listed above, in the body, not in an aside.
- The refutation schema for "English is 4.1 bits a letter" written out properly
  (L13) — currently the correction is present but not staged.
- Figures 1, 3, 4, 5 above (all currently missing) plus the crossword source
  image.
- The crossword and redundancy argument from Shannon 1948 §7, which the current
  draft omits and which is the best intuition available for the 75% figure.
- Depth toward 35 minutes.

**Lose**
- `prefix-codes` as a prerequisite and any coding-module vocabulary: this
  lesson now runs before the coding module. The "why English compresses"
  framing stays, but stated as a fact the next module will explain, with a
  forward `<Ref>` rather than a backward one.
- Any unhedged single-number claim about the entropy of English (QA has flagged
  this pattern before): every number carries its alphabet, its context length,
  and its source.
