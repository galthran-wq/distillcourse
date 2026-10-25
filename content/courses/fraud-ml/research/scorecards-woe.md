# Logistic scorecards: weights of evidence, information value and points — research brief

Lesson: `scorecards-woe` (module: supervised, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Construct a points-based fraud scorecard from coarse-classified variables through weights of evidence to a scaled logistic regression, and explain why its one-coefficient-per-variable form is what a reviewer can check
Opening (verbatim, the lesson must start with it): A regulator, an investigator and a customer all need to see why a payment scored high, and a model with hundreds of interacting splits cannot show them. A scorecard gives each value of each variable a number of points and adds them up. How are the points derived from data so that the card is both a valid classifier and a table a reviewer can check line by line?

## Sources to consult
- Baesens et al. 2015, Ch2 "Categorization" (equal-interval vs equal-frequency bins; the odds pivot Table 2.5 — clothes 20:1 to movies 1:1 on 10,000 transactions with 1,000 frauds; Tables 2.6–2.7 empirical vs independence frequencies; χ² = 583 for option 1 vs 662 for option 2; Fig. 2.8 non-monotone fraud risk vs age), Ch2 "Weights of evidence coding" (Table 2.8, the 2,000-row age table: 1,806 non-fraud / 194 fraud, WOE from −107.83% at 18–22 to +166.08% at 44+), Ch2 "Variable selection" (Table 2.10 IV per bin summing to 0.6502; thresholds < 0.02, 0.02–0.1, 0.1–0.3, > 0.3; Fisher score; Cramer's V; 10–15 variables typical; filters are univariate) — `research/texts/fraudanalyti-s2-ch2-3.txt` (Tables around lines 1120–1315).
- Baesens Ch4 "Logistic regression" (odds and logit, maximum likelihood, odds ratio e^β, doubling amount ln2/β), "Building a logistic regression fraud scorecard" (Score = Offset + Factor × ln(odds); 100 points at 50:1 and 120 at 100:1 → Factor = 20/ln 2 = 28.85, Offset = 100 − Factor × ln 50 = −12.87; points per attribute (WOE_i β_i + β_0/N) Factor + Offset/N; Fig. 4.7 the scorecard table, firm scored 160 + 20 + 140 + …), "Variable selection" (t and Wald tests, forward/backward/stepwise, sign restrictions, operational latency, legal constraints) — `research/texts/fraudanalyti-s3-ch04a.txt` (lines ~420–520).
- Baesens Ch4 pp.188–189 (comprehensibility, justifiability, operational efficiency as criteria beside accuracy) and Ch1 Table 1.4 (interpretability, regulatory compliance) — `research/texts/fraudanalyti-s4-ch04b.txt`, `fraudanalyti-s1-preface-ch01.txt`.
- Baesens Ch6 "Backtesting" (the SSI is the information value again — a forward pointer only) — `research/texts/fraudanalyti-s6-ch6-7.txt`.
- Handbook Ch5 real-world model selection: logistic regression on the 14 features, regularisation nearly irrelevant (C = 0.1 vs 1 vs 10: AUC 0.816, AP 0.054, CP@100 0.211) — `research/texts/reproducible-Chapter_5_ModelValidationAndSelection_ModelSelection_RealWorldData.md`.
- GDPR Arts 13(2)(f)/15(1)(h) and AI Act Art 13 (a forward pointer: "meaningful information about the logic"; declared metrics) — the module-10 briefs carry the text.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The reader has a feature matrix and a referee. The first supervised detector is not the strongest but the one every other party can read: a table of points. The newcomer knows logistic regression (classical-ml). What they do not know is why a logistic regression on raw features is not reviewable (a coefficient on a continuous amount says nothing a reviewer can check against a case), how to make each variable enter as a monotone, bounded term, and how to turn log-odds into points that add. Terms the newcomer does not have: "coarse classification", "weight of evidence", "information value", "points per attribute", "pdo" (points to double the odds).

### Chain of sub-problems
1. **Why raw variables cannot be reviewed** — Obvious attempt: fit a logistic regression on the 14 features and show the coefficients. Why it fails: fraud risk is not monotone in age or amount (the age curve rises then falls); a single coefficient on a non-monotone variable fits badly and tells a reviewer nothing about a 23-year-old versus a 44-year-old; a reviewer checks cases, not slopes. Answer: bin the variable (coarse classification) so each bin is a case a reviewer can look up. Because: a table of bins is the only form in which "why this score" has a line to point at.
2. **How to bin** — Obvious attempt: equal-width bins. Why it fails: a tail bin with three frauds is noise; equal-frequency bins fix the counts but may split a flat region. Answer: start from equal-frequency or expert bins, then compare candidate groupings by how far the empirical bin×class table sits from independence — the χ² statistic: 583 for grouping option 1 of the product types, 662 for option 2, so option 2 keeps more dependence. Because: a binning is good when the bins separate the classes, and χ² against independence measures exactly that.
3. **Encoding a bin as a number** — Obvious attempt: one-hot the bins (seven dummies per variable). Why it fails: seven coefficients per variable, no ordering, unstable on the small bins. Answer: weight of evidence per bin, WOE = ln(share of non-frauds in the bin ÷ share of frauds in the bin); the age table: 18–22 holds 8.42% of non-frauds and 24.74% of frauds, WOE = ln(0.0842/0.2474) = −1.078 (−107.83%); 44+ holds 8.14% vs 1.55%, WOE +166.08%. Because: WOE is the log-likelihood ratio of the bin, so a logistic regression on WOE has one coefficient per variable and the sign carries the direction; near ±1 or more the bin is strong.
4. **Which variables earn a place** — Obvious attempt: all of them. Why it fails: 10–15 variables is what a reviewable card holds, and univariate strength is cheap to measure. Answer: information value IV = Σ_bins (Dist_non-fraud − Dist_fraud) × WOE; the age table sums 0.0103 + 0.1760 + 0.1016 + 0.0003 + 0.0957 + 0.1568 + 0.1095 = 0.6502, a strong variable (> 0.3); the ladder < 0.02 useless, 0.02–0.1 weak, 0.1–0.3 medium. Because: IV is the symmetric divergence between the two class distributions over the bins — large when the bins separate. The filter is univariate; correlated variables and interactions need the fit's own selection (stepwise with sign restrictions).
5. **From the fit to points** — Obvious attempt: report log-odds. Why it fails: nobody reviews a log-odds of 2.3. Answer: Score = Offset + Factor × ln(odds), fixed by two conventions — 100 points at odds 50:1 and 20 points per doubling (120 at 100:1) — giving Factor = 20/ln 2 = 28.85 and Offset = 100 − 28.85 × ln 50 = −12.87; with N variables, points for attribute i of variable j = (WOE_ij × β_j + β_0/N) × Factor + Offset/N, so a case's score is a sum of looked-up points: 160 + 20 + 140 + …. Carry the arithmetic through for one row. Because: a linear map of the log-odds keeps the ranking exactly and makes every attribute's contribution an integer a reviewer can read.
6. **What the card is as a classifier** — the same logistic regression, so the same AUC and AP as a logistic fit on WOE features; on real card data a plain logistic regression on the 14 features gives AUC 0.816, AP 0.054, CP@100 0.211 whatever the regularisation. Because: the card loses nothing to the fit and buys reviewability; what it loses against trees is the next lesson's subject.
7. **Constraints a reviewer adds** — sign restrictions (a variable must enter with the business's expected sign), operational latency (no feature that cannot be computed before the authorisation), legal limits (no protected attribute or proxy — forward to GDPR Art 9). Because: a scorecard is a document first and a model second.
8. **The same number later** — the IV formula reappears as the stability index in `model-risk-monitoring`; name it in one line. ★ Starred: Fisher score and Cramer's V as alternative filters; probit and cloglog links.

### Set pieces and worked examples to recreate
- The product-type pivot: clothes 6,000/300 (20:1) … movies 10/10 (1:1) on 10,000 rows; two groupings with χ² 583 vs 662 (Baesens Tables 2.5–2.7).
- The 2,000-row age table: counts, distributions, WOE per bin (−57.28, −107.83, −71.47, −3.38, +71.34, +119.71, +166.08 %), IV per bin and total 0.6502 (Baesens Tables 2.8, 2.10).
- Factor 28.85, Offset −12.87 from 100 @ 50:1 and 120 @ 100:1; the points formula; the firm scored 160 + 20 + 140 + … (Baesens Ch4 pp.131–133, Fig. 4.7).
- Non-monotone fraud risk vs age motivating bins (Baesens Fig. 2.8).
- Logistic regression on real card data: 0.816 / 0.054 / 0.211 regardless of C (Handbook Ch5 RWD).
- Odds ratio e^β and "doubling amount" ln 2/β as the reviewer's two readings of a coefficient (Baesens Ch4 pp.129–131).

### Pitfalls and terms to define
- WOE sign convention: this lesson uses ln(non-fraud share / fraud share), positive = safer; other texts flip it; state it once and keep it.
- "Distribution" in the table means the bin's share of its class, not the bin's fraud rate; a newcomer will read the 24.74% as a fraud rate.
- Percent notation for WOE in the source tables (−107.83%) is WOE × 100; typeset WOE as a plain number.
- The printed IV values use a decimal comma (0,1760); typeset with a point.
- "pdo" and "points to double the odds" — define before Factor.
- Offset/N and β_0/N spread the intercept over variables by convention; say it is a convention.
- Do not call the card "explainable AI"; the module-9 lesson owns explanation methods.

### Recalled, not re-taught
- Logistic regression, odds, logit, maximum likelihood (classical-ml): one clause; the lesson does not re-derive the fit.
- The feature matrix and its 14 features (`transaction-aggregates`, `point-in-time-features`): named as the inputs.
- Example-dependent cost and the BMR threshold (`example-dependent-cost`): the cut-off on the score is set by cost, recalled with a <Ref>.
- Card precision and AP (`alert-budget-metrics`): the referee.

## FIGURE PLAN
- draw: key image — the scorecard as a table: three variables, their bins, WOE, points; one case highlighted row by row with its points summed to 320; single `<Figure>` (inspired by Baesens Fig. 4.7).
- draw: fraud rate vs age as a non-monotone curve with equal-frequency bin edges overlaid and the WOE of each bin as a bar below; single `<Figure>` (inspired by Fig. 2.8 and Table 2.8).
- draw: `<FigureSequence>` 4 frames: raw variable → bins with counts per class → WOE per bin → points per bin, one variable carried through.
- draw: the two product-type groupings side by side with their empirical and independence tables and the χ² sums 583 and 662; single `<Figure>` (inspired by Tables 2.6–2.7).
- draw: IV contributions per age bin as a bar chart summing to 0.6502, the thresholds 0.02 / 0.1 / 0.3 as lines; single `<Figure>`.
- draw: the log-odds → points line: Score = −12.87 + 28.85 ln(odds) with the two anchor points (50:1, 100) and (100:1, 120); single `<Figure>`.
- draw: a reviewer's checklist beside the card: sign per variable, latency per feature, legal status per feature; single `<Figure>`.

## EXERCISE PLAN
1. [warm-up] From the age table's counts, recompute WOE and IV for the 30–35 bin and check 0.0957.
2. [boundary probe] A bin with zero frauds has WOE = +∞ and IV undefined; show what a 0.5-count smoothing does to the 44+ bin's WOE and IV and why the card needs a minimum bin count.
3. [claim to refute] "A higher IV always means a variable the scorecard should keep." Refute with a variable that is a proxy for the label through the feedback loop (terminal risk computed without delay — `point-in-time-features`) or a protected attribute: the step that fails is that IV measures separation, not admissibility.
4. [derivation skipped] Derive Factor and Offset for a card anchored at 600 points at 30:1 odds with 50 points per doubling, and show that any two anchors determine a unique line.
5. [research-shaped] Build the card on the simulator's 14 features with equal-frequency bins and score a test week with the module-2 harness; report AP and CP@100 next to the plain logistic regression's — the two should be close; say why.
6. [mixed review] Set the card's cut-off by the Bayes-minimum-risk rule of `example-dependent-cost` for a EUR 20 alert cost and show which score corresponds to which amount.
7. FORWARD → `gbm-model-selection`: fit a depth-6 tree on the same features and compare its AP with the card's; then list what the tree used that the card could not (an interaction of two bins) — the reader meets the price of reviewability before the next lesson quantifies it.

## ARC
- Spine step 4 "Supervised detectors compared": "On honest features under honest metrics, supervised detection is a model-selection problem: a scorecard the regulator can read, a boosted tree as the robust default, a feed-forward net for what trees cannot do — and the gap between model classes is smaller than the gap between metrics."
- Inherits: the feature matrix (module 3), the cost rule and the metrics (`example-dependent-cost`, `alert-budget-metrics`), logistic regression (classical-ml).
- Contributes: coarse classification, WOE, IV, the points scaling; the reviewer's constraints.
- Hands off: the card as one of the two detectors in `scorecard-vs-gbm-lab`; points as the explanation that needs no method in `alert-explanations`; IV as the stability index in `model-risk-monitoring`; sign and legal constraints to `gdpr-financial-crime-data`.
