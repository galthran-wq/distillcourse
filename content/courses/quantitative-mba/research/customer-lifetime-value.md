# Research brief: customer-lifetime-value (Customer lifetime value)

status: planned
module: customer-base
type: core
goal: Compute CLV and residual lifetime value as discounted expectations over a fitted churn model

Business word: LTV/CLV. Academic layer: CLV as a discounted expectation
under the survival model; RLV; the Gamma-Gamma pointer for spend.
Dig-deeper: Fader & Hardie's CLV notes; the ART Forum Part 2 deck.

## ARC (L10)

- **Inherits:** A fitted S(t|α,β) and the sorting effect
  (churn-and-the-sbg-model): survivors are systematically better than
  entrants.
- **Contributes:** E(CLV) = Σ m·S(t)/(1+d)^t; the naive m/c formula as the
  constant-retention special case and its systematic underestimate; RLV of
  an in-force customer and why RLV > CLV of a new one.
- **Hands off:** All of it assumes churn is OBSERVED — contractual. The next
  lesson (repeat-purchase-models) removes that assumption. Also feeds the
  unit-economics module: CLV is the numerator of every ratio there.

## Sources to consult

- **ART Forum Part 2** (appliedproba-cba-2016.txt) pp.23, 53-65 — the
  lesson's central worked example: E(CLV)/E(RLV) as discounted sums over the
  survivor function; naive constant-retention extrapolation gives $324 (CLV)
  / $381 (RLV) vs the sBG model's $362 / $568 — a 10%/33% underestimate that
  worsens with horizon — then validated against 12 actual years of renewals
  (true $331/$413, model within a few dollars). The four reference
  time-points for CLV vs RLV.
- **Fader & Hardie 2007** Introduction (p.76-77) — E(CLV) = Σ m·S(t)/(1+d)^t
  as the standard result the projection problem serves.
- **Fader & Hardie 2009** (probabilitym-.txt) p.65, 67 — "discounted
  expected residual lifetime/transactions" as the bridge from P(alive)
  machinery to a CLV number; the GAP FLAG: this article does NOT derive
  Gamma-Gamma — only the pointer to Schmittlein & Peterson (1994) and
  Fader/Hardie/Lee (2005b), with spend assumed independent of frequency.
- **Skok definitions page** (saasmetrics-definitions.txt) — "Customer
  Lifetime = 1/churn" (3%/month → 33 months) and "LTV = ARPA × GM% ÷ churn":
  the folklore this lesson corrects; note Skok flags his own section as
  superseded by a DCF-based treatment.
- **PyMC notebook** (lifetimespym-pareto_nbd.txt) closing section — the
  Gamma-Gamma spend-frequency independence caveat (average spend cannot be a
  covariate and a Gamma-Gamma input at once) — plant for clv-in-production.

## Key points the lesson must cover

1. **Define CLV properly**: expected discounted margin over the remaining
   relationship. Distinguish CLV of a customer-to-be vs residual LV of an
   in-force customer; the four reference time-points (ART p.58).
2. **The naive formula as a special case**: with constant retention r,
   Σ m·r^t/(1+d)^t = m(1+d)/(1+d−r) ≈ m/c for d→0 — derive it, then show
   its assumption (geometric survival, homogeneous) is exactly what the
   sBG refuted. Direction of the bias: heterogeneity ⇒ aggregate S(t) has a
   fat tail ⇒ naive UNDERestimates; keeper numbers $324 vs $362 and $381 vs
   $568, validated $331/$413.
3. **Discounting enters here** (first finance touch of the course): why a
   dollar in month 24 is worth less; d as a given for now — its derivation
   (WACC etc.) is Part IV territory, one sentence.
4. **RLV of survivors**: E[θ|survived t] = α/(α+β+t) falls with tenure ⇒ a
   customer at age 3 is worth MORE going forward than a new one — sorting
   cashing out in money. This inverts naive intuition ("we already
   extracted their value").
5. **Monetary value m**: constant-m assumption; the Gamma-Gamma pointer for
   spend distributions and its independence assumption, honestly flagged as
   out of this course's derivation scope (source gap).

## Set pieces and worked examples to recreate

- **The $324-vs-$362 table** (ART Part 2 pp.53-63): recompute fully in the
  lesson — naive vs sBG-based CLV and RLV, then the 12-year validation. This
  is the lesson's spine; all numbers transcribed in the cached deck text.
- **Skok's lifetime arithmetic** (33 months at 3%/month) as the worked
  folklore case: correct under its assumptions, then broken by a two-segment
  mixture (compute the true expected discounted lifetime for a 50/50 mix of
  1%/10% churners vs the blended-churn formula).
- **A "value of the base" mini-table**: RLV by tenure bucket for the running
  case — the oldest cohorts carry disproportionate value.

## Pitfalls / subtleties to flag

- LTV vs CLV naming: same object; the course says CLV in derivations, LTV
  when quoting practitioner ratios (LTV:CAC). One sentence, then stick.
- Margin m, not revenue: forward pointer to margins-and-the-unit-pnl for
  what m contains; here m is given.
- The naive formula fails in the OTHER direction too when churn is measured
  on a young blended base (overstates churn → understates lifetime) — mix
  effects again; brief, with `<Ref>` cohorts-and-funnels.
- Do not do infinite-horizon vs finite-horizon hair-splitting; state horizon
  convention once (infinite sum, geometric tail from the model).
- Discrete timing conventions (payment at start vs end of period) shift CLV
  by one factor of (1+d)/r-ish; fix a convention, note it.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **CLV dissected in place** (voita figure rule
   7): the sum Σ m·S(t)/(1+d)^t with labeled arrows: m → margin per period,
   S(t) → "still here" (from the sBG), 1/(1+d)^t → "later is worth less";
   under it, the first four terms computed for the running case.
2. `draw:` single `<Figure>` — **survival × discount = value bars**: for
   t=1..12, three bar rows (S(t), discount factor, product); the visible
   fat tail of S(t) carrying value the naive geometric misses.
3. `draw:` `<FigureSequence>` (3 frames) — **naive vs model, horizon
   growing**: frame 1 both CLV estimates at horizon 3 (close); frame 2
   horizon 7 (gap opens); frame 3 horizon 12 with validation dots ($331
   truth vs $324 naive vs $362 model — wait: model $362 vs truth $331 for
   CLV; keep exact roles straight from ART pp.53-63 when drafting).
4. `draw:` single `<Figure>` — **RLV rises with tenure**: E[θ|survived t]
   falling and RLV(t) rising on twin axes; caption ties to sorting.
5. `source:` **appliedproba-rfm-clv-jmr-abstract** — save as
   `rfm-clv-paper-abstract`. Reader must see: the actual JMR title/abstract
   page of "RFM and CLV: Using Iso-Value Curves". Placement: small
   float-right in the dig-deeper/monetary-value section as the canonical
   pointer for where CLV-from-RFM is actually derived. (Optional — drop if
   the lesson runs figure-heavy; priority below figs 1-4.)

## EXERCISE PLAN

1. Warm-up: m=$50/month, constant r=0.97 monthly, d=1% monthly — compute
   CLV by the closed form; then Skok's 1/c lifetime × m and note the
   discounting gap. (Unfamiliar arithmetic chain.)
2. Boundary probe: set d=0 with a fat-tailed S(t) (sBG with α<1): the CLV
   sum diverges or becomes horizon-dominated — show it, and state why a
   positive discount rate is what makes infinite-horizon CLV well-defined.
3. Claim to refute: "Blended churn is 5%/month, so average lifetime is 20
   months and CLV = 20m." Construct the 50/50 mix of 1%/10% churners:
   blended month-1 churn is 5.5%→falling, true expected discounted lifetime
   exceeds the formula's — name the convexity/heterogeneity step the naive
   argument misses (E[1/c] ≠ 1/E[c] in the relevant sense).
4. Derivation the lesson skipped: derive RLV(t) in closed form for the sBG
   by applying the CLV sum to the posterior Beta(α, β+t), and show
   RLV(t+1) > RLV(t).
5. Research-shaped: reproduce the deck's $362 and $568 (sBG CLV and RLV at
   the stated d) from the fitted (α,β) of the previous lesson; state your
   tolerance for agreement.
6. FORWARD (E7): a retailer's customer bought 4 times in year 1, nothing in
   months 13–18. Compute their naive "churned? yes/no" status under three
   arbitrary inactivity windows (6/9/12 months) and watch the answer flip.
   Solution: without observed churn, "alive" needs a probability model of
   purchase timing — the object repeat-purchase-models builds; `<Ref>`
   repeat-purchase-models.
7. Spaced (E3, lessons 1–2): the naive formula silently uses a blended
   churn rate — identify which cohort-matrix read would have exposed the
   mixture before any model was fit.
