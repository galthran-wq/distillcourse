# Research brief: what-is-surprise (Surprisal)

status: retrofit
module: foundations
goal: Compute the surprisal of an event from its probability.

This lesson was drafted before the dossier existed. This brief records what the
existing draft already covers, then what a density-upgrade revision should add.
It is not a rewrite spec — the argument and the numbers below are already
correct in the draft.

## Sources to consult

- Shannon 1948, Part I, **§6 "Choice, Uncertainty and Entropy"** — the
  logarithmic measure of information and its motivation (additivity over
  independent choices). This is the primary anchor.
- MacKay, **ch. 2, §2.4** — "Shannon information content" defined as
  `h(x) = log2 (1/p(x))`; note MacKay's lowercase-h notation for the per-symbol
  content versus H for the ensemble average.
- Cover & Thomas, **§2.1** — entropy is defined directly; surprisal appears as
  the summand `log 1/p(x)`. No standalone "surprisal" section, so use it only
  for the definition and the `E[log 1/p]` framing.
- Hartley 1928 — historical, for the units paragraph (the base-10 hartley).

## Key points the lesson must cover (already in the draft)

1. Information content is a property of the reported event's **probability**,
   not of message length or wording (sunrise vs. Cairo-snow contrast).
2. Two constraints on any candidate `f(p)`: `f(1)=0`, and `f` strictly
   decreasing. These alone underdetermine the form (draft shows `1-p` and
   `1/p - 1` both pass and both fail additivity).
3. The **additivity axiom** over independent events, `f(pq)=f(p)+f(q)`, reduces
   to Cauchy's functional equation via `g(t)=f(e^{-t})`; continuity forces
   `f(p) = -c log p`. This is the load-bearing derivation.
4. Definition: `I(x) = -log2 p(x)`, in **bits**; `I=0` at `p=1`,
   `I -> infinity` as `p -> 0`.
5. **Units**: bits (base 2), nats (base e), hartleys (base 10) as a change of
   measurement unit only; conversion factors `1 nat = log2 e ≈ 1.443 bits`.
6. **Composite events**: additivity holds only for independent events; the
   general case is the conditional decomposition
   `I(A∩B) = I(A) + I(B|A)`; disjoint events fail it the other way.
7. ML tie-in: surprisal = negative log-likelihood loss on one example; the
   log-domain also fixes floating-point underflow.

## What a density-upgrade revision should add

- The draft has only **2 figures** for a ~1900-word chapter; the norm is 6-12
  per 1000 words. Add 3-5 small single-idea visuals (see FIGURE PLAN). This is
  the main gap.
- A `<KeyFact>` (rose) one-liner stating the punchline — "information is
  `-log2 p`, and additivity is the only reason it is a log" — currently the
  chapter has no rose callout.
- A `<Task>` (green) tied to the SurprisalSlider demo naming what to watch
  (drag p across a decade, watch surprisal rise by a fixed 3.32 bits per
  factor-of-10). The demo is present but has no instruction callout.
- Promote the units conversion into a small table figure rather than an inline
  display equation.

## Pitfalls / subtleties to flag

- Surprisal is defined **per event**, not per random variable (the draft's
  closing Remark — keep it; it sets up the entropy lesson).
- The constant `c` is exactly the choice of log base; there is no further
  freedom. Do not present base-2 as "natural" — it is a unit choice.
- `-log2 p` is undefined at `p=0`; surprisal of an impossible event is not
  "infinite information", it is undefined (the `0 log 0` convention is an
  entropy-lesson concern, not here).
- Corpus letter frequencies are estimates, not constants (draft already says
  this — keep it, QA flags unhedged frequency claims).

## FIGURE PLAN

1. **rarity.svg** (exists, single `<Figure>`) — three events ordered by
   probability with information growing as p shrinks. Keep; already the
   two-color comparison gold example cited in docs/figures.md.
2. **additivity.svg** (exists, single `<Figure>`) — coin-flip tree: probabilities
   multiply along branches, information adds. Keep.
3. **NEW, `<FigureSequence>` (3 frames)** — "why not `1-p`": frame 1 plots the
   two failed candidates and `-log2 p` together on `(0,1]`; frame 2 overlays the
   additivity test point `f(1/4)` and marks where `1-p` and `1/p-1` miss; frame
   3 leaves only `-log2 p` passing through both required points. Delta per frame
   = one curve/annotation. Inspiration: the draft's "simpler candidates fail"
   Remark, made visual.
4. **NEW, single `<Figure>` (component)** — the `-log2 p` curve with the three
   preset events (coin `p=1/2 -> 1 bit`, die `1/6 -> 2.58`, ace-of-spades
   `1/52 -> 5.70`) marked as dots on the curve, values plugged in. Binds the
   SurprisalSlider demo to a static reference. Inspiration: MacKay's habit of
   marking concrete points on the information curve.
5. **NEW, single `<Figure>` (component)** — units conversion strip: one surprisal
   value shown simultaneously in bits / nats / hartleys with the `×1.443` and
   `÷3.322` factors as labeled arrows between them. One idea: base = unit.
6. **NEW, single `<Figure>` (component)** — the ace-of-spades additivity check as
   a two-box split: `log2 52 = log2 4 (suit) + log2 13 (rank)`, each box a
   labeled bar summing to 5.70 bits. Inspiration: formula-dissection rule
   (labels-above-symbols) from the playbook.
