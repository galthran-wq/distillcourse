# From score to action: routing, decision tables and the inspection frontier — research brief

Lesson: `score-to-action` (module: governance, core, planned). NEW.
Goal: Design the decision policy that turns a fraud probability into decline, step-up or review, including a probability-by-amount investigation frontier and a verified rule table.

## Sources
- Baesens Ch6 (primary): pp.282–283 traffic-light indicator (dark green → red bands); hard cut-off vs semi-automated referral zone (auto-decide extremes, yellow to manual review, analysts may overrule); pp.283–286 decision tables — expanded, contracted, minimised (Tables 6.1–6.3: eight card rules collapse to four columns and reveal card-not-present is always fraud), rule verification for conflicts and gaps (Table 6.4: R2 vs R4 opposite actions; missing Age ≥ 25 and employed), Prologa; pp.286–290 selecting the sample to investigate — hit rate (100% = too few inspected), ranking, preliminary screening, utility per outcome (inspect-fraud = amount + costs + penalty + social value; inspect-non-fraud with scare-off value; skip-non-fraud; skip-fraud strongly negative), optimal inspection budget maximising total utility, expected fraud amount P × amount (90% × 10 = 9 not worth it; 25% × 10,000 = 2,500 is), Table 6.5 the stepwise investigate frontier over probability × amount bands; pp.290–295 alert and case management (priority, rule-based routing, mitigation first — block card, freeze account — then notify victims, then prosecute or settle; audit trail; OLAP; link analysis; feeding outcomes back); pp.287–288 inspector pre-screening paradox; Ch6 p.292 the fraud-ring rule (A and B sharing address, car, account, phone are one person).
- Bahnsen Sec. 2 and 4.3 (BMR as the per-transaction decision; the cost of a flag C_a) and Dal Pozzolo 2014 Sec. 5 (accept / refuse / block card as the three outcomes; a false alert costs a phone call; too many or wrongly blocked cards cost the customer) — the action vocabulary.
- Bolton & Hand Sec. 8 (graded investigation: expensive immediate review for very high scores, cheap observation for moderate) and Provost's comment (automatic action only on very strong evidence; mixed-initiative; 10,000 false alarms a day on 1M accounts; case lists).
- Dal Pozzolo 2018 Sec. II (blocking rules precise; scoring rules; alerts; investigators check the card's recent transactions), Table VI (NCP_k vs k as the hiring decision).
- PSD2 Art 68(2)–(6) (blocking an instrument for objectively justified reasons incl. suspected fraud; inform the payer before or immediately after), Art 73(1) (refund by next business day unless reasonable fraud suspicion communicated in writing), Art 74(2) (no payer loss without SCA), Art 97 (step-up = SCA) and RTS Art 18 (the exemption as the "approve without friction" action) — the legal shape of decline / step-up / approve; one paragraph, forward to module 10.
- AMLR Art 18(3)(d) (the decision to onboard or execute is not outsourceable), Art 76(5)(b) (automated decisions to refuse/maintain/execute need meaningful human intervention), AMLD6 Rec 114 (de-risking pushes customers to unregulated channels), AMLR Rec 53/75/98 (refusal decisions recorded with grounds; PEP status alone is no ground) — the human-in-the-loop and false-positive-harm hooks; one paragraph each, forward.
- AI Act Art 14(4)(b) (automation bias) and Art 26(11) (inform natural persons subject to Annex III decisions) — one sentence each, forward.
- HKU A2 Model suggestion ($4,214 per investigation; $60,302 mean fraud) — the per-case cost figure for the frontier arithmetic.
- Neo4j L5 (guilt by association as prioritisation, not proof) and Baesens Ch3 intro (anomalies need follow-up) — "a score is a queue entry, not a verdict".

## Key points
1. Actions, not labels: approve, step up (SCA/OTP), review (queue), decline, block the card — each with its own cost on both sides (lost sale, friction, investigator time, fraud loss, customer loss) and its own legal shape (PSD2 Art 68/73/74/97; AMLR Art 76(5)); the zones as a mapping from probability bands to actions, with the referral band where humans decide and may overrule.
2. The investigation frontier derived from module 2's inequality: work an alert iff P × amount ≥ cost per investigation (plus the utility terms Baesens lists); the (probability, amount) plane and the stepwise frontier (Table 6.5's bands); the two example points (EUR 9 vs EUR 2,500); the budget k as the second constraint — rank by expected fraud amount, cut at k; hit rate as a diagnostic, not a target; the optimal budget as the argmax of total utility (recall economics-of-detection) and NCP_k vs k as the hiring curve.
3. Rules around the model: decision tables as the engineering of the rule layer — expand, contract, minimise (the eight-rule example worked: CNP always fraud emerges), verify (conflict R2/R4, gap Age ≥ 25 ∧ employed); the rule table and the score coexist (blocking rules before, routing rules after) — the five-layer picture now as a decision diagram.
4. Routing and case management: priority, routing by rule, mitigation first (block/freeze) then notification then pursuit; the audit trail as a record every later lesson needs (alert ledger, module 11; AMLR Art 77); the pre-screening paradox (a cleared account stays high-scored — the policy must absorb investigator knowledge: snooze, whitelist with expiry, or a feature).
5. False-positive harm: the friction side of the cost matrix made explicit — blocked cards, declined genuine payments (Provost's 10,000/day), exited customers (de-risking); per-group false-positive rates as the fairness measurement the regulations ask for (AMLR Rec 152's anti-bias clause, AI Act Art 10(2)(f) — forward); the decision policy, not the model, is where friction is set.
6. Automation and the human: automatic action only at the extremes (Provost; AMLR Art 76(5)); the referral band's size as a staffing and a legal choice; automation bias (AI Act Art 14) — the analyst who rubber-stamps.
7. ★ Starred: Prologa-style decision-table tooling; utility with scare-off value; the inspector-knowledge absorption as a feature.

## Set pieces & gems
- 90% × EUR 10 = 9 vs 25% × EUR 10,000 = 2,500.
- Eight rules → four columns → "card-not-present is always fraud".
- Table 6.4's mechanical conflict and gap.
- 100% hit rate means under-investment.
- Mitigation first, then victims, then the fraudster.
- The pre-screening paradox.
- 10,000 false alarms a day.

## Pitfalls
- Do not restate the law here beyond one paragraph per hook; module 10 carries it.
- Keep "alert" (a queue entry) and "decision" (an action on the payment) distinct throughout.
- The frontier uses a calibrated probability — Ref the β correction (imbalance-techniques-revisited) where P enters.

## FIGURE PLAN
- draw: The decision zones as a probability bar with five bands mapped to actions (approve / step up / review / decline / block) and the referral band highlighted, beside the PSD2/AMLR hooks as small labels — single figure. Inspired by Baesens Fig 6.2 (recreated). Key image.
- draw: The investigation frontier: the (probability, amount) plane with iso-value curves P·A = c, the stepwise Table 6.5 frontier drawn over them, and the two example points placed. Inspired by Table 6.5.
- draw: `<FigureSequence>` (3 frames) of decision-table minimisation: (1) the expanded eight-column table, (2) contracted, (3) minimised to four columns with the CNP column highlighted. Inspired by Tables 6.1–6.3 (recreated, house-style grid).
- draw: Rule verification: a decision table with the conflicting pair (R2 vs R4) and the gap cell highlighted in the warning colour. Inspired by Table 6.4.
- draw: Total utility vs budget k with the hit rate as a second curve falling — the "hit rate is not a target" picture (computed on a toy ranking with per-alert utilities).
- draw: The case-management loop as a cycle: alert → prioritise → route → mitigate → notify → pursue → disposition → back to training data and rules; the audit trail drawn as the ring's log. Inspired by Baesens Fig 1.3 and Ch6 pp.290–295.
- draw: Per-group false-positive rates as a small bar chart (two groups, same threshold) with the friction cost beneath — the fairness measurement in its simplest form (computed on the simulator with a synthetic group attribute; marked synthetic).

## EXERCISE PLAN
1. Warm-up: for ten alerts with (P, amount) and an investigation cost of EUR 25, apply the frontier and the budget k = 4; list the alerts worked.
2. Derivation the lesson skipped: derive the optimal budget k* from a ranked list with per-alert expected utilities u_(i) decreasing: k* = max{k: u_(k) ≥ 0}; then show hit rate at k* is below the hit rate at k = 1 and why that is not a defect.
3. Boundary probe: a referral band of width zero (fully automatic) and of width one (everything reviewed) — write the staffing, the latency and the legal status (AMLR Art 76(5)) of each; which the law permits for which actions.
4. Claim to refute: "The model's false-positive rate is 1%, so friction is 1% of genuine customers." Refute: false positives per customer accumulate over transactions (a customer with 30 transactions a month), and friction is per group and per action (a step-up is not a decline); compute the monthly fraction of customers touched at FPR 1% and 30 transactions.
5. Research-shaped: minimise a provided twelve-rule card rule set into a decision table and report the conflicts and gaps it exposes.
6. FORWARD (E7): take the top ten alerts of a simulator day and write, for each, the one sentence an investigator needs to act on it using only the score — the reader finds the sentence cannot be written from a number → lands on `alert-explanations`.
7. Mixed review (E3): the frontier with P from an undersampled model's p_s vs the corrected p′ (imbalance-techniques-revisited): count how many of the ten alerts change side of the frontier.

## ARC
- Inherits: costs and the budget (economics-of-detection, example-dependent-cost); the feedback loop's dependence on the alert policy (alert-feedback-selection-bias); the five layers.
- Contributes: the decision layer — actions, zones, the frontier, verified rule tables, routing and the audit trail, friction as a measured harm.
- Hands off: explanations (next); monitoring of the policy (model-risk-monitoring); the legal shape of each action (module 10); the alert ledger (label-maturation); the capstone's queue.
- Spine step 9: "A score becomes an action under a budget — decline, step up, or review — must be explained to an investigator and to the customer, and must be monitored for stability and recalibrated; the model is a managed asset with a life cycle, not a file."
