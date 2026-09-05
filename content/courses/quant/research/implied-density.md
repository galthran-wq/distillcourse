# The market-implied distribution — research brief

Lesson: `implied-density` (module: risk-neutral-pricing, core, planned). NEW. MODULE 6 APPLICATION (L16 — a computational study on market data).
Goal: Compute the risk-neutral density from option prices via the Breeden–Litzenberger identity and compare it against the lognormal benchmark.

## Sources
- Shreve II Exercise 5.9 ("Implying the risk-neutral distribution"): $\tilde p(0,T,x,K) = e^{rT}\,c_{KK}(0,T,x,K)$ — the identity, presented in the canon as a hands-on exercise; this lesson carries it out (the dossier notes it is "later explicitly cross-referenced as the seed of Dupire's construction" — keep that thread).
- risk-neutral-valuation's forward exercise (the analytic second derivative of the BS formula = discounted lognormal density) — the sanity anchor.
- Hull §12.3 (butterfly spreads — the portfolio whose payoff tends to a point mass; the second derivation), §20.x (implied distributions from smiles framed; Fig 20.2/20.4's heavier-than-lognormal tails idea).
- Gatheral Table 5.1 (the real SPX Sept 15, 2005 chain — the quotes to differentiate; source image on disk) — the lesson's dataset, alongside the GOOG chain from module 1 as the second, coarser instance.
- Cont 2001 §4 (heavy tails as the expected finding — the physical-measure echo; one bridge sentence).

## Key points
1. The identity derived TWICE: (a) analytically — differentiate $C(K) = e^{-rT}\int (s-K)^+\tilde p(s)\,ds$ under the integral twice ($C_K = -e^{-rT}\tilde P(S_T > K)$, then $C_{KK} = e^{-rT}\tilde p(K)$ — each differentiation's meaning stated); (b) by portfolio — the butterfly $(C(K-h) - 2C(K) + C(K+h))/h^2$ pays a tent of area 1 around $K$; its price tends to the discounted density. Two proofs, one identity; the butterfly makes the density TRADEABLE.
2. The first derivative read en route: $-C_K$ as the discounted exercise probability — the digital again (Ref risk-neutral-valuation's exercises); the chain's slope IS a CDF. Monotonicity/convexity of $C(K)$ = no-arbitrage of the chain (the module-1 forward exercise's positive second differences, redeemed and named: butterfly arbitrage).
3. The extraction pipeline on real data: mids → (parity-implied forward, Ref option-chain-bounds) → finite-difference second derivatives across the strike ladder → the density, with the numerical honesty inventory: noise amplification by double differencing (the ill-posedness — echo the 18.S096 regularization images in one Remark), bid–ask jitter, wing truncation.
4. The finding: the extracted SPX density vs the lognormal of matching forward and ATM variance — the fat left tail and thin right shoulder, quantified (tail mass beyond −2σ: extracted ≈ 3–4× lognormal). The risk-neutral measure is not lognormal — Black–Scholes's OWN quotes refute its distributional assumption. The module's punchline and module 7's premise.
5. What this is NOT: the real-world density ($\tilde p$ embeds risk premia — the state-price reading from module 2: crash states are EXPENSIVE, not necessarily likely; Ref state-prices-change-of-measure). The distinction carried carefully; module 8's variance-risk-premium closes it.

## Set pieces & gems
- The butterfly-as-density-probe — a tradeable Dirac delta; the second derivation's physical form.
- The double-differencing noise blow-up shown honestly (raw vs lightly-smoothed second differences) — ill-posedness met in data, with the 18.S096 vol-surface regularization pair as the professional echo.
- The 3–4× left-tail ratio as the keeper number.
- The Shreve-Exercise-5.9-to-Dupire thread planted (one sentence): the same object, differentiated once more in $T$, becomes local volatility.

## Pitfalls
- $\tilde p \ne p$: the risk-neutral density is a PRICED density; do not let the lesson claim "the market expects a crash with probability X" — the correct statement prices state-dollars (L13 refutation slot; the documented misreading is endemic in press coverage of "options-implied probabilities").
- Finite-difference step choice: too fine amplifies noise, too coarse biases; show both failure modes on the data rather than legislating a rule.
- Wings: the density integrates to <1 from a truncated ladder; state the mass accounting rather than hiding it.
- Keep interpolation minimal (linear in price or simple spline); SVI/professional parameterizations belong to module 7's application.

## APPLICATION spec (L16)
- Artifact: the September 15, 2005 SPX chain (Gatheral's published quotes) — the market's risk-neutral density extracted from real bid/offer data; the GOOG 2013 chain as the coarse-ladder contrast.
- Module results used: risk-neutral valuation (prices as $\tilde E$), the derived call formula's $K$-derivatives (risk-neutral-valuation), no-arbitrage convexity (module 1), state-price economics (module 2).
- Departures from idealisation: discrete strikes and double-differencing noise (ill-posed inversion), bid–ask, truncated wings, and the $\tilde p$-vs-$p$ gap (risk premia) — each named and quantified on the data.

## FIGURE PLAN
- draw: The identity's two proofs side by side — left the analytic double differentiation (each step's object named: price → CDF → density); right the butterfly tent narrowing to a spike as $h$ shrinks. FigureSequence (3 frames) for the butterfly half. The lesson's signature.
- source: thevolatilit-spx-option-chain-sep2005 — Gatheral's Table 5.1 SPX quotes; save as `spx-chain-2005`; the reader must see the strike ladder with bid/ask pairs (and the famous 5-cent line readable); placement: centered at the pipeline section's head — the input data as artifact.
- draw: The pipeline — chain → mids → forward → $C(K)$ curve → first differences (the CDF) → second differences (the density), as a five-stage strip with a thumbnail at each stage from the real data. Voita rule 3.
- draw: The finding — extracted density vs matched lognormal on one axis; left-tail region shaded with the ratio annotated; right shoulder marked thin. The module's headline chart.
- draw: Noise amplification — second differences at three strike-spacings (raw fine / raw coarse / lightly smoothed), the fine one jagged with negative excursions circled (a "negative probability" = butterfly-arb-or-noise flag). Original; one caption line pointing at the 18.S096 regularization pair as the industrial-scale version.
- draw: Priced vs likely — two-bar comparison at the crash region: state-price mass vs plausible physical mass, the wedge labeled "risk premium (module 8 prices it)". Original (spiral of module 2's state-price bar chart).

## EXERCISE PLAN
1. Warm-up: from five given call mids on a uniform ladder, compute the finite-difference CDF and density by hand; verify total mass and the mean against the implied forward.
2. Derivation skipped: prove $C_K = -e^{-rT}\tilde P(S_T > K)$ rigorously (differentiate under the integral; justify via dominated convergence, stated) and reconcile the sign with the chain's downward slope.
3. Boundary probe: a chain where two adjacent butterflies price NEGATIVE — construct the explicit arbitrage trade (module 1's machinery) and conclude: a valid density exists iff the chain is butterfly-arbitrage-free; noise and arbitrage are observationally confounded at the spread's scale.
4. Claim to refute: "the options market assigns 8% probability to a 20% crash — investors expect one." Refute with the state-price reading: the 8% is risk-neutral (priced) mass; show with a plausible risk-premium adjustment how a 3% physical probability can carry an 8% price; name the object that separates them (the Radon–Nikodym derivative / state-price density, Ref).
5. Research-shaped: run the full pipeline on Gatheral's Sept 2005 chain (transcribed values); report the left-tail ratio vs lognormal and the mass lost to wing truncation; state your smoothing choice and what changing it does.
6. Mixed/spaced (E3): verify the analytic identity on the BS formula itself (differentiate twice, symbolically or numerically) and confirm you recover the lognormal density — the null test any pipeline must pass first.
7. FORWARD (E7): repeat the extraction for TWO expiries of the chain; observe the density's width does not scale as $\sigma\sqrt T$ with one σ, and the short expiry's tails are relatively fatter. Solution: a one-σ diffusion cannot generate this family of marginals — the surface across $(K, T)$ is the next module's object, and the diffusion that CAN fit it is Dupire's → Ref volatility-smile, local-volatility.

## ARC
- Inherits: risk-neutral valuation and the derived formula's $K$-derivatives; parity/forwards from module 1; state prices from module 2.
- Contributes: the module's constructed measure exhibited as an observable — extracted from real quotes, and found non-lognormal in exactly the direction 1987's residue predicts.
- Hands off: the same quotes, inverted for σ instead of differentiated for density, produce the smile — module 7 opens there; the lab builds the MC engine first → monte-carlo-lab.
- Spine step: "Girsanov's theorem builds the continuous risk-neutral measure the tree promised…" (step 6, application item).
