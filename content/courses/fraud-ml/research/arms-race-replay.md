# The arms race and the feedback loop replayed on the simulator — research brief (module 8 APPLICATION)

Lesson: `arms-race-replay` (module: adversary, core, planned). NEW. Module-final application (L16): a computational study the reader can run — two papers' central experiments re-enacted on the handbook simulator.
Goal: Evaluate Dalvi's oscillating repeated game and Dal Pozzolo's feedback-versus-delayed-sample comparison by reproducing both as a computational study on the handbook simulator, and state where the simulator departs from the papers.

## Sources
- Dalvi et al. 2004 Sec. 6.3 and Fig. 3 (the repeated game: fixed-form adversary re-learns NB each round; utility oscillates with period 2 over 15 rounds; mechanism — good words lose and regain their log-odds) and Sec. 6.1 (the three cost models) — the design to transplant.
- Dal Pozzolo et al. 2018 Sec. V, VI-B, VI-C Table III, VI-D (synthetic abrupt drift by juxtaposing two months; CP_k loss 7.7% AW vs 12.5% W^D), VI-E Table IV (importance weighting), Algorithm 1 — the design to transplant.
- Handbook Ch3.2 (the simulator: three scenarios; scenario 1 amount > 220 learned as 218.67 by a depth-2 tree; scenario 2 terminals compromised 28 days; scenario 3 customers ×5 for 14 days) and the course's reduced generator (shipped in the module-2 lab) — the instrument; Ch2.3 (alerts and feedback; the DDM retrained daily).
- Provost's comment (criminals pay initial bills, then ramp; vans after location models) and Dal Pozzolo 2014 Sec. 5 (test small then replicate) — the behavioural templates for the adaptive scenario.
- Gama Sec. 5 (closed loop breaks replay evaluation) and Sec. 4.2 (prequential evaluation on the stream) — the evaluation discipline for the study.
- Baesens Ch1 p.10 ("a deployed detector degrades its own detection power as fraudsters adapt") — the thesis in one line.
- Module-2 harness (CP@100, P@k, prequential folds) — the referee.

## Key points
1. The study's design stated up front: one simulator stream (60 days), one detector (a depth-limited tree or small GBM retrained on a cadence), two experiments — (A) an adaptive fraudster on scenario 1; (B) the feedback loop with k = 100, δ = 7 — and one referee (CP@100 and P@100 per day with the harness).
2. Experiment A (Dalvi transplanted): the fraudster's one knob is the amount; after each retraining the fraudster observes the detector's learned split (complete information, as in the paper) and sets amounts just below it (219 against 220, then lower as the split moves); the detector retrains on the newly labelled frauds and the split moves down; the fraudster's take falls (the edit cost) and at some amount the fraud is not worth it (the ΔU_A rule); plot the split and the take per round — the oscillation/decay shape; the cost model's role (a fraudster who can also change terminals — scenario 2's knob — evades a model that only sees amounts: the graph/terminal features of modules 3 and 6 are what he cannot cheaply edit).
3. Experiment B (Dal Pozzolo transplanted): daily loop; F_t from the top-100 alerts' cards; D_{t−7} after the delay; four learners (D only, F only, pooled W, averaged AW) scored on day t; the ranking of P_k per day over 40 days; the training set's fraud share and mean amount for F vs D plotted over days — the drift the model causes with no change in the stream; the importance-weighting check (weights from a logistic model of P(s=1|x)) on F — no gain, as in Table IV; optionally the amount > 500 sanity selection where weighting works.
4. Reading the two together: in A the stream changes because of the model; in B the training set changes because of the model while the stream does not; both are "drift" a detector on an exogenous schedule mistakes for the world changing; the retraining cadence is a parameter of both races.
5. Departures (L16): the simulator's fraudster has one or two knobs and no cost model beyond the lost take; alerts are raised by ranking at day's end (the paper's own simplification); labels arrive exactly at δ; the simulator has no investigator error; the NB closed-form log-odds of Dalvi are replaced by a tree's split — the knapsack degenerates to "move below the split"; the oscillation in A is a decay unless the detector forgets (Forget strategy) — which the study shows by switching strategies.
6. What the reader runs: the notebook study is shipped complete in the lesson (not a lab); every number in the prose is produced by the shipped code with a fixed seed.

## Set pieces & gems
- 219 vs 220: the fraudster reads the split.
- The decay of the fraudster's take per round — the edit cost made visible.
- F's fraud share rising day after day while the stream's rate is flat.
- The weighting that works on amount > 500 and not on alerts, reproduced.
- Switching the detector to Forget turns the decay back into an oscillation.

## Pitfalls
- Everything here is simulated; say so in every figure caption; no claims about real fraudsters beyond the papers' quoted anecdotes.
- Keep the two experiments separate in code and prose; the "reading together" section is the only place they meet.
- The harness's CP@100 needs card ids and days — the simulator has both; do not use ULB here.

## FIGURE PLAN
- draw: `<FigureSequence>` (5 frames) of experiment A: (1) round 0 — the tree's split at 218.67 and the fraudster's amounts above it, (2) the fraudster moves to 215, frauds pass, (3) retraining moves the split to 212, (4) round 3, (5) the take per round falling below the worth-it line. Key image.
- draw: Split position and fraudster's take per round as two lines over 10 rounds, with the Forget-strategy variant as a second pair showing oscillation — computed.
- draw: Experiment B's training-set drift: F's fraud share and mean amount per day vs D's and the stream's, three lines each — computed.
- draw: P_k per day for D, F, W, AW over 40 days with the Friedman rank sums in a side table — computed; the AW > W ordering visible.
- draw: The two races on one timeline: retraining ticks (daily), the fraudster's adaptation ticks (after each observed split), the label-arrival ticks (δ) — the three clocks of the loop in one picture.
- draw: Importance weighting on two selections (amount > 500 vs alerts): P_k with and without weights as paired bars — computed; the module's contrast pair reproduced.

## EXERCISE PLAN
1. Warm-up: from the shipped study's round table, compute the fraudster's cumulative take over ten rounds under the static and the daily-retrained detector.
2. Boundary probe: a fraudster with zero edit cost (any amount is as good) — show the detector's split converges to the genuine amount distribution's edge and precision collapses; then infinite edit cost (the paper's "not worth it" case) — the static detector suffices; locate the cost at which retraining starts to pay.
3. Claim to refute: "Retraining more often always helps against an adaptive fraudster." Refute from experiment A: with complete information the fraudster adapts after every retraining; faster cadence lowers the split faster and loses more genuine transactions (false positives) — name the quantity (the detector's own cost of moving the split) the claim ignores, and the strategy (Forget / keep old frauds) that changes the dynamic.
4. Research-shaped: rerun experiment B with k = 300 and report NCP_k vs k (the paper's Table VI shape) on the simulator.
5. Derivation the lesson skipped: in experiment A with a depth-1 tree, derive the split's position after round r as a function of the fraudster's margin m (amount = split − m) and the retraining window, and show it decreases geometrically toward the genuine distribution's upper quantile when the window forgets old frauds and stalls when it keeps them.
6. FORWARD (E7): in experiment B, change the alert policy from "top 100 by score" to "top 100 by score × amount" (an expected-fraud-amount rule) and watch F's composition and P_k change — the reader has changed the decision policy and sees the training data follow → lands on `score-to-action`.
7. Mixed review (E3): apply a Page–Hinkley detector (concept-drift) to the daily error stream of experiment A's static detector and report the alarm round; state which drift type the alarm diagnoses and why the diagnosis is wrong (the model caused it).

## ARC
- Inherits: the game and the knapsack (adversarial-classification); feedbacks, delayed samples and the F/D strategy (alert-feedback-selection-bias); drift strategies and detectors (module 7); the simulator and harness.
- Contributes: the module cashed out as a runnable study — both loops reproduced, the "drift the model causes" reading, and the cadence as a race parameter.
- Hands off: the decision policy as the lever that shapes the training data (score-to-action); the retraining loop and alert ledger of the capstone.
- Spine step 8: the adversary and the feedback loop.

## APPLICATION (L16)
- Artifact: a computational study (shipped notebook) re-enacting Dalvi 2004's repeated game (Fig. 3) and Dal Pozzolo 2018's Table III/IV comparison on the handbook simulator.
- Module results used: minimum-cost camouflage and the worth-it rule (adversarial-classification); feedback vs delayed samples, the failure of importance weighting, the averaged strategy (alert-feedback-selection-bias); CP@100/P@k and prequential scoring (module 2); Static/Update/Forget strategies (module 7).
- Departures from the idealisation: a one-knob fraudster without a cost model, complete information by construction, end-of-day ranking alerts, labels exactly at δ, no investigator error, a tree split in place of per-feature log-odds — each named with what it changes (decay vs oscillation; the degenerate knapsack).
