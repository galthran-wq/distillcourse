# Research brief: infonce (The InfoNCE bound)

status: drafted (kept slug — revise, do not rewrite)
module: principles
type: core
goal: Derive the InfoNCE lower bound on mutual information from a contrastive classification loss.
est_minutes: 34

## ARC

- **Inherits:** `I(X;Y)` (`mutual-information`), cross-entropy as a loss
  (`cross-entropy-loss`), and the demonstration that direct estimation fails
  (`estimating-mutual-information`).
- **Spine step:** step 11, *Compression aimed at a target* — "…a contrastive
  loss bounds that quantity where it cannot be computed…"
- **Contributes:** a mutual-information quantity that is computable from samples
  by training a classifier, together with the ceiling that makes it a limited
  instrument.
- **Hands off to:** `learned-image-compression`, which closes the module, and to
  the reader's own practice — this is the form in which information theory
  actually appears in current representation learning.

## Sources to consult

- **van den Oord, Li & Vinyals 2018** (primary) — §2.3 and **Appendix A.1**: the
  InfoNCE loss, the proof that the optimal critic recovers the density ratio
  `p(y|x)/p(y)`, and the derivation of `I(X;Y) ≥ log N - L_N` (eqs. 6-11). §3
  for the cross-modal empirical validation.
- **Goldfeld & Polyanskiy 2020, §V** — for the honest framing of what
  sample-based mutual-information estimates can and cannot certify; the `log N`
  ceiling is the same phenomenon as the estimator's finite-sample limits.
- Cover & Thomas, **§2.3 and §11.7-11.8** — the density-ratio object is a
  likelihood ratio, and the Neyman-Pearson / Chernoff-Stein machinery is where
  it comes from. One `## ★` starred paragraph, if wanted.
- Alemi et al. 2017, §3 — the variational-bound pattern (bound both mutual
  informations, optimise the bound) which this lesson shares.

## Key points the lesson must cover

1. **The flaw, restated.** For images, audio or text, `p(x,y)` is unavailable
   and binning is hopeless — established two modules earlier. What is available
   is samples and a function approximator.
2. **The task.** Given a context `x` and `N` candidates of which exactly one is
   the true partner `y`, train a critic `f(x,y)` and classify by softmax over
   the `N` scores. The loss `L_N` is an ordinary cross-entropy.
3. **The optimal critic.** Minimising `L_N` drives `f(x,y)` to be proportional
   to the density ratio `p(y|x)/p(y)` — not to `p(y|x)` and not to `p(x,y)`.
   Carry the derivation; it is short and it is the reason the bound holds.
4. **The bound.** `I(X;Y) ≥ log2 N - L_N`. Derive it from the optimal-critic
   substitution, marking where Jensen's inequality enters.
5. **The ceiling, stated as the lesson's real content.** Because `L_N ≥ 0`, the
   bound can never certify more than `log2 N` bits. With `N = 256` the maximum
   certifiable value is 8 bits, no matter how strong the dependence. A
   representation carrying 20 bits and one carrying 8 look identical to this
   instrument. This is a genuine reversal — the reader expects a better
   representation to score better — and it must be stated as one.
6. **Consequences in practice.** Bigger batches raise the ceiling, which is why
   contrastive methods are batch-size hungry; and a saturated bound tells you
   nothing about which of two good representations is better. Say both.
7. **What the loss is good for anyway.** Even where the bound is loose, the
   objective produces useful representations. Bound quality and representation
   quality are different questions and the literature has conflated them; state
   this carefully and without overreach.

## Pitfalls / subtleties to flag

- InfoNCE is a **lower** bound. A low value means the bound is weak, not that
  the mutual information is low.
- The bound is on `I(X;Y)` for the *distribution the negatives are drawn from*.
  Sampling negatives from a different distribution changes what is being
  bounded.
- The critic's capacity matters: the bound holds for the optimal critic, and a
  trained critic gives a bound on the bound.
- `log N` versus `log2 N`: the papers use nats. State the convention once.
- Do not claim InfoNCE estimates mutual information. It bounds it, from below,
  with a hard ceiling.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the contrastive task: a context on the left,
   `N` candidates on the right with one true partner marked, the critic scoring
   each and a softmax over the scores. One idea: the estimator is a
   classification problem.
2. `draw:` **single `<Figure>`** — the optimal critic: three bar sets —
   `p(y|x)`, `p(y)`, and their ratio — with the ratio marked as what the critic
   converges to. One idea: the critic learns a ratio, not a distribution.
3. `draw:` **`<FigureSequence>` (3 frames)** — the derivation: frame 1 the loss
   written out; frame 2 the optimal critic substituted; frame 3 Jensen applied
   and the bound read off, with the inequality step highlighted.
4. `draw:` **single `<Figure>`** — the ceiling: true `I(X;Y)` on the horizontal
   axis and the bound on the vertical, with the `y = x` line and three
   horizontal ceilings at `log2 N` for `N = 8, 64, 512`, showing where each
   clips. One idea: past the ceiling, the instrument is blind.
5. `draw:` **single `<Figure>`** — batch size against certifiable bits, a log
   curve, with three real batch sizes from published contrastive methods marked.
   One idea: the ceiling is a design constraint, not a nuisance.
6. `draw:` **single `<Figure>`** — the two questions separated: two
   representations with equal bound values but different downstream accuracy,
   drawn as a two-panel comparison. One idea: bound quality and representation
   quality are different measurements.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* With `N = 64` and a measured contrastive loss of 1.2 nats,
   compute the bound in bits. Then repeat for `N = 256` and the same loss.
2. **Boundary probe.** Evaluate the bound at `N = 1` and at `L_N = 0`. Report
   what each says, and explain why `N = 1` makes the loss identically zero and
   the bound vacuous.
3. **Claim to refute.** "Our method achieves an InfoNCE value of 7.9 bits with
   `N = 256`, so our representation captures 7.9 bits about the target." State
   what is wrong, and what experiment would distinguish a representation
   carrying 8 bits from one carrying 30.
4. **Claim to refute, second kind.** "A lower InfoNCE bound means a worse
   representation." Refute, and name the two independent causes of a low bound.
5. **Derivation the lesson skipped.** Prove that the loss is minimised when
   `f(x,y) ∝ p(y|x)/p(y)`, by treating the softmax classification as a standard
   maximum-likelihood problem over which candidate is the true one.
6. **Research-shaped.** On a toy joint where `I(X;Y)` is known exactly, train (or
   simulate an optimal) critic at `N = 4, 16, 64, 256` and plot the bound against
   the true value. Report the `N` at which the bound stops improving and compare
   it with `2^{I(X;Y)}`.
7. **FORWARD (E7).** A learned image codec must decide how many bits to spend on
   each part of an image. Write down an objective in which the rate term is a
   cross-entropy against a learned distribution over codes and the fidelity term
   is a distortion. Compare its shape with the bottleneck objective and with
   `R(D)`. Reaches `learned-image-compression` — the solution names the
   Lagrangian and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph, and `estimating-mutual-information` as a prerequisite: the
  motivation for InfoNCE is that direct estimation fails, and that is now a
  lesson rather than an assertion.
- Figures 2, 4, 5, 6 above. The ceiling figure is the lesson's most important
  visual and is currently missing.
- The ceiling stated as an explicit reversal seam, with the numbers (`N = 256`
  ⇒ at most 8 bits).
- The separation of "bound quality" from "representation quality", which the
  current draft blurs.
- Depth toward 34 minutes.

**Lose**
- Any language calling InfoNCE an estimator of mutual information.
- The `information-bottleneck` prerequisite as a *conceptual* dependency: the
  bound stands alone and the lesson should not require the bottleneck's
  machinery to be understood. (The prerequisite list keeps
  `estimating-mutual-information` and `cross-entropy-loss`.)
- Callouts restating the bound (L15).
