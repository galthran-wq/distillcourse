# Monte Carlo pricing and variance reduction — research brief

Lesson: `monte-carlo-pricing` (module: risk-neutral-pricing, core, planned). NEW.
Goal: Estimate risk-neutral expectations by Monte Carlo and cut the estimator's variance with antithetic pairs and control variates.

## Sources
- Hull §21.6 (Monte Carlo: simulate under the risk-neutral measure, average discounted payoffs, standard error; multi-step paths; eq for GBM's exact update), §21.7 (variance reduction: antithetic variates, control variates, importance sampling and stratified/moment-matching NAMED only, quasi-random named only); Business Snapshot 21.1 (estimating π by darts) and 21.2 (the literal spreadsheet recipe for checking BSM by 1,000 NORMSINV(RAND()) paths) — the canonical first experiments, both reproduced.
- Hull §21.6's Euler vs exact discretization discussion (weak error/bias) and §27.5's path-dependent framing (one sentence).
- Classical-ml course (prerequisite): the CLT, standard errors, and held-out validation habits — leaned on explicitly (the lesson's estimation language is inherited, not retaught).
- Kemna–Vorst geometric-Asian control variate: standard canon for the Asian task — introduce the geometric Asian's closed form as a stated result (derivable by the module's own lognormal machinery; derivation sketched in a ★ section: the geometric average of lognormals is lognormal).
- Boyle (1977) named once in Notes as Monte Carlo's introduction to option pricing.

## Key points
1. The estimator: $\hat V = e^{-rT}\frac1N\sum h(S_T^{(i)})$ with $S_T^{(i)}$ sampled EXACTLY under $\tilde P$ (lognormal draw — no discretization needed for GBM terminals); unbiasedness; the CLT gives $\pm 1.96\,s/\sqrt N$ — every MC price is an interval. The discipline: a price without a standard error is not a result (classical-ml validation register).
2. The convergence economics: to halve the error, quadruple $N$ — the same $1/\sqrt{}$ law as hedging error (Ref greeks-hedging-error, one sentence); variance reduction attacks the CONSTANT, not the rate.
3. Antithetic pairs: mirror the Gaussians, average pairwise; variance halved-or-better for monotone payoffs (the negative-covariance argument PROVED for monotone $h$ via the coupling inequality, stated honestly); where it fails (symmetric/non-monotone payoffs, e.g. a straddle — computed counterexample).
4. Control variates: $\hat V_{cv} = \hat V - \beta(\hat C - E[C])$ with $E[C]$ known; optimal $\beta^* = \mathrm{Cov}/\mathrm{Var}$ (the regression coefficient — classical-ml's OLS in one line); variance ratio $1 - \rho^2$. Controls that work: the terminal stock (known mean $S_0e^{rT}$), the BS closed form for a related vanilla, the geometric Asian for the arithmetic Asian ($\rho \approx 0.99+$ ⟹ 100×). The closed form's new job: not the answer but the yardstick and the control.
5. Discretization, when needed (path-dependent payoffs or non-GBM dynamics): Euler's weak bias $O(\Delta t)$ vs exact GBM sampling; measure the bias, don't guess (a computed example: Euler at 12 steps overprices the call by a visible bias vs exact sampling — numbers shown).
6. Scope: MC prices European/path-dependent claims off one expectation; American claims need optimal stopping inside the simulation — Longstaff–Schwartz named (Ref early-exercise-in-practice), out of scope.

## Set pieces & gems
- Hull's dart-throwing π estimate as the 60-second opener (with its standard error — even π comes with a confidence interval).
- Business Snapshot 21.2's spreadsheet recipe reproduced as the first pricing experiment: 1,000 paths, the BS value inside the interval.
- The variance-ratio table: naive / antithetic / control-variate standard errors at equal $N$ on the running 4.76 call — the lesson's keeper numbers (roughly 1 / 0.7 / 0.1 of naive).
- The straddle antithetic failure — a clean computed counterexample (E6b fodder).

## Pitfalls
- Simulate under $\tilde P$ (drift $r$), never $P$ — the classic silent error; make it the L13 refutation slot (a $\mu$-drift simulation overprices the call by the market price of risk's worth; compute the wrong number and diagnose it).
- Standard error uses the SAMPLE std of discounted payoffs — with the ddof honesty the classical-ml course drilled; one sentence.
- Antithetic + control combined: fine, but estimate $\beta$ on a pilot sample or the estimator is biased (the plug-in $\beta$ subtlety — one Remark, and a lab checkpoint hint).
- Do not open quasi-MC/stratification beyond naming (anti-sprawl).

## FIGURE PLAN
- draw: The estimator as a pipeline — draw $Z$ → build $S_T$ → payoff → discount → average ± SE; each stage with its formula; the interval drawn around the output. Voita rule 3.
- draw: Convergence race — running estimate vs $N$ (log axis) for naive MC with the $\pm 1.96 s/\sqrt N$ funnel shrinking around the BS line; the "quadruple to halve" annotation. Single Figure.
- draw: Antithetic mirroring — the Gaussian axis with paired $\pm z$ draws; payoff curve above showing the pair's payoffs averaging toward the mean; twin panel with a straddle payoff where mirroring buys nothing. Voita rule 8. 
- draw: Control variate as regression — scatter of payoff vs control across paths, the regression line, the residual spread (the new variance) vs the raw spread; $\beta^*$ as slope; $1 - \rho^2$ boxed. Original — classical-ml's picture in pricing clothes (caption says so).
- draw: FigureSequence (3 frames), Euler bias: frame 1 one exact lognormal draw vs a 12-step Euler path to the same horizon; frame 2 the two terminal distributions overlaid (Euler's shifted); frame 3 price-vs-steps converging to the exact line, bias $O(\Delta t)$ slope marked. Original.

## EXERCISE PLAN
1. Warm-up: price the running call ($S_0=42$, $K=40$, σ=20%, r=10%, T=0.5) with $N = 10^4$ exact draws; report estimate ± SE and check the 4.76 closed form lands inside.
2. Claim to refute: "simulating with the stock's real drift μ=13% gives the fair price — that's what will actually happen." Compute the μ-priced call, measure the overpricing, and name the theorem that says which drift prices (Girsanov/risk-neutral valuation, Ref).
3. Derivation skipped: prove the control-variate variance formula $\mathrm{Var} = \sigma_h^2(1-\rho^2)$ at $\beta^*$, and show $\beta^*$ is the OLS slope of payoff on control.
4. Boundary probe: a deep-OTM call ($K = 3S_0$): naive MC at $N = 10^5$ returns mostly zeros — compute the relative SE blow-up, explain why rare payoffs break plain averaging, and name (only) the fix's family (importance sampling — the measure change AGAIN; note the irony that Girsanov is now a variance tool).
5. Research-shaped: reproduce Hull's Business Snapshot 21.2 experiment exactly (1,000 paths, his parameters); then re-run 100 times and report how often the true value falls inside the reported 95% interval — the interval's own honesty audited.
6. Mixed/spaced (E3): use MC to price the digital from risk-neutral-valuation's exercise and compare SE against the vanilla at equal $N$; connect the difference to the payoff's variance (and the hedging lesson's discontinuity story).
7. FORWARD (E7): simulate 10,000 paths of a GARCH-like process (σ jumping between 15% and 35% with persistence — spec given) and price the same call; observe the price exceeds BS at the average σ and the terminal distribution's tails are fat. Solution: option prices under clustered volatility deviate from BS exactly where the smile lives — module 8 builds the volatility process honestly → Ref realized-implied-smile (and stylized-facts).

## ARC
- Inherits: the pricing expectation (risk-neutral-valuation), exact GBM sampling (ito-formula), the estimation/validation register (classical-ml prerequisite).
- Contributes: the expectation made computable — with error bars, and with the variance-reduction craft that makes the closed form a tool (control) rather than a rival.
- Hands off: the measure read off market prices (implied-density) and the engine built by hand (monte-carlo-lab).
- Spine step: "Girsanov's theorem builds the continuous risk-neutral measure the tree promised…" (step 6).
