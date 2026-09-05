# Portfolio insurance and the crash of 1987 — research brief

Lesson: `portfolio-insurance-1987` (module: black-scholes, core, planned). NEW. MODULE 5 APPLICATION (L16 — a deployed system read against the theory).
Goal: Analyze portfolio insurance as delta hedging at market scale and evaluate its role in the October 1987 crash.

## Sources
- Hull §19.13 (portfolio insurance: creating synthetic puts by trading the index or index futures — the delta rule as a PRODUCT; why futures were the trading leg) and Business Snapshot 19.2 "Was Portfolio Insurance to Blame for the Crash of 1987?" (p.425: \$60–90 billion under such programs; the mechanical selling of Oct 19; the debate framed).
- Cont 2001 Fig 5 (minute-by-minute S&P through Oct 15–20, 1987, ~300 → ~220) — the crash record as data (source image on disk).
- Hull §20.3 (the equity skew EXISTS ONLY POST-1987 — "crashophobia", Rubinstein) — the hand-off fact; Business Snapshot 20.2 cited but developed in module 7.
- Shreve II §4.5 (the replication logic being scaled) and the seven-conditions contract from black-scholes-pde (which condition #, price-taking/liquidity, breaks).

## Key points
1. The product: a fund wanting a floor buys no put — it MANUFACTURES one by the module's replication recipe: hold $\Delta_{put} + 1$ of the index (equivalently, sell futures as the index falls). The delta rule of black-scholes-pde, deployed as an industry; sizes stated (\$60–90B ≈ 3% of US equity value at the time — frame the number, L12b).
2. The embedded assumption, named from the contract list: replication computes $\Delta$ from a price process it does NOT influence (price-taking). At \$60–90B, the hedger IS the market: a fall mandates selling, the selling deepens the fall, which mandates more selling — the loop closed.
3. October 19, 1987 read on the minute data: −20.5% in a day (worst prior daily loss ~−12.8% in 1929 — the comparison that frames the magnitude); the record shows the cascade dynamics; the honest historiography: the Brady Commission assigned portfolio insurance a significant role; the debate (mutual-fund redemptions, market structure) stated — the lesson evaluates, not convicts (Bloom: evaluate).
4. What the theory itself says about its failure: the hedge's error analysis (greeks-hedging-error) assumed continuous prices and available liquidity; a 20% gap move is one giant $(\Delta S)^2$ — gamma losses realized at catastrophic scale; the replicating "put" delivered far less than a real put would have (counterparty-free but not slippage-free). Real puts vs synthetic puts compared: the real put's seller bears the gap risk and prices it — the premium the synthetic seemed to save.
5. The permanent residue (hand-off): before 1987, index implied vols were roughly flat in strike; after, a persistent downward skew — the market repricing exactly the gap risk replication cannot manufacture. One dry paragraph + the module-7 pointer. GBM has no gaps; condition #2's constant-σ diffusion is the next thing the data breaks.

## Set pieces & gems
- The feedback-loop mechanism diagram — sell-into-falls as a closed loop vs the price-taking open loop the theory assumed.
- The −20.5% vs −12.8% (1929) comparison as the keeper number pair.
- The "insurance that vanished when needed": synthetic puts delivered floors well above promised levels on Oct 19 — the product's own performance as the verdict.
- Crashophobia named (Rubinstein) as the skew's christening — one sentence here, developed in module 7.

## Pitfalls
- Historiographic honesty: portfolio insurance's causal share is debated; present the Brady-line and the skeptic-line in two sentences each and let the mechanism analysis carry the lesson (L9 dry register; no melodrama).
- Do not import jump-diffusion machinery; the lesson diagnoses with module-5 tools only (gamma, gap $(\Delta S)^2$, liquidity assumption).
- Numbers need frames: \$60–90B vs total market cap; −20.5% vs prior record; keep to 2–3 keeper numbers (L12c).
- This is not a markets-history survey: one event, one mechanism, one residue (anti-sprawl).

## APPLICATION spec (L16)
- Artifact: the portfolio-insurance industry of 1982–87 — the Black–Scholes delta rule productized at \$60–90B scale — and its October 19, 1987 stress test, read on the minute-level crash record.
- Module results used: the delta-replication recipe (black-scholes-pde), gamma and the one-step P&L $\tfrac12\Gamma(\Delta S)^2$ (greeks-hedging-error), the hedging-error frequency law and its liquidity assumptions.
- Departures from idealisation: price-taking (violated at scale — the feedback loop), continuous prices (a 20% gap), always-available liquidity (futures at deep discounts to cash on the day); the residue: the equity skew, born 1987, the next module's subject.

## FIGURE PLAN
- source: empiricalpro-fig5-crash — Cont's Fig 5, the minute-by-minute S&P 500 through Oct 15–20, 1987; save as `sp500-crash-1987`; crop to Fig 5's panel; the reader must see the level falling ~300 → ~220 and the intraday texture of Oct 19; placement: centered under the event narrative.
- draw: The synthetic put — two-panel: left a real protective put's payoff floor; right the replication ledger (index holding shrinking with the delta rule as the market falls), the promised floor dashed. Voita rule 8.
- draw: The feedback loop — the open-loop assumption (price exogenous → compute Δ → trade) vs the closed loop (trade → price impact → Δ → trade), warning color on the closing arc; annotated with the \$60–90B scale. Single Figure, the lesson's signature.
- draw: FigureSequence (3 frames), the cascade stepped: frame 1 a −3% shock and the mandated futures selling (sized); frame 2 the impact-adjusted further fall and the next mandated sale; frame 3 the day's staircase against the no-feedback counterfactual path. Original, schematic-quantitative.
- draw: The gap bill — the one-step P&L formula $\tfrac12\Gamma(\Delta S)^2$ evaluated at $\Delta S = -20\%$ vs twenty −1% days: same total move, ~20× the convexity loss; two bars. Original (spiral of greeks-hedging-error's ledger).

## EXERCISE PLAN
1. Warm-up: a \$100M fund insures a floor at 95% for one year via a synthetic put ($\sigma = 18\%$, $r = 6\%$): compute the initial put delta and the futures short required; recompute after a −10% week.
2. Research-shaped: from the crash-day figures (−20.5%, insured pool \$60–90B, average put delta change ≈ −0.3 on the day), estimate the mandated selling in dollars and compare it to reported NYSE + futures volume of Oct 19 (~\$40B equivalents); state whether the mechanism is quantitatively plausible.
3. Claim to refute: "the insurers' losses came from the delta rule being wrong; a correct rule would have protected them." Refute: the rule was the module's, correctly computed; identify the violated CONDITIONS (price-taking, continuity, liquidity) — the failure is the contract's, not the calculus's.
4. Boundary probe: the gap-bill computation — show that for fixed total move, convexity losses scale with the square of the increment size; conclude which kind of market (gappy vs continuous) the replication contract actually requires, and tie to condition #6 (continuous trading).
5. Mixed/spaced (E3): a REAL put bought in 1986 at BS value with $\sigma = 18\%$: compute its crash-day payoff vs the synthetic's realized floor (assume 15% slippage on mandated trades); the premium difference as the price of gap risk.
6. FORWARD (E7): using Breeden–Litzenberger logic informally (module 6 arrives next), argue what a persistent post-crash bid for OTM index puts must do to the implied-vol-vs-strike curve. Solution: it steepens the left wing — the skew; module 7 measures it → Ref volatility-smile.

## ARC
- Inherits: the delta rule and its error law (black-scholes-pde, greeks-hedging-error).
- Contributes: the module cashed at market scale — replication as a deployed system, its assumption inventory stress-tested by the largest one-day loss on record, and the verdict written into option prices permanently.
- Hands off: the skew that 1987 created is the smile module's data; the lab measures the hedge's error honestly first → discrete-hedging-lab.
- Spine step: "The one-period hedging argument survives the limit intact…" (step 5, application item).
