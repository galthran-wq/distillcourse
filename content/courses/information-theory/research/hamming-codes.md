# Research brief: hamming-codes (Hamming codes and minimum distance)

status: planned (NEW lesson)
module: channels
type: core
goal: Construct the Hamming (7,4) code, decode a received word by syndrome, and explain why minimum distance does not determine how much noise a code can survive.
est_minutes: 34

## ARC

- **Inherits:** the coding theorem's promise and its non-constructiveness
  (`noisy-channel-coding`).
- **Spine step:** step 6, *The second limit* — the constructive half.
- **Contributes:** one explicit code the reader can build and decode by hand,
  and the sharp negative result that minimum distance is the wrong figure of
  merit — which is what makes the modern sparse-graph codes of the next lesson
  intelligible rather than arbitrary.
- **Hands off to:** `deployed-codes`.

## Sources to consult

- MacKay, **ch. 1 §1.2** — the (7,4) code built from three parity circles, the
  generator and parity-check matrices, syndrome decoding, and the Dilbert
  transmission demonstration. This is the best pedagogical treatment available.
- Cover & Thomas, **§7.11** — the explicit 3x7 parity-check matrix, the 16
  codewords as its null space, the minimum-distance-3 argument, and syndrome
  decoding.
- MacKay, **ch. 13** — the parts that make this lesson more than a construction:
  **§13.2** the "obsession with distance" critique; **§13.3** perfect codes
  (only Hamming, repetition and the Golay codes are perfect); **§13.4** why
  perfectness is unattainable above `f = 1/3`; **§13.5** the Gilbert-Varshamov
  distance and random linear codes; **§13.6** Berlekamp's blind-bat-in-a-cave
  analogy; **§13.7** concatenated Hamming codes as a *good* family with *bad*
  distance; **§13.8-13.9** "distance isn't everything" and the
  bounded-distance-decoder result `f_bd = f/2`.
- Shannon 1948, **§17** — the original appearance of the (7,4) code, credited to
  Hamming, achieving exactly the capacity of the "exactly one error in eight"
  channel.
- Polyanskiy & Wu, **§16.1** — linear codes, generator and parity-check
  matrices, and syndrome decoding for additive-noise channels, stated compactly.

## Key points the lesson must cover

1. **Construction.** Four message bits, three parity bits, each parity bit
   covering a specified subset. Present it first as the three-circle picture
   (each circle must contain an even number of ones), then as the parity-check
   matrix `H` whose null space is the code.
2. **Syndrome decoding.** For a received word `r`, `s = Hr` is zero for a
   codeword; otherwise `s` is the column of `H` corresponding to the flipped
   bit. Because the seven columns of `H` are the seven non-zero 3-bit patterns,
   the syndrome *names* the error position. Decode a worked example.
3. **Minimum distance 3**, established by checking that no non-zero codeword has
   weight below 3, and the consequences: correct any single error, or detect any
   double error, not both.
4. **Perfectness**: the 16 codewords' radius-1 balls contain
   `16 × 8 = 128 = 2^7` words, tiling the space exactly. This is rare — MacKay's
   classification is worth stating: Hamming codes, repetition codes and the two
   Golay codes, and nothing else.
5. **The rate.** 4/7 ≈ 0.571. Compare with the BSC capacity at the noise level
   the code actually survives. For a BSC at `p = 0.05` the code's residual block
   error is about 4%, while capacity at that noise is 0.714 — so the code is
   both leaving rate on the table and not achieving reliability.
6. **The negative result, stated as the lesson's real payload.** A
   bounded-distance decoder corrects up to `⌊(d-1)/2⌋` errors and gives up
   there. That means it tolerates only half the noise Shannon's theorem permits:
   `f_bd = f/2`. Minimum distance is therefore not the quantity that determines
   how much noise a code can survive. Berlekamp's bat analogy — a bat flying
   near a codeword collides with decision-boundary stalactites far more often at
   moderate distances than at the minimum distance — is the memorable version.
7. **The constructive counterexample.** Concatenated Hamming codes form a family
   whose relative minimum distance tends to zero (a "bad" family by the distance
   measure) and which is nevertheless *good* in the coding-theorem sense. Stating
   this kills the distance obsession outright and sets up the next lesson.

## Pitfalls / subtleties to flag

- "Corrects one error" means *guarantees* correction of any single error. It
  does not mean two errors are always detected as errors — with a full
  single-error-correcting decoder, a double error is silently miscorrected into
  a wrong codeword. This is exactly what the demo asks the reader to find.
- The (7,4) code is linear over GF(2); linearity is why the syndrome depends
  only on the error pattern and not on the transmitted codeword. Say this
  explicitly, it is the whole reason syndrome decoding is cheap.
- Rate 4/7 is fixed; there is no knob. Hamming codes exist for
  `(2^m - 1, 2^m - 1 - m)` and their rate tends to 1 as `m` grows, while their
  distance stays at 3 — another instance of the same lesson.
- Do not present distance as useless. It is the right quantity for *guaranteed*
  correction under an adversarial error model; it is the wrong one for average
  error under a probabilistic channel. Naming the model is the resolution.

## FIGURE PLAN

1. `draw:` **`<FigureSequence>` (4 frames)** — building the code with three
   circles: frame 1 places the four message bits in the overlaps; frames 2-4 add
   each parity bit in turn, showing the parity constraint it satisfies. Delta =
   one circle per frame. Inspiration: MacKay ch. 1's Venn construction —
   recreate it, do not copy.
2. `draw:` **single `<Figure>`** — the parity-check matrix `H` as a 3x7 grid with
   its columns labelled by the bit they check, beside the circle picture, with
   colour binding each row to a circle. One idea: the picture and the matrix are
   the same object.
3. `draw:` **`<FigureSequence>` (3 frames)** — syndrome decoding: frame 1 a
   received word with one flipped bit shown in warning colour; frame 2 the
   syndrome computed and matched against a column of `H`; frame 3 the bit
   corrected and the parity restored.
4. `draw:` **single `<Figure>`** — the sphere-packing picture in Hamming space:
   16 codewords with radius-1 balls tiling `2^7` words exactly, with the count
   `16 × 8 = 128` tallied. One idea: perfect means no gaps.
5. `draw:` **`<FigureSequence>` (3 frames)** — the double-error failure: frame 1
   two bits flipped; frame 2 the syndrome pointing at a *third* bit; frame 3 the
   decoder's output, a valid but wrong codeword. One idea: the decoder is never
   confused, it is confidently wrong.
6. `draw:` **single `<Figure>`** — the distance-versus-Shannon gap: a noise axis
   with `f_bd = f/2` marked as the bounded-distance decoder's limit and `f` as
   the Shannon limit, the factor-of-two gap shaded. One idea: distance-based
   decoding forfeits half the noise budget.
7. `source:` **informationt-s1-dilbert-hamming** → save as
   `figures/mackay-hamming-demo.png`, centered, at the end of the construction
   section. The reader must see the four-stage pipeline on a real image and the
   residual error rate after decoding — the point being that a code that
   "corrects any single error" still leaves visible damage at 10% noise, which
   motivates the whole rest of the module. One sourced image.

## EXERCISE PLAN

1. *(warm-up)* Encode the message `1011` with the (7,4) code and report the
   codeword; then decode the received word `1010101` and report the corrected
   message.
2. **Boundary probe.** Find a received word for which the syndrome is zero but
   which is not the transmitted codeword. State the minimum number of bit flips
   required, and explain what this says about undetectable errors.
3. **Claim to refute.** "The (7,4) code corrects one error and detects two, so
   it is safe against any two-bit error." Produce a two-bit error the decoder
   silently miscorrects, and state precisely which of the two guarantees you
   must give up to keep the other.
4. **Derivation the lesson skipped.** Prove that the code's minimum distance is
   exactly 3 by an argument about the columns of `H`, not by enumerating all 16
   codewords. State the general rule connecting minimum distance to linear
   dependence among columns.
5. **Derivation, counting.** Verify perfectness: count the words within Hamming
   distance 1 of each codeword and show the total is exactly `2^7`. Then show
   that no (7,4) code with minimum distance 4 can exist.
6. **Research-shaped.** Simulate the (7,4) code on a BSC. Measure the residual
   *bit* error rate for `p = 0.01, 0.05, 0.1`, and compare against the uncoded
   rate. Report the noise level above which the code makes things worse, and
   compare that level with `f_bd = f/2` for the capacity-limit `f` at rate 4/7.
7. **FORWARD (E7).** Concatenate the (7,4) code with itself (encode each of the
   7 output bits of an inner code with an outer (7,4) code, or the reverse) and
   compute the resulting rate and minimum distance. Report the *relative*
   distance `d/n` and iterate the construction twice more. Reaches
   `deployed-codes` — the solution notes that relative distance tends to zero
   while the family remains good, and `<Ref>`s it.
