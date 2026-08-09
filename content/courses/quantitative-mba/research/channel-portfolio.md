# Research brief: channel-portfolio (The channel portfolio: saturation, allocation, and platform risk)

status: planned
module: growth-channels
type: core
goal: Design a budget allocation across channels that equates marginal returns under saturation, and evaluate concentration and platform risk

The module's synthesis-before-application: every channel now has a
model; this lesson allocates across them. Business words: channel mix,
diversification, platform risk. Academic layer: constrained allocation
(the Lagrangian again), decision under posterior uncertainty,
concentration risk. Dig-deeper: Jin et al. §4.2; Robyn allocator;
Traction ch.3.

## ARC (L10)

- **Inherits:** Hill saturation and mROAS (media-mix-modeling),
  attribution/incrementality-corrected channel values, PLG/sales/content
  economics (their non-paid cost structures), the shadow price μ
  (bidding-and-pacing), Bullseye's focus doctrine.
- **Contributes:** Spine step 13's principle: allocate by MARGINAL
  return at a portfolio-wide shadow price; respect posterior
  uncertainty; and price the risk no ROAS shows — concentration on a
  repriceable platform.
- **Hands off:** zynga-channel-collapse runs the platform-risk case on
  real filings; the allocation table feeds the capstone's channel plan
  and financial-model's acquisition drivers.

## Sources to consult

- **Jin et al. §4.2 (FULL)** — optimal-mix formulation (eqs 12–16):
  maximize predicted sales s.t. budget; the two Bayesian summaries —
  optimize-the-posterior-mean vs per-draw optima; Fig 15's BIMODAL
  optimal-TV-share posterior (all-in or nothing) — the lesson's
  uncertainty set piece.
- **Robyn paper (FULL)** — the budget allocator (AUGLAG/SLSQP over
  saturation curves; max_response vs target_efficiency modes) as the
  deployed instance; one-in-ten data floor as a portfolio-size limit.
- **Balseiro & Gur** — the dual variable reused: at the optimum every
  active channel's marginal value per dollar equals μ (portfolio-wide
  complementary slackness) — same theorem, one level up.
- **Traction ch.3 (FULL)** — focus vs diversify: Thiel one-channel
  claim, saturation-then-repeat (stair-step), re-running Bullseye; the
  "channels degrade" claim now formalized.
- **Attribution lesson's blend** — experiment-anchored channel values
  (share × incrementality) as the allocator's input, not raw ROAS.
- **Zynga filings (forward)** — one-sentence teaser only; the case is
  next lesson's.
- **Easley & Kleinberg ch.17** (network-effects tipping) — optional ★
  aside: platform pricing power over dependent complementors.

## Key points the lesson must cover

1. **The allocation theorem**: with concave channel response f_i
   (Hill), max Σ f_i(x_i) s.t. Σ x_i = B ⇒ f_i′(x_i) equal across
   funded channels (= μ), zero-funding channels have f_i′(0) < μ.
   Derive in three lines; connect to the pacing dual (same μ logic).
2. **Marginal vs average, terminally**: average ROAS ranks channels
   wrong under saturation; the reallocation direction comes from
   mROAS; a two-channel worked example where the "best" channel by
   average is the one to CUT.
3. **Uncertainty is not decoration**: the posterior optimal mix can be
   bimodal (Jin Fig 15); allocate by expected response over the
   posterior (or robustly), not by plugging point estimates; small
   reallocation steps as sequential experimentation (Part II bandits
   echo — allocation IS an explore/exploit problem, Ref
   multi-armed-bandits).
4. **Stage logic**: early = Bullseye focus (one channel, marginal
   returns far above μ everywhere else); scale = diversify as the lead
   channel's f′ falls to μ; re-test cadence because curves shift
   (creative fatigue, competition, platform pricing).
5. **Platform risk as covariance**: channels owned by one counterparty
   (one ad platform, one app store, one search algorithm) share a
   common shock — a policy change moves the whole portfolio at once;
   concentration metrics (share of CAC-weighted acquisition via one
   counterparty); the rent extraction logic (a platform that sees your
   margin can reprice to capture it). Quantify with a two-scenario
   expected-value exercise, not doom prose.

## Set pieces and worked examples to recreate

- The three-channel allocation worked end to end: Hill curves with
  given (K,S,β), budget 100 — solve f′ equalization numerically;
  compare with equal-split and with average-ROAS-proportional splits
  (both worse, by computed amounts).
- The bimodal-posterior story (Jin Fig 15 retold): two posterior draws
  imply opposite corner solutions; expected-response allocation sits
  between and why.
- The concentration dashboard for the course case: % of new customers,
  % of spend, and % of contribution via each counterparty — the
  portfolio table the capstone reuses.
- Stair-step re-read: Bullseye's find→saturate→repeat as motion along
  f′ curves.

## Pitfalls / subtleties

- Channel responses interact (search brand terms harvest demand other
  channels create) — the additive model is the approximation; MMM
  lesson's caveat carries over; one sentence.
- Non-paid channels enter the same allocator via NPV-per-marginal-
  dollar (content lesson's exercise 6) — time horizons must match
  (discounted, not period ROAS).
- Sales capacity is stepwise, not smooth — the marginal-equalization
  logic holds between steps; note the integer wrinkle.
- Do not present diversification as free: Thiel/Bullseye's focus
  argument is about learning efficiency at small scale — the lesson
  reconciles, not arbitrates.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the master allocation picture: three
   Hill curves with current spend dots, tangent slopes drawn, the
   equalized-slope allocation marked; μ as a horizontal
   marginal-return line.
2. `draw:` `<FigureSequence>` (3 frames) — reallocation: frame 1
   unequal marginals (2.1 vs 0.9); frame 2 budget shifts along
   arrows; frame 3 equalized at μ, total response gain tallied.
3. `draw:` single `<Figure>` — average-vs-marginal trap: one saturated
   channel with high average ROAS but flat tangent vs a fresh channel
   with lower average, steeper tangent; the cut/grow labels reversed
   between the two rankings.
4. `draw:` single `<Figure>` — posterior uncertainty: spaghetti of
   response curves drawn from the posterior for one channel; the
   bimodal histogram of per-draw optimal shares beneath (idea from
   Jin Fig 15; our synthetic recreation clearly labeled synthetic).
5. `draw:` single `<Figure>` — the concentration dashboard: stacked
   bars of acquisition, spend, and contribution by counterparty
   (three platforms + owned channels) with a one-counterparty share
   callout — the table the Zynga lesson will fill with real numbers.

## EXERCISE PLAN

1. Warm-up: two channels, f₁′(x)=10/(1+x), f₂′(x)=6/(1+0.5x), budget
   10 — solve the equal-marginal allocation. (The theorem once.)
2. Boundary probe: let channel 2's curve be linear (no saturation,
   f₂′ constant) — show the optimum is corner allocation until
   channel 1's marginal falls to that constant; connect to why
   startups correctly single-channel early (Bullseye focus as the
   corner solution, not a heuristic).
3. Claim to refute: "Cut the channel with the worst ROAS." Construct
   the case where the worst-average channel has the highest marginal
   return (early on its curve) and the reallocation goes TOWARD it;
   name the statistic that should have been compared.
4. Derivation the lesson skipped: prove the equal-marginal condition
   via the Lagrangian and complementary slackness, including the
   zero-spend condition f_i′(0) ≤ μ — the full KKT statement in the
   course's notation.
5. Research-shaped: from Robyn's stated allocator modes, formalize
   target_efficiency (hit ROAS target R) as a constraint swap in the
   same program; derive what replaces μ and when the two modes give
   the same allocation.
6. FORWARD (E7): your portfolio acquires 78% of customers through one
   platform whose take rate rises from 20% to 30%. Recompute each
   channel's contribution margin and the new optimal allocation;
   compute portfolio contribution before/after. Solution: a single
   counterparty repricing moved every number at once — the Zynga
   filings show this happening to a public company in real time;
   `<Ref>` zynga-channel-collapse.
7. Spaced (E3): sequential reallocation under uncertainty is a bandit
   with correlated arms — state the mapping (arms=channels,
   reward=marginal contribution) and one reason UCB-style optimism
   fits channel testing (Ref multi-armed-bandits).
