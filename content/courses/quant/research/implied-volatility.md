# Implied volatility — research brief

Lesson: `implied-volatility` (module: volatility-smile, core, planned). NEW.
Goal: Compute implied volatility by inverting the Black–Scholes formula and explain its role as the market's quoting convention.

## Sources
- Hull §15.11: implied volatility defined; the iterative solution; the VIX as the implied-vol index with Fig 15.4 (2004–2013, the 2008 spike to ~80 — source image on disk); implied vols as the market's quoting/communication device.
- Hull §20.1: calls and puts at the same (K, T) have the SAME implied volatility — the put–call-parity proof (parity holds for market prices AND for BS prices; subtract ⟹ the pricing errors are equal ⟹ one IV) — a lovely two-line argument, reproduce it.
- Dupire 1994's verified opening lines ("The Black-Scholes model gives options prices as a function of volatility. If an option price is given by the market...") — the inversion as the article's own framing; quote-adjacent use, References-anchored.
- black-scholes-formula's vega groundwork (monotonicity) and greeks-hedging-error's vega closed form — Refs.
- Gatheral Ch.3 intro (implied vol as the surface's coordinate) — one framing sentence.

## Key points
1. The inversion well-posed: $c^{BS}(\sigma)$ is continuous, strictly increasing (vega $= S\sqrt\tau N'(d_1) > 0$), with limits the module-1 bounds ($\sigma \to 0$: forward-intrinsic; $\sigma \to \infty$: $S_0$) — so for any quote INSIDE the no-arbitrage corridor there is exactly one $\sigma_{imp}$. Existence/uniqueness proved with module-owned tools; a quote OUTSIDE the corridor has no IV — and is an arbitrage (module 1 again).
2. Computing it: Newton with vega as the derivative (quadratic convergence near the money), why Newton stalls in the wings (vega → 0 — the derivative underflows) and the bisection fallback; a worked inversion with iterates tabulated (the 4.76 example run backwards from a perturbed price).
3. The quoting convention: prices across strikes/expiries/underlyings are incommensurable dollars; IVs are comparable units — desks quote, negotiate, and book in vol. The subtle point (Hull §20.7 anticipation): using the formula as a QUOTING MAP requires none of its assumptions to be true — a bijection is not a belief. This distinction is the module's hinge; state it here, exploit it next lesson.
4. Same IV for calls and puts: the parity subtraction argument in full — market parity minus BS parity ⟹ $c^{mkt} - c^{BS} = p^{mkt} - p^{BS}$ at every (K,T,σ) ⟹ equal roots. Consequence: the smile is one curve, not two.
5. The VIX read as an index of implied vol (Fig 15.4's 2008 spike to 80 = the market repricing σ by 4× in weeks — σ is anything but constant across TIME); the construction itself fenced (variance-swap replication, out of scope — one honest sentence naming what is not covered).
6. Term structure: IV vs expiry at fixed moneyness; calm markets slope up, stressed markets invert — the object module 8's GARCH forecasts will be compared against (one forward sentence).

## Set pieces & gems
- The parity ⟹ one-IV argument — two lines, pure module-1 machinery, surprisingly strong conclusion.
- The Newton iterate table on the worked example — convergence in 3 iterations ATM, 40+ or divergence deep OTM without the fallback.
- The VIX 2008 chart as the "σ is a price, and prices move" exhibit.
- Dupire's opening sentence as the epigraph-fact of the module (the inversion is where his article begins).

## Pitfalls
- Do NOT reveal the smile yet: this lesson treats ONE (K,T) at a time; the across-strike scandal is the next lesson's reveal — keep the powder dry (the module's narrative depends on it; a stray "of course IV varies with K" here kills it).
- IV is quote-dependent (bid IV ≠ ask IV); one sentence, mid convention fixed.
- Vega → 0 in the wings makes IV ill-conditioned there: δσ ≈ δprice/vega — a spread-sized price wiggle is huge in wing-vol units; make this quantitative (it explains why lab checkpoint filtering exists).
- The VIX is NOT "the IV of one option" — fence the construction honestly.

## FIGURE PLAN
- draw: The inversion — $c^{BS}(\sigma)$ as a strictly increasing curve from the lower bound to $S_0$; a market quote as a horizontal line; the unique crossing marked $\sigma_{imp}$; quotes outside the corridor shown failing to cross. Single Figure, the lesson's signature.
- draw: Newton on the curve — FigureSequence (3 frames): the tangent-step iterates walking to the root ATM; the wing case where the flat curve (tiny vega) throws the tangent far off; the bisection bracket rescuing it. Voita rule 2 (one change per frame).
- draw: Ill-conditioning in the wings — vega vs strike (the ATM bump), with the error bar δσ = δprice/vega drawn at three strikes for a fixed one-cent price error: pennies ATM, points in the wings. Original.
- source: optionsfutur-s2-vix-index — Hull Fig 15.4, the VIX 2004–2013; save as `vix-2004-2013`; the reader must see the ~80 spike at Lehman and the calm-period teens; placement: float right beside the σ-moves-in-time paragraph.
- draw: One IV, two options — the parity argument as a two-row ledger (market parity / BS parity), subtraction line yielding $c$-error = $p$-error; the shared root marked on twin inversion curves. Voita rule 7.
- draw: Term structure — IV vs expiry at fixed moneyness, two regimes (calm upward, stressed inverted), axes only + two labeled curves; module 8's GARCH forecast slot dashed ("to be predicted"). Original, forward-looking.

## EXERCISE PLAN
1. Warm-up: given $c^{mkt} = 5.20$ for the running example's parameters, run two Newton iterations by hand from $\sigma_0 = 20\%$ (vega supplied) and report the converged IV to 4 decimals.
2. Derivation skipped: prove strict monotonicity $\partial c/\partial\sigma > 0$ from the closed form (the vega computation of greeks-hedging-error, re-derived) and conclude uniqueness of the root formally.
3. Boundary probe: a quote of $c = S_0 - Ke^{-rT} - 0.01$ (just below the lower bound): show the inversion has no root, and name the module-1 trade the quote admits — "no IV" is itself information.
4. Claim to refute: "an implied volatility of 30% means the market expects the stock to move at 30% annualized." Refute on two grounds: measure ($\tilde P$-parameter, embeds premia — Ref implied-density's priced-vs-likely) and model (30% is a BS-coordinate of one price, not a forecast; different models give different 'expectations' from the same quote). Keep the module-8 reconciliation as the named destination.
5. Mixed/spaced (E3): compute the IV of BOTH the call and put at one strike from the GOOG chain mids (module 1 data) and measure how far apart they land; attribute the gap (American-put premium + spread) using the parity-argument's hypothesis list.
6. Research-shaped: reproduce one dated VIX reading's order of magnitude: with the S&P at IV ≈ 80 (Nov 2008), compute the implied one-day 1σ move in points and compare to the actual ±5–8% daily swings of that month — the quote was tracking realized chaos.
7. FORWARD (E7): invert the September 2005 SPX chain (transcribed mids from the implied-density lesson's data) at FIVE strikes of one expiry and plot IV vs strike. Solution: the plot is not flat — the reader has just drawn a volatility smile, next lesson's subject → Ref volatility-smile.

## ARC
- Inherits: the formula and its monotonicity (black-scholes-formula), vega (greeks-hedging-error), parity (module 1), the corridor (module 1).
- Contributes: the inversion as a well-posed map, the algorithms, the one-IV-per-strike theorem, and the quoting-convention reading that separates the formula's USE from its TRUTH.
- Hands off: run the inversion across strikes and the model indicts itself → volatility-smile.
- Spine step: "Inverting Black–Scholes on market quotes should return one number…" (step 7).
