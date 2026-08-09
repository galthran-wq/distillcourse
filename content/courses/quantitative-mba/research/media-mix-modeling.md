# Research brief: media-mix-modeling (Marketing mix modeling: adstock, saturation, and Bayesian regression)

status: planned
module: growth-channels
type: core
goal: Estimate channel response with an adstock-plus-Hill regression and diagnose which parameters the data can and cannot identify

Channel measurement from the top. Business words: MMM, carryover,
diminishing returns. Academic layer: Broadbent adstock, Hill functions,
Bayesian regression, identifiability. Dig-deeper: Jin et al. 2017; Robyn
paper.

## ARC (L10)

- **Inherits:** roas-and-max-bid's marginal-vs-average close (rising
  marginal CPA = a curve to fit) and Part II's causal discipline
  (regression on observational data carries selection bias; DiD's
  parallel-trends honesty is the register).
- **Contributes:** Spine step 11's first half: channel measurement as
  observational inference — the two transformations (carryover,
  saturation), the canonical Bayesian MMM, and the identifiability
  warnings that make honest use possible.
- **Hands off:** Bottom-up credit assignment (attribution) next lesson;
  the Hill curve returns as the allocation object in channel-portfolio;
  the adstock recursion returns as content capital in
  seo-and-content-economics.

## Sources to consult

- **Broadbent 1979 (FULL, cached oneway-)** — the origin layer:
  - Sec. 3 pp.145–147: the adstock coinage, the Koyck weight formula,
    the half-life argument ("is 0.9→0.95 important?") and conversion
    n·log L = log(1/2); modal half-life 5 weeks across 28 brands ("90%
    of short-term effects over in three months").
  - Sec. 5 pp.152–154: the Zielske match (N=13, s=70.3, L=0.84) and
    dynamic-equilibrium arithmetic; steady state under continuous spend.
  - Sec. 6 + p.166 table: the five-brand base/slope worked
    interpretation (Brand D's base 12 = long-term residual; Brand B
    needs 70→110 TVRs to match C).
  - Sec. 7.4: residual variance decomposed into sampling noise vs
    missing variable — a reusable diagnostic template.
- **Jin et al. 2017 (FULL, cached bayesianmeth)** — the model layer:
  - §2.1 eq.1–3 adstock (geometric + delayed); §2.2 eq.4–5 Hill, the
    Fig-2 near-unidentifiability pairs ((0.5,1,0.3) vs (0.95,0.748,
    0.393)); §2.3 eq.7 the full model (order: adstock then Hill).
  - §4 eq.10–11 ROAS/mROAS as counterfactual simulations pushed through
    posterior samples (never plug point estimates).
  - §5–6: priors table; Table 4 bias — response underestimated 18–40%
    at 2yr weekly, fine at 60yr; carryover parameters recover better
    than shape.
  - §7: prior sensitivity (weak data ⇒ priors matter); §8: real shampoo
    case — four models, near-equal likelihoods, BIC picks parsimonious,
    ROAS answer moves anyway (Fig 14); orthogonalization trick (−0.98
    collinearity, 3040s→75s); residual autocorrelation admission.
    Appendix: runnable STAN model.
- **Robyn paper (FULL, cached)** — the deployed layer:
  - The Act–Infer–Calibrate–Select–Prescribe chain (Fig 2) as the
    lesson's process frame; ridge-not-LASSO rationale; the triple
    objective NRMSE + Decomp.RSSD + MAPE.LIFT; the one-in-ten rule;
    red-flag diagnostics (baseline-dominated waterfall, exponential
    response curves, diverging fit); "calibrate, calibrate, calibrate";
    budget allocator modes.
- **Part II tie**: incrementality experiments (holdouts/geo) are the
  calibration anchor — MMM without experiments inherits every
  observational bias (Ref difference-in-differences,
  attribution lesson forward).

## Key points the lesson must cover

1. **Why MMM exists**: per-click measurement dies (offline, ATT/privacy,
   cross-device); regression on aggregate spend is the fallback with a
   40-year lineage (1979 TV → 2017 Bayesian → 2020s open source).
2. **Carryover**: adstock as a geometric stock; half-life reporting
   convention; delayed adstock for lagged peaks. Derive steady-state
   awareness under constant spend (Broadbent's equilibrium).
3. **Saturation**: Hill with (K, S); concave vs S-shaped; the reach
   curve special case; marginal vs average response read off the curve
   (this is roas-and-max-bid's exercise 6 formalized).
4. **The model and its fitting**: eq.7; why Bayesian (short data,
   priors as stated assumptions); ROAS/mROAS as posterior counterfactual
   pushes.
5. **The traps, with numbers** (flaw-first climax): (a) identifiability
   — indistinguishable curves from wildly different parameters (Fig 2
   pairs); (b) small-sample bias 18–40%; (c) confounding by design —
   spend follows demand/seasonality (activity bias); (d) model-choice
   sensitivity — four models, equal fit, different ROAS. The fixes:
   priors on the curve, controls, and above all calibration against
   lift experiments (Robyn's MAPE.LIFT; the incrementality spectrum).

## Set pieces and worked examples to recreate

- Broadbent's five-brand table (p.166): recompute the response/adstock
  reading — which brand's base vs slope story; the 70→110 TVR budgeting
  answer.
- The Fig-2 unidentifiability pairs plotted from their formulas — our
  own recreation, exact parameters from the paper.
- The Zielske decay match: adstock's fitted curve vs the 1959 recall
  data shape.
- The shampoo four-model comparison: BIC table (98.12/74.81/74.76/51.49)
  + the ROAS densities moving across models.
- Robyn's one-in-ten rule applied to the course case (10 channels ⇒
  2 years weekly minimum).

## Pitfalls / subtleties

- Order of transforms (adstock then Hill) is a modeling choice — Jin et
  al. say so; note it once.
- MMM revenue decompositions are NOT incrementality unless calibrated —
  the next lesson owns the full argument; here one planted sentence.
- Broadbent's dependent variable is ad AWARENESS, Jin's is sales — say
  so when borrowing his numbers.
- Robyn's Efficiency/one-pager jargon: use sparingly; the concepts, not
  the product tour.
- Never fit MMM in the lesson prose to fake precision — worked numbers
  come from the papers' own tables.

## FIGURE PLAN

1. `draw:` single `<Figure>` — adstock weights: geometric decay bars at
   α=0.5/0.7/0.9 with half-life markers; second panel delayed adstock
   peaking at θ=5 (recreation of Jin Fig 1's idea).
2. `draw:` single `<Figure>` — Hill gallery: S<1 concave, S=1 reach,
   S>1 sigmoid at fixed K; K marked as the half-saturation point;
   marginal-response tangents at two spend levels (recreation of Jin
   Fig 2's left panel idea).
3. `draw:` single `<Figure>` — THE identifiability exhibit: the two
   near-coincident βHill curves from wildly different (K,S,β) triples,
   parameters labeled, divergence beyond the observed spend range
   shaded (exact pairs from Jin §2.2).
4. `draw:` `<FigureSequence>` (4 frames) — one channel's spend series
   transformed: raw spend → adstocked → saturated → contribution added
   into ŷ against actual sales. One transform per frame.
5. `source:` **oneway-fig5-response-adstock** — save as
   `broadbent-response-adstock-1979`. Reader must see: the hand-drawn
   five-brand response/ad-stock lines, A–E labels. Placement:
   float-right beside the origin-story section; caption: the 1979
   diagram the whole field descends from. The hand-drawn artifact is
   the point; our redrawn version of the CONTENT appears as fig 1–2.
6. `source:` **bayesianmeth-real-model-comparison** — save as
   `mmm-model-choice-moves-roas`. Reader must see: four colored
   posterior ROAS densities for the same channel under Models I–IV,
   medians visibly apart. Placement: centered in the traps section.
   Real fitted output — a redraw would fabricate the evidence.
7. `draw:` single `<Figure>` — the calibration loop: MMM posterior →
   lift-test result → recalibrated posterior; the
   Act–Infer–Calibrate–Select–Prescribe cycle compressed to our house
   style (idea from Robyn Fig 2).

## EXERCISE PLAN

1. Warm-up: compute adstock for a 6-week spend vector at α=0.6 (L=6),
   report the half-life, and the steady-state stock under constant
   spend 100. (Unfamiliar computation.)
2. Boundary probe: set S→∞ in the Hill function — response becomes a
   step at K; show the regression gradient vanishes almost everywhere
   and explain why the sampler cannot learn K there; which prior
   assumption rescues it.
3. Claim to refute: "Our MMM has R²=0.97, so its ROAS estimates are
   trustworthy." Use the four-model shampoo case (near-identical
   likelihoods, different ROAS) and the 18–40% small-sample bias to
   name the two reasons fit ≠ identified causal response.
4. Derivation the lesson skipped: derive Broadbent's half-life
   conversion n = log(1/2)/log(L) from the geometric weights, and
   verify the modal 5-week half-life implies ~90% of effect within 3
   months (the paper's own gloss).
5. Research-shaped: reproduce the Fig-2 unidentifiability numerically —
   plot both βHill curves on [0,1], report their max absolute gap
   in-range vs at x=1.5; state what spend experiment would separate
   them (spend outside the historical range — and why that's exactly
   what a lift test does).
6. FORWARD (E7): the fitted Hill curve gives mROAS at current spend for
   two channels: 2.1 and 0.9. Budget is fixed — compute the transfer
   direction and the stopping condition. Solution: equalized mROAS is
   the channel-portfolio allocation rule; `<Ref>` channel-portfolio.
7. Spaced (E3): MMM's confounding-by-seasonality is Part II's selection
   bias — write the DiD-style identity showing what the controls z_t
   must absorb for β to be causal, and which Part II design (geo
   holdout) tests it (Ref difference-in-differences).
