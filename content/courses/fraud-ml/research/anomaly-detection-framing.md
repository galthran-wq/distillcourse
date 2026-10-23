# Anomaly types, label regimes and the assumption behind each detector — research brief

Lesson: `anomaly-detection-framing` (module: anomaly, core, planned). NEW. Framework-first lesson of the module (voita: general framework before methods; each method as a special case).
Goal: Classify anomalies as point, contextual or collective and detectors by label regime and key assumption, and predict from the assumption which detector fails on which data geometry.

## Sources
- Chandola, Banerjee, Kumar 2009 (primary): Sec. 1.1 definition (patterns that do not conform to a well-defined notion of normal; vs noise removal, noise accommodation, novelty detection); Sec. 1.2 challenges (boundary hard to define; adversaries adapt to look normal; normal drifts; domain-specific; labels scarce; noise resembles anomalies); Sec. 2.2 point / contextual (contextual vs behavioural attributes; temperature 35°F; EUR 1,000 a week at Christmas vs July) / collective (ECG, buffer-overflow sequence) — a point or collective anomaly becomes contextual once context is added; Sec. 2.3 supervised (imbalance, unrepresentative anomaly labels, artificial injection) / semi-supervised (normal only; most applicable) / unsupervised (rarity assumption, high false alarm rate otherwise); Sec. 2.4 scores vs labels (analyst picks top-k); Sec. 3.2 fraud as activity monitoring (Fawcett & Provost): by-owner vs by-operation, both contextual; Sec. 11 and Fig. 10: three 2-D datasets (tight cluster plus distant anomalies; ring of clusters with central anomalies; a tight anomalous cluster at the centre) and which family succeeds; dimensionality; labels and imbalance; distance quality; train vs test cost (classification/clustering/statistical costly to train, fast to test; NN/information-theoretic/spectral the reverse); anomalies not always rare (worm traffic); Sec. 12: each family's assumption as its applicability guide.
- Bolton & Hand 2002 Sec. 1–2: supervised needs trusted labels of both classes and finds only seen fraud; unsupervised models a normal baseline (profiling + outlier detection); Breiman's comment p.253: G.B.S. the cardholder — a fuzzy ball of normal weeks vs a second fuzzy ball of fraud weeks; supervised gives lower false alarms but assumes future fraud resembles past fraud and other accounts' fraud; the butterfly-star active-learning loop; the LA freeway analogy.
- Baesens Ch1 pp.19–22 (descriptive catches novel fraud, fooled by camouflage; predictive = silent alarms fraudsters cannot hide, needs labels, misses novel mechanisms; adoption order) and Ch3 Introduction (Grubbs' definition; challenges: defining the norm, fuzzy boundary, norm drift, fraudsters blend in, anomalies ≠ fraud so follow-up required; predictive models can explain anomalies found by descriptive ones).
- Handbook Ch7 Autoencoders intro: taxonomy (unsupervised reconstruction scoring; semi-supervised W1A/W1B/W2) — the module's end point, named here.
- Lucas & Jurgovsky Sec. 5.2: anomaly as event, subsequence or whole sequence (Chandola 2012) — collective anomalies in transaction streams.
- Dalvi 2004 Sec. 1 and Provost's comment: the adversary's camouflage as the reason "normal" is a moving target.

## Key points
1. The question the module answers: a supervised detector (module 4) ranks by resemblance to past labelled fraud; what ranks the fraud nobody has labelled? Answer shape: distance from normal — and "normal" must be defined by an assumption.
2. The taxonomy of anomalies with card examples: point (amount far above anyone's), contextual (the user, the season, the hour as context — the profiles of module 3 ARE contextual-anomaly scores), collective (a burst, a sequence; the ECG; Lucas's subsequence anomalies).
3. Label regimes and what each can find: supervised (both classes; only seen fraud); semi-supervised (normal only — the handbook's autoencoder trained on genuine); unsupervised (nothing; needs rarity — which fails when the fraud is bulk, e.g. a compromised terminal's day).
4. The assumption per family (Chandola's template): classification-based (a boundary separates normal); nearest-neighbour (normal is dense); clustering (normal belongs to a large cluster); statistical (normal is high-probability under a model); spectral (normal lies in a subspace); information-theoretic (anomalies disturb compressibility). Each assumption doubles as its failure condition.
5. The three thought experiments (Fig. 10) worked: tight cluster + far anomalies (everyone wins); ring of clusters with central anomalies (a one-class boundary around everything fails; density/clustering win); a tight anomalous cluster (density/clustering fail — they call it normal; only a labelled or a size-aware method sees it). The reader predicts before the reveal.
6. Breiman's two fuzzy balls: the unsupervised boundary around normal vs the supervised second ball; the point outside the normal ball but away from the fraud ball — what each regime does with it; why anomalies ≠ fraud and investigation follows.
7. Scores, not labels: the output is a ranking the budget cuts (module 2's metrics apply unchanged); the module's end-state preview: AE 0.836 / 0.18 / 0.217 — decent AUC, poor precision, and why (the assumption catches rare genuine too).

## Set pieces & gems
- EUR 1,000 a week in December vs July.
- Fig. 10's three datasets as a prediction exercise.
- Breiman's fuzzy balls; the butterfly-star loop.
- "Anomalies are not always rare" (worm traffic) — the terminal-compromise analogue.
- Chandola's "each family's assumption is a guide to when it fails".
- Baesens: descriptive can catch new fraud, predictive cannot hide from fraudsters ("silent alarms").

## Pitfalls
- No methods here beyond naming; the next three lessons compute them.
- Keep "contextual anomaly" tied back to module 3's profiles explicitly (they are the same object) — otherwise the course has two vocabularies for one thing.
- Do not invent a strawman misconception; the real one (anomaly = fraud) is documented in Baesens Ch3 and Chandola — refute that one.

## FIGURE PLAN
- draw: The three 2-D thought experiments as a `<FigureSequence>` (3 frames): dataset (a), (b), (c) with normal points as circles and anomalies as squares; a one-class boundary drawn in each frame so the reader sees where it fails. Inspired by Chandola Fig. 10 (recreated from the description). Key image.
- draw: Point / contextual / collective on one transaction timeline: a single huge amount (point), a normal amount at 03:00 for this user (contextual), a run of small amounts minutes apart (collective) — three annotations on one axis.
- source: anomalydetec-ecg-collective — stem `ecg-collective-anomaly`; the reader must see the regular heartbeat trace and the flat stretch where the anomaly is a sustained segment, not a spike; float right beside the collective-anomaly paragraph (a real measured trace; the visible fact is the shape).
- draw: Breiman's two fuzzy balls: a normal cloud with its boundary, a second fraud cloud, and a point outside both — with the supervised line and the unsupervised boundary drawn as two different objects. Inspired by Breiman's comment (text only).
- draw: Label regimes as three near-identical panels of the same data: both classes labelled / normal only labelled / nothing labelled, with what each regime can draw (a boundary, a hull, a density) — voita rule 8 comparison.
- draw: The assumption table as a figure: six families × (assumption, what it fails on, train cost, test cost) — a labelled grid from Chandola Sec. 11.

## EXERCISE PLAN
1. Warm-up: classify eight short transaction scenarios as point / contextual / collective, naming the context attribute where one applies.
2. Boundary probe: a compromised terminal where 40% of the day's transactions are fraud — which regime's assumption breaks (unsupervised rarity), what a density method reports about those rows, and which label regime recovers them.
3. Claim to refute: "An anomaly detector trained on genuine transactions only will flag every new fraud type, since new fraud is by definition unlike normal." Refute with camouflage (Dalvi, Provost) and the near-normal money-laundering quote (Akoglu Sec. 2.2.1 via module 6 — cite as forward); name the assumption (anomalies are far from normal) that fails.
4. Derivation the lesson skipped: show that for an unsupervised score under the rarity assumption, precision at k is bounded by (fraction of anomalies that are fraud) — i.e. the method's precision ceiling is set by how many rare genuine events exist, not by the detector; estimate that fraction for the simulator (rare genuine amounts vs frauds).
5. Research-shaped: build the three Fig. 10 datasets (2-D, seeded) and run a kNN-distance score and a one-class boundary (library) on each; report which succeeds on which — the prediction verified.
6. FORWARD (E7): on dataset (a) compute each point's distance to its 5th nearest neighbour and rank; then move the cluster's density so one half is twice as dense — the reader finds a normal point in the sparse half outranking the anomaly → lands on `density-and-distance-scores`' LOF.
7. Mixed review (E3): the von Mises arc feature (behavioural-profiles) — which anomaly type, which label regime, which assumption; and what module 2's CP@k does with a score that has no labels.

## ARC
- Inherits: profiles as contextual scores (behavioural-profiles); supervised detection's limit (module 4); superimposition (typology).
- Contributes: the module's framework — anomaly types, label regimes, assumption-per-family, and the three geometries that discriminate them.
- Hands off: distance/density scores (next), isolation, one-class and reconstruction, the ULB application; the "anomaly ≠ fraud" follow-up to score-to-action.
- Spine step 5: "Supervised models detect only the fraud they were shown; new fraud enters as a departure from normality scored by distance, isolation or reconstruction, which buys a decent ROC-AUC and a poor precision — a complement to the supervised score, not its replacement."
