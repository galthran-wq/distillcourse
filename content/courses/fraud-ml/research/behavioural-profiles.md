# Behavioural profiles: periodic time, peer groups and break points — research brief

Lesson: `behavioural-profiles` (module: features, type: core, status: planned). NEW — full re-synthesis, no draft exists, so no REVISION block.
Goal: Construct profile-deviation features — a von Mises time-of-day flag, peer-group and break-point statistics, inter-event time — and explain why each is a contextual anomaly score with the entity as the context
Opening (verbatim, the lesson must start with it): A cardholder usually pays at 22:00, 23:00, 02:00 and 03:00. The average of those clock times is 12:30, an hour at which they never pay, so a feature built on 'distance from the usual time' with ordinary arithmetic would flag their most ordinary purchases. How should a 'usual time', a 'usual peer' and a 'usual self' be computed so that a departure from each is a feature a detector can use?

## Sources to consult
- Bahnsen et al. 2016, Sec. 3.2 (why the arithmetic mean of hour-of-day fails, Fig. 1; the von Mises distribution Eqs. 12–14; the confidence interval at level α; the binary feature "time inside the CI"; at least seven days of history; the same idea for day of week), Table 6 (worked example, α = 0.9: arithmetic mean 16:19 vs periodic mean 21:07 for transaction 6, interval 15:21–02:52, True; transaction 7 at 06:00 vs 18:33 / 22:33, interval 17:19–01:46, False), Appendix A (periodic mean and std, Eqs. A.1–A.3), Sec. 5 Fig. 6 and 7 (periodic features add about 13% savings only when stacked on the aggregates; raw+per alone is weak) — `research/texts/staged-bahnsen2016-feature-engineering.txt` (Table 6 near line 415).
- Baesens et al. 2015, Ch3 "Break-point analysis" (intra-account: a fixed window split into 20 old + 4 new, t-test of means, ranked by t), Ch3 "Peer-group analysis" (inter-account: peers by business knowledge or distance, k neither too small nor too large, t-score (y_n − mean of peers)/s, Christmas spending not flagged), Ch3 Figs. 3.4–3.5, Table 3.1 — `research/texts/fraudanalyti-s2-ch2-3.txt`.
- Bolton & Hand 2002, Sec. 3 (cumulative card spending is remarkably linear in time, so jumps or slope changes warrant investigation; "jam jarring"), Sec. 4 (peer group analysis and break detection named for laundering) — `research/texts/statisticalf-.txt`.
- Lucas & Jurgovsky 2020 Sec. 4.2 (tdelta = t_x − t_{x−1} in minutes because frauds come in bursts, Eq. 5; trading entropy) — `research/texts/creditcard-.txt`.
- Chandola et al. 2009, Sec. 2.2.2 (contextual anomalies: contextual vs behavioural attributes; EUR 1,000 a week at Christmas vs July), Sec. 10.1 (the profile context: cell-phone fraud with the user as context; peer group analysis as reduction to point anomalies) — `research/texts/anomalydetec-s2-.txt`.
- Baesens Ch1 Table 1.2 (the "Bandit" call records: each unremarkable alone, anomalous against this subscriber's own pattern) — `research/texts/fraudanalyti-s1-preface-ch01.txt`.

## EXPLANATION PLAN
### The problem as the newcomer meets it
The previous lesson gave the card a past as counts and sums. Three things about a card's habit are not counts: *when* it pays (a clock time), *whether it behaves like cards of its kind* (a comparison with other cards), and *whether it has just changed* (a comparison with itself a week ago). Each needs a different arithmetic, and the obvious one is wrong in each case. The constraint is unchanged: computed from earlier rows only, cheap enough to run per payment. Terms the newcomer does not have: "circular mean", "von Mises", "concentration", "peer group", "break point", "contextual anomaly", "inter-event time".

### Chain of sub-problems
1. **A usual time of day** — Obvious attempt: mean and standard deviation of the hour, flag payments more than two standard deviations away. Why it fails: clock time is a circle; 22:00, 23:00, 02:00, 03:00 average to 12:30 and the spread is enormous, so the card's most ordinary payments are the furthest from "usual". Answer: map each time to an angle, average the unit vectors, take the angle of the resultant as the circular mean; fit a von Mises distribution (the normal distribution's analogue on a circle) whose concentration comes from the resultant length; build a confidence arc at level α (0.9) and emit a binary feature: inside the arc or not. Because: on a circle the only consistent notion of "average" is the direction of the summed vectors, and a distribution on the circle gives the arc a probability meaning. Carry the worked example through: six earlier transactions give periodic mean 21:07 against arithmetic 16:19, arc 15:21–02:52, transaction 6 at 23:45 inside (True); transaction 7 at 06:00 against arc 17:19–01:46, outside (False).
2. **How much history the arc needs** — Obvious attempt: the last 24 hours. Why it fails: with one or two points the arc is either the whole circle or a sliver, and later payments never fall "inside". Answer: at least the previous seven days; the same construction for day of week. Because: the arc's width is estimated from the resultant length, which needs enough points to mean anything.
3. **Does it pay** — on real data the periodic feature adds about 13% savings on top of the aggregates and almost nothing on top of raw fields alone. Because: "unusual hour" is only informative once "unusual amount and frequency" have been accounted for.
4. **Behaving like one's kind** — Obvious attempt: compare the card to the global average. Why it fails: in December everyone spends more; a global threshold flags the whole population. Answer: peer-group analysis — choose k similar accounts (by business knowledge or by distance in a profile space), compute the peers' statistic at the same time, score the account by a t-statistic of its own value against the peers' mean and spread, rank by the score. Because: the comparison is inter-account at the same instant, so a season shared by the peers cancels out; Christmas is not flagged.
5. **Behaving like oneself** — Obvious attempt: compare this week to the all-time mean (a slow, blunt signal). Answer: break-point analysis — a fixed window of recent events split into an old part (20) and a new part (4), a t-test between the two means, accounts ranked by the statistic. Because: the question is whether the account has *just* changed, which is intra-account and local in time; the two-sample test is the smallest honest comparison of before and after.
6. **Cumulative spend as a line** — a card's cumulative spending is close to linear in time; a jump or a change of slope is a break point drawn, and the jam-jarring customer (one card for one purpose) has the straightest line. Because: this is the picture the t-test formalises.
7. **The time between events** — Obvious attempt: counts per window (already have). Why they are not enough: five payments in an hour and five in a day both give count 5 in a 1-day window. Answer: tdelta, the minutes since the card's previous payment, as a feature; frauds come in bursts. Because: it is the finest-grained recency and the first thing a sequence model (module 7) would learn.
8. **What these features are** — all four are the same object: a value that is normal in one context and anomalous in another, with the cardholder as the context. The telecom "Bandit" calls are each unremarkable and together not this subscriber's. Because: naming the pattern now lets module 5 call it a contextual anomaly and module 7 call it a sequence.

### Set pieces and worked examples to recreate
- The 02:00/03:00/22:00/23:00 → 12:30 clock-time trap on a clock face (Bahnsen Fig. 1, Sec. 3.2).
- The von Mises worked example, α = 0.9: transaction 6 arithmetic 16:19 vs periodic 21:07, arc 15:21–02:52, True; transaction 7 at 06:00, arc 17:19–01:46, False (Bahnsen Table 6).
- Periodic features add ~13% savings stacked on agg1+agg2; raw+per alone 5–35% savings (Bahnsen Fig. 6–7, abstract).
- The break-point split 20 old + 4 new with a t-test; peer-group t-score (y_n − peer mean)/s; the Christmas example (Baesens Ch3 Figs. 3.4–3.5).
- Cumulative spend linear in time; jam jarring (Bolton & Hand Sec. 3, p.239).
- The "Bandit" call records table: Boston, 1–2 a.m. and late evening, 34–39 s (Baesens Table 1.2, after Fawcett and Provost).
- EUR 1,000 a week normal in December, anomalous in July (Chandola Sec. 2.2.2).

### Pitfalls and terms to define
- "Circular mean" and "concentration": define with the unit-vector picture before any formula; the resultant length R near 1 means tight, near 0 means spread.
- "von Mises": say it is the normal distribution on a circle, parameters μ (direction) and κ (concentration); do not use "wrapped normal".
- "Confidence interval" here is an arc; state α as the share of the fitted mass inside the arc, not a hypothesis-test p-value.
- "Peer group" vs "break point": inter-account vs intra-account; a reader will conflate them — the Christmas example separates them.
- "t-statistic" is prerequisite statistics; one clause of recall.
- The periodic mean/std formulas in the appendix (Eqs. A.1–A.3) are the ones to typeset; the paper's inline Eq. 12 is a derived form.
- Do not call these "anomaly scores" before the last section; the word "contextual anomaly" belongs to module 5 and is previewed only.

### Recalled, not re-taught
- Windowed and RFM aggregates (`transaction-aggregates`): recalled as "the counts and sums of the previous lesson".
- Mean, standard deviation, the two-sample t-test (classical-ml / prerequisite statistics): one clause each.
- The simulator's scenario 3 (`canonical-datasets`): the ×5 amount for 14 days as the break point the t-test should find.

## FIGURE PLAN
- draw: key image — a 24-hour clock face with four payments at 22, 23, 2, 3 o'clock; the arithmetic-mean hand at 12:30 and the circular-mean hand at 00:30, the resultant vector drawn; single `<Figure>` (inspired by Bahnsen Fig. 1).
- draw: `<FigureSequence>` 4 frames: unit vectors for each time → summed resultant → its angle as the circular mean → the von Mises arc at α = 0.9 shaded around it (inspired by Bahnsen Figs. 2–3).
- draw: the Table 6 example as a clock: six earlier payments, the arc 15:21–02:52, transaction 6 inside, then transaction 7 at 06:00 outside a re-fitted arc; single `<Figure>` with two panels.
- draw: peer-group vs break-point as two small panels: left, one account's December spend against its peers' December spend (not flagged); right, one account's last 4 events against its previous 20 (flagged); single `<Figure>` (inspired by Baesens Figs. 3.4–3.5).
- draw: cumulative spend of one card as a near-straight line with a jump and a slope change marked; single `<Figure>` (from the Bolton & Hand description, computed on the simulator).
- draw: tdelta histogram for genuine vs fraudulent payments on the simulator, log scale, the fraud burst at small values; single `<Figure>`.
- draw: savings bars raw, raw+per, raw+agg1+agg2, raw+agg1+agg2+per, annotated +13% (house-style redraw of Bahnsen Fig. 6–7 numbers).

## EXERCISE PLAN
1. [warm-up] Compute the circular mean and resultant length of 22:00, 23:00, 02:00, 03:00 by hand (unit vectors, angle of the sum).
2. [boundary probe] Two payments at 06:00 and 18:00 give a resultant of length zero; show what the circular mean and the arc become, and why the feature must be undefined (not False) until a minimum history exists.
3. [claim to refute] "A card that pays at the same hour every day has concentration κ → ∞, so any payment one minute off should be flagged." Refute: the arc has a floor set by the number of points and the chosen α; state the width at seven daily points.
4. [derivation skipped] Derive the circular mean as the maximum-likelihood direction of a von Mises fit (the score equation in μ), and show that the arithmetic mean is the limit for times clustered within a few hours away from midnight.
5. [research-shaped] On the simulator, implement break-point analysis (20 old + 4 new, t on amounts) and measure its AP on scenario-3 frauds against the 30-day mean-amount feature of the previous lesson.
6. [mixed review] Build the von Mises flag with a 7-day history that includes rows after the scored payment, and show on one card why the flag changes — the leak of `transaction-aggregates` in a new feature.
7. FORWARD → `anomaly-detection-framing`: take the peer-group t-score of every card on one simulator day, alert the top 100 by |t| and compute precision — the reader has built an unsupervised, contextual detector and seen its precision before module 5 names the family.

## ARC
- Spine step 3 "Features are context": "A raw transaction has no fraud signal; the signal is the deviation from the entity's own history, which means windowed aggregates over the cardholder and the terminal, computed from what was known at scoring time — including labels that had not yet arrived."
- Inherits: aggregates and the earlier-rows rule (`transaction-aggregates`); the simulator's scenarios (`canonical-datasets`); the t-test and basic statistics (prerequisite).
- Contributes: the circular time feature, peer-group and break-point statistics, tdelta, and the idea that the entity is the context.
- Hands off: contextual anomalies and the per-user profile to `anomaly-detection-framing`; tdelta and the burst to `sequence-models-for-transactions`; the periodic flag to `point-in-time-feature-lab`; break-point statistics to `model-risk-monitoring` as the ancestor of a stability test.
