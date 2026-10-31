# elliptic-illicit-nodes — ledger

NOTE (data): every "rerun" number below was computed by the writer on the
public Elliptic files (features, classes, edge list; the PyG mirror of the
Kaggle release) with scikit-learn 1.7; the lesson presents them as "the
rerun on the public files". Opening (course.yaml and line 1): "every
model's overall F1 sits between 0.92 and 0.99"; body range 0.920–0.986.

**Problem.** Three facts of the Elliptic benchmark (forest beats GCN;
micro-F1 0.92–0.99 for every model; every model collapses at step 43):
what in the data, features and split produces each? Answer: the 72
aggregates are a fixed, hand-built message-passing layer that a forest's
thresholds exploit with far higher precision (33 vs 156 false alerts);
micro-F1 = accuracy on a test set where calling everything licit scores
0.935; at step 43 the illicit count falls (239 → 24) and the remaining
illicit transactions sit among the licit in feature space (5-NN illicit
share 0.78 → 0.08), so the ranking itself collapses and retraining on
every label does not recover.

## Explained
- Test set = labelled nodes of steps 35–49: 16,670, 1,083 illicit (6.5%); training 3,462 of 29,894 (11.6%); unknown aggregated, never scored; per-step illicit counts 239 (step 42) down to 2 (step 46) (figure test-steps.svg; 914/169 split only in its alt) — §What is scored / ### The test set: labelled nodes only
- Split by time on a graph: random split inside a step puts training labels next to test nodes (a third of training illicit nodes have an illicit neighbour); Elliptic's disconnected steps make the time split clean, test graphs share no node/edge; no test node has a training node as neighbour (its neighbours are same-step test nodes, no label of that step fitted) (figure split.svg) — ### No edge crosses the split
- Time step is local column 1; training illicit share 1% (steps 1–6) vs ~16% (7–34), test 6.5%; Example: standardised LR (lbfgs, converged) coefficient 0.58 / sd 10.3 = +0.057 logit per step, ×2.3 odds at step 49; with step flags 4,382, recall 0.79, precision 0.20, F1 0.31; without 2,016, 0.71, 0.38, F1 0.50 → 0.18 is a within-rerun comparison. Published LR LF 0.457 NOT reproduced: unstandardised, lbfgs or liblinear (scikit-learn's two historical defaults), 0.32–0.36 with step, 0.48–0.51 without; "the published run differs in something it does not report". Rerun forest SET UP HERE: published configuration (50 trees, max_features 50, steps 1–34, cut 0.5), 3 seeds; all 166: 0.81–0.82 (seeds 0/1/2: 0.822/0.811/0.809), seed spread 0.013 (< 0.02); dropping the step moves each seed by ≤ 0.01 (0.825/0.807/0.815 without it); trees cannot extrapolate (thresholds ≤ 33.5, Ref exercise); drop the column — ### The time step is a column
- Section opens from graph-neural-networks' open question (what in the 166 columns lets the forest win), its general reason (thresholds vs logistic output) only Ref'd to reading-the-table, not restated
- The 72 aggregates = one round of gather/aggregate (max, min, std of each local quantity over one-hop neighbours back and forward, plus correlation coefficients over the same neighbours — which pairs undocumented, release does not describe columns exactly)/update with fixed aggregators and no learned weights (figure aggregates-layer.svg); so every model on 166 columns reads the graph: hand-built layer + thresholds vs learned layer stacked on it (GCN re-aggregates, two hops) + logistic output — ### The 72 aggregates are a fixed layer
- Counts from precision/recall: Example works the forest row ONCE before the table (726 found, 357 missed, 759 flagged, 33 false; F1 check 0.788); table then shows forest, Skip-GCN 675 / 831 / 156 (≈5× the reviews on licit for 51 fewer finds), GCN 554 / 682 / 128, EvolveGCN 676 / 795 / 119; plain GCN's recall loss Ref'd as dilution. Evidence the lead is precision from the aggregates: forest LF P 0.803 / R 0.611 → AF 0.956 / 0.670 (precision +15 points, recall +6); GNNs read same columns, precision 0.812–0.850. In-body exercise: forest LF counts 662 found / 824 flagged / 162 false (F1 0.694); aggregates +64 finds, −129 false alerts (four fifths fewer licit reviews) — ### The lead is precision
- Published AF − LF gains only Ref'd (forest 0.694 → 0.788, largest); rerun forest per seed AF 0.822/0.811/0.809, LF 0.779/0.758/0.766; paired gains 0.043/0.053/0.043, at least twice the seed spread (0.013 AF, 0.021 LF); direction reproduces, size does not (published 0.094 nearly twice rerun's largest 0.053); EvolveGCN − Skip-GCN = 0.015 is within one forest's seed-to-seed movement, table cannot rank them. No KeyFact — ### How sure the numbers are
- Micro-F1 = accuracy recalled by Ref (graph-neural-networks exercises), not re-derived; forest's counts reused from ### The lead is precision (Ref): 15,554 licit left alone, accuracy (726 + 15,554)/16,670 = 0.977 = printed micro; licit-left-alone fill the micro numerator, absent from illicit F1. No worked example or exercise here — §The overall F1 / ### Two averages of one confusion matrix
- All-licit predictor micro-F1 15,587/16,670 = 0.935 = the floor (figure confusion.svg placed here; caption: forest's detection, 726 − 33, worth 0.042 above flagging nothing); LR printed 0.920 and 0.931, below it; micro squeezes nine models into six hundredths around the floor, illicit F1 spreads 0.46–0.79 (figure micro-vs-illicit.svg); accuracy flaw Ref'd to economics; an investigation team working a ranked list needs precision at its budget per step or AP (Ref alert-budget), both F1s judge one unchosen cut (0.5); illicit F1 closer because it ignores unflagged licit — ### Doing nothing scores 0.935
- §Step 43 opens with the question where the fall comes from — model, threshold or data (each with its own repair: other/retrained model, lower cut, nothing fitted to old labels) — answering the opening's "stale, retraining would fix" reading; subsections answer in that order
- Model: per-step rerun forest (all 166, seed 0, pooled 0.822): illicit F1 0.78–0.96 on 35–42, then 0, 0.06, 0, 0.29, 0, 0, 0.03; pooled 0.91 (35–42) vs 0.03 (43–49); micro on step 43 = 1,344/1,370 = 0.981 (finds 0 of 24, flags 2 of 1,346 licit) — dashboard on overall F1 sees nothing (figure per-step.svg = key image). Published per-step chart (sourced figure elliptic-step43-collapse.png): seven models = three forests (all features, with GCN embeddings, retrained before every step on all labels to T−1 = oracle) and four graph networks incl. Skip-EvolveGCN (EvolveGCN + skip term, named here only); all fall; rerun retrained forest 0, 0.07, 0, 0.5, 0, 0.11, 0.16 → not architecture, not stale weights (EvolveGCN's weights change per step too) — ### The model: every architecture falls, retrained or not
- Threshold: step 43 AP 0.029 vs no-information 0.018 (24/1,370); top 50 hold 0 illicit (29–50 per step before) — ### The threshold: the ranking collapses too
- Data: count 239 → 24, share 11% → < 2% (dark market closed); 5-NN on the 93 local columns other than the step, each standardised over training nodes: illicit 35–42 0.78 illicit neighbours, illicit 43–49 0.08, licit 0.05/0.06 (figure neighbours.svg) — ### The data: fewer illicit transactions, and the rest look licit
- Why retraining fails: ~24 new-kind illicit vs > 4,000 old, forest votes by local majority; labels arrive after scoring (delay Ref) so oracle is best case; EvolveGCN's weights come from earlier steps. KeyFact (the ONLY statement of the ceiling): 169 of 1,083 beyond the break → recall ≤ 914/1,083 = 0.84; published recalls (none above 0.68) read against it; pooled table = steps 35–42 plus fixed penalty. Forward Ref concept-drift (frequency change vs which-transactions-are-illicit change, named in words only) — ### Why retraining on every label cannot catch up
- Section opens with the question what a bank can take from these numbers; departures: labels are attributions (Ref canonical), 77% unknown and completeness far from one (card dispute vs laundering, Ref reading grid), 3-hour snapshots every fortnight vs a bank's continuous decayed graph, loop missing (no delay, no entity, no budget, no spread) — §What the benchmark cannot tell a bank / ### Labels, unknowns and snapshots
- Exposure score and labelled-neighbour columns ruled out by the Elliptic split (test step has no labels, no edge to training); only label-free graph columns apply (aggregates, structural columns, GNN hidden vectors); a bank's graph has yesterday's confirmed frauds — ### The module's tools on this graph

## Notation
- No new symbols. Counts: TP/FP/FN in words ("found", "flagged", "false alerts"); "illicit F1" = F1 of the illicit class; "micro-F1" = micro-averaged F1 = accuracy.

## Running cases
- Test set 16,670 labelled (1,083 illicit, 15,587 licit); per-step illicit 35–49: 182, 33, 40, 111, 81, 112, 116, 239, 24, 24, 5, 2, 22, 36, 56; licit 1,159, 1,675, 458, 645, 1,102, 1,099, 1,016, 1,915, 1,346, 1,567, 1,216, 710, 824, 435, 420
- Training per-period illicit share: 1–6 1.1%, 7–20 16%, 21–34 15%; test 35–42 9.2%, 43–49 2.5%
- Published Table 1 (P/R/F1/micro): LR AF .404/.593/.481/.931; LR AF+NE .537/.528/.533/.945; LR LF .348/.668/.457/.920; LR LF+NE .518/.571/.543/.945; RF AF .956/.670/.788/.977; RF AF+NE .971/.675/.796/.978; RF LF .803/.611/.694/.966; RF LF+NE .878/.668/.759/.973; MLP AF .694/.617/.653/.962; MLP AF+NE .780/.617/.689/.967; MLP LF .637/.662/.649/.958; MLP LF+NE .682/.578/.626/.986; GCN .812/.512/.628/.961; Skip-GCN .812/.623/.705/.966; EvolveGCN .850/.624/.720/.968
- LR LF printed micro 0.920 is inconsistent with its P/R (recomputed accuracy 0.897) — exercise 1
- Rerun forest AF (seed 0) per step AUC/AP at step 43: 0.669 / 0.029; macro over steps 0.51 vs pooled 0.822
- Shift classifier AUCs (exercise): illicit 40–42 vs 43–45 0.986; licit same steps 0.967; illicit 37–39 vs 40–42 0.979; local column L4 correlates 0.58 with step
- Components (exercise): each step one WCC (step 43: 5,063 nodes); illicit-induced step 43: 24 nodes, 15 components, largest 4; step 42: 239, 193, largest 12; ~23% of illicit test nodes have an illicit neighbour (32% in training)
- Rerun forest per seed 0/1/2 (scikit-learn 1.7.2, 50 trees, max_features 50): AF 0.822/0.811/0.809; AF without step 0.825/0.807/0.815; LF 0.779/0.758/0.766; LF without step 0.769/0.782/0.774
- Exercises: LR LF row inconsistency diagnosis (counts 723/1,355/360, accuracy 0.897 vs printed 0.920; both below 0.935); step 46 (2 illicit, flags 5, 1 right: P 0.2, R 0.5, F1 0.286, micro 0.993); refutation "forest wins so no graph signal"; AF>LF reproduction design (per-seed values above); tree vs step column (thresholds ≤ 33.5, step 34 7% illicit); FORWARD shift-classifier with controls → concept-drift; mixed review union-find on step 43

## Assumed
- graph-neural-networks: the Elliptic comparison setup and table (the-elliptic-comparison, reading-the-table), micro-F1 = accuracy (exercises), unknown not licit (which-nodes-carry-a-loss), inductive (a-model-that-transfers-to-graphs-it-has-not-seen), message passing (one-layer-of-message-passing), set functions (functions-of-a-set-sum-mean-and-maximum)
- canonical-datasets: Elliptic contents, snapshots, labels by attribution, mixers, 2/21/77% (elliptic-a-graph-whose-labels-come-from-names, where-the-labels-came-from), label completeness (the-reading-grid)
- neighbourhood-and-centrality: recursive aggregates (recursive-aggregates-over-the-neighbours), structural columns (reading-the-table)
- communities-and-components: union-find, components useless on raw graph (connected-components-groups-defined-by-a-path)
- guilt-by-association: exposure score restarts at known fraud (restarting-at-the-known-fraud-the-exposure-score)
- delayed-labels-prequential: shuffled split (a-shuffled-split-tests-a-model-that-cannot-exist), label clock (the-label-clock)
- alert-budget-metrics: threshold metrics (a-threshold-metric-judges-a-cut-nobody-chose), P@k (precision-at-k-the-metric-cut-where-the-team-cuts), AP floor (what-a-ranking-with-no-information-scores), NCP undefined at γ = 0 (normalising-by-the-days-ceiling)
- economics-of-detection: accuracy prices every mistake the same
- fraud-as-a-graph: decay by age (choosing-the-decay-from-a-horizon)

## Left open
- What changed at step 43 in drift vocabulary (p(x), p(y), p(y|x); measuring shift without labels; baselines for a day-distinguishability AUC) → concept-drift (forward exercise and Ref)
- Building the tools in code and scoring an Elliptic subset → graph-propagation-lab
- Precision at an investigator budget per step / AP on Elliptic: named as the right metric, not computed beyond step 43's AP
- Not taught: Chronograph/UMAP visualisation, EvolveGCN internals, neural decision forests, the full Bitcoin size (438M nodes), industry >90% false-positive rates
