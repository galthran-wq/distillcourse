# Research brief: language-models-as-compressors (Language models measured in bits per byte)

status: planned (NEW lesson — module APPLICATION)
module: information-in-ml
type: synthesis
goal: Compute a language model's compression rate in bits per byte and account for the gap between it and the model's own description length.
est_minutes: 36

## ARC

- **Inherits:** the model/compressor equivalence (`compression-is-prediction`),
  cross-entropy as code length (`cross-entropy-loss`), the coder that realises
  it (`arithmetic-coding`), the uncomputable ceiling (`kolmogorov-complexity`),
  and the universal baseline (`dictionary-coding`).
- **Spine step:** step 7, *The price of a wrong model* — "…and a trained
  language model a measurable compressor."
- **Contributes:** the measurement. The module's identity claim is tested on a
  real system, in the units the identity predicts, against a real baseline.
- **Hands off to:** `minimum-description-length`, which charges the model for
  itself and reverses the ranking.

## APPLICATION SPEC (L16 — module 5 closes here)

- **Artifact:** Delétang et al., "Language Modeling Is Compression" (ICLR 2024):
  a trained language model driving an arithmetic coder, evaluated as a
  general-purpose lossless compressor on text, images and audio, against gzip,
  PNG and FLAC.
- **Module results it uses:** cross-entropy = expected code length; the
  arithmetic coder's two-bit-per-message overhead; the entropy rate as the
  target; the counting argument (nothing compresses everything); and the
  Kolmogorov/Solomonoff framing of a universal predictor.
- **Where the artifact departs from the idealisation:**
  1. **Tokenization** is a pre-code. The model's loss is per token; the file is
     bytes. Comparing losses across tokenizers without converting to bits per
     byte compares different alphabets.
  2. **Finite context.** The theory's entropy rate conditions on unbounded
     history; a transformer conditions on a fixed window, so chunked evaluation
     restarts the model's state and pays repeatedly.
  3. **Parameter cost is excluded.** The headline rate treats the model as free,
     available to both encoder and decoder. That is legitimate only if the model
     is genuinely shared; otherwise the two-part code applies and the number
     changes by orders of magnitude.
  4. **Train/test overlap** is a real confound for a model trained on a web
     crawl and evaluated on public corpora, and it inflates exactly the quantity
     being measured.
  5. **The comparison baselines are not matched**: gzip has a 32 KB window and
     runs at hundreds of MB/s; the model has billions of parameters and runs at
     kilobytes/s. State the cost axis alongside the ratio axis.

## Sources to consult

- **Delétang et al. 2024** (primary) — §2 for the predictor/compressor
  equivalence and eq. 2; §3 for the experimental setup, chunking and the
  tokenization discussion; the results tables for the headline numbers
  (ImageNet patches to about 43%, LibriSpeech to about 16%, both below PNG and
  FLAC respectively); §3.3 for the parameter-adjusted (two-part) compression
  rate, where the ranking reverses.
  **Caution flagged by the source reader:** the extraction of Tables 1 and 2 had
  interleaved cells. Any individual number quoted must be checked against the
  PDF page image, not the text dump.
- Cover & Thomas, **§6.4-6.6** — the entropy of English, for the target the
  measurement is aiming at.
- MacKay, **ch. 6 §6.5** — the classical benchmark table (gzip, compress, bzip2,
  ppmz) as the pre-neural state of the art, so the comparison has a floor and a
  history.
- Shen et al. / Cover & Thomas ch. 14 — the universal-predictor framing, already
  established.

## Key points the lesson must cover

1. **The unit problem, first.** A model reports nats per token. Two models with
   different tokenizers report incomparable numbers. The fix:
   `bits per byte = (nats per token) × (tokens per byte) / ln 2`. Work a full
   numeric conversion, and show that a model with *worse* nats-per-token can
   have *better* bits-per-byte if its tokenizer is coarser.
2. **The construction, applied.** Model + arithmetic coder = compressor, from
   `compression-is-prediction`. State the overhead (two bits per chunk) and note
   that with chunked evaluation this becomes two bits per chunk, not per file.
3. **The measurement.** Report the headline results: a large model compressing
   text well below gzip, and — the striking part — compressing image patches and
   audio below PNG and FLAC despite never being trained on either. Explain why
   this is evidence about the model rather than about the modality: a good
   predictor of *any* structured byte stream is a good compressor of it.
4. **The baseline matters.** gzip is not a strawman. Give its number, its
   window, and its throughput. The interesting quantity is the ratio at matched
   compute, and nobody reports that.
5. **The reversal.** Charge the model its own parameters. A 70-billion-parameter
   model at even 1 byte per parameter is 70 GB of description; against a
   1 GB test corpus the total description length is worse than gzip's by a wide
   margin. State the crossover corpus size. This is the module's honest ending
   and the hand-off to MDL.
6. **What the number is evidence for.** Compression ratio on held-out data is a
   non-gameable model-quality metric — no metric choice, no threshold, no
   hyperparameter. Its weakness is that it is dominated by the easy majority of
   bytes. One paragraph each way.

## Pitfalls / subtleties to flag

- Bits per byte, bits per character and bits per token are three different
  units. Define all three and use one.
- "The model compresses ImageNet to 43%" is a statement about the specific
  patch-serialisation used. Serialisation order matters enormously for images;
  say so.
- Any comparison against gzip must state whether the model's weights are counted.
  The paper is explicit about this and so must the lesson be.
- A model evaluated on data it may have memorised is not being evaluated on
  held-out data. State the confound; do not adjudicate it.
- Do not extrapolate "compression ratio correlates with capability" into a law.
  It is an observation with a mechanism and a known failure mode.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the unit conversion, dissected: an equation
   with `nats/token`, `tokens/byte` and `ln 2` labelled above their symbols and
   a worked instance plugged in underneath. Inspiration: the playbook's
   formula-dissection rule.
2. `draw:` **single `<Figure>`** — the tokenizer trap: two models on the same
   text, one with a coarse tokenizer and one fine, showing that the ordering by
   nats-per-token reverses under bits-per-byte. One idea: the unit is the
   comparison.
3. `draw:` **single `<Figure>`** — the pipeline: text → tokenizer → model
   probabilities → arithmetic coder → bits, with the module lesson owning each
   stage named beneath. Deliberately mirrors the DEFLATE pipeline figure from
   `deflate-and-zstd`, so the reader sees the same architecture with the model
   swapped.
4. `draw:` **single `<Figure>`** — the results, as grouped bars: compression rate
   for gzip, a small model and a large model, across text, image and audio, with
   PNG and FLAC marked as reference lines. Numbers taken from the paper after
   checking against the PDF page image.
5. `draw:` **`<FigureSequence>` (3 frames)** — the reversal: frame 1 the raw
   compressed size, model excluded; frame 2 the model's parameter cost added as
   a fixed block; frame 3 the same at ten times the corpus size, showing the
   ranking flip back. One idea: the answer depends on how much data you are
   sending.
6. `draw:` **single `<Figure>`** — the crossover: total description length
   against corpus size for gzip and for model-plus-parameters, two lines
   crossing, with the crossover marked in gigabytes. One idea: there is a corpus
   size below which the big model is the wrong tool.

No `source:` entry — the paper's figures are not in the image pool, and every
visual here is a bar chart or a pipeline that is better drawn. Numbers are
quoted in text with the citation.

## EXERCISE PLAN

1. *(warm-up)* A model reports 1.8 nats per token on a corpus with 3.6 bytes per
   token. Compute bits per byte and the compressed size of a 10 MB file.
2. **Boundary probe.** What does the bits-per-byte figure become for a model that
   has memorised the test set exactly? Compute it, then state what the
   arithmetic coder's overhead contributes and why the answer is not zero.
3. **Claim to refute.** "Model A has lower loss than model B, so model A is the
   better compressor." Construct a case using different tokenizers where this
   fails, and give the conversion that settles it.
4. **Claim to refute, second kind.** "The model compresses better than gzip, so
   it has learned more about the data." State the two accounting choices that
   have to be fixed before this comparison means anything.
5. **Derivation the lesson skipped.** Derive the crossover corpus size at which
   a model of `P` parameters (at `b` bits each) plus its compressed output beats
   gzip's output. Express it in terms of the two rates and `Pb`, then evaluate
   for a plausible `P` and rate gap.
6. **Research-shaped (the application's core task).** Take any small language
   model you can run, compute its average loss on a held-out text file, convert
   to bits per byte, and multiply out to a predicted file size. Then actually
   compress the file with an arithmetic coder driven by that model — or, if that
   is impractical, compare the prediction against gzip and zstd. Report the
   predicted and achieved sizes and state what agreement within 2% would mean.
7. **FORWARD (E7).** Repeat exercise 5 but charge the model only for the bits
   needed to specify its parameters *to the precision the data supports* rather
   than at full float precision. Estimate that precision and recompute the
   crossover. Reaches `minimum-description-length` — the solution names the
   `(k/2) log2 n` parameter cost and `<Ref>`s it.
