# Research brief: learned-image-compression (Learned image compression)

status: planned (NEW lesson — module APPLICATION, and the course's closing
chapter)
module: principles
type: synthesis
goal: Analyze a learned image codec as a rate-distortion optimization and identify which of the module's results each component implements.
est_minutes: 38

## ARC

- **Inherits:** `R(D)` and the Lagrangian trade-off (`rate-distortion`), KL as a
  coding cost (`kl-divergence`), the compress-while-keeping framing
  (`information-bottleneck`), and the entropy coder itself
  (`arithmetic-coding`).
- **Spine step:** step 11, *Compression aimed at a target* — "…and a learned
  codec runs the whole construction end to end."
- **Contributes:** the course's closing demonstration — every named quantity
  appearing as a term in one trainable objective, in a deployed-class system.
- **Hands off to:** nothing. This is the last lesson, and its closing paragraph
  should name what the whole course established rather than what comes next.

## APPLICATION SPEC (L16 — module 6 and the course close here)

- **Artifact:** Ballé, Minnen, Singh, Hwang & Johnston, "Variational Image
  Compression with a Scale Hyperprior" (ICLR 2018), together with the VAE
  identity it rests on (Kingma & Welling 2014).
- **Module results it uses:** `R(D)` as `min I(X;X̂)` under a distortion
  constraint, realised here as `min` of rate plus `λ` times distortion; the rate
  term computed as a cross-entropy between the true code distribution and a
  learned entropy model, so `kl-divergence` is literally the excess bits paid;
  arithmetic coding, which turns the entropy model into a bitstream; and the
  bottleneck's structure, since the hyperprior is a second latent whose only job
  is to say what the first one costs.
- **Where the artifact departs from the idealisation:**
  1. **Quantization is not differentiable**, so training replaces it with
     additive uniform noise. The trained objective is therefore a relaxation,
     and the deployed codec is not the thing that was optimised.
  2. **The entropy model is factorized** over coefficients that are visibly
     dependent — which is exactly why the hyperprior exists, and the hyperprior
     itself is factorized, so the problem recurs one level up.
  3. **The distortion measure is chosen**, and the choice is visible in the
     output: MS-SSIM training spends bits on low-contrast texture and loses
     high-contrast text, MSE training does the reverse, at nearly the same
     bitrate.
  4. **The decoder's own size is never charged.** The network is assumed shared
     between sender and receiver, exactly the accounting question
     `minimum-description-length` raised.
  5. **`R(D)` is a limit for a known source over long blocks.** Natural images
     are not a known source, and the codec operates on finite images.

## Sources to consult

- **Ballé et al. 2018** (primary) — §1 for the motivation, including the
  purely classical analogy that grounds the whole design: JPEG factorizes its
  entropy model over fixed 8x8 blocks while HEVC transmits a variable block
  partition as side information, so the hyperprior is that side information,
  learned. §2 for the transform-coding view, the rate-as-cross-entropy identity
  (eqs. 1-2), the uniform-noise relaxation, and **eq. 3**, the derivation
  showing that minimising the variational KL is exactly minimising weighted
  distortion plus rate. §3 for the hyperprior itself (eqs. 7-10) and the
  encode/decode pipeline. §4.1 for the architecture; §4.2 for the results, the
  MS-SSIM-versus-MSE artifact comparison, and the side-information measurement.
- **Kingma & Welling 2014** — eq. (1) and eq. (3): `log p(x)` decomposes into a
  KL to the true posterior plus the evidence lower bound, and the bound is
  "negative reconstruction error minus KL to the prior". This is the algebraic
  identity the codec's objective instantiates. Appendix B for the closed-form
  Gaussian KL used as the rate term.
- Cover & Thomas ch. 10 and Polyanskiy & Wu §23.1 for the classical side already
  covered in `rate-distortion`; cite by `<Ref>`.

## Key points the lesson must cover

1. **The architecture, stated as transform coding.** Analysis transform `g_a`,
   quantizer, entropy coder, synthesis transform `g_s`. JPEG is the same
   architecture with a DCT and a hand-tuned quantization table. The novelty is
   that all four stages are trained jointly against one objective.
2. **The objective.** `L = R + λ D`, where `D` is the distortion and `R` is the
   expected code length of the quantized latents under the entropy model. Note
   immediately that `R` is a cross-entropy, so it is the same quantity as a
   classifier's loss, in the same units.
3. **The identity.** Minimising the variational bound of an autoencoder is
   algebraically minimising `R + λD`. Carry the derivation from the VAE side
   (Kingma eq. 3) and from the rate-distortion side, and show they meet. This is
   the course's closing theorem and it deserves the most careful exposition in
   the lesson.
4. **Why a hyperprior.** A factorized entropy model over the latents leaves
   visible structure — the latents are not independent, and the leftover
   structure costs bits, exactly the `D(p||q)` penalty from module 5. The fix is
   to transmit per-coefficient scales as side information and code the latents
   conditionally. This is what HEVC does with block partitions, learned.
5. **The measurement.** Side information costs under about 0.025 bits per pixel
   even at 1.7 bpp total — under 2% of the budget — and buys enough rate to move
   the codec past the prior state of the art. Report it as the paper's number,
   with its dataset.
6. **The distortion measure decides the picture.** Show the paired
   reconstructions: the same photograph at nearly the same bitrate under MS-SSIM
   and under MSE, with the artifacts pointed out. This is the concrete cash-out
   of the caveat `rate-distortion` raised in the abstract.
7. **Course closing.** Name the chain in one paragraph: probability →
   surprisal → entropy → code length → divergence → rate → this objective. Every
   term in `L = R + λD` was defined in this course, and the codec is what
   happens when they are all differentiable at once.

## Pitfalls / subtleties to flag

- The uniform-noise relaxation means the trained model and the deployed model
  differ. This is a real gap, not a formality, and the paper handles it
  explicitly.
- "Beats BPG on MS-SSIM" is a statement about one metric on one dataset. Report
  both metrics, since the paper does and they disagree.
- The hyperprior is not a prior in the Bayesian sense in which the reader may
  expect; it is a learned side channel.
- The rate is an *expected* code length under the model. If the model is wrong
  the real file is bigger, by exactly the divergence.
- Do not present this as the current state of the art. It is the paper that made
  the structure legible; the field has moved.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the transform-coding architecture: `g_a` →
   quantizer → arithmetic encoder → bitstream → decoder → `g_s`, with the
   hyperprior branch `h_a`/`h_s` drawn above it feeding the entropy model. Each
   box labelled with the course lesson that owns it. One idea: the codec is this
   course's table of contents. Deliberately the third instance of the pipeline
   figure family (after DEFLATE and the language model), so the reader sees the
   same skeleton a third time.
2. `draw:` **single `<Figure>`** — JPEG against this: two rows, JPEG's fixed 8x8
   blocks with a hand-tuned quantization table, and the learned analysis
   transform with a learned entropy model, aligned stage by stage. One idea:
   same architecture, learned parameters.
3. `draw:` **`<FigureSequence>` (4 frames)** — the identity: frame 1 the VAE
   bound; frame 2 the two terms named (KL to prior, reconstruction); frame 3 the
   rate-distortion Lagrangian; frame 4 the two written on top of each other with
   the matching terms colour-bound. One idea: two literatures, one objective.
4. `draw:` **single `<Figure>`** — the rate term as a cross-entropy: the true
   distribution of quantized latents beside the entropy model's distribution,
   the excess shaded and labelled `D(p||q)` — the exact figure from
   `kl-divergence`, redrawn with codec quantities. One idea: the entropy model's
   error is paid in file size.
5. `draw:` **single `<Figure>`** — the side-information budget as a stacked bar
   at three total bitrates, the hyperprior slice barely visible, annotated with
   its fraction. One idea: the metadata is nearly free and it prices everything
   else.
6. `source:` **variationali-fig2-latents** → save as
   `figures/balle-latents-whitened.png`, centered, in the hyperprior section.
   Crop to the four-panel top strip. The reader must be able to see the
   structure in the raw latents and its absence after dividing by the predicted
   scales. This is real inference output and the argument for the hyperprior is
   the visible difference; a drawing would be an assertion.
7. `source:` **variationali-fig6-msssim-plane** and
   **variationali-fig6-mse-plane** → save as
   `figures/artifacts-msssim.png` and `figures/artifacts-mse.png`, placed side
   by side. The reader must be able to compare the grass texture and the
   fuselage lettering between the two, with the bitrate, PSNR and MS-SSIM
   figures captioned. Paired real reconstructions; the whole point is which
   details each metric bought.

Three sourced images. This is the top of the budget and it is justified: the
lesson's two central claims (the hyperprior removes visible structure; the
distortion measure decides which details survive) are both claims about
photographs, and neither can be made with a drawing.
`variationali-fig5-rd-curves` is the alternate if a measured R-D comparison is
wanted in place of one of the above.

## EXERCISE PLAN

1. *(warm-up)* Given a codec's measured rate of 0.19 bpp on a 768x512 image and
   a PSNR of 32.3 dB, compute the compressed file size in kilobytes and the
   compression ratio against 24-bit RGB.
2. **Boundary probe.** Take `λ → 0` and `λ → ∞` in `L = R + λD`. Describe the
   codec each limit produces, and state what the trained analysis transform
   converges to in the first case.
3. **Claim to refute.** "The codec minimises rate-distortion, so it achieves
   `R(D)` for natural images." Give three distinct reasons this cannot be
   concluded, one about the source, one about the relaxation, one about the
   entropy model.
4. **Claim to refute, second kind.** "The MS-SSIM-trained model has worse PSNR,
   so it is a worse codec." Explain what the comparison is actually measuring
   and what evidence would settle the question.
5. **Derivation the lesson skipped.** Starting from the VAE bound, derive
   `L = R + λD` explicitly, identifying which term becomes the rate, which
   becomes the distortion, and where `λ` comes from. State the assumption about
   the likelihood that makes the reconstruction term a squared error.
6. **Research-shaped.** Encode an image with JPEG at three quality settings and
   with a modern codec (WebP, AVIF or a learned codec if available) at matched
   file sizes. Measure PSNR and MS-SSIM for each and plot both rate-distortion
   curves. Report where the two metrics rank the codecs differently, and show
   one crop where the difference is visible.
7. **FORWARD / course closing (E7).** Take the entropy model's assumed
   distribution over quantized latents and the empirical distribution you would
   get from a real image set. Write down the extra bits per image the mismatch
   costs, in the notation of module 5. Then state which single lesson of this
   course each symbol in `L = R + λD` came from. The solution is the course's
   closing synthesis and `<Ref>`s `kl-divergence`, `rate-distortion`,
   `cross-entropy-loss` and `arithmetic-coding`.
