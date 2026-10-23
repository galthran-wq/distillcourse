# From score to action: routing, decision tables and the inspection frontier — research brief

Lesson: `score-to-action` (module: governance, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Design the decision policy that turns a fraud probability into decline, step-up or review, including a probability-by-amount investigation frontier and a rule table verified for conflicts and gaps
Opening (verbatim, the lesson must start with it): A model gives a payment a 0.93 probability of fraud. The bank can let it through, ask the customer for a second factor, decline it, or send it to an investigator — and each action has a cost, a legal limit and a queue behind it. How does a probability and an amount become one of four actions, and how are the rules that do it checked for conflicts and gaps?

## Sources to consult
- Baesens et al. 2015, Ch6 — `research/texts/fraudanalyti-s6-ch6-7.txt` (printed page = PDF page − 34): 'Model representation' pp. 282–283 (traffic-light bands, hard cut-off vs semi-automated referral zone, analysts may overrule); 'Decision tables' pp. 283–286 (Tables 6.1–6.3 expanded → contracted → minimised: eight rules to four columns; Table 6.4 rule verification exposing a conflict R2 vs R4 and a gap at age ≥ 25 and employed; Prologa); 'Selecting the sample to investigate' pp. 286–290 (hit rate is not a target; utility per outcome incl. the scare-off value of inspecting a non-fraud; optimal inspection budget; Table 6.5 expected fraud amount P × amount, 90% × EUR 10 vs 25% × EUR 10,000, the stepwise frontier); 'Fraud alert and case management' pp. 290–295 (priority, routing, mitigation first, victim notification, audit trail, link analysis, feedback loop; the fraud-ring rule for claimants sharing address/car/bank/phone); Figs 6.3–6.5 (SAS screens).
- Bolton & Hand 2002 — `research/texts/statisticalf-.txt`: Sec 8 p. 246 graded investigation (expensive immediate review for the highest scores, cheap observation for moderate ones); Provost's comment p. 250 (automatic action only on very strong evidence; 1M accounts × 1% false alarms = 10,000 a day; case lists; real-time and comprehensibility constraints).
- Dal Pozzolo et al. 2014, Sec 5 — `research/texts/staged-dalpozzolo2014-learned-lessons.txt` (PDF beside it): the three outcomes accept / refuse / block card; a false alert costs a phone call, too many or a wrongly blocked card costs the customer.
- Handbook Ch4.2 'Threshold-based metrics' — `research/texts/reproducible-Chapter_4_PerformanceMetrics_ThresholdBased.md`: threshold metrics make sense only when the objective is fixed (max recall at precision ≥ 60%).
- PSD2 Art 68(2)–(6) (blocking an instrument on objectively justified suspicion, informing the payer), Art 97 (SCA as the step-up), Art 73(1) (refund by next business day) — `research/texts/directiveeu-s3-psd2-title4-7.txt`; AMLD6 Rec 114 and Art 64(3) (de-risking as financial exclusion) — `research/texts/regulationeu-s5-amld6-recitals.txt`, `regulationeu-s7-amld6-part.txt`; AMLR Art 21(3) (refusal decisions recorded with grounds) — `regulationeu-s3-amlr-ch2-3.txt`. One paragraph each; the module-10 lessons carry the law.
- Dalvi et al. 2004 Sec 6.2 (penalty 10/100/1000 for a false positive; a blocked legitimate customer costs more than a missed fraud) — `research/texts/adversarialc-.txt`, cross-reference only.

## EXPLANATION PLAN
### The problem as the newcomer meets it
Everything so far ends in a ranked list cut at k. A bank does not act on a ranking; it acts on each payment within seconds, and it has more than one action. Approving costs nothing now and the amount later if fraud; declining costs a customer and, under PSD2, a liability; a second factor costs friction and conversions; an investigation costs an hour of a person and only exists for about a hundred cases a day. The newcomer has a probability (calibrated, since module 2) and an amount, and has to produce one of four actions — and the rule that does it will be written as if-then rules by people, which means it can contradict itself and leave cases uncovered without anyone noticing.
Terms the newcomer does not yet have: decision zones / referral band, step-up, decision table (expanded, contracted, minimised), hit rate, inspection frontier, expected fraud amount, de-risking, mitigation, routing, audit trail.

### Chain of sub-problems
1. **One threshold is not enough.** Obvious attempt: flag iff P > τ, with τ from the cost ratio (module 2). Why it fails: there are four actions, not two, and the middle region is where a person should look. Answer: probability bands — automatic approve below the lowest, automatic decline above the highest, a referral band in between routed to analysts who may overrule; the semi-automated mode. Because: the extremes are where the model is right often enough that a human adds nothing; the band is where the investigator budget is spent.
2. **Which action in the middle.** Obvious attempt: review everything in the band. Why it fails: the band holds thousands a day and the team can open a hundred. Answer: a step-up (a second authentication factor) as the cheap action that resolves most of the band at once, then review for what remains — the law's own ladder (PSD2 Art 97's SCA, Art 68's block on objective suspicion). Because: step-up costs the customer seconds and the bank nothing per case; review costs a person.
3. **Why the amount must enter the decision.** Obvious attempt: route by probability alone. Why it fails: 90% on EUR 10 is EUR 9 of expected loss, 25% on EUR 10,000 is EUR 2,500. Answer: the expected fraud amount P × Amt and a stepwise investigation frontier over probability bands × amount bands (Table 6.5); the Bayes-minimum-risk rule of module 2 is the continuous version, the table is the one analysts can read. Because: the investigator's hour is worth a fixed sum, and only the expected amount tells whether the hour is worth spending.
4. **How many to investigate.** Obvious attempt: maximise the hit rate (fraud found per inspection). Why it fails: a 100% hit rate is reached by inspecting almost nothing. Answer: assign a monetary utility to each of the four outcomes — inspect-fraud (amount + costs + penalty + a social value), inspect-non-fraud (negative, but with a scare-off value), skip-non-fraud (zero), skip-fraud (strongly negative) — and choose the inspection level that maximises total utility, the marketing targeting-fraction argument. Because: the budget is a decision, not a given; `economics-of-detection` set up the utilities, this is where they are spent.
5. **What a wrong decline costs.** Obvious attempt: count false positives. Why it fails: a false positive is a blocked card, a lost customer, and under PSD2 Art 68 an action that must be objectively justified and communicated; a segment with a high false-positive rate is de-risking, which AMLD6 names as financial exclusion and supervisors police. Answer: measure false-positive harm per group as well as in total; 1% false alarms on a million accounts is 10,000 calls a day. Because: the cost matrix of module 2 priced the alert, not the relationship.
6. **Rules written by people.** Obvious attempt: a list of if-then rules in a rule engine. Why it fails: a list of eight rules can contain two that fire on the same case with opposite actions, and leave a case no rule covers, and nobody sees it in the list. Answer: the decision table — conditions as rows, cases as columns, actions below; expand (every combination), contract (merge columns with identical actions), minimise (reorder conditions to merge more); eight card rules collapse to four columns and reveal that card-not-present is always fraud in that rule set; Table 6.4's verification finds a conflict (R2 vs R4) and a gap (age ≥ 25, employed) mechanically. Because: completeness and consistency are properties of the table, checkable by a program, not of the list.
7. **The alert as a case.** Answer: priority (the frontier), routing (rules on type and amount to the right desk), mitigation first (block the card, freeze the account), then victim notification, then the fraudster; an audit trail per alert; link analysis for rings (claimants sharing address, car, bank account, phone are one person); the feedback loop that returns dispositions to the model. Because: the loop of module 1 is closed here, and module 10 will require the record (AMLR Art 77).
8. **Graded investigation and time.** Very high scores get immediate expensive review; moderate ones get cheap continued observation; the value of a detection falls with delay while the evidence grows (module 1). Because: review is not one action but a schedule.

### Set pieces and worked examples to recreate
- 90% × EUR 10 = EUR 9 vs 25% × EUR 10,000 = EUR 2,500, and the stepwise frontier over probability × amount bands. (Baesens Ch6 p. 290, Table 6.5)
- The eight-rule card set as expanded, contracted and minimised decision table, four columns, card-not-present always fraud. (Baesens Ch6 Tables 6.1–6.3, pp. 284–285)
- Rule verification: the conflict between R2 and R4 in column 4 and the gap at age ≥ 25 and not unemployed. (Baesens Ch6 Table 6.4, pp. 285–286)
- Five-zone traffic-light bar with the referral band and analyst overrule. (Baesens Ch6 Fig 6.2, p. 282)
- The four-outcome utility table and the inspection level that maximises total utility; the hit-rate paradox. (Baesens Ch6 pp. 287–289)
- 1M accounts × 1% = 10,000 false alarms a day. (Bolton & Hand, Provost p. 250)
- Accept / refuse / block card as the three outcomes; a false alert is a phone call. (Dal Pozzolo 2014 Sec 5)
- The claimant fraud-ring rule (shared address, car, bank account, phone). (Baesens Ch6 p. 292)
- Legal anchors in one line each: PSD2 Art 68(2)–(6); Art 73(1) next-business-day refund; AMLR Art 21(3) record of refusal grounds; AMLD6 Rec 114 de-risking. (regulation texts)

### Pitfalls and terms to define
- "Hit rate" here is fraud found per inspection, not recall; define before the paradox.
- The frontier assumes a calibrated probability; recall the β correction, or the EUR 2,500 is a fiction.
- Decision tables: define expanded / contracted / minimised in the worked example, not in the abstract; the reader has not met the term.
- "Step-up" means a second authentication factor (PSD2's SCA); do not use "SCA" before module 10 beyond one sentence.
- The utilities of step 4 are the bank's; the social value of a detection is a stated judgment, not a measurement.
- Baesens' case-management figures are vendor screenshots; the lesson uses one sourced image for what an investigator sees and draws the rest.

### Recalled, not re-taught
- `economics-of-detection`: the four costs and the do-nothing baseline.
- `example-dependent-cost`: the Bayes-minimum-risk rule — the frontier is its table form.
- `undersampling-calibration`: calibrated probabilities as the precondition.
- `alert-feedback-selection-bias`: the top-k queue the frontier replaces.
- `fraud-detection-system`: the rule layers and investigators.

## FIGURE PLAN
- draw: The probability × amount plane with the stepwise investigation frontier and the two worked points (0.9, EUR 10) and (0.25, EUR 10,000) on opposite sides. Single <Figure>; key image. Inspired by Table 6.5.
- draw: The five-zone bar with approve / step-up / review / decline regions and the referral band shaded, arrows to the four actions and their costs. Inspired by Fig 6.2.
- draw: <FigureSequence> (3 frames): the eight-rule decision table expanded → contracted → minimised, columns merging one frame at a time, the "card-not-present → fraud" column emerging. Inspired by Tables 6.1–6.3.
- draw: Table 6.4's verification as a table figure with the conflicting column and the missing column highlighted.
- draw: Total utility against inspection level for the four-outcome utility table, the maximum marked and the hit-rate curve rising past it. Computed on a toy day.
- source: fraudanalyti-s6-sas-link-analysis — stem `investigator-link-screen`; the reader must see what an investigator's case screen shows: claims, claimants, addresses, cars, accounts as a graph with flagged nodes in red and a time slider; float right beside the case-management section.
- draw: The alert's life as a sequence: priority → routing → mitigation → notification → disposition → feedback, with the audit trail as a strip beneath. Single <Figure>.

## EXERCISE PLAN
1. [warm-up] With an investigation worth EUR 60 of analyst time, classify six (probability, amount) pairs by the frontier P × Amt ≥ 60 and by a flat threshold P ≥ 0.5; list the disagreements.
2. [boundary probe] Set the investigator budget to zero: show the policy collapses to approve/decline by the module-2 threshold, and that the step-up band's optimal width is then the cost ratio of friction to a decline — which utility entry disappeared?
3. [claim to refute] "A rule set that never fires two rules on the same case is complete." Refute with a two-condition example that is consistent but has a gap, and show how the contracted decision table exposes it.
4. [derivation skipped] Derive the frontier from the Bayes-minimum-risk rule of module 2: show that "investigate iff C_a ≤ Amt · P" is the continuous boundary and the stepwise table is its discretisation; give the step size that bounds the loss from discretising.
5. [research-shaped] On the simulator's test week, compute the hit rate and the total utility (with stated utilities) for inspection levels 25, 50, 100, 200, 400 cards; report where utility peaks and where hit rate peaks.
6. [mixed review, E3] The fraudster of `arms-race-replay` keeps amounts just under the tree's split; show what the frontier does to that fraudster that a probability threshold does not (the amount enters twice).
7. [research-shaped] For a million-account book, estimate the daily false alarms at FPR 1%, 0.1%, 0.01% and the analyst headcount each implies at 100 cases per analyst-day; state which FPR the module-2 reachable region allows.
8. FORWARD → `alert-explanations`: for one alert at 0.93, list what the investigator, the customer and the supervisor would each need to know before acting on the routing decision — the reader finds the three audiences before the next lesson names the explanations.

## ARC
- Spine step 9 "From score to governed decision": "A score becomes an action under a budget — decline, step up, or review — must be explained to an investigator and to the customer, and must be monitored for stability and recalibrated; the model is a managed asset with a life cycle, not a file."
- Inherits: the four costs and the inspection budget (`economics-of-detection`); the Bayes-minimum-risk rule and savings (`example-dependent-cost`); calibrated probabilities (`undersampling-calibration`); the top-k queue and the feedback loop (`alert-feedback-selection-bias`).
- Contributes: decision zones, the step-up as the cheap action, the investigation frontier, the utility-maximising budget, false-positive harm, the decision table and its verification, the alert as a case.
- Hands off: `alert-explanations` (what each audience needs); `model-risk-monitoring` (the policy's thresholds as monitored quantities); `psd2-sca-tra` (step-up as SCA and the exemption); `aml-transaction-monitoring-duty` (the assessment record); `tra-exemption-engine` and `pipeline-capstone-lab` (the alert ledger).
