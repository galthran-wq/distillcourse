# Alert-feedback selection bias and learning from feedbacks plus delayed samples — research brief

Lesson: `alert-feedback-selection-bias` (module: adversary, core, planned). NEW.
Goal: Analyze the sample selection bias created by labelling only alerted transactions, show why importance weighting cannot remove it, and derive the feedback-plus-delayed-sample learning strategy.

## Sources
- Dal Pozzolo et al. 2018 (primary, read in full): Sec. I (verification latency and alert–feedback interaction as the two ignored realities); Sec. II-C (feedbacks vs delayed samples; silence = genuine); Sec. III (A_t top-k by rank, Eq. 1; F_t = recent transactions of cards(A_t), Eq. 2; D_{t−δ}, Eq. 3; F_{t−δ} ⊂ D_{t−δ}; P_k, CP_k, NCP_k); Sec. IV-C3 (sample selection bias: feedbacks chosen by the previous classifier, different fraud proportion, card-clustered; three types — class-prior bias, feature bias/covariate shift, complete bias; importance weight w = P(s=1)/P(s=1|x,y), Eq. 10, corrects covariate shift; fails for alert feedback because selection depends on y and correlates with P(+|x); active learning infeasible — investigators must check the most suspicious, not the most informative); Sec. V (separate classifiers F_t on Q days of feedbacks and D_t on M days of delayed samples; P_A = αP_F + (1 − α)P_D, α = 0.5, Eqs. 7–9, Algorithm 1; Q = δ + M; rationale: feedbacks outnumbered by delayed samples would lose weight if pooled; alert only what both consider fraud; delayed samples unbiased but obsolete); Sec. V-A (sliding-window W/AW and ensemble E/AE variants; RF with balanced bootstrap); Sec. VI-A (datasets 21.8M / 54.8M e-commerce, 0.19–0.24% fraud; CARD ID removed); VI-B (k = 100 cards, δ = 7, M = 8, Q = 15; Friedman on daily ranks; footnote: overlapping windows break rank independence); VI-C Table III (2014–15: AW P_k 0.77 vs W 0.61, CP_k 0.37 vs 0.25; F alone beats W and W^D on P_k/CP_k but worst AUC 0.87; R best AUC 0.96 but mid on P_k — metric disagreement); VI-D drift (S < W^D < AW; synthetic abrupt drift 7.7% vs 12.5%); VI-E Table IV (importance-weighted F no better: P_k 0.68 vs 0.73; the amount > 500 sanity check where weighting works — pure covariate shift); VI-F Table V (δ = 15, Q = 30 still improves F and AW, CP_k 0.38), Table VI (NCP_k rises 0.40 → 0.48 as k 100 → 300 — hiring guideline), adaptive α gave no gain (mean 0.52); Sec. VII (adaptive aggregation, learning to rank, semi-supervised).
- Dal Pozzolo 2015 Sec. III (selection variable formalism: p(s|y,x) = p(s|y) keeps p(x|y) — the class-dependent case; undersampling as selection bias by design vs intrinsic bias — the bank sees only accepted applicants): the same mathematics, now with p(s|y,x) depending on both.
- Lucas & Jurgovsky Sec. 3.3 (delayed-label aggregation summarised; Fig. 6) and Sec. 3.2 (importance-weighted CV, Sugiyama).
- Baesens Ch4 p.123 (the insurance funnel: small claims never labelled — selection bias in labels), Ch6 pp.287–288 (inspector pre-screening: a cleared firm stays high-scored because its drivers did not change — the model should absorb inspector knowledge), Ch1 p.23 (reinforcement learning as an automated option — one line).
- Bolton & Hand Sec. 2 (undetected fraud labelled legitimate — label noise of unknown extent); Breiman's comment (the butterfly-star active-learning loop — the contrast case where experts label the top-scored objects on purpose).
- Altman Sec. 3.1 and 7 (real AML labels incomplete; false negatives corrupt training and evaluation) — the extreme instance.
- Dalvi Assumption 4 (training set untainted) — what this lesson breaks.
- Gama Sec. 5 (closed-loop / reinforcement feedback breaks replay-of-history evaluation; representation bias) — the evaluation consequence.
- Handbook Ch2.3 (investigators label alerts; the primary DDM goal is precise alerts) — recall.

## Key points
1. The loop restated as a sampling mechanism: the fastest labels are F_t, selected by the previous model's top-k; the complete labels D_{t−δ} arrive δ days later; between them the model is retrained on a mixture it chose. Three bias types derived with the selection variable: p(s=1|x, y) for alerts depends on both x (the score is a function of x) and y (investigators confirm frauds; blocked cards generate more feedbacks).
2. Why importance weighting fails: the covariate-shift correction w = P(s)/P(s|x) assumes p(y|x, s=1) = p(y|x); for alert feedback the selection is on the score, which is an estimate of p(y|x) — the selected set's conditional label distribution is not the population's; the sanity check (select on amount > 500 — pure covariate shift — weighting works; select on alerts — it does not); Table IV's numbers.
3. Why active learning is not the answer: the budget must go to the most suspicious (value), not the most informative (learning) — the investigators' job is detection; the contrast with Breiman's butterfly-star loop where labelling the top-scored IS the goal.
4. The strategy derived: two classifiers on two populations (F recent, biased, fraud-rich; D complete, unbiased, old), averaged — not pooled; the argument from weight (pooling drowns F in D) and from agreement (alert what both rank high); Algorithm 1; the window/ensemble variants; the result (AW P_k 0.77 vs pooled 0.61); F's AUC worst and alert precision near-best (metric disagreement again); δ = 15 still works; NCP_k with k as the hiring case.
5. The evaluation consequence (Gama Sec. 5): once the model selects its own labels, replaying history cannot evaluate a different policy (the labels of the un-alerted are unknown) — offline backtests are optimistic; the silence-is-genuine convention and its error set (the undisputed frauds).
6. The label funnel beyond cards: the insurance funnel (small claims never labelled), AML's incompleteness — the course's general statement: every supervised fraud model is trained on the output of the previous detection process.
7. ★ Starred: the Friedman-on-ranks footnote (overlapping windows); the pre-screening paradox (cleared firm stays high-scored); reinforcement-learning framings named, not developed.

## Set pieces & gems
- The amount > 500 vs alert selection contrast — the single most teachable pair in the module.
- Table III: F worst AUC (0.87), near-best P_k; R best AUC (0.96), mid P_k.
- AW 0.77 vs W 0.61 on P_k; CP_k 0.37 vs 0.25.
- NCP_k 0.40 → 0.48 as k goes 100 → 300.
- "Active learning is infeasible: investigators must check the most suspicious."
- α_t's mean 0.52 — a plain 0.5 kept.
- Gama: the closed loop breaks replay evaluation.

## Pitfalls
- Keep the selection-variable notation identical to imbalance-techniques-revisited (same s, same p(s|y)) so the undersampling case is visibly the special case.
- "Reject inference" (credit-scoring term) is not in the canon read; name it once as the credit-scoring relative and do not develop it.
- The 2018 paper's simplifications (alerts by ranking at end of day; labels all at δ) are stated in the paper — repeat them.

## FIGURE PLAN
- draw: `<FigureSequence>` (4 frames) of the loop as sampling: (1) day t's transactions with the model's ranking, (2) the top-k alerted and labelled (fraud-rich, high-score slice), (3) the rest unlabelled, read as genuine, (4) day t + δ when the delayed labels arrive and the two populations F and D sit side by side with their class mixes — stacked bars. Inspired by Dal Pozzolo 2018 Fig. 2 (recreated). Key image.
- draw: The three bias types as three near-identical scatter panels: prior shift (class mix changes), covariate shift (x-density changes, p(y|x) same), complete (both) — with the alert case placed in the third (voita rule 8).
- draw: Importance weighting on two selections: left, selection on amount > 500 (a vertical cut in x — weights recover the population); right, selection on score (a cut along the model's boundary — the selected positives' x-distribution is not the population's); the weight formula dissected under each.
- draw: Algorithm 1 as a tiered diagram: feedbacks (Q days) → F classifier; delayed samples (M days) → D classifier; average → alerts; with the window geometry (δ, M, Q) on a timeline. Inspired by Fig. 4.
- draw: Table III as a dot plot: R, W, F, W^D, AW on P_k, CP_k and AUC with lines per model — the disagreement visible.
- draw: NCP_k vs k (100, 150, 300) for AW — the hiring curve. From Table VI.

## EXERCISE PLAN
1. Warm-up: a day has 10,000 transactions, 25 frauds, k = 100 alerts with precision 0.4; compute F_t's fraud share, D_{t−δ}'s, and the pooled set's share for M = 8 days of D and Q = 15 of F.
2. Derivation the lesson skipped: write p(y | x, s=1) for selection on amount > 500 and show it equals p(y | x) (so importance weights on x suffice); then for selection on score ŝ(x) ≥ τ where ŝ is correlated with y given x's observed part — show the equality fails when the score uses information about y beyond x (card history, investigator confirmation); state the exact condition.
3. Boundary probe: δ → ∞ (no delayed samples ever) — the strategy reduces to F alone; what Table III says about F alone (best P_k, worst AUC) and why the model then never sees its own false negatives; and δ = 0 (F ⊂ D immediately) — the strategy reduces to D.
4. Claim to refute: "Since feedbacks are the freshest labels, a model should be retrained on feedbacks only, with importance weights to correct their bias." Refute with Table IV (weighted F no better) and the mechanism (selection on y); name the second population the strategy needs and why it is averaged rather than pooled.
5. Research-shaped: simulate the loop on the simulator for 30 days (k = 100, δ = 7): train F on feedbacks, D on delayed samples, score day t with F, D, pooled W and averaged AW; report P_k per day and the Friedman ranks — reproduce the AW > W ordering.
6. FORWARD (E7): in the same simulation, log which cards were alerted and when; the reader notices that the training set's definition depends on what was recorded about each alert (disposition, timestamp) → lands on `label-maturation`'s alert ledger and on `score-to-action`'s routing (what counts as an alert).
7. Mixed review (E3): the undersampling correction (imbalance-techniques-revisited) is the s = s(y) case; write the feedback case's p(s|x, y) and state why no closed-form correction exists; then relate the Elliptic step-43 collapse (elliptic-illicit-nodes) to prior shift in D.

## ARC
- Inherits: the loop's label mechanics (fraud-detection-system); the selection-variable algebra (imbalance-techniques-revisited); the delay geometry (delayed-labels-prequential); drift strategies (module 7); the adversary's tainted training set (adversarial-classification).
- Contributes: selection bias as the loop's own product, the failure of reweighting, the F/D aggregation strategy, the evaluation consequence.
- Hands off: the replay (arms-race-replay); routing and dispositions (score-to-action, label-maturation); the capstone's daily loop (feedback-delayed-retrain checkpoint).
- Spine step 8: the adversary and the feedback loop.
