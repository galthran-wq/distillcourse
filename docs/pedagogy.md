# Pedagogy — the constitution

Every piece of content in this project is generated under these rules. They are
not style preferences; each one is backed by learning-science evidence
(summarized at the bottom). Skills MUST treat the numbered rules as checkable
requirements — `lib/content/lint.ts` enforces the mechanical ones, `/course-qa`
audits the judgment ones. The mechanics behind the rules live in the playbook
stack: `docs/playbook-core.md` (universal invariants), `docs/voita-playbook.md`
(exposition layer), and the domain overlays `docs/playbook-math.md` /
`docs/playbook-history.md` — authors read the core plus their course's overlay.

**The learner model:** a busy, smart engineer who has started and abandoned
this topic before. They will quit at the first boring paragraph. Assume zero
external motivation: the lesson itself must generate the reason to continue.
Material everywhere else is optimized for completeness; ours is optimized for
being finished.

## Course rules (C)

- **C1 — Backward design.** Outcomes (with Bloom levels) are written before any
  module or lesson exists. Every module claims ≥1 course outcome; every lesson
  `goal` serves its module's outcomes.
- **C2 — Scope follows the material.** No lesson-count cap: 12 lessons or 30,
  whatever the material justifies. The guards are per-lesson, not per-course —
  every lesson carries one substantive goal (no padding, no micro-slicing),
  and nothing is kept that serves no outcome. Never cut material just to hit
  a number; never add a lesson just to look thorough. Advanced material that
  would bloat the core path goes in `type: extra` lessons — off-path
  "starred sections" that are skippable by construction: no non-extra
  lesson may require them (lint-enforced).
- **C3 — Easy openers.** The first two lessons are the easiest and most
  polished in the course, each ending in a felt "I can do this" win. Dropout
  concentrates in the first sessions; polish is front-loaded there.
- **C4 — Explicit prerequisite graph.** Every lesson lists `prerequisites`
  (acyclic). Nothing is assumed silently.
- **C5 — Spiral revisits.** Core concepts reappear (`concepts.reinforces`) in
  later lessons at increasing depth — visible in course.yaml, not incidental.
- **C6 — Technical naming.** Course, module, and lesson titles are precise
  noun phrases naming the content ("Huffman coding", "Kraft inequality") —
  never questions, wordplay, or teasers.

## Lesson rules (L)

- **L1 — One objective.** Exactly one `goal` per lesson, starting with a Bloom
  verb ("Compute…", "Explain…", "Construct…"). If a draft teaches two things,
  split it.
- **L2 — Substantial chapters, free structure.** A lesson is a textbook
  chapter: as long as the material warrants (est_minutes is guidance, 5–45),
  structured by `##` sections however the content demands. A typical chapter
  runs 1,500–3,000 words across 3–5 sections with several worked examples —
  if it reads in under ~10 minutes it is almost certainly too thin. Depth
  beats brevity; cutting scope is the syllabus's job, not the chapter's.
  `key_ideas` in course.yaml are the author's plan, not a mandated section
  list. The validator never dictates prose shape.
- **L3 — Opening statement first.** The lesson opens with the `opening` from
  course.yaml verbatim: a precise, declarative statement of the problem the
  lesson solves or the fact it establishes. No rhetorical questions, no
  teasers, no "by the end you'll love this".
- **L4 — Concrete before general, conditionally.** The default: a concrete
  instance or computation precedes the general formula, and the formalism
  names what was just computed. The evidence-backed exception: when every
  term in a definition is already familiar and precision itself is the
  lesson, formal-first is legitimate — followed immediately by boundary
  cases. Neither order is a dogma; the choice is per-concept
  (playbook-core invariant 5).
- **L5 — Textbook environments where natural.** Mathematical material uses
  numbered `<Definition>`, `<Theorem>`, `<Proof>`, `<Example>`; key facts in
  non-mathematical courses (history, philosophy, speech, music) use
  `<Remark>` or plain prose. The mathematical textbook is the reference
  aesthetic, never a straitjacket: if the material has no theorems, don't
  invent them.
- **L6 — Dual coding, dense and disciplined.** A visual roughly every 3–4
  paragraphs of substantive prose: many small single-idea figures, co-located
  with the sentence they illustrate, labels on the visual itself. Processes
  that unfold over steps use a `<FigureSequence>` step-through (frames change
  one thing at a time). All figures follow `docs/figures.md` — one house
  style. Zero decorative graphics — if it doesn't carry an idea, cut it.
- **L7 — Worked example → exercise.** Every technique shown in a worked
  `<Example>` (all steps visible, no skipped algebra) has a parallel
  `<Exercise>` that makes the reader produce a similar solution.
- **L8 — References.** Every lesson ends with a `<References>` section:
  the primary sources and one or two canonical texts, with chapter-level
  pointers. Real references, verified — never invented.
- **L8a — Inline attribution only when provenance is content.** Narrative
  facts are stated directly and sourced in `<References>` — never "Textbook
  X's chapter describes…" mid-prose; the reader came for the material, not
  for the compilation's scaffolding. Inline naming is reserved for cases
  where the WHO is part of the claim: a primary artifact being read or
  quoted (Las Casas's tract, Franklin's pamphlet), a measurement whose
  method carries the argument (a tribute-register series), or a named thesis
  under discussion (Turner's). Secondary surveys and syntheses appear once,
  in References, with chapter pointers.
- **L9 — Dry engineering register.** Declarative sentences; facts carry the
  text. No rhetorical questions, no exclamations, no chattiness ("almost
  embarrassingly simple"), no invented scenes or personas ("a friend says…"),
  no filler. Second person only for instructions ("compute", "drag",
  "verify"). Define jargon at the point of first use or don't use it. Every
  sentence either advances the argument — a fact, or the connection between
  facts — or gets cut: connective declaratives ("the previous section
  established X; what it leaves unexplained is Y") are load-bearing prose,
  not filler. Italics only for standard emphasis of a single term, sparingly.
- **L10 — Throughline.** A lesson is one move in the course's argument, and
  says so. (a) Directly after the opening: two to four declarative sentences
  placing the move — what the argument has established so far, what stands
  open, what this lesson contributes; the course `spine` in course.yaml is
  the reference for the sequence of moves. (b) Sections chain: every `##`
  opens with a sentence tying it to the lesson's running question or to what
  the previous section established — never with a cold definition. Where
  the material breaks the reader's natural expectation, the seam SAYS so —
  states the expectation, then breaks it ("from X one would expect Z; the
  record shows the opposite") — in the dry register; itinerary seams are
  for genuinely neutral hand-offs only, and no reversal is manufactured
  where the material contains none. (c) The
  lesson closes by naming what is now established and what the next lesson
  takes up, stated as fact. (d) Clarifying L3: stating what comes next is
  required; manufacturing suspense ("you'll soon see…") stays banned.
  (e) Sections argue, not inventory: within a section, paragraphs run
  claim → evidence → bearing on the lesson's question, and every section
  ends with its bearing visible in the body itself. The test: cover the
  section's seam sentence and its last sentence — if the body no longer
  shows what the section contributes to the argument, the section is an
  inventory and gets re-argued. Material that bears on nothing gets cut,
  however good the source it came from.
- **L11 — First exposure is the contract.** The audience field defines a
  reader with no prior coursework; every first mention is written for that
  reader. (a) Places: anchored at first mention — a locator figure nearby,
  or a relative clause ("Madeira, 600 km off the Moroccan coast"). (b)
  Events: date plus a half-sentence of what-happened at first mention;
  never a bare name-drop ("the strikes at Potosí (1545)" needs "a mountain
  of silver ore in the high Andes"). (c) New named terms: defined at first
  use (L9), and no more than about three introduced per section — a
  paragraph that introduces three foreign institutions at once is three
  paragraphs. (d) Cross-lesson recall: anything established in an earlier
  lesson is re-anchored with a <Ref> plus a clause of reminder, never
  assumed remembered. The test: every proper noun either carries its anchor
  in the sentence, was anchored earlier in the lesson, or is Ref'd to the
  lesson that anchored it.
- **L12 — Evidence budget.** Evidence is pulled by the argument, never
  pushed by the source (selection runs argument → evidence; the research
  brief is a quarry, not a coverage checklist). (a) Inclusion test: a
  number, name, or detail enters body prose only if some claim fails
  without it — if the reader must compare, estimate, calibrate, or weigh
  evidence with it. Everything else passes the counterfactual deletion
  test (would removing it impair an objective, an inference, or a later
  exercise? no → cut it or move it to a labeled Aside) — interesting-but-
  irrelevant detail measurably harms learning. (b) Every number that stays
  carries its frame in the same sentence — unit, denominator, comparison,
  or consequence: "about 400 colonists killed" is unevaluable; "one
  colonist in six killed, the colony annihilated" is not. Round to the
  precision the claim supports; exact values live in tables and source
  notes. (c) Each lesson has two or three KEEPER numbers — what the reader
  should leave with — privileged in KeyFacts and figures; other quantities
  default to order-of-magnitude words. Relations before values: "the size
  of contemporary London" before — or instead of — "10–20,000". (d) Events
  involving people are scenes or judgments, never data rows; date precision
  follows function (decade by default, the exact day only where contingency
  is the point). (e) Dense numeric series live in figures, tables, and
  asides — charts are never rationed by this rule; prose states what they
  mean. Domain sharpening: docs/playbook-history.md (numbers-in-history),
  docs/playbook-math.md (notation ledger).
- **L13 — Refutation, only where the misconception is real.** Where the
  material meets a documented, prevalent misconception, the lesson refutes
  it explicitly (schema in playbook-core: correct claim → the misconception
  stated once → rejection → causal explanation of why it fails →
  replacement model → discriminating example → delayed retrieval); explicit
  refutation beats silently presenting the correct account. Where no real
  misconception exists, there is no slot — an invented "some believe…"
  strawman is an L9 violation.
- **L14 — Register modulation by layout.** Importance is marked by a shift
  of device, never by intensifiers: the visual grammar is stable (one
  container style per role — definition, claim, example, warning, exercise,
  optional aside; never the same container for essential and optional
  material), and gravity is signaled by withdrawing apparatus — shorter
  sentences, no asides, no folds — not by adjectives.

## Exercise rules (E)

- **E1 — Exercises close the lesson.** An `## Exercises` section with 4–8
  numbered `<Exercise>` blocks, each containing a collapsible `<Solution>` —
  textbook style, no interactive grading. Retrieval practice happens by
  solving, not by clicking.
- **E2 — Production in the discipline's method.** Most exercises require
  producing something, and what counts as production is the DISCIPLINE'S
  method, per the domain overlay: in mathematics — computation, strategy
  choice, proof steps, error diagnosis (playbook-math exercise mix); in
  history — sourcing, corroboration, causal ranking, claim–evidence–
  reasoning argument (playbook-history exercise mix). Arithmetic
  transplanted into a non-quantitative discipline (plug-constant estimates
  that test nothing) is a defect, not rigor. Recognition questions are the
  exception, not the rule.
- **E3 — Spaced, mixed review.** From a course's third lesson on, at least
  one exercise requires a concept from an earlier lesson. Every core idea
  gets ≥3 encounters across the course (its own lesson, 1–2 lessons later,
  near the module end), later encounters as retrieval-plus-application.
  From mid-course on, exercise sets mix confusable types without naming
  the method — the first question is "which kind of problem is this?".
- **E4 — Complete solutions.** Every solution shows the full path to the
  answer — the same standard as worked examples. A solution that says "left
  to the reader" is a missing solution.
- **E5 — No trick questions.** Difficulty comes from the material, not from
  ambiguity or gotchas.

## Demo rules (D)

- **D1 — Objective or nothing.** A demo exists only if the concept is dynamic
  or multi-parameter and the demo makes *that* visible. If a static figure
  teaches it, use a figure. ("Toy that teaches nothing" is the failure mode.)
- **D2 — Instant feedback.** Manipulation → visible response in <200ms, all
  client-side. No network calls.
- **D3 — Alive on arrival.** The initial state already shows the interesting
  behavior — never a blank or degenerate start. Named presets ("fair coin",
  "high noise") act as narrative anchors the prose can reference.
- **D4 — Guided, then free.** The surrounding prose gives a concrete task
  ("make the entropy hit zero") before inviting exploration. Sandbox-style
  open demos only as a lesson/module culmination, never as the opening.
- **D5 — Self-contained.** One client component, ≤~200 LOC, no new
  dependencies, keyboard- and touch-usable, sane on a phone.

## Evidence (why these rules)

- **Retrieval practice / testing effect** — recalling beats re-reading; strong
  meta-analytic support incl. transfer (Adesope et al. 2017, 217 studies);
  solving exercises beats re-reading → E1, E2.
- **Segmenting principle** — identical content in learner-paced segments beats
  continuous presentation (Mayer & Clark) → L2.
- **Spacing & interleaving** — distributed, mixed practice beats massed
  (Bjork's "desirable difficulties"); spaced retrieval improved outcomes in a
  26k-participant RCT → E3, C5.
- **Worked-example effect** — g≈0.48 in mathematics meta-analysis; correct
  examples alone beat example+self-explanation prompts → L7.
- **Generation effect** — self-produced answers are remembered better than
  read ones → L7, E2.
- **Multimedia/dual-coding principles** — words+pictures beat words, when
  co-located and non-redundant; decorative material hurts (coherence
  principle) → L6.
- **MOOC dropout research** — dropout peaks in the first sessions; redesigning
  content for approachability measurably reduced dropout where email nudges
  did nothing → C2, C3.
- **Gamification studies** — badges/leaderboards raise motivation, not
  learning; this project dropped interactive grading entirely in favor of
  textbook exercises with full solutions → E1, E4.
- **Explorable explanations practice** (Victor, Case, distill.pub) — tight
  feedback loops, prediction-before-reveal, sandbox-as-culmination → D1–D5.
- **Seductive-details effect** — interesting-but-irrelevant details harm
  retention (d≈.30) and transfer (d≈.48) (Rey meta-analysis; later
  syntheses concur) → L12a deletion test.
- **Refutation texts** — explicitly stating-and-refuting a genuine
  misconception beats plain correct exposition, g=.41 over 44 comparisons;
  familiarity "backfire" largely fails to replicate → L13.
- **Interleaving** — g=.42 overall; d=.83 in a preregistered mathematics
  cluster RCT (Rohrer); benefit is discrimination between confusable
  types → E3.
- **Self-explanation** — g=.55 when prompts target a specific inference at
  a decision point; generic "explain" prompts underperform → E2, playbooks.
- **Narrative vs exposition** — controlled science-content comparisons show
  only g=.16 for narrative, and documented person-centered accounts beat
  fictional stories → L9's ban on invented scenes stands.
- **Two-corpus convergence** — the reference-course dissections (Voita
  2026; CrashCourse US History, 52 episodes, 2026) independently converge
  on the invariants in playbook-core (format contract, claim-units,
  flaw-first progression, no unbound tokens) → L10–L14 framing.
