# Research brief: multi-armed-bandits (Multi-armed bandits)

status: planned
module: causal-inference
type: core
goal: Decide between bandit allocation and fixed-horizon testing by computing the regret of standard policies

Business words: "optimize instead of test", bandit. Academic layer:
regret, ETC, UCB, Thompson sampling, best-arm identification — selective
cuts from Lattimore & Szepesvári (read in full). Audience is ML-literate:
fast pace licensed, proofs sketched not carried. Demo lesson (BanditArena).

## ARC (L10)

- **Inherits:** The fixed-horizon machinery and its cost structure
  (power, traffic, certificates); bing-experimentation-program's forward
  exercise: certifying 5 headlines is slow when you only need the best.
- **Contributes:** Spine step 7 opens: "allocation itself becomes the
  decision." Regret as the objective; ETC = the A/B test in disguise;
  UCB and Thompson as adaptive policies; best-arm identification as
  what "testing" actually optimizes; the decision rule for
  bandit-vs-A/B.
- **Hands off:** The rest of module 4: when even adaptive allocation is
  unavailable (no randomization at all), reconstruct counterfactuals
  from observational data (difference-in-differences onward).

## Sources to consult

- **Lattimore & Szepesvári** (banditalgori-s1..s4 shards):
  - Ch.1: the 2-arm $4-vs-$2 payoff-table dilemma (p.9) — the opener;
    applications incl. A/B testing as a bandit (pp.13-16).
  - Ch.4.5 Lemma 4.5: R_n = Σ_a Δ_a E[T_a(n)] — "basis of almost every
    proof"; teach as THE accounting identity.
  - Ch.6 Theorem 6.1: ETC with optimal m; the exploration-length
    tradeoff; ETC is not anytime.
  - Ch.4.10 Ex 4.12-13 + Fig 4.2-4.3: Follow-the-Leader's fat-tailed
    failure (greedy commits wrong early, never recovers) — simulate.
  - Ch.7: optimism principle ("visit a new country" analogy — cite
    idea, keep register dry), UCB index, Thm 7.1-7.2 (log gap-dependent,
    √(kn log n) worst-case); Fig 7.1 UCB vs tuned/untuned ETC.
  - Ch.36: Thompson sampling — Algorithm 23, Bayesian regret bound
    (Thm 36.1), Experiment 36.1's caution (TS mean regret 29.9 vs
    AdaUCB 23.8 with larger variance on a 2-arm Gaussian instance —
    TS is not uniformly best).
  - Ch.33 Pure exploration: simple regret; uniform exploration
    (Thm 33.1); the reduction simple-regret ↔ cumulative/n (Prop 33.2);
    fixed-confidence track-and-stop (existence, not mechanics);
    fixed-budget sequential halving (Algorithm 22) — the "A/B testing
    is pure exploration" framing this lesson needs.
  - Ch.9.2 (one paragraph): minimax-optimal ≠ instance-optimal; regret
    distributions are skewed — expectation isn't the whole story.
- **Kohavi ch.1 "Additional Reading"** (p.25, full): the practitioner
  boundary — bandits need a single fast-feedback OEC; bias risk from
  reallocating users mid-experiment. The business framing to open the
  decision-rule section.
- **Johari §5.1** — "test of power one" kinship note (optional aside).

## Key points the lesson must cover

1. **The objective changes**: A/B testing minimizes wrong-certificate
   risk at fixed n (measurement); bandits minimize regret (opportunity
   cost of showing losers). Same data process, different loss. The
   $4/$2 table opens; regret defined; the decomposition
   R_n = Σ Δ_a E[T_a(n)] derived (two lines) and used everywhere after.
2. **Greedy fails, and how**: Follow-the-Leader's bimodal regret
   (commits to the wrong arm with constant probability) — simulated;
   the failure NAMES the need for deliberate exploration (flaw-first).
3. **ETC = the A/B test**: explore m rounds uniformly, commit; optimal
   m needs the gap you don't know; regret O(√n) worst case. The A/B
   test is ETC with m set by a power calculation — the bridge sentence
   that locates module 3 inside bandit theory.
4. **Adaptive policies**: UCB (optimism; index formula; log regret with
   gap dependence) and Thompson (posterior sampling; the audience's
   Bayesian home turf); both sketched with the regret decomposition
   doing the work — bound E[T_a] for bad arms. Honest caveats: TS's
   variance (Experiment 36.1), tuning, delayed feedback.
5. **Best-arm identification**: when the deliverable is a winner (not
   low regret during the test): fixed-budget sequential halving,
   fixed-confidence track-and-stop named; simple vs cumulative regret
   reduction. Then the decision table: bandit when (single fast OEC,
   many variants, short-lived content, low per-user stakes); A/B when
   (guardrails matter, effects need certification, feedback is slow,
   SRM/trust machinery required). Kohavi's caveats included.

## Set pieces and worked examples to recreate

- **The $4/$2 dilemma table** (book ch.1 p.9) — recreate as the opener.
- **FTL failure histogram** (Fig 4.2 idea): 1,000 runs on
  Bernoulli(0.5, 0.6), the fat tail of committed-wrong runs; our
  simulation with stated parameters.
- **Regret race** (demo's static twin): ETC vs UCB vs Thompson mean
  regret ± spread over n on one instance.
- **The headline-rotation worked case**: 5 headlines, 20k weekly users,
  2-week campaign: compute A/B-certification cost in regret terms vs
  sequential-halving allocation — the module-3 handoff cashed.
- **UCB index computed by hand** for 3 arms after 30 pulls — one table.

## Pitfalls / subtleties to flag

- Bandits do NOT give valid fixed-horizon p-values on the collected
  data (adaptive sampling biases naive estimates) — one honest
  paragraph; certification and optimization are different products.
- Nonstationarity (novelty! — spiral to pathologies) breaks stationary
  bandit guarantees; ch.31's impossibility named in one sentence.
- Batched/delayed feedback is the practical regime (updates nightly,
  not per-pull) — say what survives (batched UCB/TS fine at business
  timescales).
- Keep proofs at sketch level: derive the regret decomposition fully,
  sketch UCB's confidence argument, state the rest. The book is the
  dig-deeper; this is a business course.
- Do not teach contextual/linear bandits — one forward clause
  (personalization ties to uplift lesson).

## FIGURE PLAN

1. `draw:` single `<Figure>` — **two objectives, one stream**: the same
   assignment stream scored two ways (certificate risk at n vs
   cumulative regret area); the lesson's frame.
2. `draw:` single `<Figure>` — **regret decomposition dissected** (voita
   rule 7): R_n = Σ_a Δ_a E[T_a(n)] with each symbol tied to a strip of
   the allocation timeline (pulls of arm a shaded, gap as height).
3. `draw:` single `<Figure>` — **FTL's bimodal regret**: histogram of
   1,000 runs, the committed-wrong hump annotated; caption names the
   fix (deliberate exploration).
4. `draw:` `<FigureSequence>` (4 frames) — **UCB in motion**: 3 arms
   with confidence intervals; frame-by-frame the played arm's interval
   tightens and the index order changes; final frame the regret tally
   vs uniform. One change per frame.
5. `draw:` single `<Figure>` — **ETC vs UCB vs Thompson regret curves**:
   mean cumulative regret vs n with shaded spread (our simulation;
   idea: book Fig 7.1 + Experiment 36.1's caution visible as TS's
   wider band).
6. `draw:` single `<Figure>` — **the decision table**: bandit vs A/B ×
   (feedback speed, #variants, guardrail needs, stakes, lifetime of
   the decision) — the business payoff in one grid.

## EXERCISE PLAN

1. Warm-up: compute UCB indices for 3 arms (means .10/.12/.08 on
   200/40/40 pulls, t=280) and name the next pull. (Index mechanics,
   once.)
2. Boundary probe: two arms with Δ→0: show the regret decomposition
   makes ANY policy's regret →0 for fixed n while identification
   (best-arm) becomes impossible — regret and identification decouple
   exactly at the boundary the A/B test cares about. What does this
   say about "the bandit will find the winner" claims for near-ties?
3. Claim to refute: "Thompson sampling dominates A/B testing — it
   finds the winner AND earns more during the test." Refute with (a)
   Experiment 36.1's variance caution, (b) adaptive-data bias for
   post-hoc estimates, (c) guardrail/SRM machinery absent; state the
   regimes where each claim-half holds.
4. Derivation the lesson skipped: derive the regret decomposition
   R_n = Σ_a Δ_a E[T_a(n)] from the definition of regret (linearity of
   expectation), and use it to show any policy with E[T_a] ≤ C log n /
   Δ_a² for bad arms has O(log n) instance regret.
5. Research-shaped: simulate the FTL experiment (Bernoulli 0.5/0.6,
   n=100, 1,000 runs): report the fraction of runs with regret > 4 and
   compare the histogram shape to the book's Fig 4.2 description.
6. FORWARD (E7): run (or reason through) Thompson sampling on two arms
   whose true means DIFFER BY SEGMENT (young users prefer B, old prefer
   A): the bandit converges to the population-average winner, leaving
   segment value on the table. Solution: the effect as a function of
   the user is CATE — uplift modeling, two lessons ahead; `<Ref>`
   uplift-and-causal-forests.
7. Spaced (E3, power lesson): show the ETC exploration length m from
   Thm 6.1's optimal formula and the power calculation's n answer the
   same question with different loss functions; compute both for the
   running case's two-headline example and explain the divergence.
