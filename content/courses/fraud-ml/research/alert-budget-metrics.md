# Metrics under an alert budget — research brief

Lesson: `alert-budget-metrics` (module: rare-positives, core, planned). NEW.
Goal: Compute average precision and card precision at k for a ranked day of transactions and explain why the ROC curve's reachable region is a sliver.
Prerequisite knowledge from classical-ml (recalled with a Ref, never re-taught): confusion matrix, ROC/AUC as ranking probability, PR curves, F-beta.

## Sources
- Handbook Ch4.1–4.4 (primary): the 10-transaction toy (labels [1,1,0,0,0,0,0,0,0,0], scores [0.9,0.35,0.45,0.4,0.2,0.2,0.2,0.1,0.1,0]); threshold table (t = 1 MME 0.2 useless; t = 0.5 MME 0.1; t = 0.3 MME 0.2 catches both; t = 0.35 minimises BER, maximises G-mean and F1 with TPR 1, precision 0.5); ROC points, PR points with the non-monotone dip 0.5 → 0.33 → 0.5 at recall 0.5; AP = Σ_n (R_n − R_{n−1}) P_n, random AP = P/(P+N) = prevalence, step plotting without linear interpolation; PR dominance iff ROC dominance (Davis & Goadrich); PR as the zoom at low FPR; the capacity argument (100 checks/day of 58,264/7 ≈ 8,323 tx/day ≈ 1%; real ~0.1%; 99.9% of the ROC irrelevant); decision-tree curves have few points (4 leaves → 4 thresholds); P@k(d) = |A_d^Fraud|/k, max < 1 when k > frauds that day (day 129: 55 frauds → 0.55), mean over days; DT2 k = 100 remaining frauds per day [55,60,56,56,59,58,41], P@100 per day [0.26,0.35,0.26,0.33,0.30,0.35,0.19] mean 0.291; CP@k groups by CUSTOMER_ID with max score and max label, top k; removing already-detected cards lowers CP@100 from 0.286 to 0.241 and remaining cards to [50,50,49,47,46,44,31]; Ch4.6: report AUC, AP and CP@k together.
- Handbook Ch3: five-model table AUC/AP/CP@100 — LR 0.871/0.606/0.291; DT2 0.763/0.496/0.241; DT∞ 0.788/0.309/0.243; RF 0.867/0.658/0.287; XGB 0.862/0.639/0.273; random 0.5/0.007/0.017.
- Dal Pozzolo 2018 Sec. III: P_k(t) = |TP_k(t)|/k (Eq. 4); CP_k(t) = |C⁺_t|/k (Eq. 5); NCP_k = CP_k/Γ(t), Γ = min(1, γ_t/k) (Eq. 6) with the worked example 40 of 100 detected, 50 fraud cards → CP 0.4, NCP 0.8; CP_k for running performance, NCP_k for backtesting; AUC and cost matrices ignore capacity (IV-B); Table VI NCP_k rises 0.40 → 0.48 as k goes 100 → 300 (hiring case).
- Dal Pozzolo 2014 Sec. 5.1–5.2: Mann–Whitney rank form of AUC; AP as a ranking metric; PrecisionRank at the top-a alerts.
- Lucas & Jurgovsky Sec. 1.2.2: ROC insensitive to imbalance (within-class rates), PR punitive; P@K as a recall level; AUCPR@0.2 "early retrieval"; Jurgovsky Sec. 4.4: AUCPR@0.2 (max 0.2) to avoid choosing K.
- Baesens Ch4 pp.176–182 for lift, CAP/accuracy ratio = 2·AUC − 1, KS — one paragraph as the credit-scoring dialect of the same curves.

## Key points
1. The toy computed in full: the threshold table, the ROC points, the PR points with the dip; MME ties a useless and a useful classifier — the error-rate failure made concrete.
2. AP as a step sum (write the sum, compute it on the toy = the exact number); random AP = prevalence; no interpolation; AP is the weighted precision over the ranking with weights at the positives.
3. The capacity argument as a derivation: k checks over N transactions bound FPR ≤ k/N(1−π); with k = 100, N = 8,300, FPR ≤ 0.012; so the ROC's usable region is [0, 0.012] — "the PR curve is the zoomed ROC at low FPR" and AUC integrates 99% nothing.
4. P@k per day and its ceiling min(1, frauds_d/k); the mean over days; why per-day (the budget is per day).
5. Card precision: one alert per card (investigators review the card's recent transactions), max score and max label per card, top k cards; the remaining-fraud accounting: cards known compromised before the day are removed, and cards detected on day d are removed from d+1 onward — mean CP@100 0.286 → 0.241 on the simulator. NCP_k normalises by the day's ceiling for backtests.
6. Which metric for what (Ch4.6): AUC across all thresholds (model development, insensitive to budget), AP weights the high-precision region, CP@k is the operational number. The five-model table shows the reversals: DT∞ beats DT2 on AUC and loses on AP by 0.19.
7. ★ Starred: Mann–Whitney AUC and its rank-sum form; lift/CAP/KS as the scorecard dialect; AUCPR@0.2.

## Set pieces & gems
- The 10-transaction toy end to end (hand-computable; reused in the lab as an exact checkpoint input).
- The capacity sentence: "any FPR > 0.01 is operationally irrelevant".
- Day 129: 55 frauds → P@100 ≤ 0.55; the ceiling drawn.
- CP@100 0.286 → 0.241 when detected cards are removed: blocking is part of the metric.
- NCP worked example 0.4 / 0.8; Table VI as the hiring argument.
- DT∞ vs DT2: AUC up, AP down — the first of the course's metric reversals.

## Pitfalls
- Do not re-teach ROC/PR mechanics; one recall paragraph with a Ref to classical-ml's classification-metrics, then the fraud-specific content.
- AP has several definitions (interpolated, trapezoidal); fix the step sum and say the others differ.
- CP@k requires a day axis and card ids — say which datasets support it (not ULB).

## FIGURE PLAN
- draw: `<FigureSequence>` (4 frames) on the toy: (1) the ten scored transactions as a ranked column, (2) a threshold sliding to 0.35 with the confusion counts, (3) the ROC points placed, (4) the PR points placed with the dip highlighted. Inspired by Handbook Ch4.2–4.3 figures (recreated).
- draw: ROC with the reachable region [0, k/N] shaded as a thin amber strip at the left, beside the PR curve of the same classifier as a full-width panel — "the zoom". Single figure; key image. Inspired by Handbook Ch4.3's ROC-vs-PR side-by-side.
- draw: A test week as seven bars of remaining frauds [55,60,…] with the detected count (P@100 × 100) stacked inside and the k = 100 ceiling drawn where it binds. Inspired by Handbook Ch4.4 daily plot.
- source: reproducible-wl-card-precision-topk — stem `worldline-cards-vs-detected`; the reader must see original and remaining compromised cards per day (200–400) against the detected cards bounded by 100, with the train/delay/test bands; centered in the card-precision section (real operational numbers).
- draw: Card collapsing: a day's transactions grouped by card into one row per card (max score, max label), the top-k cut over cards, and the removal of a detected card from the next day — three mini-panels. Inspired by Handbook Ch4.4 and the card_precision_top_k code.
- draw: The five-model table as a dot plot per metric (AUC, AP, CP@100) with lines connecting each model across metrics so the DT∞/DT2 crossing is visible. Computed from Handbook Ch3 numbers.

## EXERCISE PLAN
1. Warm-up: compute AP for a new 8-transaction ranking by the step sum and verify random AP = prevalence on a shuffled copy.
2. Derivation the lesson skipped: show P@k over the ranked list equals recall × (frauds/k) when k ≤ frauds, and derive the NCP_k identity CP_k/min(1, γ/k); state when NCP_k = recall.
3. Boundary probe: a day with zero frauds — what P@k and CP@k report, why the mean over days must exclude or flag it, and what AP does on an all-negative day.
4. Claim to refute: "Since PR dominance is equivalent to ROC dominance, the AUC ranking of two classifiers agrees with their AP ranking." Break it with the DT∞/DT2 numbers (dominance ≠ area), naming the step (curves cross).
5. Research-shaped: reproduce the handbook's capacity argument for Worldline (400,000/day, k = 100 cards ≈ 300 transactions): the reachable FPR, and the AUC of a classifier that is perfect inside the region and random outside — show AUC barely moves.
6. FORWARD (E7): compute CP@100 for the same model on a test week once with and once without removing the cards known compromised before the week; the reader finds the "remaining frauds" accounting and asks where the "known" date comes from → lands on `delayed-labels-prequential`'s delay block and known-card removal.
7. Mixed review (E3): place k and π into economics-of-detection's precision formula and show the CP@k ceiling is the same arithmetic.

## ARC
- Inherits: the budget (economics-of-detection), classical-ml's ROC/PR.
- Contributes: the operational metrics — AP, P@k, CP@k with card collapsing and detected-card removal — and the proof that the ROC's reachable region is a sliver.
- Hands off: the validation design that CP@k needs (delayed-labels-prequential); the metric reversals every later benchmark reports; the RTS fraud rate as another budget-type number (psd2-sca-tra).
- Spine step 2: "With one positive in a thousand and a hundred alerts a day, accuracy and 99.9% of the ROC curve measure nothing: the honest metrics are precision at the budget and amount-weighted cost, the honest validation runs forward in time with a delay block, and under those the imbalance toolkit mostly stops helping."
