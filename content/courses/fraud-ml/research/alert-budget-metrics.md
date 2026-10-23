# Metrics under an alert budget: average precision and card precision at k — research brief

Lesson: `alert-budget-metrics` (module: rare-positives, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Compute average precision and card precision at k for a ranked day of transactions and explain why the ROC curve's reachable region is a sliver
Opening (verbatim, the lesson must start with it): A model has scored the day's 8,300 payments and the investigators can open 100 of them. Accuracy says nothing useful when 99% of payments are genuine, and the usual summary of a ranking, the area under the ROC curve, averages over thresholds the team will never use. What number should you compute from the ranked list so that a better number means more fraud caught within the hundred?

## Sources to consult
- Handbook Ch4.2 ThresholdBased (the 10-transaction toy: labels [1,1,0,0,0,0,0,0,0,0], scores [0.9,0.35,0.45,0.4,0.2,0.2,0.2,0.1,0.1,0]; MME tie at t = 1 and t = 0.3; the full threshold table; BER, G-mean, F1 at t = 0.35), Ch4.3 ThresholdFree (ROC and AUC as P(random positive above random negative); the capacity argument — 100 checks over 58,264/7 ≈ 8,300 a day is ~1% so FPR > 0.01 is unreachable, 0.1% in real systems; PR curve, AP = Σ_n (R_n − R_{n−1}) P_n, random AP = prevalence, no linear interpolation; PR dominance iff ROC dominance; PR as the zoom at low FPR; why tree curves have few points), Ch4.4 TopKBased (P@k(d) = |A_d^Fraud|/k; the ceiling when k > frauds that day; the simulated DT2 per-day numbers; card precision by grouping on CUSTOMER_ID with max score and max label; removing detected cards lowers CP@100 from 0.286 to 0.241), Ch4.6 Summary (report all three). Files: research/texts/reproducible-Chapter_4_PerformanceMetrics_*.md.
- Dal Pozzolo 2018 Sec. III (alerts A_t as top-k by rank, Eq. 4 P_k, Eq. 5 CP_k counting a card once, Eq. 6 NCP_k = CP_k / min(1, γ_t/k) for backtesting; worked example 40 of 100 detected, 50 fraud cards → CP 0.4, NCP 0.8), Sec. IV-B (why AUC and cost matrices ignore capacity). File: research/texts/creditcard-tnnls.txt.
- Dal Pozzolo 2014 Sec. 5.1–5.2 (the Mann–Whitney rank form of AUC; AP as Σ P(t_r) ΔR; PrecisionRank at the top-a alerts). File: research/texts/staged-dalpozzolo2014-learned-lessons.pdf.
- Lucas & Jurgovsky Sec. 1.2.2 and Fig. 2 (P@K, AUCPR, AUCPR@0.2 as early retrieval; ROC insensitive to imbalance because its axes are within-class rates). File: research/texts/creditcard-.txt.
- Jurgovsky 2018 Sec. 4.4 (AUCPR@0.2 with maximum 0.2; the Jaccard overlap at fixed recall as a way to compare what two models catch). File: research/texts/staged-jurgovsky2018-sequence-classification.txt.

## EXPLANATION PLAN
### The problem as the newcomer meets it
A day of 8,300 scored payments, about 1% fraud, a hundred to open. The reader knows ROC-AUC and the PR curve from classical-ml as curves; they have never asked which part of a curve a fixed team can reach, never computed precision at a rank, and will not have thought that one card produces several frauds. The lesson derives the metric from the budget, not from a list of metrics. Terms not yet available: threshold-free vs top-k metric, average precision as a step sum, P@k, card precision, remaining frauds, detected-card removal.

### Chain of sub-problems
1. **Why not a threshold and accuracy?** — Obvious attempt: pick 0.5, count errors. Why it fails: the 10-transaction toy — two frauds, threshold 1 (alert nothing) and threshold 0.3 (catch both) both give misclassification error 0.2; the metric cannot tell a useless classifier from a good one, because it weighs a missed fraud and a false alarm the same and the negatives dominate. Answer: a threshold-based metric only makes sense once the objective fixes the threshold ("max recall with precision ≥ 60%"); otherwise the ranking must be judged as a ranking. Because: the team's decision is "which hundred", not "above or below 0.5".
2. **Why not ROC-AUC, the standard ranking metric?** — Obvious attempt: AUC is threshold-free, so use it. Why it fails: AUC = P(a random fraud outranks a random genuine), integrating over every false-positive rate; 100 checks over 8,300 payments is FPR ≈ 0.012 at most (0.1% in real systems), so 99% of the ROC curve describes operating points the team will never reach, and a classifier that wins there wins nothing. Answer: look only at the reachable corner — low FPR — and the PR curve is that corner magnified, because precision mixes true and false positive counts and the negatives swamp the positives. Because: ROC's axes are within-class rates and do not see the base rate; precision does.
3. **How to summarise the PR curve?** — Obvious attempt: the area under it, interpolated like ROC. Why it fails: the PR curve is not monotone (the toy dips 0.5 → 0.33 → 0.5 at recall 0.5), so trapezoids overstate it. Answer: average precision AP = Σ_n (R_n − R_{n−1}) P_n, the step sum: walk down the ranking, and each time a fraud is found add the precision at that point times the recall gained. A random ranker's AP equals the prevalence. Because: AP is exactly "precision averaged over the frauds, in rank order" — the quantity the team experiences as it works down the list. Note PR dominance iff ROC dominance, so the two cannot disagree on a dominating curve — they disagree on crossing curves, which is the usual case.
4. **AP still integrates over the whole list; the team stops at 100.** — Obvious attempt: AP is close enough. Why it fails: AP weights the low-recall region but still counts frauds found at rank 5,000. Answer: precision at k per day, P@k(d) = frauds among the top k / k, averaged over days; its ceiling is (frauds that day)/k — day 129 of the simulator has 55 frauds, so the best P@100 is 0.55 — so a day's P@k must be read against its ceiling. Because: k is the budget; nothing below rank k is acted on.
5. **The team checks cards, not transactions.** — Obvious attempt: top-100 transactions. Why it fails: a compromised card produces about three frauds a day (real data: ~1,000 frauds on ~300 cards); three alerts on one card are one phone call and the investigator reviews all the card's recent transactions anyway. Answer: collapse to one row per card per day (max score, max label), rank cards, take the top k: card precision at k. Because: the unit of work is the card.
6. **Yesterday's detected card is today's blocked card.** — Obvious attempt: score every day independently. Why it fails: a card the team found yesterday is blocked, so its frauds today are not detections; counting them inflates CP@k. Answer: remove detected cards from later test days; on the simulator this drops mean CP@100 from 0.286 to 0.241 and remaining cards from [50,50,49,47,46,44,31] — this is the number the course reports from now on. Because: the metric must count what the investigators would actually get.
7. **Which to report?** — Answer: all three — AUC (all thresholds), AP (the high-precision region, weighted), CP@k (the day's operational precision under capacity k) — because they answer different questions and reverse rankings (the unpruned tree beats the depth-2 tree on AUC 0.788 vs 0.763 and loses on AP 0.309 vs 0.496); and for backtesting, NCP_k = CP_k / min(1, γ_t/k) with γ_t the day's fraud cards, which removes the day's ceiling (40 of 100 found, 50 fraud cards → CP 0.4, NCP 0.8). Because: a day with few frauds caps every model alike.

### Set pieces and worked examples to recreate
- The 10-transaction toy end to end: MME tie, full threshold table, ROC points, PR points with the dip, AP computed as a step sum (recreate the arithmetic in the text). (Handbook Ch4.2–4.3.)
- The capacity argument with numbers: 100/8,300 ≈ 1.2%, real systems 0.1%; "99.9% of the ROC curve is irrelevant". (Handbook Ch4.3.)
- The simulated DT2 day table: remaining frauds [55,60,56,56,59,58,41], P@100 [0.26,0.35,0.26,0.33,0.30,0.35,0.19], mean 0.291; CP@100 0.286 (day 129: 24 of 50 cards); with removal 0.241. (Handbook Ch4.4.)
- The AUC/AP reversal: DT∞ 0.788 / 0.309 vs DT2 0.763 / 0.496. (Handbook Ch3, Ch4.3.)
- CP_k / NCP_k worked: 40 of 100, 50 fraud cards → 0.4 and 0.8. (Dal Pozzolo 2018 Sec. III.)
- Real data: ~1,000 frauds on ~300 cards a day; random CP@100 ≈ 0.0025; logistic regression ≈ 0.15; PR curves squashed to the floor with APs 0.002–0.035. (Handbook Ch3 RealWorld, Ch4.5.)
- AUCPR@0.2: area up to recall 0.2, maximum 0.2 — the same idea without choosing k. (Jurgovsky Sec. 4.4; Lucas & Jurgovsky Sec. 1.2.2.)

### Pitfalls and terms to define
- "Threshold-free" vs "top-k": define both; AP is threshold-free over the ranking, P@k is top-k.
- Average precision must be the step sum, no interpolation; say why (non-monotone curve) and name the bug (trapezoids).
- "Remaining frauds" / "remaining cards" are the frauds left after known-card removal — a notion the next lesson derives from the delay; here only say "cards the bank already found are dropped from later days" and refer forward.
- P@k vs CP@k: the newcomer will compute precision over transactions; make the card collapse explicit (max score, max label per card per day).
- The decision-tree PR curve has few points because few distinct scores; the newcomer will think the curve is wrong.
- Keep AUCPR@0.2 and P@k apart: one fixes recall, the other fixes k.

### Recalled, not re-taught
- ROC curve, AUC, PR curve, precision, recall (classical-ml): one clause each at first use.
- The budget of a hundred cards and the base-rate funnel (<Ref fraud-detection-system>, <Ref economics-of-detection>).

## FIGURE PLAN
- draw: key image — the ROC curve of a real detector with the reachable sliver (FPR ≤ 0.01) shaded and magnified into a PR curve beside it. <FigureSequence>, 3 frames (full ROC → shaded sliver → zoomed as PR). Inspired by Handbook Ch4.3's ROC-vs-PR side by side.
- draw: the 10-transaction toy as a ranked column with the two frauds marked, three threshold lines (1, 0.5, 0.3) and the confusion counts beside each. Single <Figure>, from Handbook Ch4.2.
- draw: the PR curve of the toy as steps with the dip, AP shaded as rectangles (one per fraud found). <FigureSequence>, 3 frames (first fraud → second fraud → total). Inspired by Lucas & Jurgovsky Fig. 2.
- draw: a day's ranking with the line at k = 100, frauds marked, the ceiling 55/100 drawn as a dashed bar; then the same day collapsed to cards. <FigureSequence>, 2 frames.
- draw: seven test days as bars: remaining frauds, remaining cards after removal, detected cards; mean CP@100 0.286 vs 0.241 annotated. Single <Figure>, from Handbook Ch4.4's daily plot.
- source: reproducible-wl-card-precision-topk — stem `worldline-cards-vs-k`; the reader must see 200–400 compromised cards a day against the flat k = 100 line of detected cards, and the training/delay/test bands; centered under sub-problem 5.
- source: reproducible-wl-pr-curves — stem `worldline-pr-floor`; the reader must see five PR curves with precision under 0.1 almost everywhere and APs of 0.002–0.035; float right beside the real-data paragraph.

## EXERCISE PLAN
1. [warm-up] Compute AP as a step sum for the 10-transaction toy and for the same list with the two frauds swapped to ranks 1 and 2.
2. [boundary probe] k larger than the day's frauds: show P@k ≤ γ/k, then let γ → 0 — what does CP@k measure on a day with no fraud, and why NCP_k is undefined there (0/0) and must be skipped.
3. [claim to refute] "Two rankings with the same AUC catch the same fraud in the top 100." Construct two 1,000-row rankings with equal AUC and P@100 of 0.6 and 0.0, naming the region of the curve the budget cannot reach.
4. [derivation skipped] Prove that a random ranker's expected AP equals the prevalence, and that AP = 1 iff all positives precede all negatives.
5. [research-shaped] Reproduce the simulator's seven-day table: given remaining frauds [55,60,56,56,59,58,41] and detected counts per day, recompute P@100 per day and the mean 0.291; then recompute with the card counts [50,50,49,47,46,44,31] and the handbook's 0.241.
6. [mixed review] Price the top-100 list with the cost matrix (<Ref economics-of-detection>): at C_a = EUR 5 per alert and a mean fraud of EUR 120, the savings of CP@100 = 0.24 vs 0.29 over a week.
7. FORWARD → `delayed-labels-prequential`: compute CP@100 on the same test week twice — once removing cards whose frauds were known by the end of training, once removing cards whose frauds were known seven days before each test day — and report the difference; the reader hits the delay before it is named.

## ARC
- Spine step 2 "Rare positives, honest metrics": "With one positive in a thousand and a hundred alerts a day, accuracy and 99.9% of the ROC curve measure nothing: the honest metrics are precision at the budget and cost in money, the honest validation runs forward in time with a delay block, the probabilities of a model trained on an undersampled stream are wrong by a closed-form factor, and under those the imbalance toolkit mostly stops helping."
- Inherits: the budget k and the card as unit (fraud-detection-system), the funnel and costs (economics-of-detection), the simulator and real-data numbers (canonical-datasets).
- Contributes: AP as a step sum, P@k with its ceiling, card precision at k with detected-card removal, NCP_k, the rule to report all three.
- Hands off: delayed-labels-prequential (the removal date is the delay; AUC selecting depth 50); imbalance-techniques-revisited and ulb-handbook-benchmark (the metrics the reversals are read in); cost-aware-evaluation-lab (the harness implements them); psd2-sca-tra (precision becomes a legal number).
