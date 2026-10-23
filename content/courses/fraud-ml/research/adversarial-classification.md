# Adversarial classification: evasion as a knapsack and the arms race — research brief

Lesson: `adversarial-classification` (module: adversary, core, planned). NEW.
Goal: Formulate evasion against a cost-sensitive classifier as a minimum-cost camouflage problem, derive the adversary-aware classifier, and explain why the repeated game oscillates instead of converging.
Prerequisite from classical-ml: naive Bayes (naive-bayes) — the classifier the paper attacks; recalled by Ref.

## Sources
- Dalvi et al. 2004 (primary, read in full): Sec. 1 arms races (spam, intrusion, fraud, counter-terrorism; concept drift insufficient because the change depends on the classifier); Sec. 2 the game — classifier picks C and feature subset X_C maximising U_C = Σ P(x,y)U_C(C(A(x)), y) − ΣV_i (Eq. 1); adversary picks A maximising U_A = Σ P(x,y)[U_A(C(A(x)), y) − W(x, A(x))] (Eq. 2); adversary modifies positives only, and only if the cost is below the utility gained; Theorem 2.1 (binary cost model → Nash equilibrium exists, polynomial); general Nash intractable (doubly exponential actions); iterated best response instead; single-shot, complete information; Table 1 notation; Sec. 3 cost-sensitive naive Bayes — predict y_C maximising U(y_C|x) = Σ P(y|x)U_C(y_C, y) (Eq. 4); positive iff LO_C(x) > LT(U_C), LT = ln[(U_C(−,−) − U_C(+,−))/(U_C(+,+) − U_C(−,+))] (Eq. 6); gap(x) = LO_C(x) − LT; Sec. 4 adversary strategy — Assumptions 1–2; MCC(x) = cheapest feature changes whose summed ΔLO ≥ gap(x) (ILP); A(x) = MCC(x) iff NB(x) = + and W(x, MCC(x)) < ΔU_A (Eq. 7); NP-hard via 0-1 knapsack; pseudo-linear DP over discretised log-odds O(W · Σ|X_i|) (Algorithm 1 FindMCC, Algorithm 2); Lemma 4.1 pruning (max ΔLO/W_i < gap/ΔU_A ⇒ A(x) = x); best tuple per cost; Sec. 5 classifier strategy — Assumptions 3–5 (classifier assumes optimal adversary; training set untainted; W_i a semi-metric); P_A(x′|+) = Σ_{x: A(x)=x′} P(x|+) (Eq. 8–10) with I(x′); Algorithm 3; Lemma 5.1, Theorem 5.2 (if x′ = MCC(x_A) then x′ is the MCC of every partial revert, by the triangle inequality), Corollary 5.3, Theorem 5.4 (bounds on the pre-image mass; lower bound used); Sec. 6 experiments — Ling-Spam and Email-Data, 10-fold CV; scenarios Add Words (unit cost; greedy optimal: add words in decreasing LO order), Add Length (0.1 per character, 200 characters affordable), Synonym (WordNet, unit cost, 20 edits, U_A = 20); Table 2 utilities (false-positive penalty 10/100/1,000 — Sakkis's λ); results — NB-AW 481/481 false negatives vs 94 untampered; AC-AW 93, AC-AL 94, AC-SYN 164 FN with essentially 0 FP; NB-SYN 408–414 FN; concept-drift check (Ling-Spam → Email-Data marginally worse); Sec. 6.3 repeated game — fixed-form adversary re-learns NB each round; utility oscillates between two values (Fig. 3, 15 rounds): good words get used, lose their low log-odds, get dropped, regain them; Sec. 7 future work (repeated games, incomplete information, multiple adversaries, other classifiers).
- Bolton & Hand Sec. 1 and Provost's comment p.250 (primary for fraud instances): methods become known, criminals adapt, new naive criminals arrive, old and new detectors both stay; structuring (Sec. 4); Provost — criminals pay initial bills before ramping once "big volume on a new account" is a known flag; roving calling dens in vans after location models; gasoline-pump and movie-theatre card probes; the modelled phenomenon changes in direct response to the model, so a deployed model loses effectiveness at once.
- Baesens Ch1 pp.10, 19: a detection system impairs its own detection power; fraudsters probe systems; expert rules learned by trial and error.
- Akoglu Sec. 1.1 and 5 (adversarial robustness of graphs: fraudsters lack the global view — what the adversary cannot edit) and Sec. 2.2.1 (the UNODC near-normal laundering quote).
- Chandola Sec. 1.2 (adversaries adapt to look normal) — one line.
- Dal Pozzolo 2014 Sec. 5 (fraudsters test with small amounts then replicate larger) and the handbook's scenario 1 (amount > 220) — the simulator's one-knob adversary for the application.
- AI Act Art 15(5) and Rec 76 (data poisoning, model poisoning, adversarial examples / model evasion, confidentiality attacks) — the statutory threat list, one paragraph, forward to module 10.
- Gama Sec. 2.5.3 (spammers using "Facebook support" phrasing; local vs global replacement) — the drift-side view of the same event.

## Key points
1. The flaw: drift models treat the change as exogenous; in fraud the change is a function of the detector. The game formulated: utilities with measurement and edit costs; who moves when; complete information as the simplifying assumption; equilibrium intractable in general, so iterated best response.
2. The threshold as a target: cost-sensitive NB's log-odds threshold LT from the utility matrix (derive Eq. 6 from Eq. 4) — the same expected-utility decision as module 2's BMR with a different parameterisation; the gap as what the adversary must close.
3. The adversary's problem derived: per-feature edits with cost W_i and log-odds reduction ΔLO_i; close the gap at minimum cost — a 0-1 knapsack; the DP over discretised log-odds; Lemma 4.1's pruning; Add Words is greedy-optimal (unit costs: add words by decreasing log-odds); the "act iff cost < ΔU_A" rule — some instances are not worth camouflaging.
4. The classifier's reply: P_A(x′|+) sums the positives that would have been camouflaged into x′ (the pre-image mass); Theorem 5.2 (why the MCC of x′ is the MCC of every partial revert — triangle inequality on costs) makes the pre-image computable; Algorithm 3 classifies by the adjusted likelihood; results — all 481 spam pass naive NB under Add Words; the adversary-aware classifier gets 93 FN with 0 FP; side effect: manipulation can reduce false positives because the adversary never sends unaltered spam.
5. The three cost models as the modelling lever (unit word, 0.1 per character, synonym with a budget of 20): the attack's cost function is the thing the defender chooses to model; the fraud translation — the cost of a smaller amount (the fraudster's lost take), of a new card, of a new merchant, of a different hour; what cannot be edited cheaply (the graph position, Akoglu).
6. The repeated game: the fixed-form adversary re-learning NB each round; period-2 oscillation (good words lose and regain their log-odds); no convergence; Provost's real-world cycles; the fraud reading — retraining cadence vs the adversary's adaptation speed is a race, not a schedule (hand-off to the application and to the capstone's cadence).
7. The statutory list (AI Act Art 15(5)): poisoning, evasion, confidentiality attacks — the lesson names which the game models (evasion) and which it does not (poisoning: tainted training sets violate Assumption 4).
8. ★ Starred: the DP's correctness (Algorithm 1), Theorems 5.2–5.4, the Nash existence under binary costs.

## Set pieces & gems
- 481/481 pass; 93 after the defence; 0 false positives.
- The knapsack: buy log-odds reduction at per-feature prices until the gap closes.
- Three attack cost models on one classifier.
- Period-2 oscillation and its mechanism.
- Provost's anecdotes (bills paid first; vans; pump probes).
- Baesens: "a detection system impairs its own detection power".
- The UNODC quote on imitating legitimate patterns.

## Pitfalls
- The paper's classifier is naive Bayes; the fraud detector is a tree ensemble — state what transfers (the gap, the cheapest edit set, the pre-image idea) and what does not (closed-form per-feature log-odds); the application uses the simulator's amount knob for that reason.
- "Adversarial examples" in the deep-learning sense are a different object (gradient perturbations); mention once, by name, and keep the lesson on cost-bounded feature edits.
- Complete information is an assumption the paper flags; so is the untainted training set — both matter for module 8's next lesson.

## FIGURE PLAN
- draw: `<FigureSequence>` (4 frames) of the knapsack: a message's log-odds bar above the threshold with the gap marked; (1) candidate edits listed with (ΔLO, cost), (2) the cheapest edit applied, bar drops, (3) second edit, bar crosses the threshold, (4) total cost vs the budget ΔU_A — "camouflage bought". Key image; matches the demo.
- draw: The utility matrices of classifier and adversary as two 2×2 cell grids with the measurement cost V_i and edit cost W_i drawn as side terms (voita rule 9).
- draw: The pre-image: a point x′ in feature space with arrows from the positives that would camouflage into it; P_A(x′|+) as the summed mass — one figure. Inspired by Sec. 5's definition.
- draw: Results as grouped bars: FN counts for NB vs AC under PLAIN / AW / AL / SYN (481 → 93 etc.) with FP as a second thin bar — from Table 3.
- draw: The repeated game: utility vs round (0–14) for NB and AC as two lines showing the period-2 oscillation — a recreation of Fig. 3's shape from the description, marked schematic.
- draw: The arms-race loop as a cycle diagram: deploy → adversary adapts → performance decays → retrain → … with the two speeds (retraining cadence, adaptation speed) as labelled arrows; the AI Act's three threat classes placed on the loop (poisoning at training, evasion at scoring, confidentiality at the model).

## EXERCISE PLAN
1. Warm-up: given a threshold gap of 3.2 and six candidate edits with (ΔLO, cost), find the minimum-cost camouflage by hand and state whether it is worth it under ΔU_A = 5.
2. Derivation the lesson skipped: derive the log-odds threshold LT (Eq. 6) from the expected-utility decision (Eq. 4), and show it equals module 2's BMR threshold 1/(1 + C_FN/C_FP) under the corresponding cost mapping.
3. Boundary probe: edit costs all equal and all ΔLO equal — the knapsack is a count; find the gap at which camouflage becomes unaffordable and show the adversary-aware classifier then equals the plain one on that instance (no pre-image mass).
4. Claim to refute: "An adversary-aware classifier that assumes optimal adversary play is robust against any adversary." Refute: Assumption 3 (optimal play) and complete information; a sub-optimal or differently-costed adversary changes the pre-image; name the assumption that fails and what the experiment with the three cost models showed.
5. Research-shaped: implement Add Words on a provided small NB spam model (word log-odds given) and reproduce the collapse-and-recovery in miniature (NB vs the pre-image-adjusted classifier on 50 messages).
6. FORWARD (E7): run three rounds of the repeated game by hand on a 5-word model — the reader records the utility oscillating and observes that the classifier's training set in round 2 contains the adversary's round-1 edits as positives → lands on `alert-feedback-selection-bias` (the training set the model's own behaviour produced) and on `arms-race-replay`.
7. Mixed review (E3): translate the knapsack to the simulator's scenario 1: the fraudster's edit is lowering the amount from a to 219 at cost (a − 219); with the BMR threshold of example-dependent-cost in place, find the amounts a for which camouflage is worth it.

## ARC
- Inherits: the BMR/utility threshold (example-dependent-cost); drift as exogenous change (concept-drift); the typology's camouflage trait.
- Contributes: the adversary as a cost-bounded optimiser — the game, the knapsack, the adversary-aware reply, the oscillating repeated game, the statutory threat list.
- Hands off: the selection bias the loop creates (next); the simulator replay (arms-race-replay); the AI Act's Art 15(5) (eu-ai-act-fraud); the capstone's cadence.
- Spine step 8: "The adversary reads the detector and edits the cheapest features until the score crosses the threshold, and the detector labels only what it chose to show the investigators — so the training data is biased by the model itself, and the correction is to know which samples it selected."
