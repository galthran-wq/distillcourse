# Research brief: estimating-mutual-information (Estimating mutual information from samples)

status: planned (NEW lesson — module APPLICATION)
module: shared-information
type: synthesis
goal: Explain why plug-in mutual-information estimates are biased upward and judge when a reported estimate is meaningful.
est_minutes: 36

## ARC

- **Inherits:** `I(X;Y)` computed from a known joint (`mutual-information`), and
  the layered Markov chain along which information can only fall
  (`data-processing-inequality`).
- **Spine step:** step 5, *What one variable says about another* — "…and
  estimating any of it from finite samples is where the theory meets its
  limits."
- **Contributes:** a working scepticism about every reported mutual information
  in the literature, and the specific mechanisms (plug-in bias, binning
  dependence, degeneracy under deterministic maps) that produce wrong numbers.
- **Hands off to:** `neural-coding` (which estimates `I` from spike recordings
  and must be honest about it), `information-bottleneck` (whose empirical claims
  are the case study here), and `infonce` (which exists because direct
  estimation does not scale).

## APPLICATION SPEC (L16 — module 3 closes here)

- **Artifact:** the deep-network *information plane* controversy, 2015-2019,
  read end to end. Shwartz-Ziv and Tishby report a two-phase training
  trajectory; Saxe et al. show the compression phase appears only with
  saturating activations; Amjad and Geiger prove the plotted quantity is
  vacuous for deterministic networks; Goldfeld et al. show what the estimator
  was actually tracking.
- **Module results it uses:** the definition of `I(X;Y)`; the data-processing
  chain across layers `I(X;T_1) ≥ … ≥ I(X;T_L)`; and the entropy bound
  `H ≤ log2 n` that pins the quantized estimate to `log2(dataset size)`.
- **Where the artifact departs from the idealisation:** the network is a
  deterministic map, so `I(X;T)` is either infinite (continuous input) or a
  constant independent of the weights — the quantity plotted as evolving cannot
  evolve. The published curves are therefore measurements of the quantizer, and
  the real phenomenon underneath is geometric clustering of same-class
  representations. This is not a hostile reading: the survey the lesson follows
  is co-authored by one of the field's own, and the resolution is constructive.

## Sources to consult

- **Goldfeld & Polyanskiy 2020** (primary spine for this lesson) —
  §IV-B.2 the information plane and the DPI layer chain; **§IV-B.3 Theorem 2**
  the vacuousness result; §IV-B.4 the quantization proxy
  `I(X; Q_m[T]) = H(Q_m[T])`; §IV-B.5-7 the original claims as their proponents
  stated them; **§V-A** Saxe et al.'s rebuttal (tanh versus ReLU, the linear
  student-teacher counterexample separating compression from generalization, SGD
  versus batch); **§V-B** the bin-size sensitivity with the
  `H(X) = ln(2^12) ≈ 8.3` saturation; **§V-C** the noisy-DNN framework, the
  rate-optimal estimator with its `O(d/√n)` error bound, and the
  compression-as-clustering resolution.
- Cover & Thomas, **§11.1-11.2** (method of types) for the bias mechanism, if a
  derivation of the `(r-1)(c-1)/(2n ln 2)` plug-in bias is wanted; the standard
  Miller-Madow correction can be stated without proof.
- Polyanskiy & Wu, **§5.4** — the general point that estimating information
  quantities in high dimension is exponentially hard.

## Key points the lesson must cover

1. **The gap.** Everything so far assumed the joint table. In practice one has
   `n` samples and must estimate. Set the stage with a computation: draw `n`
   independent pairs from a *provably independent* joint, bin them into `r × c`
   cells, and compute the plug-in `Î`. It is positive.
2. **The bias, quantitatively.** `E[Î] ≈ (r-1)(c-1) / (2n ln 2)` bits for
   independent variables. Every empty-ish cell contributes spurious structure.
   Work one number: `r = c = 20`, `n = 1000` gives about 0.26 bits of pure
   artefact. State the Miller-Madow correction and its limits.
3. **Binning is a choice, and the answer depends on it.** For continuous
   variables the plug-in estimate grows without bound as bins shrink, because
   `I` for a deterministic relation between continuous variables is infinite.
   Show the estimate against bin width on a fixed sample.
4. **The degenerate case that matters.** In a deterministic network with
   continuous input, `I(X;T)` is infinite; with a discrete input of `n` distinct
   points it equals `H(X) = log2 n` for every layer and every weight setting,
   because the map is injective almost everywhere. The quantity cannot move.
   State Theorem 2 with its hypotheses (bi-Lipschitz or strictly monotone
   activations) and give the two-line reason.
5. **What the published curves measure.** `I(X; Q_m[T]) = H(Q_m[T])` — an
   entropy of a quantized representation, which falls when representations
   cluster. Show the bin-size family of curves collapsing to `log2(4096) ≈ 8.3`
   as bins shrink.
6. **The resolution.** Compression, as measured, tracks same-class
   representations pulling together in latent space. That is a real and
   interesting phenomenon; it is just not a mutual information decreasing.
7. **What to do instead**, stated briefly: inject noise so the quantity is
   defined and estimable (the noisy-DNN framework with its `O(d/√n)` bound), use
   a variational lower bound (forward pointer to InfoNCE), or report the
   quantity you actually computed under its own name.

## Pitfalls / subtleties to flag

- The lesson must not read as a takedown. The information-plane picture provoked
  a productive five-year argument and the resolution is a genuine result. Dry
  register, no editorializing.
- Plug-in bias is upward for `I` but the corresponding entropy estimator is
  biased downward — the two are different and mixing them causes confusion.
- Estimating `I` is not merely "hard in high dimension"; the sample complexity
  is provably exponential in dimension. Quote the `O(d/√n)` rate and note that
  `d` sits in the numerator.
- Shuffling the target is the right null control and should be taught as a
  habit.
- `I(X;T) = ∞` is not a paradox; it is what happens when a continuous variable
  determines another exactly.

## FIGURE PLAN

1. `draw:` **`<FigureSequence>` (4 frames)** — the bias, built: frame 1 a scatter
   of 200 independent pairs; frame 2 the same points binned into a 5x5 grid with
   counts; frame 3 the plug-in computation yielding a positive number; frame 4
   the same at 20x20 yielding a much larger one. One delta per frame.
2. `draw:` **single `<Figure>`** — estimated `Î` against sample size for
   independent variables at three bin counts, with the `(r-1)(c-1)/(2n ln 2)`
   prediction overlaid as dashed curves. One idea: the artefact has a formula.
3. `draw:` **single `<Figure>`** — the deterministic-map degeneracy: a layer
   drawn as an injective map, `I(X;T) = H(X)` written under every layer of a
   four-layer chain, all equal. Beside it, the same chain with noise injected,
   showing strictly decreasing values. One idea: the chain is flat until you add
   noise. Reuses the layered-chain figure from `data-processing-inequality`.
4. `draw:` **single `<Figure>`** — the clustering explanation, schematic: two
   scatter panels of the same representation early and late in training, class
   colours pulling together, with `H(Q_m[T])` tallied beneath each. One idea:
   the entropy fell because the points merged into fewer bins.
5. `source:` **theinformati--fig6-infoplane** → save as
   `figures/information-plane-2017.png`, centered, where the original claim is
   stated. The reader must see the layer trajectories and the colour-coded epoch
   scale. This is the figure the entire dispute is about; a redrawn "curve that
   bends" would be an assertion, not evidence.
6. `source:` **theinformati--fig9-tanh-vs-relu** → save as
   `figures/saxe-2018-tanh-relu.png`, centered, in the rebuttal section. The
   reader must be able to compare the tanh and ReLU panels directly. Measured
   result; cannot be redrawn honestly.
7. `source:` **theinformati--fig11-quantization-misest** → save as
   `figures/bin-size-artifact.png`, centered, in the estimator section. Crop
   away the surrounding body text. The reader must see four bin sizes producing
   four different "measurements" of the same training run.
8. `source:` **theinformati--fig12-clustering** → save as
   `figures/compression-is-clustering.png`, centered, at the resolution. The
   reader must be able to line up the marked epochs on the left panel with the
   four scatter panels on the right.

Four sourced images is unusually many for a technical lesson and is justified
exactly once, here: the lesson's subject is a dispute about what four specific
published plots show, and the reader cannot adjudicate it without seeing them.
If the count must come down, drop figure 7 (the bin-size artefact can be redrawn
from a reproduction the reader runs themselves, which is exercise 5).

## EXERCISE PLAN

1. *(warm-up)* Given a 4x4 contingency table of counts, compute the plug-in
   `Î` and the Miller-Madow-corrected value, and report both.
2. **Boundary probe.** Take `n = 20` samples of two independent fair coins
   binned into 2x2. Compute the expected plug-in bias from the formula, then
   state what happens to the estimate as the number of bins approaches the
   number of samples, and why the limit is `min(H(X), H(Y))` rather than zero.
3. **Claim to refute.** "Layer 4 has lower `I(X;T)` than layer 2, so the network
   is discarding information as it goes deeper." State the two conditions under
   which this reading is invalid, and say what quantity the numbers do describe.
4. **Derivation the lesson skipped.** Show that for a deterministic injective
   map `T = f(X)` with `X` discrete, `I(X;T) = H(X)` exactly, independent of
   `f`. Then explain what changes if `f` is many-to-one, and what changes again
   if `X` is continuous.
5. **Research-shaped (the application's core task).** Reproduce the bin-size
   artefact. Generate 4096 samples from any two-dimensional distribution you
   like, push them through a fixed random map, and compute `I(X; Q_m[T])` for
   four bin widths spanning three orders of magnitude. Report all four numbers
   and the value `log2(4096)`. State what agreement with the published claim
   would look like.
6. **Mixed review (E3).** You are given a reported `I(feature; label) = 0.8`
   bits on a dataset of 500 rows with a 30-level categorical feature and a
   binary label. Decide whether to believe it, showing the calculation that
   drives your decision.
7. **FORWARD (E7).** You need `I(X;Y)` where `X` is an image and `Y` is its
   caption. Explain why binning is hopeless here, then design a scheme that
   estimates a *lower bound* by training a classifier to match true pairs
   against `N-1` impostors, and work out the largest bound such a scheme could
   ever certify. Reaches `infonce` — the solution names `log2 N` as the ceiling
   and `<Ref>`s it.
