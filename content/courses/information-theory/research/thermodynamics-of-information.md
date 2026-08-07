# Research brief: thermodynamics-of-information (Thermodynamics of information)

status: drafted (kept slug — revise; the lesson MOVES module, from
natural-sciences to principles, and stays `type: extra`)
module: principles
type: extra
goal: Explain Landauer's principle and compute the work bound of a Szilard engine.
est_minutes: 32

## ARC

- **Inherits:** entropy (`entropy-as-average-surprise`), mutual information
  (`mutual-information`), and the exponential max-entropy form
  (`max-entropy-principle`), which is the Boltzmann distribution.
- **Spine step:** step 9, *Entropy as a choice rule* — "…and in physics that
  choice carries a measurable energy price." Carried as an off-path chapter; the
  core path survives skipping it and nothing downstream requires it.
- **Contributes:** a physical price for a bit, and the demonstration that
  mutual information appears in a thermodynamic inequality with units of joules.
- **Hands off to:** nothing required.

## Why it moved

Paired with `max-entropy-principle`, whose exponential form *is* the Boltzmann
distribution — the two lessons share a derivation. The previous
`natural-sciences` module held only this lesson and `neural-coding`, both
`extra`, which left the module unable to close on an application. Both lessons
are re-homed, neither dropped.

## Sources to consult

- **Parrondo, Horowitz & Sagawa 2015** (primary) — Maxwell's demon and its
  resolution; the Szilard engine (`W = kT ln 2` from one bit); Landauer's
  principle; and the feedback second law `W ≥ ΔF - kT (ln 2) I(X;M)` that prices
  measured information in mutual-information units. The open-access 2023
  Parrondo survey (arXiv:2306.12447) covers the same ground.
- **Jaynes 1957 §3** — the identification of thermodynamic entropy with Shannon
  entropy under a mean-energy constraint; this is the bridge and it is already
  built in the previous lesson.
- Cover & Thomas, **§4.4** — the second law via Markov chains, with the striking
  non-physics illustration (two countries with the same tax system see their
  wealth distributions converge); **§2 historical notes** for Boltzmann's
  gravestone epitaph `S = k log W`.
- MacKay, **Appendix B** — partition functions and phase transitions, if the
  starred material wants it.

## Key points the lesson must cover

1. **Units.** `S_thermo = k ln 2 × H_bits`. One bit is `k ln 2` of entropy,
   which at room temperature is about `3 × 10^{-21}` J/K. Establish the
   conversion before anything else; every later number depends on it.
2. **Szilard's engine.** One molecule in a box; insert a partition; measure
   which side; move the piston isothermally. The extractable work is exactly
   `kT ln 2` per measurement — about `3 × 10^{-21}` J at room temperature. Work
   the cycle step by step.
3. **The apparent paradox.** The engine extracts work from a single heat bath,
   which the second law forbids. Maxwell's demon is the same problem with more
   molecules.
4. **The resolution (Landauer, Bennett).** Measurement can be done reversibly;
   *erasure* cannot. Resetting the demon's memory to a known state dissipates at
   least `kT ln 2` per bit, exactly cancelling the extracted work. The
   accounting closes. Present this as a refutation (L13): the prevalent
   intuition is that the demon's measurement costs the energy, and it does not.
5. **The feedback second law.** With measurement outcome `M`,
   `W ≥ ΔF - kT (ln 2) I(X;M)`. Mutual information appears in a thermodynamic
   inequality, in joules. Compute the bound for a one-bit measurement and
   recover Szilard.
6. **What is and is not settled.** Landauer's bound has been measured
   experimentally in single-particle systems; the bound is a bound and real
   devices dissipate many orders of magnitude more. Give the comparison with a
   modern CMOS switching energy so the reader can see the scale.

## Pitfalls / subtleties to flag

- Landauer's principle is about **logically irreversible** operations. Erasure
  is irreversible; a reversible computation can in principle avoid the cost.
- `kT ln 2` is a lower bound and an extremely small one — roughly `3 × 10^{-21}`
  J against a CMOS transistor switching energy around `10^{-15}` J. State the
  ratio so nobody concludes that Landauer limits current chips.
- Thermodynamic entropy and Shannon entropy are the same quantity only under the
  max-entropy identification of the previous lesson. Do not assert the identity
  without that bridge.
- Maxwell's demon has a long literature of wrong resolutions (measurement costs
  energy). The correct one is about erasure. Name the wrong one explicitly as
  part of the refutation.
- The feedback second law is an inequality; attaining it requires an ideal
  protocol.

## FIGURE PLAN

1. `draw:` **szilard-1..4.svg** (exist, `<FigureSequence>`) — the Szilard cycle:
   insert partition, measure, expand isothermally, remove partition, with work
   and heat tallied per stage.
2. `draw:` **demon-ledger-1..3.svg** (exist, `<FigureSequence>`) — the demon's
   accounting: work extracted, memory filling, erasure cost charged, net zero.
3. `draw:` **NEW, single `<Figure>`** — the unit bridge: `H` in bits on one axis
   and `S` in J/K on the other, with the `k ln 2` conversion drawn as the slope
   and one bit marked at `3 × 10^{-21}` J/K.
4. `draw:` **NEW, single `<Figure>`** — the scale comparison as a log axis:
   `kT ln 2`, a CMOS switching energy, a DRAM refresh, and a joule, marked in
   order of magnitude. One idea: the bound is real and nowhere near binding.
5. `draw:` **NEW, single `<Figure>`** — the feedback second law dissected:
   `W ≥ ΔF - kT (ln 2) I(X;M)`, with each term labelled above the symbols and
   the Szilard case plugged in beneath. Inspiration: the playbook's
   formula-dissection rule.
6. `source:` **maxwell-1871-demon-passage.png** (already in the lesson's
   figures/ with credits) — Maxwell's own description of the demon. Keep;
   float right at the paradox section. The reader must be able to read
   Maxwell's wording, because the whole dispute has been about what exactly he
   claimed.

## EXERCISE PLAN

1. *(warm-up)* Compute the work extractable from a Szilard engine at 300 K and
   at 4 K, and the heat dissipated in erasing one bit at each temperature.
2. **Boundary probe.** What does Landauer's bound become as `T → 0`? State the
   limit, then explain why this does not permit free computation, naming the
   practical quantity that replaces the bound.
3. **Claim to refute.** "Maxwell's demon fails because measuring the molecule's
   position costs energy." Refute this — the standard wrong resolution — and
   state which operation actually carries the cost, with the accounting.
4. **Derivation the lesson skipped.** Derive `W = kT ln 2` for the isothermal
   expansion of a one-molecule gas from half the box to the whole box, using the
   ideal gas law. State which step assumes quasi-static operation.
5. **Derivation, second direction.** Show that the feedback second law reduces
   to Szilard's result when `M` is a perfect one-bit measurement of which half
   the molecule is in, and state what `I(X;M)` becomes for a noisy measurement
   with error probability `ε`.
6. **Research-shaped.** Estimate the total energy a modern data centre would
   dissipate if it operated at the Landauer bound for its bit-erasure rate, and
   compare with its actual power draw. Report the ratio in orders of magnitude
   and state the assumption that most affects your estimate.
7. **Cross-link (E7 in the backward direction).** The demon's memory is a
   channel from the molecule's position to the demon's record. Compute `I(X;M)`
   for a demon whose measurement is wrong 10% of the time, and report the
   reduced extractable work. Reaches back to `channel-capacity` — the solution
   notes the demon is a BSC and `<Ref>`s it.

## REVISION (kept slug)

**Gain**
- ARC paragraph stating this is an off-path chapter and naming its dependence on
  the max-entropy identification of Shannon and thermodynamic entropy.
- Figures 3, 4, 5 above. The scale comparison in particular prevents the common
  over-reading that Landauer constrains current hardware.
- The demon refutation written to the L13 schema, with the wrong resolution
  stated once and rejected.
- Depth toward 32 minutes.

**Lose**
- Any assertion that Shannon and thermodynamic entropy are "the same" without
  routing through the max-entropy identification.
- Any implication that Landauer's bound is close to binding in real computers.
