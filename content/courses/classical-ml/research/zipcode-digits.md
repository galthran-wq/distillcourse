# Handwritten ZIP codes: a first benchmark — research brief

Lesson: `zipcode-digits` (module: generalization, core, planned). NEW — module 1's APPLICATION lesson (L16).
Goal: Evaluate nearest-neighbor classification on the USPS digit benchmark and explain why invariance engineering beats raw distance.

## Sources
- ESL §13.3.2–13.3.3: k-NN on real image data; tangent distance — invariance manifolds approximated by tangent lines; Table 13.1 (1-NN Euclidean 5.5% → tangent distance 2.6%, beating a hand-engineered neural net's 4.9%); Figs 13.10–13.11 (the tangent-line construction — "extremely well-known didactic figure").
- ESL §11.7 (the ZIP-code arms race context: Net-1 80.0% → Net-5 98.4% on 320 training digits; the state-of-the-art table: tangent 1-NN 1.1%, degree-9 poly SVM 0.8%, LeNet-5 0.8%, boosted LeNet-4 0.7%).
- Murphy §20.4.2 (the rotated-'6' manifold: 360 rotations of one digit trace a circle in 3,648-D pixel space — the manifold hypothesis made visible).
- Bishop Fig 1.1 (same digits as PRML's opening example — context only).

## Key points (APPLICATION spec)
- The artifact: the USPS/ZIP-code digit benchmark — a really deployed problem (postal automation) that the module's simplest method handles.
- Module results used: k-NN as the classifier (knn-curse); Bayes error as the target floor (statistical-learning); bias–variance to read why invariant metrics win (bias-variance) — the invariance is bias deliberately injected (rotations of a '3' are declared equal), collapsing variance without adding model bias, because the injected assumption is TRUE for digits.
- Where the idealization departs: mail is not iid (writer styles cluster); segmentation errors precede classification; deployment needs a reject option (asymmetric cost of a misrouted letter) — decision theory from lesson 1 reappears with a reject region.
1. The benchmark stated with its numbers (keeper numbers: 5.5% → 2.6% → 0.7%; human error ≈ 2.5% on this task).
2. Why 256 dimensions doesn't kill 1-NN: digits occupy a low-dimensional manifold — the rotated-'6' circle as the demonstration; intrinsic vs ambient dimension.
3. Tangent distance worked: rotating a digit sweeps a curve in pixel space; approximate by its tangent line at the image; measure distance between tangent lines, not points. 7 invariances (rotation, scale, shear, thickness…) → 5.5%→2.6%.
4. Reading the ladder as this course's map: invariance (bias injection) beats capacity; later modules (SVM 0.8%, boosted ensembles 0.7%) will re-enter this same table — say so with forward Refs.

## Set pieces & gems
- Table 13.1's error ladder — reproduce as OUR table with the methods labeled by which course module owns them (a spine-in-miniature).
- The tangent-distance figure pair (ESL Fig 13.10–13.11) — recreate.
- Murphy's rotated-'6' PCA circle (Fig 20.29) — real image available.

## Pitfalls
- This is an application lesson, not a new-theory lesson: no new formal machinery beyond tangent lines; everything else is retrieval-plus-application of module 1.
- Don't drift into neural-net history; ESL §11.7 supplies context numbers only.
- Keep the reject-option treatment to one worked computation (threshold on the vote margin), not a full decision-theory section.

## FIGURE PLAN
- source: theelements-s1-usps-digits — stem `usps-digits`, reader must see multiple real digits per class with genuine stroke variety (this variability IS the problem statement); placement: centered at the top of the lesson.
- draw: The error ladder — horizontal bar chart of published USPS test errors (1-NN 5.5, tangent 2.6, human 2.5, SVM 0.8, LeNet 0.8, boosted 0.7) each tagged with the course module that explains it. Single Figure; the module's application dashboard.
- draw: FigureSequence (3 frames): rotating one '6' — (1) the digit at −15/0/+15°, (2) its trajectory as a curve in pixel space (schematic 3D), (3) the tangent line at 0° with distance-between-tangent-lines marked. Recreates ESL Fig 13.10 as a step-through.
- source: probabilisti-s4-usps-digit-manifold — stem `digit-manifold`, reader must see the real '6', the noise image, and the circular 2D PCA trace of its rotations; placement: float right beside the manifold section.
- draw: Reject option — vote-margin histogram on correct vs wrong 1-NN predictions with a threshold line; error-vs-reject-rate curve. Single Figure (computed on our own small USPS subset).

## EXERCISE PLAN
1. Warm-up: given confusion counts for a digit classifier, compute per-class error and the overall error.
2. Boundary probe: tangent distance with the rotation tangent at a rotationally symmetric image (a perfect '0' disc) — the tangent vector vanishes; what does the metric degenerate to, and why does the method survive?
3. Claim to refute: "tangent distance helps because it adds flexibility." Refute: it REMOVES hypotheses (declares orbits equivalent) — it is bias, and it helps because the bias is true; point to the bias-variance ledger.
4. Research-shaped: reproduce the 5.5% number's order: run 1-NN on a provided 1,000-digit USPS subsample and report test error with a binomial ±SE; state what would count as agreement with the published full-data number.
5. Mixed review (E3): using lesson 1's asymmetric-loss derivation, set the reject threshold when a misrouted letter costs 20× a manual sort; compute the operating point on the error-vs-reject curve.
6. FORWARD (E7): compute the 3-NN error on the subsample after projecting digits to their top 40 principal directions (procedure given as a black box). Solution: the projection is PCA; why it can help is module 8's subject → Ref pca.

## ARC
- Inherits: the whole of module 1 — risk/Bayes floor, the bias–variance ledger, k-NN and its curse.
- Contributes: the module cashed out on a deployed system; the demonstration that injecting TRUE bias is how classical ML beats the curse in practice.
- Hands off: methods that build the bias into a global functional form rather than a metric — the likelihood machinery of module 2. Also plants the benchmark table later modules re-enter.
- Spine step: "A finite sample can be fitted perfectly and teach nothing…" (step 1, closing move).
