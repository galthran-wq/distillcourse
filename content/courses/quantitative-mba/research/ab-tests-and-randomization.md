# Research brief: ab-tests-and-randomization (Controlled experiments and randomization)

status: planned
module: experiments
type: core
goal: Design a trustworthy A/B test — randomization unit, variants, OEC — and validate it with sample-ratio and A/A checks

Business words: A/B test, experiment. Academic layer: randomization as the
identification mechanism; the evidence hierarchy; trust checks (SRM, A/A,
Twyman). Grounded in Kohavi ch.1 (read in full) with TOC-level pointers to
chs. 3, 19, 21 (⚠ book beyond ch.1 unread — no page-level claims there).

## ARC (L10)

- **Inherits:** Falsifiable hypotheses and the cheap-evidence ladder
  (hypotheses-and-customer-evidence); its forward exercise ended at the
  wall: a 0.5pt gap at n=400 is undecidable without a noise model.
- **Contributes:** Spine step 5's core: "randomized assignment is the only
  mechanism that makes a measured difference attributable to the change."
  The design vocabulary (variant, OEC, randomization unit), why
  randomization works (one paragraph of potential-outcomes intuition,
  formalized in module 4 — say so), and the trust layer: SRM, A/A tests,
  Twyman's law.
- **Hands off:** power-and-mde: a valid design still detects nothing
  without enough samples.

## Sources to consult

- **Kohavi ch.1 FULL** (trustworthyo-ch1.txt):
  - Terminology pp.5-8: OEC, parameter, variant (control as "a special
    variant"), randomization unit (persistent + independent; users
    default).
  - Fig 1.2 the canonical A/B flow; Fig 1.3 hierarchy of evidence
    (anecdote/HiPPO < observational < non-randomized < RCT < meta).
  - pp.8-9 Office 365 crash–churn confound (heavy use causes crashes AND
    retention) — the fresh correlation-≠-causation case.
  - pp.10-14: four ingredients (assignable units, enough units, agreed
    metrics, cheap changes); the three tenets.
  - p.4 the Bing ad-title story ($100M/yr; sat 6 months in backlog) as
    the opening jolt — introduced HERE briefly, audited in the module
    application (say so).
  - p.22 guardrails teaser (Flight 401) — one clause, `<Ref>`
    oec-and-guardrails.
  - Twyman's law (preface/ch.3 framing): any surprising figure is
    usually wrong.
- **Kohavi TOC** (trustworthyo-toc.txt): ch.3 (validity threats, Simpson),
  ch.19 (A/A tests), ch.21 (SRM + debugging) — pointer depth only.
- **Johari et al. Fig 1** (peekingat) — the dashboard that will tempt
  peeking: plant one sentence + image `<Ref>` forward (peeking lesson owns
  it).
- **Module 4 seam:** potential-outcomes formalism deferred to
  difference-in-differences — keep the intuition version here (identical
  groups in expectation ⇒ differences attributable).

## Key points the lesson must cover

1. **Why randomization identifies**: assignment independent of everything
   ⇒ the two groups' outcomes differ only by the change + noise; every
   confounder — known or unknown — balanced in expectation. The Office
   365 confound as the observational foil.
2. **The design vocabulary as decisions**: OEC (one criterion, chosen ex
   ante — the hypothesis lesson's referee, now quantitative);
   randomization unit (user vs session vs page: persistence and
   independence; consequences for what you can measure); variants and
   parameters. Each term = a design decision with a failure mode.
3. **The evidence hierarchy** (Fig 1.3 recreated): where interviews
   (module opener) and metrics dashboards (module 2) sit; what a
   meta-analysis adds; RCT as gold standard FOR causal claims — not for
   everything (measurement, discovery).
4. **The trust layer**: SRM as the first check (designed 50/50, observed
   50.2/49.8 on big n — the chi-square read; ch.21 pointer); A/A tests as
   platform validation (ch.19 pointer); Twyman's law as the operating
   posture toward surprises. Trust checks run BEFORE effect reads.
5. **The four ingredients + when NOT to A/B**: too few units, unmeasurable
   OEC, expensive changes, ethics — honest scope; alternatives ladder
   (`<Ref>` module 4).

## Set pieces and worked examples to recreate

- **Office 365 crash–churn**: the confound diagrammed (usage → crashes,
  usage → retention) and the wrong regression conclusion computed on toy
  numbers.
- **The Bing ad-title jolt** (one paragraph + sourced image): tiny change,
  $100M/yr, ranked low by everyone — Tenet 3 in the flesh.
- **Randomization-unit consequences table**: user/session/page × (can
  measure retention? independence? SRM base) — the design decision as a
  table.
- **An SRM catch, worked**: 821,588 vs 815,482 users on a designed 50/50
  — compute the SRM p-value (~1.8e-6), conclude invalid before reading
  any metric. (Constructed numbers in the style of ch.21's method —
  labeled as constructed since ch.21 is unread.)

## Pitfalls / subtleties to flag

- Do NOT teach the t-test here (audience knows it; power lesson uses it);
  this lesson is design + trust, not test statistics.
- HiPPO teasing stays dry: one definition, no culture war.
- The $100M story is ch.1-sourced and gets its full audit in
  bing-experimentation-program — avoid double-spending details (L12).
- Chs. 3/19/21 are TOC-only: never cite page-level content from them;
  phrase as "the book devotes a chapter to X".
- Randomization ≠ 50/50: unequal splits are fine; SRM tests against the
  DESIGNED ratio.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the A/B flow** (Fig 1.2 idea, recreated
   in house style): population → random split → control/treatment →
   instrumented metrics → comparison; the randomization point marked as
   "the only place causality enters".
2. `draw:` single `<Figure>` — **hierarchy of evidence** (Fig 1.3 idea):
   five tiers with the course's own artifacts placed on it (interview,
   HubSpot table, DiD, A/B) — ties three modules together.
3. `draw:` single `<Figure>` — **the confound triangle**: usage →
   crashes, usage → retention, crashes—retention spurious edge dashed
   and struck; Office 365 numbers as labels.
4. `source:` **trustworthyo-fig1-1-bing-ad** — save as
   `bing-ad-title-experiment`. Reader must see: control vs treatment
   SERP, the merged title line visibly longer. Placement: float-right at
   the opening jolt; caption: this screenshot is the $100M change — a
   mockup would lose the point that it looks like nothing.
5. `draw:` single `<Figure>` — **trust checks pipeline**: SRM → A/A →
   Twyman gate drawn as a pre-read checklist in front of the metric
   readout; "invalid" exits marked.
6. `draw:` single `<Figure>` — **randomization-unit table-figure**: the
   3×3 consequences grid (unit × what breaks), one cell highlighted (user
   unit as default).

## EXERCISE PLAN

1. Warm-up: for the running case's pricing-page test, write the full
   design spec: hypothesis (from module 3 opener's format), OEC, unit,
   split, duration rule. (Design production, not arithmetic.)
2. Boundary probe: randomize by page-view on a retention OEC — show the
   same user lands in both variants and the "groups" are no longer
   independent samples of people; which vocabulary requirement
   (persistent unit) failed, and what questions page-view randomization
   CAN answer.
3. Claim to refute: "We compared March signups (new onboarding) with
   February signups (old): +9% activation, so the onboarding worked."
   Name every difference randomization would have removed (seasonality,
   mix, concurrent changes) and rank which most plausibly explains +9%;
   then state the minimal valid design.
4. Derivation the lesson skipped: show that under random assignment
   E[Ȳ_T − Ȳ_C] equals the average causal effect using only the
   balanced-in-expectation property (informal potential-outcomes
   algebra); mark the exact step where independence of assignment enters.
5. Research-shaped: compute the SRM p-value for 821,588 vs 815,482 under
   a designed 50/50 (normal approximation to binomial); state the
   decision and why no metric may be read.
6. FORWARD (E7): the module-opener's landing test (4.1% vs 3.6%,
   n=400/arm): compute the standard error of the difference and the
   z-score; conclude it is indistinguishable from noise. Solution: the
   general version — what effect COULD n detect — is the MDE, next
   lesson; `<Ref>` power-and-mde.
7. Spaced (E3, goodharts-law): your OEC candidate is "clicks per
   session" — carry over the gaming analysis and propose the guardrail
   pair; note the full OEC design treatment arrives in
   oec-and-guardrails.
