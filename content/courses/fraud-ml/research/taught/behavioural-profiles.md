# behavioural-profiles — ledger

**Problem.** A card paying at 22, 23, 2, 3 o'clock averages to 12:30: how to
compute a usual time, a usual self and a usual peer so that a departure from
each is a feature? Answer: circular mean + von Mises arc and an in-arc flag
(≥ 7 days and ≥ 7 payments of history, missing below that); break-point t-statistic (last 24
payments, 20 old vs 4 new); peer-group t-score against k similar cards in the
same period (season cancels); the gap since the previous payment, standardised
on the card's own log-gaps. All four score a value against the cardholder as
context (contextual anomaly, named only in the last section).

## Explained
- Arithmetic mean of hours fails: 22,23,2,3 → 12:30, sd ≈ 10 h; 23:00 is 10.5 h "from usual", 13:00 is 0.5 h; any cut point splits some card's habit (cut at noon breaks 11:00+13:00) — §Clock time lives on a circle / ### Why the average hour fails (key image clock.svg)
- Definition: θ = 2πh/24 (15°/h) from midnight clockwise; point (cos θ, sin θ), first coord → midnight, second → 06:00; C̄, S̄, R̄; circular mean μ̂ = direction of (C̄,S̄); R̄ ∈ [0,1], undefined μ̂ when R̄ = 0 — ### Averaging directions instead of numbers
- Worked: 4 times → sums 3.405 / 0.448, C̄ 0.851, S̄ 0.112, R̄ 0.86, 7.5° → 00:30; in-body exercise 21:00, 00:00, 03:00 → arithmetic 08:00, R̄ 0.805, μ̂ 00:00; bunched times agree (13,14,16 → 14:20 vs 14:19) — same ###
- Normal fails on a line (hour 25, −3); Definition von Mises f = e^{κcos(θ−μ)}/(2π I0(κ)); κ = 0 uniform; large κ ≈ normal sd 1/√κ rad = 3.82/√κ h — §A usual range: the von Mises arc / ### A distribution on the circle
- Fit: μ̂ = circular mean, κ̂ solves A(κ) = I1/I0 = R̄ (ML; derived in an exercise) — same ###
- Definition: arc at level α = [μ̂ − c, μ̂ + c], c solves ∫_{μ̂−c}^{μ̂+c} f = α (fitted density); periodic time feature = 1 inside, 0 outside; c computed numerically (a library's von Mises interval at κ̂), hand check c ≈ 1.645·3.82/√κ̂ h (too narrow at small κ̂); FigureSequence circular-1..4 (arrows → mean → direction → arc) with Task; full path for opening card R̄ 0.86 → κ̂ 3.9 → c 3.45 h (3 h 27 min; hand 3.2) → arc 21:03–03:57 (01:00 in, 06:00 out); table R̄ 0.50/0.80/0.86/0.95/0.99 → κ̂ 1.2/2.9/3.9/10.3/50 → c 7.9/4.2/3.5/2.0/0.9 h, hand check 5.8/3.7/3.2/2.0/0.9 h — ### The arc and the flag
- Demo CircularMeanClock embedded after the table, with a Task: four payments with the arithmetic hand ≥ 3 h from every payment and the circular hand within 2 h of one, then score 06:00 against the 90% arc — same ###
- Worked example on the seven-payment card (transaction-aggregates): payment 6 (23:45) from 1–5: angles 275, 308.75, 337.5, 12.5, 289.5°; C̄ 0.589, S̄ −0.577, R̄ 0.82, μ̂ 21:02 = 21.04 h (arith 16:19), κ̂ 3.2, c 3.88 h, arc 17:10–00:55 → 1; from 1–6: μ̂ 21:33 (arith 17:33), arc 17:37–01:28, 00:00 in, 06:00 out (seven-card.svg) — ### The seven-payment card, scored
- α = share of fitted mass, not significance; KeyFact: a 90% arc flags 1 genuine payment in 10 per card however regular, more with few payments — ### What α means
- History: payments 3 and 4 of the seven-payment card flagged 0 (arcs 17:36–21:19, 17:39–23:18); uniform times give rms R̄ = 1/√n (0.5 at 4, 0.27 at 14) → fake habit (κ̂ ≈ 1.2, 16-h arc); windows < 24 h put current hour at leading edge; rule ≥ 7 days AND ≥ 7 payments (count stated as a judgment: at 7, no-habit R̄ ≈ 0.38 → ~18-h arc; real habit ~1 in 5 outside a 90% arc fitted on 7 payments, measured on cards simulated with a fixed von Mises habit, not the course simulator), missing (not 0) below, payment count kept beside the flag; none of the seven-payment card's flags would be emitted (its example = arithmetic only); day-of-week arc θ = 2πd/7 — §How much history the arc needs
- Processor comparison (Ref example-dependent-cost; eight detectors, savings vs flagging nothing; previous lesson took 'aggregates roughly triple savings'): this lesson adds the periodic set: savings-per.svg, avg over 8 detectors raw 15% → raw+per 22%; raw+both aggregates 47% → +per 54%: about seven points in BOTH settings, so the aggregates do not absorb the hour (windows never hold the hour against the card's hours); relatively larger on raw (~+47%) than stacked (~+15%); exceptions: forest falls on raw 21→18 (tree holds 19), plain LR falls stacked 15→12; single split caveat. (Earlier draft's 'pays mainly on top of the aggregates / second-order signal' is withdrawn.) — §What an unusual hour is worth
- Simulator: times drawn around noon for all customers, leaked cards keep owner's times → periodic flag has nothing to find — same §
- Ratio vs level: ratio compares one payment; "has the card changed" is several payments, and euros need a scale — §The usual self: has the card just changed?
- Definition break-point analysis: last 24 payments incl. current (its amount is a field known at scoring; no later payment may enter), old 20 / new 4, pooled two-sample t_bp = (x̄_new − x̄_old)/(s_p√(1/20+1/4)), s_p² = (19s_old² + 3s_new²)/22, ranked not tested; why payments not days, 20, 4 — ### An old part, a new part, and a t-statistic
- Worked: old 20 amounts (mean 40.00, s 7.56), new 80,85,75,90 (mean 82.5, s 6.45), s_p 7.42, t 10.5 (breakpoint.svg); in-body exercise 38,44,300,41 → s_new 129.5, s_p 48.3, t 2.5 vs ratio 7.5: one outlier inflates the spread; ratio for a jump, break point for a level — same ###
- Cumulative spend ≈ straight line; jump = one large payment, slope change = new level; simulator leaked card slope €106 → €242/day (theory 7/3 ≈ 2.3) (cumspend.svg); yet t_bp does not catch it: slope change shows only over many days, at any one payment the 4-payment new part holds on average 4/3 inflated payments among ordinary ones (the €300 exercise case) — ### Spending as a line
- Christmas reversal: self-comparison flags everyone (illustrative card €315/wk sd €37 → €620, z ≈ 8; z-score defined inline) (peer.svg) — §The usual peer: when every card changes at once
- Peer group: k accounts most similar over a past reference period (business knowledge or standardised Euclidean profile); held fixed (else a thief-inflated card picks big spenders); k neither small nor large — ### Choosing the peers
- Definition t_peer = (y_n − x̄_{k,n})/s_{k,n}; 620 vs 600 ± 80 → 0.25; €900 → 3.75; y_n = spend this week so far incl. current payment; peers' stats from payments before the scored timestamp; KeyFact (boundary): peer denominator = between-card spread, wider than a card's own; card €250 ± 20 in peer group €320 ± 80 spends €400 → t_peer 1.0 vs z 7.5, so the self-comparison is still needed beside peers — ### The peer t-score
- Gap Δ_i = t_i − t_{i−1} = recency (Ref); counts lose order; bursts; cloned-phone gaps (gaps.svg): shortest genuine 1 h 22 min, fraud 53 s, 3½, 4½ min (+ 9 h 17, 34 h 37); standardised log-gap (ln Δ_i − m_Δ)/s_Δ over previous 20 payments; simulator null (median gap ~5½ h fraud vs ~6 h genuine); sequence hand-off — §The time since the previous payment
- Synthesis: value vs context (own hours, own previous 20, peers same week, own rhythm); cloned phone through all four (call arc μ̂ 13:41, 09:14–18:09; 01:45, 22:00 out, 11:23 in; log-gaps vs the five genuine gaps before the fraud starts at 01:45 (the 9 h 33 min gap before 11:23 comes after the fraud, excluded) mean 2.80 (~16 h) sd 1.79 → fraud gaps −3.9, −3.1, −3.0, shortest genuine −1.4); peers must come from the account's past, not the event; features = comparison in the card's own units of spread vs aggregates = reference; section opens with the question why the same value (01:45; €620 at Christmas) is ordinary for one card and unusual for another, and what these add over aggregates; KeyFact: contextual anomaly = a value unusual only relative to a context; the four features are its hand-built scores, card = context — §One pattern under four features: the card is the context

## Notation
- h hour, θ = 2πh/24 angle; C̄, S̄, R̄ (mean resultant length); μ̂ circular mean; μ, κ von Mises direction/concentration, κ̂ estimate; I0, I1 Bessel functions, A(κ) = I1/I0; α arc level, c arc half-width
- x values watched (amounts); x̄_old, x̄_new, s_old, s_new, s_p; t_bp break-point statistic (t_bp/t_peer subscripts avoid the timestamp t_i)
- y_n account statistic in period n; x_{1,n}..x_{k,n} peers; x̄_{k,n}, s_{k,n}; t_peer; k number of peers
- Δ_i gap; m_Δ, s_Δ mean/sd of log-gaps
- t_i timestamp (from transaction-aggregates)

## Running cases
- Opening card 22/23/2/3: arithmetic 12:30, μ̂ 00:30, R̄ 0.86, κ̂ 3.9, c 3.45 h, arc 21:03–03:57
- Seven-payment card (times from transaction-aggregates; 7th payment 3 Jan 00:00): numbers above. NOTE: the source's Table 6 is not reproducible (rows 5, 7 one hour off; intervals inconsistent with its stated scale); this course uses recomputed ML values
- Break-point toy: old list 32,45,38,51,29,40,36,47,55,33,41,28,44,39,50,35,42,31,46,38
- Peer illustrative weekly spends (own 290…420, 620; peers mean 600, sd 80 at Christmas)
- Simulator (one seeded run of the lab's re-implementation, 183 days, 1,793,343 payments, NO known-card removal; NOT the canonical handbook re-run nor transaction-aggregates' run (base 0.0014, ratio AP 0.61, known cards removed) — Exercise 5 says so and notes random-ranking AP = base rate, so the runs don't compare one to one): card 1141 leaked days 84–97; test week 129–135 genuine + scenario 3 = 68,860 payments, 176 frauds, base 0.0026; AP payment-level: ratio amt/30-day mean 0.71, t_bp 0.047, short gap 0.002; card-day: ratio 0.82, t_bp 0.06; peer detector (k = 20, profile days 99–128, daily spend) top-100 share compromised 0.06–0.15, mean 0.11 vs ~0.02 base; k = 5/100/1000 → 0.08/0.12/0.14
- Exercises: day-of-week Sat,Sun,Sun,Mon,Mon → arith Thursday (3.4), μ̂ Sunday ≈ 05:20 (6.22 d), R̄ 0.79; 06:00+18:00 R̄ = 0; 06:00+17:50 → 11:55, +18:10 → 00:05; tight-arc refutation (10-min / 60-min habits, 7/14/28/200 payments → 20/15/12/10% and 21/14/11/10% outside, half-width 14 vs true 16 min); ML derivation; leak exercise (payment 4 from 1–3: C̄ 0.546, S̄ −0.720, R̄ 0.903, μ̂ 20:29, κ̂ 5.5, c 2.83 h, honest arc 17:39–23:18 → 0, below the 7-payment minimum so deployed = missing; two-sided window arc 17:49–01:02 → 1; full group-by 18:02–01:51 → 1)

## Assumed
- transaction-aggregates: windows, earlier-rows rule (restated here as: the payment's own fields + the card's earlier payments), three table operations (leak), recency, seven-payment card, ratio feature from its exercises, processor comparison
- example-dependent-cost: savings, the published comparison
- financial-crime-typology: thief spends fast; cloned-phone call table
- canonical-datasets: simulator rules, scenario 3
- alert-budget-metrics: CP@100 ≈ 0.24 of the depth-2 tree (exercise)
- prerequisite statistics: mean, sd, two-sample t-statistic, z-score (defined inline)

## Left open
- Label-derived terminal fraud rate, point-in-time rule → point-in-time-features (conclusion)
- Contextual anomaly as a family; unsupervised detector precision (forward exercise) → anomaly-detection-framing
- Sequences of gaps / bursts learned directly → sequence-models-for-transactions
- Periodic flag in the lab pipeline → point-in-time-feature-lab
- Break-point as ancestor of stability tests → model-risk-monitoring (not mentioned in the lesson)
- Trading entropy not taught
