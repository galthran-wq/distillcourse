# Research brief: information-bottleneck (The information bottleneck)

status: planned
module: principles
type: core
goal: Analyze the information bottleneck objective as a trade-off between compression and preserved relevant information.

Updated for the restructure. Two dependencies that were crammed into this lesson
in the previous pass are now their own prerequisite chapters:
`data-processing-inequality` (the DPI is proved there, only *used* here) and
`rate-distortion` (the framework IB generalizes, taught in full there). This
lesson can therefore open cleanly with the framework-flaw-fix move: rate-
distortion needs a hand-picked distortion; the bottleneck replaces it with a
second mutual information. Do NOT re-derive the DPI or re-teach rate-distortion —
recap each in one sentence with a `<Ref>` and build.

## Sources to consult

- Tishby, Pereira & Bialek 1999, "The Information Bottleneck Method"
  (arXiv:physics/0004057) — the primary source.
  - **§1 + §2.1** — the motivation: Shannon's theory has no notion of
    *relevance*; rate-distortion requires a hand-specified distortion function,
    itself an arbitrary feature choice. (Recap territory now — the
    `rate-distortion` lesson owns the framework.)
  - **§3.1** — the objective `L = I(X;T) - β I(T;Y)` over stochastic encoders
    `p(t|x)`, and the data-processing bound `I(T;Y) ≤ I(X;Y)` (their eq. 14) —
    cite the DPI from the prerequisite lesson.
  - **§3.2, Theorem 4** — the optimal encoder
    `p(t|x) ∝ p(t) exp(-β D_KL[p(y|x) || p(y|t)])`: the distortion measure
    *emerges* as a KL divergence. State; do not reproduce the Lagrange proof.
  - **§3.4** — the information plane (I(X;T), I(T;Y)) and the β-parameterized
    frontier; one convex curve per cardinality |T|.
- Cover & Thomas, **§2.9 "Sufficient Statistics"** — one remark: IB's β → ∞ limit
  approximates a minimal sufficient statistic (the DPI equality case, from the
  prerequisite lesson).
- Cover & Thomas, **§10.8 (Blahut–Arimoto)** — pointer only: the IB iterative
  algorithm generalizes it; out of scope.
- Xu & Raginsky 2017 (arXiv:1705.07809) — further-reading aside: `I(S;W)` bounds
  generalization, a sibling of the bottleneck's "keep only relevant bits" idea.

## Key points the lesson must cover

1. **The representation-learning problem**: compress X (an input) into T (a
   representation, fewer bits) while keeping what matters for a target Y. Recap in
   one sentence that rate-distortion (<Ref lesson="rate-distortion"/>) would need
   a hand-picked distortion `d(x, x̂)` — the flaw the bottleneck removes.
2. **The objective**: minimize `I(X;T) - β I(T;Y)` over stochastic encoders
   `p(t|x)`. Extremes: β → 0 collapses T to one value (maximal compression, zero
   relevance); β → ∞ makes T a copy of X (all relevance, no compression). β
   prices relevant bits in units of rate.
3. **The DPI ceiling** (recap, not re-proof): since `Y → X → T`,
   `I(T;Y) ≤ I(X;Y)` (<Ref lesson="data-processing-inequality"/>) — the target
   information T can preserve is capped by what X had. Also `I(T;Y) ≤ I(X;T)`
   (T cannot say more about Y than it contains). These two bound the information
   plane.
4. **Worked toy example, computed in full**: X ∈ {4 symbols} with a binary label
   Y and an explicit joint table. Enumerate the hard 2-cluster encoders T,
   compute I(X;T) and I(T;Y) for each, and exhibit the trade-off: the merge of
   the two symbols with the most similar `p(y|x)` loses the least relevance. This
   grounds Theorem 4's KL-form intuitively.
5. **The information plane**: plot the candidates from (4) as points in
   (I(X;T), I(T;Y)); the DPI ceilings as the two boundary lines; the β-swept
   frontier as the upper boundary. Static twin of the InformationPlane demo.
6. **Theorem 4 stated**: the optimal encoder is Gibbs-form with
   `D_KL[p(y|x) || p(y|t)]` as the effective distortion — relevance defines its
   own distortion measure, derived not hand-picked. Connect the exponent to the
   toy example's merge rule and to the rate-distortion Lagrangian.
7. **At the optimum, marginal exchange rate**: moving along the frontier, one
   additional bit of I(T;Y) costs β bits of I(X;T) (Tishby §3.4 states the slope
   relation — derive it from the stated Lagrangian rather than quoting a
   convention).

## Pitfalls / subtleties to flag

- **The Markov structure is T ← X ← Y** (T is a code of X, not a generative
  latent for Y); Tishby's own footnote warns against the generative reading —
  keep the arrow direction explicit in every figure. (Same chain as the DPI
  lesson; reuse its framing.)
- The paper contains **zero figures**; the famous "information plane trajectories
  of deep networks" plots come from later, contested literature. Do not import
  claims about SGD dynamics or DNN compression phases; teach the 1999 objective.
- Estimating I in high dimensions is its own hard problem — forward-ref
  `infonce` as the modern trainable handle (and it is the next lesson).
- Hard clusterings in the toy example are a strict subset of stochastic encoders;
  the true frontier can dominate all hard points. Say so.
- The slope-β relation's convention differs across write-ups (β vs 1/β); derive
  it from the stated Lagrangian rather than quoting.
- IB solutions are found by alternating minimization (generalized Blahut–Arimoto,
  their Theorem 5) with convergence but no uniqueness — mention in one sentence,
  algorithm out of scope.

## FIGURE PLAN

1. **single `<Figure>` (component)** — rate-distortion vs IB comparison panel:
   two near-identical objective boxes, `⟨d(x,x̂)⟩` (hand-picked, warning color)
   replaced by `-I(T;Y)` (derived from data), payoff line "relevance without a
   designed distortion". Playbook two-panel comparison. Inspiration: Tishby
   §1-§3.1. (This is now the opener, since the DPI has its own lesson.)
2. **single `<Figure>` (component)** — the objective dissected:
   `L = I(X;T) - β I(T;Y)` with labels-above-symbols — "bits kept about X (rate)",
   "inverse temperature", "bits kept about the target Y (relevance)". One idea:
   compress X, keep Y.
3. **`<FigureSequence>` (4 frames)** — the toy 4-symbol example: frame 1 the joint
   table with `p(y|x)` per symbol; frames 2-4 candidate 2-cluster merges, each
   frame tallying (I(X;T), I(T;Y)); the similar-conditional merge visibly keeps
   more relevance. Delta = one candidate encoder per frame.
4. **single `<Figure>` (component)** — the information plane: axes I(X;T) and
   I(T;Y), the DPI ceiling as a horizontal line at I(X;Y), the diagonal
   `I(T;Y) ≤ I(X;T)`, toy-example points plotted, frontier curve through the best
   ones. Static twin of the InformationPlane demo. Inspiration: Tishby §3.4
   (concept described but never drawn in the source — build from the math).
5. **single `<Figure>` (component)** — Theorem 4 dissected:
   `p(t|x) ∝ p(t) exp(-β D_KL[p(y|x)||p(y|t)])` with labels-above-symbols —
   "prior for the cluster", "inverse temperature", "the emergent distortion: how
   differently x and cluster t predict Y". One idea: the distortion is a KL,
   derived not chosen. Reuses `kl-divergence`.
6. **single `<Figure>` (component)** — β extremes: three small encoder diagrams
   (β ≈ 0: all x → one t; intermediate: the good 2-cluster; β large: identity),
   each with its (I(X;T), I(T;Y)) pair. One idea: β dials where you sit on the
   frontier.
