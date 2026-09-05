# Stylized facts of asset returns — research brief

Lesson: `stylized-facts` (module: volatility-dynamics, core, planned). NEW.
Goal: Examine the stylized facts of asset returns — absent linear autocorrelation, heavy tails, volatility clustering, leverage — and score geometric Brownian motion against each.

## Sources
- Cont 2001, the lesson's backbone: §1 (what a stylized fact is — generality bought at the price of precision), §2 (the 11 facts; the lesson foregrounds five: (1) no linear autocorrelation beyond ~15–20 min, (2) heavy tails with tail index ~2–5, (6) volatility clustering, (8) power-law decay of $|r|$ autocorrelation with β ∈ [0.2, 0.4], (9) leverage effect; the rest listed in a table with one line each), §3 (stationarity/ergodicity/finite-sample caveats — compressed to the two working warnings), §4 + Table 1 (kurtosis 74 / 60 / 16–18 for 5-min futures returns vs an i.i.d. band of ±0.036; Fig 2 density vs Gaussian; Fig 3 running variance settling; Fig 4 the Student-t(4) running fourth moment refusing to settle), §5.1–5.2 (the ACF evidence; Ding–Granger α=1 maximizer; the $r = \sigma\varepsilon$ decomposition eq 21; Mandelbrot's "arbitrage tends to whiten the spectrum" line), §5.3 (heavy-tail ACF caveat — one Remark).
- Images on disk: empiricalpro-fig1-bmw-returns (the clustering series), empiricalpro-fig2-density (the fat-tailed density) — both used as source figures.
- Hull §23.1 opening (the practitioner's restatement) — secondary.
- 18.S096 Lecture 9 (vol estimators preview — NOT here; realized-implied-smile owns Parkinson/GK).
- classical-ml prerequisite: ACF/estimation habits assumed; kurtosis defined in one line anyway (L11).

## Key points
1. What a stylized fact is (Cont's §1 framing): a property holding across instruments, markets, and decades — evidence AGAINST any model that misses it, evidence FOR none in particular. The epistemics stated dry; this is the module's measurement contract.
2. The facts, each with its exhibit: (a) returns are linearly unpredictable — ACF dead beyond minutes; Mandelbrot's whitening line as the mechanism (arbitrage eats linear structure — module 1's discipline reappearing as a spectral fact; C5 spiral, say so); (b) heavy tails — Table 1's kurtosis numbers WITH their i.i.d. confidence band (74 vs ±0.036 — the frame that makes the number scream); (c) clustering — $|r|$ ACF positive for weeks-to-months, power-law decay; (d) leverage — corr(r_t, |r_{t+τ}|²) < 0, asymmetric in τ; (e) aggregational Gaussianity — daily fat, monthly closer to normal (why CLT half-works).
3. The measurement warnings (Cont §3–4 compressed): Mandelbrot's running-moment diagnostic (plot the cumulative estimate vs sample size), and the Fig-4 trap — a SIMULATED t(4) series' fourth moment looks nonconvergent for 2,000 points though it exists; "hasn't converged" and "doesn't exist" are observationally close; humility budget for every tail estimate that follows.
4. GBM on trial, fact by fact — the scorecard: white returns ✓ (increments independent); thin tails ✗ (lognormal kurtosis ≈ 0.1 at daily σ vs measured 10+); no clustering ✗ (|r| ACF ≡ 0); no leverage ✗ (symmetric); aggregation ✓ trivially. The verdict: GBM fails exactly on VOLATILITY's behavior — constant σ is the guilty clause (the same clause the smile indicted from the $\tilde P$ side; the two witnesses agree — the module's opening seam).
5. The decomposition $r_t = \sigma_t\varepsilon_t$ (Cont eq 21) as the specification for what must replace constant σ: a persistent, positive, mean-reverting $\sigma_t$ with sign-asymmetric response. ARCH/GARCH enters next lesson as exactly this — flaw-first hand-off.

## Set pieces & gems
- Table 1's kurtosis-vs-band contrast — the lesson's keeper numbers.
- The shuffle experiment (the demo, and the lesson's discriminating idea): shuffling returns preserves the histogram (tails survive) and destroys the ordering (clustering, leverage die) — which facts are marginal, which are dynamic, settled by an operation.
- Fig 4's t(4) caution — the running fourth moment that lies for 2,000 samples.
- Mandelbrot's whitening line — one quotable mechanism sentence (inline-attributed; the WHO is part of the claim).

## Pitfalls
- Round the facts honestly: tail-index "roughly 2–5", β "0.2–0.4" — Cont's own precision; fake decimals would violate his §1 definition.
- Autocorrelation of |r| under heavy tails has nonstandard error bars (Cont §5.3) — one Remark so the lab's ACF plots carry the caveat.
- Do not fit anything here — this lesson is evidence only; ARCH is next (the module's flaw-first structure depends on the separation).
- The BMW/S&P exhibits are (c) 1990s-2000s data; the facts' cross-decade robustness is Cont's claim — cite, don't overclaim from two figures.

## FIGURE PLAN
- source: empiricalpro-fig1-bmw-returns — Cont's Fig 1, BMW daily returns 1992–98; save as `bmw-returns`; crop to plot+caption; the reader must see the clustered bursts; placement: centered at the clustering section's head — the canonical exhibit.
- source: empiricalpro-fig2-density — Cont's Fig 2, the 30-min S&P density vs matched Gaussian; save as `sp-density-vs-gaussian`; crop to Fig 2's quadrant; the reader must see the sharp peak and heavy shoulders; placement: float right beside the tails paragraph.
- draw: The facts table — the 11 facts as an 11-row card, the five foregrounded rows expanded with their exhibit thumbnails, the rest one line each. Original (the module's reference card).
- draw: The two ACFs — returns' ACF (dead at all lags, inside the band) stacked over |returns|' ACF (positive, decaying slowly) from the shipped daily series; the same y-axis to make the contrast honest. Inspired by Cont Figs 6–8. The lesson's signature.
- draw: The shuffle — FigureSequence (3 frames): original series with clustered bursts; shuffled series (same histogram inset, bursts gone); the two |r| ACFs before/after (alive → dead). The demo's static twin.
- draw: The GBM scorecard — five facts × (measured / GBM predicts / verdict ✓✗) as a card; the ✗ column all pointing at σ. Original — the hand-off figure.
- draw: Running-moment diagnostics — two panels: real S&P running variance settling (Cont Fig 3's idea) vs simulated t(4) running kurtosis wandering (Fig 4's idea), both computable from shipped/simulated data. Original.

## EXERCISE PLAN
1. Warm-up: from the shipped daily return series, compute mean, σ, skewness, kurtosis, and the lag-1..20 ACF of $r$ and $|r|$; state which stylized facts your four numbers already exhibit.
2. Boundary probe: aggregational Gaussianity quantified — compute kurtosis at daily, weekly, monthly horizons from the same series; explain via the CLT WHY it decays and via clustering why it decays SLOWER than i.i.d. aggregation predicts (compare against a shuffled series' decay).
3. Claim to refute: "returns are unpredictable, so their volatility is too." Refute with the two-ACF exhibit: $r$'s ACF dead, $|r|$'s alive for months — unpredictable sign, predictable magnitude; name the fact (clustering) and what it implies a model must condition on.
4. Research-shaped: reproduce Cont's Table 1 discipline on the shipped series — kurtosis with an i.i.d. 95% band computed by simulation (the classical-ml bootstrap habit); report how many band-widths the measurement sits outside.
5. Derivation skipped: compute GBM's exact excess kurtosis of log-returns over horizon Δt (zero — Gaussian) and of SIMPLE returns ($e^{\sigma^2\Delta t}$-flavored, tiny at daily scale); conclude the scorecard's tails row quantitatively.
6. Mixed/spaced (E3): connect to the smile — the implied-density lesson found fat risk-neutral tails; this lesson finds fat physical tails; write three sentences on why neither implies the other yet both point at the same missing σ dynamics (premia as the wedge; Ref implied-density).
7. FORWARD (E7): compute the lag-1 autocorrelation of $r_t^2$ on the shipped series (≈ 0.1–0.25) and fit the one-parameter recursion $\sigma_t^2 = \omega + \alpha r_{t-1}^2$ by least squares on squared returns; observe the fit captures lag-1 but underpredicts the ACF's slow decay. Solution: the reader has fitted ARCH(1) and discovered its flaw; the lag that fixes the decay is GARCH's β → Ref arch-garch.

## ARC
- Inherits: GBM as the standing model (ito-formula) and both prior indictments — the smile ($\tilde P$-side) and 1987 (event-side).
- Contributes: the P-measure evidence, organized: five facts with exhibits, the measurement warnings, and the scorecard convicting constant σ specifically.
- Hands off: the specification $r_t = \sigma_t\varepsilon_t$ with persistent σ — the model family that satisfies it → arch-garch.
- Spine step: "Returns confess: volatility clusters, tails are heavy…" (step 8).
