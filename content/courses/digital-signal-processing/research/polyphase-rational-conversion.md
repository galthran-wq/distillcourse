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

1. **The flaw first.** The correct $L/M$ diagram from the previous lesson
   runs its filter at the intermediate rate $Lf_s$ — for 44.1→48 kHz that is
   $44100\times160=7.056$ MHz of conceptual sample rate, on a stream that is
   mostly inserted zeros and future discards. The mathematics is right; the
   schedule is absurd. Polyphase is the theorem that none of that work was
   necessary.
2. **Type-1 decomposition as coefficient dealing**:
   $H(z)=\sum_{k=0}^{M-1}z^{-k}E_k(z^M)$ — the prototype's taps dealt into
   residue classes. Derive it as pure regrouping (no approximation), then
   show the branch view: each output sample needs exactly one branch's dot
   product.
3. **Noble identities, stated and proved**: $\downarrow M$ then $H(z)$ equals
   $H(z^M)$ then $\downarrow M$ (and the dual for $\uparrow L$). These two
   moves — deal, then commute across the rate changer — ARE the polyphase
   method; everything else is bookkeeping.
4. **The savings is exactly the rate ratio**: an $N$-tap prototype at the
   high rate costs $N$ multiplies per high-rate sample; after polyphase every
   retained output costs $N/L$ (interpolation) or the branch work runs at the
   *low* side of the converter. For $147/160$ the schedule computes ~$N/160$
   of the naive per-output work — the "at most 35%" target in the demo spec
   is conservative bookkeeping on top of this.
5. **The commutator/schedule picture**: which phase fires for output $m$ is
   $\,(mM)\bmod L$-arithmetic — a literal index timeline (figure 3), which is
   also where implementation reality (phase accumulators, FIFO occupancy,
   $\pm$ppm clock drift in the strategy exercise) attaches.
6. **Fractional-delay framing as the forward-looking alternative**: a Farrow
   or table-interpolated fractional delay handles *drifting* ratios where a
   fixed 147/160 schedule assumes locked clocks — one named aside, since the
   streaming-link application meets $\pm50$ ppm drift.
7. **Verification discipline**: the polyphase schedule must match the
   expand-filter-decimate reference below $10^{-10}$ before any cost claim is
   admitted; equality first, efficiency second.

## Misconception to refute (L13)

- "Interpolation by $L$ requires running every tap over the zero-stuffed
  stream, so high-quality resampling is inherently expensive." Prevalent
  because the textbook diagram literally draws the zero-stuffed stream into
  the filter. Refutation: the dealt phases $[1,4]$, $[2,5]$, $[3,6]$ of the
  warm-up compute the identical outputs with no zero ever multiplied — and
  the count is checkable by hand. Replacement model: the diagram defines the
  *map*; the noble identities license a schedule that touches only surviving
  products, and the 7.056 MHz intermediate rate is a coordinate system, not
  a clock that must exist.

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
