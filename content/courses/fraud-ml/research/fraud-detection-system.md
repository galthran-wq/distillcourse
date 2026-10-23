# The layered fraud detection system — research brief

Lesson: `fraud-detection-system` (module: problem, core, planned). NEW. First lesson of the course — an easy opener (C3): polished, concrete, ending in a felt win (the reader can place any detection problem into the five-layer diagram and say where its labels come from).
Goal: Explain the five-layer fraud detection system and locate the model, the investigator budget and the delayed-label feedback loop within it.

## Sources
- Handbook Ch2.3 "Fraud detection system" (primary): the five layers (Terminal, Transaction-blocking rules, Scoring rules, Data-driven model, Investigators); real-time / near-real-time / offline brackets; aggregated features computed by the DDM; alert–feedback interaction; investigator capacity; the layered-control diagram (Fig 1). Example rules: blocking "IF internet transaction AND unsecured website THEN deny"; scoring "IF previous tx in different continent AND < 1 hour THEN score 0.95".
- Dal Pozzolo et al. 2018, Sec. II (Real-world FDS) and II-C/II-D: blocking rules fast and very precise; scoring rules expert if-then with arbitrary scores; DDM not interpretable, only retrained, once daily at end of day; feedbacks vs delayed supervised samples; unreported = genuine; Fig. 1 layers timeline. Sec. III: alerts A_t = top-k by posterior rank (Eq. 1), feedbacks F_t = all recent transactions of alerted cards (Eq. 2), D_{t−δ} (Eq. 3).
- Bolton & Hand 2002 Sec. 1 (p.235–237): prevention vs detection; suspicion score ranked against limited investigative capacity; Sec. 8 (p.245–246): time-to-detection, graded investigation (expensive review for very high scores, cheap observation for moderate). Provost's comment p.249–251: value of detection decays with delay while evidence accrues; automatic action only on very strong evidence.
- Baesens Ch1 "Fraud cycle" (Fig 1.3, pp.22–23): detection → investigation → confirmation → prevention with the feedback arrow; retraining-frequency factors. Ch1 pp.29–30: card decision under 8 seconds, so real-time trend variables may be infeasible.
- APATE Sec. 2.2 (Fig 2): acceptance check → online sanity check → offline sanity check → customer notification; labels up to one week late; the six-seconds rule.

## Key points
1. The five layers with their clocks: ms (terminal, blocking), sub-second (scoring rules, DDM), days-to-weeks (investigators). The model is one layer, not the system.
2. What each layer may be: blocking rules must be fast and very precise (a wrong block is a lost sale); scoring rules encode known patterns with subjective scores; the DDM outputs a probability-like score nobody can hand-edit — it is retrained, typically nightly.
3. Alerts are a ranking cut at k: with ~100 checks a day and hundreds of thousands of transactions, the DDM's job is precise alerts, not a decision on every row. Dal Pozzolo's Eq. 1 defines the alert set as top-k by rank — state it.
4. The label loop: investigators label alerted transactions (plus recent transactions of alerted cards) within the day = feedbacks; everything else is labelled after δ (dispute/complaint/investigation) = delayed samples; silence is read as genuine. The delay is a design parameter the whole course carries (validation blocks in module 2, terminal risk shift in module 3, feedback bias in module 8).
5. Three speeds, three artefacts: a rule table, a model file, a case queue — and the data each produces (blocks, scores, dispositions). The lesson ends with the reader filling a table: for a card payment, an AML transfer, an account login — which layer sees it first, what the budget is, where its label comes from, how late.
6. Dry framing of why this is distinct from classical-ml's classification: the objective is precision at a budget (module 2), the training set is the model's own choice (module 8), the test is next week (module 2).

## Set pieces & gems
- The verbatim example rules (blocking / scoring) from Handbook Ch2.3 and Dal Pozzolo Sec. II — show both as a two-row rule table.
- Worldline numbers (Handbook Ch3 RealWorld, Ch4.5): ~400,000 tx/day, ~1,000 frauds/day (0.25%), ~300 compromised cards/day (~3 frauds per card), investigators ~100 cards — the keeper numbers.
- Provost's "1% daily false alarms on 1M accounts is 10,000 a day" — the capacity argument in one line (also reused in economics-of-detection; here as framing, there as computation).
- Bolton & Hand's graded investigation: two tiers of review.
- APATE's six-seconds rule and Baesens' under-8-seconds: the latency budget is fixed by the authorisation, not the model (forward to module 11).

## Pitfalls
- Do not pre-teach the metrics (module 2) or the feedback bias mechanism (module 8); name them as consequences of the loop and `<Ref>` forward.
- Keep the Handbook's and Dal Pozzolo's simplifications explicit: alerts raised by ranking at end of day vs online in practice; labels trickle in rather than all at δ.
- No fraud-statistics padding (Nilson losses etc.) — L12 deletion test; one framing number at most.

## FIGURE PLAN
- draw: The five-layer system as a left-to-right pipeline with three clock brackets (ms / sub-second / days–weeks) under it, the model box highlighted amber, the feedback arrow from investigators back to the model's training data in blue. Single `<Figure>`; key image. Inspired by Handbook Ch2.3 Fig 1 and Dal Pozzolo Fig. 1 (recreated, not traced).
- draw: `<FigureSequence>` (5 frames): one transaction's day — (1) arrives at terminal, (2) passes blocking rules, (3) gets a scoring-rule score and a DDM score, (4) lands in the top-k alert set among the day's transactions, (5) its feedback label returns next day while a non-alerted fraud on the same day waits δ days for its dispute. One element changes per frame.
- draw: The alert set as a ranked column of a day's transactions with a cut at k = 100; above the cut the few frauds caught, below the cut the many missed; annotation "precision of the top k is the objective". Inspired by Dal Pozzolo Fig. 2's supervised-sample timeline.
- draw: Timeline of supervised samples at the end of day t: feedback slices F_t … F_{t−6} (small, fraud-rich) and delayed slices D_{t−7}, D_{t−8} (huge, 0.25% fraud) as stacked bars by size and class mix. Inspired by Dal Pozzolo 2018 Fig. 2.
- draw: The rule table figure: two rows (blocking rule, scoring rule) with their trigger, action and latency — text figure, component style.
- draw: The reader's end-of-lesson table rendered as a figure: three detection problems × (first layer, budget, label source, delay) — filled for card payments, left as the exercise for AML and ATO.

## EXERCISE PLAN
1. Warm-up (mechanical, once): from the Worldline numbers compute frauds per compromised card and the fraction of daily compromised cards a k = 100 budget can cover at perfect precision.
2. Boundary probe: set the delay δ to zero — what changes in the loop (feedbacks = delayed samples), and why the real system cannot do it (what a dispute is, when it arrives).
3. Claim to refute: "A perfectly precise blocking rule should be moved into the model layer because the model is more accurate." Break it on latency, interpretability and the asymmetry of a wrong block; name the layer property that fails.
4. Derivation the lesson skipped: show that if investigators label only alerts and non-alerts are read as genuine after δ, the set of transactions whose label is wrong at day t + δ is exactly the undisputed frauds — and bound its size by the dispute rate.
5. Research-shaped: from Handbook Ch2.3's description, write the pseudocode of one end-of-day cycle (score, rank, alert, collect feedbacks, append delayed samples, retrain) — the loop the capstone lab executes.
6. FORWARD (E7): a day has 8,300 transactions and 60 frauds; investigators check 100. Compute the best possible precision and recall at that budget, and the false-positive rate at which the ROC curve stops being reachable → lands on `alert-budget-metrics`' 99%-of-the-ROC argument.
7. Transfer: place an AML transaction-monitoring system (no card terminal, an FIU instead of a chargeback) into the five layers and state which layer and which clock change.

## ARC
- Inherits: nothing (opener); the classical-ml reader's notion of a classifier with a fixed threshold.
- Contributes: the system diagram the whole course annotates — the model as a layer, alerts as a ranking at a budget, labels as feedbacks + delayed samples with silence read as genuine.
- Hands off: the typology that fills the table (financial-crime-typology); the budget arithmetic (economics-of-detection); the delay as the validation block (delayed-labels-prequential); the loop as bias (alert-feedback-selection-bias).
- Spine step 1: "A fraud detector is the fourth layer of a five-layer system: rules run before it, investigators with a budget of about a hundred alerts a day run after it, and the labels those investigators produce come back weeks later and only for what was alerted — every later difficulty is a consequence of that loop."
