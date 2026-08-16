# Random features: kernels meet networks — research brief

Lesson: `random-features` (module: epilogue, core, planned). NEW.
Goal: Derive random Fourier features from Bochner's theorem and explain how they bridge kernel machines, double descent, and infinite-width networks.

## Sources
- Rahimi & Recht 2007 (primary): Bochner's theorem (Thm 1); the construction z(x) = √(2/D)·cos(wᵀx+b), w ~ p(w) — an unbiased kernel estimate (the one-line identity); Claim 1 (uniform approximation, D = O(d/ε² log…)); Algorithm 1; the kernel table (Gaussian/Laplacian/Cauchy ↔ their spectral densities — Fig 1 captured); Table 1 benchmarks (Forest Cover: libSVM 44 h vs 25 min at equal error — captured); the O(Nd)→O(D+d) test-cost arithmetic.
- Belkin et al. 2019 (internal): RFF as the double-descent laboratory — the same features at D below/at/above n.
- GPML §4.2.1 (spectral densities of stationary kernels — the Bochner background), Murphy §17.2.8 (infinite-width nets are GPs — Neal; NTK named), Bishop §6.4.7 (the infinite-hidden-unit limit).
- ESL §11 (one-hidden-layer nets' anatomy — for the "this IS a network" reading).

## Key points
1. The bridge stated as an identity: a random projection + cosine IS one hidden unit; E_w[cos(wᵀx+b)cos(wᵀx′+b)] = k(x−x′) when w ~ the kernel's spectral density — derive the identity (two lines of trig + Bochner). A linear model on D such features is (a) a Monte Carlo kernel machine and (b) a one-hidden-layer network whose first layer nobody trained.
2. Bochner's theorem stated precisely (stationary PSD kernels ⟺ Fourier transforms of finite nonneg measures) with the reading: a kernel's smoothness lives in its spectrum's decay; the sampling table (Gaussian ↔ Gaussian, Laplacian ↔ Cauchy, Cauchy ↔ Laplacian — the pleasing duality).
3. The approximation guarantee: pointwise Hoeffding (module 9's tool, reused!) then Claim 1's uniform version stated (ε-net idea in two sentences); the practical D-vs-accuracy reading; the O(n·d) kernel-evaluation vs O(D+d) linear-model arithmetic with Table 1's measured 44h→25min as the payoff.
4. The two readings run BOTH ways, each with a course thread cashed:
   (a) D finite and swept → Belkin's laboratory: below n (classical), at n (the spike), beyond n (the second descent) — double descent's home model class was exactly this bridge object;
   (b) D → ∞ with random first layer → the kernel machine exactly; and a NETWORK with random Gaussian weights and infinite width → a GP (Neal's limit — module 10's machinery reappears as the limit of networks; NTK named in one sentence as the trained-network refinement).
5. What "classical vs deep" therefore contrasts: FIXED random/implicit features (kernels, RFF, GPs) vs LEARNED features; the epilogue's framing — the classical toolkit survives as both the infinite-width limit and the fast approximation inside modern practice; where learned features win is the next lesson's evidence question.
6. ★ Random binning features (the paper's second construction) in three sentences with its Laplacian-only scope — completeness without bloat.

## Set pieces & gems
- The one-line unbiasedness identity — "a cosine of a random projection estimates a kernel": the course's last small astonishment, derived fully.
- The Gaussian↔Laplacian/Cauchy↔Laplacian spectral duality table.
- The 44h→25min Forest Cover number — the systems payoff with a captured artifact.
- Neal's limit as the meeting of module 10 and networks — the thread that makes the epilogue an epilogue.

## Pitfalls
- Keep NTK to a named pointer (out of scope); Neal's GP limit gets the honest two-paragraph version (CLT over units), not a proof.
- The variance of the Monte Carlo estimate matters (D controls it) — don't let "unbiased" read as "accurate".
- Do not oversell RFF as SOTA; its role here is conceptual bridge + honest speedup.

## FIGURE PLAN
- draw: The identity dissected — E[z_w(x)z_w(x′)] expanded via the product-to-sum trig identity to the Bochner integral, each step annotated; the "one random hidden unit" reading boxed. Formula-dissection key image.
- source: randomfeatur-fig1-fourier-features — stem `rff-schematic`, reader must see the original projection-onto-ω/wrap-onto-circle schematic with the kernel↔p(ω) table; placement: float right beside the construction (the field's canonical diagram).
- draw: Kernel approximation converging — the true RBF Gram matrix heat map beside RFF approximations at D = 10/100/1000 with max-error tallies. Computed FigureSequence (3 frames).
- draw: The three-costumes figure — ONE diagram drawn three ways: (a) kernel machine (Gram matrix), (b) random-features linear model (feature matrix), (c) one-hidden-layer network (units); the same fitted function under all three, equalities labeled with their theorems (Bochner/MC; Neal's limit). The lesson's thesis image.
- draw: The double-descent home — Belkin's D-sweep re-inked on the RFF architecture drawing: the D<n / D=n / D≫n regimes marked on the width axis. Course-thread figure (links back to double-descent's captured evidence).
- source: randomfeatur-table1-results — stem `rff-benchmarks`, reader must see the measured error+time table (44h vs 25min rows); placement: float right in the systems section.

## EXERCISE PLAN
1. Warm-up: sample 3 (w, b) pairs (given), compute z(x)ᵀz(x′) for two given points, and compare with the exact RBF value.
2. Derivation skipped: carry the trig expansion E_b[cos(wᵀx+b)cos(wᵀx′+b)] = ½cos(wᵀ(x−x′)) (the b-average step the lesson compresses), then the w-average to the kernel.
3. Boundary probe: D = 1 (a single cosine feature — the "kernel machine" is a sinusoid fit; unbiased yet useless: variance is the whole story); and w sampled from the WRONG spectral density (the estimator converges to the wrong kernel — unbiasedness is relative to p(w)).
4. Claim to refute: "random features can't work — untrained first layers throw away everything learning is for." Refute with the guarantee + benchmarks; then CONCEDE its true half via the skin-of-the-orange memory (module 4) and the tabular findings ahead: fixed isotropic features pay exactly where feature LEARNING pays; name the trade precisely.
5. Mixed review (E3): approximate your gp-lab's SE kernel with D=500 RFFs and refit the GP's mean via linear regression on the features; report the mean's max deviation from the exact GP mean (modules 10+11 composed).
6. Research-shaped: reproduce a row of Table 1 in miniature — RBF-SVM vs RFF+linear on a provided 10k-point dataset; report error and wall-clock for both (the 44h→25min phenomenon at laptop scale).
7. FORWARD (E7): fit RFF+linear and a gradient-boosted ensemble on a TABULAR dataset with axis-aligned structure and junk features; record the gap. Solution: why trees win on tables — the course's final question → Ref tabular-showdown.

## ARC
- Inherits: kernels (module 4), GPs (module 10), double descent's laboratory (double-descent), Hoeffding (module 9).
- Contributes: the bridge — kernels, random networks, and GPs revealed as one object seen at different widths; the classical toolkit located INSIDE the modern one.
- Hands off: the empirical verdict on classical-vs-deep where it is still contested — tables → tabular-showdown.
- Spine step: "Where the classical story breaks…" (step 11).
