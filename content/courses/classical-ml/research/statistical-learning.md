# The statistical learning problem — research brief

Lesson: `statistical-learning` (module: generalization, core, planned). NEW lesson — no old draft.
Goal: Explain why minimizing training error is not the same as learning, using risk, the Bayes predictor, and the memorizing counterexample.

This is the course opener (C3): it must be the easiest, most polished chapter, and it plants the course's one question — why does a finite sample guarantee anything about the future? — as a concrete, felt problem, not a slogan.

## Sources
- SSBD (Understanding Machine Learning) Ch. 1–2: the papaya story, formal setup (domain, labels, D, loss), the memorize predictor as the overfitting counterexample (§2.2.1), ERM with inductive bias (§2.3). This is the primary skeleton.
- ESL §2.3–2.4: least squares vs k-NN on the two-class mixture data (Figs 2.1–2.5); statistical decision theory — regression function E[Y|X=x] under squared loss, Bayes classifier under 0–1 loss (eqs 2.9–2.23).
- Murphy §1.2 (design matrix, empirical risk, epistemic vs aleatoric), §5.1 (Bayes decision theory), §1.2.4 (No Free Lunch, one sentence — the theorem itself is module 9's).
- Mohri Ch. 1 (learning scenarios vocabulary — keep light).

## Key points
1. The setup, minimally: sample (x_i, y_i) drawn iid from unknown D; a predictor f; a loss L; risk R(f) = E[L(f(X),Y)] vs empirical risk. Notation ledger: this lesson binds X, Y, D, L, R, R̂ for the whole course.
2. The ideal answer if D were known: the Bayes predictor. Derive both cases concretely first (per L4): squared loss → conditional mean (complete the one-line minimization over a constant at fixed x); 0–1 loss → most probable class. Bayes error as the floor.
3. The memorizer: f(x) = y_i if x equals some training x_i, else 0. On SSBD's papaya-flavored setup (uniform distribution, continuous features) it has R̂ = 0 and R = 1/2. Work this fully — it is the course's founding counterexample.
4. The fix: restrict the class before seeing data (ERM over H); the restriction IS the inductive bias, and choosing it well is the entire subject. One sentence of No Free Lunch flavor with forward Ref to module 9 (do not prove here).
5. ESL's contrast: linear regression of an indicator (rigid, stable) vs 1-NN (flexible, jagged) on the same 2D mixture data, with the Bayes boundary as ground truth. Names the two postures every later method interpolates between. Frame: "most of this course lives between these two pictures."

## Set pieces & gems
- SSBD papaya example (color/softness → tastiness) for the memorizer — keep the fruit, it is the canon's own example (SSBD §2.2.1, gray-square/blue-square figure).
- ESL mixture triptych: linear boundary (Fig 2.1), 15-NN (Fig 2.2), 1-NN (Fig 2.3), Bayes boundary (Fig 2.5) — recreate as a FigureSequence.
- Bloomberg-style dartboard NOT in canon — skip. Anscombe/Datasaurus (Murphy Fig 2.5–2.6) optional aside on "always plot" — probably cut (L12).

## Pitfalls
- Do not front-load measure theory or the word "hypothesis class" before the memorizer motivates it.
- Do not prove NFL here (module 9); do not define VC anything.
- The Bayes-predictor derivations must be genuinely elementary — this is lesson 1; every step visible, no "clearly".
- Avoid utility-value motivation ("ML is everywhere"); the intellectual need is the memorizer paradox.

## FIGURE PLAN
- draw: The learning pipeline as one strip — unknown D → sample → learner → f̂ → risk on a fresh draw; amber on the fresh draw (the object we care about, never observed). Single Figure. Inspired by Murphy §1.2's framing.
- draw: The memorizer — training points each carrying their label as spikes over a gray "predict 0 elsewhere" plane; R̂=0 tally vs R=1/2 tally side by side. Single Figure (comparison panels, voita rule 8). Inspired by SSBD §2.2.1's square diagram.
- draw: Bayes predictor under squared loss — at a fixed x, the conditional distribution of Y as a small density with its mean marked; the risk of predicting c as a parabola in c with minimum at E[Y|x]. Single Figure.
- draw: FigureSequence (3 frames): the same 2D two-class mixture data under (1) linear boundary, (2) 15-NN, (3) 1-NN with noise islands highlighted; final frame overlays the Bayes boundary dashed. Recreation of ESL Figs 2.1–2.3/2.5 with our own sampled data.
- draw: Train vs test error of k-NN as k varies on the mixture data (ESL Fig 2.4 idea) — the first appearance of the U-curve, unlabeled; the next lesson names its two causes.

## EXERCISE PLAN
1. Warm-up: compute empirical risk of a given 5-point predictor table under 0–1 and squared loss (one-time mechanics of the definitions).
2. Boundary probe: the Bayes classifier when p(y=1|x) = 1/2 exactly on a region of positive probability — show any tie-break attains the same risk, and compute the Bayes error there (degenerate case of the derivation).
3. Claim to refute: "if R̂(f) = 0 on a sample of one million points, then R(f) is small." Break it with the memorizer; name the missing ingredient (a class fixed before the data).
4. Derivation skipped: derive the Bayes predictor under asymmetric loss (false negative costs c times a false positive) — threshold at 1/(1+c), not 1/2.
5. Research-shaped: estimate the Bayes error of digit classification from the published USPS human-error rate (~2.5%) and the best machine results (≈0.7%); state what each number does and does not bound.
6. FORWARD (E7): for the 1-NN rule on the mixture data, compute test error over 5 resampled training sets at fixed test set; observe the error's spread. Solution: the spread is the variance term the next lesson isolates → Ref bias-variance.

## ARC
- Inherits: nothing (course opener).
- Contributes: the course question stated as a theorem-shaped fact — fitting (R̂=0) is achievable always and worth nothing by itself; risk is the object; the Bayes predictor is the unreachable target; restriction-before-data is the price of learning.
- Hands off: "every estimator pays for flexibility in variance" — the next lesson decomposes that price exactly.
- Spine step: "A finite sample can be fitted perfectly and teach nothing: risk, not training error, is the object of learning, and every estimator pays for flexibility in variance."
