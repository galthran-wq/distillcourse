# Research brief: naive-bayes (Naive Bayes)

status: planned
module: linear-classification
type: core
goal: Construct a naive Bayes classifier from the conditional-independence assumption and compute smoothed predictions by hand.

## Sources to consult

- CS229 **§4.2** — the derivation, MLE count formulas, and the **Laplace-
  smoothing failure gem**: a word never seen in training ("neurips") forces
  φ=0 for both classes and a 0/0 posterior; the +1 fix. Event models §4.2.2:
  multivariate Bernoulli vs multinomial for text.
- CS4780 **Lecture 5** — the "dice and coins" generative story (one die per
  feature per class); categorical/multinomial/Gaussian NB estimators with
  smoothing as MAP (ties to mle-map's pseudo-counts); **proof that NB is a
  linear classifier**; asymptotic NB↔LR equivalence when NB's assumptions
  hold (feeds lda-gda).
- Murphy **§9.3** — Bayesian NB; the MNIST binarized-digits gem: per-class
  Bernoulli "template" images (Fig 9.6) reaching 84.3% accuracy despite the
  false assumption — the "works anyway" evidence.
- Bishop **§4.2.3, §8.2.2** (Fig 8.24 naive-Bayes graphical model), and
  **§1.5.4** — combining heterogeneous data (X-ray + blood test) via
  conditional independence: p(Ck|xI,xB) ∝ p(Ck|xI)p(Ck|xB)/p(Ck).
- Huyen **§8.1.2** — the four-tweet worked exercise ("classify 'The hamster
  is upset with the puppy'") as exercise material.

## Key points the lesson must cover

1. Bayes' rule for classification; the modeling problem: p(x|y) over 2^d
   configurations is unlearnable; the naive assumption p(x|y) = Π p(x_j|y)
   cuts parameters from exponential to linear in d.
2. **A fully worked spam example first** (L4): 4–6 tiny documents, word
   counts per class, priors, then classify a new message multiplying the
   factors — every number shown. Use log-space sums to avoid underflow (the
   practical detail interviewers check).
3. MLE parameters are counts (state; derivation one line via mle-map's
   categorical result). The **zero-count failure** on an unseen word, then
   Laplace smoothing (α=1 pseudo-counts) — explicitly MAP with a Dirichlet
   prior (spiral to mle-map).
4. Event models: Bernoulli (presence/absence), multinomial (counts), Gaussian
   NB (continuous features, per-class mean/variance); one worked Gaussian NB
   number.
5. NB is a **linear classifier** in log-space (show the log-odds is affine in
   the count features); why it still classifies well when independence fails
   (only the argmax must survive; probabilities get overconfident —
   calibration caveat, forward ref to classification-metrics).
6. When NB wins: tiny training sets, high dimensions, streaming updates,
   cheap baselines; when it loses: correlated features double-count evidence.

## Interview questions to work as exercises

- Huyen's four-tweet classification — full hand computation with smoothing.
- "Why is it called naive? Give a concrete case where the assumption hurts."
  (duplicated feature double-counting — compute the overconfidence)
- "A word appears in test but never in training. What happens and how do you
  fix it?" (0/0; Laplace; why α=1)
- "Show Gaussian naive Bayes with shared variances yields a linear decision
  boundary." (bridges into lda-gda next lesson)
- "NB outputs probability 0.999 — do you trust it?" (independence inflates
  confidence; calibrate)
- "Generative or discriminative? What does that mean here?" (defines the
  terms informally; next lesson deepens — spiral)

## Pitfalls / subtleties to flag

- Multiplying many probabilities underflows; ALWAYS sum logs — say it as an
  implementation Remark.
- Laplace smoothing adds |vocabulary| to the denominator, not 1 — the detail
  hand-computations get wrong.
- Bernoulli vs multinomial differ on absent words (Bernoulli multiplies
  (1−φ) for absences); pick one per example and label it.
- NB's class-prior sensitivity under imbalanced data; priors can be set from
  population rates (Bishop §1.5.4 base-rate machinery, one sentence).
- "NB assumes features independent" is WRONG as stated — it assumes
  *conditional* independence given the class; the marginal features may be
  arbitrarily correlated. Interviewers probe exactly this.

## FIGURE PLAN

1. **single `<Figure>`** — the generative story: class node y with arrows to
   d feature nodes (plate-style), side-by-side with the factored formula;
   colors bind node → factor. Inspiration: Bishop Fig 8.24.
2. **`<FigureSequence>` (4 frames)** — the spam computation: (1) the toy
   corpus and count table; (2) per-class word probabilities; (3) the product
   for the test message assembled term by term; (4) posterior normalization
   and verdict. One number changes visibly per frame.
3. **single `<Figure>`** — the zero-count catastrophe: same pipeline with one
   unseen word zeroing both products, 0/0 flagged; smoothed pipeline beside
   it with ghost pseudo-counts (reuse mle-map's ghost-bar motif).
4. **single `<Figure>`** — parameter-count comparison: full joint 2^d table
   (crossed out, exponential tally) vs d per-class tables (linear tally).
   One idea: what the assumption buys.
5. **single `<Figure>`** — event models side by side on one sentence: the
   Bernoulli presence vector vs the multinomial count vector vs Gaussian NB
   per-class bell curves on one continuous feature.
6. **single `<Figure>`** — NB as a linear classifier: log-odds expanded into
   Σ (count_j × weight_j) + bias with each weight = log(φ_j1/φ_j0); a literal
   dot-product rendering. Inspiration: CS4780 lec 5 linearity proof.
