# Research brief: information-bottleneck (The information bottleneck)

status: drafted (kept slug — revise, do not rewrite)
module: principles
type: core
goal: Analyze the information bottleneck objective as a trade-off between compression and preserved relevant information.
est_minutes: 36

## ARC

- **Inherits:** `R(D)` and its arbitrary distortion measure (`rate-distortion`),
  the data-processing inequality, and `D(p||q)` (`kl-divergence`).
- **Spine step:** "Rate-distortion needs a hand-picked distortion measure;
  replacing it with mutual information about a target gives the information
  bottleneck, a contrastive loss bounds that quantity where it cannot be
  computed, and a learned codec runs the whole construction end to end."
  (step 11, *Compression aimed at a target*, 1999–2018)
- **Contributes:** an objective in which the distortion measure is *derived*
  rather than assumed, and the information plane as the picture of the
  trade-off.
- **Hands off to:** `infonce` (bounding the quantities when they cannot be
  computed) and `learned-image-compression` (the same Lagrangian, trained).

## Sources to consult

- **Tishby, Pereira & Bialek 1999** (primary) — §1-2.1 recap rate-distortion and
  name its flaw (the distortion function is an arbitrary feature-selection
  choice); §3.1 the objective `L = I(X;T) - β I(T;Y)` with the
  data-processing ceiling `I(T;Y) ≤ I(X;Y)`; **§3.2 Theorem 4** the
  self-consistent solution with the KL divergence emerging as the effective
  distortion; §3.3 the three-way alternating algorithm generalizing
  Blahut-Arimoto; §3.4 the information plane, `dI(T;Y)/dI(X;T) = 1/β`, and the
  phase transitions between cardinalities. **The paper has no figures at all**,
  so every visual must be originated.
  Also §1's motivating examples: the same speech signal with a transcript, a
  speaker ID or a part-of-speech tag as `Y` — same `X`, three different notions
  of relevance.
- **Goldfeld & Polyanskiy 2020** — §II-D for the Gaussian closed form and its
  identity with canonical correlation analysis; §III for the operational meaning
  (remote source coding under log loss); §V for the empirical caveats already
  covered in `estimating-mutual-information`.
- **Alemi et al. 2017 (Deep VIB)** — §3 for the variational bounds that make the
  objective trainable (a decoder lower-bounds `I(Z;Y)`, a marginal
  upper-bounds `I(Z;X)`), eq. 17 for the loss, and Appendix B for the result
  that the plain VAE is this objective with `β = 1`.

## Key points the lesson must cover

1. **The flaw, named.** `R(D)` needs `d(x, x̂)`, and choosing it is choosing
   what matters — a modelling decision disguised as a technical parameter.
   Open with the speech example: the same waveform, with three different `Y`s,
   should be compressed three different ways, and no single distortion measure
   expresses that.
2. **The fix.** Replace the distortion constraint with a second mutual
   information. Minimise `I(X;T)` subject to `I(T;Y)` large, i.e. minimise
   `L = I(X;T) - β I(T;Y)` over stochastic encoders `p(t|x)`, under the Markov
   chain `Y - X - T`.
3. **The ceiling.** `I(T;Y) ≤ I(X;Y)` by the data-processing inequality. The
   information plane is therefore a bounded region, and the frontier is a curve
   inside it. Bind explicitly back to `data-processing-inequality`.
4. **The emergent distortion.** The optimal encoder is
   `p(t|x) ∝ p(t) exp(-β D(p(y|x) || p(y|t)))`. The KL divergence appears in the
   solution without having been assumed anywhere. Quote the paper's own emphasis:
   it "emerged... but is not assumed otherwise anywhere". This is the lesson's
   payoff and the reason the objective is more than a reparameterisation.
5. **β as a dial.** `β → 0` collapses `T` to a single symbol; `β → ∞` recovers
   `X`. Between them, `dI(T;Y)/dI(X;T) = 1/β` traces the frontier, and solutions
   of different cardinality bifurcate at critical `β` values.
6. **What T is not.** `T` is a compressed encoding, not a latent variable in a
   generative model. The Markov chain runs `Y - X - T`, not `Y - T - X`. The
   1999 paper flags this in a footnote and it is the most common confusion;
   state it as a refutation.
7. **Making it computable.** Direct optimisation needs the joint `p(x,y)`.
   Deep VIB replaces both mutual informations with variational bounds and
   optimises the result by gradient descent; the resulting loss is
   reconstruction plus `β` times a KL to a prior — algebraically a VAE. One
   section, with the `β = 1` identity stated.

## Pitfalls / subtleties to flag

- The objective needs the joint distribution of `(X,Y)`. Every empirical claim
  about bottlenecks in trained networks inherits the estimation problems of
  `estimating-mutual-information`; `<Ref>` it rather than restating, and do not
  present information-plane trajectories as measurements.
- The objective is convex in each distribution separately but not jointly, so
  the alternating algorithm converges to a local optimum, like EM.
- The cardinality of `T` must be fixed in advance, exactly as in
  rate-distortion.
- `β` has no units and no natural scale; comparing `β` across problems is
  meaningless.
- Deep VIB's improvements (generalization, adversarial robustness) are empirical
  results on specific benchmarks. Report them as such.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — three relevance targets: one waveform on the
   left with three arrows to a transcript, a speaker ID and a part-of-speech
   tag, each labelled with what a good `T` would keep. One idea: relevance is a
   choice of `Y`, and the paper's own motivating example.
2. `draw:` **single `<Figure>`** — the Markov chain `Y - X - T` drawn correctly,
   beside the wrong version `Y - T - X` marked in warning colour with "this is a
   generative model, not a bottleneck". One idea: the arrow direction is the
   definition.
3. `draw:` **single `<Figure>`** — the information plane: `I(X;T)` horizontal,
   `I(T;Y)` vertical, the `I(X;Y)` ceiling as a horizontal line, the diagonal
   `I(T;Y) ≤ I(X;T)` bound, and the frontier curve between them with three `β`
   points marked. One idea: the achievable region is a triangle-ish wedge and
   the frontier is its edge.
4. `draw:` **`<FigureSequence>` (3 frames)** — sweeping `β`: frame 1 collapse
   (`β` small, `T` constant); frame 2 the knee; frame 3 near-copy. Each frame
   shows the encoder `p(t|x)` as a small matrix beside the point on the plane.
   Binds the InformationPlane demo.
5. `draw:` **single `<Figure>`** — the emergent distortion dissected: the
   solution `p(t|x) ∝ p(t) exp(-β D(p(y|x) || p(y|t)))` with each factor
   labelled above the symbols, and the KL term circled with "not assumed —
   derived". Inspiration: the playbook's formula-dissection rule.
6. `draw:` **single `<Figure>`** — the VIB loss beside the VAE loss, term by
   term, colour-bound, with `β = 1` marked on the VAE. One idea: two names, one
   objective.
7. `source:` **theinformati--fig2-gaussian-ib-curve** → save as
   `figures/gaussian-ib-curve.png`, float right in the closed-form section. The
   reader must be able to see the exact frontier with its rank-transition points
   marked. It is a computed curve tied to specific eigenvalues, and a hand-drawn
   version would misplace the transitions. One sourced image; the Deep VIB
   embedding capture (`deepvariatio-fig2-2d-embedding-flower`) is the alternate
   if the lesson leans on the trained-model side instead.

## EXERCISE PLAN

1. *(warm-up)* On a supplied toy joint `p(x,y)` with 4 inputs and a binary
   label, compute `I(X;Y)`, and compute `I(X;T)` and `I(T;Y)` for two given
   deterministic encoders. Plot both points in the information plane.
2. **Boundary probe.** Evaluate the objective at `β = 0` and as `β → ∞`. Report
   the optimal `T` in each limit and the value of both mutual informations.
   Then state what happens at `β = 1` for a case where `I(X;Y)` is small.
3. **Claim to refute.** "The bottleneck finds the representation that keeps all
   the information about `Y` and none about `X`." Explain why this is
   impossible, using the data-processing inequality, and state what the objective
   actually optimises.
4. **Claim to refute, second kind.** "`T` is a latent variable that generates
   `X`." Refute using the Markov chain direction, and state what changes about
   the factorisation.
5. **Derivation the lesson skipped.** Derive the self-consistent form of the
   optimal encoder by differentiating the Lagrangian with respect to `p(t|x)`
   under the normalization constraint, and identify where the KL term appears.
6. **Derivation, second direction.** Show that the deterministic
   `T = X` encoder achieves `I(T;Y) = I(X;Y)` at cost `I(X;T) = H(X)`, and that
   any encoder with `I(X;T) < I(X;Y)` cannot reach the ceiling. Conclude the
   shape of the frontier's left end.
7. **FORWARD (E7).** For a real problem `X` is an image and `Y` a caption, so
   `p(x,y)` is unavailable and both mutual informations must be bounded rather
   than computed. Write down a lower bound on `I(T;Y)` in terms of a classifier's
   loss, and state the largest value your bound can certify. Reaches `infonce` —
   the solution names the `log2 N` ceiling and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph and the flaw-first opening (rate-distortion's arbitrary
  distortion measure), which the current draft states but does not lead with.
- Figures 1, 2, 5, 6 and the sourced Gaussian curve. The Markov-direction figure
  is required, not optional — it fixes the commonest misreading.
- The Deep VIB section (variational bounds, the trainable loss, the VAE
  identity). The current draft ends at the theory and leaves the objective
  looking unimplementable.
- The Gaussian closed form and its identity with canonical correlation analysis,
  as a `## ★` starred section — it is the one solved case and it is a nice
  "this new idea is an old idea in a famous special case" moment.
- An explicit `<Ref>` to `estimating-mutual-information` wherever an empirical
  information plane is mentioned, with no claim that published trajectories are
  measurements.
- Depth toward 36 minutes.

**Lose**
- Any presentation of the deep-learning information plane as established fact.
  That material now lives in `estimating-mutual-information` with its
  resolution, and this lesson must not duplicate or contradict it.
- Callouts restating the objective (L15).
