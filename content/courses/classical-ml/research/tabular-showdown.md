# The tabular showdown: trees versus deep learning — research brief

Lesson: `tabular-showdown` (module: epilogue, core, planned). NEW — module 11's APPLICATION lesson (L16) and the course's closing chapter.
Goal: Evaluate the evidence that tree ensembles beat deep learning on tabular data and attribute the gap to inductive biases the course has named.

## Sources
- Grinsztajn, Oyallon & Varoquaux 2022 (the artifact, read in full): the 45-dataset benchmark and its hygiene (§3 — inclusion criteria, budget-aware evaluation, 15 reshuffles); the headline result (Figs 1–2 — trees above NNs at EVERY tuning budget; captured panel); Finding 1 (smoothed targets hurt trees not NNs — irregular functions; Fig 20's real decision boundaries captured, RF 85% striped vs MLP 80% blobs); Finding 2 (uninformative features — removing helps MLPs, adding hurts them; GBT barely moves); Finding 3 (random rotation REVERSES the ranking — Fig 6 captured; Ng 2004's rotational-invariance sample-complexity theorem as the theory hook); §A.6 (learning rate dominates; deeper trees help); the Kadra-et-al caveat (§A.5).
- Module-internal threads being cashed: xgboost (the winning family), bias-variance (spectral-bias reading), feature-engineering (uninformative features; the column basis as information), curse/knn (rotation and distance), double-descent (why NN's interpolation story doesn't rescue it here).
- Murphy Ch. 13 (MLP basics — ONE recap paragraph only; this course does not teach deep learning and says so).

## Key points (APPLICATION spec)
- The artifact: a NeurIPS benchmark paper — 20,000 compute-hours, 45 curated datasets — read as evidence, with its methodology audited by module-5 standards (budget-aware curves, not single best numbers — the paper practices what module 5 preached).
- Module results used: gradient-boosted trees and forests (module 7 — the winners under examination); evaluation discipline (module 5 — why the budget-curve methodology is the right one); bias–variance/inductive-bias language (modules 1–3); rotation/dimension geometry (module 1); the fixed-vs-learned-features frame (random-features).
- Where the idealization departs: medium-size (10k) mostly-numeric curated datasets — the paper's own scope statements (small data, huge data, missing values, high-cardinality categoricals all excluded); benchmark composition drives conclusions (the Kadra counterpoint honestly presented); 2022's NN architectures — the gap is an empirical claim with a date, not a law.
1. The result, with its methodology foregrounded: normalized-score-vs-search-budget curves; trees on top at every budget; the gap not a tuning artifact — the reader must see WHY this protocol answers the "you just didn't tune the NN" objection (module 5's lesson at benchmark scale).
2. Finding 1 — irregular targets: the ablation logic (smooth the target; watch who suffers); the electricity-boundary picture (RF's stripes are REAL structure — the fine date-structure a smoothness prior erases); connect to spectral bias vs piecewise-constant fits, and BACK to splines (module 3's smoothness prior as exactly what tables violate).
3. Finding 2 — uninformative features: tables are full of them (the GBT-on-discarded-features-scores-random evidence); MLPs degrade, trees shrug; feature-engineering's SSBD threads cashed (the course predicted this axis).
4. Finding 3 — rotation: the reversal experiment as the course's cleanest inductive-bias demonstration EVER (identical information, new basis, opposite winner); Ng 2004's theorem stated (rotationally-invariant learners need Ω(irrelevant-feature-count) samples); why tabular columns are a MEANINGFUL basis (units, semantics) that rotation destroys — and why images are the opposite case (the reason deep learning won vision is the same reason it loses tables — the epilogue's symmetry).
5. The course's close: the one question answered per regime — what constrains (bias by architecture or penalty), what averages (ensembles), what measures (protocols), what guarantees (bounds, coverage) — and the tabular verdict as classical ML's living relevance; three sentences, dry, final. The three design challenges (paper's own list) as the open frontier.

## Set pieces & gems
- The rotation reversal — the single most striking experiment in the course's canon; give it full staging.
- The electricity decision boundaries (captured crops) — irregularity as REAL signal, visible.
- The paper's own honesty apparatus (§A.5 Kadra caveat; scope statements) — a model of calibrated claims, read as such.
- The symmetry sentence: rotation-invariance loses tables for the same reason it wins images.

## Pitfalls
- This course does not teach neural networks — the MLP/Transformer entrants get two recap sentences and a pointer; the lesson is about EVIDENCE and INDUCTIVE BIAS, not architectures.
- Do not future-proof claims ("trees will always win") — the artifact is dated evidence; say so.
- The three findings are ablation logic — present the experimental DESIGN as the teachable skill (design→inference), matching E6's research-shaped ethos.

## FIGURE PLAN
- source: whydo-fig1-panel-classification-numerical — stem `benchmark-curves`, reader must see the real budget-vs-score curves with tree methods above NN methods throughout; placement: centered after the methodology section (the headline evidence).
- draw: The methodology as module-5 practice — the evaluation pipeline (45 datasets → random search → 15 reshuffles → normalized budget curves) drawn as a protocol diagram with the module-5 laws it satisfies annotated. Single Figure.
- source: whydo-fig20-decision-boundaries-rf-crop + whydo-fig20-decision-boundaries-mlp-crop — stem `electricity-boundaries`, reader must see the two real fitted boundaries side by side (striped RF vs smoothed MLP, 85% vs 80%); placement: the Finding-1 section, two floats or one combined panel (real fitted models; redrawing would fabricate the evidence).
- draw: The three ablations as one design diagram — (smooth the target / add junk features / rotate the basis) each as an arrow transforming the data, with the who-suffers verdict per arrow. The experimental-design teaching figure; key image.
- source: whydo-fig6-panel-a-crop — stem `rotation-reversal`, reader must see the measured before/after-rotation boxplots with the ranking flipped; placement: the Finding-3 section, float right.
- draw: The course's closing map — the spine's eleven steps as a single strip with the one-line answer each contributed to "why does a finite sample guarantee anything?"; the tabular verdict as the final panel. The course's last figure.

## EXERCISE PLAN
1. Warm-up: from the benchmark's normalized-score definition (given), compute the normalized score of a model achieving 0.86 when the best/worst on that dataset are 0.90/0.60.
2. Boundary probe: apply Finding 3's logic to one-hot-encoded categoricals — what does a random rotation do to a one-hot column, and why does that make the rotation test an argument about REPRESENTATION, not just geometry?
3. Claim to refute: "the benchmark proves deep learning is wrong for tables." Refute by scope audit: list the paper's own exclusions (size, missingness, cardinality) and the Kadra counterpoint; state what IS established (an inductive-bias mismatch on this data regime, with mechanisms) — the module-5 skill of reading a benchmark, applied one last time.
4. Derivation skipped: state Ng's rotational-invariance result precisely and show a GBT is NOT rotationally invariant (exhibit a dataset + rotation changing its fitted function — one split suffices).
5. Research-shaped (core): reproduce Finding 2 in miniature — one tabular dataset, add 0%/30%/60% Gaussian junk features, fit tuned GBT and MLP (helpers provided), plot the two degradation curves; compare with the paper's Fig 5 pattern.
6. Mixed review (E3): reproduce Finding 1's ablation in miniature — Gaussian-smooth the target of a tabular regression at three lengthscales, fit GBT vs a smooth model (your gp-lab or splines), and report who degrades; connect to the smoothness priors of modules 3/10.
7. FORWARD (E7): none — this is the course's final lesson; instead, a CLOSING exercise: for one dataset you own, write the three-sentence inductive-bias audit (what constrains, what averages, what measures/guarantees) the course has trained — the transferable artifact. Solution sketc­h names the spine steps each sentence draws on (course-level retrieval).

## ARC
- Inherits: everything — the winners (module 7), the measurement discipline (module 5), the bias vocabulary (modules 1–3), the fixed-vs-learned frame (random-features).
- Contributes: the course cashed out on the live frontier — a modern benchmark read with classical eyes, the gap explained by the course's own concepts, and the closing answer to the course's one question.
- Hands off: nothing — the close names what remains open (the paper's three design challenges) and ends.
- Spine step: "Where the classical story breaks… on tables, the classical ensemble still wins" (step 11, closing move of the course).
