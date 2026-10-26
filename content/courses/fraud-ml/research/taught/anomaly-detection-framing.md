# anomaly-detection-framing — ledger

**Problem.** A new scheme (card testing: €1 payments from many stolen
numbers at one weak web shop) matches no labelled fraud, so the supervised
model scores it low: what does "unlike normal" mean, what data may "normal"
be learned from, and what does each scorer assume? Answer: three anomaly
types (point / contextual / collective), each movable into a single row by a
feature; three label regimes (supervised / semi-supervised = normal only /
unsupervised = assumes normal dominates); by-owner vs by-operation context;
one ball vs two (anomaly score = "unlike normal", not "like fraud"); each
detector family's one assumption is its failure condition (three planar
geometries); output a score cut at k.

## Explained
- Card testing defined (stolen batch, €1 at a weak web shop, then spend; Ref economics probe) — intro
- Obvious detector measured: amount > 99.9th percentile (€298) on the evaluation lab's simulator run (seed 0, 63 days), days 30–62 (324,045 payments, 2,769 frauds): flags 325, all fraud, all leaked-card ×5 payments = 1 fraud in 8; none of 1,776 terminal frauds (two-thirds), none of 179 amount-rule frauds (€220–298); December shoppers = extreme without fraud. KeyFact (one line: most fraud is not extreme in the column a global cut looks at) — §One unusual column does not find most fraud / ### The obvious detector, measured
- Anomaly (no conformity to a defined normal), outlier (deviates markedly from its sample), noise (unwanted, removed/accommodated), novelty (folded into normal); anomaly ≠ fraud, a reason to look — ### Anomaly, noise, novelty
- Point anomaly (€15,000 on a consumer card, far from the whole stream whoever paid; the only kind a global cut sees; the 325 leaked ×5 payments were this kind) — §Point and contextual anomalies: the card is the context / ### Unusual on its own (key image anomaly-types.svg; left panel = all cards, log scale, amber €15,000)
- Contextual anomaly (€420 on a card around €40: ordinary for the stream, ten times this card's habit); contextual vs behavioural attributes; €1,000 a week at Christmas vs July; behavioural-profiles' four features = contextual scores (Ref) — ### Unusual given a context
- Context turned into a column (ratio amount/30-day mean): a contextual anomaly becomes a point anomaly in feature space; row-by-row detector sees only context the columns hold — ### Context turned into a column
- Example: three simulator scenarios as anomalies (amount > 220 point; leaked card contextual/point in ratio space; compromised terminal = no label-free departure at all, only the label) — end of §Point and contextual
- Collective anomaly (related instances; needs relations); nine €1 payments from nine cards in four minutes; ECG figure (ecg-collective-anomaly.png, real trace, missing beat: every sample in range, the run is abnormal); merchant-window counts turn it into a column (Ref transaction-aggregates two-meanings-of-at-the-merchant); types describe where the departure lives before features; in-body exercise at section end: cloned phone classified (no point; contextual per call; burst = collective; log-gap = collective as column) — §Collective anomalies: suspicious only as a run
- Label regimes Definition (supervised / semi-supervised = normal-only labels, NOT classical-ml meaning / unsupervised = normal far more frequent); "genuine" = silence within δ (Ref); regimes.svg — §Where "normal" comes from: three label regimes
- Semi-supervised most applicable (unflagged last quarter), inherits hidden fraud; semi-supervised methods run unsupervised by fitting unlabelled sample — ### What each regime can find
- Rarity assumption breaks under bulk anomalies: illustrative 3,000 test attempts vs 500 genuine in one shop's night → unsupervised calls tests normal, genuine unusual; semi-supervised on previous month flags it. KeyFact (assumes normal dominates the fitted sample; flood point boxed only in the geometry KeyFact) — ### The rarity assumption, and where it breaks
- Activity monitoring; one global normal too wide (takeover week inside); by-owner (per-card profile, lookup per payment, catches stolen card/takeover; peers = by-owner with fixed peer reference) vs by-operation (per terminal/merchant/region, catches card testing, ATM burst); both contextual; superimposed fraud ↔ by-owner (Ref) — §Whose normal: by owner or by operation (owner-operation.svg, card C17 / web W42)
- Two fuzzy balls (spend/week × online share): card's past weeks unlabelled, assumed mostly normal; *one-ball rule* (boundary around them; unsupervised per card, semi-supervised if fitted to weeks known clean) flags holiday week (outside ≠ toward fraud); *two-ball rule* = supervised: second ball (other cards' fraud weeks) + discriminating line: fewer false alarms, assumes future fraud like past and like other accounts'; new scheme outside ball, normal side of line. Trade quantified via behavioural-profiles exercise (peer detector ≈ 11 compromised cards per 100 alerts, CP@100 0.11, vs 0.02 random) vs depth-2 tree test-week mean CP@100 ≈ 0.29 (0.286; 0.24 is day 129 only) (Ref alert-budget-metrics card-precision-at-k-the-team-calls-cards); caveat stated: peer detector on a different seeded run — supervised finds between two and three times as many. KeyFact: anomaly score = unlike normal, complement not replacement — §One fuzzy ball or two (balls-1..4 sequence + Task)
- Family table (nearest-neighbour / clustering / statistical / one-class boundary / subspace: assumption, fails where); prose after table gives the reason for NN's 'normal regions differ in density' (absolute distance, one scale: sparse normal looks anomalous, outlier beside dense region hidden; verified by exercise 6); planar experiments (a) one cloud: all work; (b) ring of clouds, central anomalies: one-class boundary and single Gaussian fail (mean at centre), NN, clustering, mixture work; (c) ring + dense central anomaly cloud: unlabelled NN/clustering call it normal, semi-supervised versions find it. KeyFact: dense anomaly cluster normal to unlabelled NN/cluster scores = organised fraud; card-testing night = panel (c); multimodal normal = (b); terminal frauds invisible to every family (grounded in the three-scenario example, not a table row) — §Every detector family assumes one thing about normal data (geometries.svg + Task)
- Score not label (budget k, Ref alert-budget-metrics CP@k); anomaly → investigator call → label → supervised model; adoption order rules → anomaly scores → supervised → network — §What the detector should output

## Notation
- No new symbols. δ (verification latency), k (budget) reused. r, s, k in exercise 4 (ring radius, cloud spread, neighbour count).

## Running cases
- Simulator (evaluation lab generator, seed 0, 63 days, 617,861 payments; days 30–62: 324,045 / 2,769 frauds = 179 amount rule + 1,776 terminal + 814 leaked): 99.9th pct €298, 325 flagged all leaked-card
- 12 label-free inputs, |z| > 3 on any (standardised over all payments, days 30–62): genuine 2.9%, amount rule 100%, leaked 68%, terminal 1.9% (exercise 5)
- kNN toy (seed 0): 500 pts N((0,0), 0.2), 50 pts N((8,0), 2), planted (1,0); 5th-neighbour distance 0.62, rank 51 of 551 (all 50 sparse above), sparse median 1.4, dense max 0.38 (exercise 6, forward)
- Card C17 / web shop W42 table; card testing night 3,000 vs 500 (illustrative)
- Two-habit card 08:00 + 23:00: R̄ 0.38, κ̂ 0.83, 90% arc ±9.0 h around 03:30 (18:30–12:30) (exercise 7)

## Assumed
- worldline-model-comparison (boosted tree, network) and scorecards-woe (points scorecard): supervised families learn labelled history
- financial-crime-typology: time-evolving and organised traits, superimposed fraud, cloned phone (a-telephone-account-call-by-call)
- economics-of-detection: €1 probe then spend (one-card-five-chances-to-act)
- canonical-datasets: three scenarios; cost-aware-evaluation-lab: its generator
- transaction-aggregates: terminal counts don't see scenario 2 (on-the-simulator-one-scenario-found-one-not), conditional merchant aggregates, ratio amount/30-day mean
- behavioural-profiles: four contextual features, peers, arc and flag, peer-detector exercise numbers
- fraud-detection-system: silence read as genuine, fast labels chosen by model (exercise 3)
- alert-budget-metrics: CP@k, budget k
- classical-ml: k-means, PCA, Gaussian MLE, mixture models (named only)

## Left open
- kNN distance, LOF (varying density; forward exercise 6), Mahalanobis → density-and-distance-scores
- Isolation and the cost argument → isolation-forest; one-class boundary, autoencoder/reconstruction (named "one-class boundary", "subspace") → one-class-and-reconstruction
- Expectation "AUC decent, precision poor" on real data → ulb-unsupervised-scores; lab → anomaly-scorers-lab
- Organised fraud / links between accounts → fraud-as-a-graph (module 6)
- Contamination of the normal sample by alert feedback (exercise 3) → alert-feedback-selection-bias
- Not taught: information-theoretic family, high-dimensional distance concentration, named methods (LOF, Isolation Forest, one-class SVM)
- Lab lessons scorecard-vs-gbm-lab etc. have no ledger entries; their lesson.mdx was read instead
