# From PaySim logs to a feature matrix — research brief (module 3 APPLICATION)

Lesson: `paysim-feature-matrix` (module: features, core, planned). NEW. Module-final application (L16): a real public artifact (the Kaggle PaySim log) read against the 2016 paper and turned into a feature matrix with the module's tools.
Goal: Analyze the PaySim mobile-money log as an artifact — what its generator replays, what its fraud label encodes — and construct a feature matrix whose signal survives that reading.

## Sources
- Lopez-Rojas et al. 2016 in full (the artifact's own account): aggregate replay from a per-day/hour file (count, mean, std per type); five types CASH-IN, CASH-OUT, DEBIT, PAYMENT, TRANSFER; Client agents with limits and age class; repetition probabilities from in/out degree; outputs (logfile with balance deltas for all parties, aggregate dump, parameter history with seed); 744 steps = one month; PS41840 ≈ 23M rows; Table 1 type mix (CASH-IN 4.5M @ 153,019; CASH-OUT 9.0M @ 155,989; TRANSFER 2.0M @ 630,810; PAYMENT 9.0M @ 10,793; DEBIT 0.14M @ 5,016); SSE-selected run; first 14 days busier (income); NO fraud injected (abstract, Sec. 6).
- HKU FITE7410 A1 answer Part I (the EDA the canon has students do): 6,362,620 rows, 11 attributes; 99.871% non-fraud vs 0.129%; CASH_OUT 5.4× DEBIT; fraud only in TRANSFER and CASH_OUT; fraud roughly uniform over steps while genuine traffic has a rhythm; step mod 24 trough at night; correlations (amount vs oldbalanceOrig/newbalanceOrig) shift between classes; no NA or negatives; fraud rows have no extreme outliers (fraudsters keep amounts small); feature engineering: step mod 24, numeric ids, per-account counts. HKU A1 code `hku-fite7410-a1code.txt` Part 1.
- Transaction-aggregates and behavioural-profiles (this module): the aggregates and the hour-of-day treatment to apply; point-in-time-features: the as-of discipline — PaySim has a step axis (hours) but no label delay.
- Canonical-datasets (module 1): the dataset card for PaySim; the "replays aggregates" reading.
- Handbook Ch3.3 for the feature recipe transplanted; Bahnsen Sec. 3.1 conditional aggregates by type.
- Jurgovsky Sec. 4.1: account-level sampling when rows of one account are not independent — applies to PaySim's nameOrig/nameDest.

## Key points
1. The artifact read first: what the generator does (replay of hour-level aggregates per type with agent limits) and does not (behavioural fraud); the Kaggle release's isFraud and isFlaggedFraud columns postdate the paper — their semantics come from the Kaggle description, which the course quotes as such (the mule-style "transfer then cash out" story is Kaggle's, not the paper's).
2. The EDA as evidence: fraud only in TRANSFER/CASH_OUT (a type gate reduces the problem to 2.6M rows), uniform over time steps (no daily rhythm — unlike genuine), balance-column arithmetic (newbalance ≠ oldbalance − amount for frauds — a generator artefact that is also the strongest feature), amounts without extremes.
3. The feature matrix built with the module's tools: type gate; hour-of-day on the circle (step mod 24 with the von Mises arc per account — mostly unavailable because most accounts appear once; say what fraction has ≥ 7 events); per-account windowed counts over nameOrig and nameDest (strictly earlier steps); destination-account in-degree over the last 24 steps (mule signature); balance deltas; the point-in-time discipline with step as the clock.
4. What survives and what is artefact: the balance-inconsistency feature is a generator bug that no real log has; the type gate is real; the uniform-over-time fraud is a generator choice; the account windows carry genuine signal where accounts repeat. The lesson labels each feature "real pattern" or "simulator artefact" with the reason.
5. Departure from the idealisation (L16): no delay, no feedback loop, a label that is a generator flag, accounts mostly single-use (so entity history is thin), no terminal/merchant entity — so the terminal-risk feature of module 3 has no analogue here; the module's as-of machinery reduces to "earlier steps only".
6. Evaluation sketch (using module 2's harness, not re-taught): a forward split on step, AP and P@k per step-day for a fixed logistic regression on (a) raw, (b) +windows, (c) +balance deltas — the lesson reports the lifts as computed on our run and names which lift is artefact.

## Set pieces & gems
- "Day 1 hour 15, 8,703 PAYMENT at mean 180,000" — the replay in one row.
- Type mix: TRANSFER 9% of rows at the largest mean amount.
- Fraud only in TRANSFER and CASH_OUT; uniform over steps (HKU Figs 4–5, 9).
- Balance arithmetic that fails for frauds — the artefact-as-feature.
- The lowest-SSE-of-several-seeds published run (selection bias in a benchmark).

## Pitfalls
- Do not cite the 2016 paper for how fraud was encoded — it wasn't; cite Kaggle's release notes as a secondary source and say so.
- Licence: PaySim on Kaggle is CC BY-SA 4.0 — the human settles shipping an extract (issue gate); the lesson needs only summaries.
- No model race here (module 4); a fixed LR as the yardstick only.

## FIGURE PLAN
- draw: Fraud count by transaction type as a bar chart with the two non-zero bars highlighted — the type gate. Computed on the Kaggle log (numbers from HKU's EDA confirmed on our run). Key image.
- draw: Transactions per step (all / genuine / fraud) as three small panels: genuine with its daily rhythm, fraud flat — the uniform-over-time artefact. Inspired by HKU Fig 5 (recreated from our run).
- source: paysima-fig1-4-orig-vs-synthetic — stem `paysim-replay-fidelity`; the reader must see the per-type COUNT/SUM/AVG/STD overlays (original red vs synthetic blue dashed) with the heavy first two weeks; float right beside the "what the generator replays" paragraph. (Already sourced in canonical-datasets; this lesson crops to one type's four panels — distinct crop, separate credit.)
- draw: The balance-arithmetic artefact: a `<FigureSequence>` (3 frames) — (1) a genuine TRANSFER row with old/new balances consistent, (2) a fraud row where the destination balance does not move, (3) the feature "balance delta minus amount" separating the two classes in a histogram.
- draw: The feature matrix as a labelled grid: raw columns → gate → windows over nameOrig/nameDest → circular hour → balance deltas, each column tagged "real" or "artefact". Component figure.
- draw: AP per step-day for raw / +windows / +balance under a fixed logistic regression as three lines over the forward split — computed on our run.

## EXERCISE PLAN
1. Warm-up: from HKU's counts (CASH_OUT 2,237,500; DEBIT 414,324; total 6,362,620) compute the share of rows the type gate keeps and the fraud rate inside the gate.
2. Boundary probe: an account that appears exactly once — every windowed aggregate is zero; compute the fraction of such accounts in the log (on our run) and state what feature value a cold account should carry (link point-in-time-features' fill discussion).
3. Claim to refute: "The balance-inconsistency feature should be kept because it has the highest importance." Refute on provenance: it is a generator artefact with no real-world analogue; name the test (does the pattern exist in the 2016 paper's generator? in a real ledger?) that decides.
4. Research-shaped: reproduce HKU's step-mod-24 histogram for genuine and fraud on the log and test whether fraud is uniform over hours (a chi-squared against uniform) — report the statistic.
5. Derivation: for a destination account receiving k transfers in a window, derive the in-degree feature's expected value under PaySim's repetition model (each client transacts with probability P per step) and show what in-degree a mule-style pattern would need to stand out.
6. FORWARD (E7): train a plain logistic regression and a depth-5 tree on the +windows matrix under the forward split and compare AP; then look at the tree's top split — the reader finds the artefact feature at the root and the question "which model class, and tuned how?" → lands on `scorecards-woe` / `gbm-model-selection`.
7. Mixed review (E3): apply the as-of rule (point-in-time-features) to the destination in-degree feature with step as the clock and state the one-step leak if the current row is counted.

## ARC
- Inherits: aggregates, profiles, point-in-time (this module); the dataset card (canonical-datasets); the harness (module 2).
- Contributes: the module cashed out on a public log — a feature matrix with every column's provenance stated.
- Hands off: the feature lab (next); the supervised comparison (module 4); the mule/graph reading of nameDest (fraud-as-a-graph).
- Spine step 3: features are context.

## APPLICATION (L16)
- Artifact: the Kaggle PaySim log (6.36M rows) read against Lopez-Rojas et al. 2016 and the Kaggle release notes.
- Module results used: windowed aggregates over strictly earlier rows and conditional aggregates by type (transaction-aggregates); circular hour-of-day and the no-profile case (behavioural-profiles); the as-of discipline with step as the clock and the cold-account fill (point-in-time-features); AP/P@k on a forward split (module 2).
- Departures from the idealisation: no label delay, no feedback loop, a generator fraud flag, thin entity histories, no merchant/terminal entity, a balance artefact that doubles as the strongest feature — each named, with the module claim it blocks.
