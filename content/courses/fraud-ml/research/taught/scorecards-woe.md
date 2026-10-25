# scorecards-woe — ledger

**Problem.** How to derive a points table from data that ranks payments as a
classifier does and that a reviewer can check line by line (each line = a
countable group, its direction agrees with the group's counts, lines add up).
Answer: coarse-classify each variable (label-driven cuts, min bin size, one
direction), encode bins by WOE, shortlist by IV, logistic regression on WOE
columns with every β_j < 0 (sign check), rescale log-odds to points (20 per
doubling, intercept spread over lines). On the simulator test week the card
ties the raw regression on CP@100 and AUC and loses AP 0.64 → 0.52, all of it
from the one-direction rule on the terminal 30-day rate.

## Explained
- Why a raw coefficient can't be reviewed: a slope claims every extra euro moves odds equally; simulator training-week fraud rate vs amount is flat (0.67% below €160) then jumps (2.1%, 3.7%, 66% above €201.82 = 132 of 200); categorical variables need one dummy per value (49 for 50 countries) — §A reviewer checks groups, not slopes (figure amount-rate.svg)
- Definition: coarse classification (bins; "missing" allowed as a bin) — same §
- χ² against independence to compare groupings (expected = row share × column count); product-type table 10,000 orders / 1,000 fraud; option 1 χ² ≈ 584, option 2 ≈ 663 (exact sums 583.9 / 662.9; terms shown rounded; same df, comparable); option 2 wins by gathering risky categories (3.4:1 vs 9:1) — §Where to cut / ### Grouping categories (figure product-groupings.svg)
- Equal-width / equal-frequency fail (label-blind): top decile €110–€789 holds 6,723 payments, 194 fraud (2.9%), mixing the 200 above €201.82 with 6,523 ordinary; label-driven cut search = one-variable decision tree; two brakes: min bin size (card: ≥200 training payments, ≤5 bins) and one direction (merge neighbours until fraud rate monotone; reason: non-monotone bin needs a story) — ### Cutting a number
- KeyFact: min bin size sets resolution — bin above €201.82 has exactly 200 payments, cut at €220 would leave 77/123; card can't tell €205 from €600 (9 of 77 between €202–220 fraud, all above €220) — same §
- Why not one dummy per bin (≈20 coefficients for 7 variables, no order) — §One number per bin
- Definition: WOE_i = ln((g_i/N_g)/(f_i/N_f)), positive = safer (course convention; other texts flip); share columns are distributions, not fraud rates (18–22: share 24.74% vs rate 24%) — ### The definition, on a table of applications (application/subscription fraud framing)
- WOE = population log-odds of fraud − bin log-odds: ln(f_i/g_i) = ln(N_f/N_g) − WOE_i; single-WOE logistic regression returns β = −1, β0 = ln(N_f/N_g) (simulator amount: −1.00, −4.71); with several columns a coefficient can land anywhere (split, ≈0, or positive), hence it must be checked; expected sign negative for EVERY variable whatever its raw shape; with β_j < 0 bins keep WOE order — ### What the weight of evidence is
- Missing bin gets own WOE (−0.57: riskier) — same §
- Definition: IV = Σ (g_i/N_g − f_i/N_f)·WOE_i; every term ≥ 0 (same sign), zero iff distributions equal; ladder <0.02 useless, 0.02–0.1 weak, 0.1–0.3 medium, >0.3 strong, stated as a credit-scoring rule of thumb, not derived; typical fraud model 10–15 variables — §Which variables earn a line (figure age-iv.svg)
- Simulator IVs (binned as above): terminal rate 7d 2.38, 30d 1.87, 1d 1.36; amount 1.28; card avg 1d 0.82, 7d 0.63, 30d 0.26; counts 0.001–0.057; weekend 0.002, night 0.003 (script: times around noon, no scenario uses them; counts unchanged by leaks); gap between 0.26 and 0.057 (cut-off NOT chosen here) — ### The simulator's fifteen inputs (figure iv-inputs.svg, fifteen bars only, no ratio bar)
- IV is univariate, depends on binning; shortlists, doesn't decide; why the cut-off is low (0.1 not 0.3): a variable kept can still be dropped by the fit, one dropped never reaches it; 0.3 would drop the 30-day average (0.26); the 0.1 cut-off and the seven kept inputs are named here, once; same sum between weeks = stability check (forward pointer) — ### What the filter cannot see
- First fit (7 IV-passing inputs, training week) gave 30-day average β = +0.22 against its WOE column (top bin 42/479); not a fitting error: variable acts as reference point for the others → replaced by ratio amount ÷ 30-day avg (IV 1.86; Ref transaction-aggregates exercises) → refit β0 = −4.90, β from −0.22 to −1.02, all negative = the card (the 0.3-cut-off consequence is stated once, in ### What the filter cannot see) — §Fitting the card: one sign to check per line / ### The first fit
- Why the WOE sign check is uniform: on a raw input a rising fraud rate calls for a POSITIVE slope (opposite sign to the WOE convention); raw regression on the card's 7 raw inputs (ratio in place of 30-day avg) gives negative slopes to amount (runs against its steadily rising counts) and terminal 30d rate (no expected sign: tree bins rise 0.5%→56% then fall to 5%); raw slope has an expected sign only for a steadily rising/falling variable, never for categories or a missing value; WOE columns need no such knowledge (no KeyFact in this section) — ### Why the check is one rule for every line
- Scaling: S = Offset + Factor·ln(p/(1−p)), fraud direction (higher = more suspicious); anchors 100 points at fraud odds 1:50, 20 points to double the odds → Factor = 20/ln2 = 28.85, Offset = 212.87; 80 ↔ 1:100, 120 ↔ 1:25, 40 points = ×4 odds — §From log-odds to points (figure score-line.svg)
- Points per bin: Factor·(β_j·WOE_ij + β0/J) + Offset/J (intercept/offset spread is a convention; alternative: safest bin 0 + base score) — ### Points per line
- Points spread = Factor·|β_j|·WOE spread (amount: 10.2 points per WOE unit, 5.66 units → 58 points) — FigureSequence amount-card-1..3 with Task
- Simulator card = the second fit (key image scorecard.svg) and worked payment read off it; IN BODY: the card's WOE adds 0.5 to every bin's genuine and fraud count (guard against zero-fraud bins; moves amount-line WOE by ≤ 0.06), worked amount-bin arithmetic printed with 68.5 / 132.5 — ### The simulator card
- AP splits into fraud groups' shares (AP = mean of precision at each fraud); loss is in scenario-2 (terminal) frauds 0.34 vs 0.45; cause: one-direction merge of terminal 30-day rate (training bins 0.52%, 4.2%, 43%, 56%, 5.2% for >0.67 = 12/229; merged >0.11 = 242/697, 35%); unmerged line restores AP 0.604 — §The card on the test week: what the readable form costs / ### Where the average precision goes (figure terminal30.svg)
- (no KeyFact in this section: the card/regression contrast on the terminal 30d line is stated in the body and the Conclusion)
- Reviewer checks beyond sign: input exists at scoring time (all seven lines do; terminal rates because they read labels ≥ 7 days old, point-in-time), input legally usable (names visible; → gdpr-financial-crime-data) — ### What else a reviewer checks

## Notation
- g_i, f_i genuine / fraud counts in bin i; N_g, N_f totals; WOE_i, WOE_ij (bin i of variable j); WOE_j(x) WOE of x's bin on variable j
- IV information value; J number of card variables (lines); β0, β_j logistic coefficients on WOE columns (β_j < 0 expected)
- S score; Offset, Factor (written as words); points_ij; "points to double the odds" = 20
- p, odds = p/(1−p) fraud odds, written 1:k (one fraud per k genuine)

## Running cases
- Simulator training week 25–31 Jul 2018 (67,240 / 598), test 8–14 Aug (58,264 / 385 after known-card removal) = alert-budget-metrics setup; all fits logistic regression at library defaults; binning = one-variable tree, ≤5 bins, ≥200 training payments, monotone merge, WOE with +0.5 added to every bin count, totals unchanged (stated in body, ### The simulator card)
- Amount bins (training, payments / frauds): ≤160.34: 66,169 / 444 (WOE +0.283, 7 pts); 160.34–182.62: 652 / 14 (−0.929, 20); 182.62–201.82: 219 / 8 (−1.499, 25); >201.82: 200 / 132 (−5.373, 65). Amount β = −0.352
- Final card (7 lines), β0 = −4.90; points: amount 7/20/25/65; ratio (cuts 2.04, 2.26, 2.52) −2/44/95/185; card avg 1d (125, 144, 156, 178) 9/17/21/24/38; avg 7d (99, 110, 122, 139) 5/21/31/58/92; terminal rate 1d (0.83) 8/44; 7d (0.11, 0.17, 0.55) −4/30/56/131; 30d (0.07, 0.11) 5/26/50. Min score ≈ 28.6 (89% of test payments)
- Worked payment: €8.65, 14 Aug, terminal 79, 7d rate 0.70, 30d 0.22, card avgs €10.50/€11.17, ratio 0.74 → 7−2+9+5+8+131+50 = 208 points, odds ≈ 1:1.2, p ≈ 0.46, fraud (scenario 2)
- In-body exercise payment: €879.25, ratio 4.27 → 389 points, p ≈ 0.998 (leaked card)
- Test week AUC / AP / CP@100: raw LR 15 inputs 0.871 / 0.606 / 0.291 (alert-budget-metrics); raw LR on card's 7 inputs 0.861 / 0.636 / 0.291; first card 0.827 / 0.441 / 0.284; card 0.868 / 0.522 / 0.290; card with unmerged terminal 30d line 0.868 / 0.604 / 0.279
- Test week amount >201.82: 113 payments, 48 fraud (47 above €220 all fraud, 66 in €202–220 with 1) — measured, not in body
- Age table (applications): missing 42/8, 18–22 152/48, 23–26 246/54, 27–29 405/45, 30–34 475/25, 35–43 339/11, 44+ 147/3; totals 1,806/194; WOE −0.573, −1.078, −0.715, −0.034, +0.713, +1.197, +1.661; IV 0.6502
- Product table: clothes 6,000/300, books 1,600/400, music 350/140, electronics 950/100, games 90/50, movies 10/10; χ² 584 / 663 (583.9 / 662.9)
- Exercises: 30–34 term 0.0957; zero-fraud 44+ bin (smoothing 0.5 → WOE 3.46, 0.1 → 5.07; constant only matters with no frauds; merge with 35–43 → 1.55); leaky terminal rate / protected attribute refute "higher IV = keep"; credit-direction card Offset −12.87, S_good = 200 − S; 600 at 1:30, 50/doubling → Factor 72.13, Offset 845.3; BMR cut on score S*(Amt) = 212.87 + 28.85 ln(C_a/(Amt − C_a)): €20 181, €100 128, €1,000 60, €8.65 222 (not flagged); terminal 30d reversed sign = 28-day compromise script (test fraud rates 54%/43%/19% above 0.11), keep merged bin on real data; forward 2×2 amount × ratio log-odds −5.10/0.48/−0.53/2.62, ratio effect 5.58 vs 3.15 (×265 vs ×23)

## Assumed
- alert-budget-metrics: five-model setup, 15 inputs, LR baseline, CP@100, AP as mean precision at each fraud, ~2 cards/day noise
- delayed-labels-prequential: AP spread across weeks ~0.02–0.03
- canonical-datasets: scenarios (amount > 220, 28-day terminals, leaked cards ×5)
- transaction-aggregates: ratio amount ÷ 30-day mean (exercises)
- point-in-time-features: delayed terminal risk, three pipelines (exercise)
- example-dependent-cost: Bayes minimum-risk rule (exercise)
- financial-crime-typology: subscription fraud (application framing)
- classical-ml: logistic regression, maximum likelihood, odds, decision trees, χ² statistic

## Left open
- Trees and interactions vs the additive card, tuned on prequential folds → gbm-model-selection (forward exercise)
- Card vs boosted tree in money → scorecard-vs-gbm-lab
- Points as explanation vs model-agnostic explanations → alert-explanations
- IV between weeks as stability index → model-risk-monitoring
- Which variables are legally usable → gdpr-financial-crime-data
- Not taught: Fisher score, Cramér's V, probit/cloglog links, stepwise selection by p-values, the handbook real-data LR regularisation result (setup belongs to gbm-model-selection)
