# ML systems versus ML models — research brief

Lesson: `ml-in-production` (module: production-ml, core, planned). Course opener — C3 applies: easiest and most polished lesson in the course, ends in a felt win (the reader can classify debt in a system description).
Goal: Explain why a production ML system is mostly not the model, using the hidden-technical-debt taxonomy and the research-versus-production contrast.

## Sources
- Sculley et al. 2015 (research/texts, full paper): §1 the debt metaphor; §2 entanglement/CACE, correction cascades, undeclared consumers; §3 data dependencies; §4 direct vs hidden feedback loops; §5 glue code, pipeline jungles, dead codepaths (Knight Capital $465M/45min); §6 configuration debt; Figure 1 p.4 — the small-black-box diagram; §9 the five self-audit questions.
- Designing ML Systems Ch.1 (pp.2-23): Table 1-1 research vs production (stakeholders, throughput vs latency, static vs shifting data, fairness, interpretability); when to use ML (5-part definition + 4 "shines" conditions); ML vs traditional software (code+data+artifacts).
- CS329S Lecture 1: the restaurant-app stakeholder-conflict scenario; the 12-step iterative ads-ranking walkthrough; the mind-vs-data quotes (Pearl "data is profoundly dumb" vs Sutton's Bitter Lesson vs Norvig).
- ML Production Systems Ch.1 (pp.1-8): the "5% of the code" claim; the 6-step pipeline cycle; Amazon resume-screener bias as the business case for pipelines.
- Burkov Ch.2 §2.5: "74–87% of ML projects fail or don't reach production" — the hook stat; why they fail (talent, silos, infeasible scope, business misalignment).
- Rules of ML, Rule #1: "a heuristic will get you 50% of the way there" — planted here, developed in problem-framing-and-baselines.

## Key points
1. Open with the two numbers that define the field: ML code ≈ 5% of a production system (Crowe p.2; Sculley §5's 5%/95% claim), and 60 of 96 failures in a Google ML pipeline were not ML failures at all (Papasian & Underwood via DMLS Ch.8). The lesson's claim: production ML is a systems discipline.
2. Research vs production as a worked contrast table (DMLS Table 1-1): one model, one leaderboard, static data, fast training vs many stakeholders, shifting data, fast inference, fairness/interpretability stakes. The restaurant-app scenario makes "different stakeholders, different objectives" concrete.
3. The debt taxonomy — the course's shared vocabulary, each item one paragraph + one concrete scenario: CACE (changing feature x1's distribution reweights everything), correction cascades (m'_a on m_a → improvement deadlock), undeclared consumers, data dependencies (the product-numbering migration story), feedback loops (two stock-prediction firms coupling through the market), pipeline jungles, glue code, dead experimental codepaths (Knight Capital), configuration debt (config lines > code lines).
4. When to use ML at all: repetitive, cheap-mistake, at-scale, changing-patterns conditions; when NOT (one-off, no data, cheap heuristic suffices, wrong-prediction catastrophic). Rule #1 planted as a forward hook.
5. The lifecycle loop (DMLS Fig 2-2 + the 12-step ads example): scoping → data → model → deploy → monitor → business analysis, with backward arrows — the course's map; each later module is one arc of the loop.

## Set pieces & gems
- Sculley Figure 1 — sourced image (hiddentechni-fig1-ml-code-box); THE diagram of the field, kept as the primary artifact, then redrawn in house style as the course's own map with module numbers overlaid.
- Knight Capital: $465M lost in 45 minutes to a dead experimental codepath — dated, cited (SEC 2013), memorable.
- The five §9 self-audit questions ("can you measure a change's impact? does improving one model degrade another?") — close the lesson with them as the reader's first checklist.
- 74–87% project-failure range (Burkov §2.5) — opening-paragraph hook stat, framed honestly as estimates.

## Pitfalls
- Do not teach ML basics — the audience contract says logreg/boosting/metrics known. No definitions of supervised learning.
- The debt taxonomy is vocabulary, not a checklist to memorize; tie every term to a scenario or it reads as a glossary (L10e: sections argue).
- Mind-vs-data debate: one short starred section at most; it's framing color, not course machinery.
- Don't over-promise "we'll fix all of this" — each debt item should name the module that addresses it (forward Refs), which is the throughline device.

## FIGURE PLAN
- source: hiddentechni-fig1-ml-code-box — the original Sculley Figure 1, cropped from the page render (save as `sculley-fig1`); reader must see the tiny ML-code box against the nine big infrastructure boxes; centered, near the opening.
- draw: The course map — the same nine-box layout redrawn in house style with each infrastructure box tagged by the module of this course that covers it (single Figure; the redrawing IS the syllabus). Inspired by Sculley Fig 1 + DMLS Fig 1-1.
- draw: Research-vs-production contrast as a two-column panel (one row per axis: objective, latency/throughput, data, stakes), not a prose table. Inspired by DMLS Table 1-1.
- draw: FigureSequence (4 frames): a correction cascade forming — frame 1 model A for task a; frame 2 a' appears, m'_a stacked on top; frame 3 a'' and m''_a; frame 4 the deadlock annotation (improving m_a now breaks the two above). Inspired by Sculley §2 prose (paper has no figure — our drawing).
- draw: The lifecycle loop with backward arrows, six stages, each labeled with the module that owns it (single Figure). Inspired by DMLS Fig 2-2.
- draw: Hidden feedback loop two-panel: direct (model → own training data) vs hidden (model A → world → model B → world → model A). Inspired by Sculley §4 prose.

## EXERCISE PLAN
1. Warm-up: given a one-paragraph description of a churn-prediction system, list which of the nine Sculley infrastructure components are mentioned and which are silently missing.
2. Claim to refute: "our model is isolated — we only consume features from the warehouse, so upstream changes can't break us." Break it with CACE + unstable data dependencies; name the specific mechanism (a feature's distribution shift reweights everything).
3. Boundary probe: when is ML the WRONG tool? Construct the degenerate case — a static, enumerable input space with a cheap exact rule — and say which of the "when to use ML" conditions fails (this is a lookup table, and a lookup table is better).
4. Diagnosis: classify four short incident vignettes (a stale config, a copied pipeline dropping data, a spam filter training on its own filtered output, an experiment flag left in prod) into the debt taxonomy.
5. Research-shaped: from Sculley §9, apply the five audit questions to a system the reader knows (or the lesson's running example) and write a one-line answer per question.
6. FORWARD (E7): take the ads-ranking 12-step walkthrough and mark, for each step, which number you would watch to decide the step "worked." The solution notes that ordering these numbers — offline metric, online proxy, business metric — is exactly the next lesson's metrics hierarchy → Ref requirements-and-metrics.

## ARC
- Inherits: nothing — course opener; the reader arrives knowing classical ML and never having shipped it.
- Contributes: the claim the whole course argues — production ML is a systems discipline — plus the shared debt vocabulary and the lifecycle map every module hangs off.
- Hands off: "the system is specified by numbers" — requirements and the metrics chain → requirements-and-metrics.
- Spine step: "A trained model is the small part…" (step 1, The model is the easy part).
