# point-in-time-features — ledger

**Problem.** A terminal's fraud rate computed on the final training table
uses labels that did not exist when each payment was scored, and the serving
path computes features with other code: how to build each training row from
what was knowable at its moment, and serve the same values? Answer: define
point-in-time correctness (fields of the payment, earlier payments, labels
arrived by t_i); shift label-derived windows back by δ (delayed terminal
risk as the difference of two rolling sums, count kept beside it); treat any
statistic of labels (target encoding, out-of-fold included) the same way;
attach stored values with an as-of join over honest (readable-time) stamps; one time-keyed feature log written once and read two ways;
prove agreement with a row-by-row parity replay; features read at the row's
moment, labels at the training date, rows ≥ δ days old.

## Explained
- The naive terminal rate on final labels; terminal compromised 12 days ago, steady traffic: 0.40 final vs 0.17 delayed (5 of 30 fraud days); compromised 6 days ago reads 0 — §A feature built from labels: what the bank knew that morning / ### The obvious rate, and the labels it reads (FigureSequence shift-1..3, key image shift-3)
- Two leaks: future rows (aggregates' rule) vs labels of earlier rows decided after the row's moment; Definition: point-in-time correct feature (fields of i, fields of t_j < t_i, labels arrived by t_i); leak invisible in code (same group-by + rolling sum, only the window end differs) — ### Two ways a training row can know too much
- Definition: delayed terminal risk N^δ_w, F^δ_w over (t_i − δ − w, t_i − δ], R = F/N, 0 if empty; N^δ_w = aggregates' N_w (strictly earlier, (t_i − w, t_i)) moved back by δ; empty-window zero merges "no payments" with "no fraud", so the count goes beside the rate — §The delayed terminal risk: a window that ends δ days ago / ### The definition
- Two rolling sums: window ending δ ago = (last δ+w) − (last δ), counts and frauds separately; pandas snippet (rolling f"{delta+w}d" minus rolling f"{delta}d", fillna 0); worked Example day 21 (w = 7, δ = 7) → 39/69 = 0.565 vs final-label 1.0; in-body exercise day 17, w = 3 → 0/30 vs 1.0 — ### Two rolling sums
- Edges: pandas windows (t − L, t] include the current row in both sums, it cancels; current row's own label in a label window = the target; day-level clock (d − δ − 1) vs timestamp (δ×24 h) differ < 1 day, must match between paths; shifted window reads δ + w days back, so training starts 37 days after data for 30-day/7-day — ### Which edges are open
- Fresh compromises: c/30 vs max(0, c − 7)/30; first week reads 0 = a quarter of simulator compromised terminals; compromise of 28 days visible 21 days; real tree's 0.075 split was on the delayed feature (prose Ref to ulb-handbook-benchmark, no figure) — §What the delay costs, and what the leak costs / ### Fresh compromises fall out of sight
- Three-pipeline measurement (offline / deployed / honest) on a different seeded run from transaction-aggregates' table (140-day re-implementation; numbers not one-to-one with its 385 frauds / AP 0.65 / CP 0.29), table + fiction.svg; prose: +8 cards/day CP@100 = 72% of 78 fresh-compromise frauds ≈ 56/week ≈ 8/day (deployed ≈ 2/week), deployed AP 0.62 vs honest 0.74; KeyFact: no offline metric can show the leak (offline scores on the same leaky values); depth-2 tree fitted on the same two training tables: 7-day rate split 0.61 (final-label table) vs 0.35 (delayed table) — ### Three pipelines on one simulator run
- Target encoding recalled from classical-ml feature-engineering (category mean label, out-of-fold repair) in one clause; expectation broken: out-of-fold (and training-rows-only) encoding still reads labels of later payments and of earlier payments not yet arrived — removes own label, says nothing about time; rule: labels arrived by t_i; KeyFact: delayed terminal risk = point-in-time target encoding of terminal id = legitimate form of the identifier lookup table — §Every statistic of labels: target encoding
- Precomputed features stored with times because 30-day windows can't be recomputed in the deadline; obvious lookup reads the store's current (latest) value per card and attaches it to every row of that card (aggregates' pitfall 2 at the join; figure asof-1) — §Which value belongs to a row: the as-of join / ### Joining on the entity
- Definition: as-of join (largest τ ≤ t, missing if none); read-instances table (entity, timestamp, label); pandas merge_asof with by=; missing not 0; equality boundary must match whether a value at τ includes the event at τ (asof-1..2 sequence); the join is only as honest as the log's stamps: a value stamped τ must have been readable by serving at τ — ### The last value up to the row's timestamp
- Definition: training–serving skew; skew ≠ drift; published cloud pipeline: zero-filled minute placeholders in batch, None→0.0 in serving, 25 feature names hand-copied in 4 places — §One definition for training and serving / ### Two implementations of the same feature
- Example burst: card paid yesterday 18:00, 21:00, today 10:00/10:05/10:12; nightly job writes after midnight values stamped 10:00/10:05/10:12 → training 24 h counts 3/4/5 (current included; join correct, stamps wrong), 15-min 0/0/0; serving 2/2/2 (stale nightly) and 0/1/2; model ignores constant column, 24-h rule never fires — same ###
- Definition: feature store = time-keyed log, each value written once with the time it became readable by serving, as-of read for training, latest read for serving (two-reads.svg); readable stamps make training read 2 like serving (skew gone, staleness left); stream must update day windows, batch must not write placeholders; both clocks (labels nightly, minutes per event) in one log — ### One log, written once, read two ways
- Parity check: replay a past day through the serving path, join on payment, count disagreements per feature; distribution comparison cannot see it (skew-1..3 sequence, tallies 3/3, 2/3, agrees); KeyFact: only row replay shows training and serving paths are the same model; monitoring is separate — ### The parity check
- Training set on a date: features read at row timestamp, labels at training date; rows from last δ days left out (delay block from the pipeline's side); demo pipelines with instant labels can train to yesterday, a bank cannot; card id out; no feature from post-scoring events (reversal, dispute) — §Assembling a training set on a given day

## Notation
- δ verification latency (course symbol; the concept text's d is written δ here — d stays the test day of delayed-labels-prequential)
- w window length; t_i payment timestamp; e_i entity (terminal); y_j label
- N^δ_w(i), F^δ_w(i) shifted counts of payments and frauds; R^δ_w(i) delayed terminal risk
- τ log record time, v value (as-of join); c days since compromise (fresh-compromise formula)

## Running cases
- Shift figure terminal: compromised 12 days ago, steady traffic, 0.40 vs 0.17
- Two-sums terminal days 7–20 payments 9, 11, 10, 12, 8, 10, 9, 11, 10, 9, 12, 10, 8, 11, fraud from day 10: day 21 (w 7) 140/110 − 71/71 = 69/39 → 0.565; day 17 (w 3) 99/69 − 69/69 = 30/0 → 0
- Simulator (re-implementation of the generator from its stated rules, seed 0, 140 days — a different run from transaction-aggregates' exact re-run, not comparable one-to-one; 1,372,494 payments; known-card removal from the training-block start as in the evaluation lab): train 115–121 (68,453 / 631), test 129–135 raw 68,625 / 620 → 59,146 / 435 after removal; 276 terminal frauds, 78 at terminals compromised ≤ 7 days. RF 100 trees AP / CP@100 / fresh share: offline 0.92 / 0.41 / 72%; deployed 0.62 / 0.33 / 3%; honest 0.74 / 0.33 / 1%. Seeds 1, 2: offline 0.90 / 0.41, deployed 0.56 / 0.31 and 0.51 / 0.31, honest 0.68 / 0.31 and 0.66 / 0.31; fresh 102 and 94, offline 81–82%
- Burst card (parity example) as above
- Exercises: 40-day terminal 4/day, 1 fraud/day from day 20, day 40: 148/20 − 28/7 = 120/13 → 0.108 vs final 0.167; δ = 0 → own label; δ ≥ 28 → 0 on a current compromise; out-of-fold target encoding (5 random folds) refuted (compromise day 118, training 115–121; delayed rate on day 121 still 0); as-of join O((n+m) log(n+m)) sweep, ties decide ≤ vs <; three-pipeline reproduction; recalibration (β = 0.05, prior factor) cannot fix a ranking error from p(x|fraud) shift; forward: 40% same-day + exp(mean 20 d) → labelled 0.58 / 0.87 / 0.99 at 7 / 30 / 90 days

## Assumed
- transaction-aggregates: N_w, S_w, strict window, three broken table operations, window fill, terminal slot reserved, identifier as lookup table (66% vs 1%), forward exercise d/30 vs max(0, d−7)/30
- fraud-detection-system: verification latency δ, deadline (could-the-model-refuse-payments)
- delayed-labels-prequential: label clock d − δ − 1, delay block, known-card removal, card id out
- ulb-handbook-benchmark: real tree 30-day terminal risk > 0.075, 1-day count > 13.5
- alert-budget-metrics: CP@100, AP, two-cards-a-day noise line
- undersampling-calibration: correction monotone, prior factor cannot fix change in p(x|class) (exercise)
- classical-ml: random forest, data leakage in general; feature-engineering: target encoding, singleton = label, out-of-fold encoding

## Left open
- Labels that settle at different speeds, δ as a curve → label-maturation (forward exercise, conclusion)
- Streaming within the deadline, store architecture → real-time-scoring-architecture
- Distribution monitoring of live features → fraudfinder-monitoring-read; drift → concept-drift
- Implementing the pipeline and finding a shipped leak → point-in-time-feature-lab
- PaySim features → paysim-feature-matrix (conclusion hand-off)
- Logging served feature vectors for training ("log what you serve") not taught
