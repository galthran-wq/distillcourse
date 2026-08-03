# Research brief: dictionary-coding (Dictionary coding and universal compression)

status: planned (NEW lesson)
module: coding
type: core
goal: Demonstrate LZ77 and LZ78 parsing on a string and explain why they reach the entropy rate without being given the source distribution.
est_minutes: 34

## ARC

- **Inherits:** a coder that spends fractional bits given a model
  (`arithmetic-coding`), and the measured fact that English has an entropy rate
  far below its symbol entropy (`entropy-of-english`).
- **Spine step:** step 4, *Dropping the assumptions* — "…Lempel-Ziv learns the
  source while reading it…"
- **Contributes:** universality. Every previous code needed `p` in advance; this
  one needs nothing and still converges to the entropy rate of any stationary
  ergodic source.
- **Hands off to:** `deflate-and-zstd` (LZ77 is literally half of gzip) and
  `language-models-as-compressors` (gzip is the baseline every "LLMs compress"
  claim is measured against).

## Sources to consult

- **Ziv & Lempel 1977** (primary, LZ77) — §II: reproducible extension and
  pointer, the sliding buffer, the fixed-length codeword
  `L_c = 1 + ⌈log(n - L_s)⌉ + ⌈log L_s⌉`, and the fully worked ternary example
  (`L_s = 9`, `n = 18`) with buffers `B_1..B_4` and codewords `C_1..C_4`. Also
  the small definitional example `S = 00101011` at `j = 3` giving pointer
  `p = 2` and extension `0101`. §I states the scheme's own weakness: error
  propagation.
- **Ziv & Lempel 1978** (primary, LZ78) — eq. (12), the incremental-parsing
  definition, and the (pointer, symbol) integer encoding
  `I = π(j)·α + I_A(next)`. Also the worked parse of
  `0,1,00,01,10,11,000,001,…` and, importantly, the `u(k)` construction — the
  concatenation of all binary words of each length — which is incompressible by
  any finite-state encoder despite a one-line description.
- Cover & Thomas, **§13.4-13.5** — the LZ77 parse of `ABBABBABBBAABABA` and the
  LZ78 parse `A,B,BA,BB,AB,BBA,ABA,BAA…`, both worked by hand, plus the
  optimality statement. **§13.4** also has the 19th-century telegraph-codebook
  history and the Indian numbered-greetings-telegram example.
- Polyanskiy & Wu, **§9.6** — Kac's lemma (`E[recurrence time | X_0 = u] =
  1/P[X_0 = u]`) and the recurrence argument for LZ77's optimality. This is the
  cleanest available intuition for *why* universality works and should carry the
  lesson's proof sketch.
- MacKay, **ch. 6 §6.4-6.5** — the basic LZ algorithm and the real benchmark
  tables comparing a simple arithmetic coder against gzip, compress, bzip2 and
  ppmz on a text file and a sparse binary file.

## Key points the lesson must cover

1. **The flaw, restated.** Every code so far assumed `p` was known. A real file
   arrives with no distribution attached, and transmitting a measured table
   costs bytes and still misses all context structure.
2. **LZ77**: a sliding window over the already-emitted text; the encoder finds
   the longest match starting in the window, emits `(offset, length, next
   literal)`, and advances. Trace the 1977 paper's ternary example, or a short
   English string, frame by frame.
3. **LZ78**: an explicit phrase dictionary. Each new phrase is the shortest
   prefix of the remaining input not already in the dictionary, coded as
   `(index of its longest known prefix, next symbol)`. Trace the parse.
4. **Why it is universal.** Two complementary arguments, both stated, neither
   proved in full:
   - *Counting* (LZ78, Ziv & Lempel 1978 Thm 1): a string parsed into `c(x)`
     distinct phrases needs about `c(x) log c(x)` bits, and `c(x) log c(x) / n`
     is bounded by the entropy rate.
   - *Recurrence* (LZ77, Kac's lemma): a substring of probability `q` recurs on
     average every `1/q` positions, so the offset needs about `log(1/q)` bits —
     which is the substring's surprisal. The pointer *is* a code length.
5. **Universality is asymptotic.** Short inputs pay dictionary overhead and can
   expand. Quote real numbers: the `gzip` header alone is 18 bytes; the worst
   case for DEFLATE is 5 bytes per 32 KB block.
6. **Where LZ sits relative to the module.** It replaces the model, not the
   coder — the `(offset, length)` pairs are still entropy-coded afterwards. That
   is exactly what DEFLATE does, and it is the hand-off.

## Pitfalls / subtleties to flag

- LZ77 and LZ78 are different algorithms with different data structures, and
  "LZW" is a variant of LZ78. Do not blur them.
- "Universal" means the *asymptotic rate* matches, not that it beats a
  model-based coder on any given file. On short English text a good bigram
  arithmetic coder wins.
- The match length can exceed the offset — the copy reads bytes it is currently
  writing. That is a feature (it encodes runs for free), not a bug; work the
  `(length 5, offset 2)` example.
- Ziv & Lempel's own stated weakness: a single channel error propagates through
  every later pointer. This is why shipped formats add framing and checksums —
  a real design consequence, not a footnote.
- The 1978 `u(k)` sequence is the lesson's best guard against "compressible =
  simple": it has a two-sentence description and is provably incompressible by
  finite-state encoders.

## FIGURE PLAN

1. `draw:` **`<FigureSequence>` (5-6 frames)** — LZ77 on a short string: each
   frame shows the sliding window split into already-seen text and lookahead,
   the current longest match arrowed from its earlier position, and the emitted
   triple appended to an output list. Delta = one match per frame. The 1977
   paper draws nothing; this picture must be originated.
2. `draw:` **`<FigureSequence>` (4-5 frames)** — LZ78 on the same string: the
   dictionary growing as a trie, one phrase per frame, with the emitted
   (index, symbol) pair beside it.
3. `draw:` **single `<Figure>`** — the overlapping copy: `(length 5, offset 2)`
   over the bytes `X, Y` expanding to `X, Y, X, Y, X`, drawn as a read pointer
   chasing a write pointer. One idea: run-length encoding falls out for free.
4. `draw:` **single `<Figure>`** — the codeword budget: an LZ77 triple laid out
   as three labelled fields with their bit widths for a 32 KB window and a
   258-byte match cap, totalled. One idea: a match must beat the literals it
   replaces, which is why short matches are rejected.
5. `draw:` **single `<Figure>`** — Kac's lemma as a picture: a symbol of
   probability `q` marked at its recurrences along a sequence, with the mean gap
   `1/q` annotated and `log(1/q)` written beside the pointer field. One idea:
   the offset's length is the surprisal.
6. `draw:` **single `<Figure>`** — compression ratio against input length for a
   fixed source: the LZ curve starting above 1 (expansion), crossing 1, and
   flattening toward the entropy rate, with a model-based coder's flat line for
   comparison. One idea: universality is a limit, and the limit is approached
   from the wrong side.
7. `source:` **auniversal-title-page** → save as `figures/lz77-1977-title.png`,
   float left at the section introducing the sliding window. The reader must be
   able to read the journal line, the date and both authors — the point being
   that the algorithm inside every `.gz`, `.png` and `.zip` file is a dated,
   citable 1977 result. One sourced image; `compressiono-lz78-incremental-parsing`
   is available as an alternative if the LZ78 half is given more weight.

## EXERCISE PLAN

1. *(warm-up)* Parse the string `AABABBBABAABABBB` with LZ78 and report the
   phrase list and the emitted pairs.
2. **Boundary probe.** Apply LZ77 to a string of 1000 identical bytes and report
   the compressed size, then apply it to 1000 bytes drawn uniformly at random
   and report the size. State the ratio in each case, and identify which one
   exceeds the input length and by how much.
3. **Claim to refute.** "LZ compression reaches the entropy rate, so gzip on an
   English file will produce about 1 bit per letter." Compute what gzip actually
   achieves on a text file you have, and give two distinct reasons for the gap —
   one about the asymptotics, one about what LZ77's window can see.
4. **Derivation the lesson skipped.** For LZ78, show that if a string of length
   `n` parses into `c` distinct phrases then the encoded length is about
   `c(log c + log |alphabet|)` bits, and state what has to be true of `c/n` for
   this to be competitive with `nH`.
5. **Claim to refute / concept probe.** The 1978 paper's sequence `u(k)` —
   all binary words of length 1, then all of length 2, and so on, concatenated —
   has a one-line description. Show that a finite-state encoder cannot compress
   it, and say what this does to the intuition "simple to describe means easy to
   compress".
6. **Research-shaped.** Take a 100 KB English text. Compress it with `gzip`,
   with `gzip -1`, and with `zstd`, and record all three sizes and the times.
   Then concatenate the file with itself and repeat. Report which sizes roughly
   double and which do not, and explain the difference in terms of the window.
7. **FORWARD (E7).** Compress a file, then compress the compressed file. Report
   both sizes. Then argue from a counting argument that no compressor can shrink
   every input, and estimate what fraction of 1 KB files any compressor can
   shrink by even 10 bits. Reaches `kolmogorov-complexity` — the solution names
   the counting bound and `<Ref>`s it.
