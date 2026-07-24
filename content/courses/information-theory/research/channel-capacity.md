# Research brief: channel-capacity (Channel capacity)

status: planned
module: channels
type: core
goal: Compute the capacity of a discrete memoryless channel.

New lesson opening the scope expansion into the second half of Shannon's theory.
Entropy gave the source-coding limit; capacity gives mutual information its own
operational limit. Cover & Thomas fig. 1.2's "two extreme points" (min I =
compression, max I = capacity) is the framing. This lesson is computational:
define the channel, then compute C for the two canonical channels by hand.

## Sources to consult

- Shannon 1948, **Part II, §11-12** — the noisy channel, equivocation
  `H_y(x)`, rate `R = H(x) - H_y(x)`, and capacity `C = max[H(x) - H_y(x)]`;
  **§15-16** work explicit capacity calculations (symmetric channels
  `C = log m + Σ p_i log p_i`).
- Cover & Thomas, **§7.1 "Examples of Channels"** (noiseless binary, noisy
  typewriter, BSC §7.1.4, BEC §7.1.5), **§7.2 "Symmetric Channels"**, **§7.3
  "Properties of Channel Capacity"** — capacity `C = max_{p(x)} I(X;Y)`,
  `0 ≤ C ≤ log|X|`, concavity of I in the input.
- MacKay, **ch. 9, §9.5-9.6** — mutual information of a channel, capacity, worked
  BSC / Z-channel / binary-erasure examples with the maximizing input.
- Polyanskiy & Wu, **ch. 4** (capacity as an information radius / saddle point)
  and **§16.4** (BSC/BEC capacities) — cross-check.

## Key points the lesson must cover

1. **A discrete channel is a transition table** `p(y|x)`: input alphabet X,
   output alphabet Y, one conditional distribution per input. Memoryless = each
   use independent. Concrete opener: the BSC, a bit flipped with probability p.
2. **The channel's noise is `H(Y|X)`**; what the output tells you about the input
   is `I(X;Y) = H(Y) - H(Y|X)`. I depends on both the channel and the chosen
   input distribution `p(x)`.
3. **Capacity** `C = max_{p(x)} I(X;Y)`, in bits per channel use — the most
   information any input can push through. Bound `0 ≤ C ≤ log|X|`.
4. **Binary symmetric channel**: with a uniform input, `I = 1 - H(p)`, and
   uniform is the maximizer (symmetry), so `C_BSC = 1 - H(p)`. Compute at
   p = 0 (C = 1), p = 0.1 (C ≈ 0.53), p = 0.5 (C = 0, useless channel). Show the
   full derivation: `H(Y|X) = H(p)` for any input, `H(Y) ≤ 1` maximized at
   uniform.
5. **Binary erasure channel**: fraction e of symbols erased; `C_BEC = 1 - e`.
   Derive: a received non-erasure is the input exactly; the receiver learns
   `(1-e)` bits per use on average. Contrast the two channels — erasure is
   "easier" than flipping at the same noise level.
6. **The maximizing input is not always uniform**: state that in general C is a
   concave maximization (Blahut-Arimoto computes it) but our two channels are
   symmetric, so uniform wins; the neural-coding lesson uses this again.

## Pitfalls / subtleties to flag

- Capacity maximizes over the **input distribution**, a design choice; it is not
  a property of the channel's noise alone the way `H(Y|X)` is.
- `I(X;Y)` here uses the same MI the course built; capacity is just its maximum
  over inputs. Do not introduce a new information quantity.
- BSC at p = 0.5 has **zero** capacity even though bits still arrive — the output
  is independent of the input. Good `<KeyFact>`: a noisy channel and a useless
  channel are different, and the boundary is C = 0.
- BSC capacity `1 - H(p)` is symmetric in p and 1-p (a channel that flips with
  prob 0.9 is as good as 0.1: just invert the output). Note it.
- Units: bits per channel use (log base 2). The Gaussian channel
  `C = ½ log(1 + P/N)` is out of scope here — one-sentence forward pointer to
  neural-coding, where it is cited not derived.
- Capacity is an *achievable* limit; that it can actually be reached is the next
  lesson's theorem, not assumed here.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the BSC as a two-node transition diagram:
   inputs 0/1 on the left, outputs 0/1 on the right, straight-through arrows
   labeled `1-p` and crossing arrows labeled `p`. One idea: a channel is a
   transition table. Inspiration: Cover & Thomas §7.1.4 / MacKay ch. 9.
2. **single `<Figure>` (component)** — the BEC transition diagram: 0/1 in, 0/`?`/1
   out, erasure arrows to `?` labeled `e`. One idea: erasure flags its own
   failures. Inspiration: Cover & Thomas §7.1.5.
3. **single `<Figure>` (component)** — capacity of the BSC as `1 - H(p)`: the
   binary-entropy curve subtracted from 1, plotted over p, with p = 0, 0.1, 0.5
   marked (C = 1, 0.53, 0). One idea: capacity collapses to 0 at p = 1/2. Reuses
   the binary entropy curve from `entropy-as-average-surprise`.
4. **single `<Figure>` (component)** — `I(X;Y)` vs input bias for a fixed BSC: an
   inverted-U over `p(x=1)`, peaking at the uniform input where I = C. Static
   twin of the ChannelCapacityDial demo. One idea: capacity is a maximum over
   inputs.
5. **`<FigureSequence>` (3 frames)** — the BSC derivation: frame 1 `H(Y|X) = H(p)`
   (same for any input); frame 2 `H(Y) ≤ 1`, maximized at the uniform input;
   frame 3 subtract to `C = 1 - H(p)`. Delta = one line of the derivation per
   frame.
6. **single `<Figure>` (component)** — BSC vs BEC at matched noise: two capacity
   bars for p = e = 0.2 (`C_BSC = 1 - H(0.2) ≈ 0.28` vs `C_BEC = 0.8`), payoff
   "knowing which symbols failed is worth a lot". One idea: erasure beats
   flipping. Inspiration: playbook two-panel comparison.
7. **single `<Figure>` (component)** — the two limits map: a spine
   `min I(X;X̂) = source coding` … `max I(X;Y) = channel capacity`, entropy and
   capacity as the two extreme points of the same quantity. One idea: capacity
   is entropy's mirror. Inspiration: Cover & Thomas fig. 1.2 (recreate).
