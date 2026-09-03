# The design document — research brief

Lesson: `the-design-document` (module: production-ml, core, planned). MODULE-FINAL APPLICATION LESSON (L16).
Goal: Produce a design document for a concrete ML system — problem definition, metrics, risks, baselines — and review one against a checklist.

## Sources
- Babushkin & Kravchenko — the book's central artifact: Ch.4 (design-doc myths, goals/antigoals, structure: Problem Definition → Origin → Relevance/reasons → Previous work → Other issues and risks; §4.4 a full worked review; §4.5 living document), Ch.5 §5.3 (adding losses/metrics for Supermegaretail), Ch.6 §6.7 / Ch.7 §7.5 / Ch.8 §8.6 (dataset, validation, baselines sections of the same doc). The Supermegaretail running case: retail demand forecasting, the ~$800M/year delivered-vs-sold gap (Ch.4 §4.3).
- Babushkin Ch.2 §2.3: the Double Bayesian Universal Contextual Bandits pricing story — legal risk (price discrimination) + a 6-hour repricing cadence discovered AFTER the elegant design; the lesson's risk exhibit.
- Rules of ML Rule #2 (metrics before ML) — the doc is where that rule is enforced.
- Burkov Ch.2 (impact/cost, "the unknowns", nonlinear progress) for the estimation section; Ch.9 §9.3 ("three cannots") for honest-limitations language.
- DP28 (Heuristic Benchmark) — the baseline section's cookbook, carried from problem-framing-and-baselines.

## Key points
1. APPLICATION SPEC. Artifact: a complete, reviewable design document for Supermegaretail's demand forecasting, assembled section by section using the module's three lessons. Module results used: lifecycle + debt awareness (M1 L1) shape the risks section; metrics chain (L2) fills metrics/losses (WAPE + bias + the business gap); framing + baseline ladder (L3) fill the task and baseline sections. Departure from the idealisation: the doc is written before the data is seen — every section carries an uncertainty note, and §4.5's point stands: real docs are living and get corrected by contact with production (the bandit-pricing story is the proof).
2. The four myths debunked briefly (only for big companies / needs a template / must lead to a deployed system / write-once) — one paragraph, then the structure.
3. The document skeleton, section by section, each with (a) what question it answers, (b) the Supermegaretail content, (c) the commonest review comment. Sections: problem definition & origin; metrics & losses (offline + online + business); data; validation schema (forward-Ref data-leakage-and-splitting); baselines; risks, limitations, antigoals.
4. Antigoals as a named device: what the system deliberately will not do — the cheapest scope-control tool.
5. Reviewing a doc (§4.4): the reviewer's checklist rendered as a short table; review is adversarial reading — find the unstated assumption.
6. Risks worked example: the pricing-bandit story in full — an elegant system redesigned after legal (per-customer price discrimination) and infrastructural (6h repricing cadence) constraints surfaced; moral: constraints are requirements that were not written down.

## Set pieces & gems
- The $800M/year problem statement — the number that justifies the whole project; show how the doc derives a target metric improvement from it.
- The bandit-pricing postmortem (Babushkin Ch.2 §2.3) — the risk-section centerpiece.
- A boxed "review comments" panel: 4-5 realistic reviewer comments on the draft doc (from §4.4's worked review), each tied to a module concept.
- Burkov's "unknowns" list for the estimation section — what cannot be known before data contact.

## Pitfalls
- This is an application lesson, not a template dump: every doc section must be exercised on the running case, not described in the abstract.
- Do not fill validation/dataset sections with M3 material — name them, state one sentence of what will go there, and forward-Ref; the doc is revisited implicitly by later modules.
- Avoid inventing Supermegaretail numbers beyond the source's; where the book is vague, say "estimate at review time".
- The design doc is not an interview artifact here — keep the register operational (a document teammates review), not performative.

## FIGURE PLAN
- draw: The document skeleton as a one-page annotated outline — each section with its question in the margin (single Figure; this is the lesson's key image). Original composition from Babushkin Ch.4.
- draw: Metrics section blow-up: the metrics chain from requirements-and-metrics instantiated for demand forecasting (WAPE/bias → forecast-vs-actual gap → $ recovered), three linked boxes with real numbers. Original.
- draw: FigureSequence (3 frames): the pricing-bandit design before → the two discovered constraints stamped on it → the redesigned (simpler) system; one element changes per frame. From Babushkin's story (no source figure — ours).
- draw: Antigoals panel: goals column vs antigoals column for Supermegaretail, with one wrong-goal example crossed out. Original.
- draw: Review loop: author → reviewer comments → revision → living doc, drawn as a small cycle with "production contact" feeding back in. Inspired by Babushkin §4.4-4.5.

## EXERCISE PLAN
1. Warm-up: match eight one-line statements to the doc section each belongs in (metric, risk, antigoal, baseline, …).
2. Production: write the problem-definition and metrics sections (≤ half a page) for the food-delivery ETA task framed in the previous lesson's exercises; must include one business number, one offline metric, one online proxy.
3. Claim to refute: "the design doc is done when the model ships." Use §4.5 + the bandit story to name what changes post-contact and which sections absorb it.
4. Adversarial review: a provided flawed mini-doc (metric = accuracy on imbalanced demand bins, validation = random split, no antigoals) — write three review comments, each naming the module concept violated.
5. Boundary probe: for which projects is a design doc overhead with no return? Construct the degenerate case (one-off analysis, no deployment, single stakeholder) and check it against the four myths — which myth does this case actually validate, and why doesn't it generalize?
6. FORWARD (E7): the Supermegaretail doc's validation section is left as one sentence: "time-based split, details TBD." Write the two risks you'd flag in review if it stayed that vague. Solution: both risks are leakage mechanisms, named and fixed in → Ref data-leakage-and-splitting.

## ARC
- Inherits: framing, metrics chain, and the baseline ladder — the module's three tools, so far used separately.
- Contributes: the module's application — the tools assembled into the one artifact that exists before any code: a reviewable design document, exercised end-to-end on a real-scale case.
- Hands off: the doc's data and validation sections are stubs; filling them honestly is modules 2–3's work — first the substrate (storage/streams), then the manufacturing of the data itself.
- Spine step: "A trained model is the small part…" (step 1, The model is the easy part) — closes the step.
