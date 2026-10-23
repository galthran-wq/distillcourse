# Pedagogy — the constitution

Every piece of content in this project is generated under these rules. They are
not style preferences; each one is backed by learning-science evidence
(summarized at the bottom). Skills MUST treat the numbered rules as checkable
requirements — `apps/frontend/lib/content/lint.ts` enforces the mechanical ones, `/course-qa`
audits the judgment ones. The mechanics behind the rules live in the playbook
stack: `docs/playbook-core.md` (universal invariants), `docs/voita-playbook.md`
(exposition layer), and the domain overlays `docs/playbook-math.md` /
`docs/playbook-history.md` — authors read the core plus their course's overlay.

**The learner model:** a busy, smart engineer who has started and abandoned
this topic before. They will quit at the first boring paragraph. Assume zero
external motivation: the lesson itself must generate the reason to continue.
Material everywhere else is optimized for completeness; ours is optimized for
being finished.

**The first metric is clarity.** A lesson succeeds when a reader who knows
the prerequisites — and nothing else — can follow every step of it without
help. Every other rule below serves that one; where a rule and clarity
collide, clarity wins and the rule is the one that gets fixed. The failure
this guards against has a name: the **recap** — prose that names the
results in the order a knowledgeable reader would recall them, readable
only by someone who already knows the material.

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

- **L0 — Teach a newcomer, problem first.** The reader is seeing this
  material for the first time. (a) **Problem before answer.** Every lesson,
  and every `##` section, starts from a problem the reader can state in
  their own words — a concrete situation with its constraint ("the bank has
  two seconds to approve a payment and staff to check a hundred cards a
  day out of four hundred thousand payments") — and only then gives the
  answer. A section that opens with its conclusion is a recap. (b)
  **Derive, don't list.** A design, a procedure, a metric or a convention is
  derived from the constraints that force it: what must be achieved, what
  stands in the way, why this answer and not the obvious alternative, what
  breaks if it is done otherwise. "The system has five layers: …" is a
  list; showing that the authorization deadline, the cost of a wrongly
  declined purchase and the size of the investigation team force a fast
  rule stage before authorization and a slow model after it is an
  explanation. Every "it is done this way" carries its "because". (c)
  **One step at a time.** No sentence relies on a term, symbol or fact the
  reader has not yet been given; a sentence that packs a whole argument
  into one clause ("a score produced by the fourth of five layers, acted on
  by…") is unpacked into the steps it compresses. (d) **The newcomer
  test** — the check QA runs first and blocks on: read the lesson as
  someone who knows exactly the course prerequisites and every earlier
  lesson of the course, and nothing else, and judge how easily they would
  master what it presents. List every point where that reader is lost: a
  term used before it is explained, a conclusion stated before its
  problem, an arrangement given without its reason, a leap between two
  sentences. Each one is a required fix. (e) **No repetition.** The same
  reader already has the earlier lessons: what one of them explained is
  recalled with a `<Ref>` and a clause of reminder (L11d), never explained
  again — a re-taught passage is a required fix just as a missing step
  is. What every earlier lesson actually explained is kept in the course's
  ledger, `research/taught/<lesson>.md`, which the writer of each lesson
  updates and every later writer and reviewer reads.
- **L1 — One objective.** Exactly one `goal` per lesson, starting with a Bloom
  verb ("Compute…", "Explain…", "Construct…"). If a draft teaches two things,
  split it.
- **L2 — Substantial chapters, free structure.** A lesson is a textbook
  chapter: as long as the material warrants (est_minutes is guidance, 5–45),
  structured by `##` sections however the content demands. A typical chapter
  runs 1,500–3,000 words across 3–5 sections with several worked examples —
  if it reads in under ~10 minutes it is almost certainly too thin. Depth
  beats brevity; cutting scope is the syllabus's job, not the chapter's.
  Length is a guideline, clarity the metric (L0): a chapter may run an hour
  or an hour and a half when every part of it is needed to make the
  material followable, and a short chapter that the reader fully follows
  beats a long one they skim.
  `key_ideas` in course.yaml are the author's plan, not a mandated section
  list. The validator never dictates prose shape.
  (a) **Target depth.** A core lesson aims at 30–40 minutes of reading where
  the material warrants it — derivations carried through, worked examples
  computed, boundary cases examined, not a summary of results. A 15-minute
  chapter is a signal to deepen, never a reason to pad with restatement.
  Length beyond the target is justified by what it explains, never by what
  the sources contain. When a chapter carries two problems that each need
  their full treatment, it is two lessons: the writer reports the split, the
  syllabus makes it.
  (b) **Starred sections.** Material that is genuinely off the main line —
  a sharper proof, a tangent, a historical detour — becomes a `## ★`-prefixed
  section inside the lesson. The core path must read correctly when every
  starred section is skipped; nothing after them may depend on them.
- **L3 — The problem first.** The lesson opens with the `opening` from
  course.yaml verbatim: the problem the lesson solves, stated in plain words
  for the newcomer (L0) — a concrete situation, what has to be decided or
  computed, and what makes it hard. It uses no term the lesson has yet to
  define and gives away no conclusion: "a fraud score is produced by the
  fourth of five layers…" is the lesson's answer compressed into its first
  line, not its problem. A direct question that states the task ("which
  hundred of the day's four hundred thousand payments should the team
  check?") is allowed; teasers, suspense and "by the end you'll love this"
  are not.
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
- **L8a — Sources live in References, nowhere else.** The body of a
  lesson — prose, callouts, environment titles, captions, exercises and
  solutions — names no source: no authors ("Dal Pozzolo et al. show…"), no
  books ("the handbook's simulator", "Cover & Thomas 2.6.4"), no papers
  ("what the APATE paper calls…"), no "the sources give δ from a week to a
  month". A reader meeting the material for the first time gains nothing
  from a name they do not know; they lose the thread. State the fact, the
  number, the method directly, as the course's own — and list where the
  ideas come from in `<References>`, with chapter-level pointers. An
  exercise built on a source's figures states the figures ("a day of about
  400,000 payments, 1,000 of them fraud, on 300 cards"), never their
  origin. Two things are not citations and stay: (a) a primary text that is
  itself the material, quoted in a `<Quote>` (Nietzsche's sentence, Las
  Casas's tract) — the component carries its attribution; (b) a named
  object the lesson studies as such — a dataset, a law, a standard, an
  algorithm known by its inventor's name (Page–Hinkley, the Kraft
  inequality), a public institution or system the material is about —
  named as the thing, never as an authority ("X reports", "according to
  Y"). `npm run validate` warns (rule `source-in-prose`) on every canon
  author's surname or citation marker it finds in the body; QA treats each
  warning as a required fix.
- **L9 — Plain, direct register; no slop.** Write the way a good teacher
  explains to a capable colleague: plain sentences, concrete cases,
  connected reasoning. The register may be warm and lively — a concrete
  case worked in front of the reader, a sentence that admits the obvious
  approach is tempting before showing where it breaks, "you" addressing the
  reader where it makes the explanation easier to follow. What it never
  carries is **slop**: words that hold no information. Slop is filler and
  throat-clearing ("it is worth noting that", "in this section we will"),
  hype and intensifiers ("crucially", "powerful", "elegant", "almost
  embarrassingly simple"), empty transitions that only announce, summaries
  of what was just said, idiom in place of mechanism ("does the heavy
  lifting"), invented personas ("a friend says…", "imagine Alice"),
  exclamations, rhetorical questions that answer themselves for effect,
  and padding to look thorough. A question that states the problem a
  section solves is not slop. Every sentence either gives the reader a
  fact, a step of an explanation, or the connection between two of them —
  or gets cut. Liveliness never buys compression: the steps of an
  explanation (L0) are never cut for pace. Define jargon at the point of
  first use or don't use it. Italics only for standard emphasis of a
  single term, sparingly.
  (a) **No narration of the obvious.** Naming the notation you are already
  writing ("in expectation notation, H(X) = E[…]"), announcing a figure the
  reader can see ("the full curve is recreated below"), or labelling a step
  you are about to take ("Jensen's inequality does the work here") adds
  words and no information. State the thing; the reader sees the rest.
  (b) **No idiom-for-flavour.** "Does the work", "the magic happens",
  "under the hood" — replace with what actually happens ("Jensen's
  inequality gives the bound because log is concave").
- **L10 — Throughline.** A lesson is one step in the course, and the
  reader feels the connection through the material, not through talk about
  the course. (a) After the opening, the problem is developed — why it
  matters, what the obvious approach is and where it fails. Where the
  problem grows out of an earlier lesson, one plain sentence with a `<Ref>`
  says so. The lesson never talks about itself or the course: no "this
  lesson is the first move of the course", no "this lesson fixes the
  diagram every later lesson annotates", no roadmap of what it will
  establish. The course `spine` in course.yaml orders the problems; it is
  never quoted to the reader. (b) Sections chain: every `##`
  opens with a sentence tying it to the lesson's running question or to what
  the previous section established — never with a cold definition. Where
  the material breaks the reader's natural expectation, the seam SAYS so —
  states the expectation, then breaks it ("from X one would expect Z; the
  record shows the opposite") — in the dry register; itinerary seams are
  for genuinely neutral hand-offs only, and no reversal is manufactured
  where the material contains none. (c) The
  lesson closes by saying, in plain words, what the reader can now do or
  explain, and which problem stays open for the next lesson. (d) Stating
  what comes next is required; manufacturing suspense ("you'll soon see…")
  stays banned.
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
- **L15 — A callout carries load the prose does not.** `<KeyFact>` is for
  what the reader would otherwise leave without: a synthesis across
  sections, a boundary the result silently assumes, a consequence that
  arrives later in the course. Restating the theorem just proved — "entropy
  is maximal exactly when you know least: only the uniform distribution
  attains log₂n" one paragraph after proving it — is a tautology in a box:
  cut it, or make it earn its place by adding the condition, the
  counterexample, or the forward consequence. The test: delete the callout;
  if nothing is lost, it was never a fact worth boxing. Same for `<Remark>`
  and `<Aside>` — a fold that repeats the body is noise the reader has to
  open to discover is empty.
- **L16 — Application closes a module.** Every module ends by cashing its
  results out on something real: a deployed system read against the theory
  (JPEG's quantisation tables, zstd's entropy stage, a codec's rate
  control), a paper's central result reproduced or checked, or a short
  computational study the reader can run. The section states which of the
  module's results the artifact uses and where the artifact departs from
  the idealisation. A list of further reading is not an application.

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
- **E6 — Every exercise set earns its difficulty.** Plugging numbers into a
  formula the lesson just demonstrated tests transcription, not
  understanding; at most one such warm-up per set, and only where the
  computation itself is unfamiliar. The rest must make the reader decide,
  derive, or judge. Each set carries **at least two** of:
  (a) a **boundary probe** — what happens at the degenerate case, and why
  the theorem's hypothesis is exactly what rules it out;
  (b) a **claim to refute** — a plausible false statement the reader must
  break, naming the step that fails;
  (c) a **derivation the lesson did not do** — a corollary, a special case,
  a second proof, an inequality run backwards;
  (d) a **research-shaped task** — reproduce a small published result,
  estimate a quantity from real data, design the experiment that would
  distinguish two explanations.
- **E7 — Exercises reach forward.** At least one exercise per lesson lands
  the reader on the doorstep of a later result: they compute the thing the
  next lesson will name, hit the wall the next mechanism removes, or notice
  the pattern the coming theorem explains. The solution says so in one
  sentence, with a `<Ref>`. This is what makes an exercise feel like a
  discovery instead of homework.

## Demo rules (D)

- **D1 — Objective or nothing.** A demo exists only if the concept is dynamic
  or multi-parameter and the demo makes *that* visible. If a static figure
  teaches it, use a figure. ("Toy that teaches nothing" is the failure mode.)
  Sliders bolted onto a diagram the lesson already shows are the commonest
  form of this failure: if the demo's only content is that a curve moves,
  it is a figure with extra steps. A demo earns its place when the reader
  can DO something — hit a stated target, falsify a claim, find the
  threshold where behaviour changes, or lose against a bound they cannot
  beat — and the prose asks them to do it before it explains the result.
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
