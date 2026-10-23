# Example-dependent cost-sensitive learning and the Bayes-minimum-risk threshold — research brief

Lesson: `example-dependent-cost` (module: rare-positives, core, planned). NEW.
Goal: Derive the Bayes-minimum-risk decision rule for a transaction whose false-negative cost is its amount, and compute the savings of a detector against doing nothing.

## Sources
- Bahnsen et al. 2016 (primary): Sec. 2 confusion matrix (Table 1) and why accuracy/recall/F1 fail (equal costs, balanced classes; fraud 0.005–0.5%); Elkan example-dependent cost matrix (Table 2); Hand's constant 100×C_a; the paper's matrix C_FN = Amt_i, C_TP = C_FP = C_a, C_TN = 0 (Table 3); Cost(f) = Σ_i [y_i(1 − c_i)Amt_i + c_i C_a] (Eq. 1); Whitrow normalised cost (Eq. 2); Cost_l = min(cost of all-0, all-1) = Σ y_i Amt_i (Eq. 3); Savings = (Cost_l − Cost(f))/Cost_l = Σ[y_i c_i Amt_i − c_i C_a]/Σ y_i Amt_i (Eqs. 4–5); negative savings, small frauds, available credit as an alternative FN cost; Sec. 4.3 BMR: flag iff C_a P(f|x) + C_a P(l|x) ≤ Amt P(f|x), i.e. C_a ≤ Amt·P(f|x) (Eq. 15); cost-sensitive LR objective J_c(θ) with example costs, minimised by a genetic algorithm (Eq. 16); CSDT splitting on savings; sampling does not improve savings; Sec. 5 results: aggregates +201% / +252% / +287% savings; CSDT best (~71%), CSLR close; Table 7 subset 236,735 tx, 1.50% fraud, EUR 895,154 loss, test cost 262,167.
- Dal Pozzolo 2015 Sec. IV-A: Bayes minimum risk τ = (l10 − l00)/((l10 − l00) + (l01 − l11)); Elkan's cost-sensitive optimum — the constant-cost special case.
- Baesens Ch4 pp.198–200: classify as fraud if P(1|x) > 1/(1 + C(2,1)/C(1,2)); total cost = C(−,+)FN + C(+,−)FP; MetaCost, AdaCost; Lopez et al. 2012 find sampling and cost-sensitive methods equivalent so the book recommends sampling (contrast with Bahnsen's finding); Ch6 p.290 expected fraud amount P × amount (EUR 9 vs EUR 2,500) — the same inequality as a prioritisation rule.
- Handbook Ch4.2: cost matrix and weighted loss; FN cost = amount as the amount-dependent variant; "no consensus on cost" (spending limit, reaction time, contractual constraints).
- Dal Pozzolo 2014 Sec. 5: why a fraud's cost is not its amount (test-then-replicate; reaction time; a false alert is a phone call; too many lose the customer).
- CS6890 PS3: TP = FP = 6, TN = 0, FN per row from a risk parameter; Bahnsen vs Nikou–Gunnemann approaches — the lab canon.
- HKU A2 "Model suggestion": mean fraudulent claim $60,302, $4,214 per investigation, XGB $921,949 vs KNN $1,101,826 (16.3% cheaper) — the cost-based model choice.
- PSD2 Art 74 (EUR 50 payer cap) and Art 73 (refund by next business day) in one sentence: who bears the FN cost (forward).

## Key points
1. From the constant-cost rule to the example-dependent one: write expected cost of "flag" and of "pass" for one transaction; flag iff C_a ≤ Amt·P(f|x); the threshold is C_a/Amt — a curve in the (P, Amt) plane; constant-cost rule recovered when Amt is constant.
2. Savings derived from Eq. 1–5 including the do-nothing baseline (Cost_l is the total fraud amount because the all-flag cost is larger); why savings can be negative (a detector that flags many small transactions at C_a each); Whitrow's normalisation as the alternative.
3. Worked table: ten transactions with amounts, probabilities, labels: compute cost at threshold 0.5, cost under BMR, savings for each; show BMR flags a EUR 2,000 at P = 0.05 and passes a EUR 15 at P = 0.6 when C_a = 25.
4. Learning with costs vs deciding with costs: BMR uses a calibrated P (hence the previous lesson's p′); cost-sensitive LR changes the fit (Eq. 16); CSDT splits on savings; the paper finds CSDT best and sampling useless for savings (it distorts the amount distribution of the costs).
5. What the amount misses: the probe-then-spend pattern (small frauds matter), reaction time, friction, the customer lost — the cost matrix is a model; Baesens' prioritisation rule (expected fraud amount) is the same inequality used for the queue (forward to score-to-action).
6. ★ Starred: the cost-sensitive LR objective and its optimisation; MetaCost in one paragraph; the HKU dollar comparison as "savings in practice".

## Set pieces & gems
- The inequality C_a ≤ Amt·P as a line of slope C_a in the (Amt, Amt·P) plane — or a hyperbola P = C_a/Amt.
- Savings < 0 against "doing nothing, which is what most institutions do".
- The 236,735 / 1.50% / EUR 895,154 subset with test cost 262,167 — a size and money frame.
- +201% / +252% / +287% — foreshadows module 3 (features move savings more than models).
- Baesens' EUR 9 vs EUR 2,500.
- HKU A2's 16.3% cheaper model.

## Pitfalls
- BMR needs calibrated probabilities: say explicitly that an uncorrected undersampled model gives the wrong decision set (link β).
- Do not conflate Bahnsen's C_a (administrative cost per alert) with an investigation salary cost; both are legitimate instantiations — state the one in use.
- The PaySim/HKU dollar numbers are a student's artifact; use the arithmetic, not the authority.

## FIGURE PLAN
- draw: The example-dependent cost matrix as a 2×2 cell grid with Amt_i in the FN cell and C_a in the FP/TP cells, beside Hand's constant matrix — two panels joined by an arrow (voita rule 8). Key image.
- draw: The BMR threshold curve P = C_a/Amt on a (Amt, P) plane with ten worked transactions placed and coloured by the decision; the constant 0.5 threshold as a horizontal line for contrast. Computed.
- draw: `<FigureSequence>` (3 frames): a ranked list of transactions costed under (1) threshold 0.5, (2) BMR, (3) do-nothing — the cost tally changing frame by frame; savings written as the final tally.
- source: featureengin-results-fig6-7 — stem `bahnsen-savings-by-featureset`; the reader must see the grouped savings bars per algorithm for raw / +agg1 / +agg2 / +per and the box plot of percent increase; centered in the results section (measured on proprietary data; a redrawing would invent the numbers).
- draw: Savings as a function of C_a for a fixed model on the worked table — crossing zero at the C_a where flagging becomes net-negative. Computed.
- draw: Decision tree split by savings vs by Gini on a tiny node — two near-identical panels with the chosen split highlighted (CSDT idea), computed on the worked table.

## EXERCISE PLAN
1. Warm-up: compute savings for a given list of 12 transactions (amount, P, label) under threshold 0.5 and under BMR with C_a = 20.
2. Derivation the lesson skipped: derive the BMR rule from the two expected costs, then show that with constant costs it reduces to Elkan's 1/(1 + C_FN/C_FP), and that Dal Pozzolo's τ = π⁺ is the case where costs are set from the priors.
3. Boundary probe: C_a = 0 — every transaction with P > 0 is flagged; what the budget k does to that policy and why BMR without a capacity constraint is incomplete (forward to score-to-action).
4. Claim to refute: "A model with higher AP always has higher savings." Construct two rankings with the same AP where amounts differ so savings reverse; name what AP ignores.
5. Research-shaped (CS6890 PS3 in miniature): with TP = FP = 6, TN = 0 and FN per row given, fit a plain LR and a cost-sensitive LR (weight each row by its cost in the loss) on a provided table and compare total cost.
6. FORWARD (E7): compute savings for the same model using raw features only and using the previous-24-hour count and sum per card as two extra features (provided) — the reader sees savings jump before the mechanism is taught → lands on `transaction-aggregates`.
7. Mixed review (E3): apply BMR to p_s and to p′ (imbalance-techniques-revisited) on the worked table and report how many decisions change.

## ARC
- Inherits: the cost matrix and inspection-value rule (economics-of-detection); calibrated p′ (imbalance-techniques-revisited).
- Contributes: the per-transaction decision rule, the savings metric with its do-nothing baseline, cost-sensitive fitting vs cost-sensitive deciding.
- Hands off: the harness's savings and BMR checkpoints (cost-aware-evaluation-lab); the investigation frontier and queue (score-to-action); the adversary's cost model (adversarial-classification); liability (psd2-sca-tra).
- Spine step 2: rare positives, honest metrics.
