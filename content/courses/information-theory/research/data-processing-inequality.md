# Research brief: data-processing-inequality (The data-processing inequality)

status: drafted (kept slug — revise, do not rewrite)
module: shared-information
type: core
goal: Apply the data-processing inequality to bound how much a representation reveals about a target.
est_minutes: 32

## ARC

- **Inherits:** `I(X;Y)` and its chain rule (`mutual-information`).
- **Spine step:** step 5, *What one variable says about another* — "processing
  can only destroy it…"
- **Contributes:** the single most reused inequality in the second half of the
  course. It caps the information plane in `information-bottleneck`, supplies
  the converse in `noisy-channel-coding`, forces `R(D)` to be a *minimum* over
  test channels, and is the reason a feature extractor cannot invent signal.
- **Hands off to:** `fano-inequality`, which converts the same leftover
  conditional entropy into an error probability.

## Sources to consult

- Cover & Thomas, **§2.8** (the inequality and its corollary
  `I(X;Y) ≥ I(X;g(Y))`) and **§2.9** (sufficient statistics as the equality
  case, with the binomial/Bernoulli example).
- MacKay, **ch. 8 §8.3, exercise 8.9** — the `W → D → R` framing.
- Polyanskiy & Wu, **§2.2 and §2.5** — data processing for divergence (the more
  general statement, from which the mutual-information version follows), and
  strong data-processing inequalities with the contraction coefficient. The
  divergence version is the right one to state as a starred section: it makes
  the mutual-information case a corollary rather than a separate theorem.
- Xu & Raginsky, arXiv:1705.07809 — the generalization bound
  `gen ≤ sqrt(2σ² I(S;W)/n)` as a one-paragraph aside on why this inequality has
  a life in learning theory.

## Key points the lesson must cover

1. **Markov chain notation** `Y → X → T`: `T` depends on `Y` only through `X`.
   Spell out what this means as a factorisation of the joint, and give a
   concrete non-example where the chain fails.
2. **The theorem** `I(T;Y) ≤ I(X;Y)`, and the corollary for deterministic
   `T = g(X)`.
3. **The proof**: expand `I(Y; X, T)` two ways with the chain rule; the Markov
   property kills `I(Y;T|X)`; non-negativity of the surviving term gives the
   bound. Mark the sentence where the Markov assumption is used — it is the only
   place, and readers should see that.
4. **Equality** holds exactly when `T` is a sufficient statistic for `Y` given
   `X`. Work one: the count of heads is sufficient for the bias of a coin, and
   `I(θ; X^n) = I(θ; sum)` exactly.
5. **The layered corollary**: for a chain `Y → X → T_1 → T_2 → … → T_L`,
   information about `Y` is non-increasing along the chain. Every layer of a
   network is such a stage. State it here; `estimating-mutual-information` and
   `information-bottleneck` both build directly on it.
6. **What the theorem does not say.** Processing cannot increase information,
   but it can make information *usable* — a linear classifier on raw pixels may
   fail where the same classifier on learned features succeeds, with `I`
   strictly lower. This is the lesson's reversal seam and it must be stated,
   because the naive reading of the theorem ("so preprocessing is always bad")
   is a genuine and common misreading.

## Pitfalls / subtleties to flag

- The inequality is about mutual information, not about accuracy, loss, or
  usefulness. Point 6 is the guard.
- The Markov condition is an assumption about the *joint*, not about the code
  the practitioner wrote. If `T` peeks at `Y` (label leakage, test-set
  contamination) the chain is broken and the bound does not apply — a
  practically important failure case.
- Randomised processing is allowed; `T` need not be a function of `X`.
- Equality does not mean `T` is invertible: a sufficient statistic can be
  massively lossy about `X` while lossless about `Y`.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the chain `Y → X → T` drawn as three nodes
   with the factorisation written underneath, beside a broken version with an
   extra arrow `Y → T` marked in warning colour. One idea: the assumption is a
   picture.
2. `draw:` **`<FigureSequence>` (3 frames)** — the proof: frame 1 expands
   `I(Y;X,T)` one way; frame 2 expands it the other way; frame 3 strikes out the
   Markov term and reads off the inequality. Delta = one expansion per frame,
   with the shared terms colour-bound.
3. `draw:` **single `<Figure>`** — the layered chain `Y → X → T_1 → … → T_4`
   drawn with a monotonically shrinking bar of `I(T_i; Y)` under each stage. One
   idea: every layer is a ratchet. This figure is reused by
   `estimating-mutual-information` and `information-bottleneck`.
4. `draw:` **single `<Figure>`** — the sufficient-statistic equality case: a
   long binary string collapsing to a head-count, with `I(θ;·)` unchanged and
   `H(·)` collapsing. One idea: lossy about the data, lossless about the
   parameter.
5. `draw:` **single `<Figure>`** — the reversal: two panels, raw features with
   higher `I` but a failing linear boundary, learned features with lower `I` and
   a working boundary. One idea: `I` is not usability.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* For a given chain `Y → X → T` with all three tables supplied,
   compute `I(X;Y)` and `I(T;Y)` and verify the inequality.
2. **Boundary probe.** Find a non-trivial `T` (not a constant, not a bijection)
   for which equality holds exactly, and prove it is sufficient. Then perturb
   the channel `p(t|x)` slightly and report how much `I(T;Y)` drops.
3. **Claim to refute.** "Feature engineering cannot help, because the
   data-processing inequality says processing only loses information." Refute it
   with a concrete classification example, and name exactly what the theorem
   bounds and what it does not.
4. **Claim to refute, second kind.** "A model that achieves higher validation
   accuracy after adding a derived feature must have increased `I(features;
   label)`." Identify the assumption of the theorem that this argument needs and
   whether it holds.
5. **Derivation the lesson skipped.** Prove the divergence form: for a channel
   `K`, `D(KP || KQ) ≤ D(P || Q)`. Then derive the mutual-information version
   from it in two lines.
6. **Research-shaped.** Take a dataset with a label and a leaky column (an ID
   that correlates with the label through collection order). Compute
   `I(label; ID)` and `I(label; ID mod 10)`. Report both, and state which
   Markov chain would have to hold for the second to be a valid summary of the
   first.
7. **FORWARD (E7).** In a network `X → T_1 → T_2 → Ŷ`, suppose a decoder from
   `T_2` guesses `Y` with error probability `Pe`. Argue that `Pe` cannot be
   driven below some floor determined by `H(Y|T_2)`, and try to write that floor
   down. Reaches `fano-inequality` — the solution states the inequality and
   `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph and, in the closing, an explicit list of the four later results
  that use this inequality — the lesson currently reads as a standalone theorem
  and it is in fact the module's load-bearing beam.
- Figures 3, 4, 5 above (the layered chain, the sufficient statistic, the
  reversal). The layered corollary is currently missing entirely and two later
  lessons need it.
- Point 6 written as a proper reversal seam and, if the misreading is judged
  prevalent enough, as a refutation (L13).
- The divergence form as a `## ★` starred section.
- Depth toward 32 minutes.

**Lose**
- Any suggestion that the inequality makes preprocessing pointless.
- Callout restating the inequality after the proof (L15).
