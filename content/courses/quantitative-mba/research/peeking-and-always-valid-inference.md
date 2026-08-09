# Research brief: peeking-and-always-valid-inference (The peeking problem and always-valid p-values)

status: planned
module: experiments
type: core
goal: Quantify the false-positive inflation from continuous monitoring and correct it with always-valid inference (mSPRT)

The module's sharpest lesson: a documented, quantified failure of standard
practice with a deployed fix. Primary source read in full (Johari et al.,
KDD 2017). Demo lesson (PeekingSimulator). Dig-deeper: the KDD paper; the
companion tech report arXiv:1512.04922 (NOT read — proofs live there).

## ARC (L10)

- **Inherits:** The fixed-horizon contract (power-and-mde): fix n, then
  read once. Its forward exercise: p=0.04 on day 6 of a 4-week test.
- **Contributes:** Spine step 6 opens: "the naive test lies in documented
  ways — each with a named, deployed fix." The quantified inflation
  (5–10×, →100% with patience), why heuristic fixes fail, the mSPRT
  construction at working depth, and the deployed system (Optimizely
  Stats Engine).
- **Hands off:** variance-reduction-cuped (the second fix, for traffic
  cost); oec-and-guardrails inherits the FDR machinery (Johari §6).

## Sources to consult

- **Johari et al. 2017** (peekingat-.txt, full):
  - §1 + Fig 2: realized FPR under stop-at-first-crossing, climbing to
    ~0.23 / ~0.60 / ~0.77 by n=10,000 for α=.10/.05/.01 — the keeper
    curve; 5–10× inflation quote; Siegmund: under the null, monitoring
    long enough crosses ANY α eventually.
  - §2.2: the fixed-horizon recipe and validity condition (eq 1-2) — the
    contract violated.
  - §3.1 Definition 3.1 (eq 4): always-validity = same superuniformity at
    ANY stopping time T; the minimal-delta definition (n → T) as a
    teaching device.
  - Footnote 2: the post-hoc power heuristic ("stop when p<.05 AND
    observed power >.8") is just a smaller unstated α — still inflated.
  - §3.2 Theorem 3.2: sequential tests ↔ always-valid p-value processes.
  - §4.1-4.3: mSPRT — mixture likelihood ratio Λ_n against prior H;
    optional stopping/martingale argument for Type I control (state the
    martingale point in one paragraph; audience knows optional stopping
    from bandit/finance folklore — keep it tight); closed form for
    normal-with-normal-mixture; two-sample and Bernoulli via asymptotic
    sufficiency.
  - §4.4 deployment: significance = 1 − p_n, monotone (never goes
    backwards — UX property); the reset policy when the estimate exits
    the CI; plug-in variances.
  - §5: test of power one; tiered mixing variance τ by customer tier via
    10,000 historical experiments (James-Stein); Figs 4-5 when
    fixed-horizon still wins (accurately guessed effect sizes).
  - §6: Bonferroni vs BH q-values from always-valid p-values; the
    user-research rationale for FDR — PLANT, full treatment in
    oec-and-guardrails.
- **Kohavi ch.1** — real dashboards update in near-real-time (context).

## Key points the lesson must cover

1. **The failure, demonstrated before explained** (flaw-first): simulate
   A/A tests with stop-on-crossing; realized FPR curve; the Fig-2
   numbers as keepers. The mechanism: max over a random walk's
   excursions — under H0 the p-value process recrosses any threshold
   given time.
2. **Why the obvious patches fail**: Bonferroni over peeks (destroys
   power, still wrong for continuous monitoring); post-hoc power
   (footnote 2 — equivalent to smaller α); "just don't peek" (real
   organizations demonstrably peek — Fig 1's dashboard is engineered
   temptation). Alpha-spending named as the classical fixed-schedule
   answer (one paragraph — interim analyses at planned looks), with
   always-validity as the any-time generalization.
3. **The definition is one symbol swap**: sup over fixed n → sup over
   stopping times T (eq 1 vs eq 4). Teach the definition move itself —
   what exactly breaks, minimal repair.
4. **mSPRT at working depth**: likelihood ratio as a nonnegative
   martingale under H0; mixing over effect sizes; p_n = 1/max Λ;
   optional stopping gives the guarantee at ANY T. Derive the normal
   closed form; state (not prove) two-sample/Bernoulli extensions —
   proofs live in the unread tech report (honest pointer).
5. **The deployed system**: monotone significance, the reset-policy
   compromise, tiered priors fit from the platform's own history — an
   engineering case study in shipping statistics; the cost: mSPRT needs
   more samples than a well-guessed fixed-horizon test (Figs 4-5) — the
   price of not having to guess.

## Set pieces and worked examples to recreate

- **The A/A peeking simulation** (Fig 2 recreated from our own
  simulation; publishable axis values from the paper as the check).
- **The post-hoc-power trap** (footnote 2): worked as a claim-to-refute
  in the exercises AND one prose paragraph — a "nice try" with algebra.
- **The mSPRT trajectory pair** (paper Fig 3): noisy conversion-rate
  curves above, monotone significance below — sourced images.
- **Tiered-prior story** (§5.2): Bronze→Platinum chasing smaller
  effects; platform history as prior data.

## Pitfalls / subtleties to flag

- Always-valid CIs are WIDER at any fixed n than fixed-horizon CIs —
  there is no free lunch; the payment is in sample size (Figs 4-5).
  State plainly.
- The monotone-significance UX can strand a wrong-sided CI (hence the
  reset policy) — deployed statistics has patches; show the patch and
  its conservatism proof-sketch.
- Bayesian "just use posteriors" is not an exemption: peeking a
  posterior with a stopping rule has its own calibration issues — one
  careful sentence, no detour.
- Companion tech report unread: all deep proofs are pointers, marked.
- Do not villainize dashboards; the lesson's stance: the tooling must
  match the statistics, hence Stats Engine.

## FIGURE PLAN

1. `source:` **peekingat-fig1-dashboard** — save as
   `optimizely-dashboard`. Reader must see: live deltas, confidence
   intervals, days-running counter — the temptation interface.
   Placement: float-right at the opening; caption: this real product UI
   is what "don't peek" was up against.
2. `draw:` single `<Figure>` — **FPR inflation curves** (Fig 2
   recreated): realized FPR vs n for α=.01/.05/.10 under
   stop-at-crossing; nominal lines dashed. Our simulation, checked
   against the paper's values.
3. `draw:` `<FigureSequence>` (4 frames) — **one A/A p-value trajectory**:
   frame 1 the p-path wandering; frame 2 first crossing of .05 marked
   "stop here?"; frame 3 path continues back above; frame 4 many paths
   overlaid — fraction ever-crossing grows with n. One element per
   frame.
4. `draw:` single `<Figure>` — **the definition delta** (voita rule 7):
   eq(1) and eq(4) aligned, the single changed token (n → T) highlighted;
   under it the two guarantees in words.
5. `draw:` single `<Figure>` — **mSPRT anatomy**: Λ_n as mixture
   likelihood ratio with labels (prior over effects; martingale under
   H0; p = 1/max Λ); a small inset of a Λ path with its running max.
6. `source:` **peekingat-fig3a-conversion-rate** + **peekingat-fig3b-significance**
   — save as `stats-engine-trajectories` (stacked crop). Reader must
   see: the noisy metric above, the monotone significance below, same
   days axis. Placement: centered in the deployment section; real
   production behavior a redraw would fabricate.

## EXERCISE PLAN

1. Warm-up: none (the demo carries the mechanical work).
2. Boundary probe: peeking exactly once, at the planned n — show the
   procedure reduces to the fixed-horizon test and the guarantee holds;
   then peeking at n/2 and n: compute (or simulate) the FPR for this
   two-look rule (~8% at nominal 5%) — the inflation is continuous in
   the number of looks, not an on/off sin.
3. Claim to refute (the paper's own footnote): "We only stop when p<.05
   AND observed power exceeds 80%, so we're safe." Show observed power
   is a deterministic function of the observed effect and n — the rule
   is equivalent to a stricter p-threshold, i.e., a smaller unstated α,
   and the sequential inflation argument applies unchanged.
4. Derivation the lesson skipped: prove that a likelihood ratio is a
   martingale under H0 (two lines, discrete case) and apply optional
   stopping to get P(sup Λ ≥ 1/α) ≤ α — the whole guarantee from the
   audience's own toolkit.
5. Research-shaped: reproduce Fig 2 by simulation (Bernoulli A/A,
   α=.05, peek every observation up to n=10,000; report your curve's
   value at n=10,000 vs the paper's ~0.60).
6. FORWARD (E7): your always-valid test needs ~1.4× the traffic of the
   fixed-horizon test that guessed the effect right. Compute what
   pre-experiment covariate correlation ρ would recover that factor via
   variance reduction (1/(1−ρ²) ≥ 1.4 ⇒ ρ ≈ 0.53). Solution: that
   machine is CUPED, next lesson; `<Ref>` variance-reduction-cuped.
7. Spaced (E3, ab-tests lesson): an experiment shows a significant SRM
   AND a significant always-valid win. Which check gates which, and why
   does no p-value machinery rescue a broken randomization?
