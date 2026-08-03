# Research brief: deployed-codes (Deployed codes and the Shannon limit)

status: planned (NEW lesson — module APPLICATION)
module: channels
type: synthesis
goal: Evaluate how close deployed error-correcting codes come to capacity and what each code family trades for the gap.
est_minutes: 36

## ARC

- **Inherits:** capacity (`channel-capacity`), the coding theorem and its
  non-constructiveness (`noisy-channel-coding`), and the distance critique
  (`hamming-codes`).
- **Spine step:** step 6, *The second limit* — the closing move.
- **Contributes:** the empirical verdict on a theorem. The gap between promise
  and practice is a measured quantity with a 45-year history, and it closed.
- **Hands off to:** the machine-learning module, which takes the same
  entropy-coding machinery into a setting where the model is learned rather than
  designed.

## APPLICATION SPEC (L16 — module 4 closes here)

- **Artifact:** the published normalized-rate comparison of real code families
  against the finite-blocklength benchmark — Voyager, Galileo (both antennas),
  Cassini/Pathfinder, turbo codes, LDPC, polar-with-CRC, Reed-Solomon and BCH —
  together with MacKay's own measured LDPC decoding run.
- **Module results it uses:** capacity as the target; the coding theorem's
  achievability (which promised these codes exist) and its converse (which is
  the line they cannot cross); the finite-blocklength correction
  `C - sqrt(V/n)Q^{-1}(ε)` that makes "normalized rate" the right axis; linear
  block codes and syndrome decoding from `hamming-codes`.
- **Where the artifact departs from the idealisation:**
  1. Blocklengths are finite and often short, so the benchmark is the
     finite-blocklength bound, not `C`.
  2. Decoding is iterative and approximate: belief propagation on a graph with
     cycles is not exact inference, and it can fail to converge.
  3. Turbo codes have an error floor caused by low-weight codewords, so the
     measured curve flattens where the theory predicts it should keep falling.
  4. Real links are not memoryless binary-symmetric channels; interleaving is
     the engineering patch that makes them approximately so, and it costs
     latency.
  5. The theorem says nothing about complexity; the entire 45-year gap is a
     complexity story, not an information-theoretic one.

## Sources to consult

- **Polyanskiy & Wu §20.4 and Figure 20.1** (primary artifact) — the normalized
  rate plot, generated with the SPECTRE finite-blocklength toolbox, naming each
  deployed code. Also **§19.1** for the `(Eb/N0)_min = -1.6 dB` limit and
  **Figure 19.2**, and **§20.3** for dispersion.
- MacKay, **ch. 47** — LDPC codes: the sum-product decoder on the bipartite
  graph (§47.2-47.3), the Dilbert decoding demonstration converging in 13
  iterations at 7.5% noise (§47.4, fig. 47.5), density evolution and the sharp
  threshold `f_max = 0.084` for (3,6) codes against the Shannon limit 0.11
  (§47.5), and the rate-1/4 comparison of eight real code families (fig. 47.17).
  **ch. 48** for turbo codes, the interleaver, iterative decoding and the error
  floor; **ch. 11.4-11.5** for the very-good/good/bad/practical taxonomy,
  concatenation and interleaving; **ch. 50** for fountain codes as the erasure-
  channel answer.
- Cover & Thomas, **§7.11** background; Arıkan 2009 (already in the canon) for
  polar codes as the first explicit provably capacity-achieving construction.
- Weissman (EE376A) **§5.9.2** for the pointer-level framing.

## Key points the lesson must cover

1. **The scoreboard.** Set up the comparison axis first: normalized rate, i.e.
   achieved rate divided by the finite-blocklength benchmark at the same
   blocklength and error probability. Explain why raw "distance from capacity"
   is unfair to short codes.
2. **The classical era.** Concatenation (an inner convolutional code inside an
   outer Reed-Solomon code) plus interleaving is what flew on Voyager, Galileo
   and Cassini. Report where they sit on the scoreboard and what the gap cost in
   antenna diameter or transmit power. This is the section where the deployed
   artifact is read against the theory.
3. **The 1993 discontinuity.** Turbo codes: two convolutional codes joined by a
   random interleaver, decoded by passing soft information back and forth. The
   decoder is the news, not the code. State the iterative decoding idea in two
   paragraphs; do not derive belief propagation.
4. **LDPC.** Gallager's 1963 codes, ignored for 30 years because the decoder was
   too expensive, then rediscovered. Sparse parity-check matrix, bipartite
   graph, sum-product decoding. Give MacKay's measured demonstration: 13
   iterations to converge at 7.5% channel noise; and density evolution's
   prediction of a sharp threshold at `f_max = 0.084` against a Shannon limit of
   0.11 for the same rate.
5. **Polar codes**: the first construction proved to achieve capacity with
   low-complexity encoding and decoding, and now in 5G control channels. One
   paragraph, stated, with the reference.
6. **The absolute floor.** `(Eb/N0)_min = -1.6 dB` — the least energy per bit
   for reliable communication with no bandwidth constraint. Quote the number and
   the shape of the curves approaching it, and the striking finite-blocklength
   fact that reaching within 0.1 dB requires blocklengths in the tens of
   thousands to tens of millions depending on the channel model.
7. **What actually took 45 years.** The theorem gave existence; the missing
   piece was a decoder with sub-exponential cost. Say this as the lesson's
   verdict, and connect it back to the non-constructiveness stated in
   `noisy-channel-coding`.

## Pitfalls / subtleties to flag

- Do not compare codes at different blocklengths or error probabilities as if
  the comparison were meaningful. That is what the normalized-rate axis exists
  to prevent, and it must be explained before any numbers land.
- "Within 0.1 dB of capacity" is a statement about a specific channel model,
  rate and blocklength. Always attach all three.
- Belief propagation on a loopy graph has no convergence guarantee; it works
  extremely well in practice and that is an empirical fact, not a theorem.
- The error floor is a property of the code's low-weight codewords, i.e. of
  minimum distance — the quantity `hamming-codes` just deprecated. The
  resolution: distance is irrelevant to the *threshold* and decisive for the
  *floor*. This is a genuine reversal and should be stated as one.
- Reed-Solomon and BCH are not obsolete; they are excellent where the error
  model is bursty or adversarial rather than random.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the scoreboard axis explained: rate against
   blocklength with the capacity line flat on top and the finite-blocklength
   benchmark curving up toward it, and one code marked showing both its raw gap
   and its normalized rate. One idea: normalizing is what makes the comparison
   honest.
2. `draw:` **single `<Figure>`** — the concatenation architecture: outer
   Reed-Solomon, interleaver, inner convolutional code, channel, and the mirror
   on the decode side. One idea: a burst on the channel becomes scattered single
   errors at the outer decoder.
3. `draw:` **`<FigureSequence>` (4 frames)** — sum-product decoding on a small
   bipartite graph: frame 1 the graph with received likelihoods at the variable
   nodes; frames 2-4 one round of messages each way, with a violated check
   turning satisfied. One idea: decoding is local message passing, not algebra.
4. `draw:` **single `<Figure>`** — the density-evolution threshold: bit error
   rate against iteration number for several channel noise levels, the family
   splitting into curves that reach zero and curves that stall, with `f_max`
   marked between them. One idea: the threshold is sharp.
5. `draw:` **single `<Figure>`** — the error floor: a bit-error-rate against SNR
   curve for a turbo code, falling steeply and then flattening, with the
   low-weight-codeword cause annotated, beside an LDPC curve that does not
   flatten as early. One idea: minimum distance came back.
6. `draw:` **single `<Figure>`** — the timeline: 1948 theorem, 1950 Hamming,
   1960 Reed-Solomon, 1963 Gallager, 1977 Voyager, 1993 turbo, 1996 LDPC
   rediscovery, 2009 polar, 2018 5G — plotted against the measured gap to
   capacity in dB. One idea: the gap is a historical quantity.
7. `source:` **6441-s3-normalized-rates-plot** → save as
   `figures/normalized-rates.png`, centered, as the lesson's central artifact
   (and its `key_image` candidate). Crop to the AWGN panel. The reader must be
   able to read the named code families — Voyager, Galileo HGA/LGA, Cassini —
   and see their positions relative to the benchmark. This is measured
   engineering data about specific flown hardware; a redraw would be fabricated.
8. `source:` **informationt-s4-dilbert-decode** → save as
   `figures/ldpc-decoding-run.png`, centered, in the LDPC section. The reader
   must be able to see the image emerge from noise across the eight numbered
   iterations. A real decoding run; an illustration of "it converges" would be
   an assertion.

Two sourced images, both measured artefacts. `6441-s3-energy-per-bit-plot` and
`informationt-s4-rate14-comparison` are in the pool as alternates if the lesson
takes the energy-per-bit angle further.

## EXERCISE PLAN

1. *(warm-up)* Given a code's rate, blocklength and measured error probability,
   look up or compute the finite-blocklength benchmark and report the normalized
   rate.
2. **Boundary probe.** Compute the Shannon limit on `Eb/N0` for a rate-1/2 code
   on a binary-input AWGN channel, then for rate 1/4, then in the limit of
   vanishing rate. Report all three and identify which one is the -1.6 dB
   figure, and what "no bandwidth constraint" means physically.
3. **Claim to refute.** "Turbo codes get within 0.5 dB of capacity, so error
   correction is a solved problem." Give three distinct grounds on which this
   overstates the result — one about blocklength, one about the error floor, one
   about the channel model.
4. **Claim to refute, second kind.** "The previous lesson showed minimum
   distance does not matter, so a code's weight distribution is irrelevant."
   Refute using the turbo error floor, and state the regime in which each view
   is correct.
5. **Derivation the lesson skipped.** For a (3,6) regular LDPC code, compute the
   rate from the degree distribution and confirm it is 1/2. Then compute the
   Shannon-limit crossover probability at that rate and compare with the quoted
   density-evolution threshold `f_max = 0.084`. Report the gap in both crossover
   probability and decibels.
6. **Research-shaped.** Implement or run a small LDPC or repeat-accumulate
   decoder at three noise levels near its threshold and record the iteration
   count to convergence and the residual error. Report where the sharp
   transition sits and compare with the predicted threshold. State what
   agreement means given your blocklength.
7. **FORWARD (E7).** Every code in this module was designed for a channel model
   the engineer specified in advance. Sketch what changes if the *source*
   statistics, not the channel, are the unknown thing being modelled, and write
   down what quantity would be minimized. Reaches the machine-learning module —
   the solution names cross-entropy as the objective and `<Ref>`s
   `cross-entropy-loss` and `compression-is-prediction`.
