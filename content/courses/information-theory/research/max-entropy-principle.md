# Research brief: max-entropy-principle (The maximum entropy principle)

status: planned
module: applications
type: core
goal: Derive the maximum-entropy distribution under expectation constraints.

## Sources to consult

- **Jaynes 1957, "Information Theory and Statistical Mechanics"** (Phys. Rev.
  106, 620) — the primary source. **§2 "Maximum-Entropy Estimates"** (eqs.
  2-1–2-15): the principle, the Lagrange-multiplier solution
  `p_i = exp{-[λ0 + Σ_r λ_r f_r(x_i)]}`, the partition function
  `Z(λ) = Σ_i exp{-Σ_r λ_r f_r(x_i)}`, `⟨f_r⟩ = -∂lnZ/∂λ_r`, and the variance
  formula. **§3** (eqs. 3-1–3-8): energy constraint recovers the Boltzmann
  distribution and all of equilibrium statistical mechanics. **§6**: max-ent
  is "a method of reasoning", not a law of physics.
- Cover & Thomas, **ch. 12 "Maximum Entropy"** — §12.1 (Theorem 12.1.1: the
  max-ent distribution under moment constraints has exponential-family form,
  proved via `D(p||q) ≥ 0`, no calculus of variations) and §12.2 (worked
  examples: no constraints → uniform; mean constraint on positive support →
  geometric/exponential). Use the C&T proof — it reuses Gibbs' inequality
  from the kl-divergence lesson, which is the point of the prerequisite.
- Shannon 1948, **§20 property 5** — among fixed-variance distributions the
  Gaussian maximizes differential entropy: mention as the continuous
  counterpart (one paragraph, out of scope with a caveat on differential
  entropy's coordinate dependence).
- Jaynes 1957, **Appendix A** — the axiomatic uniqueness of H (link back to
  what-is-surprise; do not re-derive).

## Key points the lesson must cover

1. **The inference problem**: known expectations do not pin down a
   distribution. Concrete opener — the Brandeis dice problem: a die averages
   4.5 instead of 3.5; infinitely many pmfs on {1..6} have that mean. Which
   to adopt?
2. **The principle**: adopt the distribution that maximizes entropy subject to
   the constraints — the "maximally noncommittal" choice; any other assigns
   structure the constraints do not contain (Jaynes §2 phrasing, quoted or
   paraphrased precisely).
3. **The solution's form**: `p(x) = exp(-λ0 - Σ_r λ_r f_r(x))`, i.e.
   `p(x) = exp(-Σ_r λ_r f_r(x)) / Z(λ)`; the multipliers are tuned so the
   constraints hold, `⟨f_r⟩ = -∂lnZ/∂λ_r`.
4. **The proof via Gibbs** (C&T Theorem 12.1.1 route): for any p satisfying
   the constraints and q of the exponential form,
   `H(p) = -Σ p log p ≤ -Σ p log q = H(q)` where the middle equality uses
   `D(p||q) ≥ 0` and the last equality uses that `log q` is a linear
   combination of the constrained `f_r`. Full derivation, every step visible.
   This is the spiral payoff of kl-divergence.
5. **Worked computation**: solve the Brandeis dice numerically — the tilted
   distribution `p_i ∝ exp(-λ i)` with λ chosen so the mean is 4.5 (give the
   actual numbers; λ ≈ -0.371, p ranges ≈ .054 to ≈ .348 — recompute, do not
   trust these from memory). Check the uniform special case (no constraints,
   or mean 3.5 → λ = 0).
6. **Two instances of the same solution**: the Boltzmann distribution
   `p_i ∝ exp(-E_i/kT)` (energy expectation constraint; Jaynes §3 — statistical
   mechanics as inference, ergodicity not required) and the softmax layer /
   exponential-family models in ML (logits as negative constraint functions,
   temperature as 1/λ scaling). State both precisely.
7. **What max-ent is and is not** (Jaynes §6): a rule for turning partial
   information into a distribution without inventing more; the output is only
   as good as the constraints fed in.

## Pitfalls / subtleties to flag

- The course assumes no calculus of variations: use the Gibbs-inequality proof
  (C&T §12.1), and present the Lagrange route only as a remark for readers who
  know multipliers. Jaynes' own derivation is the multiplier one.
- **Sign conventions differ** across sources (λ vs -λ, base e vs base 2).
  Fix one convention (natural log for the derivation, convert entropy to bits
  at the end) and state it.
- Constraints must be **satisfiable and non-contradictory**; and for some
  constraint sets no maximizer exists (C&T §12.3 "anomalous" cases) — flag in
  one sentence, out of scope.
- The continuous case uses differential entropy, which is coordinate-dependent
  and can be negative (Shannon §20 property 8) — do not silently extend the
  discrete statements.
- Max-ent gives a *distribution*, not a frequency claim; Jaynes' subjective vs
  objective discussion (§4) is beyond scope — one remark at most.
- Do not overclaim for physics: the lesson shows the Boltzmann form drops out
  of the energy constraint; whether this "founds" statistical mechanics is
  Jaynes' argument, attribute it as his.

## FIGURE PLAN

1. **`<FigureSequence>` (4 frames)** — the Brandeis dice solved: frame 1 the
   uniform die (mean 3.5); frame 2 the constraint stated (mean = 4.5) with
   many candidate pmfs sketched; frame 3 the exponential tilt appears
   `p_i ∝ exp(-λ i)`; frame 4 λ tuned, final bars with values and H readout.
   Delta = one step of the solution per frame. Inspiration: Jaynes §2 applied
   to the classic Brandeis example.
2. **single `<Figure>` (component)** — the feasible set schematic: the simplex
   of pmfs with the constraint plane cutting it and entropy level sets;
   the max-ent point marked where the highest H contour touches the plane.
   One idea: constraints leave a set, entropy picks a point.
3. **single `<Figure>` (component)** — the formula dissected:
   `p(x) = exp(-Σ λ_r f_r(x)) / Z(λ)` with labels-above-symbols arrows —
   "constrained quantity", "one multiplier per constraint", "normalization =
   partition function". Playbook formula-dissection rule.
4. **`<FigureSequence>` (3 frames)** — the Gibbs proof: frame 1 the candidate
   p and the exponential q with the same constrained expectations; frame 2
   `D(p||q) ≥ 0` unpacked into `-Σ p log p ≤ -Σ p log q`; frame 3 the
   right-hand side collapses to H(q) because log q is linear in the
   constraints. One idea per frame: why nothing beats the exponential form.
5. **single `<Figure>` (component)** — Boltzmann ≡ softmax: two panels, the
   same formula labeled once with physics vocabulary (energy `E_i`,
   temperature, partition function) and once with ML vocabulary (logit,
   temperature, normalizer), the shared skeleton highlighted. One idea: one
   solution, two fields.
6. **single `<Figure>` (component)** — λ as a tilt dial: three dice pmfs for
   λ < 0, λ = 0, λ > 0 (means 4.5, 3.5, 2.5) side by side with H under each;
   entropy is maximal at λ = 0 and drops as the constraint bites. Static twin
   of the MaxEntDice demo. One idea: the multiplier trades entropy for the
   constraint.
