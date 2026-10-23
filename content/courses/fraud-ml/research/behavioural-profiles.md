# Behavioural profiles: periodic time, peer groups and break points — research brief

Lesson: `behavioural-profiles` (module: features, core, planned). NEW.
Goal: Construct profile-deviation features — a von Mises time-of-day flag, peer-group and break-point statistics, inter-event time — and explain why each is a contextual anomaly score.

## Sources
- Bahnsen 2016 Sec. 3.2 and Appendix A (primary for the periodic feature): the 2:00/3:00/22:00/23:00 → 12:30 trap (Fig. 1); von Mises (periodic normal) distribution Eqs. 12–14; periodic mean μ_vM and periodic σ from the resultant length (A.1–A.3); confidence interval at level α; binary feature "time within CI"; Table 6 (α = 0.9): arithmetic mean 16:19 vs periodic mean 21:07 for transaction 6; last transaction at 06:00 outside the CI 17:19–01:46 → False; use at least the previous 7 days; same idea for day-of-week; Fig. 2–3.
- Bolton & Hand 2002 Sec. 3 p.239: cumulative card spending remarkably linear in time, jumps or slope changes warrant investigation; "jam jarring"; Sec. 4 p.241: peer group analysis and break detection named for laundering.
- Baesens Ch3 pp.83–87: break-point analysis (intra-account; fixed window 20 old + 4 new; t-test of means; rank by t); peer-group analysis (inter-account; peers by business knowledge or distance; k not too small/large; t-score (y_n − mean of peers at n)/s; the cardiologist in San Francisco; Christmas spending not flagged because peers also spend); both find local, not global, anomalies. Ch2 pp.57–59 red flags (probe payment then large one; regular small payments).
- Chandola Sec. 2.2.2 and 10–10.1: contextual anomalies — contextual attributes (user, time) vs behavioural attributes; EUR 1,000 a week normal at Christmas, anomalous in July; the user as the context (Fawcett & Provost cell-phone fraud, Bolton & Hand peer group); reduction to point anomaly detection within a context; Sec. 7.2.1 histogram profiles and their blind spot (common values in a rare combination). Baesens Table 1.2 "Bandit" calls.
- Lucas & Jurgovsky Sec. 4.2: tdelta = t_x − t_{x−1} because frauds come in bursts (Eq. 5); trading entropy (Fu 2016); external data (holidays, country statistics).
- Jurgovsky Sec. 3.2 (Eq. 4 tdelta in minutes) and results: TDELTA lifts F2F AUCPR 0.138 → 0.170 for RF.
- Breiman's comment in Bolton & Hand (p.253): the cardholder G.B.S. — a fuzzy ball of normal weeks vs a second fuzzy ball of fraud weeks; unsupervised boundary vs supervised discrimination (preview for module 5).
- Provost's comment: value of profiling per customer; HNC patent feature engineering (one line).

## Key points
1. The circle: hours live on S¹; the arithmetic mean of {2, 3, 22, 23} is 12:30; the circular mean from the resultant vector (Σ sin, Σ cos) → atan2; the von Mises concentration κ from the resultant length R̄; the CI at level α; the feature is the indicator "inside the arc". Table 6 recomputed on the page.
2. Why a binary feature and not the angle: a tree can split on an angle only at fixed cuts; "inside this customer's arc" is per-entity and monotone in risk; needs ≥ 7 days of history (a cold customer gets no arc — the cold-start problem again).
3. Peer-group vs break-point: inter-account (compare to peers at the same time — seasonality cancels) vs intra-account (compare now to before — detects the regime change); both are t-statistics; both local; which fails where (a whole peer group compromised; a customer with a legitimate life change).
4. Inter-event time and bursts: tdelta; the cumulative-spend line and its slope; trading entropy as the dispersion of a customer's merchant categories; what each adds in Jurgovsky's ablation.
5. Contextual anomaly framing: context attributes (user, hour, season) vs behavioural attributes (amount, merchant); the profile is the normal model for the context; the same value is normal in one context and not in another — the hook to module 5's taxonomy.
6. ★ Starred: external data (holidays, country indicators, Ziegler's DBpedia embeddings) as context features; HNC's patent as the historical root of per-cardholder profiling.

## Set pieces & gems
- The 12:30 trap (Bahnsen Fig. 1) — the lesson's opening computation and the demo's task.
- Table 6: 16:19 vs 21:07; 06:00 outside 17:19–01:46.
- The cardiologist in San Francisco; Christmas not flagged.
- Breiman's fuzzy balls.
- Bolton & Hand's linear cumulative spend.

## Pitfalls
- Keep von Mises notation consistent with the paper's appendix (μ, κ, R̄) and give the κ-from-R̄ approximation explicitly (the paper's σ formula) rather than an inverse-Bessel aside.
- Peer-group analysis needs peers defined without labels; say how (business segment or k-NN on static attributes), and that it is unsupervised — module 5 revisits.
- Do not bring in HMM features here (module 7).

## FIGURE PLAN
- draw: A 24-hour clock with four transaction dots at 02/03/22/23, the arithmetic-mean hand at 12:30 (struck) and the circular-mean hand at ~00:30 with the resultant vector drawn inside the circle. Single figure; key image. Inspired by Bahnsen Fig. 1 (recreated).
- draw: `<FigureSequence>` (3 frames): unit vectors of the four times, their sum (the resultant), the von Mises arc at 90% shaded around the mean with the 06:00 test transaction outside it (Table 6's case). Inspired by Figs. 2–3.
- draw: Peer-group vs break-point as two near-identical panels of a spend series: left, the account's line against the peer-mean band at each date (Christmas bump inside the band); right, the same account split into old/new windows with the two means and the t-statistic. Inspired by Baesens Figs 3.4–3.5 (recreated).
- draw: Cumulative spend over time for one card with a slope change at the compromise date; the inter-event-time series beneath it collapsing to minutes during the burst. Computed on a simulator card with scenario 3.
- draw: Contextual anomaly: the same EUR 1,000 weekly amount placed at December (inside the seasonal band) and July (outside) — one panel with the band. Inspired by Chandola Sec. 2.2.2 (text example).
- draw: Jurgovsky's RF AUCPR for BASE / TDELTA / AGG on F2F and ECOM as paired bars — tdelta's contribution isolated. From Tables 4–5.

## EXERCISE PLAN
1. Warm-up: compute the circular mean and R̄ for times {01:00, 02:00, 23:00, 00:30} and compare with the arithmetic mean.
2. Derivation the lesson skipped: derive the circular mean as the maximum-likelihood μ of the von Mises density (differentiate the log-likelihood in μ) and show R̄ → 1 as κ → ∞.
3. Boundary probe: times spread uniformly around the clock — R̄ → 0, κ → 0, the arc covers the circle; what the feature reports and why a customer with no routine should not be flagged for an unusual hour (and what the feature should return: "no profile").
4. Claim to refute: "Peer-group analysis will flag a compromised card whose fraud happens during the Christmas rush, since the transactions are unusual for that customer." Refute: inter-account comparison cancels what peers also do; name which method (break-point) sees it and the condition it needs.
5. Research-shaped: on the simulator, build the per-customer 90% arc from days 1–30 and measure the fraction of scenario-3 frauds (×5 amounts, days 31–45) that fall outside the arc vs the fraction of genuine transactions — the lift of a time-only feature on fraud that has no time signature (expected: none) and the reason.
6. FORWARD (E7): compute for one customer the t-statistic of break-point analysis over a sliding window as the window advances through a compromise — the reader builds a change statistic over time and notices it needs a threshold with a false-alarm rate → lands on `concept-drift`'s CUSUM/Page–Hinkley.
7. Mixed review (E3): add the inside-the-arc flag to the aggregates of transaction-aggregates and recompute Bahnsen's savings delta (+13% claimed); state why the gain needs the aggregates present (Fig. 6 reading).

## ARC
- Inherits: windowed aggregates (transaction-aggregates); the context notion from the typology (superimposition).
- Contributes: profile-deviation features on the circle, across peers and across time; the contextual-anomaly reading of all of them.
- Hands off: the as-of join of profile tables (point-in-time-features); anomaly taxonomy and peer-group as an unsupervised detector (anomaly-detection-framing); change statistics (concept-drift); sequences as learned profiles (sequence-models-for-transactions).
- Spine step 3: features are context.
