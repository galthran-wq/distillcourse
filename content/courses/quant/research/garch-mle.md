# GARCH estimation by maximum likelihood — research brief

Lesson: `garch-mle` (module: volatility-dynamics, core, planned). NEW.
Goal: Estimate GARCH(1,1) by maximum likelihood — likelihood recursion, ARCH-LM test, and the block-diagonal information structure — reusing the estimation machinery of classical ML.

## Sources
- Engle 1982: §2 (the likelihood, score, information for ARCH), §5 Theorem 4 (block-diagonal information between mean and variance parameters — "arguably the paper's most load-bearing engineering fact" per the dossier: estimation decouples), §6 (the two-step scoring algorithm as auxiliary OLS regressions), §7 (relative efficiency of MLE vs OLS → ∞ as α → 1 — the quotable), §8 (the ARCH-LM test derived from the LM principle and collapsing to $TR^2$ from regressing $r_t^2$ on its lags, $\chi^2(p)$), §9 (the UK inflation application: chi-sq(4)=15.2; the 4–5× variance rise into the "chaotic seventies"; the outlier-count diagnostic — 5 clustered OLS outliers vs 3 spread standardized ones).
- Bollerslev 1986: §5 (GARCH's MLE — the one difference from Engle: $\partial\sigma_t^2/\partial\theta$ is itself recursive; BHHH named as the optimizer since scoring no longer reduces to one regression), eq 25 (QMLE: consistency + sandwich covariance under non-Gaussian truth — Weiss/White cited), §7 + Figs 3–4 (the OLS constant band vs the GARCH time-varying band on US inflation — source images on disk).
- Hull §23.5–23.6: the worked S&P 500 fit 2005–2010 (Table 23.1's spreadsheet MLE; ω = 0.0000013465, α = 0.083394, β = 0.910116 — VERIFY the exact digits against the page capture optionsfutur-s2-garch-sp500-vol context/pdf p.553 area; the dossier records "as close to a full mini-project as the book gets"), the variance-targeting simplification (set ω from the sample variance — one Remark), Fig 23.1–23.2 (level + fitted vol series — source image on disk).
- classical-ml course (prerequisite, leaned on hard): MLE, score/information, numerical optimization, sandwich/robust errors, held-out validation — the lesson's register is "you know this machine; here is its new load".

## Key points
1. The likelihood by prediction-error decomposition: $\ell(\theta) = \sum_t[-\tfrac12\log 2\pi\sigma_t^2 - r_t^2/2\sigma_t^2]$ with $\sigma_t^2$ computed by the recursion — each term a one-step-ahead Gaussian forecast scored on the realized return. The twist named precisely: $\sigma_t^2$ depends on ALL earlier data and parameters through the recursion; initialization (σ₀² = sample variance) and its dying influence (weight β^t) handled explicitly.
2. Fitting in practice: the recursion + optimizer pattern (BHHH historically; any quasi-Newton today); constraints by reparameterization (ω, α, β > 0, α+β < 1 via logs/logits — one Remark); variance targeting as the practical stabilizer. Hull's S&P fit reproduced as the worked example with the published parameters and the fitted σ_t series through 2008 (the vol path exceeding 5%/day — the crisis in fitted-parameter form).
3. Diagnostics before and after: BEFORE — the ARCH-LM test derived (LM principle stated, the collapse to $TR^2$ shown; the classical-ml hypothesis-testing muscle re-engaged); AFTER — standardized residuals $r_t/\hat\sigma_t$: ACF of squares dead (clustering captured), kurtosis reduced but > 3 (Cont's fact 7 honestly left standing); Engle's outlier-count diagnostic reproduced in spirit.
4. The structure theorems that make it all cheap: Engle's Theorem 4 (mean/variance information block-diagonality — fit the mean, then the variance, no asymptotic loss) and the efficiency stake (his §7: OLS's efficiency loss vs MLE unbounded as α → 1 — "just use OLS with robust errors" fails exactly when ARCH is strong).
5. QMLE honesty (Bollerslev eq 25): the Gaussian likelihood misspecified (real shocks fat) still gives consistent parameters with sandwich standard errors — the classical-ml sandwich estimator's finance debut; when it matters (SEs, not point estimates).

## Set pieces & gems
- Hull's fit as the running mini-project — published parameters matched, the 2008 σ_t path as the payoff exhibit (source image).
- The ARCH-LM test's collapse — a rigorous LM derivation ending in a two-line recipe (the dossier's "tour de force" gem).
- Engle's UK-inflation origin story compressed to one Aside: the founding application was INFLATION uncertainty (chi-sq(4)=15.2; the chaotic seventies' 4–5× variance) — ARCH was born macro, adopted by finance.
- Bollerslev Figs 3–4 (constant vs time-varying bands) — the "why conditional heteroskedasticity matters" before/after (source images).

## Pitfalls
- The recursion's initialization bias at short samples: show it (fit on 250 vs 2,500 days), don't just warn.
- Verify Hull's parameter digits against the captured page before printing them (transcription risk).
- The likelihood surface's α+β ridge: near-unit persistence makes (α, β) individually ill-determined while their sum is sharp — connect to the classical-ml identifiability/conditioning discussions; one computed contour plot.
- Do not implement here beyond displayed code-free math and reported numbers — the LAB implements; the lesson derives and diagnoses (division of labor stated).
- $TR^2$'s χ² is asymptotic; small-sample honesty in one sentence.

## FIGURE PLAN
- draw: The likelihood as a forecasting ledger — three rows of (predicted σ_t, realized r_t, the term's contribution), a big-miss row scored badly; the sum assembling ℓ. Voita rule 7; the recursion arrow threading the rows. The lesson's signature.
- draw: The recursion's dependency fan — σ_t² receiving arrows from r_{t-1}² (weight α), σ_{t-1}² (weight β), and transitively from all history (β^k weights fading); initialization's arrow dying out. Original.
- source: optionsfutur-s2-garch-sp500-vol — Hull Figs 23.1–23.2, the S&P level over its GARCH-fitted daily vol 2005–10; save as `sp500-garch-fit`; the reader must see the 2008 vol spike above 5%/day aligned with the price collapse; placement: centered at the worked fit's results.
- draw: The likelihood surface — contours in (α, β) at the optimum from a real fit: the ridge along α+β ≈ const, the sharp transverse direction; the fitted point and EWMA's boundary point marked. Original.
- source: generalizeda-fig4-garch-confint — Bollerslev's Fig 4 (GARCH band widening/narrowing over 1948–83 inflation); save as `garch-band-inflation`; paired in one figure block with generalizeda-fig3-ols-confint (`ols-band-inflation`) — the constant band's before; the reader must see the band breathing with the visible clustering; placement: the diagnostics section.
- draw: The ARCH-LM recipe — the two-panel collapse: left the formal LM statistic's derivation chain (score → information → statistic), right the executable recipe (regress $r_t^2$ on lags → $TR^2$ → χ² lookup); an equals sign between panels. Original.

## EXERCISE PLAN
1. Warm-up: given a 5-day return snippet and (ω, α, β), run the recursion by hand from σ₀² and compute the five likelihood terms; identify which day hurts the likelihood most and why.
2. Derivation skipped: derive the ARCH-LM statistic for p = 1 from the LM principle — score and information under H₀ (α = 0), assemble, and show the algebra collapses to $TR^2$ of the auxiliary regression.
3. Boundary probe: fit (conceptually or on supplied numbers) a series that is ACTUALLY i.i.d. Gaussian: the MLE drives α̂ toward 0, the LM test accepts, and the likelihood ridge vanishes — what the machinery reports when the effect is absent; contrast with the near-IGARCH ridge case.
4. Claim to refute: "since returns are fat-tailed, fitting with a Gaussian likelihood gives wrong parameters — a Student-t likelihood is mandatory." Refute with QMLE: consistency survives misspecification; what changes is the SEs (sandwich) and efficiency; state when the t-likelihood genuinely matters (tail-sensitive objectives), citing Bollerslev eq 25.
5. Research-shaped: reproduce Hull's published (ω, α, β) on the same-period S&P data (or supplied returns): report your estimates with sandwich SEs and the persistence α+β; agreement = within 2 SEs of the published values.
6. Mixed/spaced (E3): run the ARCH-LM test on (a) raw returns, (b) GARCH-standardized residuals from your fit — significant then not; connect to the classical-ml residual-diagnostics habit (the test is the same move as heteroskedasticity checks there).
7. FORWARD (E7): from the fitted parameters, produce the 1-to-60-day forecast-vol term structure on a calm day and on a crisis day (Hull eq 23.14); note the two curves' shapes (upward from calm, inverted from crisis). Solution: these are exactly the shapes the implied-vol term structure displays — laying the fitted curve against the market's is the next lesson → Ref realized-implied-smile.

## ARC
- Inherits: the GARCH family and its theory (arch-garch); the entire estimation stack from classical-ml (MLE, information, sandwich, diagnostics) — reused, not retaught.
- Contributes: the fitted model — likelihood recursion, the test, the decoupling and QMLE theorems, and a reproduced published fit with the crisis readable in its σ_t path.
- Hands off: the fitted forecast against the market's implied quote — the module's confrontation → realized-implied-smile; the from-scratch build → garch-lab.
- Spine step: "Returns confess: volatility clusters, tails are heavy…" (step 8).
