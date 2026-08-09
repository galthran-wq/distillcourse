# Research brief: power-and-mde (Statistical power and the minimum detectable effect)

status: planned
module: experiments
type: core
goal: Compute an experiment's minimum detectable effect and required duration from traffic, baseline rate, and power

Business words: MDE, "do we have enough traffic". Academic layer: the
power identity the audience half-knows, applied until it changes decisions.
Demo lesson (MdePlanner). Sources: standard statistics (reader's
territory), CUPED §1-2 for the scaling arithmetic, Kohavi ch.17 named at
TOC depth.

## ARC (L10)

- **Inherits:** A valid design (ab-tests-and-randomization) and its
  forward exercise: 4.1% vs 3.6% at n=400 was noise.
- **Contributes:** Spine step 5's close: sensitivity is fixed before the
  experiment starts. The four-way identity (α, power, n, MDE), the 1/√n
  wall, MDE as a negotiation object, and the winner's curse of
  underpowered wins.
- **Hands off:** Spine step 6: even correctly powered tests lie when
  monitored naively (peeking) — and the traffic cost this lesson exposes
  is what CUPED buys back. Both named at the close.

## Sources to consult

- **CUPED paper §1** (improvingthe- cached PDF/text) — the scaling jolt:
  "10,000 users to detect a 5% delta; a 0.5% delta requires 100× more —
  one million" (sensitivity ∝ 1/√n squared into sample terms); MSN Real
  Estate widget as the stakes example.
- **Kohavi ch.17 TOC** — t-test, p-value/CI, normality, Type I/II and
  power, multiple testing: the chapter exists; pointer only (unread).
- **Kohavi ch.1** — "enough units (thousands recommended)" ingredient;
  speed-experiment sensitivities (10ms detectable at Bing scale) as the
  contrast case.
- **Johari §2.2** (peekingat-) — the fixed-horizon recipe (fix n, α,
  compute at n) — the CONTRACT whose fine print (fixed n!) the next
  lesson breaks; quote the recipe here as the standard practice.
- Standard normal-approximation power formula (no source needed; derive).

## Key points the lesson must cover

1. **The identity, derived once**: for a two-sample proportion test,
   n per arm ≈ (z_{1−α/2} + z_{power})² · 2p̄(1−p̄) / δ² — derive from the
   two error constraints with a picture (two sampling distributions, two
   thresholds). Then invert for δ: the MDE given n. The audience knows
   the pieces; the lesson's value is fluency in the INVERSIONS.
2. **The 1/√n wall**: MDE halves only when traffic quadruples; the
   10k-vs-1M keeper numbers; relative-vs-absolute effect care
   (5% relative of a 5% baseline = 0.25pt absolute — the classic
   miscommunication, worked).
3. **MDE as negotiation**: the experiment can only detect ≥X; product
   must state whether X-sized effects matter at this stage. Decision
   table: effect worth shipping vs MDE vs verdict (run / redesign /
   don't bother). Duration = n / traffic-per-day, with the
   weekly-seasonality floor (run whole weeks) stated as practice.
4. **Underpowered ≠ conservative**: significant results from underpowered
   tests overestimate effects (winner's curse / significance filter) —
   derive the intuition with a truncated-normal picture; this is why
   "we'll just run it and see" produces a portfolio of inflated wins.
5. **What moves the inputs**: baseline rate (extreme p̄ helps), unequal
   splits (90/10 costs ~×2.8 in n vs 50/50 — compute), metric variance
   (the CUPED handoff), and triggering/dilution (pathologies handoff —
   one clause each).

## Set pieces and worked examples to recreate

- **The startup reality check**: running case, 20k weekly users, 5%
  baseline signup: MDE at 4 weeks ≈ compute exactly for the lesson;
  verdict: only large effects are testable at startup scale — which is
  WHY the cheap-evidence ladder (module opener) exists. Close the loop
  explicitly.
- **The Bing contrast**: at Bing scale, 10ms latency effects are
  detectable — same formula, n changes everything (ch.1 speed numbers).
- **The 90/10 split cost**: worked n comparison.
- **Winner's-curse simulation sketch**: 1,000 true-effect-1% experiments
  at 30% power: the significant subset's average estimated effect ≈ 2.5×
  truth (construct exact numbers when drafting; state simulation
  parameters).

## Pitfalls / subtleties to flag

- One-sided vs two-sided α: fix two-sided 0.05 convention, note the
  difference once.
- Ratio metrics (CTR per session) need delta-method variances — name the
  issue, defer machinery (Kohavi ch.18/CUPED appendix pointers).
- Power is against a POINT alternative; "the" power of an experiment is
  a curve — draw it once.
- Do not re-derive hypothesis testing from scratch (audience owns it);
  spend the depth on inversions, costs, and decision framing.
- Duration ≠ n/traffic when triggering restricts the analyzed
  population — one clause, `<Ref>` experiment-pathologies.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **two distributions, two thresholds**: the
   null and alternative sampling distributions of the difference, α and
   β areas shaded, the MDE as the separation that makes β = 20%. The
   derivation's picture.
2. `draw:` single `<Figure>` — **the 1/√n wall**: MDE vs n on log-log
   axes with the 10k→5%, 1M→0.5% points marked; startup and Bing traffic
   bands shaded. (Static twin of the demo.)
3. `draw:` single `<Figure>` — **power curve**: power vs true effect for
   fixed n; the "MDE at 80%" point marked; a second curve at 4× n.
4. `draw:` single `<Figure>` — **the negotiation table as figure**:
   effect-worth-shipping rows × traffic columns → run/redesign/skip
   verdicts; the running case's cell highlighted.
5. `draw:` single `<Figure>` — **winner's curse**: distribution of
   estimated effects from underpowered true-1% experiments; the
   significance cutoff truncating the left tail; the surviving mean ≫ 1%
   annotated.

## EXERCISE PLAN

1. Warm-up: n per arm for baseline 10%, absolute MDE 1pt, α=.05, power
   80%; then invert — MDE at n=5,000/arm. (The core mechanics, once.)
2. Boundary probe: baseline p̄ → 0 at fixed RELATIVE MDE: show required n
   explodes as ~1/p̄ (rare-event metrics like purchase are the expensive
   ones); state which OEC choice this argues for (frequent, sensitive
   surrogate metrics — and the validation debt that creates, `<Ref>`
   oec-and-guardrails).
3. Claim to refute: "The test came back significant at p=.03 with our
   n=800, so the +18% lift is real and big." Use the winner's-curse
   picture to argue the point estimate is inflated conditional on
   significance at ~25% power; state what to report instead (CI, and
   replication or a follow-up at proper power).
4. Derivation the lesson skipped: derive the unequal-split penalty —
   variance ∝ 1/n_T + 1/n_C minimized at 50/50; compute the 90/10 factor
   (25/9 ≈ 2.78×) and when a skewed split is still rational (risk
   containment).
5. Research-shaped: reproduce CUPED §1's arithmetic — verify that
   detecting 0.5% needs 100× the sample of 5% at the same baseline, from
   the n ∝ 1/δ² law.
6. FORWARD (E7): your properly-powered 4-week test shows p=0.04 on day
   6. List the actions available (stop and ship / keep running / restart)
   and what each does to the promised 5% false-positive rate. Solution:
   stopping on an early crossing is peeking — the guarantee evaporates;
   quantifying and fixing it is the next lesson; `<Ref>`
   peeking-and-always-valid-inference.
7. Spaced (E3, module 2): the pricing lesson's +10% price test on churn:
   with the running case's account counts and monthly churn ~3%, compute
   the MDE on churn in one quarter and conclude whether the experiment
   can decide the pricing question at all (this motivates why pricing
   changes are often evaluated quasi-experimentally — `<Ref>`
   difference-in-differences).
