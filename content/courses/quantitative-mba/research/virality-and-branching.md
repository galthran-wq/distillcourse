# Research brief: virality-and-branching (Virality: the K-factor as a branching process)

status: planned
module: growth-channels
type: core
goal: Compute extinction probability, subcritical amplification, and cycle-time effects for a viral loop modeled as a Galton–Watson process

The module's mathematical centerpiece. Business words: K-factor, viral
loop, going viral. Academic layer: Galton–Watson process, PGF iteration,
extinction theorem. Dig-deeper: Lalley's notes (proofs), Athreya & Ney
(canonical reference, toc-only), Easley–Kleinberg ch.21 (R0 framing).

## ARC (L10)

- **Inherits:** Spine step 12 opens: the unpaid channels have their own
  mathematics. Viral marketing was channel #1 in the Bullseye taxonomy;
  the reader has funnel/conversion language from Part I.
- **Contributes:** The branching-process model: K as offspring mean, PGF
  composition, the extinction fixed-point theorem, the subcritical
  amplification identity 1/(1−K), and cycle time in the exponent.
- **Hands off:** plg-and-freemium (referral loops embedded in product
  funnels; Dropbox); zynga-channel-collapse (engineered K decaying);
  the K<1 amplifier multiplies every paid user — re-pricing
  roas-and-max-bid's CAC.

## Sources to consult

- **Lalley notes (FULL, cached branchingpro-lalley)** — the proof layer:
  - Definition 1 + the doubly-infinite-array construction (simulation
    recipe); E[Z_n] = μⁿ (§1.1); PGF iteration φ_n = φ∘…∘φ (Prop 2).
  - Prop 3: extinction probability = smallest nonnegative root of
    φ(s)=s, BOTH proofs (renewal one-paragraph argument for the lesson
    body; PGF-iteration proof starred).
  - Prop 4 trichotomy via MVT/IVT; Prop 5 tails — subcritical
    P(τ>n) ~ Cμⁿ vs critical ~ 2/(σ²n) (certainty ≠ speed).
  - Galton-1889-surnames + Szilard-neutrons framing (p.1).
  - Problem 5 (GW hidden in a random walk) — starred/exercise fodder.
- **Athreya & Ney (TOC-ONLY)** — cite as the reference monograph
  (Ch. I extinction dichotomy); never cite page-level content.
- **Easley & Kleinberg ch.21 (FULL, gapno-s3)** — the teaching register:
  R0 = pk knife-edge; the two side-by-side trees (aggressive vs mild)
  at slightly different p; SIR/percolation one-sentence pointer;
  quarantine-reduces-k / sanitation-reduces-p as the two levers (maps
  exactly to invites-sent / conversion-per-invite).
- **Practitioner numbers** (no canonical source in canon — keep
  genre-level and honest): K = i × c decomposition; viral cycle time
  argument users(t) ≈ U₀·K^(t/ct) (standard growth-blog derivation —
  present as the course's own derivation from the GW model, not a
  citation); Dropbox/Hotmail anecdotes only where a checkable number
  exists (Dropbox referral numbers come NEXT lesson from the S-1-era
  sources; Hotmail is uncheckable folklore — omit or flag).

## Key points the lesson must cover

1. **The loop formalized**: user → sends i invites → each converts with
   probability c → K = i·c new users; offspring distribution, not just
   its mean (two products with equal K, different variance, behave
   differently — variance matters for extinction).
2. **Generation arithmetic**: E[Z_n] = Kⁿ; totals Σ Kⁿ; the geometric
   series everyone quotes, derived honestly from the model.
3. **The extinction theorem** (the lesson's proof): φ(s)=s fixed point,
   smallest root, the renewal argument in full; trichotomy K<1/=1/>1;
   the fixed-point diagram as the visual proof.
4. **Subcritical reality**: almost no product sustains K>1; the payoff
   identity — every externally acquired user brings 1/(1−K) total users
   ⇒ effective CAC = CAC×(1−K). K=0.7 ⇒ 3.33×; K=0.95 ⇒ 20×. This is
   the business content of the mathematics.
5. **Cycle time**: users(t) ∝ K^(t/c): halving c squares the
   per-period multiplier — compare K 0.7→0.8 vs c 7→3.5 days over 8
   weeks. Also the critical-case warning: K=1 dies surely but slowly
   (P(τ>n) ~ 2/(σ²n)) — "our K is about 1" is not a growth strategy.

## Set pieces and worked examples to recreate

- The knife-edge twin trees (E&K ch.21): same k=3 structure, p slightly
  above vs below 1/3 — extinct by generation 2 vs exploding.
- Full extinction computation for offspring ~ Binomial(5, c): find q at
  c=0.15 (K=0.75), c=0.25 (K=1.25) by solving φ(s)=s numerically.
- The amplification table: seeds 1,000; K ∈ {0.3, 0.5, 0.7, 0.9, 0.95};
  total users and effective CAC at CAC=$40.
- Galton's surnames → Szilard's neutrons → invite loops: one short
  lineage paragraph (the L2 historical hook, two sentences each).

## Pitfalls / subtleties

- K is usually measured as a cohort ratio (new-from-referral /
  existing) — conflates generations; state the clean generational
  definition and the measurement gap.
- Invites are not independent (network overlap, saturation of the
  contactable population) — GW is the OPTIMISTIC upper model; real
  loops saturate (logistic correction one-sentence pointer; E&K SIR).
- Retention interacts: only retained users send invites in later
  periods — the sBG survival curve gates the loop (spiral to Part I;
  exercise).
- "Viral" media coverage ≠ viral mechanism; keep the taxonomy (word of
  mouth, incentivized referral, inherent/network invites, casual
  contact) to one paragraph.

## FIGURE PLAN

1. `draw:` single `<Figure>` — the loop diagram: user → i invites → c
   conversion → K new users, rates on arrows, K = i·c boxed; second
   panel the same loop as a generation tree.
2. `draw:` `<FigureSequence>` (4 frames) — the knife edge: identical
   tree skeletons; frame 1 K=0.75 tree thinning to extinction; frame 2
   K=1.0 lingering; frame 3 K=1.25 exploding; frame 4 the three
   cumulative curves overlaid. One regime per frame.
3. `draw:` single `<Figure>` — THE fixed-point diagram: φ(s) convex on
   [0,1] against the diagonal; subcritical (only s=1) vs supercritical
   (root q<1) panels; extinction probability read off the crossing.
   (Lalley proves this with no figure — the standard diagram is ours to
   draw.)
4. `draw:` single `<Figure>` — subcritical amplification: total users
   per seeded user vs K, the 1/(1−K) hyperbola with the K→1 asymptote;
   effective-CAC axis on the right.
5. `draw:` single `<Figure>` — cycle time in the exponent: user curves
   over 8 weeks for (K=0.7, c=7d), (K=0.8, c=7d), (K=0.7, c=3.5d) —
   the halved cycle time winning.
6. `source:` **gapno-s3-ryan-gross-seedcorn** — save as
   `ryan-gross-diffusion-1943`. Reader must see: the hearing-vs-
   accepting bars by year, the adoption lag. Placement: float-right in
   the closing section connecting invite loops to diffusion research;
   caption: the founding dataset of diffusion-of-innovations. Real
   historical data; a redraw would fake it. (Use only if the closing
   diffusion paragraph survives drafting — else drop, no padding.)

## EXERCISE PLAN

1. Warm-up: i=4 invites, c=0.2 — compute K, E[Z_3] from 100 seeds, and
   total expected users. (Unfamiliar computation.)
2. Boundary probe: offspring distribution P(0)=0.2, P(2)=0.8 (K=1.6)
   vs P(0)=0, P(1)=0.4, P(2)=0.6 (K=1.6) — same K, compute both
   extinction probabilities (0.25 vs 0); state why P(0)=0 forbids
   extinction and which theorem hypothesis (p₀>0) it degenerates.
3. Claim to refute: "Our K is 0.97, basically 1 — with a small push
   we'll go viral, so paid spend is temporary." Compute amplification
   at K=0.97 (33×) vs the required K>1 sustainability; then use the
   critical-case tail (2/(σ²n)) to show even K=1 dies; name what a
   'small push' must permanently change (i or c, not seeds).
4. Derivation the lesson skipped: derive total expected users from one
   seed Σ Kⁿ = 1/(1−K) AND the variance of Z_n for K<1 — show totals
   concentrate for small K but the distribution is heavy near K=1
   (why K≈0.95 loops feel lumpy).
5. Research-shaped: from Lalley's Problem-5 setup, simulate (or argue)
   the GW process hidden in a simple random walk's up-crossings;
   verify the geometric offspring law empirically over 1,000 runs —
   the two-pictures-one-process exercise.
6. FORWARD (E7): a freemium product acquires 10,000 signups/month paid
   at $8 CAC, K=0.6 from in-product sharing, and 5% of total signups
   convert to paid at $120/yr. Compute effective CAC per PAYING
   customer. Solution: the free tier's economics (free users as a
   channel cost with viral yield) is exactly next lesson's subject;
   `<Ref>` plg-and-freemium.
7. Spaced (E3): only surviving users invite — with sBG retention
   r₁=0.7 and invites sent once per month of life, recompute the
   effective K from i=3, c=0.2 (sum over survival: K_eff = i·c·Σ S(t)
   truncated) and compare to the naive K (Ref churn-and-the-sbg-model).
