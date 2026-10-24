# transaction-aggregates — ledger

**Problem.** A raw record (card 4471, terminal 9023, EUR 184, Tuesday 14:07)
carries no fraud signal of its own: how to turn a card's and a terminal's
past into numbers beside the payment, computed only from earlier payments?
Answer: RFM summaries of the entity's history over several windows
(1/7/30 days), strictly earlier rows only, evaluated at each row's own
timestamp, plus the same windows conditioned on the payment's type /
country / merchant; identifiers group the history and then leave the
feature vector. On the simulator card windows lift leaked-card frauds in
the daily top 100 from 33% to 80% and leave compromised terminals at 1%
(that needs the label-derived terminal fraud rate, built in point-in-time-features); on
processor data aggregates roughly triple savings.

## Explained
- Identifiers are numerical but not ordered (terminal 9023 not "more" than 1983); names of entities with a history; a deep tree can carve an ID axis one terminal wide = lookup table of past labels, valid only while status lasts — §What the raw record can tell a model / ### An identifier names an entity
- Amount needs a reference point (EUR 184 weekly shop vs 10× usual); raw-field depth-2 tree (amount, card id, terminal id, time of day, weekday) still splits only on amount 218.67 = scenario 1 (recalled from canonical-datasets) — ### An amount needs a reference point
- Population-level categorical rate (Belgian issuer online: outside EU ≈5% fraud vs Belgium 0.05%, hundredfold) cannot say "unusual for this card" — same ###
- KeyFact: fraud = departure from an entity's habit; habit = statistic over its past — same §
- Lifetime mean fails (doesn't move for a card stolen yesterday); a habit summary must forget — §Summarising a card's past / ### Why not the lifetime average
- Definition: entity (card, customer, terminal, account); RFM aggregates (recency = time since previous payment; frequency = count in a period; monetary = sum/mean/min/max/most recent amount in a period); name from marketing — ### Three questions about a habit
- Probe-then-spend read as RFM on the economics lesson's stolen card (€1 probe then €200s; owner illustratively ~1/day ~€40): recency 2 h 08 vs ~24 h, 2 payments in 24 h vs 1, amount 5× 30-day mean, most recent amount €1 (figure probe.svg) — ### Probe, then spend
- Several windows: burst (card ~2/day, 6 payments in an hour: 1-day 8 vs 2, 7-day 20 vs 14, 30-day 66 vs 60) vs drift (4/day instead of 2 for 3 weeks: 1-day 4 within noise, 7-day 28 vs 14, 30-day 102 vs 60), illustrative (windows.svg); short = fast + noisy, long = stable + slow; common 1/7/30 days, another system 1,3,6,12,18,24,72,168 h, no agreed lengths; real-stream benchmark tree's 1-day count > 13.5 recalled — §How far back to look / ### A burst and a drift
- Window fill: simulator customer 0 (drawn €62.26, 2.18/day): 30-day count ramps over first 30 days then wanders around 65.4 (≈50–90); 30-day mean within a few euros of €62 (≈55–70); 1-day mean scatters from a few euros to >€120 (customer0.svg); training set should start one longest window after the data — ### A window has to fill before it means anything
- Definition: windowed aggregate N_w(i), S_w(i) over same-entity payments with t_i − w < t_j < t_i (strict), mean M_w = S/N (0 if empty); t_i = timestamp (finer than day index t); evaluated at each row's own t_i; no label enters, delay-block payments may — §Computing a window from earlier rows only / ### The rule
- POS = payment at a shop's card terminal, ATM = cash withdrawal (glossed in the Example)
- Worked Example: seven payments of one card (1–3 Jan, Luxembourg then Germany), 24 h window, row-by-row; FigureSequence window-1..4 (key image window-4); in-body exercise: eighth payment 3 Jan 09:10 POS France €300 → N24h 3, S24h €260, N7d 7 (sum €1,210) — ### Seven payments by hand
- Three pitfalls: whole-table group-by statistic (reads future); value computed once (as of table build date) joined to all rows; current payment inside its own window (pandas `rolling("7d")` covers (t−w, t], `closed="left"` excludes) = not a leak, but dilutes the reference (total for a rarely used card); benchmark's (handbook) card windows included the current row, this course's exclude it — ### Three ordinary table operations that break the rule
- Definition: conditional aggregate N^g_w(i), S^g_w(i) (same entity, same categorical value g as current payment, combinable: type AND country); France/Brazil motivation; conditional table on the seven payments; "zero beside a busy plain window" = active, but not like this (conditional.svg) — §Conditioning the window / ### The same window, a narrower question
- Two meanings of "at the merchant": fixed named merchant (one column per merchant, consistent, mostly zero) vs same merchant as current payment (one column, meaning changes per row = conditional aggregate with g = merchant, answers "been here before?") — ### Two meanings of "at the merchant"
- Grid growth: 8 windows × count/sum × (plain + each of 5 criteria, each glossed: country; transaction type = shop payment or cash withdrawal; entry mode = chip / magnetic stripe / contactless / details typed online; merchant code = category a merchant is registered under, e.g. grocery, air travel; merchant group = coarser grouping of those categories) = 96; criteria also combinable; one processor's model on those windows/criteria used 280 aggregated features in all; recomputation per payment within the scoring deadline caps it (→ real-time-scoring-architecture) — ### How fast the grid grows
- Terminal windows: counts 1/7/30 d give scale and would see a traffic burst; on the simulator a compromise doesn't change traffic, so counts don't see scenario 2; the terminal fraud rate needs labels → point-in-time-features — §The terminal's past, and the fifteen inputs
- Weekend flag, night flag (hour < 06:00) = calendar facts, same for every card (card-specific time of day → behavioural-profiles); 12 label-free numbers (amount + 2 flags + 6 card + 3 terminal counts) + 3 terminal fraud rates = benchmark's 15 inputs (feature-vector.svg); identifiers out of the vector (Ref delayed-labels card-id argument), aggregates are shared by cards with similar habits so learning transfers — same §
- Simulator measurement (random forest, 100 trees; train 25–31 Jul, test 8–14 Aug with delay block + known-card removal; test frauds 385 = 20 amount rule + 281 terminals + 84 leaked cards): table AP / CP@100 / share of each scenario's test frauds in daily top 100 payments — §What the aggregates buy / ### On the simulator: one scenario found, one not (scenarios.svg)
- Identifier as lookup table: raw record with ids lifts CP@100 0.06 → 0.16, all at compromised terminals (29%); memory valid because simulator terminals stay compromised 28 days; can never find terminals compromised after training; the legitimate version = terminal fraud rate (66%, CP 0.29) — ### The identifier as a lookup table
- Processor data (Ref example-dependent-cost published comparison): raw vs raw + card windows (1 h to a week) per detector, read off chart: tree 19→39, logistic 3→9, forest 21→45, tree+rule 16→41, logistic+rule 13→36, forest+rule 13→48, cost-sensitive logistic 18→59, cost-sensitive tree 15→60 (%); average increase ≈200% (≈3×); + conditional ≈250%; conditional instead of plain worse than plain; single split without delay block (savings.svg) — ### On a processor's real data
- KeyFact: aggregates add the signal of the fraud that changes the entity they summarise — end of §What the aggregates buy

## Notation
- i payment index; e_i its entity; t_i its timestamp (hours/days; distinct from the day index t of earlier lessons); Amt_i amount (from example-dependent-cost)
- w window length; N_w(i) count, S_w(i) sum, M_w(i) mean amount (0 if N = 0)
- g_i categorical value (type, country, merchant…); N^g_w(i), S^g_w(i) conditional count and sum
- Subscripts written as N_{24h}, S_{24h}, N_{7d}

## Running cases
- Seven-payment card (24 h window): times 1 Jan 18:20, 20:35, 22:30, 2 Jan 00:50, 19:18, 23:45, 3 Jan 00:00; type/country POS Lux, POS Lux, ATM Lux, POS Ger, POS Ger, POS Ger, POS Lux; amounts 250, 400, 250, 50, 100, 150, 10; (N, S) = (0,0), (1,250), (2,650), (3,900), (3,700), (2,150), (3,300); conditional on (type, country) = (0,0), (1,250), (0,0), (0,0), (1,50), (2,150), (0,0). NOTE: the published source table prints row 7's S as 400; the correct value (rows 4–6) is 300 — use 300.
- Eighth payment 3 Jan 09:10 POS France €300: N24h 3, S24h 260, N7d 7, S7d 1,210
- Simulator customer 0: drawn €62.26, 2.18/day (65.4 per 30 days); in the exact re-run 384 payments over 183 days (2.10/day), mean €61.45
- Simulator (exact re-run of the handbook generator: 1,754,155 payments; 978 / 9,099 / 4,604 frauds by scenario as printed): test week 8–14 Aug (days 129–135) after removal 58,264 payments / 385 frauds = 20 scenario-1 + 281 scenario-2 + 84 scenario-3 (by final scenario column). Reproduced handbook 15-feature depth-2 tree: AUC 0.763, AP 0.496, CP@100 0.240
- Random forest (100 trees, seed 0), AP / CP@100 / top-100 share S1-S2-S3: amount+weekend+night 0.13 / 0.06 / 100-1-33; raw record (amount, card id, terminal id, time of day, weekday) 0.23 / 0.16 / 100-29-33 (seeds 1–3: CP 0.15–0.16, S2 25–29%); + card windows (strict, no current row) 0.21 / 0.08 / 100-1-80; + terminal counts 0.20 / 0.08 / 100-1-75; + terminal fraud rate (delay 7) 0.65 / 0.29 / 100-66-73
- 150 of the 281 test scenario-2 frauds are at terminals with fraud in the training week (exercise only)
- Single-feature AP for scenario 3 vs genuine on the test week (base 0.0014, exercise only): 1-day count 0.001; 30-day mean 0.005; amount 0.34; amount ÷ 7-day mean 0.15; amount ÷ 30-day mean 0.61
- Exercises: new vs 31-day-dormant card (uncapped recency / card age / first-payment flag); current-row inclusion shifts mean by (a − M)/(N+1); two-pointer sweep O(mN) after O(N log N) sort; first-visit count via same-merchant conditional; forward: terminal 30-day fraud rate d/30 (all labels) vs max(0, d−7)/30 (labels to 7 days ago), 14 of 56 compromised terminals invisible

## Assumed
- fraud-detection-system: feature augmentation named (Ref where-a-learned-model-fits-after-the-answer)
- financial-crime-typology: thief spends fast / burst (card-fraud-a-label-that-does-arrive)
- economics-of-detection: stolen card with €1 probe then five €200 payments (one-card-five-chances-to-act)
- canonical-datasets: simulator rules and scenarios; depth-2 tree splitting at 218.67 (the-transaction-simulator…, three-scripted-frauds)
- alert-budget-metrics: CP@100, AP, ~2 cards/day noise line (what-each-disagreement-means)
- delayed-labels-prequential: delay block, its payments may enter history features (what-the-delay-block-is-and-is-not), train/delay/test split with known-card removal, card id out of the feature vector (why-the-cards-identity-stays-out-of-the-features)
- ulb-handbook-benchmark: fifteen inputs (fifteen-inputs-built-the-same-way), real tree's 1-day count > 13.5 (a-compromised-terminal-and-a-burst)
- example-dependent-cost: savings, per-payment rule, the published processor comparison (what-a-published-comparison-on-processor-data-shows)

## Left open
- Terminal fraud rate from labels shifted by the delay, as-of joins, train/serve parity → point-in-time-features (forward exercise computes d/30 vs max(0, d−7)/30)
- Conclusion hands off to point-in-time-features (by name, not 'next') and then to behavioural-profiles with its problem: a mean of clock times (23:00 and 01:00 → noon) fails; whether an hour or a peer comparison is usual for this card
- Card-specific time of day (circular mean, von Mises), peer groups, break points, inter-event time beyond recency → behavioural-profiles
- Per-payment recomputation latency of a large feature grid → real-time-scoring-architecture
- Window lengths chosen by prequential selection → gbm-model-selection (named only as "a guess to be tested on the data")
- Trading entropy, network features (APATE) not taught here
- Aggregation levels beyond the card (merchant category, country, currency, all merchants) and which earn their recomputation cost: not taught (★ section cut in revision); first-payment flags for linear models appear only in Exercise 1's solution
