# Research brief: kolmogorov-complexity (Kolmogorov complexity)

status: planned
module: information-in-ml
type: core
goal: Explain Kolmogorov complexity as the shortest-program limit under all compression.

New lesson closing the ML module. `compression-is-prediction` showed a good model
is a short code; this lesson pushes to the limit — the shortest possible code for
a string is the shortest program that outputs it, `K(x)`. It ties the whole
"compression = prediction = learning" thread to its theoretical ceiling
(Solomonoff's universal predictor) and is the parent of MDL (ideal MDL = a
two-part Kolmogorov code), which follows in the principles module.

## Sources to consult

- Shen, Uspensky & Vereshchagin, *Kolmogorov Complexity and Algorithmic
  Randomness* — the **"What is this book about?" overview** and **ch. 1** for the
  definition, the Solomonoff-Kolmogorov invariance theorem (K well-defined up to
  `+O(1)`), and the counting argument for incompressibility; **ch. 7** for
  `C(x)/N → H` (complexity meets Shannon entropy); **ch. 14.3** for the two-part
  code = MDL principle and Occam's-razor framing. Overview + ch. 1/7/14 are
  lesson-ready; the proof body is deep background.
- Cover & Thomas, **ch. 14 "Kolmogorov Complexity"** — §14.2 definitions,
  §14.3 `K(x) ≈ H` in expectation for i.i.d. computable sources, §14.5
  incompressible/algorithmically-random sequences, §14.6 universal probability /
  Solomonoff, §14.13 MDL. The compact textbook version.
- MacKay, **ch. 28 §28.3** — MDL/Occam as the practical, Bayesian shadow of the
  ideal; the "shortest description" thesis.
- Delétang et al. 2023, §2 "Universal Coding" — the modern statement that
  optimal compression = optimal prediction, with Solomonoff/Hutter as the
  ceiling; ties back to `compression-is-prediction`.

## Key points the lesson must cover

1. **Regularity = compressibility** (concrete opener, reusing MDL's motivating
   trio): three length-n strings — all-zeros, a fair-coin string, a
   `"0101…"`-periodic string — and the length of the shortest program printing
   each. Structure is exactly what a short program exploits.
2. **Definition**: `K(x)` = length in bits of the shortest program (for a fixed
   universal machine) that outputs x and halts. Reuse the code↔program intuition
   from `compression-is-prediction`: a program is a self-extracting archive.
3. **The invariance theorem**: choosing a different universal language changes
   `K(x)` by at most an additive constant (the length of one interpreter), so K
   is well-defined "up to `+O(1)`" and the choice of language does not matter
   asymptotically. This is what makes K a real quantity.
4. **Almost everything is incompressible** (counting argument): there are `2^n`
   strings of length n but fewer than `2^{n-c}` programs shorter than `n-c`
   bits, so at most a `2^{-c}` fraction can be compressed by c bits. Most data has
   no short description — compressibility is the exception.
5. **K is uncomputable** (Berry's paradox / halting): no program computes `K(x)`
   for all x; "the shortest incompressible string describable in under 100 bits"
   is a contradiction. The ideal compressor exists but cannot be run — this is
   why practical compression and MDL use computable approximations.
6. **K meets entropy**: for a computable source, `E[K(X^n)]/n → H` — the
   algorithmic and probabilistic notions of information agree in the limit
   (ch. 7 / Cover §14.3). And the ideal predictor (Solomonoff: mixture over all
   programs weighted `2^{-length}`) is the compression ceiling under
   compression-is-prediction — a good learner approximates it.

## Pitfalls / subtleties to flag

- **Uncomputable ≠ undefined**: `K(x)` is a perfectly well-defined number; it
  simply cannot be computed by any algorithm. Keep the distinction sharp.
- The `+O(1)` invariance constant is real and can be large for a specific string;
  invariance is an **asymptotic** statement. Do not claim a language-free exact
  value.
- `K(x)` is for an **individual string**, unlike entropy, which needs a
  distribution. This is the whole point of the algorithmic view — state it.
- `E[K]/n → H` needs a *computable* source; for arbitrary strings K is the right
  notion and entropy does not apply. Flag the hypothesis.
- Do not present Solomonoff induction as a runnable algorithm — it is
  uncomputable; it is the theoretical optimum practical learners approximate.
- This is lossless/algorithmic; do not conflate with rate-distortion (lossy) —
  one-sentence contrast, they live in different lessons.

## FIGURE PLAN

1. **single `<Figure>` (component)** — three strings, three programs: all-zeros
   (`"print 0 ×n"`, tiny), periodic (`"print '01' ×n/2"`, small), fair-coin
   (no short program, `≈ n` bits), with description-length bars. One idea:
   structure = short program. Inspiration: Shen et al. overview / Grünwald §1.2.
2. **single `<Figure>` (component)** — the invariance theorem: string x compiled
   by machine A vs machine B, the two program lengths differing only by a fixed
   "interpreter" block of length c, bracketed `|K_A - K_B| ≤ c`. One idea: the
   language costs at most a constant. Inspiration: Shen et al. ch. 1 / Cover
   §14.2.
3. **single `<Figure>` (component)** — the incompressibility count: a bin of all
   `2^n` length-n strings, a much smaller sub-bin of the `< 2^{n-c}` short
   programs, arrow "at most `2^{-c}` compressible by c bits". One idea: most
   strings cannot be shortened. Inspiration: Cover & Thomas §14.5.
4. **single `<Figure>` (component)** — Berry's paradox as a loop: a program
   "output the shortest string with `K > 100`" that is itself under 100 bits,
   flagged as a contradiction in warning color. One idea: K cannot be computed.
   Inspiration: Shen et al. ch. 1 non-computability.
5. **single `<Figure>` (component)** — K meets H: a curve `E[K(X^n)]/n`
   descending to the entropy line `H` as n grows, for a biased-coin source. One
   idea: algorithmic and Shannon information agree in the limit. Inspiration:
   Shen et al. ch. 7 / Cover §14.3.
6. **single `<Figure>` (component)** — the ceiling map: `practical model` →
   `Shannon-optimal code (H)` → `shortest program (K)` → `Solomonoff (ideal
   predictor)`, a left-to-right ladder of decreasing description length. One idea:
   compression, prediction, and learning share one ceiling. Inspiration:
   Delétang §2 "Universal Coding".
