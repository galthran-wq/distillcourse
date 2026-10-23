# Logistic scorecards: weights of evidence, information value and points — research brief

Lesson: `scorecards-woe` (module: supervised, core, planned). NEW.
Goal: Construct a points-based fraud scorecard from coarse-classified variables through weights of evidence to a scaled logistic regression, and explain why its monotone one-coefficient-per-variable form is what a regulator can read.
Prerequisite from classical-ml: logistic regression, log-odds, cross-entropy fit — recalled only.

## Sources
- Baesens Ch2 "Categorization" / "Weights of evidence coding" / "Variable selection" (primary): equal-interval vs equal-frequency binning; odds pivot tables (Table 2.5: 10,000 transactions, 1,000 fraud; odds clothes 20:1 to movies 1:1); chi-squared comparison of two binnings (583 vs 662 — option 2 better); WOE = ln(Dist No-fraud / Dist Fraud); Tables 2.8/2.10 age bins with WOE from −107.83% to +166.08%, IV 0.6502 on a 2,000-row sample; IV = Σ(DistGood − DistBad)·WOE with thresholds < 0.02 / 0.02–0.1 / 0.1–0.3 / > 0.3; Fisher score, Cramér's V (χ² = 10.41, V = 0.10, cut-off 0.1); typical fraud model 10–15 variables; filters are univariate; operational and legal constraints limit variables. Fig 2.8 non-monotone fraud risk vs age motivating binning.
- Baesens Ch4 pp.127–136: logistic model, odds ratio e^β, doubling amount ln 2/β; scorecard scaling Score = Offset + Factor·ln(odds), Factor = pdo/ln 2; 20 points per doubling, 100 points at 50:1 and 120 at 100:1 → Factor 28.85, Offset −12.87; per-attribute points = (WOE·β + b₀/N)·Factor + Offset/N (Fig 4.7); variable selection: t/Wald tests, forward/backward/stepwise, sign restrictions (business acceptance), operational efficiency (no trend variables in real time), legal constraints; Ch4 pp.188–189 comprehensibility and justifiability; Ch4 p.156 LP classifier with business constraints w₁ ≥ w₂.
- Baesens Ch6 pp.302–311 (forward only): SSI is the same formula as IV — one sentence; model-risk-monitoring takes it up.
- Lucas & Jurgovsky Sec. 4.1: likelihood (target) encoding is feature engineering with labels — WOE is its logged, binned form; leakage as in classical-ml.
- Handbook Ch3/Ch5: LR as the fastest-to-train, worst-on-all-metrics model on real data (0.816/0.054/0.211) yet near the top on the simulator (0.868/0.623/0.297); regularisation nearly irrelevant — the baseline the scorecard competes against.
- AMLR Art 76(5)(c), AI Act Art 13(3) and Art 86, GDPR Art 15(1)(h) — one sentence each: the explanation duties a scorecard satisfies by construction (forward to module 10).
- HKU FITE7410 A2: target encoding by fraud mean over the full data before the split — the leakage counterexample.

## Key points
1. Coarse classification: why bin (non-monotone risk vs age; stability; a tree-like step function inside a linear model); equal-frequency vs equal-interval; comparing binnings by chi-squared on the odds table (583 vs 662 computed).
2. WOE: definition, sign convention, the worked age table (reproduce Table 2.8's WOE column and IV 0.6502); what WOE buys — each variable enters the logistic regression as one monotone-in-risk numeric column with one coefficient; IV as the univariate screen with its thresholds; the relation to classical-ml's target encoding (log of the odds ratio per bin; same leakage; same K-fold fix).
3. The logistic fit on WOE columns and its reading: coefficients near 1 if WOE is "right", odds ratios, the doubling amount.
4. Scaling to points: derive Factor and Offset from two anchor conditions (100 at 50:1, 120 at 100:1 ⇒ pdo = 20, Factor = 20/ln 2 = 28.85, Offset = 100 − 28.85·ln 50 = −12.87); points per attribute; the total score as a sum; a worked card scored (160 + 20 + 140 + …).
5. Variable selection under constraints: significance AND expected sign; operational (latency) and legal (protected attributes, GDPR Art 9) exclusions; filters are univariate — the correlation-filter blind spot (classical-ml) recalled.
6. Why the regulator reads it: every step is a table; monotonicity is enforced, not hoped for; the explanation is the points themselves (forward to alert-explanations, eu-ai-act-fraud Art 13); the cost: no interactions unless hand-built, and the handbook's LR numbers on real data.
7. ★ Starred: Cramér's V and Fisher score as alternative filters; the LP scorecard with business constraints; SSI = IV preview.

## Set pieces & gems
- 583 vs 662: comparing binnings by chi-squared.
- Table 2.8: WOE −107.83% to +166.08%, IV 0.6502 — the lab's exact fixture.
- Factor 28.85, Offset −12.87 from 20 points per doubling.
- HKU A2's target-encoding leak as the near-miss.
- The handbook's LR: fastest and worst on real data — the honest price of linearity.

## Pitfalls
- WOE sign conventions differ across texts (good/bad vs bad/good); fix Baesens' and say the other exists.
- Do not claim scorecards are required by law — they satisfy explanation duties conveniently; module 10 states the actual obligations.
- No derivation of logistic regression (classical-ml).

## FIGURE PLAN
- draw: `<FigureSequence>` (4 frames) of one variable's journey: (1) raw age histogram with non-monotone fraud rate, (2) equal-frequency bins with odds per bin, (3) WOE per bin as a bar chart (monotone after merging), (4) the bin's points on the card. Inspired by Baesens Fig 2.8 and Tables 2.8/2.10. Key image.
- draw: Two candidate binnings of the same variable as two near-identical odds tables with their chi-squared (583 vs 662) — comparison panels (voita rule 8).
- draw: The IV formula dissected in place: Σ (DistGood − DistBad) × WOE with the three terms colour-bound to the table columns (voita rule 7).
- draw: The scaling line Score = Offset + Factor·ln(odds) on a (ln odds, score) plot with the two anchor points (50:1 → 100, 100:1 → 120) and pdo = 20 marked.
- draw: A filled scorecard as a table figure (variable, attribute, points) with one applicant's row highlighted and the total summed — the artifact a reviewer reads.
- draw: Target encoding vs WOE on the same categorical with a K-fold schematic showing where the label enters — inspired by classical-ml's feature-engineering lesson (Ref), with the fraud twist (delay clock) added.

## EXERCISE PLAN
1. Warm-up: compute WOE and IV for a provided 5-bin table (counts of fraud/non-fraud per bin).
2. Derivation the lesson skipped: derive Factor and Offset for "600 points at 30:1, 20 points per doubling" and show the per-attribute points formula sums to the total score exactly (the b₀/N split).
3. Boundary probe: a bin with zero frauds — WOE is +∞; what IV does; the Laplace fix and the merge-bins fix; which the handbook's convention (precision = 1 when TP + FP = 0) resembles.
4. Claim to refute: "A variable with IV = 0.9 should always enter the scorecard." Refute on leakage (an IV that high on a fraud problem usually means a label proxy — terminal risk computed without delay) and on legal exclusion; name the two tests to run before accepting it.
5. Research-shaped: reproduce Table 2.8's IV = 0.6502 from its counts, then rebin the same counts into three bins and report the IV loss.
6. FORWARD (E7): fit the WOE logistic regression on the simulator features and a depth-6 tree on the raw features, score the test week with the module-2 harness: the reader finds the tree ahead on AP and asks what the ensemble adds and at what cost → lands on `gbm-model-selection`.
7. Mixed review (E3): compute the SSI between the training bin distribution and a later week's using the IV formula (the reader discovers the identity; model-risk-monitoring names it).

## ARC
- Inherits: costs and the harness (module 2); features (module 3); classical-ml's logistic regression and encodings.
- Contributes: the interpretable detector — binning, WOE, IV, points — with its constraints and its price.
- Hands off: the comparison (worldline-model-comparison; scorecard-vs-gbm-lab); points as explanation (alert-explanations); SSI (model-risk-monitoring); explanation duties (module 10).
- Spine step 4: "On honest features under honest metrics, supervised detection is a model-selection problem: a scorecard the regulator can read, a boosted tree as the robust default, a feed-forward net for what trees cannot do — and the gap between model classes is smaller than the gap between metrics."
