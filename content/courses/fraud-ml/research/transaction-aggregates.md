# Entity-centric aggregation — research brief

Lesson: `transaction-aggregates` (module: features, core, planned). NEW.
Goal: Construct windowed count and amount aggregates over a cardholder's and a terminal's history, including a terminal risk that uses only labels known at scoring time.
Prerequisite from classical-ml (feature-engineering): encodings, target encoding's leakage trap, scaling for trees vs distance models — recalled by Ref.

## Sources
- Handbook Ch3.3 Baseline feature transformation (primary): why raw features are unusable (ML needs numerical AND ordered features; IDs numeric but categorical); the three transformations; TX_DURING_WEEKEND, TX_DURING_NIGHT; CUSTOMER_ID_NB_TX_{1,7,30}DAY_WINDOW and CUSTOMER_ID_AVG_AMOUNT_{1,7,30}DAY_WINDOW (RFM-style, Van Vlasselaer 2015); TERMINAL_ID_NB_TX_{1,7,30}DAY_WINDOW and TERMINAL_ID_RISK_{1,7,30}DAY_WINDOW; terminal risk = fraud count / tx count over a window shifted back by delay d = 7, computed as (delay+window rolling) minus (delay rolling), 0 if no tx; customer 0's 30-day rolling mean and count converge to its generating parameters (62.26, 2.18/day); 2018-05-01 a Monday; the 14-feature table. Local copy: research/texts/reproducible-Chapter_3_GettingStarted_BaselineFeatureTransformation.md.
- Bahnsen 2016 Sec. 3–3.1 (primary): raw features (Table 4, 15 attributes); Whitrow aggregation — group by card, then type/merchant group/country, count and sum over the last t_p hours (24/60/168 h, diminishing value of old information); Eqs. 6–8 (agg1) and 9–11 (agg2 with two extra conditions); Table 5 seven-row worked example (24 h, overall and by type+country: 0/0/0/0; 1/250/1/250; 2/650/0/0; 3/900/0/0; 3/700/1/50; 2/150/2/150; 3/400/0/0 — strictly earlier rows only); the 2013 grid t_p ∈ {1,3,6,12,18,24,72,168} h × five criteria = 280 features; Sec. 5 results +201% / +252%; Sec. 6 production latency warning.
- Baesens Ch2 "Types of data sources": RFM over transactional data; the probe-then-spend pattern as recent-low then recent-high; AML cash-transfer RFM; Ch5 pp.276–277 (APATE): RFM at merchant, merchant-category, global, country, currency levels; six-second rule.
- APATE Sec. 3.1: RFM by level × window (hour/day/week) + FirstPurchase flags = 60 variables; naming scheme LevelOfAggregation+RFMType+TimePeriod (GlobalRecencyHour); Table 2 fraud by region (ROW 5.36% vs Belgium 0.05%); 19 merchant categories collapsed to Low/Mid/High sensitivity; Sec. 4.2 variable importance (merchant-week monetary top; hour variables low; currency last — euro annuls it).
- Lucas & Jurgovsky Sec. 4.1–4.2: label vs one-hot vs likelihood (target) encoding vs embeddings; RFM consensus, no consensus on windows; tdelta; the Whitrow vs Jha/Bahnsen semantic difference (fixed named merchant vs same-as-current merchant).
- Dal Pozzolo 2014 Sec. 4 and 7.1: 90-day history aggregates replace the card id; weekly average expenditure over 3 months.
- Dal Pozzolo 2018 Sec. II-B and VI-A: profile features precomputed offline per cardholder; CARD ID removed (blocked cards leak).
- Handbook Ch7 FFNN Embeddings: embedding of dim k = FC layer on one-hot; terminal-id + weekday embeddings did NOT improve over aggregates on the simulator. Jurgovsky Sec. 4.2: d = ⌈log₂|C|⌉, time split into categorical parts.
- FraudFinder 02 lines 979–1235: SQL RANGE BETWEEN n PRECEDING AND CURRENT ROW (includes the current row — contrast with Bahnsen's strictly-earlier); terminal risk with the 7-day delay as nested window offsets.

## Key points
1. Why aggregates: the raw row has no history; the signal is deviation from the entity's own behaviour; RFM as the organising vocabulary (recency = time since last, frequency = count in window, monetary = sum/mean in window), at several aggregation levels.
2. The windowed aggregate defined precisely (Eqs. 6–8): the set S of the card's transactions with t_i − t_j ≤ t_p and t_j < t_i; count |S| and sum of amounts; conditional versions (same type, same country) — Eqs. 9–11. Worked: Table 5's seven rows computed on the page.
3. Semantics matter: Whitrow's "amount at merchant M in the last 3 days" (fixed merchant, mostly zero) vs Bahnsen's "at the same merchant as this transaction" — different features with the same name; the current row excluded (Bahnsen) vs included (FraudFinder SQL) — a one-row difference that leaks the current amount into its own feature.
4. Terminal risk with delay: fraud rate over [t − (d + w), t − d]; derivation as a difference of rolling sums; why d: labels for the last d days do not exist at scoring time; the convergence check on customer 0 as a unit test of the window code.
5. Which windows: 1/7/30 days (handbook), 1/3/6/12/18/24/72/168 h (Bahnsen 2013), hour/day/week (APATE), 90 days (Dal Pozzolo 2014); diminishing value of old information; the feature count explosion (280) and its production latency (Sec. 6).
6. Identifiers: card id dropped (blocked cards would let the model learn "this card is fraudulent" from the past); target/likelihood encoding is feature engineering with labels (classical-ml's leakage trap, now with a delay dimension); embeddings as the learned alternative that added nothing on the simulator — ★ starred section.
7. Evidence: +201% savings from agg1, +252% with agg2 — more than any model change in module 4.

## Set pieces & gems
- Table 5 (seven rows) computed by hand — the lab's exact-checkpoint fixture.
- The delay-shifted rolling difference (two rolling sums).
- Customer 0 converging to (62.26, 2.18/day).
- APATE Table 2: ROW 5.36% vs Belgium 0.05% — a region feature with a 100× spread.
- The euro-annuls-currency finding; hour variables low in RF importance.
- The embedding null result reported honestly.

## Pitfalls
- "RFM" in the AML literature means something slightly different (cash transfers); keep card semantics and note the AML variant.
- Do not re-teach target encoding; one sentence + Ref, then the delay-aware twist (the encoding must be computed as of the label clock).
- Keep the current-row inclusion question explicit — it is the lab's planted leak.

## FIGURE PLAN
- draw: `<FigureSequence>` (4 frames) of a card's timeline: (1) seven transactions on a time axis, (2) a 24-hour window drawn back from transaction 4, (3) the rows inside it counted and summed (strictly earlier), (4) the same with the "same country" condition — the count drops. Inspired by Bahnsen Table 5 (recreated as a timeline). Key image.
- draw: The 14-feature table as a labelled grid: raw columns on the left, three transformation arrows (calendar, customer windows, terminal windows) to the feature columns, colours by entity. Inspired by Handbook Ch3.3's encoding_variables diagram, recreated.
- draw: Terminal risk with delay as two overlapping windows on a time axis — [t − (d + w), t] and [t − d, t] — with the difference shaded as the usable window; frauds marked as known (solid) vs not yet known (hollow). Single figure.
- draw: Customer 0's rolling 30-day mean amount and count converging to 62.26 and 2.18 over the first 60 days — a two-line plot computed on our simulator run. Inspired by Handbook Ch3.3's sanity check.
- draw: Whitrow vs Bahnsen semantics: two near-identical panels for "amount at merchant X in the last 3 days" vs "amount at this transaction's merchant in the last 3 days" with the differing value highlighted (voita rule 8).
- draw: Savings by feature set as a house-style bar chart (raw, +agg1, +agg2, +per) — computed from Bahnsen's Fig. 7 medians (the source image is used in example-dependent-cost; here a clean recreation of the one number per set).

## EXERCISE PLAN
1. Warm-up: recompute Bahnsen's Table 5 for the seven transactions with a 48-hour window instead of 24 h.
2. Derivation the lesson skipped: show that the delay-shifted window count equals rolling_count(d + w) − rolling_count(d) exactly when both rolling sums are evaluated at the same t and are right-closed; find the off-by-one when one of them includes the current row.
3. Boundary probe: w = 1 day and d = 7 on a terminal with no transactions in [t − 8, t − 7] — the risk is 0 by convention; argue whether 0 or NaN (no evidence) is right for a tree and for a logistic regression, and what the handbook's +0.0001 variant does.
4. Claim to refute: "Including the current transaction in its own 1-day window is harmless because it adds the same constant to every row." Refute: the amount enters AVG_AMOUNT, so the feature encodes the target row's own amount scaled by 1/(n+1); show on two rows.
5. Research-shaped: from APATE Table 2 (shares and fraud rates by region) compute the lift of the ROW indicator and compare it with what the handbook's terminal risk achieves on scenario 2 of the simulator (compute on a run).
6. FORWARD (E7): compute a customer's mean transaction HOUR as an arithmetic mean over a provided week and compare it with the hours the customer actually transacts at — the reader finds a mean at an hour with no transactions → lands on `behavioural-profiles`' circular mean.
7. Mixed review (E3): the terminal-risk feature uses labels; place it in the prequential geometry (delayed-labels-prequential) and state at which fold boundary a d = 0 version would leak.

## ARC
- Inherits: the delay clock and validation geometry (module 2); classical-ml's encodings.
- Contributes: the aggregate vocabulary and its exact semantics — windows over strictly earlier rows, conditional aggregates, the delay-shifted terminal risk, identifier handling.
- Hands off: profiles on the circle and over peers (behavioural-profiles); the as-of join that serves these at scale (point-in-time-features); the feature pipeline lab; sequence models as learned aggregates (sequence-models-for-transactions).
- Spine step 3: "A raw transaction has no fraud signal; the signal is the deviation from the entity's own history, which means windowed aggregates over the cardholder and the terminal, computed from what was known at scoring time — including labels that had not yet arrived."
