# Deployment strategies and online experiments — research brief

Lesson: `deployment-and-online-experiments` (module: serving, core, planned). Carries the BanditRace demo.
Goal: Design a staged rollout — shadow, canary, blue-green — and measure it with A/B tests, interleaving, or bandits.

## Sources
- DMLS Ch.9 (pp.281-291): the test-in-production catalog — shadow, A/B (randomization, significance caveats), canary, interleaving (team-draft, Fig 9-6/9-7), bandits (ε-greedy/Thompson/UCB, contextual note); Google Rafferty: A/B needed 630,000 samples vs <12,000 for Thompson at the same confidence (p.288).
- Babushkin Ch.12 (pp.~228-259): the full A/B framework — hypothesis structure, MDE, type I/II, the sample-size formula n = f(Z_α, Z_β, σ², MDC); splitting units incl. switchback (region×time grid, Fig 12-7); key/control/auxiliary metrics; Welch's t-test; simulated A/A and A/B; when A/B is impossible; the PhotoStock fully worked test (CTR significant day 2, CVR day 4, bootstrap CIs, $600K-$1.3M/yr projection); Ch.13 §13.2: blue-green vs canary (Figs 13-3/13-4) and the deploy-vs-experiment intent distinction.
- MLDP DP18 (pp.372-389): the counterfactual-contamination warning — the cart-abandonment discount destroys the label (p.~383); continued evaluation as the follow-on (module 6).
- Khang Pham Ch.1 (pp.81-82): budget-split A/B for ads (split each campaign's budget so arms don't compete).
- Burkov Ch.7 §7.2-7.3: G-test/Z-test with worked p-values (one Remark — we use Welch/Z at concept level); Kozyrkov's caveat: significance says "different", not "better by enough"; UCB1 code-level idea.
- MLPS Ch.15 (pp.280-283): the progressive-delivery ladder framing (blue/green → canary → A/B → bandits → contextual, with regret).

## Key points
1. Why online at all — the structural argument: acting on predictions destroys the counterfactual (the discount example: you can never observe what the flagged cart would have done); offline replay can't see feedback effects. This resolves offline-evaluation's forward exercise.
2. The rollout ladder as risk engineering, not ceremony: shadow (zero user risk, but no feedback signal AND double compute), canary (bounded blast radius, auto-rollback trigger = the gate's online twin), blue-green (instant rollback, double fleet); deploy-intent vs experiment-intent distinguished (same traffic split, different question).
3. A/B mechanics that get botched in practice, each with its fix: hypothesis + MDE fixed BEFORE launch; sample size from the formula (worked once, with the 3×-smaller-effect ≈ 10×-samples intuition — this rule returns for LLM evals); splitting unit = the interference boundary (user, not request; store/region for marketplaces; switchback grids for two-sided interference; budget-split for ads); peeking and A/A tests; Welch over pooled t. The PhotoStock worked test as the running example with real numbers.
4. Interleaving for rankers: team-draft merging both models' lists — within-user comparison, far fewer users; what it measures (preference) vs what it can't (absolute rates).
5. Bandits: exploration as allocation policy; Thompson sampling mechanically (sample from posteriors, route to the max) with the 630k-vs-12k result; the price — online updates, per-arm logging, harder analysis; regret as the scoreboard (the demo makes the reader FEEL regret by losing to Thompson).
6. Kozyrkov's discipline: significance ≠ business-better; the launch decision is multi-metric (Rules #39's non-transitive DAU/revenue table as a Remark).

## Set pieces & gems
- 630,000 vs 12,000 — the lesson's keeper contrast.
- The PhotoStock A/B worked end to end (sample-size → day-2/day-4 significance → CI → $ projection).
- The cart-abandonment counterfactual trap — short, sharp, structural.
- Rules #39's 1M-DAU/$4M vs 2M-DAU/$2M non-transitive launch table — a Remark on multi-metric decisions.
- Switchback grid figure (Babushkin Fig 12-7) — the genuinely-uncommon diagram worth recreating.

## Pitfalls
- Statistics floor: audience knows hypothesis tests exist; derive nothing beyond the sample-size formula's structure — the design decisions (unit, MDE, peeking) are the content.
- Do not conflate canary (deployment safety) with A/B (measurement) — the intent distinction is load-bearing and sourced.
- Bandits: Thompson at mechanism level; no posterior math beyond Beta-intuition; contextual bandits one sentence.
- Interleaving: team-draft only; no probabilistic interleaving variants.

## FIGURE PLAN
- draw: The rollout ladder: shadow → canary → blue-green as three traffic diagrams with risk/feedback/cost annotations per rung. Inspired by Babushkin Figs 13-3/13-4 + DMLS Ch.9 — key image.
- draw: FigureSequence (4 frames): an A/B test run right — frame 1 hypothesis + MDE + computed n; frame 2 unit-randomized split; frame 3 metric curves with the pre-registered stop line (peeking marked forbidden); frame 4 the decision table (key/control/auxiliary). Inspired by Babushkin Ch.12.
- draw: Switchback grid: region × time cells alternating treatment, with the interference arrow (courier pool shared) explaining why user-split fails. Inspired by Babushkin Fig 12-7.
- draw: Team-draft interleaving: two ranked lists merged pick-by-pick into one page, clicks attributed back. Inspired by DMLS Fig 9-6/9-7.
- draw: Thompson sampling one step: two Beta posteriors, samples drawn, arm chosen, posterior updated — 3-panel strip; regret curve inset vs fixed 50/50. Original; the demo's mechanism drawn.
- draw: The counterfactual trap: flagged cart → discount sent → purchase — the unobservable branch drawn as a ghost. Inspired by MLDP DP18's warning.

## EXERCISE PLAN
1. Warm-up: with baseline CTR 4%, MDE 0.4pp (relative 10%), α=0.05, power 0.8 — compute the per-arm sample size (formula given) and days at 50k impressions/day.
2. Boundary probe: MDE → 0 in the formula — n diverges; use the 3×/10× rule to explain why "we'll detect any improvement" is not a design; state the smallest effect worth detecting for the PhotoStock economics.
3. Claim to refute: "the p-value hit 0.03 on day 2, so we stopped and shipped." Name the peeking problem, show with the A/A framing why early stopping inflates false positives, and give the two honest options (fixed horizon; sequential test named).
4. Design: an ETA-model experiment in a two-sided delivery market — choose the splitting unit and defend against interference (courier pool shared across arms); switchback with cell size reasoning.
5. Research-shaped: reproduce the 630k-vs-12k logic qualitatively — simulate (or reason through) 2 arms at 4%/5% CTR: why does adaptive allocation need fewer samples for the same decision confidence? Where does the A/B's sample go to waste?
6. Mixed/spaced (E3): the offline validation gate (module 4) blessed v42. Write the full promotion pipeline v41→v42 combining this lesson: shadow (1 day, skew check — Ref training-serving-skew) → canary 5% with auto-rollback on which metric → A/B at computed n → decision.
7. FORWARD (E7): your canary's auto-rollback triggers on accuracy — but labels arrive with a 3-day lag (natural-label loop length, Ref labels-and-feedback-loops). Name two proxy signals available in real time. Solution: prediction-distribution and feature-distribution monitoring — module 6's machinery → Ref monitoring-and-observability.

## ARC
- Inherits: the serving machinery (hot-swap capable) from model-servers-and-scaling and the offline gate from module 4.
- Contributes: the online half of evaluation — staged rollout for safety, experiments for truth, bandits for efficiency.
- Hands off: the module's application replays a real serving optimization end to end → serving-bert-at-scale; and everything after day one — decay, monitoring, retraining — is module 6.
- Spine step: "A model becomes a service…" (step 6, The model becomes a service).
