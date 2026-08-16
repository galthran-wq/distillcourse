# Conformal prediction — research brief

Lesson: `conformal-prediction` (module: uncertainty, core, planned). NEW.
Goal: Construct split-conformal prediction sets, prove the coverage guarantee from exchangeability, and choose score functions for regression and classification.

## Sources
- Angelopoulos & Bates 2023 (primary, read in full): §1 the recipe + fox-squirrel example (Fig 1 captured); Theorem 1 + Appendix D's proof (the exchangeability rank argument — a paragraph); §2 score functions (softmax/APS/CQR/scalar-uncertainty/Bayes-optimality); §3.1 adaptivity + the two-group marginal-vs-conditional figure (Fig 10); §3.2 calibration-set size (Beta(n+1−l, l) coverage law; Table 1's n(ε); the n≈1000 rule); §4.1–4.2 group/class-conditional variants; §4.3 risk control one paragraph; §6 full conformal one honest paragraph; §7 history (Vovk/Kolmogorov — the Kvant artifact captured).
- Murphy/GPML — the model-based contrast (internal Refs).
- Module 5 (internal): quantiles, calibration vocabulary, exchangeability vs iid.

## Key points
1. The flaw inherited, stated exactly: Bayesian/GP bars are conditional on the model (the mis-specification exercises of the last two lessons). Conformal's bargain: assume ONLY exchangeability; get finite-sample marginal coverage for ANY model's scores — validity for free, USEFULNESS still bought with a good model.
2. The recipe as four steps (score → calibration quantile q̂ at ⌈(n+1)(1−α)⌉/n → the set {y : s(x,y) ≤ q̂}) run FIRST on the fox-squirrel classification example with real numbers, then stated generally (L4 order).
3. The theorem PROVED in full (it fits in a paragraph and the course proves what it uses): exchangeability ⇒ the test score's rank is uniform among n+1 scores ⇒ P(coverage) ≥ 1−α (and ≤ 1−α+1/(n+1)) — with the tie/randomization honesty footnote. The course's LAST major proof, and its easiest — placed as a deliberate cadence.
4. Scores decide usefulness: the random-score degenerate case (valid, useless — the guarantee's scope made vivid); softmax-threshold vs APS for classification; residual and CQR for regression (CQR derived: quantile-regression base + conformal correction); the Bayes-score optimality sentence (posterior-density scores give smallest sets IF the model is right — the module's two roads reconciled).
5. Marginal ≠ conditional: the two-group construction (90%/10% — covered always/never yet marginally fine) — the L13-grade misreading refuted; group-balanced calibration as the repair; the impossibility of full conditional coverage stated (Vovk cited).
6. Calibration-set economics: coverage | calibration-set ~ Beta(n+1−l, l); the n≈1000 working rule with Table-1 numbers; checking coverage empirically (the R-trials protocol) — module 5's measurement discipline applied to the guarantee itself.
7. ★ Full/transductive conformal (retrain per candidate — the original, expensive form); ★ the history paragraph (Kolmogorov→Vovk; the Kvant artifact) — one image, three sentences.

## Set pieces & gems
- The fox-squirrel triptych (captured) — sets growing with difficulty; the intuition anchor.
- The proof-in-a-paragraph — a rare theorem whose full proof costs less than its statement's caveats; celebrate dryly.
- The random-score degenerate case — validity ≠ usefulness in one line.
- The Kvant/Vovk photo (captured) — the module's one historical garnish.

## Pitfalls
- Exchangeability vs iid: define exchangeability properly (iid ⊂ exchangeable); time series BREAK it — one honest deployment paragraph (weighted variants named only).
- The quantile's ⌈(n+1)(1−α)⌉/n finite-sample correction: get it exactly right (the classic off-by-one).
- Do not develop risk control/LTT (one paragraph, named); do not re-teach quantile regression (state the pinball loss in two lines with a module-3 seam).

## FIGURE PLAN
- source: agentle-fig1-imagenet-sets — stem `fox-squirrel-sets`, reader must see the three real photos with their actual prediction sets growing from 1 to 6 labels; placement: centered at the top (the recipe's output before the recipe).
- draw: FigureSequence (4 frames): the recipe — (1) calibration scores as dots on a line, (2) the ⌈(n+1)(1−α)⌉/n quantile drawn, (3) a test input's per-label scores, (4) the set = labels under the bar. Key image.
- draw: The proof picture — n+1 exchangeable scores as indistinguishable balls with the test ball equally likely in each rank slot; the counting inequality annotated. Proof-figure.
- draw: Marginal vs conditional — the two-group panel (recreation of the paper's Fig 10 idea): per-group coverage 100%/0% vs the marginal 90% stamp; then group-balanced calibration fixing it. Two-panel; the L13 slot's visual.
- draw: CQR — quantile-regression band on heteroscedastic data, conformal correction widening it uniformly to guaranteed coverage; the adaptive-width payoff vs constant-residual bands beside. Computed two-panel.
- draw: Coverage's own distribution — Beta densities of realized coverage at n = 100/1000/10000 with the α line; the n≈1000 rule read off. Computed; recreation of the paper's Fig 11 idea.
- source: agentle-fig18-kvant-vovk — stem `vovk-kvant`, reader must see the Vovk photo + 1976 Kvant scans; placement: float right in the ★ history paragraph.

## EXERCISE PLAN
1. Warm-up: n = 19 calibration scores given, α = 0.1 — find the quantile index ⌈20·0.9⌉ = 18, the q̂, and one test point's set.
2. Derivation skipped: prove the UPPER bound 1−α+1/(n+1) (the lesson proves the lower; the reader mirrors the rank argument without ties).
3. Boundary probe: α < 1/(n+1) — the required quantile exceeds every score; the set becomes ALL labels (the guarantee met vacuously); compute the minimal n for α = 0.01; then the random-score case — verify coverage empirically and describe the sets.
4. Claim to refute: "our conformal classifier covers 90% for every patient subgroup." Refute with the two-group construction; state what marginal coverage does promise, and the group-balanced repair's cost (per-group calibration data).
5. Mixed review (E3): wrap the logreg-lab's tumor classifier: scores = 1 − p̂(true class); compute q̂ on a calibration split and measure coverage + average set size on test (module 4/5 artifacts conformalized).
6. Research-shaped: reproduce the Beta law — for n = 100, α = 0.1, simulate 5,000 calibration/test draws, histogram realized coverage, and overlay Beta(91, 10); report the match.
7. FORWARD (E7): conformalize the GP from the previous lesson on a mis-specified example (SE kernel, periodic truth): compare the GP's 95% bars' realized coverage (< nominal) with the conformalized bands (≥ nominal). Solution: exactly this pairing on real data is the lab; and the model-vs-assumption-free trade is the Mauna Loa lesson's closing question → Ref gp-lab / mauna-loa.

## ARC
- Inherits: quantiles/calibration/protocol discipline (module 5), the model-conditionality wound (bayesian-linear-regression, gaussian-processes).
- Contributes: the assumption-free guarantee — recipe, proof, score design, and its honest limits (marginal, exchangeable).
- Hands off: the two uncertainty roads meet on real data (mauna-loa's closing comparison; the lab builds both).
- Spine step: "Predictions with guarantees…" (step 10).
