# Research brief: data-processing-inequality (The data-processing inequality)

status: planned
module: shared-information
type: core
goal: Apply the data-processing inequality to bound how much a representation reveals about a target.

New standalone lesson. In the previous pass the DPI was crammed into the
information-bottleneck lesson as a sub-result; with the cap removed it earns its
own chapter, placed right after `mutual-information` so that channel coding
(converse), rate-distortion, and the information bottleneck can all cite it. It
also carries the load-bearing ML reading: no learned feature of X can know more
about a target Y than X itself did.

## Sources to consult

- Cover & Thomas, **§2.8 "Data-Processing Inequality"** — Theorem 2.8.1 and its
  chain-rule proof: expand `I(X; Y,Z)` two ways on the Markov chain `X — Y — Z`;
  the Markov property zeroes one conditional MI, non-negativity of the other
  finishes. (C&T state it as X—Y—Z ⇒ I(X;Y) ≥ I(X;Z); mirror to our
  Y—X—T ⇒ I(Y;X) ≥ I(Y;T) and keep the naming consistent with the IB lesson.)
- Cover & Thomas, **§2.9 "Sufficient Statistics"** — the equality case: a
  sufficient statistic T(X) is exactly one for which I(θ;T) = I(θ;X); no
  information about the parameter is lost.
- Cover & Thomas, **§2.10 "Fano's Inequality"** — one-sentence forward pointer:
  Fano (used in the channel converse) is the same DPI machinery turned into an
  error bound.
- MacKay, **ch. 8** — mutual information identities reused; MacKay's "information
  can only be destroyed" phrasing.
- Xu & Raginsky 2017 (arXiv:1705.07809) — further-reading aside only:
  `gen ≤ sqrt(2σ² I(S;W)/n)`, generalization bounded by the mutual information
  between training set and learned hypothesis — a DPI-flavoured ML payoff.

## Key points the lesson must cover

1. **The statement** (this lesson's theorem): for a Markov chain `Y → X → T`
   (T computed from X, possibly with added randomness, so T is conditionally
   independent of Y given X), `I(T;Y) ≤ I(X;Y)`. Concrete opener: a specific
   lossy map T = f(X) on a small joint where you can watch I drop.
2. **The proof**, every step from quantities the course owns: chain rule for
   mutual information gives `I(Y; X,T) = I(Y;X) + I(Y;T|X) = I(Y;T) + I(Y;X|T)`;
   the Markov property makes `I(Y;T|X) = 0`; `I(Y;X|T) ≥ 0` closes it. Show both
   expansions side by side.
3. **Processing cannot create information**: any deterministic or stochastic
   function of X — a hash, a quantizer, a neural layer, a summary statistic —
   has at most the information about Y that X had. Corollary `I(f(X);Y) ≤ I(X;Y)`.
4. **The equality case = sufficiency**: `I(T;Y) = I(X;Y)` exactly when T retains
   everything X said about Y, i.e. T is a sufficient statistic for Y. Worked with
   a small example where a coarse T loses information and a well-chosen T does
   not.
5. **Worked computation**: a 3- or 4-symbol X with a binary Y and an explicit
   joint; a merge/quantization T; compute I(X;Y) and I(T;Y) and confirm the
   inequality, then a lossless relabeling T' with equality.
6. **Where it is used next** (one sentence each, no content leak): channel
   converse (Fano), rate-distortion (X̂ is processed from X), information
   bottleneck (the whole objective lives under the DPI ceiling).

## Pitfalls / subtleties to flag

- **Arrow direction matters**: the chain is `Y → X → T`; T must be conditionally
  independent of Y given X. If T sees Y directly, the bound need not hold.
- DPI bounds the **average** mutual information, not every pointwise term.
- "Cannot create information" is about I with a fixed downstream target Y;
  processing can still make information *easier to use* (that is representation
  learning) without increasing I. State this — it prevents the "then why learn
  features?" misreading.
- Randomized processing is allowed (T need not be a function of X); the Markov
  condition, not determinism, is what the proof needs.
- Equality requires sufficiency for **that** Y; a statistic sufficient for one
  target can be lossy for another.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the chain `Y → X → T` drawn as three nodes
   with the processing arrow labeled `p(t|x)`, and the DPI annotated across the
   spans: `I(T;Y) ≤ I(X;Y)`. One idea: processing sits between you and the
   target. Inspiration: Cover & Thomas §2.8.
2. **`<FigureSequence>` (3 frames)** — the proof: frame 1 `I(Y; X,T)` expanded
   via X first (`I(Y;X) + I(Y;T|X)`); frame 2 expanded via T first
   (`I(Y;T) + I(Y;X|T)`); frame 3 the Markov term struck out and the inequality
   read off. Delta = one expansion per frame. Inspiration: Cover & Thomas §2.8.
3. **single `<Figure>` (component)** — a worked drop: the joint table for X,Y,
   a merge T shown as combining two X-columns, and the tally `I(X;Y) = …`,
   `I(T;Y) = …` with the loss shaded. One idea: merging similar columns costs
   little; merging dissimilar ones costs information.
4. **single `<Figure>` (component)** — the equality case: two T's on the same X,
   one lossy (bars show `I(T;Y) < I(X;Y)`) and one a lossless relabeling
   (`I(T';Y) = I(X;Y)`), labeled "sufficient statistic". One idea: equality means
   nothing about Y was lost.
5. **single `<Figure>` (component)** — the ML reading: a stack `data X →
   feature T → prediction`, with a dashed ceiling line `I(·;Y) ≤ I(X;Y)` over
   every downstream stage. One idea: no layer manufactures information about the
   label. Inspiration: playbook bottom-up architecture stack.
