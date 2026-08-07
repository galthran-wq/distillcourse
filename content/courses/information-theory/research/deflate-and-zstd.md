# Research brief: deflate-and-zstd (DEFLATE and Zstandard)

status: planned (NEW lesson — module APPLICATION)
module: coding
type: synthesis
goal: Analyze the DEFLATE and Zstandard bitstream formats as concrete instances of the module's coding results.
est_minutes: 38

## ARC

- **Inherits:** Kraft and canonical codes (`kraft-inequality`), Huffman
  optimality and its one-bit overhead (`huffman-by-hand`), fractional-bit coding
  (`arithmetic-coding`), and universal parsing (`dictionary-coding`).
- **Spine step:** step 4, *Dropping the assumptions* — "…and shipped formats
  combine both."
- **Contributes:** the demonstration that the module's theorems are load-bearing
  engineering constraints, and a reading skill: how to find the theory inside a
  specification.
- **Hands off to:** the ML module, which will ask what happens when the model
  feeding the entropy coder is a neural network rather than a frequency table.

## APPLICATION SPEC (L16 — module 2 closes here)

- **Artifact:** RFC 1951 (DEFLATE, 1996) and RFC 8878 (Zstandard, 2021), read
  section by section. DEFLATE is what `gzip`, PNG, ZIP and HTTP
  `Content-Encoding: gzip` all carry.
- **Module results it uses:** the Kraft inequality (canonical codes transmit
  lengths only because Kraft plus an ordering rule determines the codewords);
  Huffman optimality (both DEFLATE alphabets are Huffman-coded); LZ77 (the
  match/literal stream); the entropy floor (the reason a fixed-table mode exists
  at all); and the counting bound (the guaranteed worst-case expansion).
- **Where the artifact departs from the idealisation:**
  1. The window is 32 KB and matches cap at 258 bytes, so the "unlimited
     context" of the entropy rate is truncated by a memory budget.
  2. Statistics are gathered **per block**, not per file, so a file whose
     statistics drift is coded by several different Huffman tables — and the
     block boundary decision is left entirely to the encoder.
  3. DEFLATE keeps integer-length Huffman codes even though the module proved
     arithmetic coding is tighter; the reasons are decoder speed and, at the time,
     patents.
  4. A fixed-table mode exists precisely because for a short block the cost of
     transmitting a table exceeds the savings — the header cost the theory
     ignores.
  5. Bit packing is asymmetric: fixed-width fields are packed least-significant-bit
     first, Huffman codewords most-significant-bit first. Nothing in the theory
     predicts or forbids this; it is a decoder-implementation choice, and it is
     the single most common source of bugs in from-scratch implementations.
  6. Zstandard's recent-offset cache exploits a correlation between successive
     matches that the i.i.d.-source model has no way to represent.

## Sources to consult

- **RFC 1951** (primary). §1.1 goals and the 5-bytes-per-32-KB worst case; §3.1.1
  the bit-packing rules; §3.2.1 prefix coding; §3.2.2 canonical codes with the
  A-H worked example and the three-step construction; §3.2.3 the master decode
  loop and the overlapping back-reference; §3.2.4 stored blocks; §3.2.5 the
  merged literal/length alphabet and the distance alphabet with extra bits;
  §3.2.6 the fixed tables; §3.2.7 dynamic blocks, HLIT/HDIST/HCLEN and the
  scrambled code-length permutation; §4 the non-normative hash-chain and
  lazy-matching heuristics.
- **RFC 8878** (primary). §3.1.1 frame and block layout, window-size formula;
  §3.1.1.3 literals and sequences sections; §3.1.1.5 and Table 18 the
  three-slot recent-offset cache with its worked trace; §4.1 FSE/ANS and the
  table-spread rule; §4.2.1 Huffman by weights with the
  infer-the-last-weight trick and its A-H example; §5 the dictionary format;
  §8 compression-oracle attacks; Appendix A the reference decoding tables.
- Cover & Thomas §13.4 and MacKay ch. 6 §6.5 for the benchmark context.

## Key points the lesson must cover

1. **The pipeline.** Input → LZ77 matcher → a stream of literals and
   (length, distance) pairs → two Huffman codes → bitstream. Draw it once and
   refer back.
2. **Canonical codes are the Kraft theorem used as a wire format.** Given the
   code lengths and the rule "same-length codewords are consecutive in symbol
   order, shorter lengths first", the codewords are determined. So the header
   transmits lengths, not a tree. Walk the RFC's own A-H example: lengths
   `3,3,3,3,3,2,4,4` produce `010,011,100,101,110,00,1110,1111`.
3. **The alphabets.** Literals and lengths share one 286-symbol alphabet
   (0-255 literals, 256 end-of-block, 257-285 lengths with extra bits), so one
   Huffman decode decides whether the next thing is a byte or a match. Distances
   use a second alphabet of 30 codes with extra bits covering 1 to 32768. The
   extra-bits scheme is a coarse-then-fine code: exactly the fractional-bit
   problem solved by bucketing.
4. **Three block types**, and why: stored (incompressible data — the escape
   hatch that bounds expansion), fixed Huffman (no table cost, for short
   blocks), dynamic Huffman (measured statistics, for everything else). This is
   a live instance of the header-cost trade-off.
5. **The header is itself compressed.** The two code-length sequences are
   run-length coded with a third alphabet (symbols 16, 17, 18 repeat), and that
   alphabet's own lengths are sent in a fixed scrambled order chosen so the
   common case truncates early. Three levels of code, all justified by the same
   budget argument.
6. **Zstandard's changes**, each traced to a theorem or to a measured
   inefficiency: FSE/ANS on the sequence stream recovers the fractional bits
   Huffman rounds away; the three-slot recent-offset cache prices a correlation;
   trained dictionaries prepend synthetic history so that small payloads are not
   stuck paying the cold-start cost `dictionary-coding` identified.
7. **The guarantee.** No compressor shrinks every input; DEFLATE bounds its loss
   to 5 bytes per 32 KB block (about 0.015%) by falling back to stored blocks.
   This is the counting argument turned into a specification clause.

## Pitfalls / subtleties to flag

- "gzip" is a container (RFC 1952); DEFLATE is the compressed format inside it.
  PNG uses zlib (RFC 1950) around the same DEFLATE stream. Say this once,
  precisely.
- The RFC constrains the **decoder**, not the encoder. Match finding, block
  boundaries and lazy matching are all encoder freedom — which is why
  compression levels exist and why two gzip implementations produce different
  bytes for the same input.
- Do not present the format as optimal. It is a 1996 engineering compromise, and
  saying which parts are compromise is the lesson's job.
- Zstd's ANS coder should be stated, not derived. A full ANS derivation is a
  lesson in itself and is out of scope; give the one-sentence characterization
  (state machine whose transitions carry fractional bits) and the reference.
- Security: compressing attacker-controlled data together with a secret leaks
  the secret through the compressed length (CRIME). One paragraph, because it is
  a real consequence of the theory the module just built.

## FIGURE PLAN

1. `draw:` **single `<Figure>`** — the DEFLATE pipeline as a left-to-right block
   diagram: input bytes → LZ77 matcher → literal/length and distance streams →
   two Huffman coders → bitstream, with the module lesson that owns each stage
   named under it. One idea: the format is this course's module, assembled.
2. `draw:` **`<FigureSequence>` (4 frames)** — canonical code construction on the
   RFC's own A-H example: frame 1 the length list; frame 2 the per-length
   counts; frame 3 the starting code per length; frame 4 the assigned codewords.
   Delta = one column per frame.
3. `draw:` **single `<Figure>`** — a real block's bitstream laid out as a
   labelled field diagram: 3-bit header, HLIT/HDIST/HCLEN, code-length codes,
   the two code-length sequences, then data. One idea: everything before the
   data is the model.
4. `draw:` **single `<Figure>`** — bit packing: one byte drawn twice, once
   showing a fixed-width field filled LSB-first and once showing a Huffman code
   filled MSB-first, with the two orders arrowed in different colours. One idea:
   the two conventions coexist in the same byte.
5. `draw:` **single `<Figure>`** — the three block types against block size:
   stored, fixed and dynamic total cost curves crossing, with the crossover
   points annotated. One idea: the header cost decides.
6. `draw:` **`<FigureSequence>` (3 frames)** — zstd's recent-offset cache over
   three sequences, the three slots reordering each frame, with the bit saving
   tallied. Inspiration: RFC 8878 Table 18.
7. `source:` **rfc1951-canonical-huffman-alg** → save as
   `figures/rfc1951-canonical.png`, centered, immediately after the canonical
   code sequence. The reader must be able to read the three numbered steps and
   the A-H table as the specification states them, because the claim is that the
   theorem is quoted verbatim in a standard that ships in every browser.
8. `source:` **rfc1951-length-distance-table** → save as
   `figures/rfc1951-tables.png`, float right in the alphabets section. The
   reader must be able to see the extra-bits columns. These values are normative
   and hard-coded; a redrawn table risks a transcription error that would be
   invisible. Two sourced images is the budget; both earn it because the artifact
   *is* the specification text.

## EXERCISE PLAN

1. *(warm-up)* Given a list of code lengths, run the RFC's canonical
   construction and produce the codewords; verify Kraft holds with equality.
2. **Boundary probe.** A DEFLATE block contains 32 KB of uniformly random bytes.
   State which block type an encoder should choose, compute the total output
   size, and derive the 5-byte overhead figure from the stored-block header
   layout. Then say what would go wrong if the stored-block type did not exist.
3. **Claim to refute.** "Since Huffman coding is optimal, DEFLATE's entropy
   stage cannot be improved." Identify two distinct improvements zstd makes and
   say, for each, which assumption of Huffman's optimality theorem it steps
   outside.
4. **Derivation the lesson skipped.** Show that the canonical ordering rule plus
   the code lengths determine the codewords uniquely. Then compute how many bits
   a naive "transmit the whole tree" header would cost for a 286-symbol
   alphabet, and compare against the code-length-sequence header.
5. **Research-shaped.** Compress a text file with `gzip -1`, `gzip -9` and
   `zstd -19`, and record sizes and times. Then use a tool (or a short script)
   to report how many DEFLATE blocks `gzip -9` emitted and of which types. State
   what the level knob is actually changing, given that the format is identical
   at every level.
6. **Mixed review (E3).** For a source with `H = 2.0` bits/symbol and a 1 KB
   block, estimate the dynamic-Huffman header cost, the fixed-table cost, and
   the entropy-coded data cost, and decide which block type wins. Then repeat
   for a 64 KB block.
7. **FORWARD (E7).** Take the LZ77 match stream from a small file and compute
   the empirical distribution of the *distance* codes. Note that distances are
   strongly non-uniform and that consecutive matches often repeat a distance.
   Estimate the bits per sequence saved by a cache of the three most recent
   offsets. Reaches the modelling arc — the solution notes that this is a
   context model in disguise and `<Ref>`s `compression-is-prediction`.
