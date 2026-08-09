# Research brief: hypotheses-and-customer-evidence (Hypotheses and customer evidence)

status: planned
module: experiments
type: core
goal: Evaluate pre-launch evidence — interviews, opinions, commitments — by its power to falsify a stated hypothesis

Module 3 opener — deliberately light on math (the module escalates from
here). Business words: hypothesis, MVP, customer development. Academic
layer: falsifiability, ex-ante criteria, evidence ordered by cost-to-fake.
Dig-deeper: The Mom Test (⚠ TOC-only in canon — reconstructed notes at
research/texts/themom-toc-and-notes.txt; quotes are secondary-transcribed
and must be marked as such until the book is bought).

## ARC (L10)

- **Inherits:** Module 2 closed on a limit: published metrics say what
  improved, never what caused it. Spine step 5 opens: "Deciding what to
  build is a causal question; cheap evidence filters hypotheses."
- **Contributes:** The evidence discipline BEFORE any statistics: state a
  falsifiable hypothesis with an ex-ante success criterion; rank test
  designs by information per dollar; read interviews as data with a known
  bias model (people lie politely) and commitments as the costly signals
  that resist it.
- **Hands off:** ab-tests-and-randomization: when the hypothesis survives
  cheap filters and the stakes justify it, randomize.

## Sources to consult

- **The Mom Test notes** (themom-toc-and-notes.txt; ALL secondary):
  - Ch.1 the three rules (their life not your idea; specifics in the
    past; talk less) and the cookbook-app-for-mom origin anecdote.
  - Ch.2 bad-data taxonomy: compliments, fluff ("I would definitely buy
    that" — "the world's most deadly fluff"), ideas/feature requests; the
    permissions-request story resolved by one archive-confirmation
    dialog.
  - Ch.3 "prepare your list of three"; product risk vs market risk; "be
    terrified of at least one question per conversation".
  - Ch.5 commitment currencies (time / reputation / money; "people stop
    lying when you ask them for money"); zombie leads; clear no > maybe.
  - Ch.7 customer slicing (the who+where funnel; "startups drown, not
    starve").
  - Ch.8 the weekly loop (3 learning objectives → converse → notes →
    team review).
- **Kohavi ch.1** (full) — the idea-failure-rate roundup (~1/3 win at
  Microsoft, 10–20% at optimized products, "nearly everything fails" at
  Etsy): the base rate that makes cheap filtering rational; also Tenet 3
  ("org recognizes it is poor at assessing the value of ideas").
- **Course frame (no external source needed):** hierarchy-of-cheapness as
  E[information]/cost — a decision-theory framing in one paragraph, kept
  informal (no VoI calculus; that would be padding).

## Key points the lesson must cover

1. **Base rates first**: most shipped ideas fail to move their target
   metric (Kohavi's roundup, real numbers). Therefore the binding
   constraint is how cheaply wrong beliefs die — the module's economic
   frame stated up front.
2. **A hypothesis is a bet with a referee**: entity, direction, magnitude,
   metric, window, and the ex-ante success criterion; "we'll learn
   something" fails the referee test. Worked rewrite: three vague beliefs
   → three falsifiable statements on the running case.
3. **The interview bias model**: people are polite, optimistic about
   their future selves, and generous with ideas; therefore query PAST
   behavior and current workflows, never futures or opinions of your
   idea. The three rules as the operational form; good-vs-bad question
   pairs.
4. **Bad-data taxonomy + repairs**: compliment → deflect and dig; fluff →
   anchor to a specific past instance; feature request → ask for the
   underlying incident (the permissions/archive story). Evidence is what
   survived an attempt to kill it.
5. **Commitments as costly signals**: time, reputation, money ladder;
   the more it costs to fake, the more it updates you. Zombie "maybes"
   carry ~zero information; a paid pilot is a measurement.
6. **Cheapest-test ladder**: interview → landing page/pre-order →
   concierge MVP → experiment; each rung's cost, what it can falsify,
   and what it CANNOT (selection! the people who talk to you are not the
   market — the module's first meeting with selection bias, named).

## Set pieces and worked examples to recreate

- **The mom conversation, twice** (Ch.1 anecdote): pitched version
  (compliments) vs Mom-Test version (recipe habits, past app purchases)
  — the same "respondent", opposite verdicts. Secondary-sourced; frame
  as the book's illustrative device, not as transcript.
- **Good/bad question pairs table**: "Would you pay $30/mo?" vs "What do
  you pay for now? Walk me through the last time…".
- **Commitment ladder with outcomes**: the follow-up meeting / intro to
  the decision-maker / pre-order — each mapped to what it falsifies.
- **Customer slicing funnel** (Ch.7): fitness pros → London finance
  marathoners → lunch-hour gym, as the worked narrowing example.
- **A one-page evidence ledger** for the running case: hypothesis,
  evidence type, cost, what would falsify — the artifact exercises fill.

## Pitfalls / subtleties to flag

- Source integrity: all Mom Test specifics are secondary-transcribed
  (canon access note); mark reconstructed quotes, keep them few, and
  revisit after purchase. Fitzpatrick's anecdotes read as reconstructed
  dialogue — present as devices, not data (reader-flagged concern).
- Interviews suffer selection twice (who you can reach; who agrees) —
  say it here plainly; the formal machinery arrives in module 4.
- Do not sneer at qualitative work: the lesson's claim is that it IS
  data under a bias model, not that only A/B tests count.
- No invented personas or scenes (L9) — the book's own anecdotes, marked
  as the book's, are the narrative budget.

## FIGURE PLAN

1. `draw:` single `<Figure>` — **the kill funnel**: beliefs entering,
   filters of increasing cost (interview / landing page / concierge /
   A/B), fraction surviving each; the Kohavi base rates annotated at the
   end. (Original; the module's frame.)
2. `draw:` single `<Figure>` — **question rewriter**: three bad questions
   crossed out with their Mom-Test replacements beside them, each
   annotated with the bias it dodges (politeness / future-self /
   idea-ownership).
3. `draw:` single `<Figure>` — **the commitment ladder**: time →
   reputation → money rungs, cost-to-fake rising, with one concrete
   observable per rung.
4. `draw:` `<FigureSequence>` (3 frames) — **customer slicing**: the
   narrowing from "fitness professionals" to a findable who+where, one
   cut per frame, ending with "where do we stand on Tuesday" as the
   test of doneness.
5. `source:` **themom-cover** — save as `mom-test-cover`. Reader must
   see: the edition to buy. Placement: small float-right in References/
   dig-deeper; caption notes the canon's access caveat. (Citation image;
   the lesson is otherwise drawn.)

## EXERCISE PLAN

1. Warm-up: none — the material is judgment from the start.
2. Claim to refute: "Twelve of fifteen interviewees said they'd
   definitely use it — strong validation." Refute with the bias model
   (politeness + future-self fluff + selection of who took the meeting);
   state the two commitments that would upgrade the evidence and what
   each would falsify.
3. Boundary probe: a hypothesis that no cheap test can falsify
   ("enterprises will renew at high rates in year 2") — show why the
   evidence ladder's rungs all fail (time is the missing input), and
   what partial proxies (paid pilot with renewal option, reference-call
   commitments) buy instead. The degenerate case: falsifiability has a
   time floor.
4. Derivation-shaped (discipline's method — E2): rewrite three vague
   startup beliefs about the running case into falsifiable form (entity,
   metric, magnitude, window, criterion), then design the cheapest test
   for each and state its failure-to-generalize risk (selection).
5. Research-shaped: from Kohavi ch.1's win-rate numbers, estimate how
   many raw ideas the running case must filter to find 3 true wins per
   quarter under (a) no filtering, (b) interviews that kill half the
   losers at 10% the cost of an A/B; show the arithmetic of why cheap
   filters raise experiment throughput.
6. FORWARD (E7): your landing-page test got 4.1% signup on variant A and
   3.6% on B with 400 visitors each. Decide whether A won — write your
   reasoning, including what else you'd need. Solution: you cannot
   decide without a noise model — sampling error at n=400 swamps a
   0.5pt gap; that machinery (randomization, power) is the next two
   lessons; `<Ref>` ab-tests-and-randomization, `<Ref>` power-and-mde.
7. Spaced (E3, module 2): a prospect says "I'd pay $50/month" — using
   the pricing lesson, name the elicitation rung this sits on
   (unanchored direct question), its documented failure, and the PSM/
   commitment alternative.
