# Lab: a budget- and cost-aware evaluation harness — research brief

Lesson: `cost-aware-evaluation-lab` (module: rare-positives, type: lab, planned). NEW.
Goal: Build an evaluation harness — prequential split with delay and known-card removal, average precision, card precision at k, savings, the Bayes-minimum-risk threshold and the undersampling correction — and use it to referee a model selection on the simulator.

## ARC
- Inherits: every result of module 2 — AP's step sum and CP@k with card collapsing and detected-card removal (alert-budget-metrics), the train/delay/test geometry and prequential folds (delayed-labels-prequential), the β correction and matched threshold (imbalance-techniques-revisited), savings and BMR (example-dependent-cost), the benchmark's numbers as the referee (ulb-handbook-benchmark).
- Contributes: the module's results as verified code; the harness every later lab imports (features lab's metric checkpoint, scorecard lab's comparison, capstone's cumulative CP@100).
- Hands off: the harness as a module (`fraudeval.py`-style) to point-in-time-feature-lab, scorecard-vs-gbm-lab and pipeline-capstone-lab; the "AUC selects depth 50" finding as something the learner has now reproduced.
- Spine step 2 (final item): "…under those the imbalance toolkit mostly stops helping."

## LAB PLAN

Artifact: one notebook producing a reusable evaluation module — `average_precision`, `savings`, `prequential_split`, `card_precision_top_k`, `bmr_decision`, `undersampling_correction`, `prequential_selection` — exercised end to end on a reduced run of the handbook simulator to referee a decision-tree depth selection and to produce a card-precision score on a held-out week.

CANON GROUNDING: modelled on CS6890 PS3 (dossier: "implement example-dependent cost-sensitive regression twice … on a table with features A–K, label L, per-row FN cost M; TP = FP = 6, TN = 0") for the cost half, on HKU FITE7410 A2's required practical comparison (dossier: "which detector suits the case from a practical standpoint … cost matrix: mean fraudulent claim $60,302, $4,214 per investigation") for the savings-based verdict, and on the handbook's own reference implementations that the reader is expected to re-run (shared_functions: prequentialSplit, card_precision_top_k with remove_detected_compromised_cards, get_train_test_set, performance_assessment). Departures: the cost-sensitive FIT (Bahnsen's CSLR with a genetic algorithm; the Nikou–Gunnemann variant) is dropped — the lab decides with costs rather than fitting with them, because the course's claim is about evaluation; the handbook's functions are rebuilt from their stated semantics, not copied (GPL v3 code is not vendored).

Dataset: a reduced handbook-style simulator shipped as a complete, non-blanked generator cell (seeded; 1,000 customers, 2,000 terminals, 70 days, ≈ 150k rows, the three scenarios at the paper's rates) so the learner generates train/delay/validation weeks in-notebook; plus `data/holdout_week.csv` (one further week, features only, ≈ 2 MB) whose labels, card ids and dates sit in `private/` for the metric checkpoint. The 10-transaction toy from Handbook Ch4.2 ships as a literal in the notebook as the exact-checkpoint input for AP. Licence: our own generator written from the paper's description (the handbook's prose is CC BY-SA 4.0; its code GPL v3 — not copied).

Checkpoints (plan; lab-author may split or deepen):
1. `average-precision` (exact, warm-up): step-sum AP on the 10-transaction toy and on a seeded 2,000-row ranking; wrong variants: trapezoidal interpolation; recall denominators from the ranked prefix instead of all positives.
2. `savings-metric` (exact, warm-up): Cost(f), Cost_l and Savings on a 50-row table of (amount, label, decision) with C_a given; wrong variant: C_TP = 0 (forgetting that a caught fraud still costs the alert); Cost_l taken as all-flag cost.
3. `prequential-split` (exact): fold generator returning (train_idx, delay_idx, test_idx) for n folds shifted back one block each, with known-card removal applied to test days — verified on a seeded 30-day mini-stream against a hand-built answer; wrong variants: removal using labels known at the test day instead of day − δ; folds that shift only the test block.
4. `card-precision-top-k` (exact): per-day card collapsing (max score, max label), top-k, detected-card removal from later days, mean over days; verified on a seeded 7-day frame whose answer is hand-computable (and on the simulator week against the handbook-style number ≈ 0.24 for a depth-2 tree); consumes 3's test indices; wrong variants: transaction-level P@k; no removal of detected cards.
5. `bmr-threshold` (exact): per-row decision C_a ≤ Amt·p on a table; consumes 2's cost helpers to report the cost of the decision set; wrong variant: constant threshold 0.5; comparison reversed.
6. `undersampling-correction` (exact): p′ from p_s and β, and the matched threshold τ′; verified on a seeded array and by the identity that decisions under (p′, τ′) equal decisions under (p_s, τ_s); wrong variants: p′ = p_s·β (no renormalisation); β defined as positives/negatives.
7. `prequential-selection` (exact): a depth grid {2,3,4,5,6,8,10,20,50} on the simulator's folds, returning the best-validation depth under AP and under ROC-AUC — the expected answer is two different depths (AUC's choice ≥ AP's); consumes 3 and 4 and the tree fits (sklearn allowed here — the lab is about evaluation); wrong variant: selecting on the test folds.
8. `why-auc-picks-fifty` (review, optional): the learner's account of why validation AUC prefers the overfitted tree; rubric accepts "pure leaves win the low-recall region AUC integrates and lose the high-precision region AP weights"; "overfitting" alone insufficient.
9. `beat-card-precision` (metric, optional, LAST): any model, scored by the learner's own `card_precision_top_k` on the held-out week (server recomputes from submitted scores and the private labels); threshold calibrated so a depth-5 tree on the 14 baseline-style features clears it with ≥ 0.02 margin and a depth-2 tree does not.

Final open task: checkpoint 9 — metric is CP@100 over the held-out week; rough threshold ≈ 0.26 (to be calibrated by running the reference: depth-5 tree ≈ 0.28–0.30 on our reduced simulator, depth-2 ≈ 0.24).

Known-wrong variants to declare: listed per checkpoint above; the canonical bugs are the AP interpolation, the removal date (δ), transaction-level vs card-level precision, the missing renormalisation in p′, and selection on test.

NOT blanked (ship complete): the simulator generator, the 14-feature builder (a complete function — module 3 teaches how it works), data loading, plotting helpers (daily counts with train/delay/test bands; three-panel metric-vs-depth; PR curve), the sklearn tree fits in checkpoint 7's loop.

est_hours: 4. Progression: warm-ups (1, 2) → composing chain (3 → 4 → 7; 2 → 5; 6 independent, used by the capstone) → one open metric last (9) → review garnish (8). Required: 1–7.
