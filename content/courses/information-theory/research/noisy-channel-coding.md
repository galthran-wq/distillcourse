# Research brief: noisy-channel-coding (The noisy-channel coding theorem)

status: drafted (kept slug — revise, do not rewrite)
module: channels
type: core
goal: Explain why capacity is the exact threshold between reliable and unreliable communication.
est_minutes: 40

## ARC

- **Inherits:** `C = max I(X;Y)` (`channel-capacity`), the typical set
  (`source-coding-theorem-lite`), Fano's inequality (`fano-inequality`) and the
  data-processing inequality.
- **Spine step:** step 6, *The second limit* — "…gives a rate that is achievable
  and above which reliable communication is impossible."
- **Contributes:** the operational meaning of mutual information, and the
  course's second hard limit. Also the fact that the proof is non-constructive,
  which is the entire premise of the next two lessons.
- **Hands off to:** `hamming-codes` (an explicit code, and what it cannot do)
  and `deployed-codes` (how long it took to reach the promise).

## Sources to consult

- Cover & Thomas, **§7.5-7.7** (definitions, jointly typical sequences,
  the theorem and its random-coding proof), **§7.9-7.10** (the Fano converse and
  the equality condition), **§7.12** (feedback does not increase capacity),
  **§7.13** (source-channel separation).
- MacKay, **ch. 9 §9.6-9.7** (statement and the extended-channel preview) and
  **ch. 10** (the full three-part statement, joint typicality, random coding
  with expurgation, and the `R(p_b) = C/(1-H_2(p_b))` curve for coding with
  allowed errors). MacKay's baby-weighing analogy for why the average over
  random codebooks suffices is the clearest available statement of the proof's
  central trick.
- Shannon 1948 Part II, **§13, Theorem 11** and the fan diagram (fig. 10) — the
  original argument.
- Weissman (EE376A), **§5.5-5.8** — the joint AEP, the direct theorem and the
  Fano converse at an elementary level.
- Polyanskiy & Wu, **ch. 16** (the theorem via one-shot achievability bounds)
  and **§20.3** (dispersion — the finite-blocklength correction). Dispersion is
  what makes the threshold picture honest at finite `n`.

## Key points the lesson must cover

1. **The flaw first.** Repetition coding drives error down only by driving rate
   to zero: at `p = 0.1`, reaching `p_b = 10^{-15}` needs about 60 repetitions.
   The natural conclusion — reliability costs all your rate — is wrong, and the
   theorem says exactly how wrong. This is the lesson's reversal seam and it
   must open the chapter.
2. **The setup**: an `(n, M)` code, rate `R = (log2 M)/n`, block error
   probability, and what "achievable" means (a sequence of codes with vanishing
   error).
3. **Joint typicality**: `(x^n, y^n)` pairs whose empirical behaviour matches the
   joint. The counts: about `2^{nH(X)}` typical inputs, `2^{nH(Y)}` typical
   outputs, `2^{nH(X,Y)}` typical pairs, so an independent pair is jointly
   typical with probability about `2^{-nI(X;Y)}`.
4. **Achievability**, sketched honestly: draw `2^{nR}` codewords independently
   from `p(x)`; decode to the unique codeword jointly typical with the received
   word. The error probability averaged over codebooks vanishes when
   `R < I(X;Y)`; therefore some codebook is at least that good. Name the two
   moves that carry the proof — averaging over random codebooks, and
   expurgation to convert average error into maximal error.
5. **The converse**, now short because Fano is already available: Fano bounds
   `H(W | Ŵ)`, the data-processing inequality bounds `I(W; Ŵ) ≤ nC`, and the
   two together force `R ≤ C` if error vanishes. Three lines.
6. **Non-constructiveness.** The proof exhibits no code, and a random codebook
   of `2^{nR}` entries is unusable (storage and decoding both exponential). Say
   this plainly; it is why the next two lessons exist and why 45 years passed
   before practice caught up.
7. **Finite blocklength.** The threshold is sharp only as `n → ∞`. At finite `n`
   the achievable rate is about `C - sqrt(V/n) Q^{-1}(ε)`; state the shape, not
   the derivation, and use it to explain why the demo's curve softens at small
   `n`.
8. **Feedback and separation**, one paragraph each: feedback does not raise `C`
   for a memoryless channel but can simplify coding enormously (the erasure
   channel with feedback achieves capacity with zero error by simply
   retransmitting); and separate source and channel coding is asymptotically
   optimal, which is why compression and error correction are different chapters
   of this course and different layers of a real stack.

## Pitfalls / subtleties to flag

- "Arbitrarily small error" is not zero error. Zero-error capacity is a
  different and generally smaller quantity.
- The theorem is about a sequence of codes with growing `n`. Nothing is promised
  at any particular blocklength.
- Random coding proves existence; expurgation upgrades average to maximal error.
  Do not present the average-error result as the final statement.
- Above capacity the error does not merely rise — it tends to 1. Say so.
- Separation is asymptotic and fails for some multi-user settings; one clause of
  hedging, no more.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — repetition codes on the rate-versus-error
   plane: points for `n = 1, 3, 5, …, 61` marching toward zero error and zero
   rate, with the capacity line `C = 0.53` drawn vertically and empty space
   between. One idea: the obvious method never reaches the line.
2. `draw:` **`<FigureSequence>` (4 frames)** — the joint typicality count: frame
   1 the typical input set; frame 2 the typical output set; frame 3 the jointly
   typical pairs as a sparse grid; frame 4 the count `2^{-nI}` annotated. One
   delta per frame. Inspiration: Shannon's fig. 10 fan diagram and MacKay's
   jointly-typical cartoon, recreated.
3. `draw:` **single `<Figure>`** — the decoding picture: codewords as points
   with disjoint "noise balls" of radius set by `H(Y|X)`, packed inside the
   typical output space; the count of balls that fit is `2^{nC}`. One idea:
   capacity is a packing number.
4. `draw:` **`<FigureSequence>` (3 frames)** — the converse: frame 1 the chain
   `W → X^n → Y^n → Ŵ`; frame 2 Fano bounding `H(W|Ŵ)`; frame 3 data processing
   bounding `I(W;Ŵ) ≤ nC`, with the two combined. Reuses the Fano figure
   language deliberately.
5. `draw:` **single `<Figure>`** — the threshold with finite-blocklength
   softening: achievable rate against `n` for fixed error, approaching `C` from
   below like `C - sqrt(V/n)Q^{-1}(ε)`. One idea: the cliff is a limit, and at
   `n = 100` it is a slope.
6. `source:` **amathematica-theorem11-fig9-page22** → save as
   `figures/shannon-1948-theorem11.png`, centered, at the point the theorem is
   stated. The reader must be able to read both branches of Shannon's own
   wording (`H ≤ C` and `H > C`) and see his attainable-region diagram. The
   if/then structure is precisely what paraphrase loses.
7. `source:` **informationt-s1-dilbert-repetition** → save as
   `figures/mackay-repetition-demo.png`, float right beside the repetition-code
   opening. The reader must be able to see the same real image before and after
   R3 decoding at 10% noise, with visible residual errors. A synthetic noise
   pattern would be an assertion; this is a run.

Two sourced images, both earning their place: one is the original theorem
statement, one is a real decoded artefact.

## EXERCISE PLAN

1. *(warm-up)* For a BSC with `p = 0.1`, compute the block error probability of
   the length-3 and length-5 repetition codes and the rate of each.
2. **Boundary probe.** What does the theorem say for a channel with `C = 0`?
   State the achievable rates, and then explain what the converse gives you for
   `R > 0` at `C = 0`, being precise about "error tends to 1" versus "error is
   large".
3. **Claim to refute.** "Since the theorem is proved with random codebooks, a
   randomly chosen code will work in practice." Give two independent reasons
   this fails, one about decoding cost and one about what averaging over
   codebooks actually establishes.
4. **Derivation the lesson skipped.** Complete the converse yourself: from
   Fano's inequality and the data-processing inequality, derive
   `R ≤ C/(1 - P_e) + 1/n` and take the limit. State where each inequality
   enters.
5. **Derivation, the other side.** Show that the probability that a randomly
   chosen codeword is jointly typical with an unrelated received word is about
   `2^{-nI(X;Y)}`, and use a union bound over `2^{nR} - 1` competitors to
   identify the exact condition `R < I(X;Y)`.
6. **Research-shaped.** Simulate a BSC at `p = 0.1` with a random code of
   blocklength 12 and rate 1/2 (32 codewords), using nearest-neighbour decoding.
   Report the measured block error rate over 10^4 trials, and compare against
   the finite-blocklength prediction at `n = 12`. State what agreement means
   given `C = 0.53`.
7. **FORWARD (E7).** Design, by hand, a code of blocklength 7 carrying 4 message
   bits that corrects any single bit error. Report your parity equations, or
   report where the attempt fails and what constraint blocked it. Reaches
   `hamming-codes` — the solution gives the (7,4) construction and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph; and the converse rewritten to *use* `fano-inequality` as a
  prerequisite rather than deriving Fano inline. The current draft introduces
  Fano here; that concept has moved and this lesson now reinforces it.
- The repetition-code opening as an explicit reversal seam, with the 60-fold
  number.
- Figures 1, 3, 4, 5 and both sourced images.
- The finite-blocklength paragraph, which the current draft lacks and which the
  ChannelCodingThreshold demo needs in order not to mislead.
- Feedback and source-channel separation, one paragraph each.
- Depth toward 40 minutes — the course's longest lesson, appropriately.

**Lose**
- The inline Fano derivation (moved).
- Any implication that the theorem provides a code.
- Callouts restating "R < C is achievable" (L15).
