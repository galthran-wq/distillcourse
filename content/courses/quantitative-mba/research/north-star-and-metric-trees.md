# Research brief: north-star-and-metric-trees (North Star metrics and the metric tree)

status: planned
module: unit-economics
type: core
goal: Decompose a revenue target into a tree of driver metrics and use it for forecasting and sensitivity analysis

Business words: North Star metric, metric tree / driver model, dashboard.
Academic layer: mix effects and Simpson's paradox in metric dynamics.
Grounding is Skok (funnel forward-planning, dashboards, growth levers) plus
Kohavi ch.6/7 at TOC depth for the metrics-taxonomy vocabulary; Simpson's
from Kohavi ch.3 (TOC) — keep that segment self-derived with our own
arithmetic (no page-level claims from unread chapters).

## ARC (L10)

- **Inherits:** The full metric vocabulary of steps 1–3 (funnel rates, MRR
  waterfall, NRR, margins, payback) — the leaves the tree is built from.
- **Contributes:** Spine step 4 opens: "Metrics assembled into systems
  steer companies." The decomposition discipline: North Star choice, the
  driver tree, backward planning, sensitivity ranking, and the mix-effect
  traps in reading a tree over time.
- **Hands off:** goodharts-law: what happens to any node of this tree once
  it becomes a target.

## Sources to consult

- **Skok main article** — "Funnel Metrics" (leads per stage + conversion
  per hand-off as the universal measurement), "Using Funnel Metrics in
  Forward Planning" (from revenue target backwards to required leads and
  reps), "Sales Capacity" (productive reps as bookings driver; ramping as
  fractional FTE), "What Levers are available to drive Growth" (the levers
  list = the tree's actionable leaves; 9–12 month lag note), "Defining a
  Dashboard" (numeric tab + graphs tab; plan-vs-actual dotted line).
- **Kohavi ch.6-7** (TOC only): metrics taxonomy; "From Business Metrics
  to Metrics Appropriate for Experimentation"; OEC examples (Amazon
  e-mail, Bing). Use as vocabulary pointers; the OEC treatment itself
  belongs to oec-and-guardrails (`<Ref>` forward).
- **Fader & Hardie 2009 / module 1** — Amazon's window-defined "active
  customers" as a North-Star-gone-wrong candidate (re-used next lesson).
- **Simpson's paradox arithmetic** — construct from first principles (two
  segments, shifting weights); the classic Berkeley/kidney examples are
  public knowledge but our worked case should be the running SaaS
  (mobile vs desktop conversion, mix shift).

## Key points the lesson must cover

1. **North Star choice**: one metric proxying long-term value (not
   revenue itself — leading, not lagging); criteria: causally upstream of
   revenue, moves within a quarter, hard to game (forward seam to
   Goodhart). Examples table (marketplace GMV/active buyers, SaaS WAU of
   core action, media minutes) — kept generic, no invented company stats.
2. **The tree as arithmetic**: Revenue = accounts × ARPA; accounts' motion
   = the MRR waterfall; new = leads × conversion; expansion = NRR
   machinery. Each edge is an identity or an estimated rate — mark WHICH
   (identities never break; rates do). The tree is a factored model of the
   business, and sensitivity is its gradient.
3. **Backward planning** (Skok's worked device): $2M net-new ARR target →
   required Net New MRR → new logos (given churn/expansion) → demos →
   leads → rep capacity with ramp. One full worked pass on the running
   case.
4. **Sensitivity ranking**: ∂Revenue/∂driver at current values; elasticity
   form (1% of X buys Y% of revenue); why bottom-of-funnel improvements
   look cheap but saturate; connect to which lever deserves an experiment
   (seam to module 3).
5. **Mix effects / Simpson's**: the aggregate can fall while every segment
   rises (and vice versa); worked two-segment conversion example with
   shifting traffic mix; the discipline: decompose Δmetric into
   within-segment and mix terms before assigning credit.

## Set pieces and worked examples to recreate

- **The running-case tree**: full drawn tree from Revenue down to leads,
  churn θ, ARPA, GM — with real numbers at every node; the module's
  synthesis object before the HubSpot application.
- **Backward plan table** (Skok): target → leads/reps, including rep ramp
  as fractional capacity.
- **Simpson's on the funnel**: desktop 5% & mobile 2% conversion, both
  improve 10%, mobile share doubles → blended conversion falls. Exact
  numbers chosen to be round.
- **Δ-decomposition identity**: blended rate change = Σ w·Δr + Σ Δw·r
  (+cross term) — the two-line algebra that resolves every "why did the
  blend fall" fight.

## Pitfalls / subtleties to flag

- A metric tree is not a causal graph: edges are accounting identities or
  correlations; pulling a leaf (goosing demos) does not guarantee the
  parent moves — that gap is exactly what module 3 measures. Say this
  explicitly; it is the course's central seam between parts.
- North Star monoculture: single-metric steering invites Goodhart (next
  lesson); the tree, not the root, is the steering object.
- Sensitivity at a point vs at scale: derivative reasoning breaks at
  saturation; one clause.
- Don't teach dashboard tooling; the artifact is the decomposition, not
  the BI product.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the running-case metric tree**: 3-level
   tree, identities as solid edges, estimated rates as dashed edges (the
   legend IS the lesson's point), numbers at nodes.
2. `draw:` `<FigureSequence>` (4 frames) — **backward planning**: frame 1
   the target at the root; frames 2–4 the requirement propagating down one
   level at a time to leads and rep-capacity, numbers accumulating.
3. `draw:` single `<Figure>` — **sensitivity bar row**: revenue lift from
   +1% in each driver, sorted; the cheap-looking saturating ones flagged.
4. `draw:` single `<Figure>` — **Simpson's on the funnel**: two segment
   panels (both conversion rates rising) + blended panel (falling), with
   the mix-shift arrow as the culprit; tally grammar (voita rule 8).
5. `draw:` single `<Figure>` — **Δ-decomposition dissected** (voita rule
   7): the blended-rate change formula with within-segment and mix terms
   colored and tied to the panels of fig 4.

## EXERCISE PLAN

1. Warm-up: given the tree's node values, verify the root by multiplying
   the identities, and recompute the root after churn improves 3.0%→2.5%.
2. Boundary probe: a tree edge that is an identity (accounts × ARPA) vs
   one that is a fitted rate (lead→demo conversion): push each to an
   extreme (ARPA→0 with accounts→∞ at fixed revenue; conversion→1) and
   state which breaks arithmetic vs which breaks empirically — why the
   solid/dashed distinction decides what "improving a node" even means.
3. Claim to refute: "Blended signup conversion fell 8%, so the product
   team shipped something bad." Given segment data with a paid-traffic
   surge, run the Δ-decomposition and attribute the fall to mix; name the
   condition under which blended reads ARE trustworthy (stable weights).
4. Derivation the lesson skipped: derive the Δ-decomposition identity
   including the cross term, and show the cross term's sign is what makes
   "both stories half-right" cases possible.
5. Research-shaped: from Skok's forward-planning method, reconstruct the
   backward plan for the running case's $2M target and identify which
   input (rep ramp time) the plan is most sensitive to — report the
   elasticity you compute.
6. FORWARD (E7): pick the tree's most sensitive driver and write the
   one-sentence experiment that would test whether pushing it moves its
   PARENT (not just itself). Solution: the gap between moving a metric
   and moving its parent is Goodhart's territory and module 3's subject —
   `<Ref>` goodharts-law, `<Ref>` ab-tests-and-randomization.
7. Spaced (E3, module 1 + 2): place NRR in the tree: which nodes does a
   +5pt NRR improvement touch, and why does it appear in both the revenue
   and the churn branches (expansion vs contraction bookkeeping)?
