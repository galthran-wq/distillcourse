# Label maturation: chargebacks, reports and the training set as of a date — research brief

Lesson: `label-maturation` (module: system, core, planned). NEW.
Goal: Design the labelling pipeline of a deployed detector — which outcomes become labels, when each settles, how alert dispositions are recorded — and assemble a training set as of a date.

## Sources
- Dal Pozzolo 2018 Sec. II-C, III (feedbacks within the day for alerted cards; delayed samples at δ; unreported = genuine; labels trickle in rather than all at δ — the paper's stated simplification), Sec. VI-A (card-ID removal because blocked cards), Sec. VI-F (δ = 15 still works).
- Handbook Ch2.3 (labels from investigation and complaints; days to weeks; the delay period as a tunable simplification), Ch3 (the test-set construction with known-card removal), Ch5 (older blocks dropped), shared_functions get_train_test_set (for test day d, drop customers whose frauds up to d − delay are known).
- PSD2 Art 71 (notification without undue delay and at most 13 months after the debit date), Art 73(1) (refund by next business day unless reasonable grounds communicated in writing), Art 72 (burden of proof; recorded use is not proof), Art 96(6) (annual fraud statistics by payment means), RTS Art 19(1) (fraud "whether or not recovered" enters the rate; the 90-day window), RTS Art 21 (quarterly per-exemption counts) — the card label's legal clocks.
- AMLR Art 69(1) (report on suspicion), Art 71 (refrain; 3 working days), Art 77(1)(b) (the Art 69(2) assessment record kept whether or not an STR was filed; unredacted; five years), Art 78 (answer enquiries on five years); AMLD6 Art 22(2)/28 (FIU feedback at least annually on quality, timeliness, description, documentation), Art 24 (suspensions), Art 19(3) (triage) — the AML label's clocks and the record.
- Baesens Ch4 p.123 (the insurance claim funnel: suspicion check, worth-investigating by size, court or settlement, each with error; small claims never labelled — selection bias in labels), p.125 and p.166 (labels not noise-free; boosting risky), Ch1 pp.22–23 (the fraud cycle's feedback arrow; retraining-frequency factors), Ch6 pp.290–295 (case management: dispositions, audit trail, closing the loop), Ch6 pp.287–288 (pre-screening paradox).
- Bolton & Hand Sec. 2 (undetected fraud labelled legitimate — noise of unknown extent; misreported legitimate cases), Sec. 8 (time to detection; several false negatives unavoidable because an account is used for several frauds before being caught).
- Altman Sec. 1, 3.1, 7 (real AML labels radically incomplete; false negatives corrupt training and evaluation; card fraud's near ground truth from cardholder feedback vs nothing equivalent for laundering; transitive taint as the complete-label ideal); Weber Sec. 2.2 (Elliptic labels from entity heuristics; 77% unlabelled).
- Jurgovsky Sec. 4.1 (test starts > 1 week after training because labels arrive ~1 week late); Gama Sec. 3.5 and App. B.2 (delayed, unreliable, biased feedback; PAKDD'09 labels released only for the first part; credit scoring's one-year horizon); Lucas & Jurgovsky Sec. 1.1 (labels by human investigators after calling the holder).
- Alert-feedback-selection-bias (the F/D split), delayed-labels-prequential (the geometry), point-in-time-features (label time travel; feature_time for label-derived features), alert-explanations and score-to-action (the record's fields), eu-aml-single-rulebook (Art 77), psd2-sca-tra (Art 71/73), AI Act Annex IV 2(d) (labelling procedures documented) and Art 10(3) (labels "to the best extent possible, free of errors").

## Key points
1. Label sources as a table with clocks: investigator feedback (same day, alerted cards only, confirmed fraud or cleared); customer dispute/chargeback (days to 13 months; PSD2 Art 71; refund by next business day Art 73); recovery (does not change the label; counts in the RTS rate); STR filed (days) and FIU feedback (a year; quality not truth); conviction (years; rare); silence (read as genuine after δ — with an error set equal to the undisputed frauds); heuristic labels (Elliptic's entity categories); synthetic complete labels (AMLworld's taint). For each: coverage, delay, noise direction (false negatives in silence; false positives in investigator over-flagging; label flips on dispute reversal).
2. The funnel: not every fraud can be labelled — the insurance funnel (small claims never investigated), the AML incompleteness (most laundering never labelled), Bolton & Hand's several-frauds-before-caught — the label's coverage is a function of the detection process itself (module 8's point in its operational form).
3. The alert disposition record: per alert — score, attributions, band/zone, action taken, investigator disposition (confirmed / cleared / undetermined), timestamps of each; kept for every alert whether or not escalated (AMLR Art 77(1)(b)); the record is simultaneously the feedback label (F_t), the audit trail (Baesens; AI Act Art 12), the supervisor's evidence (AMLD6 Art 37), and the input to the FIU-quality feedback; what a dispute does to it (the label flips; accuracy under GDPR Art 5(1)(d)).
4. The training set as of date t, assembled step by step: rows = transactions up to t; features = as-of reads at each row's timestamp (point-in-time-features), label-derived features as of their feature_time; labels = feedbacks up to t and delayed samples settled by t − δ; silence rows after t − δ excluded (not labelled genuine — the handbook's delay block); cards blocked since removed from later rows (known-card removal; CARD ID dropped); the F/D split preserved if the module-8 strategy is used; the retraining cadence's window and forgetting policy applied; the set's version recorded (what date, what δ, what policy) — the documentation the AI Act's Annex IV 2(d) asks for.
5. Label noise and what to do: silence's false negatives (bound by the dispute rate); investigator variability; boosting's sensitivity to mislabels (Baesens); the pre-screening paradox (a cleared account's disposition should enter as a feature or a snooze, not vanish); the honest statement that the training label is "what the detection process knew by t − δ", never "fraud".
6. The retraining cadence decided from the clocks: δ sets the earliest honest training date; the dispute tail (13 months) sets when a label is final; the F/D loop runs daily on provisional labels; a periodic "label refresh" reconciles disputes; evaluation reports are versioned by the label snapshot used (RTS Art 19's 90-day rate recomputed as disputes arrive — the rate itself matures).
7. ★ Starred: AML's STR as a label of suspicion, not fraud (Rec 145); FIU feedback categories; the Elliptic heuristics; AMLworld's taint; the GDPR accuracy duty on labels.

## Set pieces & gems
- The clocks table: same day / days / 13 months / a year / never.
- "Silence is read as genuine" and its exact error set.
- Art 77(1)(b): the record of the alert that was cleared.
- The insurance funnel (small claims never labelled).
- The 90-day fraud rate that changes as disputes arrive.
- Dal Pozzolo's "labels trickle in" simplification, now undone.
- Altman: card fraud has near ground truth, laundering none.

## Pitfalls
- The lesson overlaps module 2 (geometry) and module 8 (bias) — keep it operational: sources, clocks, the record, the assembly procedure; Ref the other two for the theory.
- "Label" means different things per crime type (fraud confirmed vs suspicion reported); keep the vocabulary strict.
- No legal advice; the articles supply clocks and record duties.

## FIGURE PLAN
- draw: Label sources on one timeline from the transaction: feedback (day 0–1), STR (days), delayed/silence cut (δ), dispute window (to 13 months), FIU feedback (a year), with coverage and noise annotated per source — single component figure; key image.
- draw: `<FigureSequence>` (4 frames) of a training set assembled as of t: (1) all rows up to t, (2) feature as-of reads attached, (3) labels: feedbacks (small, recent) and delayed samples (settled by t − δ), the silence band after t − δ struck, (4) blocked cards removed and the F/D split marked.
- draw: The alert disposition record as a table figure (score, attributions, zone, action, disposition, timestamps, escalated?) with three example rows — one escalated, one cleared, one undetermined — and the three readers (retraining, supervisor, FIU) as arrows out of it.
- draw: The insurance funnel: claims → suspicion check → worth-investigating by size → investigated → court/settlement, with the unlabelled mass at each stage shaded. Inspired by Baesens Ch4 p.123 (text).
- draw: The maturing 90-day fraud rate: the same quarter's rate recomputed weekly as disputes arrive, rising toward its final value — computed on the simulator with simulated dispute delays.
- draw: Card fraud vs AML label completeness as two near-identical bars (fraud: near-complete via disputes; laundering: mostly unlabelled; AMLworld: complete by construction) — voita rule 8.

## EXERCISE PLAN
1. Warm-up: a day has 10,000 transactions, 25 frauds, 100 alerts with 40 confirmed; 8 of the 25 are never disputed; write the label vector's composition at day 1, day δ = 7, and after 13 months.
2. Derivation the lesson skipped: show that reading silence as genuine at t − δ produces a false-negative rate equal to the undisputed-fraud share, and derive the bias it induces in a model's estimated precision at k (upward or downward, and by how much) for the handbook's simulated week.
3. Boundary probe: δ = 0 (train on today's feedbacks only) and δ = 13 months (train on fully matured labels only) — write what each training set contains and loses; locate the handbook's δ = 7 as a compromise and state the quantity (dispute arrival curve) that justifies a choice.
4. Claim to refute: "A cleared alert carries no information and should be deleted from the training set." Refute: it is a labelled negative from the model's own high-score region (the rarest kind), a record the law requires (Art 77), and the pre-screening paradox shows it must inform the policy; name what deleting it does to the F population.
5. Research-shaped: on the simulator with simulated dispute delays (exponential, mean 20 days, 15% never disputed), assemble training sets as of day 60 under δ ∈ {3, 7, 14, 30} and report each set's label count, false-negative count and the AP of a tree trained on it, scored on days 70–76 with the harness.
6. FORWARD (E7): list the fields the disposition record must carry for each reader (retraining, AMLR Art 77, RTS Art 21, the FIU) and sketch the schema — the reader has specified the ledger → lands on `eu-transaction-monitoring-design` and the capstone's alert-ledger checkpoint.
7. Mixed review (E3): the training set as of t with the F/D split (alert-feedback-selection-bias) and the known-card removal (delayed-labels-prequential): write the three rules in order and state which rule each bias (selection, future leakage, blocked-card leakage) is removed by.

## ARC
- Inherits: the loop's label mechanics (fraud-detection-system), the delay geometry (delayed-labels-prequential), the F/D split (alert-feedback-selection-bias), the record duties (eu-aml-single-rulebook), the legal clocks (psd2-sca-tra), as-of reads (point-in-time-features).
- Contributes: the labelling pipeline — sources with clocks and noise, the disposition record, the training set as of a date, the cadence derived from the clocks.
- Hands off: the full design (eu-transaction-monitoring-design); the capstone's label-arrival, feedback-delayed-retrain and alert-ledger checkpoints.
- Spine step 11: the system.
