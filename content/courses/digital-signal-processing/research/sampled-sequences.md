# Research brief: sampled-sequences (Sampled Sequences and Physical Units)

status: planned
module: discrete-signals-and-systems
type: core
goal: Analyze a measured waveform as a discrete sequence with explicit index, time, amplitude, and rate units.
est_minutes: 32

## ARC

- **Inherits:** Nothing; this is the deliberately low-floor first lesson.
- **Spine step:** “A sample array becomes evidence only when index, units, acquisition rate, and between-sample assumptions are explicit.” (*Samples carry contracts*). Caption: “The opening records what the numbers mean before transforming them.”
- **Contributes:** Analyze a measured waveform as a discrete sequence with explicit index, time, amplitude, and rate units. This is the lesson’s single move; optional derivations must remain subordinate to it.
- **Hands off to:** `impulse-response-and-convolution`, which compute and interpret the output of a discrete-time LTI system by convolution.

## Sources to consult

- Lyons, ch. 1 §§1.1–1.3 — sequence notation, sample plots, and operational symbols.
- Schaedler, lessons 2–4 — signals, discrete samples, sample period, and the warning not to connect dots as if the interpolant were observed.
- Orfanidis, ch. 1 §§1.1–1.7 — sampled signals, ADC/DAC chain, units, and quantization context.
- Steven W. Smith, *The Scientist and Engineer's Guide to Digital Signal Processing*, chs. 3–4 — conversion and literal array-oriented DSP software.

## NOTATION

- Ledger families `indices-and-sequences` and `continuous-versus-discrete-time`: reserve $n$ for a dimensionless integer index, write physical time as $nT_s$, use brackets for sequences and parentheses for $x_c(t)$. Example: at $f_s=8$ kHz, $n=12$ means 1.5 ms; it does not specify an interpolated value between samples.
## Key points the lesson must cover

1. Sample index $n$ is dimensionless while $nT_s$ is time.
2. Amplitude units and integer codes are different representations.
3. Finite records do not imply periodic extension.
4. Between-sample behavior is not part of the sequence.

## Pitfalls / subtleties to flag

- A numeric array omits analog bandwidth, clock jitter, calibration, clipping, and the reconstruction rule.
- Do not treat a line drawn between sample markers as observed signal behavior: the same samples admit many continuous interpolants, and only a declared reconstruction model chooses one.
- Declare sign, scale, index, endpoint, and unit conventions before importing formulas or plots.

## Concrete gems / worked examples

- Use the same eight numbers at 8 kHz and 48 kHz: the array is unchanged while duration and physical frequency change by a factor of six.
- Worked case grounded in Orfanidis §1.1: label the array `[0, 1, 0, -1, 0, 1, 0, -1]` at 8 kHz, compute its 0.875 ms sample-span and 2 kHz cycle rate, then relabel the identical codes at 48 kHz to obtain 0.146 ms and 12 kHz; the values alone determine neither duration nor physical frequency.

## FIGURE PLAN

1. `draw:` **One microphone waveform beside sample dots and an explicitly blank between-sample region.** (single) — Draw: the drawing explains representation; a photograph contributes no evidence. Inspiration: Lyons §1.1; Schaedler Lessons 2–4.
2. `draw:` **Index/time/unit ledger mapping n, nTs, volts, integer code, and file sample rate.** (single) — Draw: typeset labels and aligned cells are explanatory.
3. `draw:` **ADC chain: antialias filter → sampler → quantizer → integer buffer.** (single) — Draw: a pipeline is math-bound and must use house style. Inspiration: Orfanidis §§1.1, 1.7.
4. `draw:` **The same eight numbers interpreted at 8 kHz and 48 kHz, with changed duration and frequency axis.** (single) — Draw: the comparison is constructed to expose unit dependence.

## EXERCISE PLAN

1. *(warm-up; the only mechanical item)* A four-sample microphone record has integer codes $[0,512,-512,1024]$, $f_s=8\,\text{kHz}$, and $1\,\text{mV/code}$. Tabulate $n$, $nT_s$ in milliseconds, and amplitude in volts; check that the last row is at $0.375$ ms and distinguish the code column from the voltage column.
2. **E6 — boundary probe.** Analyze the empty record, a one-sample record, and a constant record; state which statistics and frequency claims remain defined.
3. **E6 — claim to refute.** Refute 'the line connecting sample dots is part of the discrete signal' with two incompatible continuous interpolants.
4. **E6 — derivation not shown.** Derive how duration, energy-as-a-sum, and average power change when the same array is assigned a different sample rate.
5. **E6 — strategy choice.** For the same samples, choose a stem plot or a bandlimited interpolated curve for (a) reporting only measured sample values and (b) asserting a reconstructed microphone waveform. The cue is whether between-sample behavior is licensed; produce both labeled plots and a one-line acquisition assumption that makes the curve defensible.
6. **FORWARD (E7).** Decompose a four-sample record into weighted shifted impulses; the next lesson names the operation that propagates each impulse through a system. Reaches `impulse-response-and-convolution`; the solution must name the connection and include a `<Ref>`.
