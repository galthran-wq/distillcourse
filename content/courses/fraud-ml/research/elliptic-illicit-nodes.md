# Illicit-node classification on the Elliptic Bitcoin graph — research brief (module 6 APPLICATION)

Lesson: `elliptic-illicit-nodes` (module: graphs, core, planned). NEW. Module-final application (L16): a paper's central result read and (in part) reproduced.
Goal: Evaluate the Elliptic benchmark — random forest, MLP, GCN, Skip-GCN, EvolveGCN on 49 time steps — and explain the collapse of every model at the dark-market shutdown.

## Sources
- Weber et al. 2019 (primary, read in full): Sec. 1 (AML costs; 1.7B unbanked; remittance 7% vs SDG 3%; 1MDB $11B; Danske ~$200B); Sec. 1.1 (FinCEN May 2019 guidance; KYC / know your customer's customer; public pseudonymous graph); Sec. 2.1.1–2.1.3 dataset (203,769 nodes, 234,355 edges, 166 features = 94 local + 72 one-hop aggregates, 49 steps of ~2 weeks each as single connected components, no cross-step edges; 2% illicit, 21% licit, rest unlabelled; Fig. 1); Sec. 2.2 label heuristics (address reuse, consolidation lowers fees, exchanges licit, illicit favours fewer inputs; mixers ignored); Sec. 3 AML as anomaly detection, > 90% industry false positives; Sec. 3.1–3.3 methods; Sec. 4 experiments (70:30 temporal split, 34/15 steps; hyperparameters; Table 1 full grid of LR/RF/MLP × AF/LF/+NE with illicit P/R/F1 and micro-F1; Table 2 GCN vs EvolveGCN; findings: RF best; AF > LF; +NE helps LR and RF(LF); Skip-GCN > GCN; the dark-market shutdown at step 43 — all methods near-zero illicit F1, even an RF retrained each step with ground truth; robustness to emerging events as the open challenge); Sec. 5 discussion (RF vs GCN; hybrids); Sec. 6 Chronograph/UMAP; Sec. 7 summary.
- Altman Sec. 2 (Elliptic cited as prior work) and Sec. 4 (the same temporal-snapshot protocol; Table 2–3 HI→LI transfer: PNA 0.00 on LI-Small until fine-tuned to 27.38 — a drift-like transfer failure); Fig. 6 cross-bank sharing (private 4.9–8.7% vs shared 20.8–22.1% F1).
- Canonical-datasets brief (dataset card); graph-neural-networks (the ladder); guilt-by-association (RWR as a competing score); graph-features-and-communities (the 72 aggregates as egonet features).
- Dal Pozzolo 2014 Sec. 7.2.5 and Gama (forward): drift strategies; the collapse as the module-7 hook.
- Module 2: illicit-F1 vs micro-F1 is the accuracy trap; AP/P@k as the alternative the paper does not report.

## Key points
1. The artifact: dataset, split, features, models, metric — stated as the paper states them; micro-F1 0.93–0.98 for everyone beside illicit-F1 0.45–0.80: the accuracy trap in a graph.
2. The ladder with its attribution: RF(AF) 0.788 > MLP 0.653 > Skip-GCN 0.705? — order by F1: RF 0.788, Skip-GCN 0.705, EvolveGCN 0.720, MLP(AF+NE) 0.689, GCN 0.628, LR 0.53; aggregated features (AF) beat local (LF) for every model (the one-hop aggregates ARE a graph method); GCN embeddings concatenated (+NE) help the linear model most; Skip-GCN > GCN says the node's own features were informative; RF wins because the 72 hand aggregates already capture the neighbourhood and trees handle the heterogeneous-size loss better than one layer of mean aggregation.
3. The temporal split and why a random split would leak (edges within steps only; later steps share patterns); weighted cross-entropy 0.3/0.7 as the imbalance handling; what the paper does not report (AP, P@k) and what the lesson computes on a reproduction (RF and GCN on the public data: illicit-F1 per step plus AP per step with the module-2 harness).
4. Step 43: the dark-market shutdown — every model's illicit F1 falls to ~0 and the RF retrained with oracle labels does not recover: the labelled illicit population changed (a prior and concept shift), the features that identified it (volume, consolidation) stopped identifying the new illicit mix; the honest reading: no amount of graph modelling fixes a regime change; module 7's problem stated by the module-6 artifact.
5. What Elliptic cannot tell: labels from heuristics, 77% unlabelled, no feature names, no cross-step edges — the evaluation measures node classification inside snapshots, not laundering detection across time; AMLworld's complete labels and cross-bank finding (private 5–9% vs shared 21–22%) as the contrast.
6. The reproduction (the reader can run): RF(AF) and a 2-layer GCN (numpy from the lab, or a library) on the public data; per-step F1 curve; the lesson shows ours beside the paper's Fig. 2.

## Set pieces & gems
- Micro-F1 0.96–0.98 vs illicit-F1 0.45–0.80.
- RF 0.956 precision / 0.788 F1 beating the GCN's 0.628.
- Step 43: all curves to zero; even oracle retraining fails.
- Skip-GCN at zero weights = LR (the reason it beats GCN).
- 438M-node full Bitcoin graph vs 203k in the set.
- "Know your customer's customer" phone calls vs a public ledger.
- AMLworld's HI-trained PNA scoring 0.00 on LI-Small until fine-tuned.

## Pitfalls
- Keep the ladder's numbers exact; the illicit F1 is the headline, micro-F1 the trap.
- The dark-market explanation is the paper's one sentence; the mechanism (prior + concept shift) is the course's reading — label it as such.
- No GNN training details beyond what the lesson needs (graph-neural-networks has them).

## FIGURE PLAN
- source: antimoney-fig2-f1-dark-market — stem `elliptic-f1-collapse`; the reader must see the per-step illicit-F1 curves of RF, GCN, Skip-GCN and EvolveGCN over bars of illicit counts, all dropping together at step 43; centered at the heart of the lesson (the measured result; the collapse is the evidence). Key image. Crop to the figure, excluding the tables.
- draw: Illicit-F1 vs micro-F1 for the fourteen models of Table 1 as a paired dot plot — the trap in one picture. From Table 1.
- draw: The 94 local + 72 one-hop features as a labelled grid: local block, aggregate block (max/min/std/corr over neighbours), with a node and its neighbours drawn beside — the "AF are graph features" point.
- draw: `<FigureSequence>` (3 frames) of the temporal split: 49 snapshots as disconnected components, train 1–34 shaded, test 35–49, step 43 marked in the last frame.
- draw: Our reproduction: RF and GCN illicit-F1 per test step as two lines (computed on the public data) placed under the sourced figure for comparison.
- draw: AMLworld cross-bank F1 as three bars (private/private, private/shared, shared/shared) averaged — from Altman Fig. 6 / App. F; the "what Elliptic cannot test" contrast. (The realisticsyn-fig6 capture is available if a sourced version is preferred; a clean three-bar drawing suffices.)

## EXERCISE PLAN
1. Warm-up: from Table 1 compute the illicit-class precision and recall implied by RF(AF)'s F1 and verify 0.788 from 0.956 / 0.670.
2. Boundary probe: a model that predicts "licit" for every node — compute its micro-F1 on the test split (≈ 0.97) and its illicit-F1 (0); then the model that predicts "illicit" for all.
3. Claim to refute: "The GCN underperforms because the graph carries no information; the random forest ignores the graph and wins." Refute: AF are one-hop graph aggregates and AF > LF for every model; name the aggregation the RF consumed that the GCN's mean lost.
4. Research-shaped: reproduce RF(AF)'s per-step illicit F1 on the public data with a temporal split and locate the step at which it collapses; compare with the paper's Fig. 2.
5. Derivation the lesson skipped: show that if the illicit nodes after step 43 come from a new population whose feature distribution overlaps the licit one, no classifier trained before 43 can exceed the overlap-limited F1 — and that retraining with labels recovers only to the extent the new population separates (why the oracle RF fails too).
6. FORWARD (E7): compute, for each test step, a "day-distinguishability" score — train a classifier to tell step 42's nodes from step 43's and report its AUC — the reader measures the shift before the mechanism is named → lands on `concept-drift`'s day-distinguishability and detectors.
7. Mixed review (E3): run fraud-personalised RWR (guilt-by-association) from the labelled illicit nodes of steps 1–34 inside each test snapshot (no cross-step edges, so restart only from that snapshot's known illicit nodes) and compare its AP with the GCN's per step; state why RWR needs within-snapshot seeds here.

## ARC
- Inherits: the graph, features, propagation and the GCN (this module); the dataset card; the harness.
- Contributes: the module cashed out on a public graph with a paper's result reproduced — the ladder attributed, the trap named, and the collapse that the module cannot fix.
- Hands off: the lab (next); drift (module 7) as the problem the collapse poses; AMLworld's sharing finding to the capstone design.
- Spine step 6: the graph around the transaction.

## APPLICATION (L16)
- Artifact: Weber et al. 2019 and the public Elliptic dataset (Kaggle); the reproduction runs RF and a 2-layer GCN on it.
- Module results used: egonet aggregates as graph features (graph-features-and-communities), RWR as a competing score (guilt-by-association), the GCN layer and Skip-GCN's LR floor (graph-neural-networks), homophily as the propagation assumption (fraud-as-a-graph); module 2's metrics for what the paper leaves out.
- Departures from the idealisation: heuristic labels, 77% unlabelled, no cross-step edges, no feature names, F1 at a fixed 0.5 with no budget, a single run without error bars — and the step-43 regime change that no graph method survives.
