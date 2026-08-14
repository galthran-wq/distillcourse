# Interpreting ensembles: importance, partial dependence, and SHAP — research brief

Lesson: `shap-interpretability` (module: ensembles, type: EXTRA, planned). NEW. Off-path by design: no core lesson may require it.
Goal: Explain permutation importance, partial dependence, and Shapley-value attributions, and analyze when each answers the question asked.

## Sources
- Friedman 2001 §8 (relative importance eqs 43–45; partial dependence 50–57 — marginal NOT conditional, the tree-traversal closed form; the garnet Ga×Zr case study Figs 10–11, image captured).
- ESL §10.13, §15.3.2 (importance measures and their biases).
- Lundberg & Lee 2017 (primary for SHAP): additive attribution class Def 1; the three axioms; Theorem 1 uniqueness (Shapley); Kernel SHAP Thm 2 (Shapley via weighted regression); the sickness-score and three-man-max worked games (§5.2, Fig 4); Fig 1's base-to-prediction framing.
- Murphy — light.

## Key points
1. The question discipline first: "which features matter to the MODEL" (importance) vs "how does the model respond to x_j" (PDP) vs "why THIS prediction" (attribution) — three different questions; the lesson's spine is matching tool to question.
2. Permutation importance: mechanism, OOB variant (Breiman §10); the correlated-feature masking failure (diabetes var-2/var-8 case) — worked.
3. Partial dependence: the marginal-average definition; WHY marginal not conditional (Friedman's argument — conditional confounds the feature's effect with its correlations); the closed-form tree traversal; the garnet Ga×Zr interaction as the real-science payoff (captured image).
4. Shapley: the credit-assignment problem stated via the sickness-score game (fever+cough interaction — humans' intuitive split); the three axioms (local accuracy, missingness, consistency); uniqueness stated (Thm 1) with the coalition-average formula; hand-compute the 2-feature case fully.
5. Kernel SHAP as the practical route (weighted regression recovers exact Shapley — statement + the kernel's shape); TreeSHAP named; the base-value → prediction waterfall as the reading convention.
6. Honesty section: attributions are properties of the MODEL, not causal claims about the world; correlated features split credit non-uniquely across methods; leakage features get confident attributions ('george' again).

## Set pieces & gems
- The sickness-score game (output 2 if both symptoms, 5 if exactly one — deliberately interaction-heavy) — hand-worked Shapley beats both LIME-style and single-feature reasoning.
- The garnet geochemistry study — a real published discovery made BY a PDP.
- The three-man max game (max(5,4,0) profit) — why max functions break naive attribution.

## Pitfalls
- This is an extra lesson: self-contained, nothing downstream may depend on it; keep prerequisites to bagging-random-forests + gradient-boosting.
- Do not teach LIME as a method (it appears only as the thing Kernel SHAP fixes, one paragraph).
- The Shapley uniqueness proof is NOT in the accessible text (supplement unavailable) — state the theorem, prove the 2-player case ourselves, cite for the general case.

## FIGURE PLAN
- draw: The three questions — one fitted model, three interrogations (global bar chart / response curve / per-prediction waterfall), each labeled with its question. Single Figure; the lesson's map.
- draw: Permutation importance mechanics — FigureSequence (3 frames): intact column, shuffled column (link visibly broken), the error-increase bar landing in the ranking.
- draw: Marginal vs conditional — a correlated (x₁,x₂) cloud; PDP's marginal grid (evaluating f at unrealistic corners, shaded honestly) vs the conditional slice; the two curves differing. Single Figure making Friedman's argument visible.
- source: greedyfuncti-fig11-garnet-interaction — stem `garnet-pdp`, reader must see the real 1-D partial-dependence lines and the 3-D Ga×Zr mesh from 13,317 real garnets; placement: centered in the PDP section.
- draw: Shapley by hand — the 2-feature coalition lattice (∅, {1}, {2}, {1,2}) with the model's value at each node and the two orderings' marginal contributions averaged. Single Figure; the computation the exercises mirror.
- draw: The waterfall — base value E[f] stepping to f(x) by per-feature contributions for one spam prediction (our fitted booster), 'george' bar flagged. Computed; inspired by Lundberg Fig 1.

## EXERCISE PLAN
1. Warm-up: compute the two orderings' marginal contributions and the Shapley values for a given 2-feature model table.
2. Boundary probe: a feature the model never splits on — show permutation importance, PDP flatness, and Shapley all return exactly zero (missingness axiom at work); then two duplicated features — show Shapley splits their credit in half while permutation importance can zero BOTH; name the property each method lost.
3. Claim to refute: "PDP shows the causal effect of the feature." Refute with the marginal-vs-conditional figure plus a confounded example; state what PDP legitimately shows (the model's response surface, marginally averaged).
4. Derivation skipped: prove the 2-player Shapley uniqueness — the three axioms pin the two values (linear algebra on the four coalition values).
5. Research-shaped: reproduce the sickness-score result: compute Shapley for the (fever, cough) game and compare with the paper's human-judgment bars (Fig 4a); state where intuition and axioms agree.
6. Mixed review (E3): compute permutation importance on the spam booster with and without 'george' — quantify how a leakage feature dominates attribution (module 5's audit composed with this toolkit). [FORWARD-lite: none needed beyond]
7. FORWARD (E7): compute the exact Shapley value of one feature in a 3-feature LINEAR model and observe it equals w_j(x_j − E[x_j]) — attributions collapse to the familiar. Solution: Linear SHAP; and the deeper point that interpretability tools must reduce correctly on models we already understand — the criterion to carry to any new tool → Ref (course-level closing; no later lesson depends on this, per extra-lesson rules — cite tabular-showdown's feature-findings as kin).

## ARC
- Inherits: fitted ensembles (bagging-random-forests, gradient-boosting), importance's first appearance (bagging-random-forests), the leakage audit habit (module 5).
- Contributes: the interrogation toolkit with its question-matching discipline and axiomatic core — off-path enrichment.
- Hands off: nothing structurally (extra lesson); thematic kinship with tabular-showdown's feature-robustness findings noted in its close.
- Spine step: "The ensemble resolution…" (step 7, off-path member).
