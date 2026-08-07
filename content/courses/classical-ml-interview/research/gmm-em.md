# Research brief: gmm-em (Gaussian mixtures and the EM algorithm)

status: planned
module: unsupervised
type: core
goal: Derive the EM updates for a Gaussian mixture and explain why each iteration increases the likelihood.

"Derive EM for a GMM" (Netflix, per Ace) is the heaviest unsupervised set
piece; the ELBO argument also pays forward to any variational-methods
question.

## Sources to consult

- Bishop **§9.2–9.4** — the canonical treatment: GMM density, latent z,
  responsibilities γ(z_nk) (Eq 9.13), M-step weighted updates for
  μ, Σ, π; Old Faithful EM run (Fig 9.8) mirroring the k-means panels;
  **§9.4 the general EM derivation**: ln p(X|θ) = L(q,θ) + KL(q‖p);
  E-step sets q = posterior (KL=0), M-step maximizes the bound —
  Figs 9.11–9.14's geometry. THE structure to reproduce.
- CS229 **ch. 11** — the Jensen/ELBO route (Eqs 11.7–11.10): ELBO =
  ΣQ(z)log[p(x,z)/Q(z)] ≤ log p(x), tight iff Q = posterior; E/M for the
  Gaussian mixture; Jensen's inequality with the chord picture (§11.2).
  Use this notation for the derivation; it is the interview standard.
- ESL **§8.5** — the two-component 1D worked example (Table 8.1's 20
  points; π̂ iterating 0.485 → 0.546; Algorithm 8.1) — the hand-workable
  numeric anchor; the σ²→0 likelihood-unboundedness warning.
- Dempster, Laird & Rubin 1977 — provenance + gems: the Q-function
  (Eq 2.17), monotonicity theorem (Lemma 1/Theorem 1 via Jensen);
  convergence rate = fraction of missing information; **Murray's
  discussion example** (saddle point at ρ=0, ~5% of runs hit the wrong
  stationary point) and **Sundberg's warning** (rate eigenvalue >0.98 for
  overlapping components — "EM crawls when components overlap").
- Huyen §8.1 (EM/GMM questions) and the k-means mouse-data gem (GMM
  succeeds where k-means fails — closing callback).

## Key points the lesson must cover

1. Flaw-first: k-means makes hard, equal-variance, spherical assignments;
   the mouse/elongated failures (recap + Ref). The fix: model clusters AS
   Gaussians with weights — a density p(x) = Σπ_k N(x|μ_k,Σ_k).
2. **Why direct MLE stalls**: the log of a sum — no closed form; and the
   chicken-and-egg (if we knew assignments, MLE is easy per class — spiral
   to lda-gda's per-class fits; if we knew parameters, assignments are
   Bayes' rule — spiral to naive-bayes). EM formalizes the alternation.
3. **E-step**: responsibilities γ_nk by Bayes' rule — computed numerically
   on a 5-point 1D example first (L4). **M-step**: weighted MLE
   (μ = weighted mean, Σ = weighted covariance, π = mean responsibility) —
   derived by differentiating the expected complete-data log-likelihood,
   not just stated.
4. **The monotonicity argument**: Jensen ⇒ ELBO ≤ log-likelihood; E-step
   makes it tight at current θ; M-step raises the ELBO ⇒ likelihood never
   decreases. The two-panel geometry (bound touching then lifting).
   State what monotone ≠: global optimum.
5. **k-means as a limit**: shared σ²I covariances, σ²→0 ⇒
   responsibilities harden to nearest-center; EM's E/M collapse to
   assign/update (short derivation).
6. **Pathologies**: singular spikes (one Gaussian collapsing on one point,
   likelihood → ∞ — remedies: variance floors / MAP-EM, spiral to
   mle-map); local optima (restarts; k-means init as standard practice);
   slow convergence on overlapping components (Sundberg); identifiability/
   label switching one sentence; choosing K: BIC/AIC one paragraph
   (contrast with the elbow — model-based clustering's advantage).

## Interview questions to work as exercises

- "Derive the E and M steps for a two-component GMM." (the set piece,
  guided)
- "Compute responsibilities for these 4 points given π, μ, σ." (numeric
  hand execution)
- "Prove EM never decreases the likelihood." (the Jensen/ELBO argument)
- "GMM vs k-means — three differences, and show one is a limit of the
  other." (E3: soft/hard, covariances, density model)
- "Your GMM run produced a component with variance 1e-12 and huge
  likelihood. What happened and what do you do?" (singularity; floor/MAP)
- "Why not fit a GMM by plain gradient ascent?" (you can — but constraints
  on Σ/π, and EM's monotone, closed-form steps; honest comparison)
- "Netflix: explain EM and a use case beyond GMMs." (missing data /
  latent-variable models generally; HMMs one-liner)

## Pitfalls / subtleties to flag

- Responsibilities are POSTERIORS, not memberships; reporting hard labels
  from a GMM throws away the model's actual output.
- The ELBO tightness after the E-step is at the CURRENT θ only; both
  steps are needed for the monotone sandwich — students collapse the
  argument.
- Likelihood can and does increase forever via singular spikes — monotone
  convergence is to a stationary point of a possibly unbounded surface;
  the MLE for unequal-variance GMMs technically does not exist without
  constraints. One precise Remark.
- Log-sum-exp for computing responsibilities in log space (underflow —
  spiral to naive-bayes' log-space discipline).
- EM is not Bayesian — it is MLE with latent variables; MAP-EM is the
  Bayesian-flavored variant. Naming discipline.

## FIGURE PLAN

1. **single `<Figure>`** — hard vs soft: the same boundary-zone points
   colored winner-take-all (k-means) vs blended by responsibility (GMM);
   one boundary point's γ = (0.55, 0.45) called out. One idea: the E-step's
   output type.
2. **`<FigureSequence>` (5 frames)** — EM run on 1D two-component data:
   (1) init curves; (2) E-step: per-point responsibility bars appear;
   (3) M-step: means/variances/weights move (arrows); (4) next E-step
   sharpens; (5) converged fit with the log-likelihood staircase inset.
   Delta = one half-step. Inspiration: Bishop Fig 9.8 / ESL Alg 8.1.
3. **`<FigureSequence>` (3 frames)** — the monotonicity geometry: (1)
   log-likelihood curve over θ with the ELBO surface below at θ_old;
   (2) E-step lifts the bound to TOUCH at θ_old; (3) M-step moves to the
   bound's max — likelihood necessarily ≥ before. Inspiration: Bishop
   Figs 9.11–9.14.
4. **single `<Figure>`** — Jensen's inequality: convex chord picture with
   log (concave) flipped orientation annotated — the memory aid for which
   way the ELBO inequality goes. Inspiration: CS229 §11.2.
5. **single `<Figure>`** — the σ²→0 limit: responsibility curve between
   two centers steepening through σ = 1, 0.3, 0.05 into a step function —
   k-means recovered. One idea: hard assignment as a limit.
6. **single `<Figure>`** — the singularity: one component's density spiking
   on a single point as σ→0 with likelihood tally exploding; the variance-
   floor fix beside it. Inspiration: ESL §8.5 warning.
7. **single `<Figure>`** — mouse-data callback: k-means verdict vs GMM
   verdict side by side — the module's flaw arc closed.
