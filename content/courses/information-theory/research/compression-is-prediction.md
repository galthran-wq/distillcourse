# Research brief: compression-is-prediction (Compression as prediction)

status: planned
module: information-in-ml
type: synthesis
goal: Explain why a better predictive model is exactly a better compressor, and vice versa.

## Sources to consult

- **Deletang et al. 2023, "Language Modeling Is Compression"** (arXiv:2309.10668)
  — the primary ML-tail source. §2 states the predictor <-> lossless-compressor
  equivalence (via arithmetic coding), and the experiments measure a large
  language model as a general-purpose compressor (Chinchilla-70B compressing
  ImageNet to 43.4%, LibriSpeech to 16.4% of raw). Use for the modern statement
  and the empirical payoff.
- MacKay, **ch. 6 "Stream Codes"** — arithmetic coding as the mechanism that
  turns a probabilistic predictor into a near-optimal compressor (coding cost
  `≈ -log2 q(sequence)`, within O(1) bits total). This is the *how* behind the
  equivalence. Also **§6 intro** on why symbol codes (Huffman) fall short and
  stream codes reach the entropy rate.
- Cover & Thomas, **§5.10 "Arithmetic Coding"** and **§5.4** (wrong-code /
  `H(p)+D(p||q)`) — the coding-cost accounting.
- Reuse: `source-coding-theorem-lite` (entropy floor), `cross-entropy-loss`
  (log-loss = coding cost), `entropy-of-english` (entropy rate), `prefix-codes`
  (Kraft budget), `kl-divergence` (mismatch cost).

## Key points the lesson must cover

1. **A predictor defines a compressor**: feed the model's next-symbol
   probabilities `q(x_t | x_{<t})` to an arithmetic coder; the coded length of a
   stream is `≈ -Σ_t log2 q(x_t | x_{<t})` bits = the model's **cross-entropy on
   the stream**. Better predictions (lower cross-entropy) = shorter files.
2. **A compressor defines a predictor**: any lossless coder implicitly assigns
   `q(x) = 2^{-length(x)}` (Kraft budget), so the code *is* a probability model;
   decompressing shortest-first is a maximum-probability prediction.
3. **The entropy floor**: no compressor beats the source's entropy rate
   (`source-coding-theorem-lite`); a perfect predictor hits it, and the shortfall
   of any model is `D(p||q)` extra bits per symbol (`kl-divergence`) — the exact
   mismatch cost.
4. **The whole course in one line**: entropy sets the floor, model mismatch costs
   KL, and prediction is paid for in bits. State it as the synthesis.
5. **Empirical reality** (Deletang): modern language models are strong
   general-purpose compressors, and compression ratio is a clean, label-free
   measure of predictive quality — "compression as an evaluation of intelligence".
6. Worked with the PredictiveCompressor sandbox: same text, three models (uniform
   bytes -> letter frequencies -> bigram), watch bits/char and total size drop as
   the model improves.

## Pitfalls / subtleties to flag

- **The model must be shared or transmitted**: the equivalence is about *coding
  cost given the model*. A fair accounting either fixes the model on both ends or
  includes the model's description length (two-part / MDL code). For a fixed
  pretrained model this is amortized; say so to avoid the "but you cheated by
  shipping a 70B model" objection. Forward-ref `minimum-description-length`,
  which makes exactly this accounting the object of study.
- **Arithmetic coding overhead is O(1) total**, not per symbol — this is why
  stream codes reach the entropy rate where Huffman's per-symbol 1-bit gap does
  not (callback to huffman-by-hand's motivating flaw).
- **Lossless only**: this equivalence is exact for lossless compression;
  lossy compression (JPEG, VAEs as rate-distortion) is a different, related story
  — mention as beyond scope, do not conflate.
- Cross-entropy in *nats* (ML default) vs. *bits* (file size): convert by
  `1 nat = 1.443 bits`. A model's nats/token is its bits/token up to that factor.
- "Better predictor = better compressor" holds for the *achievable* size; a real
  compressor also has implementation overhead. Keep the claim about the coding
  cost, not a specific gzip number.

## FIGURE PLAN

1. **`<FigureSequence>` (4-5 frames)** — the predict-then-code pipeline on a short
   string: frame per symbol, the model emits `q(next | context)`, the arithmetic
   coder narrows its interval, the running bit-count ticks up by `-log2 q`. Delta
   = one symbol per frame. The house-signature process sequence. Inspiration:
   MacKay ch. 6 arithmetic-coding interval diagram (recreate).
2. **single `<Figure>` (component)** — the two-way equivalence: left "predictor ->
   probabilities -> arithmetic coder -> bits", right "bits -> code lengths ->
   `q = 2^{-len}` -> predictor", a bidirectional arrow labeled "same object". One
   idea: prediction and compression are one map. Inspiration: Deletang §2.
3. **single `<Figure>` (component)** — bits/char across three models on the same
   sentence: uniform bytes (8), letter frequencies (~4.1), bigram (~3.x),
   descending toward the English entropy rate line (~1). Static twin of the
   PredictiveCompressor demo. One idea: better model, smaller file.
4. **single `<Figure>` (component)** — coding cost = `H(rate) + D(p||q)` on a
   stream: the entropy-rate floor plus the model's KL excess, as a stacked bar,
   tying the file size to the two quantities the course built. One idea: file
   size = floor + mismatch.
5. **single `<Figure>` (component)** — course capstone map: entropy (floor) ->
   codes/Kraft (spend the budget) -> KL (mismatch cost) -> cross-entropy
   (training) -> compression (prediction), a single left-to-right spine with each
   node labeled by its lesson. One idea: the whole course in one picture. This is
   the synthesis figure.
