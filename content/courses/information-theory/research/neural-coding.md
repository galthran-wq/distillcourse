# Research brief: neural-coding (Mutual information of a neural code)

status: drafted (kept slug — revise; the lesson MOVES module, from
natural-sciences to channels, and stays `type: extra`)
module: channels
type: extra
goal: Estimate the information a neural spike code carries about a stimulus.
est_minutes: 30

## ARC

- **Inherits:** `I(X;Y)` (`mutual-information`), capacity as a maximised mutual
  information (`channel-capacity`), and the estimator warnings from
  `estimating-mutual-information`.
- **Spine step:** step 6, *The second limit* — carried as an off-path chapter.
  The core path survives skipping it entirely; nothing downstream requires it.
- **Contributes:** a demonstration that the channel formalism applies to a
  system nobody designed, with real measured numbers.
- **Hands off to:** nothing required. Read after `channel-capacity` and
  `estimating-mutual-information`.

## Why it moved

The previous plan gave it a `natural-sciences` module of its own alongside
`thermodynamics-of-information`. Two off-path chapters do not make a module, and
neither can close a module with an application. Re-homed as an `extra` inside
the channels module, where "a neuron is a noisy channel" is the sentence it
starts from. `thermodynamics-of-information` moves to the principles module for
the same reason. Neither lesson is dropped.

## Sources to consult

- **Borst & Theunissen 1999** (primary) — Box 2 for the three equivalent
  decompositions `I(R,S) = H(R) - H(R|S) = H(S) - H(S|R) = H(R)+H(S)-H(R,S)`;
  the direct method for estimating `H(R)` and `H(R|S)` from binarised spike
  trains; the definition of coding efficiency as transmitted information over
  channel capacity; and **Table 2** for the cross-species numbers (fly H1 and
  others, on the order of 1 bit per spike, efficiency strongly
  stimulus-dependent).
- Cover & Thomas, **§2.3-2.4** for the identities being used; nothing new.
- Goldfeld & Polyanskiy §V-C for the estimator caveats, already covered in
  `estimating-mutual-information` and cited by `<Ref>` rather than restated.

## Key points the lesson must cover

1. **The model.** Stimulus `S`, response `R` (a binned spike train). The neuron
   is a channel `p(r|s)`. Nothing in the formalism cares that the channel is
   made of protein.
2. **The direct method.** Bin the spike train into words of `T/Δt` bins; estimate
   `H(R)` from the word distribution across all stimuli and `H(R|S)` from the
   word distribution at each fixed stimulus, averaged. `I = H(R) - H(R|S)`.
   Work a small joint table end to end.
3. **Bits per spike.** Divide by the mean spike count. Report the measured
   order of magnitude — about 1 bit per spike across several preparations — and
   say what it is a measurement *of*: this neuron, this stimulus ensemble, this
   bin width.
4. **Coding efficiency** `I / C`: how much of the channel the code actually
   uses. State the capacity side honestly — for a spike train the natural
   capacity bound is the entropy of the binned word distribution at the maximum
   attainable rate, and comparing against it requires assumptions the lesson
   should name.
5. **Ensemble dependence.** `I(S;R)` is meaningless without specifying the
   stimulus distribution. Naturalistic stimuli raise measured efficiency
   substantially. This is not a technicality; it is the central caveat and it is
   the same point `channel-capacity` made about the maximising input.

## Pitfalls / subtleties to flag

- Every estimate here is a plug-in estimate from limited trials, so it is biased
  upward. `<Ref>` `estimating-mutual-information` and state the direction of the
  bias, with the number of trials required for the reported precision.
- Bin width `Δt` is a choice and the answer depends on it — the same disease as
  the information plane, in a respectable clinical setting.
- Do not derive continuous-channel capacity. The Gaussian-channel bound methods
  in the source exist and are out of scope; state their existence and move on.
- Cite the measured numbers as the source's, for the specific preparation, never
  as biological constants.
- "The neuron transmits 1 bit per spike" is not a claim about what the animal
  perceives; it bounds what a downstream decoder could recover.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the neuron as a channel: stimulus ensemble on
   the left, spike train on the right, `p(r|s)` on the arrow, `H(R|S)` labelled
   as the noise. One idea: the diagram from `channel-capacity`, relabelled.
2. `draw:` **`<FigureSequence>` (4 frames)** — the direct method: frame 1 a raster
   of spike trains across repeated trials; frame 2 binning into words; frame 3
   the word histogram at one stimulus giving `H(R|S=s)`; frame 4 the pooled
   histogram giving `H(R)`, with `I` read off as the difference.
3. `draw:` **single `<Figure>`** — bits per spike across the preparations in the
   source's Table 2, as a labelled dot plot with the ensemble type noted beside
   each point. One idea: the number is around one bit and it varies by a factor
   of a few.
4. `draw:` **single `<Figure>`** — the bin-width dependence: estimated `I`
   against `Δt` on a fixed synthetic dataset, with the plug-in bias direction
   arrowed. One idea: the same caveat as the information plane, in a lab.
5. `draw:` **single `<Figure>`** — coding efficiency as a filled bar: `I`
   shaded inside the capacity bar, with the ensemble named. One idea:
   efficiency is a ratio and both terms need a stated ensemble.

No `source:` entry — the review is paywalled and its figures are not in the
image pool; the numbers are quoted in text with a full citation.

## EXERCISE PLAN

1. *(warm-up)* From a supplied stimulus-response table, compute `H(R)`,
   `H(R|S)`, `I(S;R)` and bits per spike.
2. **Boundary probe.** A neuron fires with the same rate regardless of stimulus
   but with different timing precision. Construct a small table where the rate
   carries zero information and the timing carries one bit, and state what bin
   width is required to see it.
3. **Claim to refute.** "This neuron carries 1.2 bits per spike, so it carries
   1.2 bits per spike about any stimulus." Refute it, and name the quantity that
   would have to be specified for the claim to be well posed.
4. **Derivation the lesson skipped.** Show that the three decompositions in the
   source's Box 2 are algebraically identical, starting from the definition of
   `I` as a divergence.
5. **Research-shaped.** Using published spike-count data or a simulated
   Poisson neuron with a stimulus-dependent rate, estimate `I(S;R)` by the direct
   method at three bin widths and three trial counts. Report the nine numbers as
   a grid and state which axis moves the estimate more.
6. **FORWARD / cross-link (E7).** Compute the plug-in bias for your grid in
   exercise 5 using the `(r-1)(c-1)/(2n ln 2)` formula and subtract it. Report
   how much of the apparent information survives. This reaches back to
   `estimating-mutual-information` rather than forward — for an off-path chapter
   that is the right direction, and the solution `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph stating that this is an off-path chapter and what it assumes.
- `estimating-mutual-information` as a prerequisite, with the estimator caveats
  cited rather than re-derived — the current draft either omits them or repeats
  them.
- Figures 3 and 4 (the cross-preparation dot plot and the bin-width dependence).
- Explicit statement of the ensemble-dependence caveat in the body, at the point
  the headline number is first quoted.
- Depth toward 30 minutes.

**Lose**
- Any statement of a bits-per-spike figure without its preparation and ensemble.
- Any hint of continuous channel capacity being derived.
