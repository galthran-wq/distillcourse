# Research brief: npv-and-irr (NPV, IRR, and the time price of money)

status: planned
module: startup-finance
type: core
goal: Evaluate projects by NPV and diagnose the failure modes of IRR — ranking conflicts, multiple roots, reinvestment assumptions

Part IV's opener — deliberately easy (C3 at module scale): the course
has discounted since CLV; this lesson names the rule and stress-tests
its rivals. Business words: NPV, IRR, hurdle rate. Academic layer:
present-value algebra, the NPV profile, IRR pathologies. Dig-deeper:
Luenberger ch.2 (toc-only), Berk & DeMarzo chs. 4, 7 (toc-only).

## ARC (L10)

- **Inherits:** discount-rate and CLV = Σ m·S(t)/(1+d)^t (Part I);
  payback as a liquidity metric (Part I); content NPV (Part III's
  seo lesson used the rule informally).
- **Contributes:** Spine step 14 opens: the rule itself — additivity,
  value maximization, the NPV profile — and the demolition of IRR and
  payback as VALUE rules (each fails a case NPV gets right).
- **Hands off:** "where does d come from?" — capm-and-wacc; NPV over
  a forecast → financial-model; NPV's blindness to optionality →
  real-options (plant one honest sentence).

## Sources to consult

- **Berk & DeMarzo (TOC + preface highlights, cached corporatefin-)**:
  chs. 3–4 structure (Law of One Price framing; the three rules of
  time travel; annuities/perpetuities) and ch.7 (NPV vs IRR vs
  payback; the NPV profile; crossing profiles; multiple IRRs). Use
  the STRUCTURE; derive everything in-lesson (body text unread — no
  worked-example numbers may be borrowed).
- **Luenberger (TOC-ONLY)**: ch.2 deterministic cash-flow streams;
  the classic two-project crossing-profile example and multiple-IRR
  pathology are reputation-level attributions — build our own
  numbers. ★ cash-flow-matching-as-LP idea (ch.6 flavor) for the
  starred section.
- **Part I internal**: customer-lifetime-value (the reader has already
  discounted a survival-weighted annuity — reuse the case numbers as
  the opening computation); payback-and-the-cash-trough (payback ≠
  value rule).
- **Damodaran packets** — the practitioner framing of hurdle rates as
  opportunity cost (one paragraph; full treatment next lesson).

## Key points the lesson must cover

1. **Name what the course has been doing**: CLV was NPV of a customer;
   content NPV was NPV of an article. PV/FV mechanics condensed to one
   section (audience does exponents; annuity/perpetuity closed forms
   as tools, geometric series derivation in two lines).
2. **NPV's defense**: additive across projects, scale-aware, rankable,
   indifferent to financing path under one rate; "invest iff NPV>0 at
   the opportunity cost of capital" — with the opportunity-cost
   reading (the rate is a price, purchased next lesson).
3. **The NPV profile and IRR**: IRR as the profile's root; fine for
   yes/no on conventional flows; the two documented failures — (a)
   ranking conflict: crossing profiles (build our two-project example
   where IRR prefers the small-fast project and NPV the big-slow one;
   crossover rate computed); (b) existence/uniqueness: a
   +100/−230/+132 style sign-flipping stream with two IRRs, and one
   with none. Descartes-rule one-liner.
4. **Reinvestment honesty**: IRR implicitly reinvests at IRR; MIRR as
   the patch; why the patch concedes the argument.
5. **Payback reconciled**: Part I's payback is liquidity discipline
   (cash constraint), not value ranking — both metrics survive, in
   different jobs; the folklore conflict dissolved.
6. **★ Starred**: NPV as the dual of a funding problem — fund a
   liability stream with bonds at market prices; the LP's shadow
   prices are discount factors (Luenberger ch.6 flavor, built
   self-contained).

## Set pieces and worked examples to recreate

- The opening reuse: recompute the course case's CLV as "the NPV of a
  customer" — same number, new name (spiral, zero new load).
- Two-project crossing example (ours): A = −100, +30×5yr; B = −100,
  +115 in yr1 + 20 in yr2 — profiles cross; IRR ranks B, NPV at 8%
  ranks A; crossover rate solved.
- Multiple-IRR example (ours): −160, +1000, −1000 (roots 25% and
  400%) — plot the profile, both roots visible; "which IRR?" has no
  answer; NPV at the actual rate does.
- The strip-mine/pump variant (sign change at the end via cleanup
  costs) as the realistic instance of non-conventional flows.

## Pitfalls / subtleties

- Both toc-only textbook sources: no borrowed page-level numbers;
  every worked number is course-built (and therefore checkable).
- Do not moralize IRR — VCs quote IRR because LP reporting does
  (venture-economics will use it); the lesson's claim is only "not a
  ranking rule".
- Nominal vs real rates: one paragraph, consistent-units rule.
- Keep annuity algebra tight — the audience can integrate; the
  content is the failure cases, not the algebra.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the timeline device: a cash-flow stream
   on a timeline with each flow discounted back along labeled arrows
   to t=0 (the Berk–DeMarzo timeline discipline, house-drawn).
2. `draw:` single `<Figure>` — the NPV profile: NPV(r) for one
   conventional project; IRR at the root, current hurdle rate marked;
   accept/reject regions shaded.
3. `draw:` `<FigureSequence>` (3 frames) — the ranking conflict:
   frame 1 both projects' profiles; frame 2 the crossover rate
   highlighted; frame 3 the verdict table at r=8% vs r=20% — IRR
   constant, ranking flips. One element per frame.
4. `draw:` single `<Figure>` — the pathological profile: the
   two-IRR hump crossing zero twice; the no-IRR profile floating
   above zero; both labeled with their cash-flow sign patterns.
5. `draw:` single `<Figure>` — decision-rule scorecard: NPV / IRR /
   MIRR / payback × (ranking, existence, scale, liquidity) as a
   compact matrix — the lesson's summary object.

## EXERCISE PLAN

1. Warm-up: compute NPV at 10% and IRR for −500, +200, +200, +200,
   +100; then the same stream at 20% — decision at each rate.
   (Mechanics once.)
2. Boundary probe: a perpetuity −C then +m forever — NPV = m/r − C;
   let r→0: NPV diverges while IRR = m/C stays finite; state which
   question each object answers and why the r→0 limit is exactly
   where "undiscounted thinking" lives (and where the naive CLV=m/c
   formula came from; Ref customer-lifetime-value).
3. Claim to refute: "Project B has the higher IRR, so if we can only
   do one, do B." Use the crossing example: compute both NPVs at the
   stated 8% cost of capital, find the crossover, and name the exact
   assumption IRR smuggles in (reinvestment at IRR).
4. Derivation the lesson skipped: derive the annuity PV formula from
   the geometric series AND re-derive Part I's finite-horizon CLV as
   an annuity with survival-adjusted payments — the two formulas are
   one.
5. Research-shaped: the −160/+1000/−1000 stream — find both IRRs
   numerically, plot the profile, and construct a second stream with
   NO real IRR; state the sign-pattern rule governing both cases.
6. FORWARD (E7): two projects have identical NPV at 12%, but project
   A's cash arrives mostly in year 5, B's in year 1. Compute each
   NPV's sensitivity dNPV/dr and state which project a 4-point rate
   error damages more. Solution: valuation hangs on the rate, so the
   next lesson is entirely about where the rate comes from; `<Ref>`
   capm-and-wacc.
7. Spaced (E3): content-portfolio NPV (Ref seo-and-content-economics)
   used δ and d together — separate the two rates' jobs (physical
   decay vs time price) and show what error merging them into one
   "effective discount" causes when δ changes.
