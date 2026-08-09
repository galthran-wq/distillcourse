# Research brief: churn-and-the-sbg-model (Churn and the shifted-beta-geometric model)

status: planned
module: customer-base
type: core
goal: Fit the sBG model to a retention series by maximum likelihood and project the curve beyond the observed horizon

The module's heaviest and most rewarding lesson: the full derive → fit →
project → validate loop on real published data. Business word: churn.
Academic layer: sBG (beta-geometric mixture), MLE, the sorting effect.
Dig-deeper: Fader & Hardie "How to Project Customer Retention" (2007).

## ARC (L10)

- **Inherits:** S(t), r_t, censoring (retention-and-survival) and its
  closing mystery: observed retention rates RISE with tenure.
- **Contributes:** Spine step 2's opening move: "heterogeneity plus sorting
  makes cohorts look increasingly loyal while no customer changes" — the sBG
  model, its MLE fit, the projection result (2–4% error at year 12 vs
  30–92% for regressions), and the sorting-effect formula
  r_t = (β+t−1)/(α+β+t−1).
- **Hands off:** A fitted S(t|α,β) that customer-lifetime-value discounts
  into money: "the same machinery prices a customer" (spine step 2 caption).

## Sources to consult

- **Fader & Hardie 2007, "How to Project Customer Retention"** — the whole
  paper is this lesson's skeleton:
  - pp.78-80, Table 1, Figs 1-2: linear/quadratic/exponential fits on 7
    years of the High End and Regular segments; R² .922/.998/.963 yet
    year-12 errors −81%/+92%/−30%.
  - p.80, eq 3-6: the coin-flip story; shifted-geometric individual;
    Beta(α,β) heterogeneity; P(T=t) and S(t) via beta functions.
  - p.81, eq 7-8: forward recursion; r_t = (β+t−1)/(α+β+t−1); the "ruse of
    heterogeneity" (Vaupel & Yashin term), pp.81-82.
  - pp.82-83, Figs 4-6: headline validation (2%/4% error), retention-rate
    fit, the two estimated Beta densities (High End α=0.668, β=3.806, mean
    churn 15%; Regular α=0.704, β=1.182, mean churn 37%).
  - Appendix B: the literal Excel recipe — L(α,β) as products of P(T=t) and
    S(7) terms (eq B1-B3), cell formulas, Solver setup, LL trace −2115.5 →
    −1611.2, second start 0.01/0.01 → same MLE.
- **ART Forum Part 1** (appliedproba-intro-2016.txt) pp.26-42 — the
  pedagogical derivation to follow: geometric individual → 3-point discrete
  mixture of θ → 10-point → continuum limit motivating Beta ("more flexible
  without sacrificing parsimony"); LL contour plot p.43; year-over-year
  g(θ|survival) densities pp.47-51 (the surviving population thins toward
  low θ — sorting made visible).
- **Fader & Hardie 2009** (probabilitym-.txt) p.67 — the magazine renewal
  stat (30/50/75%) reframed as pure sorting; Weibull-gamma pointer for when
  sorting alone genuinely fails (Schweidel et al. 2008).
- **Skok** — customer vs revenue churn distinction: PLANT one sentence, but
  the full worked example belongs to mrr-nrr-and-negative-churn (say so).

## Key points the lesson must cover

1. **The curve-fitting failure first** (flaw-first progression): fit
   linear/quadratic/exponential to years 1-7 of the real High End data, show
   the in-sample R² (.998!) and the year-12 disasters. In-sample fit says
   nothing about extrapolation. Exact numbers are the keepers: −81%, +92%,
   −30%.
2. **The coin-flip story** (explicitly a "paramorphic representation" — keep
   the authors' honesty): individual churn probability θ constant ⇒
   shifted-geometric lifetime; heterogeneity θ ~ Beta(α,β). Derive P(T=t)
   and S(t); the discrete-mixture → Beta limit from ART Part 1 is the
   recommended pedagogical path.
3. **The sorting effect** (the module's intellectual payoff): derive
   r_t = (β+t−1)/(α+β+t−1) — increasing in t with NO individual change.
   Refutation schema (L13): the documented misconception is "customers grow
   more loyal with tenure" (Fielding's magazine numbers are quoted as
   evidence for it); the sBG explains the same numbers with constant
   individuals. Discriminating example: what data WOULD distinguish
   (individual-level panel; Weibull-gamma when sorting fails).
4. **MLE in five columns**: the likelihood from (churned-at-t counts,
   survivors-at-7 count); forward recursion so no beta functions are
   evaluated; the spreadsheet layout and Solver; multiple starts reaching
   the same optimum. This is where the audience's MLE background cashes in.
5. **Validation and the fitted populations**: 7-year fit → year-12 within
   2-4%; Beta density shapes (reverse-J both segments; High End mean churn
   15% vs Regular 37%); the four qualitative Beta shapes (Fig 3) as
   manager-facing vocabulary.

## Set pieces and worked examples to recreate

- **The adversarial comparison** (Figs 1-2 vs Fig 4): same task, regressions
  vs sBG — recreate as our own charts from Table 1's data (transcribe from
  cached text).
- **The Excel/Solver appendix as a worked example**: we translate to a
  five-line Python/numpy MLE, but SHOW the original worksheet as an
  artifact — the paper's thesis is "this fits in a spreadsheet".
- **g(θ) year over year** (ART pp.47-51): the surviving population's churn
  distribution shifting left — sorting animated.
- **Magazine renewal rates 30/50/75%** (2009 paper): the in-the-wild
  instance; also Vodafone/Netflix corroboration slide (ART Part 2 p.17).

## Pitfalls / subtleties to flag

- sBG is contractual/discrete-time only — its cell in the 2×2 taxonomy;
  repeat-purchase-models generalizes. One sentence, forward pointer.
- The paper prints α=0.668 AND 0.688 for High End (OCR/typo); Appendix B's
  0.668 is authoritative (reader note).
- "Retention improves with tenure" is not always pure sorting — real
  duration dependence exists in some settings (Schweidel et al.); the sBG is
  the null model to beat, not a law.
- Beta-function overflow: compute with the forward recursion or log-gamma,
  never naive B(α,β) ratios — mirror of the paper's own advice.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the seduction**: years 1-7 High End data
   with quadratic fit overlaid, R²=.998 labeled; the extrapolated years 8-12
   drawn dashed, actuals as dots, +92% gap annotated. Recreate from Table 1
   data (idea: paper Figs 1/4 merged into one panel per model).
2. `draw:` `<FigureSequence>` (5 frames) — **from one coin to a population**:
   frame 1 one customer, one biased coin, geometric survival; frame 2 three
   customer types (θ=.1/.3/.5) each with their own S(t); frame 3 their
   mixture's S(t) — already convex; frame 4 the θ-histogram becomes a Beta
   density; frame 5 the sBG S(t) with (α,β) labeled. ART Part 1 pp.26-42
   derivation as the storyboard.
3. `draw:` single `<Figure>` — **sorting, not loyalty**: two-panel — left,
   g(θ) at t=0 vs t=4 (mass shifting left as high-θ customers exit); right,
   r_t rising along (β+t−1)/(α+β+t−1). Inspired by ART pp.47-51.
4. `draw:` single `<Figure>` — **the four Beta shapes** (paper Fig 3): 2×2
   panel of densities by α,β ≷ 1, each labeled with its manager reading
   (polarized / homogeneous / J / reverse-J).
5. `source:` **howto-fig-b1-excel-worksheet** — save as
   `sbg-excel-worksheet`. Reader must see: the five columns (t, P(T=t),
   S(t), #active, #lost), the α/β/LL cells, and that this really is a small
   ordinary spreadsheet. Placement: float-right beside the MLE section;
   caption quotes the abstract's promise ("can be implemented in a simple
   Microsoft Excel spreadsheet"). A redraw would just be our table again —
   the point is the artifact.
6. `source:` **howto-fig-b2-solver-settings** — save as
   `sbg-solver-dialog`. Reader must see: target cell $B$3 Max, changing
   cells $B$1:$B$2, the ≥0.0001 constraint. Placement: small, immediately
   under fig 5; caption: "numerically maximize the log-likelihood" made
   concrete, 2005-vintage UI and all. Only worth shipping alongside #5.
7. `draw:` single `<Figure>` — **fit + projection, both segments**: our
   recreation of Fig 4 (fit on 1-7, extrapolate to 12, actuals overlaid,
   2%/4% errors annotated).

## EXERCISE PLAN

1. Warm-up: with α=0.668, β=3.806, compute r_1, r_2, r_10 from the closed
   form and S(3) via the recursion. (Unfamiliar computation.)
2. Boundary probe: take β→∞ with α/(α+β) fixed at c — show g(θ) collapses to
   a point, r_t becomes constant, and sBG degenerates to the geometric
   model; state which observed feature (rising r_t) now cannot be produced.
   The heterogeneity assumption is exactly what buys the rise.
3. Claim to refute: "Our renewal rate climbed from 60% to 85% over four
   years, so onboarding investments made customers more loyal." Using the
   fitted sBG (or the magazine 30/50/75 numbers), produce the same climb
   with constant individuals; then state what additional data would separate
   the two stories.
4. Derivation the lesson skipped: derive E[θ | survived t periods] =
   α/(α+β+t) and verify it equals 1 − r_{t+1}; interpret as the posterior of
   a surviving customer — sorting as Bayesian updating.
5. Research-shaped: reproduce the Regular segment's MLE (α=0.704, β=1.182)
   from the paper's data table with your own optimizer; state the LL at the
   optimum and at α=β=1, and check the year-12 projection error ≈ +2%.
6. FORWARD (E7): compute the expected discounted number of renewals
   Σ_t S(t)/(1+d)^t for the High End segment at d=10%, and compare with
   S̄·(lifetime from 1/E[θ]). Solution: the first object is (up to margin)
   the CLV the next lesson defines; the second is the naive formula it
   corrects; `<Ref>` customer-lifetime-value.
7. Spaced (E3, lesson 2): the sBG likelihood uses "#lost at t" and
   "#active at 7" — mark which is the censored term and which cells of the
   cohort matrix each comes from.
