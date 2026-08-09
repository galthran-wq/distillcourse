# Research brief: bidding-and-pacing (Budget pacing as constrained optimization)

status: planned
module: growth-channels
type: core
goal: Derive the optimal bid under a budget constraint via Lagrangian duality and analyze adaptive pacing as gradient descent on the dual variable

The bidder's problem, done with the audience's optimization literacy.
Business words: pacing, autobidder, budget. Academic layer: knapsack →
Lagrangian dual → adaptive pacing (Balseiro–Gur), shadow price.
Dig-deeper: Balseiro & Gur 2019.

## ARC (L10)

- **Inherits:** Auction mechanics (what a bid buys, what it pays) and the
  first-price world where shading is the bidder's job (previous lesson's
  close and its exercise 6).
- **Contributes:** Spine step 10's third move: the budget prices itself —
  bid = v/(1+μ), μ updated by a one-line controller; optimality and
  equilibrium guarantees for exactly the algorithm platforms ship.
- **Hands off:** The value v in the bid formula is still unexplained —
  roas-and-max-bid derives it from Part I's CLV model. μ reappears
  portfolio-wide in channel-portfolio.

## Sources to consult

- **Balseiro & Gur 2019 (FULL, cached learningin--)** — the whole lesson:
  - §2: model — repeated second-price auctions, budget B over T rounds,
    target rate ρ = B/T.
  - §3.1 Theorem 1: no strategy beats competitive ratio ρ/v̄ against the
    dynamic hindsight benchmark — the impossibility that frames
    everything; the two-branch adversarial construction (d1/d2 trap) as
    the intuition.
  - §3.2: THE derivation to reproduce — hindsight problem as knapsack
    (eq 1), Lagrangian dual objective Σ(v−(1+μ)d)⁺ + μρ (eq 4),
    pointwise maximizer bid = v/(1+μ); the update
    μ ← P[0,μ̄](μ − ε(ρ − z_t)) and its plain-English controller reading.
  - §3.3–3.4 Theorems 2–3: minimax optimality (matches Theorem 1's bound)
    and stationary-case convergence to hindsight-optimal; rates T^(−1/2).
  - §3.5: real-data section — 13,182 auctions, 2,923 advertisers; pacing
    beats truthful by ~120% when constrained, <1% loss vs hindsight near
    unconstrained; Figure 1.
  - §4–5 Theorems 4–6: simultaneous learning converges (μ* fixed point)
    and pacing is an ε-Nash equilibrium in large markets — state as
    facts with one-sentence intuitions, no proofs.
  - Endnote 1: Facebook/Twitter/DoubleClick pacing docs — the deployed
    referent.
- **Wealth ratio**: ρ/v̄ ≥ 1 ⇒ truthful is optimal ("how rich do you have
  to be to ignore pacing") — keeper.

## Key points the lesson must cover

1. **The problem stated as the reader would state it**: maximize value of
   won auctions s.t. spend ≤ B, over a stream of second-price auctions —
   a knapsack the reader could almost solve, except bids must be causal.
2. **The impossibility first** (flaw-first): no algorithm guarantees the
   hindsight optimum; the adversary's two-branch trap; the best possible
   guarantee is exactly ρ/v̄.
3. **The Lagrangian derivation carried through** (the audience's calculus
   cashes in): dualize, get the pointwise rule bid = v/(1+μ); μ is the
   shadow price of budget — one extra dollar of budget buys μ of value.
4. **Adaptive pacing as dual descent**: the update rule, its controller
   reading (overspend → shade harder), step-size conditions at
   hand-wave depth, and the three-regime guarantee table (stationary /
   adversarial / everyone-paces) — "one dial, three guarantees."
5. **Evidence**: the 120%-over-truthful and <1%-from-hindsight numbers on
   real auction data; when pacing does NOT matter (unconstrained
   advertisers, ρ ≥ v̄).

## Set pieces and worked examples to recreate

- A 6-auction hand example: values and clearing prices given; compute
  hindsight-optimal knapsack, truthful-until-broke, and paced bids at a
  fixed μ; show pacing's ordering (buys the cheap-value auctions,
  skips overpriced ones).
- The dual update run for 5 steps on the same example — μ oscillating
  toward the budget-clearing level; a table, not code.
- The two-branch adversarial trap (§3.1) retold in one figure (see plan).

## Pitfalls / subtleties

- Throttling (random participation) vs bid-shading pacing: platforms use
  both; Balseiro–Gur analyze shading. One sentence of taxonomy.
- The model is second-price; in first-price the same dual variable
  applies to the shaded bid — note, don't derive (the paper's setting is
  DSIC mechanisms).
- ε step-size conditions matter for the theorems; the demo-free lesson
  should present the tuned version, not pretend any ε works.
- Don't confuse μ with margin adjustments — the value v in this lesson
  is still "value per click", deliberately unopened until next lesson.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the knapsack picture: auctions as boxes
   (height value, width price), budget as a shelf length; hindsight
   packing vs truthful-until-broke packing side by side.
2. `draw:` `<FigureSequence>` (4 frames) — the dual derivation: frame 1
   primal with constraint; frame 2 penalized objective with μ; frame 3
   pointwise per-auction decision (v vs (1+μ)d); frame 4 the bid rule
   v/(1+μ) with the μ-dial drawn. One transformation per frame.
3. `draw:` single `<Figure>` — the controller loop: observe value → bid
   v/(1+μ) → observe spend z_t → update μ by ε(ρ−z_t) → repeat; a
   feedback-loop diagram the paper describes but never draws (their
   pseudocode, our figure).
4. `draw:` single `<Figure>` — the two-branch adversarial trap: timeline
   with the switch time τ; branch d1 (high bids then value-level) vs d2
   (high bids then cheap); the payoff table showing why early caution
   and early aggression both lose somewhere.
5. `source:` **learningin-fig1-empirical** — save as
   `pacing-real-data-performance`. Reader must see: left panel —
   attained fraction of hindsight hugging 1 far above the guarantee
   diagonal; right panel — truthful bidding collapsing as B/B0 falls
   while pacing holds. Placement: centered in the evidence section.
   Measured platform data; a redraw would misrepresent it as schematic.
6. `draw:` single `<Figure>` — the three-regime guarantee table
   (stationary / adversarial / simultaneous) recreated as a clean matrix
   (paper's Table 1 restated in house style).

## EXERCISE PLAN

1. Warm-up: with μ=0.25, compute paced bids for values 10/5/2 and state
   which auctions are won at clearing prices 7/4/1.9; total spend vs a
   budget of 6. (Unfamiliar computation.)
2. Boundary probe: set ρ ≥ v̄ (budget ≥ max value per round) — show the
   optimal μ is 0, pacing degenerates to truthful bidding, and Theorem
   1's bound becomes vacuous; the wealth ratio is exactly what the
   guarantee is made of.
3. Claim to refute: "Spend the budget evenly: cap each hour's spend at
   B/24." Construct a value sequence (cheap mornings, dear evenings)
   where uniform throttling loses to a constant-μ policy; name what the
   dual variable equalizes (marginal value per dollar, not dollars per
   hour).
4. Derivation the lesson skipped: from the dual objective, show that at
   the optimum either μ=0 or expected spend = ρ (complementary
   slackness) — and interpret both branches in advertiser language.
5. Research-shaped: reproduce the paper's stationary-case claim on
   simulated data: draw 10,000 (v,d) pairs, run the μ-update at
   ε=T^(−1/2), and report final μ, spend/budget ratio, and value
   captured vs hindsight (expect a few % gap); state what would count as
   agreement.
6. FORWARD (E7): the bid rule needs v, the value of a click. For the
   course case (ARPA, margin, conversion 2% click→signup, 40%
   signup→customer), compute v from CLV and hence the paced bid at
   μ=0.2. Solution: this is the CPC→CPA→CLV chain the next lesson
   formalizes; `<Ref>` roas-and-max-bid.
7. Spaced (E3): the pacing controller is CUPED's cousin in disguise —
   both exploit a known invariant (E[spend]=ρ; E[X^t]=E[X^c]). State
   the analogy precisely and where it breaks (Ref
   variance-reduction-cuped).
