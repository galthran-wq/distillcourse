# Research brief: cross-entropy-loss (Cross-entropy)

status: drafted (kept slug — revise, do not rewrite)
module: information-in-ml
type: core
goal: Explain why minimizing cross-entropy loss drives a model's predictions toward the true label distribution.
est_minutes: 32

## ARC

- **Inherits:** `D(p||q)` as expected extra bits (`kl-divergence`).
- **Spine step:** step 7, *The price of a wrong model* — "…which makes
  cross-entropy loss a compressed file size…"
- **Contributes:** the identification of the standard training loss of every
  classifier and language model with a coding cost. This is the course's main
  bridge into machine learning and it should be stated as an identity, not an
  analogy.
- **Hands off to:** `compression-is-prediction`, which turns the identity into a
  construction.

## Sources to consult

- Cover & Thomas, **§2.3** and **§5.4.3** — the wrong-code theorem is the
  cross-entropy statement; there is no separate "cross-entropy" section, which
  is itself worth knowing.
- MacKay, **ch. 39 §39.3** — training a single neuron by minimizing the
  cross-entropy error function, with the gradient derived; **ch. 44.3** for the
  multi-class softmax version.
- Olah, "Visual Information Theory", the *Cross-Entropy* section — the
  four-scenario grid (Bob's code on Bob's data, Alice's code on Bob's data, and
  the two reverses) giving 1.75 / 2.25 / 1.75 / 2.375 bits. This is the best
  available worked demonstration of the asymmetry and should be recreated as a
  figure.
- Delétang et al. 2024, §2 — the statement that cross-entropy on a stream equals
  expected code length, used in the next lesson.

## Key points the lesson must cover

1. **Definition** `H(p,q) = -Σ p(x) log2 q(x)` and the decomposition
   `H(p,q) = H(p) + D(p||q)`. Derive it in one line from the previous lesson;
   the derivation is trivial and the consequence is not.
2. **Why minimizing it minimizes divergence**: `H(p)` does not depend on the
   model, so `argmin_q H(p,q) = argmin_q D(p||q)`. The loss the practitioner
   minimizes and the quantity they care about differ by a constant.
3. **The one-example case.** For a hard label, `p` is a point mass, `H(p) = 0`,
   and the loss is exactly `-log2 q(y)` — the surprisal the model assigned to
   the truth. Bind this back to lesson one explicitly: the log-loss on a single
   training example is the surprisal from module 1, unchanged.
4. **The confident-wrong blowup.** A model that assigns 0.001 to the true class
   pays about 10 bits; 10^{-6} pays 20. Work the numbers and connect to the
   gradient: the derivative of `-log q` grows as `1/q`, which is why confident
   errors dominate a batch. This is the practical consequence and it is worth a
   worked example rather than a remark.
5. **Soft labels.** With label smoothing or a distillation target, `p` is not a
   point mass, `H(p) > 0`, and the loss has an irreducible floor. Practitioners
   who compare raw loss values across label schemes are comparing different
   floors — a real and common error.
6. **Units.** Frameworks report nats. Bits per token, bits per character and
   bits per byte are the comparable units; the conversion is the topic of
   `language-models-as-compressors` and should be forward-referenced here.

## Pitfalls / subtleties to flag

- Cross-entropy is not symmetric and is not a divergence; `H(p,q) ≥ H(p)` with
  equality iff `p = q`.
- Minimizing cross-entropy is maximum likelihood. Say so once, plainly; many
  readers know one name and not the other.
- The "floor" `H(p)` is the label noise. A loss that stops falling is not
  necessarily a model that stopped learning.
- Softmax plus cross-entropy has a numerically stable joint implementation for
  exactly the reason module 1 gave for working in the log domain.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the decomposition: a stacked bar for `H(p,q)`
   split into the fixed floor `H(p)` and the model-controlled `D(p||q)`, with
   the arrow marked "the only part training can move".
2. `draw:` **single `<Figure>`** — the four-scenario grid: two distributions and
   two codes, all four cross-entropies tallied (1.75, 2.25, 1.75, 2.375 bits),
   arranged as a 2x2 so the asymmetry reads off the layout. Inspiration: Olah's
   *Cross-Entropy* section — recreate the idea, not the drawing.
3. `draw:` **single `<Figure>`** — one example's loss: the model's predicted
   distribution as bars with the true class marked, and `-log2 q(y)` read off
   the true class's bar as a height. One idea: the loss reads one number off one
   bar.
4. `draw:` **single `<Figure>`** — the blowup: `-log2 q` plotted against `q` on
   a log axis with three model outputs marked (0.5 → 1 bit, 0.01 → 6.6, 10^{-6}
   → 20), and the slope annotated. One idea: confident and wrong is expensive.
5. `draw:` **`<FigureSequence>` (3 frames)** — training as divergence descent:
   three frames of the model bars moving toward the true bars, with `H(p,q)`,
   `H(p)` and `D` tallied under each. One idea: the gap closes, the floor does
   not move.
6. `draw:` **single `<Figure>`** — soft labels: the same model output scored
   against a hard label and against a smoothed label, showing two different
   floors. One idea: the loss number is not comparable across label schemes.

No `source:` entry.

## EXERCISE PLAN

1. *(warm-up)* A three-class model outputs `(0.7, 0.2, 0.1)` and the true class
   is the second. Report the loss in bits and in nats.
2. **Boundary probe.** Compute the loss as the model's probability on the true
   class approaches 0 and approaches 1. State what implementations do about the
   first case and why clipping changes the objective being minimized.
3. **Claim to refute.** "Model A has lower cross-entropy than model B on the
   same dataset, so model A assigns higher probability to the correct class more
   often." Give a two-example dataset where the ordering of accuracy and loss
   disagree, and name the property of the loss that permits it.
4. **Derivation the lesson skipped.** Derive the gradient of the softmax
   cross-entropy loss with respect to the logits and show it equals
   `q - p`. Then state what that expression implies about the gradient of a
   confidently wrong prediction.
5. **Derivation, second direction.** Show that minimizing cross-entropy over a
   dataset is exactly maximizing likelihood, and identify the assumption
   (independence of examples) that licences the sum.
6. **Mixed review (E3).** Given a source `p` and a model `q`, compute `H(p)`,
   `H(p,q)`, `D(p||q)` and the expected length of a Huffman code built for `q`
   and used on `p`. Report all four and say which two are equal and why the
   other two differ.
7. **FORWARD (E7).** A language model reports an average loss of 2.1 nats per
   token on a test set of 10,000 tokens covering 46,000 bytes of text. Convert
   to bits per byte, and compute the size of the file this model could produce
   with an ideal coder. Compare against gzip on the same text. Reaches
   `compression-is-prediction` and `language-models-as-compressors` — the
   solution names the equivalence and `<Ref>`s both.

## REVISION (kept slug)

**Gain**
- ARC paragraph; and an explicit binding back to surprisal from lesson one when
  the single-example loss is introduced (C5 spiral, and it is currently
  implicit).
- Figures 2, 4, 5, 6 above. The four-scenario grid in particular carries the
  asymmetry better than prose does.
- The gradient result `q - p` as a worked `<Example>`, which turns the
  confident-wrong observation from an anecdote into a mechanism.
- Soft labels and the floor-comparability point, which the current draft omits
  and which is a live source of confusion in practice.
- Depth toward 32 minutes.

**Lose**
- Any framing of the identity as an analogy ("loss is *like* a code length").
  It is an equality.
- Callouts restating the decomposition immediately after deriving it (L15).
