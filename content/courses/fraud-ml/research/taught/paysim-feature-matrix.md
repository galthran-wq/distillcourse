# paysim-feature-matrix — ledger

**Problem.** The Kaggle PaySim log (6,362,620 rows, 8,213 fraud): which
columns replay the real service, which are generator bookkeeping or the
fraud script, and which feature matrix survives that reading? Answer:
senders have no past (only receivers do); fraud ignores the copied
calendar and clock; the script leaves four marks (type, emptied sender,
new receiver that never holds the money, next-row same-amount cash-out
from an unrelated account) plus an unintended fifth (a ledger that adds up
only for fraud); columns sorted by two tests (point-in-time, artefact);
matrix = TRANSFER/CASH_OUT gate, log amount, drain ratio, receiver as-of
history; hour kept but marked (carries a real contrast on real data);
after-balances, isFlaggedFraud, twin (reads same-step file order),
ids, step/day/traffic (only learn the empty days, never recur),
oldbalanceDest, sender windows dropped. Terminology: `isFraud` = "the
label", `isFlaggedFraud` = "the rule flag". A perfect score here is
a diagnosis. All numbers computed from the released CSV (fetched from a
Hugging Face mirror whose file matches the 493,534,783-byte release,
sha256 16910f90…eea6b).

## Explained
- Generator recalled in one clause (Ref canonical-datasets what-was-replayed), not re-taught; new: step = one simulated hour, repetitions file, initial-balance file; "the release" glossed = the Kaggle page's dataset description; column table (step 1–743, release says 744; C/M prefixes; balances before/after; isFraud; isFlaggedFraud); only step/type/amount checked, and only as hourly totals; key image generator.svg colours columns by author — §Which entity in the log has a past / ### What each column was written by
- Sender counts: 6,344,009 once, 9,283 twice, 15 thrice; 9,266 rows (≈1 in 700) have a sender seen at an earlier step; merchants 2,150,401, ~once each, PAYMENT only, balances always 0; 571,961 customer receivers, more than half receive ≥4 rows; 41% of TRANSFER/CASH_OUT rows go to a receiver with ≥7 earlier rows. KeyFact: sender has no past (windows empty for 99.85% of rows), receiver is the only entity with history; arc (≥7, Ref how-much-history-the-arc-needs), break point (last 24 payments, Ref an-old-part-a-new-part-and-a-t-statistic), peers (reference period, Ref choosing-the-peers) all undefined for senders — ### Senders appear once
- Calendar: 14 busy days (1–2, 6–17), 17 quiet (3–5, 18–31); 320 of 743 hours with no genuine row; copied from the real log (Ref fidelity overlay; no figure of its own beyond steps.svg); fraud 216–320/day, ~11/hour; daily fraud rate 0.05–0.09% busy, 29% day 3, 100% day 31; step/day/previous-hour traffic learn the empty days (steps.svg) — §The calendar: copied traffic, and a fraud script with no clock / ### Thirty-one days, seventeen of them nearly empty
- Hour = step mod 24 (assumption: midnight at step 0); genuine 967 rows in hour 4 vs 647,472 in hour 19; fraud 274–375 every hour; fraud rate ~22% at hours 4–5 vs 0.05% at 19 (×400); on real data the hour measures fraud hours vs customer hours, here only the copied genuine rhythm (hour.svg) — ### Hour of day
- Fraud only TRANSFER 4,097 / CASH_OUT 4,116; within-type rates 0.77% / 0.18%, 0.30% within the two; confirms canonical-datasets' exercise estimate (fraud-by-type.svg) — §The footprint of the fraud script / ### Two types, split evenly
- Footprint sequence (footprint-1..3): rows 1,118,023/1,118,024, step 130, 21,531.00; marks: amount = sender balance before in 8,034/8,213 fraud rows (97.8%; script moves at most 10M per row, so larger balances leave in several 10M rows; 145 of the other 179 are such transfers), 0 of 2,762,196 genuine T/C rows; fraud transfer receiver never received before 4,093/4,097 (99.9%) vs 12.5% genuine, receiver balance 0→0 in 99.3%; C878866926's next row (50 h later) starts at 0 again; 4,075 fraud transfers followed in the next row by a same-amount fraud CASH_OUT; cash-out sender is never the transfer's receiver; C820901487 appears in no row as a receiver (answers the Task); script's money not traceable through ids — ### One fraud, two rows
- L10b reversal of canonical-datasets#where-the-fraud-label-came-from (cancellation explains the balance separation; a cancelled row leaves the sender's balance unchanged): among fraud rows with nonzero starting balance, sender balance unchanged in exactly 16 = the isFlaggedFraud transfers, each followed by a 0-amount cash-out; cancellation explains those 32 rows only. The rest separate because the generator keeps clean books only for fraud agents: 47% of genuine T/C rows start from sender balance 0; before − amount = after holds 4% genuine transfers, 11% genuine cash-outs, 99.5% fraud. The datasets lesson's model is explicitly corrected — ### A ledger that balances only for fraud
- isFlaggedFraud: stated rule > 200,000; 409,110 transfers exceed it (2,740 fraud); 16 flagged = the 16 cancelled fraud transfers = rule layer's decision (no KeyFact; the marks are summed up only in the Conclusion) — ### The rule flag: sixteen rows
- Point-in-time test (Ref point-in-time definition) splits the release's blanket ban: newbalanceOrig/newbalanceDest = outcome, fail (and anything computed from them); oldbalanceOrg/oldbalanceDest = state before, pass; isFlaggedFraud fails; "earlier" = an earlier step: within a step rows stand in file order, not stated to be time order (the script writes transfer + cash-out consecutively), so a feature reading a same-step row fails; labels complete and instant (Ref label completeness), no δ shift needed — §Two tests for a column / ### The point-in-time test: the balance columns, and what counts as earlier
- Artefact test: who put the pattern there — real log via replay (behaviour copied), fraud script doing what fraud plausibly does (signal here, idea elsewhere, strength set by script), generator mechanics (artefact: clockless fraud, ledger only for some agents, links only in file order) — ### The artefact test
- Feature ladder (ladder.svg + table): T/C rows, train days 1–9 (1,226,487 rows, 2,437 frauds), test days 10–17 (1,389,335, 2,152, 0.15%), RF 200 trees, min leaf 5, all frauds + 5% genuine, 3 seeds; AP / P@100 per day (rows; ceiling 1 every test day): type+amount 0.013/0.23; +hour 0.069/0.35; +receiver history 0.13/0.44; +twin 0.53/0.88; +sender balance before & drain flag 0.999/1.00; after-balances+ledger alone 0.99/0.99; isFlaggedFraud alone 0.002/0.04; floor 0.0015; spread <0.04 except twin 0.05; ~36 of 2,233,384 genuine cash-outs share an amount with an earlier same-hour transfer; the twin rung fails point-in-time (same-step row) and is a diagnostic of what file order gives away; sender-balance rung points back to the footprint's emptied-account fact; after-balances reach 0.99 via the fraud-only ledger identity. KeyFact: perfect score = diagnosis, find the column — ### What each column buys
- Matrix (matrix.svg): kept = type gate (base 0.13% → 0.30%, removes 3.6M rows; a scope), log amount, drain ratio amount ÷ oldbalanceOrg (missing at 0; report with and without), receiver earlier count/sum/never-seen indicator (as-of, no window limit); kept & marked = hour only (passes test 1, reads the generator here, but carries fraudsters'-hours vs customers'-hours on real data); dropped = after-balances & derived, isFlaggedFraud, twin (CASH_OUT with same-amount TRANSFER earlier in same step; fails test 1), oldbalanceDest, ids as values (Ref lookup table), step/day/previous-hour traffic (knowable, but only separate the empty days; a step/day never recurs), sender windows/profiles. Rule for test-1-pass/generator-reading columns: keep marked if it carries signal on real data, else drop — §The feature matrix
- Example: matrix rows of the footprint pair (log amount 9.98, drain 1; transfer receiver count 0; cash-out receiver C70120540 count 2, sum 318,577.14 from steps 34 and 42; hour 10; no twin column, the cash-out is caught by drain ratio alone); reduced matrix (no hour, no drain) still flags the transfer by its new receiver, leaves the cash-out ordinary — same §
- As-of receiver counts in pandas (groupby nameDest, step; cumsum − self), same-step rows excluded by the point-in-time rule; whole-table groupby size = the aggregates lesson's broken operation — ### Building it as of each row
- Departures (L16, section opens directly on them): no delay/feedback, no adversary, no sender history, calendar with holes (daily base 0.05%–100%; evaluate on busy days), Kaggle file ≠ validated 2016 run; can test a pipeline, cannot test behaviour over time — §What this file can test, and what it cannot

## Notation
- No new symbols. γ_t, k reused from alert-budget-metrics (exercise 2); δ named only. Feature names: drain ratio, twin (dropped), receiver earlier count/sum, never-seen indicator, type gate; "the label" = isFraud, "the rule flag" = isFlaggedFraud.

## Running cases
- Kaggle PaySim file: 6,362,620 rows; types CASH_OUT 2,237,500 / PAYMENT 2,151,495 / CASH_IN 1,399,284 / TRANSFER 532,909 / DEBIT 41,432 (NOTE: a published course analysis prints DEBIT as 414,324 and "CASH_OUT 5.4× DEBIT"; the file says 41,432 and 54×)
- Fraud pair: rows 1,118,023 (TRANSFER, C2122951913 → C878866926) and 1,118,024 (CASH_OUT, C820901487 → C70120540), step 130, 21,531.00
- Receiver C923916676 (exercise 6): steps 277, 353, 395, 400 (fraud CASH_OUT 1,191,669.35), 401; as-of counts 0–4 vs whole-file 5
- Day facts: day 3 1,070 rows / 429 T/C / 310 fraud; day 10 392,945 / 171,830 / 282; day 31 272 rows all fraud; quiet-day T/C fraud rates 1%–9%
- Hours 0–8: 3,050 fraud (37%), 148,878 genuine (2.3% of 6,354,407) → recall 37%, precision 2.0%
- k-means (exercise 7, TRANSFER rows, signed log of amount / sender change / receiver change, standardised, k = 8, n_init 5, seed 0): purest cluster 4,159 rows, 4,014 fraud (96.5%) vs 0.77%; k = 3 or 5 → ~8,100 rows at 50%
- Exercise 5: rows with an earlier same-sender row 9,313 ignoring same-step ties (9,266 exact); Poisson argument r/2 earlier rows, r ≈ 14/month for an arc half the time; 1.0015 rows per sender

## Assumed
- canonical-datasets: PaySim replay, five types, agents, SSE-chosen 2016 run, quarter-scale Kaggle run with fraud agents, release's script sentence and balance-column ban (what-was-replayed, where-the-fraud-label-came-from, exercises), label completeness (the-reading-grid), fidelity overlay
- transaction-aggregates: windowed aggregate rule (the-rule), whole-table group-by pitfall, identifier as lookup table, customer 0 window fill
- behavioural-profiles: arc needs ≥7 payments (how-much-history-the-arc-needs), break point (24 payments; an-old-part-a-new-part-and-a-t-statistic), peer groups (reference period; choosing-the-peers)
- point-in-time-features: point-in-time definition, delayed terminal risk, as-of join, three-pipelines (exercise 6)
- alert-budget-metrics: AP, P@k per day, ceiling min(1, γ_t/k)
- classical-ml: random forest, k-means

## Left open
- Implementing the pipeline, finding a shipped leak → point-in-time-feature-lab (Conclusion hand-off only; the body no longer previews the lab)
- Licence of the Kaggle file for shipping in a lab (release states CC BY-SA 4.0; not discussed in the body) → point-in-time-feature-lab
- Cluster-as-detector (forward exercise 7) → anomaly-detection-framing; ulb-unsupervised-scores
- Delayed labels, drift, adversary on this file: not testable here (named as departures)
