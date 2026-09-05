# Realized versus implied volatility — research brief

Lesson: `realized-implied-smile` (module: volatility-dynamics, core, planned). NEW. MODULE 8 APPLICATION (L16 — a computational study: the smile generated from fitted dynamics) and the course's closing argument.
Goal: Evaluate the gap between GARCH-forecast realized volatility and the implied surface, and demonstrate by simulation that clustering plus leverage generate an equity-style skew.

## Sources
- 18.S096 Lecture 9 (pp.5–14): realized/historical volatility estimation — close-to-close annualization; Parkinson and Garman–Klass OHLC estimators with the efficiency ladder (close-only 1 → ~5.2 → ~7.4/8.4) — "more information, less variance for free"; the estimators' formulas.
- Hull §23.6 (GARCH term-structure forecast, eq 23.14; Table 23.4's vol-maturity vega translation) and §15.11 (the VIX as the implied benchmark; Fig 15.4 already used — Ref).
- greeks-hedging-error's forward exercise (the delta-hedged book's P&L = realized-vs-implied variance bet) — redeemed here as the economic definition of the wedge.
- implied-density / state-prices (the priced-vs-likely wedge = risk premium) — the $\tilde P$ vs $P$ ledger closed here.
- Gatheral Ch.3 (skew flattening with maturity ~ the observed term pattern the simulation must echo); Cont fact 11 (coarse-to-fine predictability) — one sentence.
- The simulation experiment is the course's own synthesis (a standard exercise in the GARCH-option-pricing literature — Duan 1995 named in one Notes line as the formalization; not developed).

## Key points
1. Realized volatility as an estimator family: close-to-close (the baseline, with its $\sqrt{2/n}$-ish relative error), then Parkinson/Garman–Klass squeezing 5–8× efficiency from the same days' OHLC — the classical-ml estimator-efficiency lens applied (Fisher-information flavored framing, one sentence). The QV connection stated: realized variance IS sampled quadratic variation of log-price (Ref brownian-motion — the course's oldest object, now a statistic).
2. The two witnesses aligned: the GARCH forecast term structure (fitted, from garch-mle) laid against the implied term structure (from the surface, module 7) on matched dates — same mean-reverting SHAPE (calm upward, stressed inverted; the spx-surface forward exercise's concavity explained), different LEVEL.
3. The level gap is systematic: implied sits above subsequently realized vol on average (the variance risk premium) — measured on the shipped data (VIX-style implied vs realized 21-day windows; mean gap of order 2–4 vol points, sign-stable across years); the economics from module 2/6's state prices: option sellers are paid for bearing variance in bad states; the delta-hedged P&L identity makes the wedge tradeable (short options + hedge = collecting the premium, long the crash).
4. The closing experiment (the application's core): simulate returns from the FITTED GARCH with a leverage asymmetry (a GJR-style term, introduced honestly in two lines as the minimal asymmetric extension); price options across strikes on the simulated paths by Monte Carlo (module 6's engine — the course's machinery composed); invert to implied vols (module 7's solver). RESULT: a smile appears from clustering alone (fat tails lift both wings), and a SKEW from the leverage term (down-moves raise future σ ⟹ left tail fat) — the smile explained by the return dynamics, the design intent's landing sentence executed. Compare the simulated skew's slope/term-flattening with the real surface's qualitatively.
5. The honest boundary (the course's last fence): the P-dynamics smile is generated risk-neutrally in the experiment (simulating under $\tilde P$-with-GARCH is itself a modeling choice — Duan's LRNVR named, fenced); the empirical premium (point 3) says P-dynamics alone cannot QUANTITATIVELY match market smiles — jump risk premia remain; the 5-cent bid stands. What the course established, and what begins beyond it, stated in one closing section.

## Set pieces & gems
- The efficiency ladder (1 → 5.2 → 8.4) — free variance reduction from OHLC; a table with the estimator formulas.
- The two-term-structure overlay on a crisis date vs a calm date — the module's witnesses agreeing on shape.
- The premium measurement (implied minus realized, years of it) — insurance sold at a profit, visible.
- The generated smile — the course's machinery (GARCH fit → MC pricer → IV solver) composed into its final exhibit.

## Pitfalls
- The GARCH-option-pricing measure question is real: simulating under fitted P-parameters and discounting at r is NOT risk-neutral pricing; state the shortcut and its license (Duan's LRNVR fenced) — the experiment's claim is qualitative (shape generation), not a pricing model; keep it honest or the course's last move undermines its own standard.
- Realized-vol window vs implied horizon must match (21 trading days vs 30 calendar) — the classic apples/oranges; fix conventions once.
- The leverage extension is introduced minimally (one term, its sign); no zoo of GARCH variants (anti-sprawl).
- Keep "variance risk premium" as measured fact + state-price reading; no equilibrium theory.

## APPLICATION spec (L16)
- Artifact: a computational study composing the course's own toolchain — the fitted GARCH(+leverage) simulator, the Monte Carlo pricer, the implied-vol solver — to generate an equity-style smile from return dynamics, laid against the measured surface and the measured implied-realized premium.
- Module results used: GARCH fitting and forecasting (garch-mle, arch-garch), realized-vol estimation (this lesson), MC pricing (monte-carlo-pricing), the IV inversion (implied-volatility), state-price economics for the premium (state-prices-change-of-measure, implied-density).
- Departures from idealisation: the P-vs-$\tilde P$ shortcut in GARCH option pricing (LRNVR fenced), premium magnitudes unexplained by diffusive dynamics (jump premia), realized-vol microstructure noise at fine sampling (named only).

## FIGURE PLAN
- draw: The estimator ladder — three estimator cards (close-close, Parkinson, Garman–Klass) with formulas, each with its efficiency multiple as a bar; one day's OHLC candle annotated with what each reads. From 18.S096 Lec 9.
- draw: The two witnesses — implied term structure (points from the surface) overlaid with the GARCH forecast curve (line) on one calm and one stressed date; twin panels. The module's alignment figure.
- draw: The premium strip — implied (30d) vs subsequently realized (21d) vol through several years as two lines; the gap shaded; its mean and sign-stability annotated. Original (computed from shipped data).
- draw: FigureSequence (4 frames), the closing experiment: frame 1 fitted GARCH+leverage paths (clustered, asymmetric); frame 2 MC option prices across strikes; frame 3 the inversion; frame 4 the generated IV curve — a skew — beside the real September-2005 skew. The course's final signature figure.
- draw: The wedge ledger — the delta-hedged book's P&L identity $\tfrac12\Gamma S^2(r_t^2 - \sigma_{imp}^2\Delta t)$ summed: who pays whom when implied > realized; the position labeled (short-vol collects premium, carries crash risk). Spiral of greeks-hedging-error's ledger.
- draw: What is established / what begins beyond — the course's closing card: the argument chain as eight checked boxes, and the open items (jump premia, stochastic-vol dynamics, the 5-cent bid) as the honest frontier. Original.

## EXERCISE PLAN
1. Warm-up: from one month of OHLC data, compute close-to-close, Parkinson, and Garman–Klass vols; report the three annualized numbers and the ratio of their sampling errors implied by the efficiency ladder.
2. Derivation skipped: derive Parkinson's estimator's expectation for driftless BM (the high–low range's known second moment — constant supplied) and show where drift bias enters; state why GK's open/close terms reduce it.
3. Boundary probe: realized variance sampled ever finer on the SHIPPED daily data vs the theory's QV limit — why the estimator cannot follow the mesh to zero on real data (discreteness, microstructure — named), and what window the convention settles on.
4. Claim to refute: "implied volatility is a forecast of realized volatility, and its persistent excess proves the market is systematically wrong." Refute with the premium reading: implied = forecast + price of variance risk; run the regression realized ~ implied on the shipped series (slope < 1, intercept > 0 pattern) and interpret both coefficients under the two hypotheses.
5. Research-shaped (the application's core): run the closing experiment at reduced scale — fitted GARCH+leverage, 10⁵ paths, 7 strikes, invert — and report the generated skew slope; then set the leverage term to zero and report the now-symmetric smile; the discriminating experiment between "tails alone" and "tails + asymmetry".
6. Mixed/spaced (E3): reconcile three vols for one date: the GARCH one-day forecast, the realized (GK) estimate, and the ATM implied — order them, and attribute each pairwise gap to (estimation noise / premium / horizon mismatch).
7. FORWARD (E7 — the course's exit): the generated smile still underprices the 5-cent 13.7σ put by orders of magnitude; compute the GARCH-simulated probability of a one-day −7% move and compare with a jump process calibrated to one 1987 per 60 years. Solution: the gap names the course's frontier — jump risk and its premium, the first chapter of the sequel the closing section points to (Merton 1976 / Shreve Ch.11 in References).

## ARC
- Inherits: everything — the σ_t model and fit (module 8), the pricing engine (module 6), the inversion (module 7), the premium economics (modules 2/6), QV (module 4).
- Contributes: the course's answer completed: the smile the constant-σ model could not explain emerges from measured return dynamics, and the residual gap is priced risk, not error — with the boundary of the explanation stated exactly.
- Hands off: the lab builds the fitter end-to-end (garch-lab); beyond the course: jumps, stochastic vol, and their premia (named, referenced, honestly unproved).
- Spine step: "Returns confess: volatility clusters, tails are heavy…" (step 8, application item).
