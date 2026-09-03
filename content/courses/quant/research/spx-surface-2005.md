# The SPX surface, September 15, 2005 — research brief

Lesson: `spx-surface-2005` (module: volatility-smile, core, planned). NEW. MODULE 7 APPLICATION (L16 — a published fit read and partially reproduced).
Goal: Analyze Gatheral's published SPX volatility surface — raw quotes, SVI fits, and the Heston negative result — as the module's results applied to one real trading day.

## Sources
- Gatheral Ch.3: the SPX implied volatility surface of Sept 15, 2005 (Fig 3.2, the 3D surface); Fig 3.3 — the 8-panel SVI-fit-vs-bid/offer grid (source image on disk); the SVI parameterization $\sigma^2_{BS}(k) = a + b[\rho(k-m) + \sqrt{(k-m)^2 + \sigma^2}]$ (eq 3.20) with the near-arbitrage-free calendar constraints across expiries; ATM variance and skew term structures (Figs 3.4–3.5); Fig 3.6 — the calibrated Heston surface shifted DOWN FIVE VOL POINTS just to be comparable, and still "far too flat" at short expirations (the honest negative result); Ch.7's Lee moment formula (wings linear in log-strike, model-independent) cited as WHY SVI's linear wings are the right asymptotic — stated, not proved.
- Gatheral Ch.5 (Table 5.1 context — same date; the jump evidence already used in volatility-smile; here one Ref).
- vol pipeline lessons: implied-volatility (the inversion), volatility-smile (the shapes), local-volatility (arbitrage constraints); implied-density (butterfly test) — all Ref'd as the toolkit being exercised.
- Taleb's foreword anecdote (the "distilled exactly seven times" NYU course) — one Notes line of provenance color at most, or omit.

## Key points
1. The artifact: one closing snapshot — SPX 1227.73, eight listed expiries (Sep-05 to Jun-07), hundreds of strikes, bid/offer both sides. The pipeline from module lessons run on it: mids → forwards by parity → IVs per (K,T) → the surface. What a professional calibration must then deliver: smoothness, wings, and NO static arbitrage — the checklists from local-volatility.
2. SVI read as engineering: five parameters per expiry; each parameter's geometric meaning (level $a$, angle $b$, rotation $\rho$, translation $m$, ATM curvature $\sigma$); wings LINEAR in log-strike because Lee's moment bound says implied VARIANCE grows at most linearly — a model-independent theorem constraining a curve-fitting choice (the application's theory-meets-craft moment).
3. The fit quality read off Fig 3.3: SVI threads the bid/offer diamonds panel by panel; where it strains (shortest expiry's wings — the jump territory the smile lesson flagged). Reproduce ONE panel's fit numerically (transcribed quotes, least squares over the five parameters) — the "reproduce a published result" core.
4. The negative result given full weight: Heston — the leading stochastic-vol model, named with its one-line structure (variance follows its own mean-reverting square-root process) — calibrated to the same day CANNOT produce the short-expiry skew; Gatheral must shift its surface 5 vol points to even compare shapes, and it is still too flat where the data are steepest. An honest published failure, read as the module taught: short-dated skew is jump territory; diffusive vol moves too slowly to matter overnight.
5. Departures from the idealisation (L16): bid/offer width in the wings (the ill-conditioning computed in implied-volatility — δσ = δprice/vega applied to real spreads); discrete strikes; the interpolation/extrapolation choices a desk must OWN (SVI is one choice; the arbitrage checks are the constraint, not the parameterization).

## Set pieces & gems
- Fig 3.3's 8-panel grid — real bid/offer diamonds with the fitted curve; the application's centerpiece (source image).
- The five-vol-point shift admission — a practitioner-author showing his best alternative model failing; the course's honesty standard found in the wild.
- The SVI parameter walk — one panel's five numbers, each moved slightly with its geometric effect described (prose + figure, no demo needed).
- Lee's bound as the wings' law — a model-free theorem policing a curve fit.

## Pitfalls
- Do not derive Heston (out of scope; its PDE lives in Shreve's exercises — one Notes pointer); the lesson needs only its qualitative structure and its published failure.
- SVI's "near-arbitrage-free" is Gatheral's own hedge — later literature (Gatheral–Jacquier 2014) formalized arbitrage-free SVI; one honest sentence, no development.
- Transcription: the reproduced panel's quotes come from the book's figure/tables; state transcription tolerance; the fit's RMSE target is "inside the spread", not machine precision.
- Keep the lesson at ONE date; no surface-dynamics claims (local-volatility's limits section owns that thread).

## APPLICATION spec (L16)
- Artifact: Gatheral (2006) Ch.3's published SPX surface study — Sept 15, 2005 quotes, SVI fits per expiry, and the calibrated-Heston comparison — read end to end, with one expiry's SVI fit reproduced numerically.
- Module results used: the implied-vol inversion and its wing ill-conditioning (implied-volatility), the smile/skew taxonomy and jump datum (volatility-smile), static-arbitrage constraints as the fit's domain (local-volatility, implied-density).
- Departures from idealisation: bid/offer bands vs point quotes, strike discreteness, parameterization choice as craft, and the shortest expiry's jump-driven steepness that neither SVI's diffusive rationale nor Heston absorbs.

## FIGURE PLAN
- source: thevolatilit-svi-fits-spx-quotes — Gatheral Fig 3.3, the 8-panel SVI-vs-quotes grid; save as `svi-fits-2005`; the reader must see the bid/offer diamonds and the fitted curves across expiries; placement: centered as the lesson's centerpiece; a redrawing would erase the real quote scatter that IS the point.
- draw: The pipeline recap strip — chain → forward → IV → smile → SVI parameters, with this date's actual numbers at each stage for one expiry (Dec-05). Voita rule 3; spiral of implied-density's pipeline figure.
- draw: SVI anatomy — the five parameters bound to geometric features on one smile (level/slope/rotation/translation/curvature arrows), the formula beneath with color-bound symbols. Voita rule 7. The lesson's signature drawing.
- draw: Wings and Lee's bound — total variance vs log-strike with the linear asymptotes drawn; a super-linear "illegal" wing dashed and marked with the moment that would explode. Original.
- draw: The Heston verdict — two smile slices (shortest expiry): the data's steep skew vs the calibrated Heston's flat one (shapes per Fig 3.6's description, redrawn schematically and labeled as such); the 5-vol-point shift annotated. Original.

## EXERCISE PLAN
1. Warm-up: given the Dec-05 SVI parameters (transcribed), compute the fitted IV at three strikes and compare against the quoted bid/offer — inside or out?
2. Research-shaped (the lesson's core): fit SVI to one transcribed expiry by least squares (or trace the provided fit); report RMSE in vol points and the count of quotes whose spread the fit misses; state what counts as success (inside the spread almost everywhere).
3. Derivation skipped: show that SVI's total variance is asymptotically linear in $|k|$ with slopes $b(1 \mp \rho)$, and verify both slopes are nonnegative iff $b \ge 0$, $|\rho| \le 1$ — the parameterization's built-in wing sanity.
4. Boundary probe: push $\rho \to -1$ — the left wing's slope maxes while the right flattens to zero; connect to the moment interpretation (right-tail moments all finite, left tail at the bound) and to the equity skew's economics.
5. Claim to refute: "Heston has five parameters and SVI-per-expiry has five, so they are equally expressive — Gatheral's comparison is unfair." Refute: SVI spends five parameters PER EXPIRY with no cross-expiry dynamics; Heston's five must generate ALL expiries from one process — the comparison measures exactly the cost of having dynamics; name what Heston buys that SVI cannot (a model of tomorrow).
6. Mixed/spaced (E3): run the butterfly and calendar checks (implied-density/local-volatility machinery) on the fitted SVI surface at the grid points and report violations (expected: none or marginal at the wings).
7. FORWARD (E7): compute the fitted ATM total variance across the eight expiries and plot it against maturity; observe it is concave (variance accumulates fast early, slower later). Solution: a mean-reverting variance process produces exactly this shape — module 8's GARCH term structure will generate and fit it → Ref arch-garch, realized-implied-smile.

## ARC
- Inherits: the whole module's pipeline and constraints; the jump datum; the density dictionary.
- Contributes: the module cashed on a published professional study — one real day's surface fitted, the best-known alternative model's failure read honestly, and the craft/constraint division made explicit.
- Hands off: the learner now builds the pipeline themselves → vol-surface-lab; the term-structure observation opens module 8's door.
- Spine step: "Inverting Black–Scholes on market quotes should return one number…" (step 7, application item).
