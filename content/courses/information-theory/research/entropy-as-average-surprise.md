# Research brief: entropy-as-average-surprise (Entropy)

status: retrofit
module: foundations
goal: Compute the entropy of a discrete distribution as expected surprisal.

Drafted before the dossier. This brief records what the draft covers and what a
density-upgrade revision should add.

## Sources to consult

- Shannon 1948, Part I, **§6** — defines `H = -Σ p_i log p_i`, states the
  extremal properties (max at uniform, min at certainty), and **fig. 7** is the
  binary entropy curve for two outcomes. Primary anchor for the range result.
- Cover & Thomas, **§2.1** (definition; the binary entropy function `H(p)`,
  their fig. 2.1) and **Theorem 2.6.4** (`H(X) ≤ log|X|`, via Jensen). The draft
  already cites Theorem 2.6.4 correctly.
- MacKay, **ch. 2, §2.4-2.5** — entropy of an ensemble, the binary entropy
  function; **ch. 2 (§2.1 monogram table)** for the English single-letter
  distribution giving `H ≈ 4.11 bits/char` over the 27-symbol alphabet. The
  draft cites "MacKay, ch. 2" for this — keep; confirmed the monogram estimate
  lives in ch. 2.

## Key points the lesson must cover (already in the draft)

1. Entropy = **probability-weighted average of surprisal**, not the unweighted
   average (weather example: 1.5 bits vs. the misleading 1.67).
2. Definition `H(X) = -Σ p(x) log2 p(x) = E[-log2 p(X)]`, with the convention
   `0 log2 0 = 0` (justified by the limit).
3. **Relabeling invariance**: H depends only on the multiset of probabilities.
4. **Range theorem**: `0 ≤ H ≤ log2 n`; zero iff a point mass, `log2 n` iff
   uniform. Lower bound termwise; upper bound by Jensen on the concave log.
5. The **binary entropy function** `H(p) = -p log2 p - (1-p) log2(1-p)`:
   endpoints 0, max 1 bit at p=1/2, symmetry `H(p)=H(1-p)`, vertical slope at
   the endpoints (`H'(p) = log2((1-p)/p)`).
6. Entropies of common sources: fair die `log2 6 ≈ 2.585`, uniform byte 8 bits,
   shuffled deck `log2 52! ≈ 225.6` bits; English monograms `≈ 4.11` vs. the
   uniform ceiling `log2 27 ≈ 4.75`.
7. Operational preview (Remark): H is the floor on expected bits / yes-no
   questions per draw — sets up the coding module.

## What a density-upgrade revision should add

- The chapter is long (~2600 words) with **2 figures**; add 4-6 small visuals
  (FIGURE PLAN). This is the primary gap.
- A `<KeyFact>` on the range result ("entropy is maximal exactly when you know
  least — the uniform distribution").
- The three-step worked-example pattern (surprisal -> weight -> sum) recurs four
  times in prose; render it once as a small labeled figure so later instances
  can point back rather than repeat.
- A `<Task>` on the EntropyExplorer demo: the draft's demo caption already
  states the task ("make H=0, then rebuild the 2-bit maximum") — promote it to a
  green `<Task>` callout.

## Pitfalls / subtleties to flag

- The upper-bound proof uses **Jensen on `E[log 1/p(X)]`** and equality forces
  uniform-on-support; the draft states the strict-concavity equality condition
  correctly — preserve it, QA checks equality conditions.
- `0 log2 0 = 0` is a convention with a limit justification, not a definition of
  `log 0`.
- The monogram `4.11` bits is context-free; the entropy *rate* of English is far
  lower (~1 bit) — flag the distinction and forward-reference
  `entropy-of-english`. Draft already does this.
- Nats vs. bits is the same unit choice as surprisal; do not re-derive, link
  back to `what-is-surprise`.

## FIGURE PLAN

1. **weighted-average.svg** (exists, single `<Figure>`) — weather outcomes,
   surprisal bars weighted by probability into `H = 1.5`. Keep.
2. **binary-entropy.svg** (exists, single `<Figure>`) — the `H(p)` inverted-U,
   max 1 bit, 90/10 point marked. Keep; this is Shannon's fig. 7 recreated.
3. **NEW, `<FigureSequence>` (3 frames)** — the three-step entropy computation on
   `{1/2,1/4,1/8,1/8}`: frame 1 the four probabilities, frame 2 each mapped to
   its surprisal, frame 3 weighted and summed to 1.75. One delta per frame.
   Inspiration: the draft's own step-numbered worked example.
4. **NEW, `<FigureSequence>` (3-4 frames)** — "concentrating mass lowers
   entropy": start uniform over 4 (H=2), slide mass onto one outcome across
   frames, H readout drops each frame; last frame is the point mass (H=0).
   Binds the EntropyExplorer demo. Inspiration: Cover & Thomas's concavity
   discussion.
5. **NEW, single `<Figure>` (component)** — endpoint-steepness of `H(p)`: a
   zoom-in near p=1 with the tangent going vertical, annotating
   `H(0.99) ≈ 0.081` — "one percent off certainty already buys 0.08 bits".
   One idea: the derivative blows up at the ends.
6. **NEW, single `<Figure>` (component)** — the `log2 n` ceiling as a staircase:
   coin (1), 4-outcome (2), byte (8), each uniform bar touching its ceiling, a
   non-uniform bar sitting below. Inspiration: the "range of entropy" heading.

## Revision round 2 — QA findings (2026-07-24, post-restructure)

Independent course-qa (opus): **ready=false — light revision, not a
rewrite**. 12 rubric PASS; the only WEAK is L6 visual density: FIGURE PLAN
items #4 and #5 remain unbuilt. Required, in priority order:

1. Build FIGURE PLAN #4 — `<FigureSequence>` "concentrating mass lowers
   entropy": uniform-over-4 morphing to a point mass over 3-4 frames, H
   readout dropping each frame (2.00 -> ... -> 0). Place it in "The
   extremes: certainty and even spread" (also breaks that section's
   3-paragraph prose run). Raw-SVG tier like the existing entropy-steps-N.
2. Build FIGURE PLAN #5 — single `<Figure>`: zoom of the binary-entropy
   curve near p=1, tangent going vertical, annotated H(0.99) ~ 0.081 bits.
   Anchors "Steep at the ends, flat in the middle" (currently prose-only).
3. Verify from the demo source that EntropyExplorer starts on a
   non-degenerate distribution (D3) and the Task path (H=0 then rebuild
   2.00 bits) is achievable; note the check in the report.

Nice-to-have (apply if cheap):
- Operational `<Remark>`: replace generic "the coding lessons that follow"
  with `<Ref lesson="prefix-codes">` and `<Ref lesson="source-coding-theorem-lite">`.
- One clause noting the operational claim is formalized via the typical set
  in source-coding-theorem-lite (precise forward hook).

All round-1 pitfalls verified handled (Jensen equality condition, 0 log 0
convention, monogram-vs-rate distinction) — do not touch those passages.
