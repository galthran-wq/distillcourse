# Research brief: neural-coding (Mutual information of a neural code)

status: planned
module: natural-sciences
type: worked-practice
goal: Estimate the information a neural spike code carries about a stimulus.

New worked-application lesson. The first of a two-lesson closing module applying
information measures outside engineering. A neuron is a noisy channel from
stimulus to spike train; mutual information measures what the spikes reveal, and
coding efficiency measures how much of the channel the code uses. Keep it
discrete and computable — the direct method on a small table — and cite the
continuous Gaussian-channel machinery without deriving it.

## Sources to consult

- Borst & Theunissen 1999, "Information Theory and Neural Coding" (Nat.
  Neurosci. 2, 947-957) — the primary source.
  - **General concepts + Box 1-2** — mutual information replacing the tuning
    curve; the three decompositions `I(R,S) = H(R) - H(R|S) = H(S) - H(S|R) =
    H(R) + H(S) - H(R,S)`.
  - **"Calculating information transfer directly"** — the direct method:
    estimate `H(R)` and the noise entropy `H(R|S)` from repeated-trial
    (binarized) spike counts, subtract.
  - **Data-processing inequality (p. 949)** — why a reconstruction/decoding model
    can only lower-bound the true `I(S;R)` (reuse `data-processing-inequality`).
  - **Table 2** — the cross-species numbers: bits/second, **bits/spike (~1,
    range 0.6-3.2)**, coding efficiency, spike-timing precision. Cite as the
    source's measurements, not universal constants.
  - **Box 3 + upper/lower-bound methods** — the Gaussian-channel bound
    `C = ∫ log₂(1 + SNR(f)) df` and coherence-based bounds: mention, do not
    derive (continuous channel capacity is out of scope).
- Cover & Thomas, **§2.2-2.4** — the entropy/MI identities reused; **§7** for
  channel capacity, reused from `channel-capacity` to define efficiency.

## Key points the lesson must cover

1. **A neuron is a noisy channel** `S → R`: stimulus in, spike response out.
   Concrete opener: a small stimulus-response joint (e.g. 2 stimuli × a few
   spike-count outcomes) with an explicit table.
2. **The direct method**: `I(S;R) = H(R) - H(R|S)`, where `H(R)` is the total
   response entropy and `H(R|S)` the average per-stimulus (noise) entropy.
   Compute both from the table, subtract — this is the entropy/conditional-
   entropy machinery applied verbatim. Also verify via `H(S) - H(S|R)`.
3. **Bits per spike**: divide `I(S;R)` by the mean spike count; recorded single
   neurons land near **~1 bit/spike** (Table 2). Every spike is an
   information-bearing unit, not just an average-rate carrier.
4. **Coding efficiency** = `I(S;R) / C`, the fraction of the neuron's channel
   capacity the code actually uses. Efficiency is strongly stimulus-dependent —
   naturalistic stimuli push it up (Table 2's frog-auditory example, ~20% for
   noise vs ~90% for a natural call). Reuse `channel-capacity` for C.
5. **Estimation caveats** (honest, precise): finite samples **overestimate** MI
   (entropy estimators are positively biased); MI is only meaningful **relative
   to a stimulus ensemble**; decoding-based estimates only lower-bound the true
   MI (data-processing inequality). One paragraph.
6. **The bridge to the rest of the course**: the same finite-sample MI-estimation
   problem is what InfoNCE (already seen) sidesteps with a sampling bound — one
   sentence back-reference.

## Pitfalls / subtleties to flag

- MI estimates from finite data are **biased upward**; a nonzero MI on shuffled
  controls is bias, not signal. State the correction exists (jackknife) without
  deriving it.
- **Information is relative to the stimulus ensemble**: absolute bit numbers do
  not transfer across experiments; efficiency and bits/spike are the comparable
  quantities.
- The continuous Gaussian-channel formula is cited, not derived — this course is
  discrete. Keep the worked computation on the discrete table.
- Bits/spike ~1 is an empirical range across specific preparations (Table 2), not
  a law; hedge it as the review does.
- A decoder that reconstructs the stimulus gives a **lower** bound on `I(S;R)`
  (data-processing) — do not present a decoding estimate as the true value.
- Do not claim the neuron "chooses" a max-entropy or capacity-achieving code;
  efficiency < 1 is the norm.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the neuron as a channel: stimulus S →
   `p(r|s)` → spike train R, drawn like the BSC transition diagram from
   `channel-capacity`. One idea: a neuron is a transition table. Inspiration:
   Borst & Theunissen fig. 2 (recreate schematically).
2. **`<FigureSequence>` (3 frames)** — the direct method on a small table:
   frame 1 the response distribution and `H(R)`; frame 2 the two per-stimulus
   rows and the weighted noise entropy `H(R|S)`; frame 3 subtract to `I(S;R)`.
   Delta = one step. Inspiration: Box 2 decomposition.
3. **single `<Figure>` (component)** — MI beats the tuning curve: left, a mean±sd
   tuning curve that hides overlap; right, the full response distributions per
   stimulus with their MI. One idea: variance summaries lose what MI keeps.
   Inspiration: Borst & Theunissen fig. 1 (recreate with a synthetic example).
4. **single `<Figure>` (component)** — bits per spike: a short spike train with
   the running information tally ticking up ~1 bit per spike. One idea: every
   spike carries information. Inspiration: Table 2 bits/spike column.
5. **single `<Figure>` (component)** — coding efficiency: a capacity bar `C` with
   the transmitted `I(S;R)` shaded inside it, two versions (noise stimulus ~20%,
   natural stimulus ~90%). One idea: efficiency depends on the stimulus.
   Inspiration: Borst & Theunissen efficiency discussion / Table 2.
6. **single `<Figure>` (component)** — the estimation trap: MI vs sample size,
   the raw estimate biased above the true value and decaying toward it, with a
   shuffled-control line sitting above 0. One idea: small samples fake
   information. Warning-color the bias gap. Inspiration: the review's
   finite-sample-bias caveat.
