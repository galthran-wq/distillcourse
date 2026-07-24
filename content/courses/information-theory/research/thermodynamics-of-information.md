# Research brief: thermodynamics-of-information (Thermodynamics of information)

status: planned
module: natural-sciences
type: core
goal: Explain Landauer's principle and compute the work bound of a Szilard engine.

New lesson closing the course. It gives Shannon's entropy a physical price and
closes the `entropy` concept's spiral at its deepest level: a bit is not just a
coding unit but a thermodynamic quantity worth `kT ln 2` of work. It pairs with
`max-entropy-principle` (the two physics faces of the theory) and pays off the
`mutual-information` machinery via the feedback second law, where measured
information enters as `I(X;M)`.

## Sources to consult

- Parrondo, Horowitz & Sagawa 2015, "Thermodynamics of Information" (Nat. Phys.
  11, 131-139) — the primary review.
  - **Maxwell's demon** — the apparent second-law violation and its setup.
  - **Szilard engine** — one molecule, a measured bit, reversible isothermal
    expansion extracting `W = kT ln 2`.
  - **Landauer's principle** — erasing/overwriting one bit dissipates at least
    `kT ln 2`; logical vs thermodynamic irreversibility.
  - **Bennett's resolution** — the demon's memory reset pays back exactly what
    the engine extracted; the full cycle obeys `W_total ≥ 0`.
  - **Feedback second law (Sagawa-Ueda)** — `W ≥ ΔF - kT (ln 2) I(X;M)`:
    measured information is a thermodynamic resource priced in bits of mutual
    information (reuse `mutual-information`).
- Jaynes 1957 (already the max-entropy source) — one back-reference: Boltzmann's
  H and Shannon's H are the same functional; statistical mechanics as inference.
- Landauer 1961 and Bennett 1982 — the original results the review synthesizes;
  cite as primaries in References.

## Key points the lesson must cover

1. **Shannon entropy is thermodynamic entropy** in different units: physical
   entropy `S = k_B ln W` and Shannon `H = -Σ p log p` are the same functional;
   one bit of Shannon entropy is `k_B ln 2` of thermodynamic entropy. Concrete
   opener: the conversion, `1 bit ↔ k_B ln 2 ≈ 9.6 × 10⁻²⁴ J/K`.
2. **Landauer's principle**: erasing one bit — resetting a two-state memory to a
   known value regardless of its prior state — reduces the memory's entropy by
   `k_B ln 2`, so at temperature T it dissipates at least `kT ln 2` of heat
   (`≈ 2.8 × 10⁻²¹ J` at room temperature). Computation, with the number.
   Logical irreversibility (erasure) forces the cost; a reversible copy does not.
3. **The Szilard engine** (worked): one molecule in a box, a partition inserted,
   a measurement of which side it is on (one bit), then reversible isothermal
   expansion against the partition extracts `W = kT ln 2` of work per cycle. One
   measured bit is worth exactly `kT ln 2`.
4. **Maxwell's demon and its resolution**: the demon seems to extract work from
   thermal noise forever, violating the second law. Bennett's resolution: the
   demon's memory must be reset to measure again, and that erasure costs `kT ln 2`
   by Landauer — exactly the extracted work. The full cycle obeys the second law;
   `W_total ≥ 0`. Information is the missing bookkeeping entry.
5. **The feedback second law** (the mutual-information payoff): with measurement,
   the work bound generalizes to `W ≥ ΔF - kT (ln 2) I(X;M)`, where `I(X;M)` is
   the mutual information between the system state X and the measurement outcome
   M. Better measurements (more bits of `I`) license more extractable work. This
   is the same mutual information the course built, now a physical resource.
6. **Why it matters** (precise, not hand-wavy): Landauer's bound is a hard floor
   on the energy cost of irreversible computation — every erased bit in a chip
   has a thermodynamic minimum cost, approached by recent experiments. Cite the
   review's experimental confirmation (optical-trap bit erasure) in one sentence.

## Pitfalls / subtleties to flag

- Landauer's cost is for **erasure (logical irreversibility)**, not for
  computation in general; reversible operations have no such floor. Keep the
  distinction (erasing ≠ writing ≠ copying).
- `kT ln 2` uses **natural** log because it is `k_B` × (entropy in nats); the
  "one bit" factor is the `ln 2` converting bits to nats. State the unit bridge
  carefully (ties back to the surprisal units discussion).
- The demon does **not** violate the second law; the naive paradox omits the
  memory-reset cost. Do not present it as an open puzzle.
- The feedback second law's sign convention and the direction of `I(X;M)` follow
  the review; derive the bound's meaning, do not just quote a formula.
- This is a **lower bound** on dissipated heat / an **upper** bound on extractable
  work — real devices sit well above the Landauer floor. Do not claim current
  hardware runs at the limit.
- Shannon ↔ thermodynamic entropy equality is a statement about the same
  functional, made precise by Jaynes; attribute the "statistical mechanics as
  inference" reading to him, one remark.

## FIGURE PLAN

1. **single `<Figure>` (component)** — the units bridge: one bit shown as
   `H = 1 bit` (Shannon) and `ΔS = k_B ln 2` (thermodynamic), a labeled
   conversion arrow `× k_B ln 2`. One idea: entropy is one quantity, two units.
   Ties back to the surprisal units strip.
2. **`<FigureSequence>` (4 frames)** — the Szilard cycle: frame 1 one molecule in
   a box; frame 2 partition inserted; frame 3 measurement records which side
   (one bit); frame 4 reversible expansion extracts `W = kT ln 2`. Delta = one
   step. One idea: a measured bit is worth `kT ln 2`. Inspiration: Parrondo et
   al. Szilard figure (recreate — this is the field's canonical diagram).
3. **single `<Figure>` (component)** — Landauer erasure: a double-well potential
   (two memory states) collapsed to a single well (reset), the freed entropy
   `k_B ln 2` leaving as heat `Q ≥ kT ln 2`, with the room-temperature number.
   One idea: forgetting a bit costs heat. Inspiration: Parrondo et al. bistable-
   potential figure (recreate).
4. **`<FigureSequence>` (3 frames)** — the demon's balance sheet: frame 1 demon
   measures + extracts `kT ln 2`; frame 2 demon's memory fills (books unbalanced,
   apparent violation); frame 3 memory reset pays `kT ln 2` back, `W_total = 0`.
   One idea: the reset closes the loophole. Inspiration: Bennett's resolution /
   Parrondo feedback-cycle figure.
5. **single `<Figure>` (component)** — the feedback second law dissected:
   `W ≥ ΔF - kT (ln 2) I(X;M)` with labels-above-symbols — "free-energy change",
   "measured information", "the bits you gathered buy this much extra work". One
   idea: mutual information is a physical resource. Inspiration: Sagawa-Ueda
   result as stated in the review.
6. **single `<Figure>` (component)** — the two physics faces: a small panel
   pairing `max-entropy` (Boltzmann `p ∝ e^{-E/kT}`) with `Landauer` (a bit costs
   `kT ln 2`), both labeled "Shannon H = thermodynamic S". One idea: the course's
   entropy is the physicist's entropy. Inspiration: Jaynes 1957 / course spiral.
