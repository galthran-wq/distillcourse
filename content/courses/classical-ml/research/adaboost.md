# AdaBoost — research brief

Lesson: `adaboost` (module: ensembles, core, planned). KEPT SLUG — old draft at content/courses/classical-ml-interview/lessons/adaboost/lesson.mdx (30 min).
Goal: Compute AdaBoost rounds by hand and derive the algorithm's equivalence to forward-stagewise additive modeling under exponential loss.

## Sources
- Freund & Schapire 1997 (primary; read via OCR): the original pseudocode (Fig 2 — image captured); the optimal β_t = ε/(1−ε) derived by per-round minimization; Theorem 6's error bound ≤ 2^T Π√(ε_t(1−ε_t)) and the exp(−2Σγ_t²) corollary; the horse-racing framing (history garnish only).
- ESL §10.1–10.6 (AdaBoost = forward stagewise additive modeling under exponential loss, eqs 10.8–10.16 — the full derivation; population minimizer = ½ log-odds; loss comparison Fig 10.4; the stump 45.8%→5.8% after 400 rounds Fig 10.2; test error falling after zero training error — Fig 10.2/10.3 pair).
- SSBD §10.1–10.2 (γ-weak-learner definition; the telescoping-normalizer proof of the exp(−2γ²T) bound — cleanest proof in the canon; VC of the ensemble class §10.3).
- Mohri Ch. 7 (coordinate-descent reading §7.2.2; the game-theoretic weak-learning ⟺ separability ★).

## Key points
1. Weak learning defined (γ-edge); the premise that a stump barely beating chance can be amplified — stated as the historical bet (Kearns–Valiant question, one sentence).
2. The algorithm, then TWO ROUNDS FULLY BY HAND on a 10-point stump problem: weights, ε₁, α₁, reweighting (table of all ten weights), round 2's different stump, the combined classifier's signs — arithmetic complete (the lesson's centerpiece example; E1 pairing).
3. The training-error theorem PROVED via SSBD's telescoping argument: Z_{t+1}/Z_t = 2√(ε(1−ε)) ≤ e^{−2γ²}; error ≤ exp(−2Σγ_t²). Proof protocol applied (roadmap → steps → comprehension prompts).
4. The reinterpretation (ESL): forward-stagewise additive modeling under exp(−yf); deriving that the per-round minimizer reproduces EXACTLY α = ½ln((1−ε)/ε) and the multiplicative weights — AdaBoost was secretly minimizing a loss nobody wrote down. Population minimizer = half log-odds (so sign(f) is Bayes — the module-1 thread).
5. Exponential loss's character: compared with deviance on the margin axis (Fig 10.4 recreation); label-noise sensitivity (Breiman's RF paper Table 4 numbers: +49% for AdaBoost under 5% noise vs +6% RF — cite with numbers); bagging-vs-boosting as variance-tool vs bias-tool.
6. The mystery displayed and NOT solved: ESL Fig 10.2 — training error zero at ~250 rounds, test error still falling at 1,000. State the classical U-curve's prediction, show the data contradicting it, name the debt (module 9's margin-bounds pays). This is the course's second named debt and must be staged carefully.

## Set pieces & gems
- The 45.8% → 5.8% stump ladder (ESL Fig 10.2) with Breiman's "best off-the-shelf classifier in the world" quote — one citation.
- The original 1997 pseudocode image (adecision-fig2-adaboost-box) — the historical artifact.
- The optimal-β factor-by-factor derivation (F&S §4.2) — "why THIS update and not another".

## Pitfalls
- Keep the Hedge/online-learning ancestry to one ★ paragraph (fascinating, off-path).
- The two-rounds-by-hand table must be arithmetically exact — this is the most-copied example in the course; verify every weight.
- Do not resolve the margins mystery here — module 9's payoff depends on the debt staying visibly open.

## FIGURE PLAN
- draw: FigureSequence (5 frames): the two hand-worked rounds — (1) 10 points equal weights, stump 1 drawn, 3 mistakes circled; (2) weights reweighted (dot sizes), ε/α arithmetic beside; (3) stump 2 on the reweighted data; (4) second reweighting; (5) the weighted vote's combined boundary. THE lesson figure; inspired by ESL Fig 10.1's schematic and SSBD Fig 10.2's genre.
- source: adecision-fig2-adaboost-box — stem `adaboost-1997`, reader must see the original typeset pseudocode with the 1997 notation; placement: float right beside the algorithm statement, credited as the original.
- draw: The bound's anatomy — Z_t telescoping as a product of shrinking bars, each ≤ e^{−2γ²}; the training-error curve dropping under the exponential envelope. Single Figure bound to the proof.
- draw: The equivalence — two columns: "the algorithm" (weights/α) and "stagewise exp-loss" (argmin per round), with equal signs landing line by line; the derivation as a visual crosswalk. Formula-dissection Figure.
- draw: The loss zoo revisited — exponential vs deviance vs hinge vs 0–1 on the margin axis; exponential's explosive left tail shaded (noise sensitivity). Shared design with modules 4's loss figures.
- draw: The mystery — train and test error vs rounds (our own stump-boosting run on real data): train hits 0, test keeps falling; a large "?" pinned with "module 9" in the caption. Recreation of ESL Fig 10.2's phenomenon; the debt's official portrait.

## EXERCISE PLAN
1. Warm-up: given ε = 0.3, compute α and the weight multipliers for correct/incorrect points; verify the reweighted errors sum to ½.
2. Derivation skipped: show the reweighting makes the JUST-USED stump exactly 50% on the new weights (the "orthogonality" property the lesson mentions; two lines).
3. Boundary probe: ε_t = ½ (no edge) — α = 0, weights unchanged, the algorithm stalls; and ε_t = 0 — α = ∞: one perfect weak learner takes over; connect both to the bound's γ dependence.
4. Claim to refute: "AdaBoost overfits quickly because exponential loss explodes on outliers." Half-truth surgery: show the label-noise numbers (it IS noise-sensitive) yet the clean-data test curve falls for 1,000 rounds; separate the two phenomena and name what each depends on.
5. Mixed review (E3): recompute round 1 with decision-tree depth-2 weak learners on the XOR configuration where stumps fail (decision-trees' probe reused) — boosting's dependence on the weak-learner class.
6. Research-shaped: reproduce the stump ladder in miniature — boost stumps on a provided 2-class dataset; report test error at T = 1, 10, 100, 400 and the round where training error hits zero (the mystery reproduced on your own machine — this run feeds bounds-vs-practice later).
7. FORWARD (E7): at T=200 (train error 0), compute the margin y·f(x)/Σα for 10 test-set-nearest training points at T=200 vs T=1000 — the margins keep growing. Solution: naming and using that quantity is module 9's margin-bounds → Ref margin-bounds.

## ARC
- Inherits: trees/stumps (module 6), the bias-not-variance gap (bagging-random-forests), losses on the margin axis (module 4).
- Contributes: the bias half of the resolution — amplification of weak learners, its exact loss-minimization identity, and its proved training-error collapse; plus the course's second great open debt (post-zero test improvement).
- Hands off: generalizing the per-round move from exponential loss to ANY loss → gradient-boosting; the debt → module 9.
- Spine step: "The ensemble resolution…" (step 7).

## REVISION (vs old draft)
- Gains: the SSBD telescoping proof in full (draft states the bound); the two-rounds table verified and animated; the 1997 artifact image; the noise numbers from Breiman's paper; the debt staged as a figure with an explicit module-9 pin (the draft mentions margins parenthetically — now it is the structural cliffhanger); the margin-computing FORWARD exercise.
- Loses: interview register; "boosting vs bagging" bullet list becomes one argued paragraph (the race lesson owns the full comparison).
- Demo: none (unchanged).
