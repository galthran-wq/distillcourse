# Gaussian processes — research brief

Lesson: `gaussian-processes` (module: uncertainty, core, planned). NEW.
Goal: Derive GP regression from Bayesian linear regression via the kernel trick and fit hyperparameters by maximizing the marginal likelihood.

## Sources
- Rasmussen & Williams (GPML) Ch. 2 (weight-space §2.1 → function-space §2.2 equivalence; Definition 2.1; the predictive equations 2.22–2.26; Algorithm 2.1 — Cholesky, log marginal likelihood, O(n³); Figs 2.2/2.5 prior/posterior samples and hyperparameter effects), Ch. 4 (kernel catalogue: SE, Matérn with the ν-smoothness reading and Stein's anti-SE argument, periodic; Fig 4.1; kernel algebra Table 4.1), Ch. 5 (§5.4.1 marginal likelihood = data-fit + complexity + constant, eq 5.8; Fig 5.3's decomposition; the two-local-optima example via Murphy).
- Murphy §17.2 (the same material with the 7-point two-optima example Fig 17.9; weight/function-space proof §17.2.4; scaling §17.2.9 one paragraph; GP↔infinite-net Neal sentence — module 11 seam).
- Bishop §6.4 (cross-check; GP-classification via Laplace as a named-not-taught pointer).
- svm-dual-kernels (internal): kernels and Gram matrices — "the kernels return" is the lesson's opening seam.

## Key points
1. The derivation as inheritance: Bayesian linear regression with basis functions has predictive mean/variance depending on Φ only through ΦΦᵀ — inner products — so the kernel trick applies VERBATIM (the weight-space→function-space equivalence PROVED, following GPML §2.1/Murphy §17.2.4). A GP is module 10's machinery wearing module 4's trick.
2. The function-space definition (Def 2.1): any finite subset jointly Gaussian; the kernel as the covariance of function values; PRIOR SAMPLES drawn and shown for SE at three lengthscales (what the prior believes, made visible).
3. The predictive equations derived by Gaussian conditioning (the partitioned-covariance formula stated with a ★ derivation): mean k*ᵀ(K+σ²I)⁻¹y, variance k** − k*ᵀ(K+σ²I)⁻¹k*; read: mean = kernel-weighted combination of targets (the smoother family rejoined — kernel-smoothing's cousin with priced uncertainty); variance collapses at data, flares between/outside.
4. Algorithm 2.1 verbatim: Cholesky, never invert; log marginal likelihood from the same factorization; O(n³)/O(n²) costs stated; the lab's kernel.
5. Kernels as assumptions: SE (very smooth — Stein's objection noted honestly), Matérn-3/2 and 5/2 (the practical defaults), periodic; kernel algebra (sum/product) with one composed example — the Mauna Loa preview sentence; hyperparameters (lengthscale, signal, noise) read via the demo's task.
6. Marginal likelihood for hyperparameters: eq 5.8's three-term read (data-fit vs complexity vs constant); gradient optimization named; the TWO-LOCAL-OPTIMA example (7 points: wiggly-low-noise vs smooth-high-noise both locally optimal, only ~60% odds apart) — restarts required, Occam automatic but not omniscient.
7. The family portrait closing: ridge/KRR (same mean, no bars), SVR (sparse, no bars), GP (dense, full posterior) — one kernel-machine family, three objectives; and the honest scaling sentence (n ≈ 10⁴ ceiling; inducing points named only).

## Set pieces & gems
- The prior-to-posterior collapse film (GPML Fig 2.2's genre) — the module's signature visual, live in the demo.
- The two-optima marginal-likelihood example (Murphy Fig 17.9) — model selection's honest face.
- Neal's infinite-network limit — one sentence here, module 11's random-features lesson picks it up (thread discipline).
- Definition 2.1's phrasing ("a collection of random variables, any finite number of which…") — quote once.

## Pitfalls
- The conditioning formula for partitioned Gaussians: state it cleanly, derive in ★ (it is the one linear-algebra prerequisite that can sink readers).
- Never write K⁻¹ in code paths — Cholesky discipline stated (lab enforces).
- GP classification: name-and-point only (Laplace/EP — out of scope).
- Keep noise-free vs noisy observation cases distinct (σ²I's role).

## FIGURE PLAN
- draw: The inheritance diagram — Bayesian linear regression's predictive formulas with Φ-only-through-ΦΦᵀ highlighted, arrow to the kernelized forms; "module 4's trick × module 10's machinery". Formula-crosswalk Figure.
- draw: Prior samples — three panels of SE-GP draws at lengthscale 0.3/1/3 over the same axes (what the prior asserts). Computed; GPML Fig 2.2-left genre.
- draw: FigureSequence (4 frames): conditioning film — prior band; posterior after 1 point (band pinched); after 3; after 6 with one extrapolation flare. THE lesson figure; matches the demo.
- draw: The predictive equations dissected — mean and variance formulas with underbraces (weights on targets / prior variance minus information gained); the smoother-family kinship noted under the mean. Formula-dissection Figure.
- draw: The marginal-likelihood decomposition — log p(y) = data-fit + complexity + const as stacked bars across lengthscales, with the two-optima curve beside (two peaks labeled wiggly/smooth). Computed; GPML Fig 5.3 + Murphy Fig 17.9 ideas merged.
- draw: The kernel-machine family table as a figure — ridge/KRR, SVR, GP rows × {loss/objective, sparsity, uncertainty} — the course's kernel thread resolved. Single Figure.

## EXERCISE PLAN
1. Warm-up: compute the 3×3 SE kernel matrix for x = {0, 1, 3} at lengthscale 1 and verify PSD via eigenvalues.
2. Derivation skipped: derive the noise-free predictive mean/variance for ONE test point from the 2×2 partitioned-Gaussian conditioning formula (the scalar case carried fully).
3. Boundary probe: lengthscale → 0 (K → σ_f²I: the GP memorizes — mean spikes at data, prior everywhere else; the memorizer's LAST cameo) and lengthscale → ∞ (posterior collapses to a constant fit); what each says about the prior-as-assumption.
4. Claim to refute: "the GP's error bars widen off the data, so they are honest about extrapolation." Refute with a periodic truth fitted by an SE kernel: bars flare yet exclude the truth — bars are honest RELATIVE TO THE KERNEL; name the fix hierarchy (better kernel via evidence; assumption-free coverage via conformal — forward).
5. Mixed review (E3): show KRR's point prediction equals the GP posterior mean (identical algebra, module 3/4 composed); state what the GP adds for the same O(n³).
6. Research-shaped: reproduce the two-optima phenomenon — 7 points (given), grid the (lengthscale, noise) marginal likelihood, report both local optima and their log-evidence gap; plot both fits.
7. FORWARD (E7): fit an SE-GP to the first 30 years of the Mauna Loa CO₂ record (provided) and extrapolate 10 years — watch the seasonal cycle vanish from the forecast. Solution: the composite kernel that keeps it is the next lesson's artifact → Ref mauna-loa.

## ARC
- Inherits: Bayesian linear regression (the machinery), the kernel trick (module 4), smoothers (module 6 kinship), marginal likelihood (bayesian-linear-regression).
- Contributes: distributions over functions — the classical apex of model-based uncertainty — with kernels as legible assumptions and evidence as their tuner.
- Hands off: the machinery applied to the atmosphere → mauna-loa; the assumption-free counterpart → conformal-prediction; the infinite-network bridge → random-features (module 11).
- Spine step: "Predictions with guarantees…" (step 10).
