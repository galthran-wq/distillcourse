# Research brief: channel-capacity (Channel capacity)

status: drafted (kept slug — revise, do not rewrite)
module: channels
type: core
goal: Compute the capacity of a discrete memoryless channel.
est_minutes: 34

## ARC

- **Inherits:** `I(X;Y)` as the information one variable carries about another
  (`mutual-information`).
- **Spine step:** "Noise makes distinct inputs produce overlapping outputs;
  maximizing mutual information over the input distribution gives a rate that is
  achievable and above which reliable communication is impossible." (step 6,
  *The second limit*, 1948–2020)
- **Contributes:** `C = max_{p(x)} I(X;Y)` and the closed forms for the two
  channels used everywhere after (BSC and BEC).
- **Hands off to:** `noisy-channel-coding`, which supplies the operational
  meaning without which `C` is just a maximisation.

## Sources to consult

- Cover & Thomas, **§7.1** — the five worked example channels (noiseless binary,
  non-overlapping outputs, noisy typewriter, BSC, BEC) each with its capacity
  computed; **§7.2** symmetric channels and the shortcut formula; **§7.3**
  properties of `C` (non-negative, bounded by `log|X|` and `log|Y|`, concave in
  `p(x)`).
- MacKay, **ch. 9 §9.3-9.5** — the same channels plus the Z channel, the
  `I(X;Y)`-against-input-bias curves (his figs 9.2-9.3), and the noisy
  typewriter's exact capacity `log2 9` achieved by a length-1 code.
- Weissman (EE376A), **§5.2.1** — BSC and BEC capacity derived compactly.
- Polyanskiy & Wu, **§4.4-4.5** — capacity as an information radius and the
  saddle-point characterisation, with the unique capacity-achieving *output*
  distribution. Good material for a starred section.
- Shannon 1948 Part II, **§12** (equivocation, and the 1000 bits/sec 1%-error
  worked example giving 919 bits/sec) and **§16** (symmetric-channel formulas).

## Key points the lesson must cover

1. **A channel is a conditional distribution** `p(y|x)`, nothing more. Draw the
   transition diagram; the noise is `H(Y|X)`.
2. **Why a maximisation.** The channel is fixed; the input distribution is the
   engineer's choice. `I(X;Y)` depends on both, so the channel's own figure of
   merit is the maximum over inputs. Show `I` against input bias for a fixed BSC
   so the maximum is visible.
3. **BSC**: `C = 1 - H(p)`, attained at a uniform input. Derive it. Note the two
   noiseless cases `p = 0` and `p = 1` and why both give `C = 1`.
4. **BEC**: `C = 1 - e`. Derive it, and note that the answer is exactly the
   fraction of symbols that survive — the erasure channel is the one case where
   the intuitive answer is right.
5. **A channel where intuition fails**: the noisy typewriter (27 letters, each
   received as itself or its neighbour). Capacity is `log2 27 - 1 = log2 13.5`,
   but the achievable-by-inspection code (use every other letter) gives
   `log2 13`. Work both. Alternatively use the Z channel, whose optimal input is
   *not* uniform — a good reversal seam, since the reader will expect symmetry.
6. **Equivocation.** Shannon's own framing: the useful rate is
   `H(X) - H(X|Y)`, and his 1000 bits/sec at 1% error example (919 bits/sec, not
   990) is the sharpest available demonstration that the naive subtraction is
   wrong. Work it.
7. **Properties**: `0 ≤ C ≤ min(log|X|, log|Y|)`; `I(X;Y)` is concave in `p(x)`
   so the maximum is well defined and reachable by hill climbing.

## Pitfalls / subtleties to flag

- `C` has units of bits **per channel use**, not per second, until a symbol rate
  is supplied.
- `C = 0` for the BSC at `p = 1/2` and only there; at `p = 1` the channel is
  perfect (invert every bit).
- The maximising input is uniform for symmetric channels and generally not
  otherwise. Say it once with the Z channel as the counter-instance.
- Capacity says nothing yet about whether the rate is achievable. That is next
  lesson, and this lesson must not borrow it.
- Memorylessness is an assumption: `p(y^n | x^n) = Π p(y_i|x_i)`. Real channels
  with memory have different capacities and the same theory applies to the
  extended channel.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the BSC transition diagram with crossover `p`
   labelled on the diagonal arrows, and `H(Y|X) = H(p)` written beside it.
2. `draw:` **single `<Figure>`** — the channel gallery: BSC, BEC, noisy
   typewriter and Z channel as four small bipartite diagrams, each annotated
   with its capacity formula. One idea: capacity is a property of the arrow
   pattern. Inspiration: Cover & Thomas §7.1's family of five.
3. `draw:` **`<FigureSequence>` (3 frames)** — the maximisation: frame 1 fixes a
   BSC and plots `I(X;Y)` against input bias with a marked non-optimal point;
   frame 2 slides to the maximum; frame 3 labels the maximum `C`. One idea: `C`
   is the top of a curve, and the curve belongs to the channel.
4. `draw:` **single `<Figure>`** — `C = 1 - H(p)` plotted against `p` for the
   BSC beside `C = 1 - e` for the BEC, on shared axes. One idea: the same noise
   level costs very differently depending on whether you know it happened.
5. `draw:` **single `<Figure>`** — Shannon's equivocation example as a bar:
   1000 bits/sec sent, the naive 990 marked wrong, and the correct 919 with the
   equivocation `H(X|Y)` shaded. One idea: an error costs more than the bit it
   destroyed.
6. `draw:` **single `<Figure>`** — the Z channel's asymmetry: the transition
   diagram beside the `I`-against-input-bias curve peaking away from 1/2, with
   the optimal bias marked. One idea: symmetry of the input is a consequence,
   not a rule.

No `source:` entry; every figure here is a diagram or a curve.

## EXERCISE PLAN

1. *(warm-up)* Compute the capacity of a BSC with `p = 0.11` and of a BEC with
   `e = 0.11`, and state which channel is worse and by how much.
2. **Boundary probe.** Compute the capacity of a BSC at `p = 0.5` and at
   `p = 1`. Explain why the two answers differ, and state what physical
   operation rescues the second case.
3. **Claim to refute.** "A channel that corrupts 10% of bits can carry at most
   90% of a bit per use." Refute it in both directions: give the true BSC
   capacity at `p = 0.1`, and give a channel where the naive figure is exactly
   right.
4. **Derivation the lesson skipped.** Derive the BEC capacity from scratch, and
   then derive it a second way by noticing that the receiver knows which symbols
   were erased. State which step of the first derivation the second replaces.
5. **Derivation, harder.** For the Z channel with `p(1→0) = a` and `p(0→0) = 1`,
   maximise `I(X;Y)` over the input bias and show the optimum is not 1/2. Report
   the optimal bias for `a = 0.5`.
6. **Research-shaped.** Model a real link you can measure — a noisy serial line,
   a lossy UDP path, a QR code photographed at an angle — as a BSC or BEC,
   estimate the parameter from a few hundred trials, and report the capacity
   with an honest error range.
7. **FORWARD (E7).** For a BSC with `p = 0.11`, capacity is exactly 0.5 bits per
   use. A repetition code of length 3 achieves rate 1/3. Compute its block error
   probability, then for length 5, then 7. Report whether the error goes to zero
   and what the rate does. Reaches `noisy-channel-coding` — the solution notes
   that repetition buys reliability only by giving up all the rate, and that the
   theorem promises something strictly better, with a `<Ref>`.

## REVISION (kept slug)

**Gain**
- ARC paragraph placing this at the head of spine step 6.
- Figures 2, 5, 6 above. The Z channel and the equivocation example are both
  missing from the current draft and both do real work: one breaks the
  symmetry expectation, the other shows why capacity is not "bits minus errors".
- The noisy typewriter or Z channel as an explicit reversal seam.
- Shannon's 1000 bits/sec worked example.
- Depth toward 34 minutes.

**Lose**
- Any leak of the coding theorem: the current draft's framing of capacity as
  "the rate you can achieve" pre-empts the next lesson. Capacity here is a
  maximised mutual information whose operational meaning is still open — state
  that as the open question.
- Restatement callouts for `C = 1 - H(p)` (L15).
