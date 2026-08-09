# Research brief: policy-learning-and-targeting (Policy learning and targeting)

status: planned
module: causal-inference
type: synthesis
goal: Evaluate and learn a targeting policy from experimental data with AIPW scores, reproducing the GAIN policy-tree case

MODULE APPLICATION (L16) and course close for Parts I–II. Artifact: the
California GAIN policy tree + QINI evaluation from the Athey/Spiess/Wager
course — a real welfare-to-work experiment turned into an interpretable,
constraint-respecting targeting policy. No new estimation theory beyond
policy value; the module's machinery cashed into a decision.

## ARC (L10)

- **Inherits:** CATE, AIPW scores, cross-fitting, QINI/RATE
  (uplift-and-causal-forests); the whole course's arc from "measure" to
  "decide".
- **Contributes:** Spine step 8's close: "turn 'whom to treat' into an
  optimization with a confidence interval." Policy value E[Y(π(X))],
  its AIPW estimation, learning π over a constrained interpretable
  class (policytree), and the GAIN reproduction with its fairness
  constraint.
- **Hands off:** Course parts III–IV (channels: whom to target is the
  bidding problem's twin; finance: policy value is an NPV) — one
  closing paragraph naming both.

## APPLICATION SPEC (L16)

- **Artifact:** the California GAIN case from the Stanford GSB course's
  Module 6 deck (cached machinelearn-slides-loss-functions.pdf +
  bookdown ch.5-6): a depth-2 policy tree learned by empirical welfare
  maximization on the real GAIN welfare-to-work RCT (Hotz, Imbens &
  Klerman 2006 data), splits on paid-3-quarters-ago / has-children /
  HS-graduate with real leaf ns (2,486 / 2,757 / 7,325 / 6,602),
  explicitly FORBIDDEN from splitting on race or gender; plus the QINI
  evaluation of competing prioritization rules.
- **Module results used:** potential outcomes and RCT identification
  (DiD lesson's algebra, module 3's randomization), AIPW scores +
  cross-fitting (uplift lesson), CATE ranking and QINI (uplift lesson),
  policy value estimators (this lesson).
- **Departures from the idealisation (must be named):** GAIN leaf
  values/tree come from a non-public dataset — the bookdown's public
  runnable twin is the GSS wording experiment (different dataset; say
  which claims rest on which); unconfoundedness is free here (RCT) but
  the deployment population differs from 1990s California welfare
  recipients (external validity); costs of treatment are assumed known
  and constant (the course's uncertain-costs section named); fairness
  constraints change the attainable optimum — a modeling CHOICE, not a
  technicality.

## Sources to consult

- **Athey course bookdown ch.5 (Policy Evaluation)** — policy as
  mapping π: X → {0,1}; value E[Y(π(X))]; sample-mean estimator (RCT
  only) vs AIPW-score estimator (both settings); the case study on the
  GSS data; the region-A/A^c decomposition identities (eq 5.2/5.6-5.9).
- **Athey course bookdown ch.6 (Policy Learning)** — thresholding CATE
  with train/test discipline; the TECHNICAL NOTE: never threshold AIPW
  scores pointwise (too noisy — only averages); empirical welfare
  maximization π̂ = argmax over class Π of mean chosen-arm scores
  (Athey & Wager 2021); policytree depth-2 trees; subgroup discovery
  from a learned policy; learning with uncertain costs (ch.6.5).
- **Module 6 slides** (cached PDF) — the GAIN tree slide (p.46, sourced
  image) with the fairness-constraint framing; the QINI slide (p.36,
  reused from uplift lesson — do not duplicate; reference it).
- **Wager & Athey / uplift lesson** — the scores this lesson consumes.

## Key points the lesson must cover

1. **A policy is the deliverable**: scores were never the product; the
   product is π(x) ∈ {treat, don't}. Policy value defined; the
   difference-in-values as the decision statistic; estimation by
   sample means (RCT) and AIPW scores (general) — with CIs (it's a
   mean of scores; the audience can do this).
2. **The two traps, promoted to rules**: (a) never threshold noisy
   pointwise scores — aggregate first (the bookdown's technical note,
   with a constructed 20-customer demonstration of how thresholding
   noise manufactures a "policy"); (b) never pick and value on the
   same data — train/test or cross-fitting for policies too.
3. **Learning over a constrained class**: empirical welfare
   maximization; why shallow trees — auditability, deployment,
   regulation; the optimization is over POLICIES not predictions
   (loss = negative value, not MSE). Constraints as first-class:
   budget (treat ≤ q%), fairness (forbidden features — and the honest
   note that excluding a feature ≠ excluding its correlates).
4. **The GAIN reproduction**: the experiment, the tree, the leaves,
   the constraint; read the tree as an operator (who gets the
   program); what the leaf ns and values license; compare against
   treat-everyone and treat-by-CATE-decile via QINI thinking.
5. **The course's close (Parts I–II)**: the pipeline stated once —
   cohort data → models → value → experiments → effects → policy —
   each arrow naming its lesson; then the two open fronts (channels:
   where the treated come from; finance: what the value is worth) as
   Parts III–IV.

## Set pieces and worked examples to recreate

- **The 20-customer thresholding trap**: AIPW scores with noise,
  threshold at 0 picks a random-looking "segment"; averaging by
  quintile shows nothing — the trap computed end to end.
- **Policy-value estimation table**: three policies (nobody / everyone
  / tree) × estimated value ± CI on the running case's nudge
  experiment (constructed numbers consistent with earlier lessons).
- **The GAIN tree walk-through** (sourced image + prose): each split's
  business reading; the fairness constraint's effect stated.
- **Budgeted targeting**: treat top-q% by score; value as a function
  of q traced on the QINI curve; the optimal q under a per-treatment
  cost — one worked pass.

## Pitfalls / subtleties to flag

- GAIN's raw data is not public: the tree/leaf numbers are quoted from
  the course's slide (say so); the reader-runnable twin is the GSS
  dataset in the bookdown — keep the two clearly separated.
- Policy value CIs from scores are honest only with cross-fitted
  nuisances and held-out policy choice — repeat the discipline; it is
  the lesson's drumbeat.
- "Optimal" is class-relative: the best depth-2 tree ≠ the best
  policy; the gap is the price of auditability — state, don't lament.
- Fairness-by-feature-exclusion is the weakest fairness notion; name
  it as such with one clause (correlated proxies), no detour into
  fairness literature.
- Course close must stay dry: the pipeline recap is a map, not a
  celebration.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **score → policy**: the τ̂/Γ score axis
   with the decision boundary, the four uplift quadrants shaded by
   verdict, and the two traps marked (pointwise thresholding, same-data
   valuation). (Original.)
2. `draw:` single `<Figure>` — **policy value dissected** (voita rule
   7): the AIPW value estimator with the chosen-arm score term
   bracketed ("each unit contributes the score of the arm the policy
   would give THEM") and the cross-fit folds sketched.
3. `draw:` `<FigureSequence>` (3 frames) — **the thresholding trap**:
   frame 1 twenty true-zero-effect customers' noisy scores; frame 2
   threshold at 0 "finds" a segment; frame 3 quintile averages flat at
   zero — the aggregate view dissolving the mirage.
4. `source:` **machinelearn-gain-policy-tree** — save as
   `gain-policy-tree`. Reader must see: the depth-2 splits, leaf
   actions, real leaf ns, and (in caption) the no-race/no-gender
   constraint. Placement: centered in the GAIN section — real output
   of a real optimization on non-public data; unreproducible, hence
   sourced.
5. `draw:` single `<Figure>` — **value vs treated fraction**: the
   QINI-style curve with a cost line; optimal budget q* at the
   crossing; three policies (everyone / top-q / tree) marked as
   points with CIs.
6. `draw:` single `<Figure>` — **the course pipeline (Parts I–II
   close)**: cohort matrix → fitted models → CLV → experiment →
   CATE → policy, each arrow labeled with its lesson slug — the map
   figure the intro promised, now earned.

## EXERCISE PLAN

1. Warm-up: none (application lesson).
2. Research-shaped (core): from the GAIN slide's tree, write the
   deployment rule as pseudocode, compute the treated fraction from
   the leaf ns, and state which module results license reading the
   leaf assignments as value-improving (EWM + RCT identification).
3. Boundary probe: a budget of q=10% with a QINI curve that is
   concave then flat: show the marginal value of the budget's last
   percentage point → 0 and derive where treating MORE would
   subtract value under a positive per-treatment cost (the do-not-
   disturb region) — the degenerate case where "treat by score" and
   "treat none" coincide.
4. Claim to refute: "Our policy's estimated value beat treat-everyone
   by $120k on the training data, so ship it." Name both traps
   (in-sample policy selection; pointwise-derived policy) and compute
   the honest evaluation plan (held-out AIPW value with CI); state
   the expected direction of the in-sample bias.
5. Derivation the lesson skipped: show the identity value(π) −
   value(treat-nobody) = E[π(X)·τ(X)] and derive why ranking by τ̂
   maximizes the budgeted objective when τ̂ ranks correctly — the
   QINI curve as the empirical version of this identity.
6. FORWARD (E7, course-level): the policy treats customers whose
   retention response justifies a $40 offer. Write the break-even
   condition in terms of τ(x), margin, and the discount rate — and
   note which input the course has not yet derived (the discount
   rate itself). Solution: cost of capital and NPV discipline are
   Part IV's opening subjects; channels that SOURCE the treated
   population are Part III's; the course continues there.
7. Spaced (E3, course-wide): the GAIN program's value estimate is a
   mean of scores — compute its MDE-style sensitivity with module
   3's power formula (n = 13k, score variance given) and state
   whether a $50/participant value difference was detectable; name
   the two lessons whose machinery you just combined.
