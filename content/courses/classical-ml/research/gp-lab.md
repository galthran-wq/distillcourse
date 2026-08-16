# Lab: Gaussian process regression with conformal intervals — research brief

Lesson: `gp-lab` (module: uncertainty, type: lab, planned). NEW.
Goal: Implement GP regression via Cholesky factorization — predictive mean, variance, log marginal likelihood, hyperparameter selection — then wrap any model in split-conformal intervals and verify empirical coverage.

## ARC
- Inherits: the predictive equations and Algorithm 2.1 (gaussian-processes), marginal-likelihood selection (bayesian-linear-regression/gaussian-processes), the conformal recipe and its coverage theorem (conformal-prediction), the Mauna Loa artifact (mauna-loa — the lab's stretch data).
- Contributes: both uncertainty machines as verified code, and the measured comparison between model-based bands and assumption-free bands on held-out data — module 10's thesis, executed by the learner.
- Hands off: the course's final toolkit item; the epilogue's RFF discussion (random-features) will reference the learner's own kernel code when it approximates it.
- Spine step: "Predictions with guarantees…" (step 10, final item).

## LAB PLAN

Artifact: one notebook building `gp.py`-style tooling — SE kernel matrix, Cholesky-based predictive mean/variance, log marginal likelihood, grid hyperparameter selection, GP prior sampling — plus a split-conformal wrapper with an empirical-coverage checker; culminating in calibrated intervals on a held-out split (with a Mauna Loa stretch goal).

CANON GROUNDING: modelled on GPML's own exercises (dossier pedagogy: "mix formal proof tasks with small implementation tasks ('write a computer program to draw samples from…')") and on Algorithm 2.1, which the book presents explicitly as pseudocode "for a reader who will implement"; the conformal half is modelled on Angelopoulos & Bates' notebook-driven pedagogy (dossier: every section pairs a boxed algorithm with a runnable Python snippet and a linked Jupyter notebook — the paper is BUILT to be implemented). Departures: hyperparameter optimization is by grid (not gradients — autodiff is out of the course's scope); GP classification is omitted entirely; the conformal wrapper uses the plain residual score plus one scalar-uncertainty score (the GP's own σ(x)) rather than the paper's full score catalogue.

Datasets: (a) a 1-D synthetic function with heteroscedastic noise (generated in-notebook, seed fixed) for development; (b) the Mauna Loa monthly record through 2003 with the post-2003 record in private/ for the coverage metric (NOAA GML, public domain with credit line). Both small (< 50 KB).

Checkpoints (plan; lab-author may split/deepen):
1. `kernel-matrix` (exact): SE kernel K(X, X′) with lengthscale/signal variance, vectorized. Warm-up.
2. `prior-samples` (exact): draws from N(0, K + εI) via Cholesky at three lengthscales (deterministic under seed). Warm-up-grade. Consumes: 1.
3. `gp-posterior` (exact): Algorithm 2.1 — predictive mean and variance via Cholesky solves (asserts no `inv` call pattern by checking against a provided ill-conditioned case where naive inversion fails tolerance). Consumes: 1.
4. `log-marginal` (exact): log p(y|X, θ) from the same factorization; verified against a closed-form 2-point case. Consumes: 3.
5. `hyperparam-grid` (exact): select (lengthscale, noise) on a provided grid by marginal likelihood; asserts the known-generator neighborhood is chosen. Consumes: 4.
6. `conformal-quantile` (exact): the ⌈(n+1)(1−α)⌉/n calibration quantile from residual scores (off-by-one guarded by an exact small-n case). Independent.
7. `coverage-check` (exact): empirical coverage + average width of interval constructions on held-out data. Consumes: 6 (and 3 for GP bands).
8. `gp-vs-conformal` (review, optional): when do the GP's bands under-cover and why can conformal's not (mis-specification vs exchangeability) — rubric keyed to the module's thesis.
9. `coverage-target` (metric, optional, LAST): on the held-out (post-2003 detrended / synthetic) split at α = 0.1, land empirical coverage in [0.88, 0.92] with your conformalized model (reference: conformalized GP-σ score lands ≈ 0.90; the raw GP bands land ≈ 0.83 on the mis-specified case — the gap IS the lesson).

Known-wrong variants: forgetting the jitter εI (Cholesky failure on smooth kernels); solving with `inv(K)` (passes easy cases, fails the conditioned one); the quantile at n(1−α) instead of ⌈(n+1)(1−α)⌉/n; variance computed without subtracting the k*ᵀ(...)k* term; log-marginal missing the ½Σlog L_ii determinant term; conformal calibrated on training residuals (coverage inflated — the leakage ghost).

NOT blanked: data loading, plotting (bands, coverage strips), the grid definition, the seed fixture; the Mauna Loa composite-kernel configuration ships complete as the stretch model (building it is mauna-loa's exercise, not the lab's).

est_hours: 4.5. Progression: warm-ups (1, 2) → composing chain (3 → 4 → 5; 6 → 7) → one open metric last (9, optional) → review garnish (8). Required: 1, 3, 4, 5, 6, 7.
