# Explaining an alert: attributions, rules and reason codes — research brief

Lesson: `alert-explanations` (module: governance, core, planned). NEW.
Goal: Produce an explanation for an individual alert — Shapley attributions, extracted rules, attention weights — and judge which satisfies an investigator, a customer and a supervisor.
Prerequisite from classical-ml (shap-interpretability, an EXTRA lesson there — so this lesson must not assume it): the Shapley axioms and SHAP. This lesson restates the three axioms and additivity in one section (the minimum needed), with a Ref to classical-ml for Kernel SHAP and the tree algorithm; it does not re-derive them.

## Sources
- Baesens Ch4 pp.150–155 (primary): opening the black box — Hinton diagram of 4 hidden neurons × 5 insurance variables (Income can be dropped), backward variable selection, rule extraction (decompositional vs pedagogical; the Emma/Will/Dan/Bob toy; accuracy, conciseness, fidelity — fidelity printed as (a+d)/(b+c), a typo for (a+d)/(a+b+c+d): use the corrected form), two-stage model Score = LR + NN on residuals (worked: 0.68 + 0.14 = 0.82); Ch4 pp.188–189 comprehensibility (white box: regression, trees; opaque: NN, SVM, ensembles), justifiability (coefficient signs match business knowledge); Ch1 Table 1.4 interpretability as a success criterion; Ch4 Fig 4.7 scorecard points as the self-explaining model; Ch2 red flags "translated to expert rules and documented with reasoning".
- Handbook Ch7 SequentialModeling attention (attention weights as per-prediction interpretability; the near-uniform vs one-hot demo) and Ch7 FFNN embeddings (inspectable weights) — the neural explanations.
- FraudFinder bqml/04 2546–2685 (ML.EXPLAIN_PREDICT with UNNEST(top_feature_attributions) — top-5 attributions per prediction) and bqml/06 L3420–3442 (explanation spec: sampled Shapley; attribution skew/drift monitored) — the production form of an attribution and its monitoring.
- Dal Pozzolo 2018 Sec. II (the DDM is not interpretable by investigators; scoring rules are) and Handbook Ch2.3 (same) — why the alert needs a narrative.
- APATE Sec. 4.2 and Fig. 6 (random-forest importance annotated with logistic-regression signs; long-term network scores' signs: merchant negative, cardholder positive) — global explanation and its reading; Akoglu Sec. 4 (graph anomaly description: interpretation-friendly factorisations, connection subgraphs/CePS "find the master criminal mind from the suspects"; DARPA's ~60 initial reviews budget as the reason explanation matters) and Sec. 4.1 NrMF residuals.
- Neo4j L4 (why determinism matters: "a path connects them" as an explanation legal and audit teams accept; Louvain ids change run to run) and L5 (guilt by association as prioritisation, not proof).
- GDPR Art 13(2)(f)/14(2)(g)/15(1)(h) ("meaningful information about the logic involved, as well as the significance and the envisaged consequences"), Rec 71 (an explanation of the decision reached; right to challenge); AI Act Art 86 (clear and meaningful explanations of the role of the AI system in the decision-making procedure and the main elements of the decision taken; "based mainly"), Art 13(3)(b)(iv) (explainability in the instructions for use), Art 14(4)(c) (the overseer must be able to interpret the output); AMLR Art 76(5)(c) (the customer can obtain an explanation and challenge, except Art 69 reports), Art 69(2) (the suspicion assessment's bases), Art 77(1)(b) (the assessment record) — the three audiences' legal requirements, each quoted short; forward to module 10 for the obligations in full.
- Lundberg & Lee 2017 (NOT in the dossier's read set; cited as the SHAP reference in course sources via classical-ml) — Ref only.

## Key points
1. Three audiences, three objects: the investigator needs a narrative that says which facts raised the score (attribution + the facts themselves); the customer needs the main elements of the decision in plain terms (reason codes) and a way to challenge; the supervisor needs the record (score, attributions, action, disposition — the assessment record). One alert, three renderings of the same attribution.
2. Attributions that sum to the score: the additive form φ₀ + Σφ_i = f(x); the three Shapley axioms (efficiency, symmetry, dummy — plus additivity across models) stated, with the statement that they force a unique φ (classical-ml Ref for the proof); the base value as the training prior; the alert narrative as "terminal risk over 30 days 0.075 (+0.41), 14 transactions today (+0.33), …, base 0.003" — computed on the handbook's real-data tree splits as the running example; what attributions do not say (causation; counterfactual edits — the adversary's knapsack is the counterfactual view, Ref adversarial-classification).
3. The scorecard as the explanation that needs no method: points per attribute are the attribution (recall scorecards-woe); the trade: interactions are invisible to it; the two-stage model (LR + NN residual) as the engineering compromise, with the 0.68 + 0.14 example.
4. Rule extraction: decompositional (from the model's internals) vs pedagogical (fit rules to the model's input–output); judged by accuracy, conciseness and fidelity (the corrected formula); the Hinton diagram and backward elimination as global reads; when a rule is the better explanation (a blocking rule must be a rule: AMLR Art 18(3)(f) requires the detection criteria to be approvable by the entity).
5. Neural explanations: attention weights over the history (one-hot on the last transaction when the context is the last hidden state — so the "explanation" can be an artefact of the context choice); embedding inspection; the honest statement that attention is a weighting, not an attribution.
6. Graph explanations: a propagated exposure explains itself by the path ("a path connects them"); components are deterministic and auditable where communities are not; connection subgraphs between suspects as the investigator's tool (Akoglu Sec. 4.2).
7. Production and monitoring: the top-5 attributions stored per prediction (FraudFinder); attribution drift as a monitored quantity (forward to model-risk-monitoring); the explanation in the assessment record (AMLR Art 77).
8. ★ Starred: Kernel SHAP as weighted regression and TreeSHAP (classical-ml Refs); fidelity's typo in the source; NrMF residuals as interpretable anomaly indicators.

## Set pieces & gems
- The real-data tree's two splits turned into an alert narrative with attributions.
- 0.68 + 0.14 = 0.82: the two-stage model.
- The fidelity typo (a+d)/(b+c) — corrected and explained.
- Attention one-hot on the last transaction — an explanation that is an artefact.
- "A path connects them" (Neo4j) vs Louvain's changing ids.
- DARPA's 60 reviews: explanation as triage economics.
- The three legal phrasings side by side (GDPR / AI Act / AMLR).

## Pitfalls
- Do not re-derive Shapley uniqueness or Kernel SHAP; one section, Refs.
- Keep "explanation" (to a person) and "attribution" (a decomposition) distinct words.
- The legal quotations are short and forward; module 10 owns the obligations.

## FIGURE PLAN
- draw: One alert, three renderings: a column of feature attributions (waterfall from base 0.003 to score 0.93) in the middle, the investigator narrative to the left, the customer reason codes and the supervisor's record row to the right — one component figure. Key image.
- draw: `<FigureSequence>` (3 frames) of the waterfall: base value, each feature's bar added in turn, the final score — with the additivity sum written under the last frame (voita rule 7).
- draw: Decompositional vs pedagogical rule extraction as two near-identical pipelines (model internals → rules; model I/O → rules) with the fidelity table under each (voita rule 8). Inspired by Baesens Figs 4.23–4.24 (recreated).
- draw: The two-stage model: LR score + NN on residuals = final, with the worked 0.68 + 0.14 — formula dissected over a tiny table (Baesens Fig 4.25's idea).
- draw: Attention weights under two contexts as two bar charts over five history positions (reused idea from module 7, here captioned as "explanation or artefact").
- draw: A propagated exposure with the explaining path highlighted (seed → merchant → cardholder) beside a Louvain community whose id changes between two runs — the determinism argument as two panels.
- draw: Hinton diagram: 4 hidden neurons × 5 variables as signed squares with one variable's column visibly empty — inspired by Baesens Fig 4.21 (recreated).

## EXERCISE PLAN
1. Warm-up: given a base value and five attributions, write the alert narrative and verify the sum equals the score; then write the customer's two reason codes.
2. Derivation the lesson skipped: show that for a linear model with independent features the Shapley attribution of feature i is β_i(x_i − E[x_i]) — and that for the scorecard this is the points of the attribute minus the mean points, so a scorecard's explanation is its Shapley explanation.
3. Boundary probe: a feature that is a pure label proxy (terminal risk computed without delay) — its attribution dominates every alert; what the explanation then says and why the supervisor should read a dominant single attribution as a leakage alarm.
4. Claim to refute: "Attention weights show which past transactions caused the alert." Refute with the handbook's context demo (weights are a function of the context vector; with the last hidden state as context they are one-hot on the last transaction regardless of content); name the axiom an attention weighting lacks (efficiency: it does not sum to the score).
5. Research-shaped: extract a pedagogical rule set (depth-3 tree on the GBM's predictions) for the simulator's tuned GBM and report accuracy, conciseness (rule count) and fidelity with the corrected formula.
6. FORWARD (E7): compute the mean absolute attribution of each feature on week 1 and on week 6 of the simulator stream and rank — the reader sees the ranking move (scenario 2's terminals come and go) and asks how far it may move before the model is suspect → lands on `model-risk-monitoring`'s stability index.
7. Mixed review (E3): take the frontier decision (score-to-action) for an alert whose attribution is dominated by amount — write the customer-facing reason code without disclosing the threshold, and state which GDPR article's phrasing it must satisfy.

## ARC
- Inherits: the decision layer (score-to-action); the scorecard's points (scorecards-woe); attention (sequence-models-for-transactions); exposure paths (guilt-by-association); the GBM (gbm-model-selection).
- Contributes: the explanation layer for three audiences — attributions that sum, rules with fidelity, the artefact warning for attention, deterministic graph explanations, the record.
- Hands off: attribution drift and the record (model-risk-monitoring); the legal obligations behind each audience (module 10); the alert ledger (label-maturation; the capstone's alert-ledger checkpoint).
- Spine step 9: from score to governed decision.
