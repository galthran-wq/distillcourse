# Research brief: esop-and-option-pricing (Employee options and binomial pricing)

status: planned
module: startup-finance
type: core
goal: Compute employee-option values with the binomial risk-neutral model and interpret common stock itself as an option on firm value

The pricing lesson: replication forces a price. Business words: stock
options, strike, vesting, 409A. Academic layer: CRR binomial model,
risk-neutral valuation, Black–Scholes as the limit, equity-as-option.
Dig-deeper: Cox–Ross–Rubinstein 1979 (full); Black–Scholes 1973
(full); Luenberger chs. 16–17 (toc-only).

## ARC (L10)

- **Inherits:** the waterfall's kinked payout diagrams (previous
  lesson's forward exercise: common IS a call struck at total
  preferences); discounting (Part IV lesson 1).
- **Contributes:** Spine step 17 opens: a two-state replication
  argument prices any payoff diagram with no probabilities; the
  binomial tree, risk-neutral p, convergence to Black–Scholes; ESOP
  mechanics and the honest value of a grant; the corporate reading
  (equity as a call).
- **Hands off:** the same machinery generalized to the firm's own
  decisions (real-options, next); risk-neutral discipline echoes in
  the DCF's certainty-equivalent aside.

## Sources to consult

- **CRR 1979 (FULL, cached optionpricin-)**:
  - Sec. 2 THE opening example: S=$50, S* ∈ {25,100}, K=$50, r=25% —
    "write 3 calls, buy 2 shares, borrow $40" breaks even in both
    states ⇒ C=$20, no probabilities. Reproduce verbatim-close.
  - Sec. 3: Δ and B formulas (eq 1); C=[pC_u+(1−p)C_d]/r with
    p=(r−d)/(u−d) (eq 2–3); "bulls and bears must agree"; n-period
    recursion; the boxed binomial formula; the trinomial-
    impossibility argument (two states are exactly what replication
    can span).
  - Sec. 4: the S=80 three-period worked tree with Δ at every node;
    the mispricing-arbitrage walkthrough; the do-it-wrong rerun.
  - Sec. 5–6: parameterization u=e^{σ√(t/n)}; convergence to
    Black–Scholes; Table 2 (n=5 within $0.25; n=150 to the penny);
    American puts and early exercise (starred at most).
  - Footnote 1: corporate equity is a call on the firm — the bridge.
- **Black–Scholes 1973 (FULL, cached thepricing-)**:
  - The formula (eq 13) stated as the limit object; the $15-stock
    hedge-slope example (p.641–2) as the continuous-hedging
    intuition; Fig 1's bounds-and-maturity curves.
  - The corporate-liabilities half (pp.649–652): stock as a call on
    firm value; bonds = firm minus call; the compound-option "option
    on an option" line; stockholder-bondholder transfers — this is
    the waterfall lesson's kinks priced, and the risk-shifting
    insight (equity holders love variance) that venture-economics
    picks up.
- **ESOP mechanics** (no single canon source — assemble from YC safe
  primer's ecosystem register + Venture Deals toc-level + standard
  institutional facts, kept generic): grant/strike/vesting/cliff/
  exercise window; 409A common valuation vs preferred price — the
  waterfall lesson EXPLAINS the gap (common's call value < preferred
  claim value); ISO/NSO named only.
- **Luenberger (TOC-ONLY)** — chs. 16–17 as the math-first reference
  pointer.

## Key points the lesson must cover

1. **The replication argument first** (CRR Sec. 2 verbatim-close):
   one period, two states, three instruments ⇒ the option's price is
   forced; risk preferences and true probabilities never enter.
   Then the general one-period formula and the risk-neutral reading
   of p (the probability that makes the stock a fair bet).
2. **The tree**: backward induction; the 3-period S=80 worked
   example with Δ evolving (the hedge is dynamic); convergence —
   Table 2's n=150-to-the-penny; Black–Scholes stated as the limit
   formula with its inputs named (σ enters; μ does not — the
   punchline repeated).
3. **ESOP mechanics and the honest grant value**: strike at 409A
   common value; vesting/cliff as an option portfolio delivered over
   time; the offer-letter computation — value a real-shaped grant
   (4-year vest, strike $2.10, preferred $8.40) on a binomial tree
   over exit scenarios; why "your options are worth (shares ×
   preferred price − strike)" is wrong in both directions
   (preferences above; optionality below).
4. **Equity as a call** (BS pp.649–652 + CRR fn.1): firm value V,
   debt/preference stack D ⇒ common = call(V, strike D) — last
   lesson's hockey stick priced; the 409A gap explained
   quantitatively; risk-shifting: equity's value rises with σ —
   why founders and late-stage preferred disagree about risky
   strategies (seeds venture-economics).
5. **Boundaries**: replication needs tradeable underlying and known
   σ — private-company applications are model-based appraisals, not
   arbitrage; state the epistemic downgrade explicitly.

## Set pieces and worked examples to recreate

- CRR's $50 opening example, then the same numbers re-derived via
  p=(r−d)/(u−d) — two routes, one price.
- The 3-period S=80 tree with the Δ column (CRR Sec. 4).
- The offer-letter valuation: grant of 20,000 options on the course
  case's post-A cap table; tree over exit scenarios THROUGH the
  waterfall (option pays only where common clears water) — the
  module's three lessons composed.
- The equity-as-call decomposition on the course stack: value of
  common today as call(V, preferences) at two σ's — the risk-
  shifting table.

## Pitfalls / subtleties

- No stochastic calculus (course contract): Black–Scholes appears
  as a limit and a formula, never a PDE; CRR's own "elementary
  mathematics" claim is the license.
- Risk-neutral p is NOT a belief — drill the distinction (the
  standard misconception; L13 slot with the "bulls and bears" quote
  as the refutation anchor).
- American/dividend subtleties: one starred paragraph max (CRR
  Sec. 6 pointer).
- 409A practice uses appraisal methods (OPM backsolve!) that are
  literally this lesson's model run backwards — one delicious
  sentence, no valuation-industry detour.
- Employee options are usually on common WITH transfer restrictions
  and expiry-on-departure — the grant is worth less than the model's
  frictionless number; list the haircuts qualitatively.

## FIGURE PLAN

1. `draw:` `<FigureSequence>` (4 frames) — the replication argument:
   frame 1 the two-state stock and the option's two payoffs; frame 2
   the portfolio (2 shares, −3 calls, $40 debt) in state U; frame 3
   state D — same ending value; frame 4 the forced price C=$20. One
   state/step per frame (CRR Table 1 as inspiration).
2. `draw:` single `<Figure>` — the risk-neutral dial: p=(r−d)/(u−d)
   drawn as the weight that makes the stock earn r; true-probability
   slider crossed out — μ absent from the formula.
3. `draw:` single `<Figure>` — the 3-period tree: S=80 lattice with
   option values and Δ at each node, backward-induction arrows
   (recreation of CRR Sec. 4's typewriter tree in house style).
4. `draw:` single `<Figure>` — convergence: binomial price vs n for
   one option with the Black–Scholes limit line; n=5/20/150 error
   call-outs from Table 2.
5. `source:` **optionpricin-binomial-formula-box** — save as
   `crr-formula-box`. Reader must see: the authors' own boxed
   Binomial Option Pricing Formula. Placement: float-right at the
   general-formula section; caption: the 1979 statement as typeset
   (provenance; our notation sits in the body).
6. `source:` **thepricing-fig1-option-value** — save as
   `black-scholes-fig1`. Reader must see: the 1973 hand-plotted
   option-value curves between the A/B bounds. Placement: beside
   the limit section; caption: the ancestor of every options
   diagram, from the original paper. Historic artifact; our curves
   are drawn fresh elsewhere.
7. `draw:` single `<Figure>` — equity as a call: the waterfall
   lesson's common-payout hockey stick re-labeled as call(V, D),
   with today's value curve (pre-expiry) drawn above the kinked
   intrinsic value; the 409A gap annotated as the vertical distance
   between common's curve value and preferred's claim at V₀.

## EXERCISE PLAN

1. Warm-up: S=40, u=1.5, d=0.75, r=1.05, K=42, one period — compute
   p, C, and the replicating (Δ, B); verify both states. (The
   argument once.)
2. Boundary probe: push d → r (the down state returns the riskless
   rate) — p → 0 and the option price → its discounted down-state
   payoff; then d > r: show p < 0 and name what broke (the no-
   arbitrage condition d < r < u is the theorem's hypothesis, and
   violating it makes the STOCK an arbitrage before the option
   enters).
3. Claim to refute: "The option's value depends on the stock's
   expected return; our stock will probably double, so the model
   undervalues it." Recompute the warm-up with true up-probability
   0.9 vs 0.5 — same price; explain which step of replication
   absorbed the belief (the hedge holds in BOTH states), and where
   beliefs DO enter (today's S).
4. Derivation the lesson skipped: derive the one-period formula for
   a PUT, verify put-call parity C − P = S − K/r on the warm-up
   numbers, and restate parity as a waterfall fact (preference floor
   = put) — the previous lesson's decomposition made exact.
5. Research-shaped: reproduce one cell of CRR's Table 2: price a
   6-month at-the-money call (σ=0.3, r=5%) on trees of n=5, 20, 150
   and report the errors against Black–Scholes — checking the
   paper's convergence claim with your own code.
6. FORWARD (E7): value the SAME investment decision two ways — a
   project you can do now (NPV $300) or wait one period to see which
   state occurs. Price the "wait" alternative as an option on the
   project. Solution: the option to delay is worth more than
   invest-now NPV here — the real-options wedge, next lesson;
   `<Ref>` real-options.
7. Spaced (E3): the offer-letter valuation — 20,000 options, strike
   $2.10, on the course cap table with its preference stack: combine
   the waterfall's common payout (Ref
   liquidation-preferences-and-waterfall) with a two-scenario tree
   and produce the honest expected value vs the naive
   (preferred-price − strike) × shares number.
