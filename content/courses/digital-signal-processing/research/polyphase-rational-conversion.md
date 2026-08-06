# Research brief: polyphase-rational-conversion (Polyphase Rational Sample-Rate Conversion)

status: planned
module: multirate-communications-and-compression
type: core
goal: Design an efficient $L/M$ converter using polyphase components, noble identities, and a low-rate schedule.
est_minutes: 40

## ARC

- **Inherits:** **Decimation, Interpolation, and Anti-Alias Filtering** established analyze integer sample-rate changes and specify filters that prevent folding and suppress images.
- **Spine step:** “Rate changes are filtering problems, and polyphase schedules and filter-bank matrices remove redundant work while controlling alias transfer.” (*Rates become channel structures*). Caption: “Rational conversion opens an optional rigorous reconstruction-bank and wavelet branch.”
- **Contributes:** Design an efficient $L/M$ converter using polyphase components, noble identities, and a low-rate schedule. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** the optional `perfect-reconstruction-filter-banks` advanced branch. The required core path may continue directly to analytic signals, quantization, and the final link without this handoff.

## Sources to consult

- Vaidyanathan, ch. 4 §§4.3–4.4 — Type-1/Type-2 polyphase forms, efficient structures, commutators, and fractional conversion.
- MIT 6.341, Lectures 10–11 and PS5–PS6 — sampling-rate conversion, noble identities, consistent resampling, polyphase structures, and operation counts.
- Orfanidis, ch. 14 §§14.2.2 and 14.6 — low-rate phase branches and 44.1↔48 kHz conversion.
- Lyons, ch. 10 §§10.7–10.13 — polyphase, rational factors, half-band and IFIR converters.

## Key points the lesson must cover

1. Expansion, filtering, and decimation implement $L/M$.
2. Polyphase components partition coefficients by residue.
3. Noble identities move filters across rate changers.
4. 44.1 kHz to 48 kHz uses $160/147$.

## Pitfalls / subtleties to flag

- Large coprime ratios, phase accumulators, fractional delay, filter startup, coefficient tables, and clock drift complicate the ideal identity.
- The expand-filter-decimate diagram defines the converter, but executing inserted zeros or computing samples later discarded is a scheduling error, not an unavoidable cost of the mathematical system.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- 44.1↔48 kHz becomes 160/147; the direct expanded-rate diagram is conceptually correct and computationally absurd until polyphase scheduling removes zeros and discarded samples.
- Worked case grounded in Lyons ch. 10: reduce 48 kHz to 44.1 kHz as $L/M=147/160$, partition one prototype into 147 residue classes, and verify the scheduled output against the expand-filter-decimate reference while counting only products that reach retained outputs.

## FIGURE PLAN

1. `draw:` **FIR coefficients dealt into M residue-class branches.** (sequence, 3–7 frames; one delta per frame) — Draw: polyphase decomposition is an explanatory process.
2. `draw:` **Noble-identity transformation moving filters across a rate changer.** (sequence, 3–7 frames; one delta per frame) — Draw: each frame changes one block location.
3. `draw:` **441/480 output-phase timeline showing which branch fires.** (single) — Draw: the execution schedule needs literal indices.
4. `draw:` **Direct versus polyphase multiply and memory ledger.** (single) — Draw: the implementation comparison is explanatory.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* For $L/M=3/2$, $h=[1,2,3,4,5,6]$, and $x=[1,2]$, partition $h$ into three interpolation phases, then compute retained output by expand-filter-decimate and by the phase schedule. Deliver phases $[1,4]$, $[2,5]$, $[3,6]$, the fired-phase timeline, and equality at $[1,3,9,8,12]$.
2. **E6 — boundary probe.** Treat L=M, coprime versus reducible ratios, the final partial buffer, and a one-tap prototype.
3. **E6 — claim to refute.** Refute 'interpolation by L requires evaluating L−1 zeros through every tap' with an output-phase schedule.
4. **E6 — derivation not shown.** Derive one Type-I polyphase form and prove sample equality for a short rational converter.
5. **E6 — strategy choice.** Implement 48-to-44.1 kHz conversion ($L/M=147/160$) with an input-driven polyphase scheduler for 480-sample source callbacks and an output-driven phase accumulator for 441-sample sink requests with $\pm50$ ppm drift. The cue is which clock owns the callback and FIFO bound; submit 20 phase indices, counts, occupancy, multiplies, and error below $10^{-10}$ against direct reference.
6. **FORWARD (E7, optional branch).** Arrange two polyphase branches as analysis channels and derive the alias term after downsampling; the optional advanced lesson asks synthesis to cancel it. Reaches optional `perfect-reconstruction-filter-banks`; the required core path does not depend on this transfer, and the solution must name the connection and include a `<Ref>`.
